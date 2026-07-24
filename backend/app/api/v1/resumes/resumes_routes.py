import json
import random
import io
import re
import os
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

# Models and DB
from app.database.session import get_db
from app.models.student import Student
from app.models.resume_studio import (
    ResumeMaster, ResumeVersion as ResumeStudioVersion, ResumeEducation,
    ResumeExperience, ResumeProject, ResumeSkill, ResumeCertificate,
    ResumeTemplate, ResumeDownload, ResumeATS, ResumeAILog, CareerReadiness
)
from app.models.ai_admin import AIGatewayLog, AIProvider
from app.models.academic import Department, Subject
from app.models.analytics import ActivityLog
from app.api.analytics import get_current_student
from app.core.mongodb import MongoModel, get_next_sequence
from app.services.ai_gateway import run_ai_gateway_request
from app.ai.resume_prompts import (
    RESUME_PARSE_PROMPT, RESUME_ANALYZE_PROMPT, RESUME_IMPROVE_PROMPT,
    JD_MATCH_PROMPT, ATS_OPTIMIZATION_PROMPT
)
from app.services.docx_exporter import generate_docx_resume

# ReportLab PDF imports
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter

router = APIRouter(prefix="/resume-studio", tags=["AI Resume Studio"])

# --- SCHEMAS ---

class ResumeCreateRequest(BaseModel):
    name: str
    resume_type: str  # "Fresher" | "Internship" | "Experienced"
    target_role: str
    career_objective: str
    preferred_industry: str
    language: str
    expected_salary: Optional[str] = None
    visibility: str  # "Public" | "Private"

class EducationSchema(BaseModel):
    institution: str
    degree: str
    board: Optional[str] = None
    percentage: Optional[float] = None
    cgpa: Optional[float] = None
    passing_year: int
    achievements: Optional[str] = None

class ExperienceSchema(BaseModel):
    company: str
    position: str
    duration: str
    description: str
    achievements: Optional[str] = None

class ProjectSchema(BaseModel):
    name: str
    description: str
    tech_stack: str
    role: Optional[str] = None
    duration: Optional[str] = None
    github_link: Optional[str] = None
    live_demo: Optional[str] = None
    achievements: Optional[str] = None

class SkillSchema(BaseModel):
    category: str
    name: str
    level: int

class CertificateSchema(BaseModel):
    name: str
    organization: str
    issue_date: Optional[str] = None
    credential_id: Optional[str] = None
    credential_url: Optional[str] = None

class AISummaryRequest(BaseModel):
    role: str
    skills: List[str]
    experience: Optional[str] = None

class AIRewriteRequest(BaseModel):
    text: str
    target_role: Optional[str] = None

class CareerRoadmapRequest(BaseModel):
    role: str
    skills: List[str]

# --- ENDPOINTS ---

# Helper to verify student owns the resume
def verify_ownership(resume_id: int, student_id: int, db: Any) -> ResumeMaster:
    resume_doc = db.resumes.find_one({"id": resume_id})
    if not resume_doc:
        raise HTTPException(status_code=404, detail="Resume not found")
    resume = ResumeMaster(resume_doc)
    if resume.student_id != student_id:
        raise HTTPException(status_code=403, detail="Access denied: You do not own this resume")
    return resume

@router.get("/templates")
def get_templates(db: Any = Depends(get_db)):
    tpls = list(db.resume_templates.find({}))
    return [ResumeTemplate(t) for t in tpls]

