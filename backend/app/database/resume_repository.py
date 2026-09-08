from typing import Dict, Any, Optional
from datetime import datetime, timezone
import json
import pymongo.errors
from app.core.exceptions import DatabaseException
from app.core.logging_service import log_stage, log_error
from app.core.mongodb import get_next_sequence, get_next_sequence_batch
import time
import logging

class ResumeRepository:
    def __init__(self, db: Any):
        self.db = db

    def save_parsed_resume(
        self,
        student_id: int,
        parsed_data: Dict[str, Any],
        filepath: str,
        cloudinary_url: Optional[str] = None,
        public_id: Optional[str] = None,
        raw_extraction_data: Optional[Dict[str, Any]] = None,
        raw_text: Optional[str] = None,
        original_file_meta: Optional[Dict[str, Any]] = None,
        validation_meta: Optional[Dict[str, Any]] = None
    ) -> int:
        # Canonicalize parsed data safely
        try:
            from app.services.resume_canonicalizer import canonicalize_parsed_data
            parsed_data = canonicalize_parsed_data(parsed_data or {})
        except Exception:
            pass

        log_stage("DATABASE", "START", "Initiating saving of parsed resume doc to database")
        
        next_id = get_next_sequence("resumes")
        student = self.db.students.find_one({"id": student_id})
        roll_number = student.get("roll_number") if student else None
        
        logger = logging.getLogger("bimba_ai_pipeline")
        logger.info("[RESUME] Beginning transaction save logic for roll: %s", roll_number)
        
        # 1. Education
        edu_list = parsed_data.get("education", []) or []
        education_list = []
        for idx, edu in enumerate(edu_list):
            edu_dict: Dict[str, Any] = {}
            if isinstance(edu, str):
                edu_dict = {"degree": edu, "institution": "", "year": "", "cgpa_percentage": ""}
            elif isinstance(edu, dict):
                edu_dict = dict(edu)
            if not edu_dict.get("id"):
                edu_dict["id"] = idx + 1
            education_list.append(edu_dict)
        education = education_list

                
        # 2. Experience
        exp_list = parsed_data.get("experience", []) or parsed_data.get("work_experience", []) or []
        experience_list = []
        for idx, exp in enumerate(exp_list):
            exp_dict: Dict[str, Any] = {}
            if isinstance(exp, str):
                exp_dict = {"position": "", "company": "", "duration": "", "description": exp}
            elif isinstance(exp, dict):
                exp_dict = dict(exp)
            if not exp_dict.get("id"):
                exp_dict["id"] = idx + 1
            experience_list.append(exp_dict)
        experience = experience_list
                
        # 3. Internships
        internships = parsed_data.get("internships", []) or []
 
        # 4. Projects
        proj_list = parsed_data.get("projects", []) or []
        projects_list = []
        for idx, proj in enumerate(proj_list):
            proj_dict: Dict[str, Any] = {}
            if isinstance(proj, str):
                proj_dict = {"title": "", "technologies": "", "description": proj}
            elif isinstance(proj, dict):
                proj_dict = dict(proj)
            if not proj_dict.get("id"):
                proj_dict["id"] = idx + 1
            projects_list.append(proj_dict)
        projects = projects_list
                
        # 5. Skills
        skill_list = parsed_data.get("skills", []) or parsed_data.get("technicalSkills", []) or []
        skills_list = []
        if isinstance(skill_list, list):
            for skill in skill_list:
                if isinstance(skill, str):
                    skills_list.append({"name": skill})
                elif isinstance(skill, dict):
                    skills_list.append(dict(skill))
        skills = skills_list

        personal_info = parsed_data.get("personal_info", {})
        
        resume_doc = {
            "id": next_id,
            "student_id": student_id,
            "name": f"AI Parsed - {personal_info.get('name') or 'Resume'}",
            "resume_type": "Experienced" if len(experience) > 0 else "Fresher",
            "target_role": personal_info.get("title") or "",
            "career_objective": parsed_data.get("objective") or parsed_data.get("career_objective") or "",
            "objective": parsed_data.get("objective") or parsed_data.get("career_objective") or "",
            "preferred_industry": "",
            "language": "English",
            "expected_salary": "",
            "visibility": "Private",
            "status": "Draft",
            "template_id": "microsoft",
            "color_theme": "indigo",
            "ats_score": validation_meta.get("completeness_score", 85) if validation_meta else 85,
            
            # Contact Details
            "phone": personal_info.get("phone", ""),
            "email": personal_info.get("email", ""),
            "address": personal_info.get("address", ""),
            "location": personal_info.get("location", ""),
            "linkedin": personal_info.get("linkedin", ""),
            "github": personal_info.get("github", ""),
            "portfolio": personal_info.get("portfolio", ""),
            "summary": parsed_data.get("summary") or personal_info.get("summary", ""),
            "professional_summary": parsed_data.get("summary") or "",
            
            # Core Sections
            "education": education,
            "experience": experience,
            "work_experience": experience,
            "internships": internships,
            "projects": projects,
            "skills": skills,
            "technicalSkills": parsed_data.get("technicalSkills", []),
            "softSkills": parsed_data.get("softSkills", []),
            "personal_skills": parsed_data.get("personal_skills", []),
            "certifications": parsed_data.get("certifications", []),
            "publications": parsed_data.get("publications", []),
            "achievements": parsed_data.get("achievements", []),
            "achievements_list": json.dumps(parsed_data.get("achievements", [])),
            "leadership_roles": parsed_data.get("leadership_roles", []),
            "leadership": parsed_data.get("leadership_roles", []),
            "hobbies": parsed_data.get("hobbies", []),
            "languages": parsed_data.get("languages", []),
            "personal_details": parsed_data.get("personal_details", {}),
            "additional_information": parsed_data.get("additional_information", []),
            "custom_sections": parsed_data.get("custom_sections", []),
            "portfolioLinks": parsed_data.get("portfolioLinks", []),
            "volunteerExperience": parsed_data.get("volunteerExperience", []),
            "references": parsed_data.get("references", []),
            
            # Zero-Loss Fields
            "source_content": parsed_data.get("source_content") or {"all_sections": [], "all_facts": []},
            "raw_extracted_text": raw_text or "",
            "raw_extraction": raw_extraction_data or {},
            "original_parsed_data": parsed_data,
            "original_file": original_file_meta or {},
            "validation": validation_meta or {},
            "extraction_version": "2.0",
            
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "file_path": filepath,
            "cloudinary_url": cloudinary_url,
            "resume": {
                "cloudinary": {
                    "url": cloudinary_url,
                    "public_id": public_id
                },
                "personal_info": personal_info,
                "summary": parsed_data.get("summary", ""),
                "objective": parsed_data.get("objective", ""),
                "education": education,
                "experience": experience,
                "internships": internships,
                "projects": projects,
                "skills": skills,
                "technicalSkills": parsed_data.get("technicalSkills", []),
                "softSkills": parsed_data.get("softSkills", []),
                "certifications": parsed_data.get("certifications", []),
                "publications": parsed_data.get("publications", []),
                "achievements": parsed_data.get("achievements", []),
                "leadership_roles": parsed_data.get("leadership_roles", []),
                "hobbies": parsed_data.get("hobbies", []),
                "languages": parsed_data.get("languages", []),
                "personal_details": parsed_data.get("personal_details", {}),
                "additional_information": parsed_data.get("additional_information", [])
            }
        }
        
        try:
            self.db.resumes.insert_one(resume_doc)
            log_stage("DATABASE", "SUCCESS", "Resume document saved successfully", id=next_id)
        except pymongo.errors.DuplicateKeyError as e:
            log_error("DATABASE", "Duplicate unique key constraint triggered", e)
            raise DatabaseException(f"Duplicate resume index error: {str(e)}")
        except Exception as e:
            log_error("DATABASE", "Failed to commit record insert", e)
            raise DatabaseException(f"Failed to save to database: {str(e)}")
            
        # Seed ATS Scorecard
        try:
            self.db.resume_ats.insert_one({
                "id": get_next_sequence("resume_ats"),
                "resume_id": next_id,
                "overall_score": validation_meta.get("completeness_score", 85) if validation_meta else 85,
                "formatting_score": 85,
                "keyword_match": 80,
                "grammar_score": 90,
                "readability_score": 85,
                "recruiter_score": 85,
                "missing_keywords": "",
                "suggestions": "Review rewrites and verified sections in studio dashboard.",
                "updated_at": datetime.now(timezone.utc)
            })
        except Exception as e:
            log_error("DATABASE", "ATS Scorecard initialization failed", e)

        # Sync profile document to resume_profiles collection
        try:
            profile_doc = {
                "userId": student_id,
                "resumeId": next_id,
                "personal_info": personal_info,
                "summary": parsed_data.get("summary", ""),
                "objective": parsed_data.get("objective", ""),
                "education": education,
                "experience": experience,
                "work_experience": experience,
                "internships": internships,
                "projects": projects,
                "skills": parsed_data.get("skills", []),
                "technicalSkills": parsed_data.get("technicalSkills", []),
                "softSkills": parsed_data.get("softSkills", []),
                "personal_skills": parsed_data.get("personal_skills", []),
                "certifications": parsed_data.get("certifications", []),
                "publications": parsed_data.get("publications", []),
                "achievements": parsed_data.get("achievements", []),
                "leadership_roles": parsed_data.get("leadership_roles", []),
                "leadership": parsed_data.get("leadership_roles", []),
                "hobbies": parsed_data.get("hobbies", []),
                "languages": parsed_data.get("languages", []),
                "personal_details": parsed_data.get("personal_details", {}),
                "additional_information": parsed_data.get("additional_information", []),
                "custom_sections": parsed_data.get("custom_sections", []),
                "portfolioLinks": parsed_data.get("portfolioLinks", []),
                "volunteerExperience": parsed_data.get("volunteerExperience", []),
                "references": parsed_data.get("references", []),
                "raw_extracted_text": raw_text or "",
                "validation": validation_meta or {},
                "lastUpdated": datetime.now(timezone.utc).isoformat()
            }
            self.db.resume_profiles.update_one(
                {"resumeId": next_id},
                {"$set": profile_doc},
                upsert=True
            )
        except Exception as e:
            log_error("DATABASE", "Sync to resume_profiles collection failed", e)

        return next_id
