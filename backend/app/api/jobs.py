from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Any
from datetime import datetime

from app.database.session import get_db
from app.models.student import Student
from app.models.saved_job import SavedJob, JobApplication
from app.api.analytics import get_current_student
from app.services.linkedin_service import linkedin_service
from app.services.jobs.job_recommendation_service import get_job_recommendations_with_matching
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
    skills = []
    raw_skills = resume.get("skills") or []
    for s in raw_skills:
        if isinstance(s, dict):
            skills.append(s.get("name") or "")
        else:
            skills.append(str(s))
            
    summary = resume.get("summary") or resume.get("career_objective") or ""
    role = resume.get("target_role") or "Software Engineer"
    
    jobs = get_job_recommendations_with_matching(
        db=db,
        student=student,
        resume_analysis=resume,
        keyword=role,
        location=resume.get("personal_info", {}).get("address") or student.address or "India",
        limit=10
    )
    
    # Save/cache crawled jobs in MongoDB recommended_jobs collection
    for j in jobs:
        db.recommended_jobs.update_one(
            {"id": j["id"]},
            {"$set": {**j, "cached_at": datetime.utcnow()}},
            upsert=True
        )
        
    # Format match breakdown to match JobRecommendationsResponse schema
    formatted_jobs = []
    for j in jobs:
        formatted_jobs.append({
            "id": j["id"],
            "title": j["title"],
            "company": j["company"],
            "location": j["location"],
            "logo": j.get("logo"),
            "salary": j.get("salary") or "Not disclosed",
            "employment_type": j.get("employment_type") or "Not available",
            "remote": bool(j.get("remote")),
            "posted_date": j.get("posted_date") or "Not available",
            "ai_match_score": j.get("ai_match_score") or 0,
            "skills_matched": j.get("skills_matched") or j.get("matched_skills") or [],
            "skills_missing": j.get("skills_missing") or j.get("missing_skills") or [],
            "apply_url": j.get("apply_url") or j.get("application_url") or "",
            "match_breakdown": {
                "why_recommended": [j.get("reason", "Good match based on resume profile")],
                "missing_skills_learn": [{"name": ms, "courses": f"Learn {ms} online", "importance": "High"} for ms in (j.get("skills_missing") or j.get("missing_skills") or [])]
            }
        })
        
    return {
        "jobs": formatted_jobs,
        "extracted_keywords": {
            "primary_role": role,
            "search_query": f"{role} {' '.join(skills[:3])}",
            "primary_skills": skills[:4],
            "secondary_skills": skills[4:8],
            "remote_preference": True,
            "preferred_location": "India"
        },
        "query_used": f"{role} {' '.join(skills[:3])}"
    }

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
        "source": payload.source,
        "application_url": payload.application_url,
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
        from app.services.jobs.linkedin_provider import LinkedInProvider
        provider = LinkedInProvider()
        jobs = provider.search_jobs(student, payload.keyword, payload.location, 10)

        ranked_jobs = []
        for job in jobs:
            ranked_jobs.append({
                **job,
                "match_score": 0,
                "reason": "Resume analysis is unavailable. No match score calculated yet.",
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


class CreateApplicationRequest(BaseModel):
    company: str
    title: str
    job_url: Optional[str] = None
    location: Optional[str] = "Remote"
    salary_offered: Optional[str] = "Competitive"
    application_method: Optional[str] = "External Website"
    application_source: Optional[str] = "LinkedIn"
    status: Optional[str] = "Applied"
    notes: Optional[str] = ""
    recruiter_name: Optional[str] = ""
    recruiter_email: Optional[str] = ""

class UpdateStatusRequest(BaseModel):
    status: str
    notes: Optional[str] = ""
    reason: Optional[str] = ""

class PredictStatusRequest(BaseModel):
    text: str

class FollowUpRequest(BaseModel):
    method: str
    notes: Optional[str] = ""

@router.get("/applications/analytics")
def get_applications_analytics(
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    apps = list(db.job_applications.find({"user_id": student.id}))
    total = len(apps)
    
    # Status categorizations
    waiting = len([a for a in apps if a.get("status") in ["Applied", "Application Received", "Under Review", "Shortlisted"]])
    interviews = len([a for a in apps if "Interview" in str(a.get("status"))])
    offers = len([a for a in apps if a.get("status") in ["Offer Extended", "Offer Accepted"]])
    rejected = len([a for a in apps if a.get("status") in ["Rejected"]])
    
    # Weekly/Monthly counts (Mock metrics aggregated from records for charts)
    by_status = {}
    by_company = {}
    by_role = {}
    
    for a in apps:
        stat = a.get("status", "Applied")
        comp = a.get("company", "Unknown")
        role = a.get("title", "Software Engineer")
        
        by_status[stat] = by_status.get(stat, 0) + 1
        by_company[comp] = by_company.get(comp, 0) + 1
        by_role[role] = by_role.get(role, 0) + 1
        
    return {
        "total_applications": total,
        "waiting_for_response": waiting,
        "interviews_scheduled": interviews,
        "offers_received": offers,
        "rejected_count": rejected,
        "by_status": by_status,
        "by_company": by_company,
        "by_role": by_role
    }

@router.post("/applications")
def create_manual_application(
    payload: CreateApplicationRequest,
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    next_id = get_next_sequence("job_applications")
    now_date = datetime.utcnow().strftime("%Y-%m-%d")
    now_time = datetime.utcnow().strftime("%H:%M:%S")
    
    app_doc = {
        "id": next_id,
        "job_id": f"manual_{next_id}",
        "user_id": student.id,
        "company": payload.company,
        "company_logo": "https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=100&auto=format&fit=crop&q=60",
        "title": payload.title,
        "job_url": payload.job_url or "",
        "location": payload.location or "Remote",
        "salary_offered": payload.salary_offered or "Competitive",
        "application_method": payload.application_method or "External Website",
        "application_source": payload.application_source or "LinkedIn",
        "status": payload.status or "Applied",
        "previous_status": "",
        "notes": payload.notes or "",
        "recruiter_name": payload.recruiter_name or "",
        "recruiter_email": payload.recruiter_email or "",
        "application_date": datetime.utcnow(),
        "timeline": [
            {
                "date": now_date,
                "time": now_time,
                "status": payload.status or "Applied",
                "notes": "Application tracking created manually",
                "source": "User"
            }
        ],
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    db.job_applications.insert_one(app_doc)
    return {"success": True, "application": JobApplication(app_doc)}

@router.patch("/applications/{id}/status")
def update_application_status_custom(
    id: int,
    payload: UpdateStatusRequest,
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    app_rec = db.job_applications.find_one({"id": id, "user_id": student.id})
    if not app_rec:
        raise HTTPException(status_code=404, detail="Application not found")
        
    old_status = app_rec.get("status", "Applied")
    new_status = payload.status
    now_date = datetime.utcnow().strftime("%Y-%m-%d")
    now_time = datetime.utcnow().strftime("%H:%M:%S")
    
    timeline_event = {
        "date": now_date,
        "time": now_time,
        "status": new_status,
        "notes": payload.notes or f"Status updated from {old_status} to {new_status}",
        "source": "User"
    }
    
    db.job_applications.update_one(
        {"id": id},
        {
            "$set": {
                "status": new_status,
                "previous_status": old_status,
                "updated_at": datetime.utcnow().isoformat()
            },
            "$push": {
                "timeline": timeline_event
            }
        }
    )
    
    return {"success": True, "new_status": new_status}

@router.post("/applications/{id}/status-suggest")
def suggest_status_by_text(
    id: int,
    payload: PredictStatusRequest,
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    prompt = f"""Evaluate this job communication update: "{payload.text}"
Identify which of the following statuses is the single best fit:
Saved, Preparing, Ready To Apply, Applied, Application Received, Recruiter Viewed, Under Review, Shortlisted, Assessment Assigned, Assessment Completed, Technical Interview, Manager Interview, HR Interview, Final Interview, Reference Check, Offer Extended, Offer Accepted, Offer Declined, Rejected, Withdrawn, Expired, Archived.

Return ONLY the name of the status as a raw string. No explanation, no markdown format."""
    
    try:
        predicted = generate_ai_response(db, prompt, task_type="status_prediction")
        status_val = predicted.strip()
        return {"suggested_status": status_val}
    except Exception as e:
        return {"suggested_status": "Under Review"}

@router.get("/applications/{id}/guidance")
def get_status_guidance(
    id: int,
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    app_rec = db.job_applications.find_one({"id": id, "user_id": student.id})
    if not app_rec:
        raise HTTPException(status_code=404, detail="Application not found")
        
    status_val = app_rec.get("status", "Applied")
    comp = app_rec.get("company", "Company")
    role = app_rec.get("title", "Role")
    
    prompt = f"""The candidate's job application status for "{role}" at "{comp}" is currently "{status_val}".
Generate detailed, contextual guidance and recommended preparation actions.
Provide:
1. Likely next steps/waiting time.
2. Recommended preparation (practice questions, coding topics, or negotiation checklists depending on the stage).
3. 3-4 specific bullet points with tips.

Keep the tone encouraging, technical, and precise. Format nicely in markdown."""
    
    try:
        guidance = generate_ai_response(db, prompt, task_type="guidance")
        return {"guidance": guidance}
    except Exception:
        return {"guidance": "Complete mock preparation. Stay tuned for recruiter response."}

@router.post("/applications/{id}/follow-up")
def record_follow_up(
    id: int,
    payload: FollowUpRequest,
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    app_rec = db.job_applications.find_one({"id": id, "user_id": student.id})
    if not app_rec:
        raise HTTPException(status_code=404, detail="Application not found")
        
    now_date = datetime.utcnow().strftime("%Y-%m-%d")
    now_time = datetime.utcnow().strftime("%H:%M:%S")
    
    timeline_event = {
        "date": now_date,
        "time": now_time,
        "status": app_rec.get("status"),
        "notes": f"Follow-up sent via {payload.method}. Notes: {payload.notes}",
        "source": "User"
    }
    
    db.job_applications.update_one(
        {"id": id},
        {
            "$push": {
                "timeline": timeline_event
            },
            "$set": {
                "updated_at": datetime.utcnow().isoformat()
            }
        }
    )
    return {"success": True}


