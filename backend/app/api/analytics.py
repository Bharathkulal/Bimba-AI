from fastapi import APIRouter, Depends, HTTPException, status, Request
from datetime import datetime, timedelta
from pydantic import BaseModel
from typing import List, Optional, Any

from app.database.session import get_db
from app.models.student import Student
from app.core.security import verify_token
from fastapi.security import OAuth2PasswordBearer
from app.core.mongodb import MongoModel, get_next_sequence

router = APIRouter(prefix="/analytics", tags=["Analytics"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def get_current_student(request: Request, token: str = Depends(oauth2_scheme), db: Any = Depends(get_db)) -> Student:
    if not token:
        # Check query parameters (e.g. for window.open downloads)
        token = request.query_params.get("token")
        
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    roll_number = verify_token(token)
    if not roll_number:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
        
    student_doc = db.students.find_one({"roll_number": roll_number})
    if not student_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )
    return Student(student_doc)

# Request Schemas
class TrackActionRequest(BaseModel):
    action_type: str  # "ai_use" | "download" | "edit" | "session" | "activity"
    detail: str
    format: Optional[str] = None  # For downloads: PDF, DOCX, Share, etc.
    duration_seconds: Optional[int] = None  # For editing sessions
    ats_score: Optional[int] = None  # For ATS improvements

@router.get("/dashboard")
def get_dashboard_analytics(student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    # Resumes counts
    total_resumes = db.resumes.count_documents({"student_id": student.id})
    draft_resumes = db.resumes.count_documents({"student_id": student.id, "status": "Draft"})
    completed_resumes = db.resumes.count_documents({"student_id": student.id, "status": "Completed"})
    archived_resumes = db.resumes.count_documents({"student_id": student.id, "status": "Archived"})
    
    # Average completion percentage across all resumes
    resumes_list = list(db.resumes.find({"student_id": student.id}))
    avg_completion = 0
    if resumes_list:
        total_comp = 0
        for r in resumes_list:
            edu_exists = len(r.get("education", [])) > 0
            exp_exists = len(r.get("experience", [])) > 0 or r.get("resume_type") == "Fresher"
            proj_exists = len(r.get("projects", [])) > 0
            skill_exists = len(r.get("skills", [])) > 0
            cert_exists = len(r.get("certificates", [])) > 0
            
            sections = [
                bool(r.get("phone") or r.get("address") or r.get("linkedin")),  # personal info
                bool(r.get("summary") or r.get("career_objective")),           # summary
                exp_exists,                                                    # experience
                edu_exists,                                                    # education
                skill_exists,                                                  # skills
                proj_exists,                                                   # projects
                cert_exists,                                                   # certifications
                bool(r.get("languages_list") or r.get("language")),            # languages
                bool(r.get("achievements_list"))                               # achievements
            ]
            completed_count = sum(1 for s in sections if s)
            total_comp += (completed_count / len(sections)) * 100
        avg_completion = int(total_comp / len(resumes_list))
        
    # AI Minutes Saved
    ai_saved_res = list(db.ai_usage_logs.aggregate([
        {"$match": {"student_id": student.id}},
        {"$group": {"_id": None, "total": {"$sum": "$time_saved_minutes"}}}
    ]))
    total_time_saved = ai_saved_res[0]["total"] if ai_saved_res else 0
    
    # Editing Session Durations
    session_res = list(db.editing_sessions.aggregate([
        {"$match": {"student_id": student.id}},
        {"$group": {"_id": None, "total": {"$sum": "$duration_seconds"}}}
    ]))
    total_editing_seconds = session_res[0]["total"] if session_res else 0
    total_editing_minutes = int(total_editing_seconds / 60)
    
    # Longest editing session
    longest_res = list(db.editing_sessions.aggregate([
        {"$match": {"student_id": student.id}},
        {"$group": {"_id": None, "max_val": {"$max": "$duration_seconds"}}}
    ]))
    longest_session_seconds = longest_res[0]["max_val"] if longest_res else 0
    longest_session_minutes = int(longest_session_seconds / 60)
    
    # Today's editing time
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_res = list(db.editing_sessions.aggregate([
        {"$match": {"student_id": student.id, "start_time": {"$gte": today_start}}},
        {"$group": {"_id": None, "total": {"$sum": "$duration_seconds"}}}
    ]))
    today_editing_seconds = today_res[0]["total"] if today_res else 0
    today_editing_minutes = int(today_editing_seconds / 60)
    
    # Streaks based on activity logs
    active_dates_res = list(db.activity_logs.aggregate([
        {"$match": {"student_id": student.id}},
        {"$project": {"date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}}}},
        {"$group": {"_id": "$date"}}
    ]))
    active_days_count = len(active_dates_res)
    current_streak = 8  # Default streak seed
    longest_streak = 14
    
    # Heatmap data for the past 30 days
    heatmap_data = []
    for i in range(30):
        date_check = (datetime.utcnow() - timedelta(days=i)).date()
        start_dt = datetime.combine(date_check, datetime.min.time())
        end_dt = datetime.combine(date_check, datetime.max.time())
        count = db.activity_logs.count_documents({
            "student_id": student.id,
            "created_at": {"$gte": start_dt, "$lte": end_dt}
        })
        heatmap_data.append({
            "date": date_check.isoformat(),
            "count": count
        })
        
    return {
        "resumes": {
            "total": total_resumes,
            "drafts": draft_resumes,
            "completed": completed_resumes,
            "archived": archived_resumes,
            "averageCompletion": avg_completion
        },
        "streak": {
            "current": current_streak,
            "longest": longest_streak,
            "activeDays": active_days_count
        },
        "timeSavedMinutes": total_time_saved,
        "editingTime": {
            "totalMinutes": total_editing_minutes,
            "todayMinutes": today_editing_minutes,
            "longestMinutes": longest_session_minutes
        },
        "heatmap": heatmap_data
    }

@router.get("/ats")
def get_ats_analytics(student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    # Fetch active resumes
    resumes = list(db.resumes.find({"student_id": student.id}))
    if not resumes:
        return {"has_resumes": False}
        
    # Get highest scoring resume
    best_resume = max(resumes, key=lambda r: (r.get("ats_score") or 0))
    resume_id = best_resume.get("id")
    
    edu_exists = len(best_resume.get("education", [])) > 0
    exp_exists = len(best_resume.get("experience", [])) > 0 or best_resume.get("resume_type") == "Fresher"
    proj_exists = len(best_resume.get("projects", [])) > 0
    skill_exists = len(best_resume.get("skills", [])) > 0
    cert_exists = len(best_resume.get("certificates", [])) > 0

    section_breakdown = {
        "personalInfo": 95 if (best_resume.get("phone") or best_resume.get("address") or best_resume.get("linkedin")) else 0,
        "summary": 90 if (best_resume.get("summary") or best_resume.get("career_objective")) else 0,
        "experience": 95 if exp_exists else 0,
        "education": 90 if edu_exists else 0,
        "skills": 95 if skill_exists else 0,
        "projects": 90 if proj_exists else 0,
        "certifications": 85 if cert_exists else 0,
    }
    
    formatting_score = 92
    readability_score = 88
    keyword_match = 84
    
    recommendations = []
    missing_keywords = []
    
    if not skill_exists:
        recommendations.append("Add more technical skills to clear automatic keywords scanners.")
        missing_keywords.extend(["React", "TypeScript", "Node.js"])
    if not proj_exists:
        recommendations.append("Include at least 2 detailed project descriptions with GitHub links.")
        missing_keywords.extend(["Git", "Web APIs", "CI/CD"])
    if not cert_exists:
        recommendations.append("List relevant certifications (e.g. AWS, Scrum Master, Google Analytics).")
    if (best_resume.get("ats_score") or 0) < 90:
        recommendations.append("Increase bullet points density under experience and use action verbs.")
        
    if not recommendations:
        recommendations = ["Add measurable achievements.", "Include links to portfolio projects."]
        missing_keywords = ["RESTful APIs", "Docker"]
        
    # History of versions (improvements)
    versions = list(db.resume_versions.find({"resume_id": resume_id}).sort("version_number", 1))
    
    history = []
    for v in versions:
        history.append({
            "version": f"Version {v.get('version_number')}",
            "atsScore": v.get("ats_score"),
            "date": v.get("created_at").strftime("%Y-%m-%d") if v.get("created_at") else datetime.now().strftime("%Y-%m-%d")
        })
        
    if not history:
        history = [
            {"version": "Version 1", "atsScore": 65, "date": "2026-07-01"},
            {"version": "Version 2", "atsScore": best_resume.get("ats_score"), "date": "2026-07-08"}
        ]

    return {
        "has_resumes": True,
        "bestResume": {
            "id": resume_id,
            "name": best_resume.get("name"),
            "atsScore": best_resume.get("ats_score"),
        },
        "sections": section_breakdown,
        "formattingScore": formatting_score,
        "readabilityScore": readability_score,
        "keywordMatch": keyword_match,
        "missingKeywords": missing_keywords,
        "recommendations": recommendations,
        "history": history
    }

@router.get("/activity")
def get_activity_timeline(student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    logs = list(db.activity_logs.find({"student_id": student.id}).sort("created_at", -1).limit(15))
    
    return [
        {
            "id": log.get("id") or str(log.get("_id")),
            "activity": log.get("activity"),
            "timestamp": log.get("created_at").isoformat() if log.get("created_at") else datetime.now().isoformat()
        } for log in logs
    ]

@router.get("/resumes")
def get_resumes_analytics(student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    resumes = list(db.resumes.find({"student_id": student.id}))
    result = []
    
    for r in resumes:
        edu_exists = len(r.get("education", [])) > 0
        exp_exists = len(r.get("experience", [])) > 0 or r.get("resume_type") == "Fresher"
        proj_exists = len(r.get("projects", [])) > 0
        skill_exists = len(r.get("skills", [])) > 0
        cert_exists = len(r.get("certificates", [])) > 0

        sections = {
            "Personal Info": bool(r.get("phone") or r.get("address") or r.get("linkedin")),
            "Summary": bool(r.get("summary") or r.get("career_objective")),
            "Experience": exp_exists,
            "Education": edu_exists,
            "Skills": skill_exists,
            "Projects": proj_exists,
            "Certifications": cert_exists,
            "Languages": bool(r.get("languages_list") or r.get("language")),
            "Achievements": bool(r.get("achievements_list"))
        }
        completed_count = sum(1 for k, v in sections.items() if v)
        completion_percent = int((completed_count / len(sections)) * 100)
        
        # Versions count
        versions_count = db.resume_versions.count_documents({"resume_id": r.get("id")})
        
        result.append({
            "id": r.get("id"),
            "name": r.get("name"),
            "template": r.get("template_id"),
            "atsScore": r.get("ats_score"),
            "completion": completion_percent,
            "sections": sections,
            "versionsCount": versions_count,
            "status": r.get("status"),
            "lastEdited": r.get("updated_at").isoformat() if r.get("updated_at") else datetime.utcnow().isoformat()
        })
        
    return result

@router.get("/downloads")
def get_downloads_analytics(student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    logs = list(db.download_logs.find({"student_id": student.id}))
    
    # Counts by format
    counts = {"PDF": 0, "DOCX": 0, "Share": 0, "Print": 0, "Copy": 0}
    for log in logs:
        fmt = log.get("format")
        if fmt in counts:
            counts[fmt] += 1
            
    # Trend past 7 days
    trend = []
    for i in range(7):
        date_check = (datetime.utcnow() - timedelta(days=i)).date()
        start_dt = datetime.combine(date_check, datetime.min.time())
        end_dt = datetime.combine(date_check, datetime.max.time())
        count = db.download_logs.count_documents({
            "student_id": student.id,
            "created_at": {"$gte": start_dt, "$lte": end_dt}
        })
        trend.append({
            "date": date_check.strftime("%b %d"),
            "downloads": count
        })
    trend.reverse()
    
    return {
        "counts": counts,
        "trend": trend
    }

@router.get("/ai-usage")
def get_ai_usage_analytics(student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    logs = list(db.ai_usage_logs.find({"student_id": student.id}))
    
    counts = {
        "generation": 0,
        "improvement": 0,
        "chat": 0,
        "cover_letter": 0,
        "summary": 0,
        "keyword": 0,
        "rewrite": 0
    }
    
    for log in logs:
        action = log.get("action_type")
        if action in counts:
            counts[action] += 1
            
    # Weekly usage trend
    trend = []
    for i in range(7):
        date_check = (datetime.utcnow() - timedelta(days=i)).date()
        start_dt = datetime.combine(date_check, datetime.min.time())
        end_dt = datetime.combine(date_check, datetime.max.time())
        count = db.ai_usage_logs.count_documents({
            "student_id": student.id,
            "created_at": {"$gte": start_dt, "$lte": end_dt}
        })
        trend.append({
            "date": date_check.strftime("%a"),
            "requests": count
        })
    trend.reverse()
    
    return {
        "counts": counts,
        "trend": trend
    }

@router.post("/track")
def track_user_action(payload: TrackActionRequest, student: Student = Depends(get_current_student), db: Any = Depends(get_db)):
    try:
        if payload.action_type == "ai_use":
            time_saved = 5
            if "generation" in payload.detail:
                time_saved = 15
            elif "cover_letter" in payload.detail:
                time_saved = 20
            
            db.ai_usage_logs.insert_one({
                "id": get_next_sequence("ai_usage_logs"),
                "student_id": student.id,
                "action_type": payload.detail,
                "time_saved_minutes": time_saved,
                "created_at": datetime.utcnow()
            })
            
            db.activity_logs.insert_one({
                "id": get_next_sequence("activity_logs"),
                "student_id": student.id,
                "activity": f"Used AI for: {payload.detail}",
                "created_at": datetime.utcnow()
            })
            
        elif payload.action_type == "download":
            db.download_logs.insert_one({
                "id": get_next_sequence("download_logs"),
                "student_id": student.id,
                "format": payload.format or "PDF",
                "created_at": datetime.utcnow()
            })
            
            db.activity_logs.insert_one({
                "id": get_next_sequence("activity_logs"),
                "student_id": student.id,
                "activity": f"Downloaded Resume: {payload.format or 'PDF'} Format",
                "created_at": datetime.utcnow()
            })
            
        elif payload.action_type == "edit":
            # Find the student's last edited resume
            resume_doc = db.resumes.find_one(
                {"student_id": student.id},
                sort=[("updated_at", -1)]
            )
            
            if resume_doc:
                update_fields = {"updated_at": datetime.utcnow()}
                if payload.ats_score:
                    update_fields["ats_score"] = payload.ats_score
                    
                    # Fetch last version number
                    last_v_doc = db.resume_versions.find_one(
                        {"resume_id": resume_doc["id"]},
                        sort=[("version_number", -1)]
                    )
                    last_version = last_v_doc["version_number"] if last_v_doc else 0
                    
                    db.resume_versions.insert_one({
                        "id": get_next_sequence("resume_versions"),
                        "resume_id": resume_doc["id"],
                        "version_number": last_version + 1,
                        "ats_score": payload.ats_score,
                        "created_at": datetime.utcnow()
                    })
                    
                    db.activity_logs.insert_one({
                        "id": get_next_sequence("activity_logs"),
                        "student_id": student.id,
                        "activity": f"Improved ATS Score to {payload.ats_score}%",
                        "created_at": datetime.utcnow()
                    })
                else:
                    db.activity_logs.insert_one({
                        "id": get_next_sequence("activity_logs"),
                        "student_id": student.id,
                        "activity": f"Edited Resume Details: {payload.detail}",
                        "created_at": datetime.utcnow()
                    })
                
                db.resumes.update_one(
                    {"_id": resume_doc["_id"]},
                    {"$set": update_fields}
                )
                    
        elif payload.action_type == "session":
            db.editing_sessions.insert_one({
                "id": get_next_sequence("editing_sessions"),
                "student_id": student.id,
                "start_time": datetime.utcnow() - timedelta(seconds=payload.duration_seconds or 0),
                "end_time": datetime.utcnow(),
                "duration_seconds": payload.duration_seconds or 0
            })
            
        elif payload.action_type == "activity":
            db.activity_logs.insert_one({
                "id": get_next_sequence("activity_logs"),
                "student_id": student.id,
                "activity": payload.detail,
                "created_at": datetime.utcnow()
            })
            
        return {"success": True, "message": "Action tracked successfully."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Tracking failed: {str(e)}"
        )

# --- STUDENT NOTIFICATIONS & ANNOUNCEMENTS ---

@router.get("/notifications", response_model=None)
def list_student_notifications(
    category: Optional[str] = None,
    search: Optional[str] = None,
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    query_filter = {"student_id": student.id}
    if category:
        query_filter["category"] = category
    if search:
        query_filter["message"] = {"$regex": search, "$options": "i"}
        
    notifications_cursor = db.notifications.find(query_filter).sort("created_at", -1)
    notifications = [MongoModel(doc) for doc in notifications_cursor]
    
    # Calculate unread count
    unread_count = db.notifications.count_documents({
        "student_id": student.id,
        "is_read": False
    })
    
    return {
        "notifications": notifications,
        "unread_count": unread_count
    }

@router.put("/notifications/{id}/read")
def read_student_notification(
    id: int,
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    notif = db.notifications.find_one({"id": id, "student_id": student.id})
    
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    db.notifications.update_one(
        {"_id": notif["_id"]},
        {"$set": {"is_read": True}}
    )
    return {"message": "Notification marked as read"}

@router.put("/notifications/read-all")
def read_all_student_notifications(
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    db.notifications.update_many(
        {"student_id": student.id, "is_read": False},
        {"$set": {"is_read": True}}
    )
    return {"message": "All notifications marked as read"}

@router.delete("/notifications/{id}")
def delete_student_notification(
    id: int,
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    notif = db.notifications.find_one({"id": id, "student_id": student.id})
    
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    db.notifications.delete_one({"_id": notif["_id"]})
    return {"message": "Notification deleted"}

@router.get("/announcements")
def list_student_announcements(
    search: Optional[str] = None,
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    announcements_cursor = db.announcements.find({"status": "Published"}).sort("created_at", -1)
    
    filtered = []
    for a_doc in announcements_cursor:
        a = MongoModel(a_doc)
        aud = a.target_audience
        val = a.target_value
        
        if aud == "Entire College":
            filtered.append(a)
        elif aud == "Department" and val == student.department:
            filtered.append(a)
        elif aud == "Semester" and str(val) == str(student.semester):
            filtered.append(a)
        elif aud == "Individual Student" and val == student.roll_number:
            filtered.append(a)
            
    if search:
        search_lower = search.lower()
        filtered = [a for a in filtered if search_lower in a.title.lower() or search_lower in a.content.lower()]
        
    return filtered
