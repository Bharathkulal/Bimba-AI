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
    
    extracted = {}
    improvements = {}
    
    if analysis_record:
        extracted = analysis_record.get("extracted_data", {})
        improvements = analysis_record.get("ai_improvements", {})

    # Construct clean response
    return {
        "success": True,
        "extracted_data": {
            "personal_info": {
                "name": extracted.get("name", student.student_name or ""),
                "email": extracted.get("email", student.personal_email or ""),
                "phone": extracted.get("phone", student.phone or ""),
                "location": extracted.get("location", student.address or "Mangalore, India")
            },
            "summary": extracted.get("summary", [""])[0] if isinstance(extracted.get("summary"), list) and extracted.get("summary") else extracted.get("summary", ""),
            "skills": extracted.get("skills", []),
            "experience": [
                {
                    "position": "Software Engineer",
                    "company": "Company Name",
                    "duration": "2024 - Present",
                    "description": str(exp)
                } for exp in extracted.get("experience", [])
            ] if isinstance(extracted.get("experience"), list) and extracted.get("experience") and isinstance(extracted.get("experience")[0], str) else extracted.get("experience", []),
            "projects": [
                {
                    "title": "Project Title",
                    "technologies": "React, FastAPI",
                    "description": str(proj)
                } for proj in extracted.get("projects", [])
            ] if isinstance(extracted.get("projects"), list) and extracted.get("projects") and isinstance(extracted.get("projects")[0], str) else extracted.get("projects", []),
            "education": [
                {
                    "degree": "BCA",
                    "institution": "College Name",
                    "year": "2024"
                } for edu in extracted.get("education", [])
            ] if isinstance(extracted.get("education"), list) and extracted.get("education") and isinstance(extracted.get("education")[0], str) else extracted.get("education", [])
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

    return {
        "success": True,
        "message": "Resume PDF generated successfully",
        "pdf_url": upload_res["url"],
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
            "template": r.get("template", "ats_classic"),
            "pdf_url": r.get("pdf_url"),
            "version": r.get("version", 1),
            "created_at": r.get("created_at")
        })
    return result
