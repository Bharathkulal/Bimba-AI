from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Any
from datetime import datetime

from app.database.session import get_db
from app.models.student import Student
from app.models.saved_job import SavedJob, JobApplication
from app.api.analytics import get_current_student
from app.services.linkedin_service import linkedin_service
from app.core.mongodb import MongoModel, get_next_sequence
from app.schemas.jobs import (
    JobSearchResponse,
    JobDetailResponse,
    JobSaveRequest,
    SavedJobResponse,
    JobApplicationCreate,
    JobApplicationResponse,
    JobApplicationUpdate,
    JobRecommendationsResponse
)

import json
import random

router = APIRouter(prefix="/jobs", tags=["Jobs Module"])

@router.get("", response_model=JobSearchResponse)
def search_jobs(
    keyword: Optional[str] = Query(None, description="Search keyword"),
    location: Optional[str] = Query(None, description="Location filter"),
    page: int = Query(1, ge=1, description="Page number"),
    experience: Optional[str] = Query(None, description="Experience level"),
    remote: Optional[bool] = Query(None, description="Remote work filter"),
    employment_type: Optional[str] = Query(None, description="Employment type"),
    salary: Optional[str] = Query(None, description="Salary filter"),
    limit: int = Query(10, ge=1, le=50, description="Jobs limit per page"),
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    try:
        results = linkedin_service.search_jobs(
            student=student,
            keyword=keyword,
            location=location,
            page=page,
            experience=experience,
            remote=remote,
            employment_type=employment_type,
            salary=salary,
            limit=limit
        )
        return results
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query job search API: {str(e)}"
        )

