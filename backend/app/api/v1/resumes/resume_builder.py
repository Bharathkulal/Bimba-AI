from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Optional, Any
from pydantic import BaseModel
from datetime import datetime, timezone
from app.database.session import get_db
from app.api.analytics import get_current_student
from app.models.student import Student
from app.services.resume_pdf_service import build_pdf_story
from app.services.cloudinary_service import upload_file
from app.core.mongodb import get_next_sequence

router = APIRouter(prefix="/resume", tags=["Resume Builder & PDF Engine"])

class GeneratePdfRequest(BaseModel):
    template: str # "ats_classic" | "modern_dev" | "minimal_pro" | "creative_portfolio"
    resume_data: Dict[str, Any]

@router.get("/builder/{resume_id}")
def get_resume_builder_data(
    resume_id: int,
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    """
    GET /api/resume/builder/{resume_id}
    Retrieves the raw extracted data and improvements for the editor.
    """
    # 1. Fetch resume and verify ownership
    resume_doc = db.resumes.find_one({"id": resume_id, "student_id": student.id})
    if not resume_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found or unauthorized"
        )
        
    # 2. Fetch analysis record containing extracted_data and ai_improvements
    analysis_record = db.resume_analysis.find_one({
        "resume_id": resume_id,
        "student_id": student.id
    })
    
    db_resume_data = resume_doc.get("resume") or {}
    
    extracted = {}
    if db_resume_data:
        extracted = db_resume_data
    
    # Load sections prioritizing edit payload then root fields then analysis_record
    summary = extracted.get("summary") or resume_doc.get("summary") or ""
    if not summary and analysis_record:
        summary = analysis_record.get("extracted_data", {}).get("summary", "")
        
    skills_raw = extracted.get("skills") or resume_doc.get("skills") or []
    if not skills_raw and analysis_record:
        skills_raw = analysis_record.get("extracted_data", {}).get("skills", [])
        
    # Map skills array of dictionaries or strings cleanly to a string list
    skills = []
    if isinstance(skills_raw, list):
        for s in skills_raw:
            if isinstance(s, dict):
                skills.append(s.get("name") or s.get("skill") or "")
            elif s:
                skills.append(str(s))
    elif isinstance(skills_raw, str):
        skills = [s.strip() for s in skills_raw.split(",") if s.strip()]
        
    experience = extracted.get("experience") or resume_doc.get("experience") or []
    if not experience and analysis_record:
        experience = analysis_record.get("extracted_data", {}).get("experience", [])
        
    projects = extracted.get("projects") or resume_doc.get("projects") or []
    if not projects and analysis_record:
        projects = analysis_record.get("extracted_data", {}).get("projects", [])
        
    education = extracted.get("education") or resume_doc.get("education") or []
    if not education and analysis_record:
        education = analysis_record.get("extracted_data", {}).get("education", [])

    improvements = {}
    if analysis_record:
        improvements = analysis_record.get("ai_improvements", {})

    personal_info = extracted.get("personal_info") or {}
    if not personal_info:
        personal_info = {
            "name": extracted.get("name") or resume_doc.get("name") or student.student_name or "",
            "email": extracted.get("email") or resume_doc.get("email") or student.personal_email or "",
            "phone": extracted.get("phone") or resume_doc.get("phone") or student.phone or "",
            "location": extracted.get("location") or resume_doc.get("address") or student.address or "Mangalore, India"
        }
        
    # Standard fallback validation
    if not personal_info.get("name"):
        personal_info["name"] = student.student_name or "Candidate"
    if not personal_info.get("email"):
        personal_info["email"] = student.personal_email or "student@bimba.ai"
    if not personal_info.get("phone"):
        personal_info["phone"] = student.phone or "9876543210"
    if not personal_info.get("location"):
        personal_info["location"] = student.address or "Mangalore, India"

    # Construct clean response
    return {
        "success": True,
        "extracted_data": {
            "personal_info": personal_info,
            "summary": summary[0] if isinstance(summary, list) and summary else str(summary),
            "skills": skills,
            "experience": [
                {
                    "position": exp.get("position") or exp.get("role") or "Software Engineer",
                    "company": exp.get("company") or "Company Name",
                    "duration": exp.get("duration") or exp.get("year") or "2024 - Present",
                    "description": exp.get("description") or ""
                } if isinstance(exp, dict) else {
                    "position": "Software Engineer",
                    "company": "Company Name",
                    "duration": "2024 - Present",
                    "description": str(exp)
                } for exp in experience
            ] if isinstance(experience, list) else [],
            "projects": [
                {
                    "title": proj.get("title") or proj.get("name") or "Project Title",
                    "technologies": proj.get("technologies") or "React, FastAPI",
                    "description": proj.get("description") or ""
                } if isinstance(proj, dict) else {
                    "title": "Project Title",
                    "technologies": "React, FastAPI",
                    "description": str(proj)
                } for proj in projects
            ] if isinstance(projects, list) else [],
            "education": [
                {
                    "degree": edu.get("degree") or edu.get("course") or "BCA",
                    "institution": edu.get("institution") or edu.get("school") or edu.get("college") or "College Name",
                    "year": edu.get("year") or edu.get("passing_year") or "2024"
                } if isinstance(edu, dict) else {
                    "degree": "BCA",
                    "institution": "College Name",
                    "year": str(edu)
                } for edu in education
            ] if isinstance(education, list) else []
        },
        "ai_improvements": improvements
    }

