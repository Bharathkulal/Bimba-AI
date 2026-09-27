from typing import Dict, Any, List

class DataCleaner:
    """
    Handles missing values and normalizes data arrays like skills.
    """
    
    @staticmethod
    def clean(resume_data: Dict[str, Any]) -> Dict[str, Any]:
        cleaned = dict(resume_data)
        
        # Ensure core arrays exist
        for key in ["skills", "experience", "education", "projects", "certifications"]:
            if key not in cleaned or not isinstance(cleaned[key], list):
                cleaned[key] = []
                
        # Normalize skills
        if cleaned["skills"]:
            cleaned["skills"] = DataCleaner._normalize_skills(cleaned["skills"])
            
        # Ensure strings are properly formatted
        for key in ["summary", "career_objective"]:
            if key in cleaned and isinstance(cleaned[key], str):
                cleaned[key] = cleaned[key].strip()
            else:
                cleaned[key] = ""
                
        return cleaned

    @staticmethod
    def _normalize_skills(skills: List[Any]) -> List[str]:
        """
        Lowercases, strips, and removes duplicate skills.
        Handles both strings and skill dictionary objects.
        """
        normalized_set = set()
        cleaned_list = []
        
        for skill in skills:
            skill_name = ""
            if isinstance(skill, dict):
                skill_name = skill.get("name") or skill.get("skill") or ""
            elif isinstance(skill, str):
                skill_name = skill
                
            skill_name = skill_name.strip().lower()
            
            # Simple dash/space normalization for consistency (e.g. machine-learning -> machine learning)
            skill_name = skill_name.replace("-", " ")
            
            if skill_name and skill_name not in normalized_set:
                normalized_set.add(skill_name)
                cleaned_list.append(skill_name)
                
        return cleaned_list
