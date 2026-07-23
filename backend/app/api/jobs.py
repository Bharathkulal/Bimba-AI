from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.session import get_db
from app.models.student import Student
from app.models.saved_job import SavedJob, JobApplication
from app.api.analytics import get_current_student
from app.services.linkedin_service import linkedin_service
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
    db: Session = Depends(get_db)
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
    db: Session = Depends(get_db)
):
    saved = db.query(SavedJob).filter(SavedJob.user_id == student.id).order_by(SavedJob.saved_at.desc()).all()
    return saved

@router.get("/applications", response_model=List[JobApplicationResponse])
def get_applications(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    applications = db.query(JobApplication).filter(JobApplication.user_id == student.id).order_by(JobApplication.application_date.desc()).all()
    return applications

@router.get("/{id}", response_model=JobDetailResponse)
def get_job_details(
    id: str,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
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
    db: Session = Depends(get_db)
):
    # Check if already saved
    existing = db.query(SavedJob).filter(
        SavedJob.user_id == student.id,
        SavedJob.job_id == payload.job_id
    ).first()
    
    if existing:
        return existing
        
    saved_job = SavedJob(
        user_id=student.id,
        job_id=payload.job_id,
        company=payload.company,
        title=payload.title,
        location=payload.location,
        logo=payload.logo
    )
    
    db.add(saved_job)
    db.commit()
    db.refresh(saved_job)
    return saved_job

@router.delete("/save/{id}")
def remove_saved_job(
    id: str,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    # Support deletion by DB ID or LinkedIn string job_id
    query = db.query(SavedJob).filter(SavedJob.user_id == student.id)
    
    if id.isdigit():
        saved_item = query.filter((SavedJob.id == int(id)) | (SavedJob.job_id == id)).first()
    else:
        saved_item = query.filter(SavedJob.job_id == id).first()
        
    if not saved_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Saved job not found."
        )
        
    db.delete(saved_item)
    db.commit()
    return {"message": "Job unsaved successfully"}

@router.post("/apply", response_model=JobApplicationResponse)
def apply_job(
    payload: JobApplicationCreate,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    # Check if application already exists for this job
    existing = db.query(JobApplication).filter(
        JobApplication.user_id == student.id,
        JobApplication.job_id == payload.job_id
    ).first()
    
    if existing:
        # Just update status and notes
        existing.status = payload.status
        if payload.notes:
            existing.notes = payload.notes
        db.commit()
        db.refresh(existing)
        return existing
        
    app_history = JobApplication(
        user_id=student.id,
        job_id=payload.job_id,
        company=payload.company,
        title=payload.title,
        logo=payload.logo,
        location=payload.location,
        status=payload.status,
        notes=payload.notes
    )
    db.add(app_history)
    db.commit()
    db.refresh(app_history)
    return app_history

@router.patch("/applications/{id}", response_model=JobApplicationResponse)
def update_application_status(
    id: int,
    payload: JobApplicationUpdate,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    app_history = db.query(JobApplication).filter(
        JobApplication.id == id,
        JobApplication.user_id == student.id
    ).first()
    
    if not app_history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application record not found."
        )
        
    app_history.status = payload.status
    if payload.notes is not None:
        app_history.notes = payload.notes
        
    db.commit()
    db.refresh(app_history)
    return app_history
