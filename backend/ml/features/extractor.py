from typing import Dict, Any

class FeatureExtractor:
    """
    Extracts deterministic numerical and categorical features from resume data.
    """
    
    @staticmethod
    def extract(resume_data: Dict[str, Any]) -> Dict[str, Any]:
        features = {}
        
        # 1. Structural features
        features["num_skills"] = len(resume_data.get("skills", []))
        features["num_experience"] = len(resume_data.get("experience", []))
        features["num_education"] = len(resume_data.get("education", []))
        features["num_projects"] = len(resume_data.get("projects", []))
        features["num_certifications"] = len(resume_data.get("certifications", []))
        
        # 2. Completeness features
        features["has_summary"] = 1 if resume_data.get("summary") else 0
        
        # 3. Text derived features (Length of descriptions)
        exp_text_len = 0
        for exp in resume_data.get("experience", []):
            if isinstance(exp, dict):
                desc = exp.get("description") or ""
                exp_text_len += len(str(desc))
            else:
                exp_text_len += len(str(exp))
        features["total_experience_text_length"] = exp_text_len
        
        proj_text_len = 0
        for proj in resume_data.get("projects", []):
            if isinstance(proj, dict):
                desc = proj.get("description") or ""
                proj_text_len += len(str(desc))
            else:
                proj_text_len += len(str(proj))
        features["total_project_text_length"] = proj_text_len
        
        return features
