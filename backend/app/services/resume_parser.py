import json
import re
from typing import Dict, Any, List
from app.core.exceptions import JSONValidationException
from app.core.logging_service import log_stage, log_error

def unwrap_json_text(text: Any) -> str:
    if not text:
        return ""
    if isinstance(text, dict):
        for k in ["summary", "professionalSummary", "profile_summary", "profileSummary", "objective", "content", "text", "description"]:
            if k in text and text[k] and isinstance(text[k], (str, dict)):
                res = unwrap_json_text(text[k])
                if res:
                    return res
        vals = [unwrap_json_text(v) for v in text.values() if isinstance(v, (str, dict)) and str(v).strip()]
        return " ".join([v for v in vals if v]) if vals else str(text)
    
    if isinstance(text, str):
        s = text.strip()
        if s.startswith("```"):
            lines = s.split("\n")
            if len(lines) > 2 and lines[-1].startswith("```"):
                s = "\n".join(lines[1:-1]).strip()
        if s.startswith("{") and s.endswith("}"):
            try:
                data = json.loads(s)
                return unwrap_json_text(data)
            except Exception:
                pass
        return s.strip('"\'')
    return str(text)

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
            "personal_info": ["personal_info", "personalInfo", "contact", "profile", "personal_information", "personal", "basic_info", "info", "contact_information", "contact_info"],
            "summary": ["summary", "profile_summary", "professional_summary", "professionalSummary", "profileSummary", "about_me", "about", "summary_text"],
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
                normalized[target] = unwrap_json_text(val) if val else ""
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

        # Map personal_info nested fields (merging personal_information and contact_information)
        personal_info = normalized.get("personal_info", {})
        contact_info = parsed.get("contact_information") or parsed.get("contact_info") or parsed.get("contact") or {}
        if isinstance(contact_info, dict):
            merged_personal = {**contact_info, **(personal_info if isinstance(personal_info, dict) else {})}
        else:
            merged_personal = personal_info if isinstance(personal_info, dict) else {}

        personal_fields_map = {
            "name": ["name", "fullName", "full_name"],
            "email": ["email", "emailAddress", "email_address"],
            "phone": ["phone", "phoneNumber", "phone_number", "contact_number", "mobile"],
            "address": ["address", "location", "city_state", "residence"],
            "linkedin": ["linkedin", "linkedin_url", "linkedinUrl"],
            "github": ["github", "github_url", "githubUrl"],
            "portfolio": ["portfolio", "portfolio_url", "portfolioUrl", "website"],
            "title": ["title", "target_role", "role", "designation", "headline", "job_title"]
        }
        
        norm_personal = {}
        for target, variations in personal_fields_map.items():
            found_val = ""
            for var in variations:
                if var in merged_personal and merged_personal[var]:
                    found_val = unwrap_json_text(merged_personal[var])
                    break
            norm_personal[target] = found_val

        # If summary/objective were inside personal_info or contact_info, fallback extract them
        if not normalized["summary"] and "summary" in merged_personal and merged_personal["summary"]:
            normalized["summary"] = unwrap_json_text(merged_personal["summary"])
        if not normalized["objective"] and "objective" in merged_personal and merged_personal["objective"]:
            normalized["objective"] = unwrap_json_text(merged_personal["objective"])

        normalized["personal_info"] = norm_personal
        
        # Flatten skills dictionary into technicalSkills list of strings
        raw_skills = parsed.get("skills") or parsed.get("technical_skills") or parsed.get("technicalSkills")
        if isinstance(raw_skills, dict):
            flat_skills = []
            for k, v in raw_skills.items():
                if isinstance(v, list):
                    for item in v:
                        if isinstance(item, str) and item.strip():
                            flat_skills.append(unwrap_json_text(item))
                elif isinstance(v, str) and v.strip():
                    flat_skills.append(unwrap_json_text(v))
            if flat_skills:
                normalized["technicalSkills"] = flat_skills
        elif isinstance(raw_skills, list):
            flat_skills = []
            for item in raw_skills:
                if isinstance(item, str) and item.strip():
                    flat_skills.append(unwrap_json_text(item))
                elif isinstance(item, dict):
                    for k, v in item.items():
                        if isinstance(v, list):
                            flat_skills.extend([unwrap_json_text(x) for x in v if str(x).strip()])
                        elif isinstance(v, str) and v.strip():
                            flat_skills.append(unwrap_json_text(v))
            if flat_skills:
                normalized["technicalSkills"] = flat_skills

        # Auto-collect completely unknown sections
        known_vars = set()
        for target, variations in standard_keys.items():
            known_vars.update(variations)
        known_vars.update([
            "contact_information", "contact_info", "personal_information",
            "source_content", "source_facts", "all_facts", "all_sections",
            "raw_extraction", "original_parsed_data", "extraction_version",
            "extraction_incomplete", "extraction_incomplete_reason"
        ])
            
        custom_from_unknown = []
        for key, val in parsed.items():
            if key not in known_vars and val:
                content_list = []
                if isinstance(val, list):
                    for item in val:
                        cleaned_item = unwrap_json_text(item)
                        if cleaned_item:
                            content_list.append(cleaned_item)
                elif isinstance(val, dict):
                    cleaned_item = unwrap_json_text(val)
                    if cleaned_item:
                        content_list.append(cleaned_item)
                else:
                    cleaned_item = unwrap_json_text(val)
                    if cleaned_item:
                        content_list.append(cleaned_item)
                
                if content_list:
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
