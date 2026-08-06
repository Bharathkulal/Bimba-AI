import json
import re
from typing import Dict, Any, List
from app.core.exceptions import JSONValidationException
from app.core.logging_service import log_stage, log_error

class ResumeParser:
    @staticmethod
    def parse_and_validate(raw_ai_text: str) -> Dict[str, Any]:
        print("\n========== STEP 5 ==========")
        print("JSON Parsing")
        
        # 1. Clean markdown formatting
        cleaned = raw_ai_text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()
        
        # 2. Repair trailing commas in arrays/objects
        # Remove trailing comma before closing bracket/brace
        cleaned = re.sub(r',\s*([\]}])', r'\1', cleaned)
        
        print("Cleaned JSON String Preview:")
        print(cleaned[:400] + ("..." if len(cleaned) > 400 else ""))
        print("=============================\n")
        
        # 3. Deserialize JSON
        try:
            parsed = json.loads(cleaned)
        except Exception as e:
            # Let's try secondary regex-based recovery if direct loads fails
            try:
                # Find the first '{' and last '}'
                start_idx = cleaned.find('{')
                end_idx = cleaned.rfind('}')
                if start_idx != -1 and end_idx != -1:
                    repaired = cleaned[start_idx:end_idx+1]
                    parsed = json.loads(repaired)
                else:
                    raise e
            except Exception as repair_err:
                log_error("PARSER", "Failed to parse AI response to valid JSON", repair_err)
                raise JSONValidationException(f"AI response is not valid JSON: {str(repair_err)}")
                
        # 4. Map equivalent variations of key names to standard keys
        print("========== STEP 6 ==========")
        print("Schema Validation & Full Section Normalization")
        
        standard_keys = {
            "personal_info": ["personal_info", "personalInfo", "contact", "profile", "personal_information", "personal", "basic_info", "info"],
            "summary": ["summary", "profile_summary", "professional_summary", "about_me", "about"],
            "objective": ["objective", "career_objective"],
            "education": ["education", "educationInfo", "academic", "academics", "studies", "degree", "degrees", "qualifications"],
            "experience": ["experience", "work_experience", "workExperience", "history", "employment", "jobs", "work_history", "experiences"],
            "internships": ["internships", "internship_experience", "industrial_training"],
            "projects": ["projects", "project_details", "portfolio_projects", "academic_projects", "project_list"],
            "skills": ["skills", "generic_skills"],
            "technicalSkills": ["technicalSkills", "technical_skills", "key_skills", "skillsInfo", "technologies", "skillset", "skill_sets"],
            "softSkills": ["softSkills", "soft_skills", "interpersonal_skills"],
            "tools": ["tools", "tool_list", "technologies_tools"],
            "languages": ["languages", "languages_spoken", "spoken_languages"],
            "certifications": ["certifications", "certificates", "certifications_list", "credentials"],
            "achievements": ["achievements", "awards_achievements", "accomplishments", "hackathons"],
            "awards": ["awards", "honors", "distinctions"],
            "research_papers": ["research_papers", "papers", "research"],
            "publications": ["publications", "research_publications"],
            "leadership": ["leadership", "leadership_experience"],
            "volunteerExperience": ["volunteerExperience", "volunteer", "social_service", "community_service"],
            "activities": ["activities", "extracurricular", "extra_curricular"],
            "portfolioLinks": ["portfolioLinks", "links", "urls", "social_links", "socials"],
            "references": ["references", "referees"],
            "hobbies": ["hobbies", "interests", "hobbies_interests", "personal_interests", "hobby"],
            "custom_sections": ["custom_sections", "custom"]
        }
        
        normalized = {}
        for target, variations in standard_keys.items():
            val = None
            for var in variations:
                if var in parsed and parsed[var] is not None:
                    val = parsed[var]
                    break
            
            if target in ["summary", "objective"]:
                normalized[target] = str(val).strip() if val else ""
            elif target == "personal_info":
                normalized[target] = val if isinstance(val, dict) else {}
            else:
                if isinstance(val, list):
                    normalized[target] = val
                elif isinstance(val, str) and val.strip():
                    normalized[target] = [val.strip()]
                elif isinstance(val, dict) and val:
                    normalized[target] = [val]
                else:
                    normalized[target] = []

        # Map personal_info nested fields
        personal_info = normalized.get("personal_info", {})
        personal_fields_map = {
            "name": ["name", "fullName", "full_name"],
            "email": ["email", "emailAddress", "email_address"],
            "phone": ["phone", "phoneNumber", "phone_number", "contact_number", "mobile"],
            "address": ["address", "location", "city_state", "residence"],
            "linkedin": ["linkedin", "linkedin_url", "linkedinUrl"],
            "github": ["github", "github_url", "githubUrl"],
            "portfolio": ["portfolio", "portfolio_url", "portfolioUrl", "website"],
            "title": ["title", "target_role", "role"]
        }
        
        norm_personal = {}
        for target, variations in personal_fields_map.items():
            found_val = ""
            for var in variations:
                if var in personal_info and personal_info[var]:
                    found_val = str(personal_info[var]).strip()
                    break
            norm_personal[target] = found_val

        # If summary/objective were inside personal_info, fallback extract them
        if not normalized["summary"] and "summary" in personal_info and personal_info["summary"]:
            normalized["summary"] = str(personal_info["summary"]).strip()
        if not normalized["objective"] and "objective" in personal_info and personal_info["objective"]:
            normalized["objective"] = str(personal_info["objective"]).strip()

        normalized["personal_info"] = norm_personal
        
        # Make sure skills compatibility: if technicalSkills has dict objects or strings, keep clean
        if not normalized["technicalSkills"] and "skills" in parsed:
            raw_skills = parsed["skills"]
            if isinstance(raw_skills, list):
                normalized["technicalSkills"] = raw_skills

        # Auto-collect completely unknown sections
        known_vars = set()
        for target, variations in standard_keys.items():
            known_vars.update(variations)
            
        custom_from_unknown = []
        for key, val in parsed.items():
            if key not in known_vars and val:
                content_list = []
                if isinstance(val, list):
                    for item in val:
                        if isinstance(item, dict):
                            content_list.append(json.dumps(item))
                        else:
                            content_list.append(str(item))
                elif isinstance(val, dict):
                    content_list.append(json.dumps(val))
                else:
                    content_list.append(str(val))
                
                custom_from_unknown.append({
                    "section_name": key.replace("_", " ").title(),
                    "content": content_list
                })
        
        # Append unknown custom sections to custom_sections
        if custom_from_unknown:
            normalized["custom_sections"] = normalized.get("custom_sections", []) + custom_from_unknown

        print("Mapped Mappings and Auto-repair Results:")
        print(f"Required Fields Standardized: {list(normalized.keys())}")
        print("=============================\n")
        
        return normalized
