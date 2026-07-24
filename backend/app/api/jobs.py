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
    JobApplicationUpdate
)

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
