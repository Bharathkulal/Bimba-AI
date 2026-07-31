from fastapi import APIRouter, Depends, HTTPException, status
from typing import Any
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

@router.post("/analyze/{resume_id}")
def analyze_resume_endpoint(
    resume_id: int,
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    """
    POST /api/resume/analyze/{resume_id}
    Performs AI evaluation of the resume data, returning standardized scorecards.
    """
    from app.services.resume_ai_analyzer import analyze_resume
    
    # 1. Verify ownership and fetch resume_analysis record
    analysis_record = db.resume_analysis.find_one({
        "resume_id": resume_id,
        "student_id": student.id
    })
    
    if not analysis_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume extraction data not found. Please extract text first."
        )

    # 1.5 Caching Check: Return existing analysis if already completed
    if "ai_analysis" in analysis_record and analysis_record.get("status") == "ai_completed":
        ai_res = analysis_record["ai_analysis"]
        return {
            "success": True,
            "message": "Resume analysis retrieved from cache",
            "analysis": {
                "overall_score": ai_res["overall_score"],
                "ats_score": ai_res["ats_score"],
                "strengths": ai_res["strengths"],
                "weaknesses": ai_res["weaknesses"],
                "suggestions": ai_res["improvement_suggestions"]
            }
        }

    # 2. Call AI Analyzer service
    try:
        ai_res = analyze_resume(db, analysis_record.get("extracted_data", {}))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI analysis service is temporarily unavailable. Please try again later."
        )

    # 3. Update resume_analysis record in MongoDB
    db.resume_analysis.update_one(
        {"resume_id": resume_id, "student_id": student.id},
        {"$set": {
            "ai_analysis": ai_res,
            "status": "ai_completed",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )

    # Update resumes collection status
    db.resumes.update_one(
        {"id": resume_id, "student_id": student.id},
        {"$set": {
            "status": "ai_completed",
            "ats_score": ai_res["ats_score"]
        }}
    )

    return {
        "success": True,
        "message": "Resume analysis completed",
        "analysis": {
            "overall_score": ai_res["overall_score"],
            "ats_score": ai_res["ats_score"],
            "strengths": ai_res["strengths"],
            "weaknesses": ai_res["weaknesses"],
            "suggestions": ai_res["improvement_suggestions"]
        }
    }

@router.get("/health/{resume_id}")
def get_resume_health_endpoint(
    resume_id: int,
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    """
    GET /api/resume/health/{resume_id}
    Retrieves full resume intelligence, strengths, weaknesses, and ratings.
    """
    # 1. Verify resume belongs to student and retrieve analysis
    analysis_record = db.resume_analysis.find_one({
        "resume_id": resume_id,
        "student_id": student.id
    })
    
    if not analysis_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume extraction data not found. Please extract text first."
        )

    ai_analysis = analysis_record.get("ai_analysis")
    if not ai_analysis or analysis_record.get("status") != "ai_completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="AI analysis has not been executed yet. Please run AI analysis first."
        )

    # 2. Determine Text Rating based on Overall Score
    score = ai_analysis.get("overall_score", 70)
    if score >= 90:
        rating = "Excellent"
    elif score >= 75:
        rating = "Good"
    elif score >= 50:
        rating = "Needs Improvement"
    else:
        rating = "Poor"

    # 3. Compile output
    return {
        "success": True,
        "resume_health": {
            "overall_score": score,
            "ats_score": ai_analysis.get("ats_score", 65),
            "rating": rating,
            "section_scores": ai_analysis.get("section_scores", {
                "summary": 70,
                "skills": 70,
                "experience": 70,
                "projects": 70
            }),
            "strengths": ai_analysis.get("strengths", []),
            "weaknesses": ai_analysis.get("weaknesses", []),
            "missing_skills": ai_analysis.get("missing_skills", []),
            "improvement_suggestions": ai_analysis.get("improvement_suggestions", [])
        }
    }

@router.post("/improve/{resume_id}")
def improve_resume_endpoint(
    resume_id: int,
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    """
    POST /api/resume/improve/{resume_id}
    Generates AI suggestions to rewrite and optimize weak sections of the resume.
    """
    from app.services.resume_improvement_service import generate_resume_improvements
    
    # 1. Verify ownership and fetch resume_analysis record
    analysis_record = db.resume_analysis.find_one({
        "resume_id": resume_id,
        "student_id": student.id
    })
    
    if not analysis_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume extraction data not found. Please extract text first."
        )

    ai_analysis = analysis_record.get("ai_analysis")
    if not ai_analysis or analysis_record.get("status") != "ai_completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="AI analysis has not been executed yet. Please run AI analysis first."
        )

    # 2. Caching Check: Return existing improvements if already calculated
    existing_improvements = analysis_record.get("ai_improvements")
    if existing_improvements:
        return {
            "success": True,
            "message": "Resume improvements retrieved from cache",
            "improvements": existing_improvements
        }

    # 3. Call Resume Improvement service
    try:
        improvements = generate_resume_improvements(
            db, 
            analysis_record.get("extracted_data", {}),
            ai_analysis
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service is temporarily unavailable. Please try again later."
        )

    # 4. Save to MongoDB
    db.resume_analysis.update_one(
        {"resume_id": resume_id, "student_id": student.id},
        {"$set": {
            "ai_improvements": improvements,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )

    return {
        "success": True,
        "message": "Resume improvements generated",
        "improvements": improvements
    }
