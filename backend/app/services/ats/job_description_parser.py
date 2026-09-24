import re
from typing import Dict, Any, List

class JobDescriptionParser:
    @staticmethod
    def parse(jd_text: str) -> Dict[str, Any]:
        """
        Deterministic parser for Job Descriptions.
        Avoids LLM usage.
        """
        parsed = {
            "job_title": "",
            "required_skills": [],
            "preferred_skills": [],
            "experience_requirements": "",
            "education_requirements": ""
        }
        
        if not jd_text:
            return parsed
            
        lines = jd_text.split('\n')
        
        # Extremely basic heuristics for phase 4 baseline
        for i, line in enumerate(lines):
            clean_line = line.strip().lower()
            if not clean_line: continue
            
            # First line is often title
            if i == 0 and len(clean_line) < 50:
                parsed["job_title"] = line.strip()
                
            if "experience" in clean_line and re.search(r'\d+', clean_line):
                if not parsed["experience_requirements"]:
                    parsed["experience_requirements"] = line.strip()
                    
            if "degree" in clean_line or "bachelor" in clean_line or "master" in clean_line:
                if not parsed["education_requirements"]:
                    parsed["education_requirements"] = line.strip()
                    
        return parsed
