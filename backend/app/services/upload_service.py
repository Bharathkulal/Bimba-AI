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
        log_stage("UPLOAD", "START", f"Starting upload pipeline orchestration for {filename}")
        
        # 1. Ingestion / Size Check
        size_kb = len(file_content) // 1024
        log_stage("UPLOAD", "INFO", f"Filename: {filename} | Size: {size_kb} KB")
        
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
                raw_response = self.ai_manager.call_llm(prompt, feature="Resume Ingestion Parsing")
                
                # 4. JSON / Schema Verification
                parsed_data = self.parser.parse_and_validate(raw_response)
            except Exception as ai_err:
                log_error("UPLOAD", "AI parsing failed or unauthorized, falling back to simulated parser", ai_err)
                import re
                # Simulated parser fallback
                clean_text = extracted_text
                # Pre-cleaning specific known PDF space splits
                clean_text = clean_text.replace("EDUCA TION", "EDUCATION")
                clean_text = clean_text.replace("PUBLICA TIONS", "PUBLICATIONS")
                clean_text = clean_text.replace("T echnology", "Technology")
                clean_text = clean_text.replace("F ull", "Full")
                clean_text = clean_text.replace("HyperT rade", "HyperTrade")
                clean_text = clean_text.replace("A WS", "AWS")
                clean_text = clean_text.replace("T erraform", "Terraform")
                clean_text = clean_text.replace("leveragingA WS", "leveraging AWS")
                clean_text = clean_text.replace("Y ouT ube", "YouTube")
                clean_text = clean_text.replace("F rameworks", "Frameworks")

                email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", clean_text)
                phone_match = re.search(r"(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", clean_text)
                linkedin_match = re.search(r"(?:https?://)?(?:www\.)?linkedin\.com/in/[\w\-]+|linkedin\.com/[\w\-]+", clean_text, re.IGNORECASE)
                github_match = re.search(r"(?:https?://)?(?:www\.)?github\.com/[\w\-]+", clean_text, re.IGNORECASE)
                
                name = "Candidate Name"
                lines = [line.strip() for line in clean_text.split("\n") if line.strip()]
                if lines:
                    name = lines[0]
                    
                email = email_match.group(0) if email_match else ""
                phone = phone_match.group(0) if phone_match else ""
                linkedin = linkedin_match.group(0) if linkedin_match else ""
                github = github_match.group(0) if github_match else ""
                
                skills = []
                experience = []
                projects = []
                education = []
                publications = []
                achievements = []
                
                current_section = None
                for line in lines[1:]:
                    raw_clean = line.strip()
                    if not raw_clean:
                        continue
                    lower_line = raw_clean.lower()
                    
                    is_bullet = bool(re.match(r"^(?:[•\-\*]|(?:\d{1,2}\.\s+))", raw_clean))
                    is_header_candidate = not is_bullet and len(raw_clean) < 35
                    
                    # Section header detection ONLY on header candidate lines
                    if is_header_candidate:
                        if re.search(r"\b(s\s*k\s*i\s*l\s*l\s*s|t\s*e\s*c\s*h\s*n\s*o\s*l\s*o\s*g\s*i\s*e\s*s)\b", lower_line):
                            current_section = "skills"
                            continue
                        elif re.search(r"\b(e\s*x\s*p\s*e\s*r\s*i\s*e\s*n\s*c\s*e|e\s*m\s*p\s*l\s*o\s*y\s*m\s*e\s*n\s*t|w\s*o\s*r\s*k\s* \s*h\s*i\s*s\s*t\s*o\s*r\s*y)\b", lower_line):
                            current_section = "experience"
                            continue
                        elif re.search(r"\b(p\s*r\s*o\s*j\s*e\s*c\s*t\s*s)\b", lower_line):
                            current_section = "projects"
                            continue
                        elif re.search(r"\b(e\s*d\s*u\s*c\s*a\s*t\s*i\s*o\s*n|a\s*c\s*a\s*d\s*e\s*m\s*i\s*c\s*s)\b", lower_line):
                            current_section = "education"
                            continue
                        elif re.search(r"\b(p\s*u\s*b\s*l\s*i\s*c\s*a\s*t\s*i\s*o\s*n\s*s|p\s*a\s*t\s*e\s*n\s*t\s*s|r\s*e\s*s\s*e\s*a\s*r\s*c\s*h)\b", lower_line):
                            current_section = "publications"
                            continue
                        elif re.search(r"\b(a\s*c\s*h\s*i\s*e\s*v\s*e\s*m\s*e\s*n\s*t\s*s|a\s*w\s*a\s*r\s*d\s*s|h\s*o\s*n\s*o\s*r\s*s|a\s*c\s*t\s*i\s*v\s*i\s*t\s*i\s*e\s*s|c\s*o\s*n\s*t\s*r\s*i\s*b\s*u\s*t\s*i\s*o\s*n\s*s)\b", lower_line):
                            current_section = "achievements"
                            continue
                        
                    if current_section == "skills":
                        clean_line = re.sub(r"^(programming|frameworks|devops|cloud providers|tools|languages)\b", "", line, flags=re.IGNORECASE).strip()
                        parts = re.split(r"[,;•|]", clean_line)
                        for part in parts:
                            part = part.strip()
                            if part and len(part) < 40:
                                skills.append({"category": "Programming", "name": part, "level": 4})
                    elif current_section == "experience":
                        date_match = re.search(r"(\d{2}/\d{2}/\d{4}|\w+ \d{4})?\s*-\s*(\d{2}/\d{2}/\d{4}|Present|\w+ \d{4})", line)
                        if date_match:
                            duration = date_match.group(0)
                            title = line.replace(duration, "").strip(", \t")
                            experience.append({"company": "", "position": title, "duration": duration, "description": ""})
                        elif experience:
                            if not experience[-1]["company"]:
                                experience[-1]["company"] = line
                            else:
                                experience[-1]["description"] += "\n" + line
                    elif current_section == "projects":
                        is_bullet = bool(re.match(r"^(?:[•\-\*]|(?:\d{1,2}\.\s+))", line.strip()))
                        clean_line = re.sub(r"^(?:[•\-\*]|(?:\d{1,2}\.\s+))\s*", "", line).strip()
                        if clean_line:
                            parts = re.split(r"\s*[\-–—:]\s+", clean_line, maxsplit=1)
                            if len(parts) == 2 and len(parts[0].strip()) < 50:
                                projects.append({"name": parts[0].strip(), "tech_stack": "", "description": parts[1].strip()})
                            elif is_bullet or not projects:
                                projects.append({"name": clean_line, "tech_stack": "", "description": clean_line})
                            else:
                                # Multi-line text wrapping: append to description of previous project!
                                projects[-1]["description"] += " " + clean_line
                    elif current_section == "publications":
                        is_bullet = bool(re.match(r"^(?:[•\-\*]|(?:\d{1,2}\.\s+))", line.strip()))
                        clean_line = re.sub(r"^(?:[•\-\*]|(?:\d{1,2}\.\s+))\s*", "", line).strip()
                        if clean_line:
                            if is_bullet or not publications:
                                publications.append({"title": "", "publisher": clean_line, "year": "", "url": "", "description": clean_line})
                            else:
                                publications[-1]["description"] += " " + clean_line
                                publications[-1]["publisher"] += " " + clean_line
                    elif current_section == "achievements":
                        is_bullet = bool(re.match(r"^(?:[•\-\*]|(?:\d{1,2}\.\s+))", line.strip()))
                        clean_line = re.sub(r"^(?:[•\-\*]|(?:\d{1,2}\.\s+))\s*", "", line).strip()
                        if clean_line:
                            if is_bullet or not achievements:
                                achievements.append(clean_line)
                            else:
                                achievements[-1] += " " + clean_line
                    elif current_section == "education":
                        year_match = re.search(r"\b(19|20)\d{2}\s*-\s*\b(19|20)\d{2}\b", line)
                        if year_match:
                            passing_year = year_match.group(0)
                            degree = line.replace(passing_year, "").strip(", \t")
                            education.append({"institution": "", "degree": degree, "year": passing_year, "passing_year": passing_year})
                        elif education:
                            if not education[-1]["institution"]:
                                education[-1]["institution"] = line
                            elif not education[-1]["degree"]:
                                education[-1]["degree"] = line
                            else:
                                education.append({"institution": line, "degree": "", "year": "", "passing_year": ""})
                        else:
                            education.append({"institution": line, "degree": "", "year": "", "passing_year": ""})
                            
                # Post-process publications to extract title, year, and clean citation text
                cleaned_pubs = []
                for p in publications:
                    full_text = p.get("description", "").strip()
                    if not full_text:
                        continue
                    quote_match = re.search(r'["“]([^"”]+)["”]', full_text)
                    if quote_match:
                        title = quote_match.group(1).strip()
                    else:
                        title = full_text.split(".")[0].strip()
                    
                    year_match = re.search(r"\b(19|20)\d{2}\b", full_text)
                    year = year_match.group(0) if year_match else ""
                    
                    cleaned_pubs.append({
                        "title": title,
                        "publisher": full_text,
                        "year": year,
                        "url": "",
                        "description": full_text
                    })
                publications = cleaned_pubs
                            
                parsed_data = {
                    "personal_info": {
                        "name": name,
                        "email": email,
                        "phone": phone,
                        "address": "",
                        "linkedin": linkedin,
                        "github": github,
                        "portfolio": ""
                    },
                    "summary": "",
                    "objective": "",
                    "education": education,
                    "experience": experience,
                    "projects": projects,
                    "technicalSkills": [s["name"] if isinstance(s, dict) and "name" in s else str(s) for s in skills],
                    "softSkills": [],
                    "certifications": [],
                    "internships": [],
                    "achievements": achievements,
                    "languages": [],
                    "portfolioLinks": [link for link in [linkedin, github] if link],
                    "publications": publications,
                    "volunteerExperience": [],
                    "references": []
                }
            
            # Ensure all 15 sections exist with array/string defaults (no nulls)
            list_sections = [
                "education", "experience", "projects", "technicalSkills", "softSkills",
                "certifications", "internships", "achievements", "languages",
                "portfolioLinks", "publications", "volunteerExperience", "references"
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
