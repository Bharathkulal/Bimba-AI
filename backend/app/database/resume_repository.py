from typing import Dict, Any
from datetime import datetime, timezone
import pymongo.errors
from app.core.exceptions import DatabaseException
from app.core.logging_service import log_stage, log_error
from app.core.mongodb import get_next_sequence

class ResumeRepository:
    def __init__(self, db: Any):
        self.db = db

    def save_parsed_resume(self, student_id: int, parsed_data: Dict[str, Any], filepath: str, cloudinary_url: str = None, public_id: str = None) -> int:
        log_stage("DATABASE", "START", "Initiating saving of parsed resume doc to database")
        
        # 1. Validate DB Connection health
        try:
            # Quick ping to verify active database connection
            self.db.client.admin.command('ping')
        except pymongo.errors.ConnectionFailure as e:
            log_error("DATABASE", "Database connection lost or offline", e)
            raise DatabaseException(f"MongoDB connection failed: {str(e)}")
            
        # 2. Get Auto-incrementing IDs
        try:
            next_id = get_next_sequence("resumes")
            default_edu_id = get_next_sequence("resume_education")
        except Exception as e:
            log_error("DATABASE", "Failed to retrieve next sequence ID counters", e)
            raise DatabaseException(f"Counter sequence generation failed: {str(e)}")
            
        # Structure nested items safely
        education = parsed_data.get("education", [])
        for idx, edu in enumerate(education):
            if not edu.get("id"):
                edu["id"] = default_edu_id if idx == 0 else get_next_sequence("resume_education")
                
        experience = parsed_data.get("experience", [])
        for exp in experience:
            if not exp.get("id"):
                exp["id"] = get_next_sequence("resume_experience")
                
        projects = parsed_data.get("projects", [])
        for proj in projects:
            if not proj.get("id"):
                proj["id"] = get_next_sequence("resume_project")
                
        skills = parsed_data.get("skills", [])
        for skill in skills:
            if not skill.get("id"):
                skill["id"] = get_next_sequence("resume_skill")

        personal_info = parsed_data.get("personal_info", {})
        
        resume_doc = {
            "id": next_id,
            "student_id": student_id,
            "name": f"AI Parsed - {personal_info.get('name', 'Resume')}",
            "resume_type": "Experienced" if len(experience) > 0 else "Fresher",
            "target_role": personal_info.get("title") or "Software Engineer",
            "career_objective": personal_info.get("summary") or "Tailored Resume profile.",
            "preferred_industry": "Technology",
            "language": "English",
            "expected_salary": "Competitive",
            "visibility": "Private",
            "status": "Draft",
            "template_id": "celestial",
            "color_theme": "blue",
            "ats_score": 70,
            
            # Map sections
            "phone": personal_info.get("phone", ""),
            "email": personal_info.get("email", ""),
            "address": personal_info.get("address", ""),
            "linkedin": personal_info.get("linkedin", ""),
            "github": personal_info.get("github", ""),
            "portfolio": personal_info.get("portfolio", ""),
            "summary": personal_info.get("summary", ""),
            
            "education": education,
            "experience": experience,
            "projects": projects,
            "skills": skills,
            "certificates": parsed_data.get("certifications", []) or parsed_data.get("certificates", []),
            "achievements_list": json_dumps_safe(parsed_data.get("achievements")),
            
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "file_path": filepath,
            "cloudinary_url": cloudinary_url,
            "resume": {
                "cloudinary": {
                    "url": cloudinary_url,
                    "public_id": public_id
                }
            } if cloudinary_url else {}
        }
        
        # 3. Perform Mongo Insert with detailed validations
        print("\n========== STEP 7 ==========")
        print("MongoDB")
        print("Document before insert:")
        # Render a sanitized JSON copy without datetime objects to avoid serialization print issues
        import copy
        sanitized_doc = copy.deepcopy(resume_doc)
        sanitized_doc["created_at"] = str(sanitized_doc["created_at"])
        sanitized_doc["updated_at"] = str(sanitized_doc["updated_at"])
        import json
        print(json.dumps(sanitized_doc, indent=2))
        
        try:
            insert_res = self.db.resumes.insert_one(resume_doc)
            print(f"Insert Result: Success | Inserted ID: {insert_res.inserted_id}")
            print("=============================\n")
            log_stage("DATABASE", "SUCCESS", "Resume document saved successfully", id=next_id)
        except pymongo.errors.DuplicateKeyError as e:
            print(f"Insert Result: DuplicateKeyError - {e}")
            print("=============================\n")
            log_error("DATABASE", "Duplicate unique key constraint triggered", e)
            raise DatabaseException(f"Duplicate resume index error: {str(e)}")
        except pymongo.errors.WriteError as e:
            print(f"Insert Result: WriteError - {e}")
            print("=============================\n")
            log_error("DATABASE", "Write validation error on database model schema", e)
            raise DatabaseException(f"Database schema validation error: {str(e)}")
        except Exception as e:
            print(f"Insert Result: General Error - {e}")
            print("=============================\n")
            log_error("DATABASE", "Failed to commit record insert", e)
            raise DatabaseException(f"Failed to save to database: {str(e)}")
            
        # Seed default ATS Scorecard
        try:
            self.db.resume_ats.insert_one({
                "id": get_next_sequence("resume_ats"),
                "resume_id": next_id,
                "overall_score": 70,
                "formatting_score": 70,
                "keyword_match": 70,
                "grammar_score": 70,
                "readability_score": 70,
                "recruiter_score": 70,
                "missing_keywords": "",
                "suggestions": "Review rewrites in dashboard.",
                "updated_at": datetime.now(timezone.utc)
            })
        except Exception as e:
            log_error("DATABASE", "ATS Scorecard initialization failed", e)
            
        return next_id

def json_dumps_safe(data: Any) -> str:
    try:
        import json
        return json.dumps(data) if data else ""
    except:
        return ""
