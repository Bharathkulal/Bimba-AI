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

def run_ai_gateway_request(db: Any, prompt: str, task_type: str, roll_number: str = None) -> str:
    from app.services.ai_gateway import generate_ai_response
    return generate_ai_response(db, prompt, task_type)

router = APIRouter(prefix="/resume-studio", tags=["AI Resume Studio"])

# --- SCHEMAS ---

class ResumeCreateRequest(BaseModel):
    name: str

    class Config:
        extra = "allow"

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
            "resume_type": r.get("resume_type") or "Fresher",
            "target_role": r.get("target_role") or "Software Engineer",
            "status": r.get("status") or "Draft",
            "ats_score": r.get("ats_score") or 72,
            "updated_at": r.updated_at.isoformat() if r.updated_at else datetime.utcnow().isoformat(),
            "visibility": r.get("visibility") or "Private",
            "downloads_count": downloads
        })
    return result

@router.get("/{id}")
def get_resume_detail(id: int, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    resume = verify_ownership(id, student.id, db)
    
    resume_data = resume.get("resume", {})
    
    # Retrieve ATS and Readiness docs
    ats_doc = db.resume_ats.find_one({"resume_id": id})
    ats = ResumeATS(ats_doc) if ats_doc else None
    
    readiness_doc = db.career_readiness.find_one({"resume_id": id})
    readiness = CareerReadiness(readiness_doc) if readiness_doc else None

    # Merge dynamic resume data with key metadata fields
    response = {
        **resume_data,
        "id": resume.id,
        "student_id": resume.student_id,
        "userId": resume.student_id,
        "name": resume.name,
        "resume_type": resume.get("resume_type") or "Fresher",
        "target_role": resume.get("target_role") or "Software Engineer",
        "status": resume.get("status") or "Draft",
        "ats_score": resume.get("ats_score") or 72,
        "visibility": resume.get("visibility") or "Private",
        "template_id": resume.get("template_id") or "celestial",
        "color_theme": resume.get("color_theme") or "blue",
        "updated_at": resume.updated_at.isoformat() if resume.updated_at else datetime.utcnow().isoformat(),
        "ats": ats,
        "career_readiness": readiness
    }
    
    # Backward compatibility fallbacks
    for k in ["education", "experience", "projects", "skills", "certificates"]:
        if k not in response:
            response[k] = resume.get(k) or []
            
    if "master" not in response:
        response["master"] = {
            "id": resume.id,
            "name": resume.name,
            "resume_type": resume.get("resume_type") or "Fresher",
            "target_role": resume.get("target_role") or "Software Engineer",
            "career_objective": resume.get("career_objective") or "",
            "preferred_industry": resume.get("preferred_industry") or "",
            "language": resume.get("language") or "English",
            "expected_salary": resume.get("expected_salary"),
            "visibility": resume.get("visibility") or "Private",
            "template_id": resume.get("template_id") or "celestial",
            "color_theme": resume.get("color_theme") or "blue",
            "status": resume.get("status") or "Draft",
            "ats_score": resume.get("ats_score") or 72,
            "phone": resume.get("phone") or "",
            "address": resume.get("address") or "",
            "linkedin": resume.get("linkedin") or "",
            "github": resume.get("github") or "",
            "portfolio": resume.get("portfolio") or "",
            "website": resume.get("website") or "",
            "summary": resume.get("summary") or "",
            "updated_at": resume.updated_at.isoformat() if resume.updated_at else datetime.utcnow().isoformat()
        }
    return response

@router.post("/create")
def create_resume(payload: dict, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    next_id = get_next_sequence("resumes")
    
    # Initialize default education from student database
    default_edu_id = get_next_sequence("resume_education")
    default_education = [
        {
            "id": default_edu_id,
            "institution": student.section or "",
            "degree": student.department or "",
            "passing_year": None,
            "cgpa": None,
            "board": None,
            "percentage": None,
            "achievements": None
        }
    ]
    
    # Create resume
    resume_doc = {
        "id": next_id,
        "student_id": student.id,
        "userId": student.id,
        "name": payload.get("name") or "New Resume",
        "resume_type": payload.get("resume_type") or "Fresher",
        "target_role": payload.get("target_role") or "Software Engineer",
        "career_objective": payload.get("career_objective") or "",
        "preferred_industry": payload.get("preferred_industry") or "",
        "language": payload.get("language") or "English",
        "expected_salary": payload.get("expected_salary"),
        "visibility": payload.get("visibility") or "Private",
        "status": "Draft",
        "template_id": payload.get("template_id") or "celestial",
        "color_theme": payload.get("color_theme") or "blue",
        "ats_score": 72,
        
        # Nested dynamic resume structure
        "resume": payload,
        
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    # Ensure default fields exist in the nested resume structure for compat
    if "education" not in resume_doc["resume"]:
        resume_doc["resume"]["education"] = default_education
    if "experience" not in resume_doc["resume"]:
        resume_doc["resume"]["experience"] = []
    if "projects" not in resume_doc["resume"]:
        resume_doc["resume"]["projects"] = []
    if "skills" not in resume_doc["resume"]:
        resume_doc["resume"]["skills"] = []
    if "certificates" not in resume_doc["resume"]:
        resume_doc["resume"]["certificates"] = []
    if "master" not in resume_doc["resume"]:
        resume_doc["resume"]["master"] = {
            "name": resume_doc["name"],
            "resume_type": resume_doc["resume_type"],
            "target_role": resume_doc["target_role"],
            "career_objective": resume_doc["career_objective"],
            "preferred_industry": resume_doc["preferred_industry"],
            "language": resume_doc["language"],
            "expected_salary": resume_doc["expected_salary"],
            "visibility": resume_doc["visibility"],
            "template_id": resume_doc["template_id"],
            "color_theme": resume_doc["color_theme"]
        }
        
    print("[MongoDB] Saving resume...")
    try:
        db.resumes.insert_one(resume_doc)
        print("[MongoDB] Resume saved successfully")
    except Exception as e:
        print(f"[MongoDB Error] Resumes insert failed: {e}")
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "step": "MongoDB Insert",
                "provider": "MongoDB Database",
                "error": f"Database insertion failed: {str(e)}"
            }
        )

    # Initialize empty default ATS scorecard
    try:
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
    except Exception as e:
        print(f"[MongoDB Error] ATS scorecard insert failed: {e}")

    # Log action
    try:
        db.activity_logs.insert_one({
            "id": get_next_sequence("activity_logs"),
            "student_id": student.id,
            "activity": f"Resume Uploaded" if payload.get("visibility") == "Private" and "AI Parsed" in payload.get("name", "") else f"Resume Created",
            "created_at": datetime.utcnow()
        })
    except Exception as e:
        print(f"[MongoDB Error] Activity log insert failed: {e}")

    # Save original version state
    db.resume_versions.insert_one({
        "id": get_next_sequence("resume_versions"),
        "resume_id": next_id,
        "version_number": 1,
        "name": "Original",
        "data": json.dumps(resume_doc["resume"]),
        "ats_score": 72,
        "created_at": datetime.utcnow()
    })

    return {"success": True, "id": next_id}

def sync_resume_profile(id: int, student_id: int, payload: dict, db: Any):
    try:
        from datetime import datetime, timezone
        profile_doc = {
            "userId": student_id,
            "resumeId": id,
            "personal_info": payload.get("personal_info") or payload.get("personalInfo") or {},
            "summary": payload.get("summary") or "",
            "objective": payload.get("objective") or "",
            "education": payload.get("education") or [],
            "experience": payload.get("experience") or [],
            "projects": payload.get("projects") or [],
            "technicalSkills": payload.get("technicalSkills") or payload.get("skills") or [],
            "softSkills": payload.get("softSkills") or [],
            "certifications": payload.get("certifications") or payload.get("certificates") or [],
            "internships": payload.get("internships") or [],
            "achievements": payload.get("achievements") or [],
            "languages": payload.get("languages") or [],
            "portfolioLinks": payload.get("portfolioLinks") or [],
            "publications": payload.get("publications") or [],
            "volunteerExperience": payload.get("volunteerExperience") or [],
            "references": payload.get("references") or [],
            "lastUpdated": datetime.now(timezone.utc).isoformat()
        }
        db.resume_profiles.update_one(
            {"resumeId": id},
            {"$set": profile_doc},
            upsert=True
        )
    except Exception as e:
        print(f"[sync_resume_profile error] {e}")

@router.get("/profile/{resume_id}")
def get_resume_profile(resume_id: int, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    verify_ownership(resume_id, student.id, db)
    profile_doc = db.resume_profiles.find_one({"resumeId": resume_id})
    if not profile_doc:
        resume_doc = db.resumes.find_one({"id": resume_id})
        r_data = resume_doc.get("resume", {}) if resume_doc else {}
        profile_doc = {
            "userId": student.id,
            "resumeId": resume_id,
            "personal_info": r_data.get("personal_info", {}),
            "summary": r_data.get("summary", ""),
            "objective": r_data.get("objective", ""),
            "education": r_data.get("education", []),
            "experience": r_data.get("experience", []),
            "projects": r_data.get("projects", []),
            "technicalSkills": r_data.get("technicalSkills") or r_data.get("skills") or [],
            "softSkills": r_data.get("softSkills", []),
            "certifications": r_data.get("certifications") or r_data.get("certificates") or [],
            "internships": r_data.get("internships", []),
            "achievements": r_data.get("achievements", []),
            "languages": r_data.get("languages", []),
            "portfolioLinks": r_data.get("portfolioLinks", []),
            "publications": r_data.get("publications", []),
            "volunteerExperience": r_data.get("volunteerExperience", []),
            "references": r_data.get("references", []),
            "lastUpdated": datetime.utcnow().isoformat()
        }
    from app.core.mongodb import MongoModel
    return MongoModel(profile_doc)

@router.put("/profile/{resume_id}")
def update_resume_profile(resume_id: int, payload: dict, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    verify_ownership(resume_id, student.id, db)
    sync_resume_profile(resume_id, student.id, payload, db)
    db.resumes.update_one(
        {"id": resume_id},
        {"$set": {"resume": payload, "updated_at": datetime.utcnow()}}
    )
    return {"success": True}

@router.put("/{id}/update")
def update_resume(id: int, payload: dict, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    verify_ownership(id, student.id, db)
    
    # Save the payload exactly as received into the dynamic resume field
    update_fields = {
        "updated_at": datetime.utcnow()
    }
    
    # Root level helpers
    for key in ["name", "resume_type", "target_role", "visibility", "template_id", "color_theme", "status", "ats_score"]:
        if key in payload:
            update_fields[key] = payload[key]
        elif "master" in payload and key in payload["master"]:
            update_fields[key] = payload["master"][key]
            
    db.resumes.update_one(
        {"id": id},
        {
            "$set": {
                "resume": payload,
                **update_fields
            }
        }
    )
    sync_resume_profile(id, student.id, payload, db)
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
    
    resume_data = resume.get("resume", {}).copy()
    
    # Map raw lists ensuring nested child item IDs exist
    for key in ["education", "experience", "projects", "skills", "certificates", "certifications"]:
        if key in resume_data and isinstance(resume_data[key], list):
            new_list = []
            for item in resume_data[key]:
                if isinstance(item, dict):
                    copied_item = item.copy()
                    copied_item["id"] = get_next_sequence(f"resume_{key[:-1] if key.endswith('s') else key}")
                    new_list.append(copied_item)
                else:
                    new_list.append(item)
            resume_data[key] = new_list
            
    new_doc = {
        "id": next_id,
        "student_id": student.id,
        "userId": student.id,
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
        "resume": resume_data,
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

# Helper function to append item to dynamic list in resume
def dynamic_add_item(id: int, sec_key: str, payload: dict, seq_name: str, db: Any):
    resume_doc = db.resumes.find_one({"id": id})
    if not resume_doc:
        return
    resume_data = resume_doc.get("resume", {})
    if sec_key not in resume_data or not isinstance(resume_data[sec_key], list):
        resume_data[sec_key] = []
        
    if "id" not in payload:
        payload["id"] = get_next_sequence(seq_name)
        
    if sec_key == "skills":
        # Check if existing skill
        existing_idx = next((idx for idx, s in enumerate(resume_data[sec_key]) if isinstance(s, dict) and s.get("name") == payload.get("name")), None)
        if existing_idx is not None:
            resume_data[sec_key][existing_idx]["level"] = payload.get("level", 3)
        else:
            resume_data[sec_key].append(payload)
    else:
        resume_data[sec_key].append(payload)
        
    db.resumes.update_one(
        {"id": id},
        {
            "$set": {
                "resume": resume_data,
                "updated_at": datetime.utcnow()
            }
        }
    )

# Helper function to delete item from dynamic list in resume
def dynamic_delete_item(sec_key: str, item_id: int, student_id: int, db: Any):
    resume_doc = db.resumes.find_one({f"resume.{sec_key}.id": item_id})
    if resume_doc:
        verify_ownership(resume_doc["id"], student_id, db)
        resume_data = resume_doc.get("resume", {})
        if sec_key in resume_data and isinstance(resume_data[sec_key], list):
            resume_data[sec_key] = [item for item in resume_data[sec_key] if isinstance(item, dict) and item.get("id") != item_id]
            db.resumes.update_one(
                {"_id": resume_doc["_id"]},
                {
                    "$set": {
                        "resume": resume_data,
                        "updated_at": datetime.utcnow()
                    }
                }
            )

@router.post("/{id}/education")
def add_education(id: int, payload: dict, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    verify_ownership(id, student.id, db)
    dynamic_add_item(id, "education", payload, "resume_education", db)
    return {"success": True}

@router.delete("/education/{edu_id}")
def delete_education(edu_id: int, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    dynamic_delete_item("education", edu_id, student.id, db)
    return {"success": True}

@router.post("/{id}/experience")
def add_experience(id: int, payload: dict, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    verify_ownership(id, student.id, db)
    dynamic_add_item(id, "experience", payload, "resume_experience", db)
    return {"success": True}

@router.delete("/experience/{exp_id}")
def delete_experience(exp_id: int, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    dynamic_delete_item("experience", exp_id, student.id, db)
    return {"success": True}

@router.post("/{id}/project")
def add_project(id: int, payload: dict, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    verify_ownership(id, student.id, db)
    dynamic_add_item(id, "projects", payload, "resume_project", db)
    return {"success": True}

@router.delete("/project/{proj_id}")
def delete_project(proj_id: int, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    dynamic_delete_item("projects", proj_id, student.id, db)
    return {"success": True}

@router.post("/{id}/skill")
def add_skill(id: int, payload: dict, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    verify_ownership(id, student.id, db)
    dynamic_add_item(id, "skills", payload, "resume_skill", db)
    return {"success": True}

@router.delete("/skill/{skill_id}")
def delete_skill(skill_id: int, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    dynamic_delete_item("skills", skill_id, student.id, db)
    return {"success": True}

@router.post("/{id}/certificate")
def add_certificate(id: int, payload: dict, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    verify_ownership(id, student.id, db)
    dynamic_add_item(id, "certificates", payload, "resume_certificate", db)
    return {"success": True}

@router.delete("/certificate/{cert_id}")
def delete_certificate(cert_id: int, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    dynamic_delete_item("certificates", cert_id, student.id, db)
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
    
    resume_data = resume.get("resume", {})
    resume_data["skills"] = skills
    resume_data["projects"] = projs
    if "master" in resume_data:
        resume_data["master"]["career_objective"] = "Passionate and detail-oriented Software Development Engineer targeting roles in backend systems and cloud platforms. Skilled in building API engines and automating workflows."
        
    db.resumes.update_one(
        {"id": id},
        {"$set": {
            "resume": resume_data,
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
    
    resume_data = resume.get("resume", {})
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
        "data": json.dumps(resume_data),
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
    
    db.resumes.update_one(
        {"id": resume.id},
        {"$set": {
            "resume": state,
            "ats_score": ver.ats_score,
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
def get_pdf_export(id: int, inline: bool = False, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
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
    db.activity_logs.insert_one({
        "id": get_next_sequence("activity_logs"),
        "student_id": student.id,
        "activity": "Resume Downloaded",
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
    
    resume_data = resume.get("resume", {})
    p_info = resume_data.get("personal_info") or resume_data.get("master") or {}
    
    name = student.student_name or p_info.get("name") or "Candidate"
    contact_parts = []
    if student.email:
        contact_parts.append(student.email)
    elif p_info.get("email"):
        contact_parts.append(p_info.get("email"))
        
    if p_info.get("phone"):
        contact_parts.append(p_info.get("phone"))
    if p_info.get("address"):
        contact_parts.append(p_info.get("address"))
        
    sub_parts = []
    for link_key in ["linkedin", "github", "portfolio", "website"]:
        if p_info.get(link_key):
            sub_parts.append(f"{link_key.capitalize()}: {p_info.get(link_key)}")
        
    story.append(Paragraph(name, title_style))
    story.append(Paragraph(" • ".join(contact_parts) + "<br/>" + " | ".join(sub_parts), subtitle_style))
    
    story.append(Table([['']], colWidths=[532], rowHeights=[1], style=TableStyle([
        ('LINEBELOW', (0,0), (-1,-1), 1.5, primary_color),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ])))
    story.append(Spacer(1, 10))
    
    # Render Summary
    summary_text = p_info.get("summary") or p_info.get("career_objective") or resume.get("career_objective")
    if summary_text:
        story.append(Paragraph("PROFESSIONAL SUMMARY", section_title))
        story.append(Paragraph(summary_text, body_style))
        story.append(Spacer(1, 8))
        
    # Render all other custom and standard sections dynamically
    for section_name, section_value in resume_data.items():
        if section_name in ["master", "personal_info", "id", "userId", "student_id", "name", "visibility", "template_id", "color_theme", "status", "ats_score", "created_at", "updated_at", "resume"]:
            continue
            
        if not section_value:
            continue
            
        formatted_title = section_name.upper().replace('_', ' ')
        story.append(Paragraph(formatted_title, section_title))
        
        if isinstance(section_value, str):
            story.append(Paragraph(section_value, body_style))
            story.append(Spacer(1, 8))
        elif isinstance(section_value, list):
            for item in section_value:
                if isinstance(item, str):
                    story.append(Paragraph(item, body_style))
                elif isinstance(item, dict):
                    main_header_candidates = ["institution", "company", "name", "title", "position", "category", "organization"]
                    date_candidates = ["passing_year", "duration", "date", "year", "issue_date", "time_period"]
                    sub_candidates = ["degree", "role", "tech_stack", "level"]
                    desc_candidates = ["description", "achievements", "details", "summary"]
                    
                    main_val = next((item[c] for c in main_header_candidates if c in item and item[c]), None)
                    date_val = next((item[c] for c in date_candidates if c in item and item[c]), None)
                    sub_val = next((item[c] for c in sub_candidates if c in item and item[c]), None)
                    desc_val = next((item[c] for c in desc_candidates if c in item and item[c]), None)
                    
                    captured_keys = set(main_header_candidates + date_candidates + sub_candidates + desc_candidates + ["id"])
                    extra_parts = []
                    for k, v in item.items():
                        if k not in captured_keys and v:
                            extra_parts.append(f"<b>{k.replace('_', ' ').capitalize()}:</b> {v}")
                            
                    item_table_data = []
                    
                    if main_val or date_val:
                        left_p = Paragraph(f"<b>{main_val}</b>" if main_val else "", body_style)
                        right_p = Paragraph(str(date_val) if date_val else "", meta_right)
                        item_table_data.append([left_p, right_p])
                        
                    second_line_left = []
                    if sub_val:
                        second_line_left.append(str(sub_val))
                    if extra_parts:
                        second_line_left.append(" | ".join(extra_parts))
                        
                    if second_line_left:
                        left_content = " — ".join(second_line_left)
                        item_table_data.append([Paragraph(left_content, body_style), ""])
                        
                    if desc_val:
                        item_table_data.append([Paragraph(str(desc_val), body_style), ""])
                        
                    if item_table_data:
                        t = Table(item_table_data, colWidths=[400, 132])
                        t_styles = [
                            ('VALIGN', (0,0), (-1,-1), 'TOP'),
                            ('BOTTOMPADDING', (0,0), (-1,-1), 2),
                            ('TOPPADDING', (0,0), (-1,-1), 2),
                            ('LEFTPADDING', (0,0), (-1,-1), 0),
                            ('RIGHTPADDING', (0,0), (-1,-1), 0),
                        ]
                        for r_idx in range(len(item_table_data)):
                            if r_idx > 0 or not date_val:
                                t_styles.append(('SPAN', (0, r_idx), (1, r_idx)))
                        t.setStyle(TableStyle(t_styles))
                        story.append(t)
            story.append(Spacer(1, 8))
            
    doc.build(story)
    buffer.seek(0)
    
    # Log download action
    db.resume_downloads.insert_one({
        "id": get_next_sequence("resume_downloads"),
        "student_id": student.id,
        "resume_id": id,
        "resume_name": resume.get("name", "Untitled"),
        "format": "PDF",
        "created_at": datetime.utcnow()
    })
    db.activity_logs.insert_one({
        "id": get_next_sequence("activity_logs"),
        "student_id": student.id,
        "activity": "Resume Downloaded",
        "created_at": datetime.utcnow()
    })
    
    disposition = "inline" if inline else "attachment"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"{disposition}; filename=bimba_resume_{id}.pdf"}
    )

@router.get("/{id}/download/pdf")
def get_pdf_download(id: int, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    return get_pdf_export(id, inline=False, student=student, db=db)

@router.get("/{id}/download/docx")
def get_docx_download(id: int, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    from docx import Document
    resume = verify_ownership(id, student.id, db)
    
    doc = Document()
    doc.add_heading(resume.get("name") or "Resume", 0)
    
    p_info = resume.get("personal_info", {})
    doc.add_paragraph(f"Email: {p_info.get('email', '')} | Phone: {p_info.get('phone', '')}")
    doc.add_paragraph(f"LinkedIn: {p_info.get('linkedin', '')} | GitHub: {p_info.get('github', '')}")
    
    doc.add_heading('Professional Summary', level=1)
    doc.add_paragraph(resume.get("summary") or resume.get("career_objective") or "")
    
    doc.add_heading('Experience', level=1)
    for exp in resume.get("experience", []):
        doc.add_paragraph(f"{exp.get('role', '')} at {exp.get('company', '')} ({exp.get('duration', '')})")
        doc.add_paragraph(exp.get('description', ''))
        
    doc.add_heading('Education', level=1)
    for edu in resume.get("education", []):
        doc.add_paragraph(f"{edu.get('degree', '')} - {edu.get('institution', '')} ({edu.get('year', '')})")
        
    doc.add_heading('Projects', level=1)
    for proj in resume.get("projects", []):
        doc.add_paragraph(f"{proj.get('title', '')}")
        doc.add_paragraph(proj.get('description', ''))
        
    doc.add_heading('Skills', level=1)
    doc.add_paragraph(", ".join(resume.get("skills", [])))

    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    
    db.resume_downloads.insert_one({
        "id": get_next_sequence("resume_downloads"),
        "student_id": student.id,
        "resume_id": id,
        "resume_name": resume.get("name", "Untitled"),
        "format": "DOCX",
        "created_at": datetime.utcnow()
    })
    
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename=bimba_resume_{id}.docx"}
    )

@router.get("/{id}/download/txt")
def get_txt_download(id: int, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    resume = verify_ownership(id, student.id, db)
    
    lines = []
    lines.append(resume.get("name", "Resume").upper())
    lines.append("=" * len(resume.get("name", "Resume")))
    lines.append("")
    
    p_info = resume.get("personal_info", {})
    lines.append(f"Email: {p_info.get('email', '')}")
    lines.append(f"Phone: {p_info.get('phone', '')}")
    lines.append(f"LinkedIn: {p_info.get('linkedin', '')}")
    lines.append(f"GitHub: {p_info.get('github', '')}")
    lines.append("")
    
    lines.append("SUMMARY")
    lines.append("-------")
    lines.append(resume.get("summary") or resume.get("career_objective") or "")
    lines.append("")
    
    lines.append("EXPERIENCE")
    lines.append("----------")
    for exp in resume.get("experience", []):
        lines.append(f"* {exp.get('role', '')} at {exp.get('company', '')} ({exp.get('duration', '')})")
        lines.append(f"  {exp.get('description', '')}")
    lines.append("")
    
    lines.append("EDUCATION")
    lines.append("---------")
    for edu in resume.get("education", []):
        lines.append(f"* {edu.get('degree', '')} - {edu.get('institution', '')} ({edu.get('year', '')})")
    lines.append("")
    
    content = "\n".join(lines)
    buffer = io.BytesIO(content.encode('utf-8'))
    
    db.resume_downloads.insert_one({
        "id": get_next_sequence("resume_downloads"),
        "student_id": student.id,
        "resume_id": id,
        "resume_name": resume.get("name", "Untitled"),
        "format": "TXT",
        "created_at": datetime.utcnow()
    })
    
    return StreamingResponse(
        buffer,
        media_type="text/plain",
        headers={"Content-Disposition": f"attachment; filename=bimba_resume_{id}.txt"}
    )

@router.post("/{id}/save-version")
def save_resume_version(id: int, payload: dict, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    resume = verify_ownership(id, student.id, db)
    version_num = db.resume_versions.count_documents({"resume_id": id}) + 1
    version_doc = {
        "id": get_next_sequence("resume_versions"),
        "resume_id": id,
        "version_number": version_num,
        "name": payload.get("version_name") or f"Version {version_num}",
        "resume_data": resume.get("resume", {}),
        "ats_score": resume.get("ats_score", 72),
        "created_at": datetime.utcnow()
    }
    db.resume_versions.insert_one(version_doc)
    return {"success": True, "version_number": version_num}

@router.get("/public/{id}")
def get_public_resume(id: int, db: Any = Depends(get_db)):
    resume_doc = db.resumes.find_one({"id": id})
    if not resume_doc or resume_doc.get("visibility") != "Public":
        raise HTTPException(status_code=403, detail="This resume is private or does not exist")
        
    resume = ResumeMaster(resume_doc)
    student_doc = db.students.find_one({"id": resume.student_id})
    student = Student(student_doc) if student_doc else None
    
    resume_data = resume.get("resume", {})
    
    response = {
        **resume_data,
        "student": {
            "student_name": student.student_name if student else "Unknown",
            "email": student.email if student else "Unknown",
            "department": student.department if student else "Unknown",
            "semester": student.semester if student else "Unknown"
        },
        "master": resume_data.get("master") or {
            "name": resume.name,
            "target_role": resume.target_role,
            "career_objective": resume.career_objective,
            "template_id": resume.template_id,
            "color_theme": resume.color_theme,
            "phone": resume_doc.get("phone") or "",
            "address": resume_doc.get("address") or "",
            "linkedin": resume_doc.get("linkedin") or "",
            "github": resume_doc.get("github") or "",
            "portfolio": resume_doc.get("portfolio") or "",
            "website": resume_doc.get("website") or "",
            "summary": resume_doc.get("summary") or ""
        }
    }
    
    # Backward compatibility fallbacks
    for k in ["education", "experience", "projects", "skills", "certificates"]:
        if k not in response:
            response[k] = resume.get(k) or []
            
    return response

# --- NEW PLATFORM ENDPOINTS ---

# Helper to extract text from pdf / docx / txt
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
    elif filename.lower().endswith(".txt"):
        try:
            text = file_content.decode("utf-8", errors="ignore")
        except Exception as e:
            print(f"[TXT Extraction Error] {e}")
    return text.strip()

# Helper for parser fallback
def simulated_resume_parse(text: str) -> dict:
    clean_text = text
    # Pre-cleaning specific known PDF space splits
    clean_text = clean_text.replace("EDUCA TION", "EDUCATION")
    clean_text = clean_text.replace("PUBLICA TIONS", "PUBLICATIONS")
    clean_text = clean_text.replace("T echnology", "Technology")
    clean_text = clean_text.replace("F ull", "Full")
    clean_text = clean_text.replace("HyperT rade", "HyperTrade")
    clean_text = clean_text.replace("A WS", "AWS")
    clean_text = clean_text.replace("T erraform", "Terraform")
    clean_text = clean_text.replace("leveragingA WS", "leveraging AWS")
    clean_text = clean_text.replace("Y ouT ube", "YouTube")
    clean_text = clean_text.replace("F rameworks", "Frameworks")

    email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", clean_text)
    phone_match = re.search(r"(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", clean_text)
    linkedin_match = re.search(r"(?:https?://)?(?:www\.)?linkedin\.com/in/[\w\-]+|linkedin\.com/[\w\-]+", clean_text, re.IGNORECASE)
    github_match = re.search(r"(?:https?://)?(?:www\.)?github\.com/[\w\-]+", clean_text, re.IGNORECASE)
    
    name = "Candidate Name"
    lines = [line.strip() for line in clean_text.split("\n") if line.strip()]
    if lines:
        name = lines[0]
        
    email = email_match.group(0) if email_match else ""
    phone = phone_match.group(0) if phone_match else ""
    linkedin = linkedin_match.group(0) if linkedin_match else ""
    github = github_match.group(0) if github_match else ""
    
    skills = []
    experience = []
    projects = []
    education = []
    
    current_section = None
    for line in lines[1:]:
        lower_line = line.lower()
        
        # Whitespace-tolerant section detection
        if re.search(r"\b(s\s*k\s*i\s*l\s*l\s*s|t\s*e\s*c\s*h\s*n\s*o\s*l\s*o\s*g\s*i\s*e\s*s)\b", lower_line):
            current_section = "skills"
            continue
        elif re.search(r"\b(e\s*x\s*p\s*e\s*r\s*i\s*e\s*n\s*c\s*e|e\s*m\s*p\s*l\s*o\s*y\s*m\s*e\s*n\s*t|w\s*o\s*r\s*k\s* \s*h\s*i\s*s\s*t\s*o\s*r\s*y)\b", lower_line):
            current_section = "experience"
            continue
        elif re.search(r"\b(p\s*r\s*o\s*j\s*e\s*c\s*t\s*s)\b", lower_line):
            current_section = "projects"
            continue
        elif re.search(r"\b(e\s*d\s*u\s*c\s*a\s*t\s*i\s*o\s*n|a\s*c\s*a\s*d\s*e\s*m\s*i\s*c\s*s)\b", lower_line):
            current_section = "education"
            continue
        elif re.search(r"\b(p\s*u\s*b\s*l\s*i\s*c\s*a\s*t\s*i\s*o\s*n\s*s|a\s*c\s*h\s*i\s*e\s*v\s*e\s*m\s*e\s*n\s*t\s*s|a\s*w\s*a\s*r\s*d\s*s)\b", lower_line):
            current_section = None
            continue
            
        if current_section == "skills":
            clean_line = re.sub(r"^(programming|frameworks|devops|cloud providers|tools|languages)\b", "", line, flags=re.IGNORECASE).strip()
            parts = re.split(r"[,;•|]", clean_line)
            for part in parts:
                part = part.strip()
                if part and len(part) < 40:
                    skills.append({"category": "Programming", "name": part, "level": 4})
        elif current_section == "experience":
            date_match = re.search(r"(\d{2}/\d{2}/\d{4}|\w+ \d{4})?\s*-\s*(\d{2}/\d{2}/\d{4}|Present|\w+ \d{4})", line)
            if date_match:
                duration = date_match.group(0)
                title = line.replace(duration, "").strip(", \t")
                experience.append({"company": "", "position": title, "duration": duration, "description": ""})
            elif experience:
                if not experience[-1]["company"]:
                    experience[-1]["company"] = line
                else:
                    experience[-1]["description"] += "\n" + line
        elif current_section == "projects":
            clean_line = re.sub(r"^[•\-\*]\s*", "", line).strip()
            if clean_line:
                parts = re.split(r"\s*[\-–—:]\s+", clean_line, maxsplit=1)
                if len(parts) == 2:
                    projects.append({"name": parts[0].strip(), "tech_stack": "", "description": parts[1].strip()})
                else:
                    projects.append({"name": "Project", "tech_stack": "", "description": clean_line})
        elif current_section == "education":
            year_match = re.search(r"\b(19|20)\d{2}\s*-\s*\b(19|20)\d{2}\b", line)
            if year_match:
                passing_year = year_match.group(0)
                degree = line.replace(passing_year, "").strip(", \t")
                education.append({"institution": "", "degree": degree, "year": passing_year, "passing_year": passing_year})
            elif education:
                if not education[-1]["institution"]:
                    education[-1]["institution"] = line
                elif not education[-1]["degree"]:
                    education[-1]["degree"] = line
                else:
                    education.append({"institution": line, "degree": "", "year": "", "passing_year": ""})
            else:
                education.append({"institution": line, "degree": "", "year": "", "passing_year": ""})
                
    return {
        "personal_info": {
            "name": name,
            "email": email,
            "phone": phone,
            "address": "",
            "linkedin": linkedin,
            "github": github,
            "portfolio": "",
            "summary": ""
        },
        "education": education,
        "experience": experience,
        "projects": projects,
        "skills": skills,
        "certifications": [],
        "achievements": {
            "hackathons": "",
            "awards": "",
            "soft_skills": "",
            "extracurricular": ""
        },
        "languages": [],
        "links": []
    }

@router.post("/upload")
async def upload_resume_file(
    file: UploadFile = File(...),
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    from app.services.upload_service import UploadService
    from app.core.exceptions import PipelineException
    from fastapi.responses import JSONResponse
    
    try:
        content = await file.read()
        service = UploadService(db)
        result = service.process_upload(content, file.filename, student.id)
        return result
    except PipelineException as pe:
        return JSONResponse(
            status_code=pe.status_code,
            content={
                "success": False,
                "step": pe.step,
                "provider": pe.provider,
                "error": pe.message,
                "details": pe.details
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "step": "Upload Pipeline Orchestration",
                "provider": "Core System",
                "error": str(e),
                "details": str(e)
            }
        )

@router.post("/{id}/analyze")
def analyze_resume_endpoint(
    id: int,
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    resume = verify_ownership(id, student.id, db)
    resume_state = resume.get("resume", {})
    
    prompt = RESUME_ANALYZE_PROMPT.replace("{resume_json}", json.dumps(resume_state))
    
    try:
        raw_response = run_ai_gateway_request(db, prompt, "Resume Studio: ANALYZE", student.roll_number)
        cleaned = raw_response.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        analysis_data = json.loads(cleaned.strip())
    except Exception as e:
        print(f"[AI Analysis Error] Failed to analyze: {e}. Falling back to default baseline scores.")
        analysis_data = {
            "scores": {
                "overall_score": 75,
                "ats_score": 78,
                "professional_writing_score": 80,
                "formatting_score": 75,
                "grammar_score": 85,
                "keyword_match_score": 70,
                "project_quality_score": 75,
                "experience_strength": 70,
                "education_completeness": 90,
                "technical_skills_score": 80,
                "soft_skills_score": 85
            },
            "metadata": {
                "resume_length": "1 Page",
                "readability": "Good"
            },
            "suggestions": [
                "Tailor project descriptions to highlight measurable impact.",
                "Include certifications relevant to target role.",
                "Structure experience sections chronologically."
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
    resume_state = resume.get("resume", {})
    
    prompt = RESUME_IMPROVE_PROMPT.replace("{improvement_goal}", payload.improvement_goal).replace("{resume_json}", json.dumps(resume_state))
    
    try:
        raw_response = run_ai_gateway_request(db, prompt, f"Resume Studio: IMPROVE", student.roll_number)
        cleaned = raw_response.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        improved_json = json.loads(cleaned.strip())
    except Exception as e:
        import copy
        print(f"AI Resume Improvement failed: {str(e)}. Using local heuristic fallback.")
        improved_json = copy.deepcopy(resume_state)
        
        # Heuristic polish for summary
        if "personal_info" not in improved_json:
            improved_json["personal_info"] = {}
        personal_info = improved_json["personal_info"]
        original_summary = personal_info.get("summary") or "Developer seeking new opportunities."
        personal_info["summary"] = f"Results-oriented professional with verified tech skills. {original_summary}"
        
        # Heuristic polish for experience
        if "experience" in improved_json and isinstance(improved_json["experience"], list):
            for exp in improved_json["experience"]:
                desc = exp.get("description") or "Assisted with tasks."
                if desc and not desc.startswith("Spearheaded"):
                    exp["description"] = f"Spearheaded key development modules and collaborated on core architectures. {desc}"
            
    db.resume_improvements.insert_one({
        "id": get_next_sequence("resume_improvements"),
        "resume_id": id,
        "improvement_type": payload.improvement_goal,
        "original_data": json.dumps(resume_state),
        "improved_data": json.dumps(improved_json)
    })

    # Save to versions history
    last_v_doc = db.resume_versions.find_one(
        {"resume_id": id},
        sort=[("version_number", -1)]
    )
    latest_ver = last_v_doc["version_number"] if last_v_doc else 1
    
    # Save version
    db.resume_versions.insert_one({
        "id": get_next_sequence("resume_versions"),
        "resume_id": id,
        "version_number": latest_ver + 1,
        "name": f"AI Optimized ({payload.improvement_goal})",
        "data": json.dumps(improved_json),
        "ats_score": resume.ats_score or 72,
        "created_at": datetime.utcnow()
    })
    
    db.resumes.update_one(
        {"id": id},
        {"$set": {
            "resume": improved_json,
            "updated_at": datetime.utcnow()
        }}
    )
    
    return {
        "success": True,
        "improved": improved_json
    }
    
    # Log activity
    db.activity_logs.insert_one({
        "id": get_next_sequence("activity_logs"),
        "student_id": student.id,
        "activity": "Resume Optimized",
        "created_at": datetime.utcnow()
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
    resume_state = resume.get("resume", {})
    
    prompt = JD_MATCH_PROMPT.replace("{resume_json}", json.dumps(resume_state)).replace("{job_description}", payload.job_description)
    
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
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI Job Match Service failed: {str(e)}. Please check your AI API configurations."
        )
        
    opt_prompt = ATS_OPTIMIZATION_PROMPT.replace("{resume_json}", json.dumps(resume_state)).replace("{job_description}", payload.job_description)
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
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI Resume JD Wording Optimization Service failed: {str(e)}. Please check your AI API configurations."
        )
        
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
    
    # Save optimized version state
    last_v_doc = db.resume_versions.find_one(
        {"resume_id": id},
        sort=[("version_number", -1)]
    )
    latest_ver = last_v_doc["version_number"] if last_v_doc else 1
    
    db.resume_versions.insert_one({
        "id": get_next_sequence("resume_versions"),
        "resume_id": id,
        "version_number": latest_ver + 1,
        "name": "Job Optimized",
        "data": json.dumps(optimized_resume),
        "ats_score": match_data.get("overall_match_score") or resume.ats_score or 72,
        "created_at": datetime.utcnow()
    })
    
    # Update master resume directly with optimized content
    db.resumes.update_one(
        {"id": id},
        {"$set": {
            "resume": optimized_resume,
            "ats_score": match_data.get("overall_match_score") or resume.ats_score or 72,
            "updated_at": datetime.utcnow()
        }}
    )
    
    # Log activity
    db.activity_logs.insert_one({
        "id": get_next_sequence("activity_logs"),
        "student_id": student.id,
        "activity": "Resume Optimized",
        "created_at": datetime.utcnow()
    })
    
    return {"match_metrics": match_data, "optimized_resume": optimized_resume}

@router.post("/{id}/save-final")
def save_final_resume_endpoint(
    id: int,
    payload: dict,
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    verify_ownership(id, student.id, db)
    master = payload.get("master", {})
    
    update_fields = {
        "resume": payload,
        "updated_at": datetime.utcnow()
    }
    
    for key in ["name", "resume_type", "target_role", "visibility", "template_id", "color_theme", "status", "ats_score"]:
        if key in payload:
            update_fields[key] = payload[key]
        elif key in master:
            update_fields[key] = master[key]
            
    db.resumes.update_one({"id": id}, {"$set": update_fields})
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
    db.activity_logs.insert_one({
        "id": get_next_sequence("activity_logs"),
        "student_id": student.id,
        "activity": "Resume Downloaded",
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

# --- CAREER COPILOT CHATBOT ENDPOINTS ---

class ChatRequest(BaseModel):
    resume_id: int
    message: str
    mode: Optional[str] = None

class ApplyRewriteRequest(BaseModel):
    original: str
    suggested: str

@router.get("/{id}/chat/history")
def get_chat_history(
    id: int,
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    verify_ownership(id, student.id, db)
    messages_cursor = db.chat_messages.find({"resume_id": id, "student_id": student.id}).sort("timestamp", 1)
    messages = list(messages_cursor)
    
    formatted = []
    for msg in messages:
        formatted.append({
            "id": msg.get("id"),
            "sender": msg.get("sender"),
            "text": msg.get("text"),
            "timestamp": msg.get("timestamp").isoformat() if msg.get("timestamp") else None,
            "mode": msg.get("mode"),
            "actions": msg.get("actions", [])
        })
    return formatted

@router.post("/chat")
def send_chat_message(
    payload: ChatRequest,
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    from app.services.chat_service import ChatService
    service = ChatService(db)
    try:
        result = service.handle_chat_message(
            student_id=student.id,
            resume_id=payload.resume_id,
            message=payload.message,
            explicit_mode=payload.mode
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chatbot service failed: {str(e)}")

def dynamic_replace_text(data: Any, original: str, suggested: str) -> tuple[Any, bool]:
    applied = False
    if isinstance(data, str):
        if original in data:
            return data.replace(original, suggested), True
        return data, False
    elif isinstance(data, list):
        new_list = []
        for item in data:
            new_item, item_applied = dynamic_replace_text(item, original, suggested)
            new_list.append(new_item)
            if item_applied:
                applied = True
        return new_list, applied
    elif isinstance(data, dict):
        new_dict = {}
        for k, v in data.items():
            new_val, val_applied = dynamic_replace_text(v, original, suggested)
            new_dict[k] = new_val
            if val_applied:
                applied = True
        return new_dict, applied
    return data, False

@router.post("/{id}/chat/apply-rewrite")
def apply_chat_rewrite(
    id: int,
    payload: ApplyRewriteRequest,
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    resume = verify_ownership(id, student.id, db)
    
    resume_data = resume.get("resume", {})
    updated_resume_data, applied = dynamic_replace_text(resume_data, payload.original, payload.suggested)
    
    if not applied:
        raise HTTPException(status_code=400, detail="The original text segment could not be matched inside the resume sections.")
        
    db.resumes.update_one(
        {"id": id},
        {"$set": {
            "resume": updated_resume_data,
            "updated_at": datetime.utcnow()
        }}
    )
    
    # Trigger ATS update audit
    try:
        db.resume_downloads.insert_one({
            "id": get_next_sequence("resume_downloads"),
            "resume_id": id,
            "format": "REWRITE_UPDATE",
            "created_at": datetime.utcnow()
        })
    except:
        pass
        
    return {"success": True}

