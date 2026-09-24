import collections
import re
from typing import Dict, Any, List
from app.services.resume_intelligence.models import KeywordAnalysis
from app.services.job_matching.skill_normalizer import SkillNormalizer
from app.services.job_matching.job_requirement_parser import JobRequirementParser

class KeywordAnalyzer:
    @staticmethod
    def analyze_general(resume_data: Dict[str, Any]) -> KeywordAnalysis:
        analysis = KeywordAnalysis()
        
        # Extract text from all sections
        texts = []
        for section in ["summary", "career_objective"]:
            texts.append(str(resume_data.get(section, "")))
            
        for proj in resume_data.get("projects", []):
            if isinstance(proj, dict):
                texts.append(str(proj.get("description", "")))
                
        for exp in resume_data.get("experience", resume_data.get("work_experience", [])):
            if isinstance(exp, dict):
                texts.append(str(exp.get("description", "")))
                
        full_text = " ".join(texts).lower()
        
        # Extract words (simple tokenizer)
        words = re.findall(r'\b[a-z]{4,}\b', full_text)
        
        # Remove common stop words
        stop_words = {"this", "that", "with", "from", "your", "have", "more", "will", "what", "about", "which", "when", "there", "their"}
        filtered_words = [w for w in words if w not in stop_words]
        
        # Find highly repeated terms
        counter = collections.Counter(filtered_words)
        for word, count in counter.items():
            if count > 5: # Arbitrary threshold for repeating terms
                analysis.repeated_terms.append(word)
                
        return analysis

    @staticmethod
    def job_specific_analysis(resume_data: Dict[str, Any], job_reqs: Any) -> Dict[str, Any]:
        """
        Uses Phase 6's JobMatchEngine to return job-specific gaps.
        (Called directly in the Intelligence Engine to augment recommendations)
        """
        from app.services.job_matching.job_match_engine import JobMatchEngine
        match_result = JobMatchEngine.match(resume_data, job_reqs)
        return {
            "match_score": match_result.overall_match_score,
            "missing_required": match_result.missing_required_skills,
            "missing_preferred": match_result.missing_preferred_skills
        }
