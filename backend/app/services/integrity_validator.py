from typing import Dict, Any, List

class IntegrityValidationError(Exception):
    def __init__(self, message: str, details: Dict[str, Any]):
        super().__init__(message)
        self.details = details

class ResumeIntegrityValidator:
    @staticmethod
    def validate(original: Dict[str, Any], current: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates that no critical section items or values are silently lost/deleted.
        Compares item counts in experience, education, projects, certifications, etc.
        """
        errors = []
        warnings = []
        
        # 1. Standard List sections to check counts
        list_sections = {
            "education": "Education Nodes",
            "experience": "Work History/Experience",
            "internships": "Internships",
            "projects": "Showcase Projects",
            "certifications": "Certifications",
            "research_papers": "Research Papers",
            "publications": "Publications",
            "leadership": "Leadership",
            "volunteerExperience": "Volunteer Experience",
            "references": "References",
            "custom_sections": "Custom Sections"
        }
        
        for key, name in list_sections.items():
            orig_list = original.get(key, []) or []
            curr_list = current.get(key, []) or []
            
            if not isinstance(orig_list, list):
                orig_list = []
            if not isinstance(curr_list, list):
                curr_list = []
                
            orig_len = len(orig_list)
            curr_len = len(curr_list)
            
            if curr_len < orig_len:
                msg = f"{name} count dropped from {orig_len} to {curr_len}."
                errors.append(msg)
                
        # 2. String Arrays sections
        string_sections = {
            "skills": "Skills Profile",
            "technicalSkills": "Technical Skills",
            "softSkills": "Soft Skills",
            "tools": "Tools",
            "languages": "Languages",
            "achievements": "Achievements",
            "awards": "Awards",
            "activities": "Activities",
            "portfolioLinks": "Portfolio Links",
            "hobbies": "Hobbies"
        }
        
        for key, name in string_sections.items():
            orig_list = original.get(key, []) or []
            curr_list = current.get(key, []) or []
            
            if not isinstance(orig_list, list):
                orig_list = []
            if not isinstance(curr_list, list):
                curr_list = []
                
            orig_set = set(str(x).lower().strip() for x in orig_list if x)
            curr_set = set(str(x).lower().strip() for x in curr_list if x)
            
            if len(orig_set) > 0 and len(curr_set) == 0:
                msg = f"This section was not included: '{name}' was present in the original but is missing now. Please review."
                errors.append(msg)
            elif orig_set - curr_set:
                warnings.append(f"Missing items in {name}: {', '.join(list(orig_set - curr_set)[:5])}")

        # 3. Check personal info fields
        orig_pi = original.get("personal_info", {}) or {}
        curr_pi = current.get("personal_info", {}) or {}
        if isinstance(orig_pi, dict) and isinstance(curr_pi, dict):
            for k in ["name", "email", "phone"]:
                if orig_pi.get(k) and not curr_pi.get(k):
                    errors.append(f"Personal Information field '{k}' was cleared.")

        # 4. Text/String sections
        text_sections = {
            "summary": "Professional Summary",
            "objective": "Objective"
        }
        for key, name in text_sections.items():
            orig_text = str(original.get(key, "")).strip()
            curr_text = str(current.get(key, "")).strip()
            if orig_text and not curr_text:
                errors.append(f"This section was not included: '{name}' was present in the original but is missing now. Please review.")

        is_valid = len(errors) == 0
        return {
            "isValid": is_valid,
            "errors": errors,
            "warnings": warnings
        }
