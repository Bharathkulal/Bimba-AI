from fastapi import APIRouter, Depends, HTTPException, status, Any
from datetime import datetime, timezone
from app.database.session import get_db
from app.api.analytics import get_current_student
from app.models.student import Student
from app.services.resume_parser_service import extract_resume_text
from app.services.resume_extraction_service import extract_structured_data
from app.core.mongodb import get_next_sequence

router = APIRouter(prefix="/resume", tags=["Resume Text Extraction"])

@router.post("/extract/{resume_id}")
async def extract_resume_data_endpoint(
    resume_id: int,
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    """
    POST /api/resume/extract/{resume_id}
    Downloads, extracts raw text, structures information, and saves metadata.
    """
    # 1. Verify resume exists and belongs to logged-in student
    resume_doc = db.resumes.find_one({"id": resume_id})
    if not resume_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
        
    if resume_doc.get("student_id") != student.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this resume."
        )

    # 2. Get Cloudinary URL and filename
    # Support both the new schema format and the legacy schema format
    cloudinary_data = resume_doc.get("resume", {}).get("cloudinary", {})
    cloudinary_url = cloudinary_data.get("url") or resume_doc.get("cloudinary_url")
    filename = resume_doc.get("original_filename") or resume_doc.get("filename") or "resume.pdf"
    
    if not cloudinary_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume has no associated Cloudinary storage URL."
        )

    # 3. Extract text
    try:
        extraction_result = await extract_resume_text(cloudinary_url, filename)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Extraction failure: {str(e)}"
        )

    raw_text = extraction_result["text"]
    if not raw_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume appears to contain no readable text."
        )

    # 4. Basic Structured Extraction
    extracted_data = extract_structured_data(raw_text)

    # 5. Save analysis to MongoDB `resume_analysis` collection
    analysis_id = str(get_next_sequence("resume_analysis"))
    file_ext = filename.split(".")[-1].lower() if "." in filename else "pdf"
    
    db.resume_analysis.insert_one({
        "id": int(analysis_id),
        "resume_id": resume_id,
        "student_id": student.id,
        "roll_number": student.roll_number,
        "raw_text": raw_text,
        "extracted_data": extracted_data,
        "file_type": file_ext,
        "word_count": extraction_result["word_count"],
        "status": "completed",
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    # Update the status of the resume document in db.resumes
    db.resumes.update_one(
        {"id": resume_id},
        {"$set": {"status": "analyzed"}}
    )

    return {
        "success": True,
        "message": "Resume extracted successfully",
        "analysis_id": analysis_id,
        "data": {
            "name": extracted_data["name"],
            "skills": extracted_data["skills"]
        }
    }
