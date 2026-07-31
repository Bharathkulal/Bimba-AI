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
        print("Schema Validation")
        
        standard_keys = {
            "personal_info": ["personal_info", "personalInfo", "contact", "profile", "personal_information", "personal", "about", "basic_info", "info"],
            "education": ["education", "educationInfo", "academic", "academics", "studies", "degree", "degrees", "qualifications"],
            "experience": ["experience", "work_experience", "workExperience", "history", "employment", "jobs", "work_history", "workHistory", "experiences"],
            "skills": ["skills", "key_skills", "technical_skills", "skillsInfo", "technologies", "skillset", "skill_sets"],
            "projects": ["projects", "project_details", "portfolio_projects", "experience_projects", "project_list"],
            "certifications": ["certifications", "certificates", "certifications_list", "credentials"],
            "achievements": ["achievements", "awards", "honors", "accomplishments"],
            "languages": ["languages", "languages_spoken", "spoken_languages"],
            "links": ["links", "urls", "social_links", "socials"]
        }
        
        normalized = {}
        for target, variations in standard_keys.items():
            found = False
            for var in variations:
                if var in parsed:
                    normalized[target] = parsed[var]
                    found = True
                    break
            if not found:
                # Set default empty collections if missing
                if target in ["education", "experience", "skills", "projects", "certifications", "languages", "links"]:
                    normalized[target] = []
                elif target == "achievements":
                    normalized[target] = {}
                else:
                    normalized[target] = {}
                    
        # Map personal_info nested fields
        personal_info = normalized.get("personal_info", {})
        if not isinstance(personal_info, dict) or not personal_info:
            personal_info = {}
            
        personal_fields_map = {
            "name": ["name", "fullName", "full_name"],
            "email": ["email", "emailAddress", "email_address"],
            "phone": ["phone", "phoneNumber", "phone_number", "contact_number", "mobile"],
            "address": ["address", "location", "city_state", "residence"],
            "linkedin": ["linkedin", "linkedin_url", "linkedinUrl"],
            "github": ["github", "github_url", "githubUrl"],
            "portfolio": ["portfolio", "portfolio_url", "portfolioUrl", "website"],
            "summary": ["summary", "about_me", "about", "objective", "career_objective", "profile"]
        }
        
        norm_personal = {}
        for target, variations in personal_fields_map.items():
            found = False
            for var in variations:
                if var in personal_info and personal_info[var]:
                    norm_personal[target] = str(personal_info[var]).strip()
                    found = True
                    break
            if not found:
                norm_personal[target] = ""
                
        # Leave empty if not extracted to avoid mock data issues
        pass
            
        normalized["personal_info"] = norm_personal
        
        # Ensure achievements has correct structure
        achievements = normalized.get("achievements", {})
        if not isinstance(achievements, dict) or not achievements:
            achievements = {}
        norm_achievements = {
            "hackathons": achievements.get("hackathons", "") or "",
            "awards": achievements.get("awards", "") or "",
            "soft_skills": achievements.get("soft_skills", "") or "",
            "extracurricular": achievements.get("extracurricular", "") or ""
        }
        normalized["achievements"] = norm_achievements
        
        # Ensure nested arrays contain valid objects
        for arr_key in ["education", "experience", "projects", "skills", "certifications"]:
            if not isinstance(normalized[arr_key], list):
                normalized[arr_key] = []
                
        print("Mapped Mappings and Auto-repair Results:")
        print(f"Required Fields Standardized: {list(normalized.keys())}")
        print("=============================\n")
        
        return normalized