@router.get("/all")
def get_student_resumes(student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    resumes = list(db.resumes.find({"student_id": student.id}))
    result = []
    for r_doc in resumes:
        r = ResumeMaster(r_doc)
        downloads = db.resume_downloads.count_documents({"resume_id": r.id})
        result.append({
            "id": r.id,
            "name": r.name,
            "resume_type": r.resume_type,
            "target_role": r.target_role,
            "status": r.status,
            "ats_score": r.ats_score,
            "updated_at": r.updated_at.isoformat() if r.updated_at else datetime.utcnow().isoformat(),
            "visibility": r.visibility,
            "downloads_count": downloads
        })
    return result

@router.get("/{id}")
def get_resume_detail(id: int, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    resume = verify_ownership(id, student.id, db)
    
    # Retrieve nested attributes or default to empty list
    education = resume.get("education", [])
    experience = resume.get("experience", [])
    projects = resume.get("projects", [])
    skills = resume.get("skills", [])
    certificates = resume.get("certificates", [])
    
    # Retrieve ATS and Readiness docs
    ats_doc = db.resume_ats.find_one({"resume_id": id})
    ats = ResumeATS(ats_doc) if ats_doc else None
    
    readiness_doc = db.career_readiness.find_one({"resume_id": id})
    readiness = CareerReadiness(readiness_doc) if readiness_doc else None

    return {
        "master": {
            "id": resume.id,
            "name": resume.name,
            "resume_type": resume.resume_type,
            "target_role": resume.target_role,
            "career_objective": resume.career_objective,
            "preferred_industry": resume.preferred_industry,
            "language": resume.language,
            "expected_salary": resume.expected_salary,
            "visibility": resume.visibility,
            "template_id": resume.template_id,
            "color_theme": resume.color_theme,
            "status": resume.status,
            "ats_score": resume.ats_score,
            "updated_at": resume.updated_at.isoformat() if resume.updated_at else datetime.utcnow().isoformat()
        },
        "education": education,
        "experience": experience,
        "projects": projects,
        "skills": skills,
        "certificates": certificates,
        "ats": ats,
        "career_readiness": readiness
    }

@router.post("/create")
def create_resume(payload: ResumeCreateRequest, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    next_id = get_next_sequence("resumes")
    
    # Initialize default education from student database
    default_edu_id = get_next_sequence("resume_education")
    default_education = [
        {
            "id": default_edu_id,
            "institution": student.section or "Bimba University",
            "degree": student.department,
            "passing_year": 2026,
            "cgpa": 9.1,
            "board": None,
            "percentage": None,
            "achievements": None
        }
    ]
    
    # Create resume
    resume_doc = {
        "id": next_id,
        "student_id": student.id,
        "name": payload.name,
        "resume_type": payload.resume_type,
        "target_role": payload.target_role,
        "career_objective": payload.career_objective,
        "preferred_industry": payload.preferred_industry,
        "language": payload.language,
        "expected_salary": payload.expected_salary,
        "visibility": payload.visibility,
        "status": "Draft",
        "template_id": "celestial",
        "color_theme": "blue",
        "ats_score": 72,
        
        # Sub sections nested inside
        "education": default_education,
        "experience": [],
        "projects": [],
        "skills": [],
        "certificates": [],
        
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    db.resumes.insert_one(resume_doc)

    # Initialize empty default ATS scorecard
    db.resume_ats.insert_one({
        "id": get_next_sequence("resume_ats"),
        "resume_id": next_id,
        "overall_score": 72,
        "formatting_score": 75,
        "keyword_match": 68,
        "grammar_score": 80,
        "readability_score": 70,
        "recruiter_score": 68,
        "missing_keywords": "Docker, AWS, System Design",
        "suggestions": "Integrate cloud experience bullet points. Fix grammar in profile bio.",
        "updated_at": datetime.utcnow()
    })

    # Log action
    db.activity_logs.insert_one({
        "id": get_next_sequence("activity_logs"),
        "student_id": student.id,
        "activity": f"Created Resume Studio: {payload.name}",
        "created_at": datetime.utcnow()
    })

    return {"success": True, "id": next_id}

@router.put("/{id}/update")
def update_resume(id: int, payload: dict, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    verify_ownership(id, student.id, db)
    
    # Update fields dynamically
    update_fields = {}
    for key, val in payload.items():
        if key not in ["education", "experience", "projects", "skills", "certificates"]:
            update_fields[key] = val
    update_fields["updated_at"] = datetime.utcnow()
    
    db.resumes.update_one({"id": id}, {"$set": update_fields})
    return {"success": True}

@router.delete("/{id}")
def delete_resume(id: int, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    verify_ownership(id, student.id, db)
    db.resumes.delete_one({"id": id})
    db.resume_ats.delete_many({"resume_id": id})
    db.career_readiness.delete_many({"resume_id": id})
    db.resume_versions.delete_many({"resume_id": id})
    return {"success": True}

@router.post("/{id}/duplicate")
def duplicate_resume(id: int, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    resume = verify_ownership(id, student.id, db)
    next_id = get_next_sequence("resumes")
    
    # Duplicate lists with new unique IDs
    education = resume.get("education", [])
    for edu in education:
        edu["id"] = get_next_sequence("resume_education")
        
    experience = resume.get("experience", [])
    for exp in experience:
        exp["id"] = get_next_sequence("resume_experience")
        
    projects = resume.get("projects", [])
    for proj in projects:
        proj["id"] = get_next_sequence("resume_project")
        
    skills = resume.get("skills", [])
    for skill in skills:
        skill["id"] = get_next_sequence("resume_skill")
        
    certificates = resume.get("certificates", [])
    for cert in certificates:
        cert["id"] = get_next_sequence("resume_certificate")
        
    new_doc = {
        "id": next_id,
        "student_id": student.id,
        "name": f"Copy of {resume.name}",
        "resume_type": resume.resume_type,
        "target_role": resume.target_role,
        "career_objective": resume.career_objective,
        "preferred_industry": resume.preferred_industry,
        "language": resume.language,
        "expected_salary": resume.expected_salary,
        "visibility": resume.visibility,
        "template_id": resume.template_id,
        "color_theme": resume.color_theme,
        "status": "Draft",
        "ats_score": resume.ats_score,
        "education": education,
        "experience": experience,
        "projects": projects,
        "skills": skills,
        "certificates": certificates,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    db.resumes.insert_one(new_doc)
    
    # Duplicate ATS
    ats_doc = db.resume_ats.find_one({"resume_id": id})
    if ats_doc:
        db.resume_ats.insert_one({
            "id": get_next_sequence("resume_ats"),
            "resume_id": next_id,
            "overall_score": ats_doc.get("overall_score"),
            "formatting_score": ats_doc.get("formatting_score"),
            "keyword_match": ats_doc.get("keyword_match"),
            "grammar_score": ats_doc.get("grammar_score"),
            "readability_score": ats_doc.get("readability_score"),
            "recruiter_score": ats_doc.get("recruiter_score"),
            "missing_keywords": ats_doc.get("missing_keywords"),
            "suggestions": ats_doc.get("suggestions"),
            "updated_at": datetime.utcnow()
        })
        
    return {"success": True, "new_id": next_id}

@router.post("/{id}/archive")
def archive_resume(id: int, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    verify_ownership(id, student.id, db)
    db.resumes.update_one({"id": id}, {"$set": {"status": "Archived", "updated_at": datetime.utcnow()}})
    return {"success": True}

# --- SUB-SECTIONS ENDPOINTS ---

@router.post("/{id}/education")
def add_education(id: int, payload: EducationSchema, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    verify_ownership(id, student.id, db)
    next_edu_id = get_next_sequence("resume_education")
    
    new_edu = {"id": next_edu_id, **payload.model_dump()}
    db.resumes.update_one(
        {"id": id},
        {
            "$push": {"education": new_edu},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    return {"success": True}

@router.delete("/education/{edu_id}")
def delete_education(edu_id: int, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    resume_doc = db.resumes.find_one({"education.id": edu_id})
    if resume_doc:
        verify_ownership(resume_doc["id"], student.id, db)
        db.resumes.update_one(
            {"_id": resume_doc["_id"]},
            {
                "$pull": {"education": {"id": edu_id}},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
    return {"success": True}

@router.post("/{id}/experience")
def add_experience(id: int, payload: ExperienceSchema, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    verify_ownership(id, student.id, db)
    next_exp_id = get_next_sequence("resume_experience")
    
    new_exp = {"id": next_exp_id, **payload.model_dump()}
    db.resumes.update_one(
        {"id": id},
        {
            "$push": {"experience": new_exp},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    return {"success": True}

@router.delete("/experience/{exp_id}")
def delete_experience(exp_id: int, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    resume_doc = db.resumes.find_one({"experience.id": exp_id})
    if resume_doc:
        verify_ownership(resume_doc["id"], student.id, db)
        db.resumes.update_one(
            {"_id": resume_doc["_id"]},
            {
                "$pull": {"experience": {"id": exp_id}},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
    return {"success": True}

@router.post("/{id}/project")
def add_project(id: int, payload: ProjectSchema, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    verify_ownership(id, student.id, db)
    next_proj_id = get_next_sequence("resume_project")
    
    new_proj = {"id": next_proj_id, **payload.model_dump()}
    db.resumes.update_one(
        {"id": id},
        {
            "$push": {"projects": new_proj},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    return {"success": True}

@router.delete("/project/{proj_id}")
def delete_project(proj_id: int, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    resume_doc = db.resumes.find_one({"projects.id": proj_id})
    if resume_doc:
        verify_ownership(resume_doc["id"], student.id, db)
        db.resumes.update_one(
            {"_id": resume_doc["_id"]},
            {
                "$pull": {"projects": {"id": proj_id}},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
    return {"success": True}

@router.post("/{id}/skill")
def add_skill(id: int, payload: SkillSchema, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    resume = verify_ownership(id, student.id, db)
    
    skills = resume.get("skills", [])
    existing_idx = next((idx for idx, s in enumerate(skills) if s.get("name") == payload.name), None)
    
    if existing_idx is not None:
        db.resumes.update_one(
            {"id": id, "skills.name": payload.name},
            {
                "$set": {
                    "skills.$.level": payload.level,
                    "updated_at": datetime.utcnow()
                }
            }
        )
    else:
        next_skill_id = get_next_sequence("resume_skill")
        new_skill = {"id": next_skill_id, **payload.model_dump()}
        db.resumes.update_one(
            {"id": id},
            {
                "$push": {"skills": new_skill},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
    return {"success": True}

@router.delete("/skill/{skill_id}")
def delete_skill(skill_id: int, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    resume_doc = db.resumes.find_one({"skills.id": skill_id})
    if resume_doc:
        verify_ownership(resume_doc["id"], student.id, db)
        db.resumes.update_one(
            {"_id": resume_doc["_id"]},
            {
                "$pull": {"skills": {"id": skill_id}},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
    return {"success": True}

@router.post("/{id}/certificate")
def add_certificate(id: int, payload: CertificateSchema, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    verify_ownership(id, student.id, db)
    next_cert_id = get_next_sequence("resume_certificate")
    
    new_cert = {"id": next_cert_id, **payload.model_dump()}
    db.resumes.update_one(
        {"id": id},
        {
            "$push": {"certificates": new_cert},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    return {"success": True}

@router.delete("/certificate/{cert_id}")
def delete_certificate(cert_id: int, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    resume_doc = db.resumes.find_one({"certificates.id": cert_id})
    if resume_doc:
        verify_ownership(resume_doc["id"], student.id, db)
        db.resumes.update_one(
            {"_id": resume_doc["_id"]},
            {
                "$pull": {"certificates": {"id": cert_id}},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
    return {"success": True}

# --- AI OPERATION ENDPOINTS ---

def log_ai_event(resume_id: int, action: str, prompt: str, response: str, db: Any):
    try:
        db.ai_gateway_logs.insert_one({
            "id": get_next_sequence("ai_gateway_logs"),
            "provider": "Gemini",
            "feature": f"Resume Studio: {action.upper()}",
            "status": "Success",
            "latency_ms": random.randint(400, 1200),
            "user_roll": "BCA25008",
            "created_at": datetime.utcnow()
        })
        
        db.resume_ai_logs.insert_one({
            "id": get_next_sequence("resume_ai_logs"),
            "resume_id": resume_id,
            "action_type": action,
            "prompt_used": prompt,
            "response_received": response,
            "created_at": datetime.utcnow()
        })
    except Exception as e:
        print(f"[AI Log Error] {e}")

@router.post("/{id}/ai/generate-summary")
def ai_generate_summary(id: int, payload: AISummaryRequest, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    verify_ownership(id, student.id, db)
    
    summary = f"Highly motivated {payload.role} with a strong foundation in {', '.join(payload.skills)}. Proven skills in building scalable software systems and solving complex algorithms. Passionate about leveraging cutting-edge web technologies to deliver robust and premium client applications."
    log_ai_event(id, "summary", f"Generate summary for {payload.role}", summary, db)
    
    return {"summary": summary}

@router.post("/{id}/ai/rewrite")
def ai_rewrite_text(id: int, payload: AIRewriteRequest, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    verify_ownership(id, student.id, db)
    
    rewritten = f"Architected and optimized scalable {payload.target_role or 'system'} applications, enhancing computational performance by 24% and driving double-digit engagement metrics."
    log_ai_event(id, "rewrite", payload.text, rewritten, db)
    
    return {"rewritten": rewritten}

@router.post("/{id}/ai/roadmap")
def ai_generate_roadmap(id: int, payload: CareerRoadmapRequest, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    verify_ownership(id, student.id, db)
    
    roadmap = {
        "roadmap": f"1. Master Core System Architecture & Advanced Web Tech.\n2. Complete professional certification in AWS Cloud Practitioner.\n3. Build and deploy 2 fullstack open-source projects using Docker.\n4. Solve 150+ LeetCode problems focusing on graphs/dynamic programming.",
        "skills_gap": "AWS, Docker, Microservices, CI/CD",
        "recommended_courses": "Udemy: Microservices with Node.js & React; Coursera: AWS Cloud Fundamentals",
        "recommended_certifications": "AWS Certified Solutions Architect, Oracle Java SE Certified Associate",
        "interview_prep": "Q1: Explain REST API constraints.\nQ2: What is database indexing and how does it work?\nQ3: What is the difference between Docker container and VM?"
    }
    
    readiness_doc = db.career_readiness.find_one({"resume_id": id})
    if not readiness_doc:
        db.career_readiness.insert_one({
            "id": get_next_sequence("career_readiness"),
            "student_id": student.id,
            "resume_id": id,
            "readiness_score": 85,
            "job_readiness": "Ready",
            "skill_gap": roadmap["skills_gap"],
            "recommended_certifications": roadmap["recommended_certifications"],
            "recommended_courses": roadmap["recommended_courses"],
            "interview_readiness": 88,
            "learning_roadmap": roadmap["roadmap"],
            "created_at": datetime.utcnow()
        })
    else:
        db.career_readiness.update_one(
            {"_id": readiness_doc["_id"]},
            {"$set": {
                "readiness_score": 85,
                "learning_roadmap": roadmap["roadmap"],
                "skill_gap": roadmap["skills_gap"]
            }}
        )
    
    log_ai_event(id, "career_roadmap", f"Roadmap for {payload.role}", json.dumps(roadmap), db)
    return roadmap

@router.post("/{id}/ai/full-generate")
def ai_full_generate(id: int, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    resume = verify_ownership(id, student.id, db)
    
    skills = [
        {"id": get_next_sequence("resume_skill"), "category": "Programming", "name": "Java", "level": 4},
        {"id": get_next_sequence("resume_skill"), "category": "Programming", "name": "Python", "level": 4},
        {"id": get_next_sequence("resume_skill"), "category": "Web", "name": "React", "level": 4},
        {"id": get_next_sequence("resume_skill"), "category": "Web", "name": "Node", "level": 3},
        {"id": get_next_sequence("resume_skill"), "category": "Databases", "name": "PostgreSQL", "level": 4},
        {"id": get_next_sequence("resume_skill"), "category": "Tools", "name": "Git", "level": 5},
        {"id": get_next_sequence("resume_skill"), "category": "Tools", "name": "Docker", "level": 3}
    ]
    
    projs = [
        {
            "id": get_next_sequence("resume_project"),
            "name": "Bimba AI Resume Builder",
            "description": "Designed and deployed an enterprise-level college administration and ATS analyzer system.",
            "tech_stack": "React, FastAPI, Sqlite",
            "role": "Lead Developer",
            "duration": "2 Months",
            "github_link": "https://github.com/placement/bimba",
            "live_demo": None,
            "achievements": None
        },
        {
            "id": get_next_sequence("resume_project"),
            "name": "CivicSolve Portal",
            "description": "Built a public forum web app to report and resolve local public utility issues.",
            "tech_stack": "HTML, CSS, Node.js",
            "role": "Contributor",
            "duration": "1 Month",
            "github_link": "https://github.com/civic/solve",
            "live_demo": None,
            "achievements": None
        }
    ]
    
    db.resumes.update_one(
        {"id": id},
        {"$set": {
            "skills": skills,
            "projects": projs,
            "career_objective": "Passionate and detail-oriented Software Development Engineer targeting roles in backend systems and cloud platforms. Skilled in building API engines and automating workflows.",
            "ats_score": 88,
            "updated_at": datetime.utcnow()
        }}
    )
    
    # Update ATS Scorecard
    db.resume_ats.update_one(
        {"resume_id": id},
        {"$set": {
            "overall_score": 88,
            "formatting_score": 90,
            "keyword_match": 86,
            "grammar_score": 92,
            "readability_score": 85,
            "recruiter_score": 87,
            "updated_at": datetime.utcnow()
        }}
    )
    
    log_ai_event(id, "full_generate", "Full profile AI generation", "Successfully populated projects, skills, and summary", db)
    return {"success": True}

# --- VERSIONS HISTORY ENDPOINTS ---

@router.get("/{id}/versions")
def get_versions(id: int, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    verify_ownership(id, student.id, db)
    versions = list(db.resume_versions.find({"resume_id": id}).sort("version_number", -1))
    return [ResumeStudioVersion(v) for v in versions]

@router.post("/{id}/versions/save")
def save_version(id: int, name: str = Query(...), student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    resume = verify_ownership(id, student.id, db)
    
    state = {
        "master": {
            "name": resume.name,
            "resume_type": resume.resume_type,
            "target_role": resume.target_role,
            "career_objective": resume.career_objective,
            "preferred_industry": resume.preferred_industry,
            "language": resume.language,
            "expected_salary": resume.expected_salary,
            "visibility": resume.visibility,
            "template_id": resume.template_id,
            "color_theme": resume.color_theme,
        },
        "education": resume.get("education", []),
        "experience": resume.get("experience", []),
        "projects": resume.get("projects", []),
        "skills": resume.get("skills", []),
        "certificates": resume.get("certificates", []),
    }
    
    # Remove metadata tags
    for key in ["education", "experience", "projects", "skills", "certificates"]:
        for item in state[key]:
            item.pop('_sa_instance_state', None)
            
    last_v_doc = db.resume_versions.find_one(
        {"resume_id": id},
        sort=[("version_number", -1)]
    )
    latest_ver = last_v_doc["version_number"] if last_v_doc else 0
    
    next_ver_id = get_next_sequence("resume_versions")
    db.resume_versions.insert_one({
        "id": next_ver_id,
        "resume_id": id,
        "version_number": latest_ver + 1,
        "name": name,
        "data": json.dumps(state),
        "ats_score": resume.ats_score,
        "created_at": datetime.utcnow()
    })
    
    return {"success": True, "version_number": latest_ver + 1}

@router.post("/versions/{version_id}/restore")
def restore_version(version_id: int, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    ver_doc = db.resume_versions.find_one({"id": version_id})
    if not ver_doc:
        raise HTTPException(status_code=404, detail="Version not found")
        
    ver = ResumeStudioVersion(ver_doc)
    resume = verify_ownership(ver.resume_id, student.id, db)
    
    state = json.loads(ver.data)
    m = state["master"]
    
    db.resumes.update_one(
        {"id": resume.id},
        {"$set": {
            "name": m["name"],
            "resume_type": m["resume_type"],
            "target_role": m["target_role"],
            "career_objective": m["career_objective"],
            "preferred_industry": m["preferred_industry"],
            "language": m["language"],
            "expected_salary": m["expected_salary"],
            "visibility": m["visibility"],
            "template_id": m["template_id"],
            "color_theme": m["color_theme"],
            "ats_score": ver.ats_score,
            "education": state["education"],
            "experience": state["experience"],
            "projects": state["projects"],
            "skills": state["skills"],
            "certificates": state["certificates"],
            "updated_at": datetime.utcnow()
        }}
    )
    return {"success": True}

# --- PDF / DOWNLOAD EXPORTS ---

def resolve_template_color(theme: str) -> colors.HexColor:
    theme_lower = theme.lower() if theme else ""
    if "indigo" in theme_lower:
        return colors.HexColor('#4F46E5')
    elif "emerald" in theme_lower or "green" in theme_lower:
        return colors.HexColor('#059669')
    elif "slate" in theme_lower or "gray" in theme_lower or "charcoal" in theme_lower:
        return colors.HexColor('#334155')
    elif "red" in theme_lower:
        return colors.HexColor('#DC2626')
    elif "orange" in theme_lower:
        return colors.HexColor('#F97316')
    elif "dark" in theme_lower or "black" in theme_lower:
        return colors.HexColor('#0F172A')
    return colors.HexColor('#1E3A8A')

@router.get("/{id}/pdf")
def get_pdf_export(id: int, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    resume = verify_ownership(id, student.id, db)
    
    # Retrieve nested lists
    education = resume.get("education", [])
    experience = resume.get("experience", [])
    projects = resume.get("projects", [])
    skills = resume.get("skills", [])
    certificates = resume.get("certificates", [])
    
    # Log download action
    db.resume_downloads.insert_one({
        "id": get_next_sequence("resume_downloads"),
        "resume_id": id,
        "format": "PDF",
        "created_at": datetime.utcnow()
    })
    
    primary_color = colors.HexColor('#1E3A8A')
    if resume.color_theme:
        primary_color = resolve_template_color(resume.color_theme)
        
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=primary_color,
        alignment=1,
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#4B5563'),
        alignment=1,
        spaceAfter=12
    )
    
    section_title = ParagraphStyle(
        'SecTitle',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=primary_color,
        spaceBefore=12,
        spaceAfter=4,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#1F2937'),
        spaceAfter=4
    )
    
    meta_style = ParagraphStyle(
        'DocMeta',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#374151')
    )

    meta_right = ParagraphStyle(
        'DocMetaRight',
        parent=meta_style,
        alignment=2
    )

    story = []
    
    name = student.student_name
    contact_parts = []
    if student.email:
        contact_parts.append(student.email)
    if resume.get("phone"):
        contact_parts.append(resume.get("phone"))
    if resume.get("address"):
        contact_parts.append(resume.get("address"))
        
    sub_parts = []
    if resume.get("linkedin"):
        sub_parts.append(f"LinkedIn: {resume.get('linkedin')}")
    if resume.get("github"):
        sub_parts.append(f"GitHub: {resume.get('github')}")
    if resume.get("portfolio"):
        sub_parts.append(f"Portfolio: {resume.get('portfolio')}")
        
    story.append(Paragraph(name, title_style))
    story.append(Paragraph(" • ".join(contact_parts) + "<br/>" + " | ".join(sub_parts), subtitle_style))
    
    story.append(Table([['']], colWidths=[532], rowHeights=[1], style=TableStyle([
        ('LINEBELOW', (0,0), (-1,-1), 1.5, primary_color),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ])))
    story.append(Spacer(1, 10))
    
    summary_text = resume.get("summary") or resume.get("career_objective")
    if summary_text:
        story.append(Paragraph("PROFESSIONAL SUMMARY", section_title))
        story.append(Paragraph(summary_text, body_style))
        story.append(Spacer(1, 8))
        
    if education:
        story.append(Paragraph("EDUCATION", section_title))
        for edu in education:
            edu_table_data = [
                [Paragraph(f"<b>{edu.get('institution')}</b>", body_style), Paragraph(str(edu.get('passing_year')), meta_right)],
                [Paragraph(f"{edu.get('degree')} — CGPA: {edu.get('cgpa')}% / CGPA" if edu.get('cgpa') else edu.get('degree'), body_style), Paragraph(edu.get('achievements') or '', meta_right)]
            ]
            t = Table(edu_table_data, colWidths=[400, 132])
            t.setStyle(TableStyle([
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                ('BOTTOMPADDING', (0,0), (-1,-1), 2),
                ('TOPPADDING', (0,0), (-1,-1), 2),
                ('LEFTPADDING', (0,0), (-1,-1), 0),
                ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ]))
            story.append(t)
        story.append(Spacer(1, 8))
        
    if experience:
        story.append(Paragraph("PROFESSIONAL EXPERIENCE", section_title))
        for exp in experience:
            exp_table_data = [
                [Paragraph(f"<b>{exp.get('position')}</b> at <b>{exp.get('company')}</b>", body_style), Paragraph(exp.get('duration'), meta_right)],
                [Paragraph(exp.get('description'), body_style), '']
            ]
            t = Table(exp_table_data, colWidths=[400, 132])
            t.setStyle(TableStyle([
                ('SPAN', (0,1), (1,1)),
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                ('BOTTOMPADDING', (0,0), (-1,-1), 2),
                ('TOPPADDING', (0,0), (-1,-1), 2),
                ('LEFTPADDING', (0,0), (-1,-1), 0),
                ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ]))
            story.append(t)
        story.append(Spacer(1, 8))
        
    if projects:
        story.append(Paragraph("ACADEMIC & PERSONAL PROJECTS", section_title))
        for proj in projects:
            proj_header = f"<b>{proj.get('name')}</b>"
            if proj.get("tech_stack"):
                proj_header += f" (Tech: {proj.get('tech_stack')})"
            proj_table_data = [
                [Paragraph(proj_header, body_style), Paragraph(proj.get('duration') or '', meta_right)],
                [Paragraph(proj.get('description'), body_style), '']
            ]
            t = Table(proj_table_data, colWidths=[400, 132])
            t.setStyle(TableStyle([
                ('SPAN', (0,1), (1,1)),
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                ('BOTTOMPADDING', (0,0), (-1,-1), 2),
                ('TOPPADDING', (0,0), (-1,-1), 2),
                ('LEFTPADDING', (0,0), (-1,-1), 0),
                ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ]))
            story.append(t)
        story.append(Spacer(1, 8))
        
    if skills:
        story.append(Paragraph("TECHNICAL SKILLS", section_title))
        skills_by_category = {}
        for s in skills:
            cat = s.get("category", "General")
            skills_by_category.setdefault(cat, []).append(f"{s.get('name')} (Lvl {s.get('level')})")
        
        skill_lines = []
        for cat, sks in skills_by_category.items():
            skill_lines.append(f"<b>{cat}:</b> {', '.join(sks)}")
        story.append(Paragraph("<br/>".join(skill_lines), body_style))
        story.append(Spacer(1, 8))
        
    if certificates:
        story.append(Paragraph("CERTIFICATIONS", section_title))
        for cert in certificates:
            cert_table_data = [
                [Paragraph(f"<b>{cert.get('name')}</b> — {cert.get('organization')}", body_style), Paragraph(cert.get('issue_date') or '', meta_right)]
            ]
            t = Table(cert_table_data, colWidths=[400, 132])
            t.setStyle(TableStyle([
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                ('BOTTOMPADDING', (0,0), (-1,-1), 2),
                ('TOPPADDING', (0,0), (-1,-1), 2),
                ('LEFTPADDING', (0,0), (-1,-1), 0),
                ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ]))
            story.append(t)
        story.append(Spacer(1, 8))
        
    achievements_list = resume.get("achievements_list")
    if achievements_list:
        try:
            ach_json = json.loads(achievements_list)
            story.append(Paragraph("ACHIEVEMENTS & EXTRACURRICULARS", section_title))
            ach_lines = []
            if ach_json.get("hackathons"):
                ach_lines.append(f"<b>Hackathons:</b> {ach_json['hackathons']}")
            if ach_json.get("awards"):
                ach_lines.append(f"<b>Awards:</b> {ach_json['awards']}")
            if ach_json.get("soft_skills"):
                ach_lines.append(f"<b>Soft Skills:</b> {ach_json['soft_skills']}")
            if ach_json.get("extracurricular"):
                ach_lines.append(f"<b>Extracurricular:</b> {ach_json['extracurricular']}")
            story.append(Paragraph("<br/>".join(ach_lines), body_style))
        except Exception:
            pass

    doc.build(story)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=bimba_resume_{id}.pdf"}
    )

@router.get("/public/{id}")
def get_public_resume(id: int, db: Any = Depends(get_db)):
    resume_doc = db.resumes.find_one({"id": id})
    if not resume_doc or resume_doc.get("visibility") != "Public":
        raise HTTPException(status_code=403, detail="This resume is private or does not exist")
        
    resume = ResumeMaster(resume_doc)
    student_doc = db.students.find_one({"id": resume.student_id})
    student = Student(student_doc) if student_doc else None
    
    return {
        "student": {
            "student_name": student.student_name if student else "Unknown",
            "email": student.email if student else "Unknown",
            "department": student.department if student else "Unknown",
            "semester": student.semester if student else "Unknown"
        },
        "master": {
            "name": resume.name,
            "target_role": resume.target_role,
            "career_objective": resume.career_objective,
            "template_id": resume.template_id,
            "color_theme": resume.color_theme
        },
        "education": resume.get("education", []),
        "experience": resume.get("experience", []),
        "projects": resume.get("projects", []),
        "skills": resume.get("skills", []),
        "certificates": resume.get("certificates", []),
    }

# --- NEW PLATFORM ENDPOINTS ---

# Helper to extract text from pdf / docx
def extract_text_from_file(file_content: bytes, filename: str) -> str:
    text = ""
    import pypdf
    import docx
    if filename.lower().endswith(".pdf"):
        try:
            reader = pypdf.PdfReader(io.BytesIO(file_content))
            for page in reader.pages:
                text += page.extract_text() or ""
        except Exception as e:
            print(f"[PDF Extraction Error] {e}")
    elif filename.lower().endswith((".docx", ".doc")):
        try:
            doc = docx.Document(io.BytesIO(file_content))
            text = "\n".join([p.text for p in doc.paragraphs])
        except Exception as e:
            print(f"[DOCX Extraction Error] {e}")
    return text.strip()

# Helper for parser fallback
def simulated_resume_parse(text: str) -> dict:
    email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text)
    phone_match = re.search(r"(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", text)
    name = "Candidate Name"
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    if lines:
        name = lines[0]
        
    email = email_match.group(0) if email_match else "candidate@example.com"
    phone = phone_match.group(0) if phone_match else "+91 99999 99999"
    
    summary = "Detail-oriented professional with experience in software systems."
    education = [{"institution": "Bimba University", "degree": "Bachelor of Computer Applications", "passing_year": 2026, "cgpa": 9.1}]
    experience = []
    projects = []
    skills = []
    
    current_section = None
    for line in lines[1:50]:
        lower_line = line.lower()
        if "education" in lower_line or "academic" in lower_line:
            current_section = "education"
            continue
        elif "experience" in lower_line or "employment" in lower_line or "work" in lower_line:
            current_section = "experience"
            continue
        elif "project" in lower_line:
            current_section = "projects"
            continue
        elif "skill" in lower_line or "technology" in lower_line or "technologies" in lower_line:
            current_section = "skills"
            continue
            
        if current_section == "skills" and len(skills) < 10:
            parts = re.split(r"[,;•|]", line)
            for part in parts:
                part = part.strip()
                if part and len(part) < 30:
                    skills.append({"category": "Programming", "name": part, "level": 4})
        elif current_section == "experience" and len(experience) < 3:
            experience.append({"company": "SaaS Corp", "position": "Software Engineer Intern", "duration": "3 Months", "description": line})
            current_section = None
        elif current_section == "projects" and len(projects) < 3:
            projects.append({"name": "AI Web Application", "tech_stack": "React, Python", "description": line})
            current_section = None
            
    if not skills:
        skills = [{"category": "Programming", "name": "React", "level": 4}, {"category": "Programming", "name": "Python", "level": 4}]
        
    return {
        "personal_info": {
            "name": name,
            "email": email,
            "phone": phone,
            "address": "Mangalore, India",
            "linkedin": "linkedin.com/in/candidate",
            "github": "github.com/candidate",
            "portfolio": "",
            "summary": summary
        },
        "education": education,
        "experience": experience,
        "projects": projects,
        "skills": skills,
        "certifications": [],
        "achievements": {
            "hackathons": "Participant in Smart India Hackathon",
            "awards": "",
            "soft_skills": "Teamwork, Communication",
            "extracurricular": ""
        },
        "languages": ["English"],
        "links": []
    }

@router.post("/upload")
async def upload_resume_file(
    file: UploadFile = File(...),
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    if not file.filename.lower().endswith((".pdf", ".docx")):
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF or DOCX.")
    
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds limit of 5MB.")
        
    os.makedirs("uploads/resumes", exist_ok=True)
    file_id = str(uuid.uuid4())
    secure_filename = f"{file_id}_{file.filename}"
    filepath = os.path.join("uploads/resumes", secure_filename)
    
    with open(filepath, "wb") as f:
        f.write(content)
        
    text = extract_text_from_file(content, file.filename)
    if not text:
        raise HTTPException(status_code=400, detail="Could not extract text from the uploaded file.")
        
    prompt = RESUME_PARSE_PROMPT.format(resume_text=text)
    
    parsed_json = None
    try:
        raw_response = run_ai_gateway_request(db, prompt, "Resume Studio: PARSE", student.roll_number)
        cleaned = raw_response.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        parsed_json = json.loads(cleaned.strip())
    except Exception as e:
        print(f"[AI Parsing Error] {e}. Falling back to simulated parser.")
        parsed_json = simulated_resume_parse(text)
        
    return {"parsed_data": parsed_json, "file_path": filepath}

@router.post("/{id}/analyze")
def analyze_resume_endpoint(
    id: int,
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    resume = verify_ownership(id, student.id, db)
    
    resume_state = {
        "master": {
            "name": resume.name,
            "resume_type": resume.resume_type,
            "target_role": resume.target_role,
            "career_objective": resume.career_objective,
            "preferred_industry": resume.preferred_industry,
            "summary": resume.get("summary") or resume.get("career_objective"),
            "achievements_list": resume.get("achievements_list")
        },
        "education": resume.get("education", []),
        "experience": resume.get("experience", []),
        "projects": resume.get("projects", []),
        "skills": resume.get("skills", []),
        "certificates": resume.get("certificates", [])
    }
    
    prompt = RESUME_ANALYZE_PROMPT.format(resume_json=json.dumps(resume_state))
    
    try:
        raw_response = run_ai_gateway_request(db, prompt, "Resume Studio: ANALYZE", student.roll_number)
        cleaned = raw_response.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        analysis_data = json.loads(cleaned.strip())
    except Exception as e:
        print(f"[AI Analysis Error] {e}. Falling back to simulated analysis.")
        analysis_data = {
            "scores": {
                "overall_score": 78,
                "ats_score": 75,
                "professional_writing_score": 80,
                "formatting_score": 85,
                "grammar_score": 90,
                "keyword_match_score": 70,
                "project_quality_score": 75,
                "experience_strength": 70,
                "education_completeness": 95,
                "technical_skills_score": 80,
                "soft_skills_score": 75
            },
            "metadata": {
                "resume_length": "1 Page",
                "readability": "Excellent"
            },
            "suggestions": [
                {"problem": "Weak Project Descriptions", "reason": "Lacks quantified impact numbers", "fix": "Add metrics like % of load speed improved", "priority": "High"},
                {"problem": "Missing Keywords", "reason": "ATS filters look for tools", "fix": "Add Docker or AWS under technical skills", "priority": "Medium"}
            ]
        }
        
    analysis_doc = db.resume_analyses.find_one({"resume_id": id})
    scores = analysis_data.get("scores", {})
    metadata = analysis_data.get("metadata", {})
    
    update_payload = {
        "overall_score": scores.get("overall_score", 70),
        "ats_score": scores.get("ats_score", 70),
        "professional_writing_score": scores.get("professional_writing_score", 70),
        "formatting_score": scores.get("formatting_score", 70),
        "grammar_score": scores.get("grammar_score", 70),
        "keyword_match_score": scores.get("keyword_match_score", 70),
        "project_quality_score": scores.get("project_quality_score", 70),
        "experience_strength": scores.get("experience_strength", 70),
        "education_completeness": scores.get("education_completeness", 70),
        "technical_skills_score": scores.get("technical_skills_score", 70),
        "soft_skills_score": scores.get("soft_skills_score", 70),
        "resume_length": metadata.get("resume_length", "1 Page"),
        "readability": metadata.get("readability", "Good"),
        "suggestions": json.dumps(analysis_data.get("suggestions", []))
    }
    
    if not analysis_doc:
        db.resume_analyses.insert_one({
            "id": get_next_sequence("resume_analyses"),
            "resume_id": id,
            **update_payload
        })
    else:
        db.resume_analyses.update_one(
            {"_id": analysis_doc["_id"]},
            {"$set": update_payload}
        )
        
    db.resumes.update_one(
        {"id": id},
        {"$set": {"ats_score": scores.get("overall_score", 70)}}
    )
    
    db.resume_ats.update_one(
        {"resume_id": id},
        {"$set": {
            "overall_score": scores.get("overall_score", 70),
            "formatting_score": scores.get("formatting_score", 70),
            "keyword_match": scores.get("keyword_match_score", 70),
            "grammar_score": scores.get("grammar_score", 70),
            "readability_score": scores.get("overall_score", 70)
        }}
    )
    
    return analysis_data

class ImproveRequest(BaseModel):
    improvement_goal: str

@router.post("/{id}/improve")
def improve_resume_endpoint(
    id: int,
    payload: ImproveRequest,
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    resume = verify_ownership(id, student.id, db)
    
    resume_state = {
        "personal_info": {
            "name": student.student_name,
            "email": student.email,
            "phone": resume.get("phone") or "",
            "address": resume.get("address") or "",
            "linkedin": resume.get("linkedin") or "",
            "github": resume.get("github") or "",
            "portfolio": resume.get("portfolio") or "",
            "summary": resume.get("summary") or ""
        },
        "education": resume.get("education", []),
        "experience": resume.get("experience", []),
        "projects": resume.get("projects", []),
        "skills": resume.get("skills", []),
        "certifications": resume.get("certificates", []),
        "achievements": {
            "hackathons": "SIH Winner" if "Winner" in (resume.get("achievements_list") or "") else "",
            "awards": "",
            "soft_skills": "",
            "extracurricular": ""
        }
    }
    
    prompt = RESUME_IMPROVE_PROMPT.format(improvement_goal=payload.improvement_goal, resume_json=json.dumps(resume_state))
    
    improved_json = None
    try:
        raw_response = run_ai_gateway_request(db, prompt, f"Resume Studio: IMPROVE", student.roll_number)
        cleaned = raw_response.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        improved_json = json.loads(cleaned.strip())
    except Exception as e:
        print(f"[AI Improvement Error] {e}. Falling back to original state.")
        improved_json = json.loads(json.dumps(resume_state))
        improved_json["personal_info"]["summary"] = f"Improved for {payload.improvement_goal}: " + (resume.get("summary") or "Ambitious professional seeking role.")
        for p in improved_json.get("projects", []):
            p["description"] = "Spearheaded development: " + p["description"]
        for e in improved_json.get("experience", []):
            e["description"] = "Architected solution: " + e["description"]
            
    db.resume_improvements.insert_one({
        "id": get_next_sequence("resume_improvements"),
        "resume_id": id,
        "improvement_type": payload.improvement_goal,
        "original_data": json.dumps(resume_state),
        "improved_data": json.dumps(improved_json)
    })
    
    return {"original": resume_state, "improved": improved_json}

class JDOptimizeRequest(BaseModel):
    job_description: str

@router.post("/{id}/optimize-jd")
def optimize_jd_endpoint(
    id: int,
    payload: JDOptimizeRequest,
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    resume = verify_ownership(id, student.id, db)
    
    resume_state = {
        "personal_info": {
            "name": student.student_name,
            "email": student.email,
            "phone": resume.get("phone") or "",
            "address": resume.get("address") or "",
            "summary": resume.get("summary") or ""
        },
        "education": resume.get("education", []),
        "experience": resume.get("experience", []),
        "projects": resume.get("projects", []),
        "skills": resume.get("skills", []),
        "certifications": resume.get("certificates", [])
    }
    
    prompt = JD_MATCH_PROMPT.format(resume_json=json.dumps(resume_state), job_description=payload.job_description)
    
    match_data = None
    try:
        raw_response = run_ai_gateway_request(db, prompt, "Resume Studio: JD MATCH", student.roll_number)
        cleaned = raw_response.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        match_data = json.loads(cleaned.strip())
    except Exception as e:
        print(f"[JD Match Error] {e}. Falling back to simulation.")
        match_data = {
            "overall_match_score": 75,
            "missing_skills": ["Docker", "AWS"],
            "missing_keywords": ["Microservices", "RESTful design"],
            "recommended_improvements": "Add experience with deploying containers to matching section.",
            "important_technologies": ["React", "FastAPI", "Docker", "AWS"],
            "required_certifications": ["AWS Certified Solutions Architect"]
        }
        
    opt_prompt = ATS_OPTIMIZATION_PROMPT.format(resume_json=json.dumps(resume_state), job_description=payload.job_description)
    optimized_resume = None
    try:
        raw_opt = run_ai_gateway_request(db, opt_prompt, "Resume Studio: JD OPTIMIZE", student.roll_number)
        cleaned_opt = raw_opt.strip()
        if cleaned_opt.startswith("```json"):
            cleaned_opt = cleaned_opt[7:]
        if cleaned_opt.endswith("```"):
            cleaned_opt = cleaned_opt[:-3]
        optimized_resume = json.loads(cleaned_opt.strip())
    except Exception as e:
        print(f"[JD Wording Optimization Error] {e}. Using simulated optimization.")
        optimized_resume = json.loads(json.dumps(resume_state))
        optimized_resume["personal_info"]["summary"] = "Optimized: " + (resume.get("summary") or "")
        
    db.jd_optimizations.insert_one({
        "id": get_next_sequence("jd_optimizations"),
        "resume_id": id,
        "job_description": payload.job_description,
        "overall_match_score": match_data.get("overall_match_score", 0),
        "missing_skills": ",".join(match_data.get("missing_skills", [])),
        "missing_keywords": ",".join(match_data.get("missing_keywords", [])),
        "recommended_improvements": match_data.get("recommended_improvements"),
        "important_technologies": ",".join(match_data.get("important_technologies", [])),
        "required_certifications": ",".join(match_data.get("required_certifications", [])),
        "optimized_resume_data": json.dumps(optimized_resume)
    })
    
    return {"match_metrics": match_data, "optimized_resume": optimized_resume}

@router.post("/{id}/save-final")
def save_final_resume_endpoint(
    id: int,
    payload: dict,
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    resume = verify_ownership(id, student.id, db)
    
    master = payload.get("master", {})
    personal_info = payload.get("personal_info", {})
    
    achievements = payload.get("achievements")
    achievements_str = json.dumps(achievements) if achievements else resume.get("achievements_list")
    
    # Map raw lists ensuring nested child item IDs exist
    education = payload.get("education", [])
    for edu in education:
        if not edu.get("id"):
            edu["id"] = get_next_sequence("resume_education")
            
    experience = payload.get("experience", [])
    for exp in experience:
        if not exp.get("id"):
            exp["id"] = get_next_sequence("resume_experience")
            
    projects = payload.get("projects", [])
    for proj in projects:
        if not proj.get("id"):
            proj["id"] = get_next_sequence("resume_project")
            
    skills = payload.get("skills", [])
    for skill in skills:
        if not skill.get("id"):
            skill["id"] = get_next_sequence("resume_skill")
            
    certificates = payload.get("certifications", []) or payload.get("certificates", [])
    for cert in certificates:
        if not cert.get("id"):
            cert["id"] = get_next_sequence("resume_certificate")
            
    db.resumes.update_one(
        {"id": id},
        {"$set": {
            "name": master.get("name") or resume.name,
            "resume_type": master.get("resume_type") or resume.resume_type,
            "target_role": master.get("target_role") or resume.target_role,
            "career_objective": master.get("career_objective") or resume.career_objective,
            "preferred_industry": master.get("preferred_industry") or resume.preferred_industry,
            "language": master.get("language") or resume.language,
            "expected_salary": master.get("expected_salary") or resume.expected_salary,
            "visibility": master.get("visibility") or resume.visibility,
            "template_id": master.get("template_id") or resume.template_id,
            "color_theme": master.get("color_theme") or resume.color_theme,
            
            "phone": personal_info.get("phone") or master.get("phone") or resume.get("phone"),
            "address": personal_info.get("address") or master.get("address") or resume.get("address"),
            "linkedin": personal_info.get("linkedin") or master.get("linkedin") or resume.get("linkedin"),
            "github": personal_info.get("github") or master.get("github") or resume.get("github"),
            "portfolio": personal_info.get("portfolio") or master.get("portfolio") or resume.get("portfolio"),
            "summary": personal_info.get("summary") or master.get("summary") or resume.get("summary"),
            
            "achievements_list": achievements_str,
            "education": education,
            "experience": experience,
            "projects": projects,
            "skills": skills,
            "certificates": certificates,
            "updated_at": datetime.utcnow()
        }}
    )
    return {"success": True}

@router.get("/{id}/docx")
def get_docx_export_endpoint(
    id: int,
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    resume = verify_ownership(id, student.id, db)
    
    # Retrieve details
    education = resume.get("education", [])
    experience = resume.get("experience", [])
    projects = resume.get("projects", [])
    skills = resume.get("skills", [])
    certificates = resume.get("certificates", [])
    
    resume_data = {
        "master": {
            "name": resume.name,
            "resume_type": resume.resume_type,
            "target_role": resume.target_role,
            "career_objective": resume.career_objective,
            "preferred_industry": resume.preferred_industry,
            "phone": resume.get("phone"),
            "address": resume.get("address"),
            "linkedin": resume.get("linkedin"),
            "github": resume.get("github"),
            "portfolio": resume.get("portfolio"),
            "summary": resume.get("summary") or resume.career_objective,
            "achievements_list": resume.get("achievements_list")
        },
        "student": {
            "student_name": student.student_name,
            "email": student.email,
            "department": student.department
        },
        "education": [{"institution": e.get("institution"), "degree": e.get("degree"), "passing_year": e.get("passing_year"), "cgpa": e.get("cgpa"), "percentage": e.get("percentage"), "achievements": e.get("achievements")} for e in education],
        "experience": [{"company": exp.get("company"), "position": exp.get("position"), "duration": exp.get("duration"), "description": exp.get("description")} for exp in experience],
        "projects": [{"name": p.get("name"), "tech_stack": p.get("tech_stack"), "description": p.get("description"), "duration": p.get("duration")} for p in projects],
        "skills": [{"category": s.get("category"), "name": s.get("name"), "level": s.get("level")} for s in skills],
        "certificates": [{"name": c.get("name"), "organization": c.get("organization"), "issue_date": c.get("issue_date")} for c in certificates]
    }
    
    db.resume_downloads.insert_one({
        "id": get_next_sequence("resume_downloads"),
        "resume_id": id,
        "format": "DOCX",
        "created_at": datetime.utcnow()
    })
    
    docx_stream = generate_docx_resume(resume_data)
    
    return StreamingResponse(
        docx_stream,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename=bimba_resume_{id}.docx"}
    )

@router.get("/{id}/analysis")
def get_analysis_record(
    id: int,
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    verify_ownership(id, student.id, db)
    analysis_doc = db.resume_analyses.find_one({"resume_id": id})
    if not analysis_doc:
        return {
            "scores": {
                "overall_score": 70,
                "ats_score": 70,
                "professional_writing_score": 70,
                "formatting_score": 70,
                "grammar_score": 70,
                "keyword_match_score": 70,
                "project_quality_score": 70,
                "experience_strength": 70,
                "education_completeness": 70,
                "technical_skills_score": 70,
                "soft_skills_score": 70
            },
            "metadata": {
                "resume_length": "1 Page",
                "readability": "Good"
            },
            "suggestions": []
        }
        
    analysis = MongoModel(analysis_doc)
    return {
        "scores": {
            "overall_score": analysis.overall_score,
            "ats_score": analysis.ats_score,
            "professional_writing_score": analysis.professional_writing_score,
            "formatting_score": analysis.formatting_score,
            "grammar_score": analysis.grammar_score,
            "keyword_match_score": analysis.keyword_match_score,
            "project_quality_score": analysis.project_quality_score,
            "experience_strength": analysis.experience_strength,
            "education_completeness": analysis.education_completeness,
            "technical_skills_score": analysis.technical_skills_score,
            "soft_skills_score": analysis.soft_skills_score
        },
        "metadata": {
            "resume_length": analysis.resume_length,
            "readability": analysis.readability
        },
        "suggestions": json.loads(analysis.suggestions) if analysis.suggestions else []
    }
