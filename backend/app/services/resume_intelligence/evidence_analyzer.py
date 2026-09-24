from typing import Dict, Any, List
from app.services.resume_intelligence.models import EvidenceAnalysis
from app.services.job_matching.skill_normalizer import SkillNormalizer

class EvidenceAnalyzer:
    @staticmethod
    def analyze(resume_data: Dict[str, Any]) -> EvidenceAnalysis:
        analysis = EvidenceAnalysis()
        
        # 1. Extract listed skills
        listed_skills = []
        raw_skills = resume_data.get("technical_skills", resume_data.get("skills", []))
        if isinstance(raw_skills, dict):
            flat = raw_skills.get("flat", [])
            for s in flat:
                if isinstance(s, str):
                    listed_skills.append(s)
        elif isinstance(raw_skills, list):
            for s in raw_skills:
                if isinstance(s, dict) and "skills" in s:
                    for sub_s in s.get("skills", []):
                        if isinstance(sub_s, str):
                            listed_skills.append(sub_s)
                elif isinstance(s, str):
                    listed_skills.append(s)
                    
        if not listed_skills:
            return analysis
            
        # 2. Extract evidence text from Experience and Projects
        evidence_texts = []
        for proj in resume_data.get("projects", []):
            if isinstance(proj, dict):
                evidence_texts.append(str(proj.get("description", "")).lower())
                evidence_texts.append(str(proj.get("technologies", "")).lower())
                
        for exp in resume_data.get("experience", resume_data.get("work_experience", [])):
            if isinstance(exp, dict):
                evidence_texts.append(str(exp.get("description", "")).lower())
                for resp in exp.get("responsibilities", []):
                    evidence_texts.append(str(resp).lower())
                    
        full_evidence_text = " ".join(evidence_texts)
        
        # 3. Cross-reference
        for skill in listed_skills:
            norm_skill = SkillNormalizer.normalize(skill)
            if not norm_skill:
                continue
                
            # If the normalized skill is found in evidence text (naive substring)
            # using word boundaries for accuracy
            import re
            if re.search(r'\b' + re.escape(norm_skill) + r'\b', full_evidence_text):
                analysis.skills_with_evidence.append(skill)
            else:
                analysis.skills_without_evidence.append(skill)
                
        return analysis
