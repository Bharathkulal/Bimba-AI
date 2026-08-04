from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime, timezone
from bson import ObjectId

from app.database.session import get_db
from app.models.admin_user import AdminUser
from app.models.student import Student
from app.core.security import verify_token
from app.core.mongodb import get_next_sequence
from app.services.ai_gateway import generate_ai_response

router = APIRouter(prefix="/placement", tags=["Placement Officer Portal"])

# Helper dependency to resolve placement officer
def get_current_placement_officer(request: Request, db: Any = Depends(get_db)) -> AdminUser:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    token = auth_header.split(" ")[1]
    username = verify_token(token)
    if not username:
        raise HTTPException(status_code=401, detail="Invalid token")
        
    admin_doc = db.admin_users.find_one({"username": username})
    if not admin_doc:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    admin = AdminUser(admin_doc)
    if not admin.is_active:
        raise HTTPException(status_code=401, detail="Account is disabled")
        
    if admin.role not in ("placement_officer", "super_admin"):
        raise HTTPException(status_code=403, detail="Forbidden: Placement Officer permissions required.")
        
    return admin

# --- Pydantic Schemas ---
class StudentUpdateSchema(BaseModel):
    cgpa: Optional[float] = None
    eligibility_status: Optional[str] = "Eligible" # "Eligible", "Not Eligible"
    placement_status: Optional[str] = "Unplaced" # "Unplaced", "Placed", "Placed - Multiple Offers"

class CompanySchema(BaseModel):
    name: str
    industry: str
    location: str
    website: Optional[str] = ""
    description: Optional[str] = ""
    status: Optional[str] = "Active" # "Active", "Inactive"

