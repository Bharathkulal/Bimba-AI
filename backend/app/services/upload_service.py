import os
from typing import Dict, Any
from app.core.exceptions import PipelineException
from app.core.logging_service import log_stage, log_error
from app.services.ocr_service import OCRService
from app.services.ai_provider_manager import AIProviderManager
from app.services.resume_parser import ResumeParser
from app.database.resume_repository import ResumeRepository
from app.ai.resume_prompts import RESUME_PARSE_PROMPT

class UploadService:
    def __init__(self, db: Any):
        self.db = db
        self.ocr_service = OCRService()
        self.ai_manager = AIProviderManager(db)
        self.parser = ResumeParser()
        self.repository = ResumeRepository(db)

    def process_upload(self, file_content: bytes, filename: str, student_id: int) -> Dict[str, Any]:
        # 1. Ingestion / Security Checks
        size_mb = len(file_content) / (1024 * 1024)
        if size_mb > 10.0:
            raise PipelineException(
                step="Ingestion / Size Check",
                provider="Core System",
                message=f"File exceeds maximum size limit of 10MB. Uploaded: {size_mb:.2f}MB"
            )

        ext = filename.lower().split('.')[-1]
        if ext not in ["pdf", "docx", "doc", "txt"]:
            raise PipelineException(
                step="Ingestion / Format Validation",
                provider="Core System",
                message=f"Forbidden file type: .{ext}. Only .pdf, .docx, .doc, and .txt files are allowed."
            )

        # Sanitize filename
        filename = "".join([c for c in filename if c.isalnum() or c in "._- "]).strip()
        log_stage("UPLOAD", "START", f"Starting upload pipeline orchestration for sanitized filename: {filename}")
        log_stage("UPLOAD", "INFO", f"Filename: {filename} | Size: {size_mb:.2f} MB")
        
        filepath = ""
        try:
            # Do not save physical local backup anymore, keep it in Cloudinary only.
            filepath = ""
                
            # 2. Extract Text via OCRService
            extracted_text = self.ocr_service.extract_text(file_content, filename)
            
            # 3. AI Parsing / Falling Back
            prompt = RESUME_PARSE_PROMPT.replace("{resume_text}", extracted_text)
            
            try:
                # Execute LLM Call using manager fallback chain
                raw_response = self.ai_manager.call_llm(prompt, feature="Resume Ingestion Parsing", response_format="json_object")
                
                # 4. JSON / Schema Verification
                parsed_data = self.parser.parse_and_validate(raw_response)
            except Exception as ai_err:
                log_error("UPLOAD", "AI LLM parsing failed or rate-limited; falling back to heuristic extraction", ai_err)
                try:
                    from app.services.resume_extraction_service import extract_structured_data
                    heuristic = extract_structured_data(extracted_text)
                    parsed_data = {
                        "personal_info": {
                            "name": heuristic.get("name", "Candidate Name"),
                            "email": heuristic.get("email", ""),
                            "phone": heuristic.get("phone", ""),
                            "location": heuristic.get("location", ""),
                            "title": "Software Engineer"
                        },
                        "summary": heuristic.get("summary", ""),
                        "objective": "",
                        "education": heuristic.get("education", []),
                        "experience": heuristic.get("experience", []),
                        "projects": heuristic.get("projects", []),
                        "technicalSkills": heuristic.get("skills", []),
                        "softSkills": heuristic.get("soft_skills", []),
                        "certifications": heuristic.get("certifications", []),
                        "internships": heuristic.get("internships", []),
                        "achievements": heuristic.get("achievements", []),
                        "languages": heuristic.get("languages", []),
                        "portfolioLinks": [],
                        "publications": heuristic.get("publications", []),
                        "volunteerExperience": [],
                        "references": [],
                        "hobbies": heuristic.get("hobbies", [])
                    }
                except Exception as fallback_err:
                    log_error("UPLOAD", "Heuristic fallback also failed", fallback_err)
                    raise PipelineException(
                        step="Resume Ingestion Parsing",
                        provider="Core System",
                        message="Resume ingestion failed to extract structured text.",
                        details=str(ai_err)
                    )
            
            # Ensure all 16 sections exist with array/string defaults (no nulls)
            list_sections = [
                "education", "experience", "projects", "technicalSkills", "softSkills",
                "certifications", "internships", "achievements", "languages",
                "portfolioLinks", "publications", "volunteerExperience", "references", "hobbies"
            ]
            for sec in list_sections:
                if sec not in parsed_data or parsed_data[sec] is None:
                    parsed_data[sec] = []
                elif not isinstance(parsed_data[sec], list):
                    parsed_data[sec] = [parsed_data[sec]]
                    
            for sec in ["summary", "objective"]:
                if sec not in parsed_data or parsed_data[sec] is None:
                    parsed_data[sec] = ""

            # 5. Database Save Operations
            cloudinary_url = None
            public_id = None
            try:
                from app.services.cloudinary_service import upload_file, is_configured
                if is_configured:
                    log_stage("UPLOAD", "INFO", f"Uploading {filename} to Cloudinary...")
                    c_res = upload_file(file_content, filename, folder="uploaded-resumes")
                    cloudinary_url = c_res.get("url")
                    public_id = c_res.get("public_id")
                    log_stage("UPLOAD", "INFO", f"Cloudinary upload success! URL: {cloudinary_url}")
            except Exception as cle:
                log_error("UPLOAD", "Cloudinary upload failed, falling back to local file copy", cle)

            resume_id = self.repository.save_parsed_resume(
                student_id=student_id,
                parsed_data=parsed_data,
                filepath=filepath,
                cloudinary_url=cloudinary_url,
                public_id=public_id
            )

            # Save / Upsert to MongoDB resume_profiles collection
            from datetime import datetime, timezone
            profile_doc = {
                "userId": student_id,
                "resumeId": resume_id,
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
                "hobbies": parsed_data.get("hobbies", []),
                "lastUpdated": datetime.now(timezone.utc).isoformat()
            }
            self.db.resume_profiles.update_one(
                {"resumeId": resume_id},
                {"$set": profile_doc},
                upsert=True
            )
            
            log_stage("UPLOAD", "COMPLETED", f"Orchestration completed successfully for {filename}")
            return {
                "success": True,
                "resume_id": resume_id,
                "parsed_data": parsed_data,
                "file_path": filepath,
                "cloudinary_url": cloudinary_url
            }
            
        except PipelineException as pe:
            # Re-raise known step exceptions directly
            raise pe
        except Exception as e:
            # Package generic unexpected failures cleanly
            log_error("UPLOAD", f"Unexpected pipeline failure on {filename}", e)
            raise PipelineException(
                step="Orchestration Pipeline",
                provider="Core Service",
                message=f"Pipeline failed: {str(e)}"
            )
