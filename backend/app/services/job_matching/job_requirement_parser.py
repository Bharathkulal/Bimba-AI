import re
from typing import Dict, Any, List
from app.services.job_matching.models import ParsedJobRequirements

class JobRequirementParser:
    @staticmethod
    def parse(job_text: str, structured_job: Dict[str, Any] = None) -> ParsedJobRequirements:
        """
        Parses a job description deterministically into required vs preferred requirements.
        """
        reqs = ParsedJobRequirements()
        
        if structured_job:
            reqs.job_title = structured_job.get("title", "")
            reqs.department = structured_job.get("department", "")
            reqs.location = structured_job.get("location", "")
            reqs.employment_type = structured_job.get("employment_type", "")
            
            # If the job object explicitly gives required vs preferred skills, use them.
            reqs.required_skills = structured_job.get("required_skills", [])
            reqs.preferred_skills = structured_job.get("preferred_skills", [])
            if "years_of_experience" in structured_job:
                try:
                    reqs.years_of_experience = int(structured_job["years_of_experience"])
                except ValueError:
                    pass
            
            # Use raw description if provided
            job_text = job_text or structured_job.get("description", "")
            
        if not job_text:
            return reqs
            
        # Naive rules-based parser for free-text JD fallback
        lines = job_text.split("\n")
        current_section = "general"
        
        for line in lines:
            line_clean = line.strip().lower()
            if not line_clean:
                continue
                
            # Section detection
            if any(kw in line_clean for kw in ["required skills", "requirements", "must have", "qualifications"]):
                current_section = "required"
                continue
            elif any(kw in line_clean for kw in ["preferred skills", "nice to have", "bonus"]):
                current_section = "preferred"
                continue
            elif any(kw in line_clean for kw in ["responsibilities", "what you will do"]):
                current_section = "responsibilities"
                continue
                
            # Experience extraction
            exp_match = re.search(r'(\d+)\+?\s*(?:-\s*\d+)?\s*years?(?:\s*of)?\s*experience', line_clean)
            if exp_match and not reqs.years_of_experience:
                reqs.years_of_experience = int(exp_match.group(1))
                
            # Education extraction
            if any(edu in line_clean for edu in ["bachelor", "master", "phd", "degree", "b.s.", "m.s."]):
                reqs.required_education.append(line.strip())
                
            # Naive skill extraction from bullets (assuming bullet starts with -, *, or is a short phrase)
            if current_section in ["required", "preferred"]:
                if line.startswith("-") or line.startswith("*") or len(line.split()) < 5:
                    cleaned_skill = re.sub(r'^[\-\*\•\s]+', '', line).strip()
                    if cleaned_skill:
                        if current_section == "required" and cleaned_skill not in reqs.required_skills:
                            reqs.required_skills.append(cleaned_skill)
                        elif current_section == "preferred" and cleaned_skill not in reqs.preferred_skills:
                            reqs.preferred_skills.append(cleaned_skill)
                            
        return reqs
