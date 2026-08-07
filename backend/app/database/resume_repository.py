from typing import Dict, Any
from datetime import datetime, timezone
import json
import pymongo.errors
from app.core.exceptions import DatabaseException
from app.core.logging_service import log_stage, log_error
from app.core.mongodb import get_next_sequence, get_next_sequence_batch

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
            
        import time
        import logging
        logger = logging.getLogger("bimba_ai_pipeline")

        logger.info("[RESUME] Mongo compilation START")
        compilation_start = time.perf_counter()

        # 2. Get Auto-incrementing IDs
        try:
            t_ids_start = time.perf_counter()
            next_id = get_next_sequence("resumes")
            logger.info("[RESUME] Building metadata")
            logger.info("[RESUME] Metadata/resumes sequence ID retrieved in %.4fs", time.perf_counter() - t_ids_start)
        except Exception as e:
            log_error("DATABASE", "Failed to retrieve next sequence ID counters", e)
            raise DatabaseException(f"Counter sequence generation failed: {str(e)}")
            
        # Structure nested items safely using batch sequence generator
        # 1. Education
        t_edu_start = time.perf_counter()
        logger.info("[RESUME] Building education")
        edu_list = parsed_data.get("education", []) or []
        edu_to_gen = sum(1 for edu in edu_list if not (isinstance(edu, dict) and edu.get("id")))
        start_edu_id = get_next_sequence_batch("resume_education", edu_to_gen) if edu_to_gen > 0 else 0
        
        education_list = []
        for idx, edu in enumerate(edu_list):
            if isinstance(edu, str):
                edu = {"degree": edu, "institution": "", "year": ""}
            elif not isinstance(edu, dict):
                edu = {}
            if not edu.get("id"):
                edu["id"] = start_edu_id
                start_edu_id += 1
            education_list.append(edu)
        education = education_list
        logger.info("[RESUME] Education section compiled in %.4fs", time.perf_counter() - t_edu_start)
                
        # 2. Experience
        t_exp_start = time.perf_counter()
        logger.info("[RESUME] Building experience")
        exp_list = parsed_data.get("experience", []) or []
        exp_to_gen = sum(1 for exp in exp_list if not (isinstance(exp, dict) and exp.get("id")))
        start_exp_id = get_next_sequence_batch("resume_experience", exp_to_gen) if exp_to_gen > 0 else 0
        
        experience_list = []
        for exp in exp_list:
            if isinstance(exp, str):
                exp = {"position": "", "company": "", "duration": "", "description": exp}
            elif not isinstance(exp, dict):
                exp = {}
            if not exp.get("id"):
                exp["id"] = start_exp_id
                start_exp_id += 1
            experience_list.append(exp)
        experience = experience_list
        logger.info("[RESUME] Experience section compiled in %.4fs", time.perf_counter() - t_exp_start)
                
        # 3. Internships
        t_intern_start = time.perf_counter()
        logger.info("[RESUME] Building internships")
        internships = parsed_data.get("internships", []) or []
        logger.info("[RESUME] Internships compiled in %.4fs", time.perf_counter() - t_intern_start)

        # 4. Projects
        t_proj_start = time.perf_counter()
        logger.info("[RESUME] Building projects")
        proj_list = parsed_data.get("projects", []) or []
        proj_to_gen = sum(1 for proj in proj_list if not (isinstance(proj, dict) and proj.get("id")))
        start_proj_id = get_next_sequence_batch("resume_project", proj_to_gen) if proj_to_gen > 0 else 0
        
        projects_list = []
        for proj in proj_list:
            if isinstance(proj, str):
                proj = {"title": "", "technologies": "", "description": proj}
            elif not isinstance(proj, dict):
                proj = {}
            if not proj.get("id"):
                proj["id"] = start_proj_id
                start_proj_id += 1
            projects_list.append(proj)
        projects = projects_list
        logger.info("[RESUME] Projects section compiled in %.4fs", time.perf_counter() - t_proj_start)
                
        # 5. Skills
        t_skill_start = time.perf_counter()
        logger.info("[RESUME] Building skills")
        skill_list = parsed_data.get("skills", []) or []
        skill_to_gen = sum(1 for skill in skill_list if not (isinstance(skill, dict) and skill.get("id")))
        start_skill_id = get_next_sequence_batch("resume_skill", skill_to_gen) if skill_to_gen > 0 else 0
        
        skills_list = []
        for skill in skill_list:
            if isinstance(skill, str):
                skill = {"name": skill}
            elif not isinstance(skill, dict):
                skill = {}
            if not skill.get("id"):
                skill["id"] = start_skill_id
                start_skill_id += 1
            skills_list.append(skill)
        skills = skills_list
        logger.info("[RESUME] Skills section compiled in %.4fs", time.perf_counter() - t_skill_start)

        # 6. Certifications, Achievements, Languages, Raw Text
        logger.info("[RESUME] Building certifications")
        logger.info("[RESUME] Building achievements")
        logger.info("[RESUME] Building languages")
        logger.info("[RESUME] Building raw text")

        t_personal_start = time.perf_counter()
        logger.info("[RESUME] Building personal information")
        personal_info = parsed_data.get("personal_info", {})
        logger.info("[RESUME] Personal info compiled in %.4fs", time.perf_counter() - t_personal_start)
        
        resume_doc = {
            "id": next_id,
            "student_id": student_id,
            "name": f"AI Parsed - {personal_info.get('name') or 'Resume'}",
            "resume_type": "Experienced" if len(experience) > 0 else "Fresher",
            "target_role": personal_info.get("title") or "",
            "career_objective": parsed_data.get("objective") or parsed_data.get("summary") or "",
            "preferred_industry": "",
            "language": "English",
            "expected_salary": "",
            "visibility": "Private",
            "status": "Draft",
            "template_id": "harvard",
            "color_theme": "indigo",
            "ats_score": 0,
            
            # Map sections
            "phone": personal_info.get("phone", ""),
            "email": personal_info.get("email", ""),
            "address": personal_info.get("address", ""),
            "linkedin": personal_info.get("linkedin", ""),
            "github": personal_info.get("github", ""),
            "portfolio": personal_info.get("portfolio", ""),
            "summary": parsed_data.get("summary") or personal_info.get("summary", ""),
            
            "education": education,
            "experience": experience,
            "projects": projects,
            "skills": skills,
            "certificates": parsed_data.get("certifications", []) or parsed_data.get("certificates", []),
            "achievements_list": json.dumps(parsed_data.get("achievements", [])),
            "hobbies": parsed_data.get("hobbies", []),
            
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
        logger.info("[RESUME] Mongo document object CREATED")
        
        # 3. Perform Mongo Insert with detailed validations
        logger.info("[RESUME] Mongo validation START")
        print("\n========== STEP 7 ==========")
        print("MongoDB")
        print("Document before insert:")
        # Render a sanitized JSON copy without datetime objects to avoid serialization print issues
        import copy
        sanitized_doc = copy.deepcopy(resume_doc)
        sanitized_doc["created_at"] = str(sanitized_doc["created_at"])
        sanitized_doc["updated_at"] = str(sanitized_doc["updated_at"])
        import json      
        try:
            print(json.dumps(sanitized_doc, indent=2))
        except UnicodeEncodeError:
            import sys
            safe_str = json.dumps(sanitized_doc, indent=2)
            print(safe_str.encode(sys.stdout.encoding or 'utf-8', errors='replace').decode(sys.stdout.encoding or 'utf-8'))
        logger.info("[RESUME] Mongo validation COMPLETE")

        logger.info("[RESUME] Mongo save START")
        t_save_start = time.perf_counter()
        try:
            insert_res = self.db.resumes.insert_one(resume_doc)
            print(f"Insert Result: Success | Inserted ID: {insert_res.inserted_id}")
            print("=============================\n")
            log_stage("DATABASE", "SUCCESS", "Resume document saved successfully", id=next_id)
            logger.info("[RESUME] Mongo save COMPLETE")
            logger.info("[RESUME] Database save completed in %.4fs", time.perf_counter() - t_save_start)
            logger.info("[RESUME] Mongo compilation END")
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

        # Sync profile document to resume_profiles collection
        try:
            profile_doc = {
                "userId": student_id,
                "resumeId": next_id,
                "personal_info": parsed_data.get("personal_info", {}),
                "summary": parsed_data.get("summary", ""),
                "objective": parsed_data.get("objective", ""),
                "education": parsed_data.get("education", []),
                "experience": parsed_data.get("experience", []),
                "projects": parsed_data.get("projects", []),
                "technicalSkills": parsed_data.get("technicalSkills", []),
                "softSkills": parsed_data.get("softSkills", []),
                "certifications": parsed_data.get("certifications", []),
                "internships": parsed_data.get("internships", []),
                "achievements": parsed_data.get("achievements", []),
                "languages": parsed_data.get("languages", []),
                "portfolioLinks": parsed_data.get("portfolioLinks", []),
                "publications": parsed_data.get("publications", []),
                "volunteerExperience": parsed_data.get("volunteerExperience", []),
                "references": parsed_data.get("references", []),
                "lastUpdated": datetime.now(timezone.utc).isoformat()
            }
            self.db.resume_profiles.update_one(
                {"resumeId": next_id},
                {"$set": profile_doc},
                upsert=True
            )
        except Exception as e:
            log_error("DATABASE", "resume_profiles initialization failed", e)
            
        return next_id

def json_dumps_safe(data: Any) -> str:
    try:
        import json
        return json.dumps(data) if data else ""
    except:
        return ""