class CompanyEditSchema(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

class DriveSchema(BaseModel):
    company_id: int
    company_name: str
    title: str
    job_role: str
    salary_package: str
    eligibility_criteria: str
    min_cgpa: float
    branches_eligible: List[str]
    drive_date: str
    status: Optional[str] = "Active" # "Active", "Completed", "Cancelled"

class DriveEditSchema(BaseModel):
    title: Optional[str] = None
    job_role: Optional[str] = None
    salary_package: Optional[str] = None
    eligibility_criteria: Optional[str] = None
    min_cgpa: Optional[float] = None
    branches_eligible: Optional[List[str]] = None
    drive_date: Optional[str] = None
    status: Optional[str] = None

class ResumeVerifySchema(BaseModel):
    status: str # "Approved", "Rejected"
    feedback: Optional[str] = ""

class ApplicationUpdateSchema(BaseModel):
    status: str # "Applied", "Shortlisted", "Rejected", "Offered"

class AnnouncementCreateSchema(BaseModel):
    title: str
    content: str
    target_audience: Optional[str] = "All" # "All", "CS", "BCA", etc.

# --- Endpoints ---

@router.get("/dashboard")
def get_dashboard_metrics(
    officer: AdminUser = Depends(get_current_placement_officer),
    db: Any = Depends(get_db)
):
    total_students = db.students.count_documents({})
    active_drives = db.placement_drives.count_documents({"status": "Active"})
    
    # Check applications
    total_applications = db.placement_applications.count_documents({})
    applications_in_progress = db.placement_applications.count_documents({"status": {"$in": ["Applied", "Shortlisted"]}})
    offers_made = db.placement_applications.count_documents({"status": "Offered"})
    
    # Placed vs Unplaced branch breakdown
    branches = ["BCOM", "BBA", "BCA"]
    branch_breakdown = {}
    for branch in branches:
        placed = db.students.count_documents({"department": branch, "placement_status": "Placed"})
        total = db.students.count_documents({"department": branch})
        branch_breakdown[branch] = {"placed": placed, "total": total}
        
    recent_activities = []
    # Fetch recent drives
    drives = list(db.placement_drives.find({}).sort("id", -1).limit(3))
    for d in drives:
        recent_activities.append({
            "id": f"drive_{d['id']}",
            "type": "drive",
            "title": f"New Campus Drive: {d['company_name']} - {d['title']}",
            "time": "Recently added"
        })
        
    # Fetch recent applications
    apps = list(db.placement_applications.find({}).sort("_id", -1).limit(3))
    for a in apps:
        recent_activities.append({
            "id": f"app_{a.get('_id')}",
            "type": "application",
            "title": f"Student {a.get('student_name')} applied to {a.get('company_name')}",
            "time": "Recently submitted"
        })

    return {
        "totalStudents": total_students,
        "activeDrives": active_drives,
        "applicationsInProgress": applications_in_progress,
        "offersMade": offers_made,
        "totalApplications": total_applications,
        "branchBreakdown": branch_breakdown,
        "recentActivities": recent_activities
    }

# --- Student Management ---
@router.get("/students")
def list_students(
    department: Optional[str] = None,
    eligibility_status: Optional[str] = None,
    placement_status: Optional[str] = None,
    officer: AdminUser = Depends(get_current_placement_officer),
    db: Any = Depends(get_db)
):
    query = {}
    if department:
        query["department"] = department
    if eligibility_status:
        query["eligibility_status"] = eligibility_status
    if placement_status:
        query["placement_status"] = placement_status
        
    students_list = list(db.students.find(query))
    for s in students_list:
        if "_id" in s:
            s["_id"] = str(s["_id"])
        s["cgpa"] = s.get("cgpa")
        s["eligibility_status"] = s.get("eligibility_status", "Eligible")
        s["placement_status"] = s.get("placement_status", "Unplaced")
    return students_list

@router.put("/students/{roll_number}")
def update_student_placement_fields(
    roll_number: str,
    payload: StudentUpdateSchema,
    officer: AdminUser = Depends(get_current_placement_officer),
    db: Any = Depends(get_db)
):
    student = db.students.find_one({"roll_number": roll_number})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    update_data = {}
    if payload.cgpa is not None:
        update_data["cgpa"] = payload.cgpa
    if payload.eligibility_status is not None:
        update_data["eligibility_status"] = payload.eligibility_status
    if payload.placement_status is not None:
        update_data["placement_status"] = payload.placement_status
        
    if update_data:
        db.students.update_one({"roll_number": roll_number}, {"$set": update_data})
        
    return {"success": True, "message": "Student placement profile updated successfully."}

# --- Company CRUD ---
@router.get("/companies")
def list_companies(
    officer: AdminUser = Depends(get_current_placement_officer),
    db: Any = Depends(get_db)
):
    companies = list(db.placement_companies.find({}))
    for c in companies:
        c["id"] = c.get("id") or str(c["_id"])
        if "_id" in c:
            c["_id"] = str(c["_id"])
    return companies

@router.post("/companies")
def create_company(
    payload: CompanySchema,
    officer: AdminUser = Depends(get_current_placement_officer),
    db: Any = Depends(get_db)
):
    next_id = get_next_sequence("placement_companies")
    company_doc = payload.dict()
    company_doc["id"] = next_id
    company_doc["created_at"] = datetime.utcnow()
    db.placement_companies.insert_one(company_doc)
    return {"success": True, "id": next_id}

@router.put("/companies/{id}")
def update_company(
    id: int,
    payload: CompanyEditSchema,
    officer: AdminUser = Depends(get_current_placement_officer),
    db: Any = Depends(get_db)
):
    company = db.placement_companies.find_one({"id": id})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    update_data = {k: v for k, v in payload.dict().items() if v is not None}
    if update_data:
        db.placement_companies.update_one({"id": id}, {"$set": update_data})
        
    return {"success": True, "message": "Company updated successfully."}

@router.delete("/companies/{id}")
def delete_company(
    id: int,
    officer: AdminUser = Depends(get_current_placement_officer),
    db: Any = Depends(get_db)
):
    result = db.placement_companies.delete_one({"id": id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Company not found")
    return {"success": True, "message": "Company deleted successfully."}

# --- Drive CRUD ---
@router.get("/drives")
def list_drives(
    officer: AdminUser = Depends(get_current_placement_officer),
    db: Any = Depends(get_db)
):
    drives = list(db.placement_drives.find({}))
    for d in drives:
        d["id"] = d.get("id") or str(d["_id"])
        if "_id" in d:
            d["_id"] = str(d["_id"])
    return drives

def evaluate_and_notify_eligible_students(drive_id: int, db: Any):
    drive = db.placement_drives.find_one({"id": drive_id})
    if not drive:
        return
        
    eligible_branches = drive.get("branches_eligible", [])
    min_cgpa = float(drive.get("min_cgpa") or 0.0)
    
    # Query matching branches & CGPA
    query = {
        "cgpa": {"$gte": min_cgpa},
        "department": {"$in": eligible_branches}
    }
    students = list(db.students.find(query))
    
    for student in students:
        resume = db.resumes.find_one({"student_roll": student["roll_number"]})
        resume_skills = ", ".join(resume.get("skills", [])) if resume else "N/A"
        ats_score = resume.get("ats_score", 65) if resume else 65
        
        prompt = f"""
        Evaluate student eligibility for job:
        Job Title: {drive.get('title')}
        Role: {drive.get('job_role')}
        Package: {drive.get('salary_package')}
        Description: {drive.get('eligibility_criteria')}
        
        Student details:
        Name: {student.get('student_name')}
        CGPA: {student.get('cgpa')}
        Skills: {resume_skills}
        Preferred Role: {student.get('preferred_role', 'SDE')}
        
        Classify the candidate suitability and provide:
        - Fit Category (Highly Recommended, Recommended, Eligible, Borderline, Not Eligible)
        - Match Score (integer from 0 to 100)
        - Reason (1-sentence explanation of why they were selected or borderline)
        
        Output format:
        Fit Category | Match Score | Reason
        Example:
        Highly Recommended | 92 | Exceptional skills match and strong academic background.
        """
        ai_res = generate_ai_response(db, prompt, "placement_eligibility_engine")
        
        try:
            parts = [x.strip() for x in ai_res.split("|")]
            if len(parts) >= 3:
                cat, score_str, reason = parts[0], parts[1], parts[2]
                score = int(score_str)
            else:
                cat = "Eligible"
                score = 75
                reason = "Candidate matches minimum CGPA and department eligibility."
        except Exception:
            cat = "Eligible"
            score = 75
            reason = "Candidate matches minimum CGPA and department eligibility."
            
        if cat != "Not Eligible":
            db.drive_eligibility_matches.update_one(
                {"drive_id": drive_id, "student_id": student["id"]},
                {"$set": {
                    "drive_id": drive_id,
                    "student_id": student["id"],
                    "roll_number": student["roll_number"],
                    "name": student.get("student_name") or student.get("full_name"),
                    "match_score": score,
                    "classification": cat,
                    "reason": reason,
                    "evaluated_at": datetime.utcnow()
                }},
                upsert=True
            )
            
            # Smart notification
            db.notifications.insert_one({
                "id": get_next_sequence("notifications"),
                "student_id": student["id"],
                "type": "Placement Eligible",
                "message": f"You are eligible for the {drive.get('company_name', 'Campus')} {drive.get('job_role')} Campus Drive.",
                "category": "placement",
                "is_read": False,
                "details": {
                    "drive_id": drive_id,
                    "company": drive.get("company_name"),
                    "role": drive.get("job_role"),
                    "package": drive.get("salary_package"),
                    "location": drive.get("location"),
                    "deadline": str(drive.get("application_deadline", "N/A")),
                    "match_score": score,
                    "reason": reason
                },
                "created_at": datetime.utcnow()
            })

@router.post("/drives")
def create_drive(
    payload: DriveSchema,
    background_tasks: BackgroundTasks,
    officer: AdminUser = Depends(get_current_placement_officer),
    db: Any = Depends(get_db)
):
    next_id = get_next_sequence("placement_drives")
    drive_doc = payload.dict()
    drive_doc["id"] = next_id
    drive_doc["created_at"] = datetime.utcnow()
    db.placement_drives.insert_one(drive_doc)
    
    # Run AI eligibility engine in background
    if drive_doc.get("status") in ("Active", "Published"):
        background_tasks.add_task(evaluate_and_notify_eligible_students, next_id, db)
        
    return {"success": True, "id": next_id}

@router.put("/drives/{id}")
def update_drive(
    id: int,
    payload: DriveEditSchema,
    background_tasks: BackgroundTasks,
    officer: AdminUser = Depends(get_current_placement_officer),
    db: Any = Depends(get_db)
):
    drive = db.placement_drives.find_one({"id": id})
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
        
    update_data = {k: v for k, v in payload.dict().items() if v is not None}
    if update_data:
        db.placement_drives.update_one({"id": id}, {"$set": update_data})
        
    # Run AI eligibility engine in background
    status_val = update_data.get("status")
    if status_val in ("Active", "Published"):
        background_tasks.add_task(evaluate_and_notify_eligible_students, id, db)
        
    return {"success": True, "message": "Campus drive updated successfully."}

@router.delete("/drives/{id}")
def delete_drive(
    id: int,
    officer: AdminUser = Depends(get_current_placement_officer),
    db: Any = Depends(get_db)
):
    result = db.placement_drives.delete_one({"id": id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Drive not found")
    return {"success": True, "message": "Campus drive deleted successfully."}

# --- Resume Verification ---
@router.get("/resumes/verify")
def list_resumes_verification_queue(
    officer: AdminUser = Depends(get_current_placement_officer),
    db: Any = Depends(get_db)
):
    # Fetch student resumes
    resumes = list(db.resumes.find({}))
    queue = []
    for r in resumes:
        # Check verification fields
        v_status = r.get("verification_status", "Pending")
        # Find associated student
        student = db.students.find_one({"id": r.get("student_id")}) or db.students.find_one({"roll_number": r.get("student_roll")})
        student_name = student.get("student_name") if student else "Unknown"
        student_roll = r.get("student_roll") or (student.get("roll_number") if student else "N/A")
        
        queue.append({
            "id": r.get("id") or str(r["_id"]),
            "name": r.get("name") or "Main Resume",
            "student_roll": student_roll,
            "student_name": student_name,
            "ats_score": r.get("ats_score", 0),
            "verification_status": v_status,
            "feedback": r.get("verification_feedback", ""),
            "last_edited": r.get("last_edited", "Recently")
        })
    return queue

@router.post("/resumes/verify/{id}")
def verify_resume(
    id: int,
    payload: ResumeVerifySchema,
    officer: AdminUser = Depends(get_current_placement_officer),
    db: Any = Depends(get_db)
):
    resume = db.resumes.find_one({"id": id})
    if not resume:
        # Try as ObjectId
        try:
            resume = db.resumes.find_one({"_id": ObjectId(id)})
        except Exception:
            pass
            
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    db.resumes.update_one(
        {"_id": resume["_id"]},
        {"$set": {
            "verification_status": payload.status,
            "verification_feedback": payload.feedback,
            "verified_at": datetime.utcnow()
        }}
    )
    return {"success": True, "message": f"Resume marked as {payload.status}."}

# --- Applications ---
@router.get("/applications")
def list_applications(
    officer: AdminUser = Depends(get_current_placement_officer),
    db: Any = Depends(get_db)
):
    apps = list(db.placement_applications.find({}))
    for a in apps:
        if "_id" in a:
            a["_id"] = str(a["_id"])
    return apps

@router.put("/applications/{id}")
def update_application_status(
    id: str,
    payload: ApplicationUpdateSchema,
    officer: AdminUser = Depends(get_current_placement_officer),
    db: Any = Depends(get_db)
):
    try:
        query = {"_id": ObjectId(id)}
    except Exception:
        query = {"id": id}
        
    app = db.placement_applications.find_one(query)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    db.placement_applications.update_one(query, {"$set": {"status": payload.status}})
    
    # If offered, update student's placement status
    if payload.status == "Offered":
        student_roll = app.get("student_roll")
        if student_roll:
            db.students.update_one({"roll_number": student_roll}, {"$set": {"placement_status": "Placed"}})
            
    return {"success": True, "message": f"Application status updated to {payload.status}."}

# --- Announcements ---
@router.get("/announcements")
def list_announcements(
    officer: AdminUser = Depends(get_current_placement_officer),
    db: Any = Depends(get_db)
):
    announcements = list(db.announcements.find({"target_audience": {"$in": ["All", "Placement"]}}))
    for a in announcements:
        if "_id" in a:
            a["_id"] = str(a["_id"])
    return announcements

@router.post("/announcements")
def create_announcement(
    payload: AnnouncementCreateSchema,
    officer: AdminUser = Depends(get_current_placement_officer),
    db: Any = Depends(get_db)
):
    next_id = get_next_sequence("announcements")
    doc = {
        "id": next_id,
        "title": payload.title,
        "content": payload.content,
        "status": "Published",
        "pinned": True,
        "target_audience": payload.target_audience,
        "target_value": "",
        "delivery_status": "Sent",
        "read_count": 0,
        "created_at": datetime.utcnow()
    }
    db.announcements.insert_one(doc)
    
    # Seed a notification for students
    notification_id = get_next_sequence("notifications")
    db.notifications.insert_one({
        "id": notification_id,
        "student_id": 1,  # Default to demo student
        "type": "Announcements",
        "message": f"Placement Officer announcement: {payload.title}",
        "read": False,
        "created_at": datetime.utcnow()
    })
    
    return {"success": True, "message": "Announcement published successfully."}

# --- Reports ---
@router.get("/reports")
def get_placement_reports(
    officer: AdminUser = Depends(get_current_placement_officer),
    db: Any = Depends(get_db)
):
    # Fetch general placement metrics
    total_students = db.students.count_documents({})
    placed_students = db.students.count_documents({"placement_status": "Placed"})
    unplaced_students = db.students.count_documents({"placement_status": "Unplaced"})
    
    companies = list(db.placement_companies.find({}))
    drives = list(db.placement_drives.find({}))
    
    # Return structured summary for dashboard export
    return {
        "summary": {
            "total_students": total_students,
            "placed_students": placed_students,
            "unplaced_students": unplaced_students,
            "placement_percentage": round((placed_students / total_students * 100), 2) if total_students > 0 else 0,
            "total_companies": len(companies),
            "total_drives": len(drives)
        },
        "details": [
            {
                "roll_number": s["roll_number"],
                "name": s.get("student_name") or s.get("full_name") or "Unknown",
                "department": s["department"],
                "cgpa": s.get("cgpa"),
                "eligibility": s.get("eligibility_status", "Eligible"),
                "status": s.get("placement_status", "Unplaced")
            }
            for s in db.students.find({})
        ]
    }

# --- AI Integration Endpoints ---
@router.get("/ai/dashboard-summary")
def get_ai_dashboard_summary(
    officer: AdminUser = Depends(get_current_placement_officer),
    db: Any = Depends(get_db)
):
    total_students = db.students.count_documents({})
    placed = db.students.count_documents({"placement_status": "Placed"})
    unplaced = db.students.count_documents({"placement_status": "Unplaced"})
    active_drives = db.placement_drives.count_documents({"status": "Active"})
    total_apps = db.placement_applications.count_documents({})
    
    prompt = f"""
    You are an AI Assistant for a university placement officer. 
    Analyze the following placement stats and provide a smart, concise 2-3 sentence overview of the current status, and highlight the most critical areas needing attention:
    - Total Candidates: {total_students}
    - Placed: {placed}
    - Unplaced: {unplaced}
    - Active Campus Recruiting Drives: {active_drives}
    - Total Applications: {total_apps}
    """
    summary = generate_ai_response(db, prompt, "placement_dashboard_summary")
    return {"summary": summary}

@router.get("/ai/resume-review/{resume_id}")
def ai_resume_review(
    resume_id: str,
    officer: AdminUser = Depends(get_current_placement_officer),
    db: Any = Depends(get_db)
):
    try:
        query = {"id": int(resume_id)}
    except Exception:
        try:
            query = {"_id": ObjectId(resume_id)}
        except Exception:
            query = {"id": resume_id}
            
    resume = db.resumes.find_one(query)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    name = resume.get("name", "Resume")
    skills = ", ".join(resume.get("skills", []))
    education = str(resume.get("education", []))
    experience = str(resume.get("experience", []))
    
    prompt = f"""
    You are an AI placement consultant. Review this student resume:
    Resume Title: {name}
    Skills: {skills}
    Education: {education}
    Experience: {experience}
    
    Provide a structured review including:
    1. Key Strengths
    2. Weaknesses / Missing Info
    3. Suggested Fixes
    4. Potential Fraud / Inconsistencies Check (e.g. weird CGPA, missing years)
    Keep the suggestions brief and actionable.
    """
    review = generate_ai_response(db, prompt, "placement_resume_review")
    return {"review": review}

@router.get("/ai/rank-candidates/{drive_id}")
def rank_candidates(
    drive_id: int,
    officer: AdminUser = Depends(get_current_placement_officer),
    db: Any = Depends(get_db)
):
    drive = db.placement_drives.find_one({"id": drive_id})
    if not drive:
        raise HTTPException(status_code=404, detail="Recruitment drive not found")
        
    eligible_query = {
        "cgpa": {"$gte": drive.get("min_cgpa", 6.0)},
        "department": {"$in": drive.get("branches_eligible", [])}
    }
    students = list(db.students.find(eligible_query))
    
    ranked_candidates = []
    for student in students[:10]:
        resume = db.resumes.find_one({"student_roll": student["roll_number"]})
        skills = ", ".join(resume.get("skills", [])) if resume else "N/A"
        
        prompt = f"""
        Verify fit score for student:
        Name: {student.get('student_name')}
        Skills: {skills}
        CGPA: {student.get('cgpa') if student.get('cgpa') is not None else 'N/A'}
        
        Against Job Role:
        Role: {drive.get('job_role')}
        Description: {drive.get('title')}
        Required: {drive.get('eligibility_criteria')}
        
        Output ONLY a single integer score between 0 and 100 representing the matching percentage, followed by a colon and a 5-word fit explanation.
        Example: 85:Strong skill match for backend
        """
        res = generate_ai_response(db, prompt, "placement_candidate_match")
        try:
            score_str, reason = res.split(":", 1)
            score = int(score_str.strip())
        except Exception:
            score = 75
            reason = "Good educational background fit"
            
        ranked_candidates.append({
            "roll_number": student["roll_number"],
            "name": student.get("student_name") or student.get("full_name"),
            "cgpa": student.get("cgpa"),
            "score": score,
            "reason": reason.strip()
        })
        
    ranked_candidates.sort(key=lambda x: x["score"], reverse=True)
    return ranked_candidates