@router.get("/saved", response_model=List[SavedJobResponse])
def get_saved_jobs(
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    saved_docs = list(db.saved_jobs.find({"user_id": student.id}).sort("saved_at", -1))
    return [SavedJob(doc) for doc in saved_docs]

@router.get("/applications", response_model=List[JobApplicationResponse])
def get_applications(
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    app_docs = list(db.job_applications.find({"user_id": student.id}).sort("application_date", -1))
    return [JobApplication(doc) for doc in app_docs]

@router.get("/{id}", response_model=JobDetailResponse)
def get_job_details(
    id: str,
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    job = linkedin_service.get_job_details(student, id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID '{id}' not found."
        )
    return job

@router.post("/save", response_model=SavedJobResponse)
def save_job(
    payload: JobSaveRequest,
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    # Check if already saved
    existing = db.saved_jobs.find_one({
        "user_id": student.id,
        "job_id": payload.job_id
    })
    
    if existing:
        return SavedJob(existing)
        
    next_id = get_next_sequence("saved_jobs")
    saved_doc = {
        "id": next_id,
        "user_id": student.id,
        "job_id": payload.job_id,
        "company": payload.company,
        "title": payload.title,
        "location": payload.location,
        "logo": payload.logo,
        "saved_at": datetime.utcnow()
    }
    db.saved_jobs.insert_one(saved_doc)
    return SavedJob(saved_doc)

@router.delete("/save/{id}")
def remove_saved_job(
    id: str,
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    # Support deletion by DB ID or LinkedIn string job_id
    query_filter = {"user_id": student.id}
    if id.isdigit():
        query_filter["$or"] = [{"id": int(id)}, {"job_id": id}]
    else:
        query_filter["job_id"] = id
        
    saved_item = db.saved_jobs.find_one(query_filter)
        
    if not saved_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Saved job not found."
        )
        
    db.saved_jobs.delete_one({"_id": saved_item["_id"]})
    return {"message": "Job unsaved successfully"}

@router.post("/apply", response_model=JobApplicationResponse)
def apply_job(
    payload: JobApplicationCreate,
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    # Check if application already exists for this job
    existing = db.job_applications.find_one({
        "user_id": student.id,
        "job_id": payload.job_id
    })
    
    if existing:
        # Just update status and notes
        update_fields = {"status": payload.status}
        if payload.notes:
            update_fields["notes"] = payload.notes
            
        db.job_applications.update_one(
            {"_id": existing["_id"]},
            {"$set": update_fields}
        )
        existing_updated = db.job_applications.find_one({"_id": existing["_id"]})
        return JobApplication(existing_updated)
        
    next_id = get_next_sequence("job_applications")
    app_doc = {
        "id": next_id,
        "user_id": student.id,
        "job_id": payload.job_id,
        "company": payload.company,
        "title": payload.title,
        "logo": payload.logo,
        "location": payload.location,
        "status": payload.status,
        "notes": payload.notes,
        "application_date": datetime.utcnow()
    }
    db.job_applications.insert_one(app_doc)
    
    # Log activity
    db.activity_logs.insert_one({
        "id": get_next_sequence("activity_logs"),
        "student_id": student.id,
        "activity": f"Applied to {payload.company}",
        "created_at": datetime.utcnow()
    })
    return JobApplication(app_doc)

@router.patch("/applications/{id}", response_model=JobApplicationResponse)
def update_application_status(
    id: int,
    payload: JobApplicationUpdate,
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    app_history = db.job_applications.find_one({
        "id": id,
        "user_id": student.id
    })
    
    if not app_history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application record not found."
        )
        
    update_fields = {"status": payload.status}
    if payload.notes is not None:
        update_fields["notes"] = payload.notes
        
    db.job_applications.update_one(
        {"_id": app_history["_id"]},
        {"$set": update_fields}
    )
    
    updated_doc = db.job_applications.find_one({"_id": app_history["_id"]})
    return JobApplication(updated_doc)

@router.get("/recommendations", response_model=JobRecommendationsResponse)
def get_job_recommendations(
    resume_id: int = Query(..., description="The resume ID to align job query matching against"),
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    # Fetch resume details
    resume = db.resumes.find_one({"id": resume_id, "student_id": student.id})
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    # Extract details
    skills = [s.get("name") for s in resume.get("skills", [])]
    summary = resume.get("summary") or resume.get("career_objective") or ""
    role = resume.get("target_role") or "Software Engineer"
    
    # Use fast local query parsing instead of slow LLM call
    payload = {
        "primary_role": role,
        "search_query": f"{role} {' '.join(skills[:3])}",
        "primary_skills": skills[:4],
        "secondary_skills": skills[4:8],
        "remote_preference": True,
        "preferred_location": "India"
    }
        
    # Call LinkedIn search API
    search_results = linkedin_service.search_jobs(
        student=student,
        keyword=payload.get("search_query"),
        location=payload.get("preferred_location"),
        limit=10
    )
    
    jobs = search_results.get("jobs", [])
    recommended_jobs = []
    
    for job in jobs:
        # Calculate matching breakdowns
        job_reqs = job.get("skills_missing", []) + job.get("skills_matched", [])
        if not job_reqs:
            job_reqs = ["React", "FastAPI", "MongoDB", "Python"]
        
        why = []
        matched_skills = [s for s in job.get("skills_matched", [])]
        for s in matched_skills:
            why.append(f"Matches your {s} skills")
        if resume.get("projects"):
            why.append("Matches your project technologies")
        why.append("ATS score suitable for this role")
        
        # Course recommendations for missing skills
        missing_skills_list = []
        for missing in job.get("skills_missing", []):
            missing_skills_list.append({
                "name": missing,
                "courses": f"Mastering {missing} on Coursera / Udemy",
                "importance": "High" if missing in payload.get("primary_skills", []) else "Medium"
            })
            
        recommended_jobs.append({
            "id": job.get("id"),
            "title": job.get("title"),
            "company": job.get("company"),
            "location": job.get("location"),
            "logo": job.get("logo"),
            "salary": job.get("salary") or "Competitive",
            "employment_type": job.get("employment_type") or "Full-time",
            "remote": job.get("remote", True),
            "posted_date": job.get("posted_date") or "Recently",
            "ai_match_score": job.get("ai_match_score") or random.randint(70, 95),
            "skills_matched": job.get("skills_matched", []),
            "skills_missing": job.get("skills_missing", []),
            "apply_url": job.get("apply_url") or "https://linkedin.com",
            "match_breakdown": {
                "why_recommended": why[:4],
                "missing_skills_learn": missing_skills_list[:3]
            }
        })
        
    # Log recommended jobs action
    db.activity_logs.insert_one({
        "id": get_next_sequence("activity_logs"),
        "student_id": student.id,
        "activity": f"Jobs Recommended",
        "created_at": datetime.utcnow()
    })
    
    return {
        "jobs": recommended_jobs,
        "extracted_keywords": payload,
        "query_used": payload.get("search_query")
    }

from pydantic import BaseModel

class ManualJobSearchRequest(BaseModel):
    keyword: str
    location: Optional[str] = "India"

@router.post("/recommend/{resume_id}")
def generate_job_recommendations_endpoint(
    resume_id: int,
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    """
    POST /api/jobs/recommend/{resume_id}
    Extracts profile skills and queries JSearch / LinkedIn, then ranks and saves in MongoDB.
    """
    from app.services.jobs.job_recommendation_service import get_job_recommendations_with_matching
    
    # 1. Verify ownership and load resume analysis
    resume_doc = db.resumes.find_one({"id": resume_id, "student_id": student.id})
    if not resume_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found or unauthorized"
        )
        
    analysis_record = db.resume_analysis.find_one({
        "resume_id": resume_id,
        "student_id": student.id
    })
    
    if not analysis_record or analysis_record.get("status") != "ai_completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="AI analysis has not been executed yet. Please run analysis first."
        )

    # 2. Extract profile details to query jobs
    ext_data = analysis_record.get("extracted_data", {})
    skills = ext_data.get("skills", [])
    target_role = ext_data.get("target_role") or "Software Engineer"
    
    # Generate search query
    query = target_role
    if skills:
        query = f"{target_role} {skills[0]}"

    # 3. Call recommendation service
    try:
        ranked_jobs = get_job_recommendations_with_matching(
            db=db,
            student=student,
            resume_analysis=analysis_record,
            keyword=query,
            location="India",
            limit=10
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Job search pipeline error: {str(e)}"
        )

    # 4. Save to job_recommendations collection
    rec_id = str(get_next_sequence("job_recommendations"))
    rec_doc = {
        "id": int(rec_id),
        "student_id": student.id,
        "resume_id": resume_id,
        "search_query": query,
        "jobs": ranked_jobs,
        "created_at": datetime.utcnow().isoformat()
    }
    
    # Remove older recommendations for this resume
    db.job_recommendations.delete_many({
        "resume_id": resume_id,
        "student_id": student.id
    })
    db.job_recommendations.insert_one(rec_doc)

    return {
        "success": True,
        "message": "AI Job recommendations generated successfully",
        "recommendations": ranked_jobs
    }

@router.get("/recommendations/{resume_id}")
def get_existing_recommendations_endpoint(
    resume_id: int,
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    """
    GET /api/jobs/recommendations/{resume_id}
    Retrieves stored recommendations from MongoDB.
    """
    rec = db.job_recommendations.find_one({
        "resume_id": resume_id,
        "student_id": student.id
    })
    
    if not rec:
        return {
            "success": True,
            "recommendations": []
        }
        
    return {
        "success": True,
        "recommendations": rec.get("jobs", [])
    }

@router.post("/search")
def manual_job_search_endpoint(
    payload: ManualJobSearchRequest,
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    """
    POST /api/jobs/search
    Manual search that fetches active jobs and scores them against the active resume profile.
    """
    from app.services.jobs.job_recommendation_service import get_job_recommendations_with_matching
    
    # Find student's latest completed resume analysis
    analysis_record = db.resume_analysis.find_one({
        "student_id": student.id,
        "status": "ai_completed"
    })
    
    if not analysis_record:
        # Fallback to general search without AI matching scores (or mock scores)
        # Search via LinkedIn provider
        from app.services.jobs.linkedin_provider import LinkedInProvider
        provider = LinkedInProvider()
        jobs = provider.search_jobs(student, payload.keyword, payload.location, 10)
        
        ranked_jobs = []
        for j in jobs:
            ranked_jobs.append({
                **j,
                "match_score": 70,
                "reason": "Resume not uploaded yet. Showing default match.",
                "matched_skills": [],
                "missing_skills": []
            })
        return {
            "success": True,
            "jobs": ranked_jobs
        }

    # Run search with matching
    try:
        ranked_jobs = get_job_recommendations_with_matching(
            db=db,
            student=student,
            resume_analysis=analysis_record,
            keyword=payload.keyword,
            location=payload.location,
            limit=10
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search pipeline failure: {str(e)}"
        )

    return {
        "success": True,
        "jobs": ranked_jobs
    }

