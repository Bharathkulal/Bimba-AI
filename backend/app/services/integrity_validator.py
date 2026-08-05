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
        
        sections_to_check = {
            "experience": "Work History/Experience",
            "projects": "Showcase Projects",
            "education": "Education Nodes",
            "certifications": "Certifications",
            "internships": "Internships",
            "publications": "Publications",
            "volunteerExperience": "Volunteer Experience",
            "references": "References"
        }
        
        # 1. Check list counts
        for key, name in sections_to_check.items():
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
                
        # 2. Check string arrays (skills, languages, achievements, hobbies)
        string_sections = {
            "skills": "Skills Profile",
            "technicalSkills": "Technical Skills",
            "softSkills": "Soft Skills",
            "achievements": "Achievements",
            "languages": "Languages",
            "hobbies": "Hobbies",
            "portfolioLinks": "Portfolio Links"
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
            
            missing = orig_set - curr_set
            if missing:
                # If skills list was modified/cleaned, we can treat it as warning instead of hard error
                # unless ALL skills are deleted.
                if len(curr_set) == 0 and len(orig_set) > 0:
                    errors.append(f"All {name} were deleted.")
                else:
                    warnings.append(f"Missing items in {name}: {', '.join(list(missing)[:5])}")

        # 3. Check personal info fields
        orig_pi = original.get("personal_info", {}) or {}
        curr_pi = current.get("personal_info", {}) or {}
        if isinstance(orig_pi, dict) and isinstance(curr_pi, dict):
            for k in ["name", "email", "phone"]:
                if orig_pi.get(k) and not curr_pi.get(k):
                    errors.append(f"Personal Information field '{k}' was cleared.")

        is_valid = len(errors) == 0
        return {
            "isValid": is_valid,
            "errors": errors,
            "warnings": warnings
        }
