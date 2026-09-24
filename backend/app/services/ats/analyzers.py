import re
from typing import Dict, Any, List

class Analyzers:
    @staticmethod
    def analyze_completeness(resume_data: Dict[str, Any]) -> Dict[str, Any]:
        expected_fields = [
            ("personal_info.name", lambda r: bool(r.get("personal_info", {}).get("name") or r.get("personal_info", {}).get("full_name"))),
            ("personal_info.email", lambda r: bool(r.get("personal_info", {}).get("email"))),
            ("personal_info.phone", lambda r: bool(r.get("personal_info", {}).get("phone"))),
            ("summary", lambda r: bool(r.get("summary") or r.get("professional_summary") or r.get("objective"))),
            ("education", lambda r: len(r.get("education", [])) > 0),
            ("experience", lambda r: len(r.get("experience", r.get("work_experience", []))) > 0),
            ("projects", lambda r: len(r.get("projects", [])) > 0),
            ("skills", lambda r: len(r.get("technical_skills", r.get("skills", []))) > 0)
        ]
        
        present_count = sum(1 for name, check in expected_fields if check(resume_data))
        score = int((present_count / len(expected_fields)) * 100)
        
        issues = []
        if not expected_fields[0][1](resume_data): issues.append("Missing name.")
        if not expected_fields[1][1](resume_data): issues.append("Missing email.")
        if not expected_fields[2][1](resume_data): issues.append("Missing phone.")
        if not expected_fields[3][1](resume_data): issues.append("Missing summary.")
        if not expected_fields[4][1](resume_data): issues.append("Missing education.")
        
        is_fresher = not expected_fields[5][1](resume_data)
        if is_fresher and not expected_fields[6][1](resume_data):
            issues.append("Missing both professional experience and projects. Add projects to strengthen a fresher resume.")
            
        return {"score": score, "issues": issues}

    @staticmethod
    def analyze_skills(resume_data: Dict[str, Any]) -> Dict[str, Any]:
        skills = resume_data.get("technical_skills", resume_data.get("skills", []))
        if isinstance(skills, dict):
            flat_skills = skills.get("flat", [])
        elif isinstance(skills, list):
            flat_skills = []
            for s in skills:
                if isinstance(s, dict) and "skills" in s:
                    flat_skills.extend(s.get("skills", []))
                elif isinstance(s, str):
                    flat_skills.append(s)
        else:
            flat_skills = []

        normalized = {s.lower().strip() for s in flat_skills if isinstance(s, str)}
        
        score = min(100, len(normalized) * 8)
        issues = []
        suggestions = []
        strengths = []
        
        if len(normalized) == 0:
            score = 0
            issues.append("No technical skills detected.")
            suggestions.append("Add a dedicated skills section listing relevant technologies.")
        elif len(normalized) < 5:
            issues.append("Few skills detected.")
            suggestions.append("Consider expanding your skills section with more relevant tools and languages.")
        else:
            strengths.append(f"Strong skill base detected with {len(normalized)} unique skills.")
            
        return {"score": score, "issues": issues, "suggestions": suggestions, "strengths": strengths, "normalized": list(normalized)}

    @staticmethod
    def analyze_experience(resume_data: Dict[str, Any]) -> Dict[str, Any]:
        experience = resume_data.get("experience", resume_data.get("work_experience", []))
        score = 0
        issues = []
        suggestions = []
        strengths = []
        
        if not experience:
            # Don't penalize too much if they have projects (student resume)
            projects = resume_data.get("projects", [])
            if len(projects) > 0:
                score = 80
                suggestions.append("Since you lack formal experience, ensure your projects clearly demonstrate measurable outcomes.")
            else:
                score = 0
                issues.append("No experience or projects found.")
            return {"score": score, "issues": issues, "suggestions": suggestions, "strengths": strengths}
            
        score = 60
        has_dates = False
        has_metrics = False
        
        for exp in experience:
            if exp.get("duration") or exp.get("start_date"):
                has_dates = True
            desc = exp.get("description", "")
            if desc:
                # Naive metric check (contains numbers or % or $)
                if re.search(r'\d+%|\$\d+|\d+\s*(?:users|requests|increase|decrease)', desc, re.IGNORECASE):
                    has_metrics = True
                    
        if has_dates: score += 20
        else: issues.append("Missing dates in experience.")
        
        if has_metrics: 
            score += 20
            strengths.append("Experience descriptions include measurable metrics.")
        else: 
            suggestions.append("Where accurate, add a measurable outcome to your experience descriptions (e.g. 'improved performance by 20%').")
            
        return {"score": min(100, score), "issues": issues, "suggestions": suggestions, "strengths": strengths}

    @staticmethod
    def analyze_projects(resume_data: Dict[str, Any]) -> Dict[str, Any]:
        projects = resume_data.get("projects", [])
        score = 0
        issues = []
        suggestions = []
        strengths = []
        
        if not projects:
            score = 50
            suggestions.append("Consider adding projects to showcase your practical skills.")
            return {"score": score, "issues": issues, "suggestions": suggestions, "strengths": strengths}
            
        score = 70
        has_tech = False
        has_desc = False
        has_links = False
        
        for proj in projects:
            if proj.get("technologies") or proj.get("tech_stack"): has_tech = True
            desc = proj.get("description", "")
            if desc and len(desc) > 30: has_desc = True
            if proj.get("url") or proj.get("github"): has_links = True
            
        if has_desc: score += 10
        else: suggestions.append("Expand project descriptions to explain the problem solved and your contribution.")
        
        if has_tech: score += 10
        else: suggestions.append("List the technologies used for each project.")
        
        if has_links: 
            score += 10
            strengths.append("Projects include links to source code or live demos.")
        else: 
            suggestions.append("Consider adding your GitHub profile or project URLs if you use them to showcase relevant work.")
            
        return {"score": min(100, score), "issues": issues, "suggestions": suggestions, "strengths": strengths}

    @staticmethod
    def analyze_education(resume_data: Dict[str, Any]) -> Dict[str, Any]:
        education = resume_data.get("education", [])
        score = 0
        issues = []
        suggestions = []
        strengths = []
        
        if not education:
            return {"score": 0, "issues": ["No education section found."], "suggestions": [], "strengths": []}
            
        score = 70
        has_inst = False
        has_deg = False
        has_dates = False
        
        for edu in education:
            if edu.get("institution") or edu.get("university") or edu.get("school"): has_inst = True
            if edu.get("degree"): has_deg = True
            if edu.get("year") or edu.get("passing_year") or edu.get("end_date"): has_dates = True
            
        if has_inst: score += 10
        else: issues.append("Missing institution name in education.")
        
        if has_deg: score += 10
        else: issues.append("Missing degree name in education.")
        
        if has_dates: score += 10
        else: issues.append("Missing dates in education.")
        
        return {"score": min(100, score), "issues": issues, "suggestions": suggestions, "strengths": strengths}

    @staticmethod
    def analyze_certifications(resume_data: Dict[str, Any]) -> Dict[str, Any]:
        certs = resume_data.get("certifications", [])
        if not certs:
            return {"score": 100, "issues": [], "suggestions": [], "strengths": []} # Optional, don't penalize
        
        score = 80
        has_issuer = any(c.get("issuer") or c.get("provider") for c in certs)
        if has_issuer: score = 100
        else: return {"score": score, "issues": [], "suggestions": ["Include the issuing organization for your certifications."], "strengths": []}
        return {"score": 100, "issues": [], "suggestions": [], "strengths": []}

    @staticmethod
    def analyze_keywords(resume_data: Dict[str, Any], extracted_text: str) -> Dict[str, Any]:
        # For a general ATS without JD, we just check if it's not totally empty and has some length
        if not extracted_text:
            return {"score": 50, "issues": ["Could not analyze keywords (no raw text)."], "suggestions": [], "strengths": []}
            
        words = len(extracted_text.split())
        score = 100
        issues = []
        suggestions = []
        if words < 100:
            score = 50
            issues.append("Resume is very brief.")
            suggestions.append("Consider expanding your resume with more detail to hit relevant keywords naturally.")
        return {"score": score, "issues": issues, "suggestions": suggestions, "strengths": []}

    @staticmethod
    def analyze_formatting(extracted_text: str) -> Dict[str, Any]:
        if not extracted_text:
            return {"score": 50, "issues": ["Could not analyze formatting."], "suggestions": [], "strengths": []}
            
        score = 100
        issues = []
        suggestions = []
        strengths = []
        
        if len(extracted_text) < 200:
            score = 60
            issues.append("Resume contains very little text.")
            
        if "\n\n\n\n" in extracted_text:
            score -= 10
            issues.append("Excessive empty lines detected.")
            
        return {"score": max(0, score), "issues": issues, "suggestions": suggestions, "strengths": strengths}