@router.post("/generate-pdf/{resume_id}")
async def generate_resume_pdf_endpoint(
    resume_id: int,
    payload: GeneratePdfRequest,
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    """
    POST /api/resume/generate-pdf/{resume_id}
    Generates ReportLab PDF, uploads it to Cloudinary, and stores metadata link.
    """
    # 1. Verify resume ownership
    resume_doc = db.resumes.find_one({"id": resume_id, "student_id": student.id})
    if not resume_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found or unauthorized"
        )
        
    # 2. Build PDF binary content in memory
    try:
        pdf_bytes = build_pdf_story(payload.resume_data, payload.template)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"PDF compilation failed: {str(e)}"
        )

    # 3. Upload PDF bytes to Cloudinary
    filename = f"resume_student_{student.id}_v"
    try:
        version_count = db.generated_resumes.count_documents({"resume_id": resume_id})
        current_version = version_count + 1
        
        # Upload
        upload_res = upload_file(
            pdf_bytes, 
            filename=f"{filename}{current_version}.pdf",
            folder="generated-resumes"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cloudinary PDF Upload failed: {str(e)}"
        )

    # 4. Save metadata to generated_resumes collection
    gen_id = str(get_next_sequence("generated_resumes"))
    db.generated_resumes.insert_one({
        "id": int(gen_id),
        "student_id": student.id,
        "resume_id": resume_id,
        "template": payload.template,
        "pdf_url": upload_res["url"],
        "public_id": upload_res["public_id"],
        "version": current_version,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    import base64
    pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')

    return {
        "success": True,
        "message": "Resume PDF generated successfully",
        "pdf_url": upload_res["url"],
        "pdf_base64": pdf_base64,
        "version": current_version
    }

@router.get("/generated/{resume_id}")
def get_previously_generated_resumes(
    resume_id: int,
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    """
    GET /api/resume/generated/{resume_id}
    Retrieves previous versions list of generated PDF resumes.
    """
    # Verify resume belongs to student
    resume_doc = db.resumes.find_one({"id": resume_id, "student_id": student.id})
    if not resume_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found or unauthorized"
        )
        
    records = list(db.generated_resumes.find(
        {"resume_id": resume_id, "student_id": student.id}
    ).sort("version", -1))
    
    result = []
    for r in records:
        result.append({
            "id": r.get("id"),
            "template": r.get("template", "ats_classic"),
            "pdf_url": r.get("pdf_url"),
            "version": r.get("version", 1),
            "created_at": r.get("created_at")
        })
    return result

@router.get("/download-pdf/{version_id}")
def download_pdf_version(
    version_id: int,
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    """
    GET /api/resume/download-pdf/{version_id}
    Retrieves and streams the PDF document as a local attachment download, avoiding browser CORS block.
    """
    from fastapi.responses import StreamingResponse
    import io
    import requests
    
    record = db.generated_resumes.find_one({"id": version_id, "student_id": student.id})
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PDF version not found"
        )
        
    pdf_url = record.get("pdf_url")
    if not pdf_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PDF URL missing from version record"
        )
        
    try:
        res = requests.get(pdf_url)
        res.raise_for_status()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch document from cloud storage: {str(e)}"
        )
        
    return StreamingResponse(
        io.BytesIO(res.content),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=Resume_V{record.get('version', 1)}.pdf"
        }
    )
