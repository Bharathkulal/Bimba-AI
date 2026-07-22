import json
import random
import io
import re
import os
import shutil
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

# Models and DB
from app.database.session import get_db
from app.models.student import Student
from app.models.resume_studio import (
    ResumeMaster, ResumeVersion as ResumeStudioVersion, ResumeEducation,
    ResumeExperience, ResumeProject, ResumeSkill, ResumeCertificate,
    ResumeTemplate, ResumeDownload, ResumeATS, ResumeAILog, CareerReadiness,
    ResumeAnalysis, ResumeImprovementHistory, JobDescriptionOptimization
)
from app.models.ai_admin import AIGatewayLog, AIProvider
from app.models.academic import Department, Subject
from app.models.analytics import ActivityLog
from app.api.analytics import get_current_student
from app.api.admin_portal import log_audit
from app.services.ai_gateway import run_ai_gateway_request
from app.models.communications import Notification
from app.ai.resume_prompts import (
    RESUME_PARSE_PROMPT, RESUME_ANALYZE_PROMPT, RESUME_IMPROVE_PROMPT,
    JD_MATCH_PROMPT, ATS_OPTIMIZATION_PROMPT
)
from app.services.docx_exporter import generate_docx_resume


# ReportLab PDF imports
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, PageBreak
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
    phone: Optional[str] = None
    address: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    portfolio: Optional[str] = None
    website: Optional[str] = None
    profile_photo: Optional[str] = None
    summary: Optional[str] = None
    languages_list: Optional[str] = None
    achievements_list: Optional[str] = None
    custom_sections: Optional[str] = None


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
def verify_ownership(resume_id: int, student_id: int, db: Session) -> ResumeMaster:
    resume = db.query(ResumeMaster).filter(ResumeMaster.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    if resume.student_id != student_id:
        raise HTTPException(status_code=403, detail="Access denied: You do not own this resume")
    return resume

@router.get("/templates")
def get_templates(db: Session = Depends(get_db)):
    return db.query(ResumeTemplate).all()

@router.get("/all")
def get_student_resumes(student: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    resumes = db.query(ResumeMaster).filter(ResumeMaster.student_id == student.id).all()
    result = []
    for r in resumes:
        downloads = db.query(ResumeDownload).filter(ResumeDownload.resume_id == r.id).count()
        result.append({
            "id": r.id,
            "name": r.name,
            "resume_type": r.resume_type,
            "target_role": r.target_role,
            "status": r.status,
            "ats_score": r.ats_score,
            "updated_at": r.updated_at.isoformat(),
            "visibility": r.visibility,
            "downloads_count": downloads
        })
    return result

@router.get("/{id}")
def get_resume_detail(id: int, student: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    resume = verify_ownership(id, student.id, db)
    
    education = db.query(ResumeEducation).filter(ResumeEducation.resume_id == id).all()
    experience = db.query(ResumeExperience).filter(ResumeExperience.resume_id == id).all()
    projects = db.query(ResumeProject).filter(ResumeProject.resume_id == id).all()
    skills = db.query(ResumeSkill).filter(ResumeSkill.resume_id == id).all()
    certificates = db.query(ResumeCertificate).filter(ResumeCertificate.resume_id == id).all()
    ats = db.query(ResumeATS).filter(ResumeATS.resume_id == id).first()
    readiness = db.query(CareerReadiness).filter(CareerReadiness.resume_id == id).first()

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
            "phone": resume.phone,
            "address": resume.address,
            "linkedin": resume.linkedin,
            "github": resume.github,
            "portfolio": resume.portfolio,
            "website": resume.website,
            "profile_photo": resume.profile_photo,
            "summary": resume.summary,
            "languages_list": resume.languages_list,
            "achievements_list": resume.achievements_list,
            "custom_sections": resume.custom_sections,
            "updated_at": resume.updated_at.isoformat()
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
def create_resume(payload: ResumeCreateRequest, student: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    # Create resume
    resume = ResumeMaster(
        student_id=student.id,
        name=payload.name,
        resume_type=payload.resume_type,
        target_role=payload.target_role,
        career_objective=payload.career_objective,
        preferred_industry=payload.preferred_industry,
        language=payload.language,
        expected_salary=payload.expected_salary,
        visibility=payload.visibility,
        phone=payload.phone,
        address=payload.address,
        linkedin=payload.linkedin,
        github=payload.github,
        portfolio=payload.portfolio,
        website=payload.website,
        profile_photo=payload.profile_photo,
        summary=payload.summary,
        languages_list=payload.languages_list,
        achievements_list=payload.achievements_list,
        custom_sections=payload.custom_sections,
        status="Draft"
    )

    db.add(resume)
    db.commit()
    db.refresh(resume)

    # Initialize default education from student database
    edu = ResumeEducation(
        resume_id=resume.id,
        institution=student.section or "Bimba University",
        degree=student.department,
        passing_year=2026,
        cgpa=9.1
    )
    db.add(edu)

    # Initialize empty default ATS scorecard
    ats = ResumeATS(
        resume_id=resume.id,
        overall_score=72,
        formatting_score=75,
        keyword_match=68,
        grammar_score=80,
        readability_score=70,
        recruiter_score=68,
        missing_keywords="Docker, AWS, System Design",
        suggestions="Integrate cloud experience bullet points. Fix grammar in profile bio."
    )
    db.add(ats)
    db.commit()

    # Log action
    log = ActivityLog(student_id=student.id, activity=f"Created Resume Studio: {payload.name}")
    db.add(log)
    
    # Generate Notification
    notif = Notification(
        student_id=student.id,
        category="Resume",
        type="Resume Created",
        message=f"Your new resume '{payload.name}' has been created successfully."
    )
    db.add(notif)
    db.commit()

    return {"success": True, "id": resume.id}

@router.put("/{id}/update")
def update_resume(id: int, payload: dict, student: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    resume = verify_ownership(id, student.id, db)
    
    # Update fields dynamically
    for key, val in payload.items():
        if hasattr(resume, key):
            setattr(resume, key, val)
            
    # Generate Notification
    notif = Notification(
        student_id=student.id,
        category="Resume",
        type="Resume Updated",
        message=f"Your resume '{resume.name}' details were updated successfully."
    )
    db.add(notif)
    db.commit()
    return {"success": True}

@router.delete("/{id}")
def delete_resume(id: int, student: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    resume = verify_ownership(id, student.id, db)
    r_name = resume.name
    db.delete(resume)
    
    # Generate Notification
    notif = Notification(
        student_id=student.id,
        category="Resume",
        type="Resume Deleted",
        message=f"Your resume '{r_name}' was deleted successfully."
    )
    db.add(notif)
    db.commit()
    return {"success": True}

@router.post("/{id}/duplicate")
def duplicate_resume(id: int, student: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    resume = verify_ownership(id, student.id, db)
    
    # Create duplicate master
    new_master = ResumeMaster(
        student_id=student.id,
        name=f"Copy of {resume.name}",
        resume_type=resume.resume_type,
        target_role=resume.target_role,
        career_objective=resume.career_objective,
        preferred_industry=resume.preferred_industry,
        language=resume.language,
        expected_salary=resume.expected_salary,
        visibility=resume.visibility,
        template_id=resume.template_id,
        color_theme=resume.color_theme,
        status="Draft",
        ats_score=resume.ats_score
    )
    db.add(new_master)
    db.commit()
    db.refresh(new_master)

    # Duplicate education, experience, projects, skills, certificates
    for edu in db.query(ResumeEducation).filter(ResumeEducation.resume_id == id).all():
        db.add(ResumeEducation(resume_id=new_master.id, institution=edu.institution, degree=edu.degree, board=edu.board, percentage=edu.percentage, cgpa=edu.cgpa, passing_year=edu.passing_year, achievements=edu.achievements))
    for exp in db.query(ResumeExperience).filter(ResumeExperience.resume_id == id).all():
        db.add(ResumeExperience(resume_id=new_master.id, company=exp.company, position=exp.position, duration=exp.duration, description=exp.description, achievements=exp.achievements))
    for proj in db.query(ResumeProject).filter(ResumeProject.resume_id == id).all():
        db.add(ResumeProject(resume_id=new_master.id, name=proj.name, description=proj.description, tech_stack=proj.tech_stack, role=proj.role, duration=proj.duration, github_link=proj.github_link, live_demo=proj.live_demo, achievements=proj.achievements))
    for skill in db.query(ResumeSkill).filter(ResumeSkill.resume_id == id).all():
        db.add(ResumeSkill(resume_id=new_master.id, category=skill.category, name=skill.name, level=skill.level))
    for cert in db.query(ResumeCertificate).filter(ResumeCertificate.resume_id == id).all():
        db.add(ResumeCertificate(resume_id=new_master.id, name=cert.name, organization=cert.organization, issue_date=cert.issue_date, credential_id=cert.credential_id, credential_url=cert.credential_url))
    
    # Generate Notification
    notif = Notification(
        student_id=student.id,
        category="Resume",
        type="Resume Duplicated",
        message=f"Your resume '{resume.name}' has been duplicated as 'Copy of {resume.name}' successfully."
    )
    db.add(notif)
    db.commit()
    return {"success": True, "new_id": new_master.id}

@router.post("/{id}/archive")
def archive_resume(id: int, student: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    resume = verify_ownership(id, student.id, db)
    resume.status = "Archived"
    db.commit()
    return {"success": True}

# --- SUB-SECTIONS ENDPOINTS ---

@router.post("/{id}/education")
def add_education(id: int, payload: EducationSchema, student: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    verify_ownership(id, student.id, db)
    edu = ResumeEducation(resume_id=id, **payload.model_dump())
    db.add(edu)
    db.commit()
    return {"success": True}

@router.delete("/education/{edu_id}")
def delete_education(edu_id: int, student: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    edu = db.query(ResumeEducation).filter(ResumeEducation.id == edu_id).first()
    if edu:
        verify_ownership(edu.resume_id, student.id, db)
        db.delete(edu)
        db.commit()
    return {"success": True}

@router.post("/{id}/experience")
def add_experience(id: int, payload: ExperienceSchema, student: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    verify_ownership(id, student.id, db)
    exp = ResumeExperience(resume_id=id, **payload.model_dump())
    db.add(exp)
    db.commit()
    return {"success": True}

@router.delete("/experience/{exp_id}")
def delete_experience(exp_id: int, student: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    exp = db.query(ResumeExperience).filter(ResumeExperience.id == exp_id).first()
    if exp:
        verify_ownership(exp.resume_id, student.id, db)
        db.delete(exp)
        db.commit()
    return {"success": True}

@router.post("/{id}/project")
def add_project(id: int, payload: ProjectSchema, student: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    verify_ownership(id, student.id, db)
    proj = ResumeProject(resume_id=id, **payload.model_dump())
    db.add(proj)
    db.commit()
    return {"success": True}

@router.delete("/project/{proj_id}")
def delete_project(proj_id: int, student: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    proj = db.query(ResumeProject).filter(ResumeProject.id == proj_id).first()
    if proj:
        verify_ownership(proj.resume_id, student.id, db)
        db.delete(proj)
        db.commit()
    return {"success": True}

@router.post("/{id}/skill")
def add_skill(id: int, payload: SkillSchema, student: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    verify_ownership(id, student.id, db)
    # Check if duplicate skill
    existing = db.query(ResumeSkill).filter(ResumeSkill.resume_id == id, ResumeSkill.name == payload.name).first()
    if existing:
        existing.level = payload.level
    else:
        skill = ResumeSkill(resume_id=id, **payload.model_dump())
        db.add(skill)
    db.commit()
    return {"success": True}

@router.delete("/skill/{skill_id}")
def delete_skill(skill_id: int, student: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    skill = db.query(ResumeSkill).filter(ResumeSkill.id == skill_id).first()
    if skill:
        verify_ownership(skill.resume_id, student.id, db)
        db.delete(skill)
        db.commit()
    return {"success": True}

@router.post("/{id}/certificate")
def add_certificate(id: int, payload: CertificateSchema, student: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    verify_ownership(id, student.id, db)
    cert = ResumeCertificate(resume_id=id, **payload.model_dump())
    db.add(cert)
    
    # Generate Notification
    notif = Notification(
        student_id=student.id,
        category="Certificates",
        type="Certificate Added",
        message=f"New certification '{payload.name}' issued by {payload.organization} was added to your profile."
    )
    db.add(notif)
    db.commit()
    return {"success": True}

@router.delete("/certificate/{cert_id}")
def delete_certificate(cert_id: int, student: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    cert = db.query(ResumeCertificate).filter(ResumeCertificate.id == cert_id).first()
    if cert:
        verify_ownership(cert.resume_id, student.id, db)
        db.delete(cert)
        db.commit()
    return {"success": True}

# --- AI OPERATION ENDPOINTS ---

def log_ai_event(resume_id: int, action: str, prompt: str, response: str, db: Session):
    # Log to studio AI logs
    log = ResumeAILog(
        resume_id=resume_id,
        action_type=action,
        prompt_used=prompt,
        response_received=response
    )
    db.add(log)
    db.commit()

@router.post("/{id}/ai/generate-summary")
def ai_generate_summary(id: int, payload: AISummaryRequest, student: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    verify_ownership(id, student.id, db)
    
    prompt = f"Generate a professional, high-impact resume summary for a {payload.role} with skills: {', '.join(payload.skills)} and experience: {payload.experience or 'None'}. Return only the paragraph description."
    summary = run_ai_gateway_request(db, prompt, f"Resume Studio: SUMMARY", student.roll_number)
    
    log_ai_event(id, "summary", prompt, summary, db)
    return {"summary": summary}

@router.post("/{id}/ai/rewrite")
def ai_rewrite_text(id: int, payload: AIRewriteRequest, student: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    verify_ownership(id, student.id, db)
    
    prompt = f"Improve and rewrite this resume bullet point text to make it sound professional and high-impact. Target role: {payload.target_role or 'software engineer'}. Text: {payload.text}. Return only the improved text."
    rewritten = run_ai_gateway_request(db, prompt, f"Resume Studio: REWRITE", student.roll_number)
    
    log_ai_event(id, "rewrite", prompt, rewritten, db)
    return {"rewritten": rewritten}

@router.post("/{id}/ai/roadmap")
def ai_generate_roadmap(id: int, payload: CareerRoadmapRequest, student: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    verify_ownership(id, student.id, db)
    
    prompt = f"Generate a detailed career roadmap and study plan for a {payload.role} with current skills: {', '.join(payload.skills)}. Return a JSON object with keys: roadmap, skills_gap, recommended_courses, recommended_certifications, interview_prep (with 3 sample questions)."
    
    raw_response = run_ai_gateway_request(db, prompt, f"Resume Studio: ROADMAP", student.roll_number)
    
    try:
        cleaned = raw_response.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        roadmap = json.loads(cleaned.strip())
    except Exception:
        roadmap = {
            "roadmap": raw_response,
            "skills_gap": "AWS, Docker, Microservices, CI/CD",
            "recommended_courses": "Udemy: Microservices with Node.js & React",
            "recommended_certifications": "AWS Certified Solutions Architect",
            "interview_prep": "Q1: Explain REST API constraints.\nQ2: What is database indexing?\nQ3: What is the difference between Docker and VM?"
        }
        
    readiness = db.query(CareerReadiness).filter(CareerReadiness.resume_id == id).first()
    if not readiness:
        readiness = CareerReadiness(
            student_id=student.id,
            resume_id=id,
            readiness_score=85,
            job_readiness="Ready",
            skill_gap=roadmap.get("skills_gap", ""),
            recommended_certifications=roadmap.get("recommended_certifications", ""),
            recommended_courses=roadmap.get("recommended_courses", ""),
            interview_readiness=88,
            learning_roadmap=roadmap.get("roadmap", "")
        )
        db.add(readiness)
    else:
        readiness.readiness_score = 85
        readiness.learning_roadmap = roadmap.get("roadmap", "")
        readiness.skill_gap = roadmap.get("skills_gap", "")
    db.commit()
    
    log_ai_event(id, "career_roadmap", prompt, raw_response, db)
    return roadmap


@router.post("/{id}/ai/full-generate")
def ai_full_generate(id: int, student: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    resume = verify_ownership(id, student.id, db)
    
    # Trigger full mock AI generation process. Populate skills and projects
    skills = [
        ("Programming", "Java", 4),
        ("Programming", "Python", 4),
        ("Web", "React", 4),
        ("Web", "Node", 3),
        ("Databases", "PostgreSQL", 4),
        ("Tools", "Git", 5),
        ("Tools", "Docker", 3)
    ]
    
    for cat, name, lvl in skills:
        existing = db.query(ResumeSkill).filter(ResumeSkill.resume_id == id, ResumeSkill.name == name).first()
        if not existing:
            db.add(ResumeSkill(resume_id=id, category=cat, name=name, level=lvl))
            
    # Mock projects
    projs = [
        ("Bimba AI Resume Builder", "Designed and deployed an enterprise-level college administration and ATS analyzer system.", "React, FastAPI, Sqlite", "Lead Developer", "2 Months", "https://github.com/placement/bimba"),
        ("CivicSolve Portal", "Built a public forum web app to report and resolve local public utility issues.", "HTML, CSS, Node.js", "Contributor", "1 Month", "https://github.com/civic/solve")
    ]
    
    for name, desc, tech, role, dur, link in projs:
        existing = db.query(ResumeProject).filter(ResumeProject.resume_id == id, ResumeProject.name == name).first()
        if not existing:
            db.add(ResumeProject(resume_id=id, name=name, description=desc, tech_stack=tech, role=role, duration=dur, github_link=link))
            
    # Set summary
    resume.career_objective = "Passionate and detail-oriented Software Development Engineer targeting roles in backend systems and cloud platforms. Skilled in building API engines and automating workflows."
    resume.ats_score = 88
    
    # Update ATS Scorecard
    ats = db.query(ResumeATS).filter(ResumeATS.resume_id == id).first()
    if ats:
        ats.overall_score = 88
        ats.formatting_score = 90
        ats.keyword_match = 86
        ats.grammar_score = 92
        ats.readability_score = 85
        ats.recruiter_score = 87
    
    db.commit()
    
    log_ai_event(id, "full_generate", "Full profile AI generation", "Successfully populated projects, skills, and summary", db)
    return {"success": True}

# --- VERSIONS HISTORY ENDPOINTS ---

@router.get("/{id}/versions")
def get_versions(id: int, student: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    verify_ownership(id, student.id, db)
    return db.query(ResumeStudioVersion).filter(ResumeStudioVersion.resume_id == id).order_by(ResumeStudioVersion.version_number.desc()).all()

@router.post("/{id}/versions/save")
def save_version(id: int, name: str = Query(...), student: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    resume = verify_ownership(id, student.id, db)
    
    # Serialize resume details
    education = db.query(ResumeEducation).filter(ResumeEducation.resume_id == id).all()
    experience = db.query(ResumeExperience).filter(ResumeExperience.resume_id == id).all()
    projects = db.query(ResumeProject).filter(ResumeProject.resume_id == id).all()
    skills = db.query(ResumeSkill).filter(ResumeSkill.resume_id == id).all()
    certificates = db.query(ResumeCertificate).filter(ResumeCertificate.resume_id == id).all()
    
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
        "education": [e.__dict__ for e in education],
        "experience": [exp.__dict__ for exp in experience],
        "projects": [p.__dict__ for p in projects],
        "skills": [s.__dict__ for s in skills],
        "certificates": [c.__dict__ for c in certificates],
    }
    
    # Remove SQLAlchemy state instance tags before serialization
    for key in ["education", "experience", "projects", "skills", "certificates"]:
        for item in state[key]:
            item.pop('_sa_instance_state', None)
            item.pop('id', None)
            item.pop('resume_id', None)

    latest_ver = db.query(func.max(ResumeStudioVersion.version_number)).filter(ResumeStudioVersion.resume_id == id).scalar() or 0
    
    ver = ResumeStudioVersion(
        resume_id=id,
        version_number=latest_ver + 1,
        name=name,
        data=json.dumps(state),
        ats_score=resume.ats_score
    )
    db.add(ver)
    db.commit()
    return {"success": True, "version_number": ver.version_number}

@router.post("/versions/{version_id}/restore")
def restore_version(version_id: int, student: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    ver = db.query(ResumeStudioVersion).filter(ResumeStudioVersion.id == version_id).first()
    if not ver:
        raise HTTPException(status_code=404, detail="Version not found")
        
    resume = verify_ownership(ver.resume_id, student.id, db)
    
    state = json.loads(ver.data)
    
    # Restore Master
    m = state["master"]
    resume.name = m["name"]
    resume.resume_type = m["resume_type"]
    resume.target_role = m["target_role"]
    resume.career_objective = m["career_objective"]
    resume.preferred_industry = m["preferred_industry"]
    resume.language = m["language"]
    resume.expected_salary = m["expected_salary"]
    resume.visibility = m["visibility"]
    resume.template_id = m["template_id"]
    resume.color_theme = m["color_theme"]
    resume.ats_score = ver.ats_score
    
    # Clear and restore child lists
    db.query(ResumeEducation).filter(ResumeEducation.resume_id == resume.id).delete()
    db.query(ResumeExperience).filter(ResumeExperience.resume_id == resume.id).delete()
    db.query(ResumeProject).filter(ResumeProject.resume_id == resume.id).delete()
    db.query(ResumeSkill).filter(ResumeSkill.resume_id == resume.id).delete()
    db.query(ResumeCertificate).filter(ResumeCertificate.resume_id == resume.id).delete()
    
    for edu in state["education"]:
        db.add(ResumeEducation(resume_id=resume.id, **edu))
    for exp in state["experience"]:
        db.add(ResumeExperience(resume_id=resume.id, **exp))
    for proj in state["projects"]:
        db.add(ResumeProject(resume_id=resume.id, **proj))
    for skill in state["skills"]:
        db.add(ResumeSkill(resume_id=resume.id, **skill))
    for cert in state["certificates"]:
        db.add(ResumeCertificate(resume_id=resume.id, **cert))
        
    db.commit()
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
    return colors.HexColor('#1E3A8A') # Default Blue

@router.get("/{id}/pdf")
def get_pdf_export(id: int, student: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    verify_ownership(id, student.id, db)
    
    # Fetch all details
    resume = db.query(ResumeMaster).filter(ResumeMaster.id == id).first()
    education = db.query(ResumeEducation).filter(ResumeEducation.resume_id == id).all()
    experience = db.query(ResumeExperience).filter(ResumeExperience.resume_id == id).all()
    projects = db.query(ResumeProject).filter(ResumeProject.resume_id == id).all()
    skills = db.query(ResumeSkill).filter(ResumeSkill.resume_id == id).all()
    certificates = db.query(ResumeCertificate).filter(ResumeCertificate.resume_id == id).all()
    
    # Log download action
    dl = ResumeDownload(resume_id=id, format="PDF")
    db.add(dl)
    db.commit()
    
    # Fetch template theme colors
    primary_color = colors.HexColor('#1E3A8A')
    if resume.color_theme:
        primary_color = resolve_template_color(resume.color_theme)
        
    # Setup reportlab document
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
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=primary_color,
        alignment=1, # Centered
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
        alignment=2 # Right align
    )

    story = []
    
    # Header block
    name = student.student_name
    contact_parts = []
    if student.email:
        contact_parts.append(student.email)
    if resume.phone:
        contact_parts.append(resume.phone)
    if resume.address:
        contact_parts.append(resume.address)
        
    sub_parts = []
    if resume.linkedin:
        sub_parts.append(f"LinkedIn: {resume.linkedin}")
    if resume.github:
        sub_parts.append(f"GitHub: {resume.github}")
    if resume.portfolio:
        sub_parts.append(f"Portfolio: {resume.portfolio}")
        
    story.append(Paragraph(name, title_style))
    story.append(Paragraph(" • ".join(contact_parts) + "<br/>" + " | ".join(sub_parts), subtitle_style))
    
    # Divider line
    story.append(Table([['']], colWidths=[532], rowHeights=[1], style=TableStyle([
        ('LINEBELOW', (0,0), (-1,-1), 1.5, primary_color),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ])))
    story.append(Spacer(1, 10))
    
    # Professional Summary
    summary_text = resume.summary or resume.career_objective
    if summary_text:
        story.append(Paragraph("PROFESSIONAL SUMMARY", section_title))
        story.append(Paragraph(summary_text, body_style))
        story.append(Spacer(1, 8))
        
    # Education
    if education:
        story.append(Paragraph("EDUCATION", section_title))
        for edu in education:
            edu_table_data = [
                [Paragraph(f"<b>{edu.institution}</b>", body_style), Paragraph(str(edu.passing_year), meta_right)],
                [Paragraph(f"{edu.degree} — CGPA: {edu.cgpa}% / CGPA" if edu.cgpa else edu.degree, body_style), Paragraph(edu.achievements or '', meta_right)]
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
        
    # Experience
    if experience:
        story.append(Paragraph("PROFESSIONAL EXPERIENCE", section_title))
        for exp in experience:
            exp_table_data = [
                [Paragraph(f"<b>{exp.position}</b> at <b>{exp.company}</b>", body_style), Paragraph(exp.duration, meta_right)],
                [Paragraph(exp.description, body_style), '']
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
        
    # Projects
    if projects:
        story.append(Paragraph("ACADEMIC & PERSONAL PROJECTS", section_title))
        for proj in projects:
            proj_header = f"<b>{proj.name}</b>"
            if proj.tech_stack:
                proj_header += f" (Tech: {proj.tech_stack})"
            proj_table_data = [
                [Paragraph(proj_header, body_style), Paragraph(proj.duration or '', meta_right)],
                [Paragraph(proj.description, body_style), '']
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
        
    # Skills
    if skills:
        story.append(Paragraph("TECHNICAL SKILLS", section_title))
        skills_by_category = {}
        for s in skills:
            skills_by_category.setdefault(s.category, []).append(f"{s.name} (Lvl {s.level})")
        
        skill_lines = []
        for cat, sks in skills_by_category.items():
            skill_lines.append(f"<b>{cat}:</b> {', '.join(sks)}")
        story.append(Paragraph("<br/>".join(skill_lines), body_style))
        story.append(Spacer(1, 8))
        
    # Certificates
    if certificates:
        story.append(Paragraph("CERTIFICATIONS", section_title))
        for cert in certificates:
            cert_table_data = [
                [Paragraph(f"<b>{cert.name}</b> — {cert.organization}", body_style), Paragraph(cert.issue_date or '', meta_right)]
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
        
    # Achievements
    if resume.achievements_list:
        try:
            ach_json = json.loads(resume.achievements_list)
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
def get_public_resume(id: int, db: Session = Depends(get_db)):
    resume = db.query(ResumeMaster).filter(ResumeMaster.id == id).first()
    if not resume or resume.visibility != "Public":
        raise HTTPException(status_code=403, detail="This resume is private or does not exist")
        
    student = db.query(Student).filter(Student.id == resume.student_id).first()
    education = db.query(ResumeEducation).filter(ResumeEducation.resume_id == id).all()
    experience = db.query(ResumeExperience).filter(ResumeExperience.resume_id == id).all()
    projects = db.query(ResumeProject).filter(ResumeProject.resume_id == id).all()
    skills = db.query(ResumeSkill).filter(ResumeSkill.resume_id == id).all()
    certificates = db.query(ResumeCertificate).filter(ResumeCertificate.resume_id == id).all()
    
    return {
        "student": {
            "student_name": student.student_name,
            "email": student.email,
            "department": student.department,
            "semester": student.semester
        },
        "master": {
            "name": resume.name,
            "target_role": resume.target_role,
            "career_objective": resume.career_objective,
            "template_id": resume.template_id,
            "color_theme": resume.color_theme
        },
        "education": education,
        "experience": experience,
        "projects": projects,
        "skills": skills,
        "certificates": certificates
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
    db: Session = Depends(get_db)
):
    if not file.filename.lower().endswith((".pdf", ".docx")):
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF or DOCX.")
    
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds limit of 5MB.")
        
    # Store original file securely
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
    db: Session = Depends(get_db)
):
    resume = verify_ownership(id, student.id, db)
    
    education = db.query(ResumeEducation).filter(ResumeEducation.resume_id == id).all()
    experience = db.query(ResumeExperience).filter(ResumeExperience.resume_id == id).all()
    projects = db.query(ResumeProject).filter(ResumeProject.resume_id == id).all()
    skills = db.query(ResumeSkill).filter(ResumeSkill.resume_id == id).all()
    certificates = db.query(ResumeCertificate).filter(ResumeCertificate.resume_id == id).all()
    
    resume_state = {
        "master": {
            "name": resume.name,
            "resume_type": resume.resume_type,
            "target_role": resume.target_role,
            "career_objective": resume.career_objective,
            "preferred_industry": resume.preferred_industry,
            "summary": resume.summary or resume.career_objective,
            "achievements_list": resume.achievements_list
        },
        "education": [{"institution": e.institution, "degree": e.degree, "passing_year": e.passing_year, "cgpa": e.cgpa, "achievements": e.achievements} for e in education],
        "experience": [{"company": exp.company, "position": exp.position, "duration": exp.duration, "description": exp.description} for exp in experience],
        "projects": [{"name": p.name, "tech_stack": p.tech_stack, "description": p.description, "duration": p.duration} for p in projects],
        "skills": [{"category": s.category, "name": s.name, "level": s.level} for s in skills],
        "certificates": [{"name": c.name, "organization": c.organization, "issue_date": c.issue_date} for c in certificates]
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
        
    analysis = db.query(ResumeAnalysis).filter(ResumeAnalysis.resume_id == id).first()
    scores = analysis_data.get("scores", {})
    metadata = analysis_data.get("metadata", {})
    
    if not analysis:
        analysis = ResumeAnalysis(
            resume_id=id,
            overall_score=scores.get("overall_score", 70),
            ats_score=scores.get("ats_score", 70),
            professional_writing_score=scores.get("professional_writing_score", 70),
            formatting_score=scores.get("formatting_score", 70),
            grammar_score=scores.get("grammar_score", 70),
            keyword_match_score=scores.get("keyword_match_score", 70),
            project_quality_score=scores.get("project_quality_score", 70),
            experience_strength=scores.get("experience_strength", 70),
            education_completeness=scores.get("education_completeness", 70),
            technical_skills_score=scores.get("technical_skills_score", 70),
            soft_skills_score=scores.get("soft_skills_score", 70),
            resume_length=metadata.get("resume_length", "1 Page"),
            readability=metadata.get("readability", "Good"),
            suggestions=json.dumps(analysis_data.get("suggestions", []))
        )
        db.add(analysis)
    else:
        analysis.overall_score = scores.get("overall_score", 70)
        analysis.ats_score = scores.get("ats_score", 70)
        analysis.professional_writing_score = scores.get("professional_writing_score", 70)
        analysis.formatting_score = scores.get("formatting_score", 70)
        analysis.grammar_score = scores.get("grammar_score", 70)
        analysis.keyword_match_score = scores.get("keyword_match_score", 70)
        analysis.project_quality_score = scores.get("project_quality_score", 70)
        analysis.experience_strength = scores.get("experience_strength", 70)
        analysis.education_completeness = scores.get("education_completeness", 70)
        analysis.technical_skills_score = scores.get("technical_skills_score", 70)
        analysis.soft_skills_score = scores.get("soft_skills_score", 70)
        analysis.resume_length = metadata.get("resume_length", "1 Page")
        analysis.readability = metadata.get("readability", "Good")
        analysis.suggestions = json.dumps(analysis_data.get("suggestions", []))
        
    resume.ats_score = scores.get("overall_score", 70)
    
    ats = db.query(ResumeATS).filter(ResumeATS.resume_id == id).first()
    if ats:
        ats.overall_score = scores.get("overall_score", 70)
        ats.formatting_score = scores.get("formatting_score", 70)
        ats.keyword_match = scores.get("keyword_match_score", 70)
        ats.grammar_score = scores.get("grammar_score", 70)
        ats.readability_score = scores.get("overall_score", 70)
    db.commit()
    
    return analysis_data

class ImproveRequest(BaseModel):
    improvement_goal: str

@router.post("/{id}/improve")
def improve_resume_endpoint(
    id: int,
    payload: ImproveRequest,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    resume = verify_ownership(id, student.id, db)
    
    education = db.query(ResumeEducation).filter(ResumeEducation.resume_id == id).all()
    experience = db.query(ResumeExperience).filter(ResumeExperience.resume_id == id).all()
    projects = db.query(ResumeProject).filter(ResumeProject.resume_id == id).all()
    skills = db.query(ResumeSkill).filter(ResumeSkill.resume_id == id).all()
    certificates = db.query(ResumeCertificate).filter(ResumeCertificate.resume_id == id).all()
    
    resume_state = {
        "personal_info": {
            "name": student.student_name,
            "email": student.email,
            "phone": resume.phone or "",
            "address": resume.address or "",
            "linkedin": resume.linkedin or "",
            "github": resume.github or "",
            "portfolio": resume.portfolio or "",
            "summary": resume.summary or ""
        },
        "education": [{"institution": e.institution, "degree": e.degree, "passing_year": e.passing_year, "cgpa": e.cgpa, "achievements": e.achievements} for e in education],
        "experience": [{"company": exp.company, "position": exp.position, "duration": exp.duration, "description": exp.description} for exp in experience],
        "projects": [{"name": p.name, "tech_stack": p.tech_stack, "description": p.description, "duration": p.duration} for p in projects],
        "skills": [{"category": s.category, "name": s.name, "level": s.level} for s in skills],
        "certifications": [{"name": c.name, "organization": c.organization, "issue_date": c.issue_date} for c in certificates],
        "achievements": {
            "hackathons": "SIH Winner" if "Winner" in (resume.achievements_list or "") else "",
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
        improved_json["personal_info"]["summary"] = f"Improved for {payload.improvement_goal}: " + (resume.summary or "Ambitious professional seeking role.")
        for p in improved_json.get("projects", []):
            p["description"] = "Spearheaded development: " + p["description"]
        for e in improved_json.get("experience", []):
            e["description"] = "Architected solution: " + e["description"]
            
    hist = ResumeImprovementHistory(
        resume_id=id,
        improvement_type=payload.improvement_goal,
        original_data=json.dumps(resume_state),
        improved_data=json.dumps(improved_json)
    )
    db.add(hist)
    db.commit()
    
    return {"original": resume_state, "improved": improved_json}

class JDOptimizeRequest(BaseModel):
    job_description: str

@router.post("/{id}/optimize-jd")
def optimize_jd_endpoint(
    id: int,
    payload: JDOptimizeRequest,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    resume = verify_ownership(id, student.id, db)
    
    education = db.query(ResumeEducation).filter(ResumeEducation.resume_id == id).all()
    experience = db.query(ResumeExperience).filter(ResumeExperience.resume_id == id).all()
    projects = db.query(ResumeProject).filter(ResumeProject.resume_id == id).all()
    skills = db.query(ResumeSkill).filter(ResumeSkill.resume_id == id).all()
    certificates = db.query(ResumeCertificate).filter(ResumeCertificate.resume_id == id).all()
    
    resume_state = {
        "personal_info": {
            "name": student.student_name,
            "email": student.email,
            "phone": resume.phone or "",
            "address": resume.address or "",
            "summary": resume.summary or ""
        },
        "education": [{"institution": e.institution, "degree": e.degree, "passing_year": e.passing_year, "cgpa": e.cgpa} for e in education],
        "experience": [{"company": exp.company, "position": exp.position, "duration": exp.duration, "description": exp.description} for exp in experience],
        "projects": [{"name": p.name, "tech_stack": p.tech_stack, "description": p.description, "duration": p.duration} for p in projects],
        "skills": [{"category": s.category, "name": s.name, "level": s.level} for s in skills],
        "certifications": [{"name": c.name, "organization": c.organization} for c in certificates]
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
        optimized_resume["personal_info"]["summary"] = "Optimized: " + (resume.summary or "")
        
    opt_db = JobDescriptionOptimization(
        resume_id=id,
        job_description=payload.job_description,
        overall_match_score=match_data.get("overall_match_score", 0),
        missing_skills=",".join(match_data.get("missing_skills", [])),
        missing_keywords=",".join(match_data.get("missing_keywords", [])),
        recommended_improvements=match_data.get("recommended_improvements"),
        important_technologies=",".join(match_data.get("important_technologies", [])),
        required_certifications=",".join(match_data.get("required_certifications", [])),
        optimized_resume_data=json.dumps(optimized_resume)
    )
    db.add(opt_db)
    db.commit()
    
    return {"match_metrics": match_data, "optimized_resume": optimized_resume}

@router.post("/{id}/save-final")
def save_final_resume_endpoint(
    id: int,
    payload: dict,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    resume = verify_ownership(id, student.id, db)
    
    master = payload.get("master", {})
    personal_info = payload.get("personal_info", {})
    
    resume.name = master.get("name") or resume.name
    resume.resume_type = master.get("resume_type") or resume.resume_type
    resume.target_role = master.get("target_role") or resume.target_role
    resume.career_objective = master.get("career_objective") or resume.career_objective
    resume.preferred_industry = master.get("preferred_industry") or resume.preferred_industry
    resume.language = master.get("language") or resume.language
    resume.expected_salary = master.get("expected_salary") or resume.expected_salary
    resume.visibility = master.get("visibility") or resume.visibility
    resume.template_id = master.get("template_id") or resume.template_id
    resume.color_theme = master.get("color_theme") or resume.color_theme
    
    resume.phone = personal_info.get("phone") or master.get("phone") or resume.phone
    resume.address = personal_info.get("address") or master.get("address") or resume.address
    resume.linkedin = personal_info.get("linkedin") or master.get("linkedin") or resume.linkedin
    resume.github = personal_info.get("github") or master.get("github") or resume.github
    resume.portfolio = personal_info.get("portfolio") or master.get("portfolio") or resume.portfolio
    resume.summary = personal_info.get("summary") or master.get("summary") or resume.summary
    
    achievements = payload.get("achievements")
    if achievements:
        resume.achievements_list = json.dumps(achievements)
        
    db.query(ResumeEducation).filter(ResumeEducation.resume_id == id).delete()
    db.query(ResumeExperience).filter(ResumeExperience.resume_id == id).delete()
    db.query(ResumeProject).filter(ResumeProject.resume_id == id).delete()
    db.query(ResumeSkill).filter(ResumeSkill.resume_id == id).delete()
    db.query(ResumeCertificate).filter(ResumeCertificate.resume_id == id).delete()
    
    for edu in payload.get("education", []):
        db.add(ResumeEducation(
            resume_id=id,
            institution=edu.get("institution"),
            degree=edu.get("degree"),
            board=edu.get("board"),
            percentage=edu.get("percentage"),
            cgpa=edu.get("cgpa"),
            passing_year=int(edu.get("passing_year", 2026)),
            achievements=edu.get("achievements")
        ))
        
    for exp in payload.get("experience", []):
        db.add(ResumeExperience(
            resume_id=id,
            company=exp.get("company"),
            position=exp.get("position"),
            duration=exp.get("duration"),
            description=exp.get("description"),
            achievements=exp.get("achievements")
        ))
        
    for proj in payload.get("projects", []):
        db.add(ResumeProject(
            resume_id=id,
            name=proj.get("name"),
            description=proj.get("description"),
            tech_stack=proj.get("tech_stack"),
            role=proj.get("role"),
            duration=proj.get("duration"),
            github_link=proj.get("github_link"),
            live_demo=proj.get("live_demo"),
            achievements=proj.get("achievements")
        ))
        
    for skill in payload.get("skills", []):
        db.add(ResumeSkill(
            resume_id=id,
            category=skill.get("category", "General"),
            name=skill.get("name"),
            level=int(skill.get("level", 3))
        ))
        
    for cert in payload.get("certifications", []) or payload.get("certificates", []):
        db.add(ResumeCertificate(
            resume_id=id,
            name=cert.get("name"),
            organization=cert.get("organization"),
            issue_date=cert.get("issue_date"),
            credential_id=cert.get("credential_id"),
            credential_url=cert.get("credential_url")
        ))
        
    db.commit()
    return {"success": True}

@router.get("/{id}/docx")
def get_docx_export_endpoint(
    id: int,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    verify_ownership(id, student.id, db)
    
    resume = db.query(ResumeMaster).filter(ResumeMaster.id == id).first()
    education = db.query(ResumeEducation).filter(ResumeEducation.resume_id == id).all()
    experience = db.query(ResumeExperience).filter(ResumeExperience.resume_id == id).all()
    projects = db.query(ResumeProject).filter(ResumeProject.resume_id == id).all()
    skills = db.query(ResumeSkill).filter(ResumeSkill.resume_id == id).all()
    certificates = db.query(ResumeCertificate).filter(ResumeCertificate.resume_id == id).all()
    
    resume_data = {
        "master": {
            "name": resume.name,
            "resume_type": resume.resume_type,
            "target_role": resume.target_role,
            "career_objective": resume.career_objective,
            "preferred_industry": resume.preferred_industry,
            "phone": resume.phone,
            "address": resume.address,
            "linkedin": resume.linkedin,
            "github": resume.github,
            "portfolio": resume.portfolio,
            "summary": resume.summary or resume.career_objective,
            "achievements_list": resume.achievements_list
        },
        "student": {
            "student_name": student.student_name,
            "email": student.email,
            "department": student.department
        },
        "education": [{"institution": e.institution, "degree": e.degree, "passing_year": e.passing_year, "cgpa": e.cgpa, "percentage": e.percentage, "achievements": e.achievements} for e in education],
        "experience": [{"company": exp.company, "position": exp.position, "duration": exp.duration, "description": exp.description} for exp in experience],
        "projects": [{"name": p.name, "tech_stack": p.tech_stack, "description": p.description, "duration": p.duration} for p in projects],
        "skills": [{"category": s.category, "name": s.name, "level": s.level} for s in skills],
        "certificates": [{"name": c.name, "organization": c.organization, "issue_date": c.issue_date} for c in certificates]
    }
    
    dl = ResumeDownload(resume_id=id, format="DOCX")
    db.add(dl)
    db.commit()
    
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
    db: Session = Depends(get_db)
):
    verify_ownership(id, student.id, db)
    analysis = db.query(ResumeAnalysis).filter(ResumeAnalysis.resume_id == id).first()
    if not analysis:
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

