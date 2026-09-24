from typing import Dict, Any, Tuple
from app.services.resume_intelligence.models import SectionAnalysis, HealthIssue

class ResumeHealthAnalyzer:
    @staticmethod
    def analyze_completeness(resume_data: Dict[str, Any]) -> Dict[str, SectionAnalysis]:
        sections = {}
        
        # 1. Personal Info
        personal = resume_data.get("personal_info", {})
        issues = []
        status = "complete"
        score = 100
        if not personal.get("email"):
            issues.append(HealthIssue(section="personal_info", issue_type="missing_email", severity="critical", message="Missing email address."))
            status = "partial"
            score -= 30
        if not personal.get("phone"):
            issues.append(HealthIssue(section="personal_info", issue_type="missing_phone", severity="high", message="Missing phone number."))
            status = "partial"
            score -= 20
        if not personal.get("linkedin"):
            issues.append(HealthIssue(section="personal_info", issue_type="missing_linkedin", severity="low", message="Adding a LinkedIn profile is highly recommended."))
            score -= 10
            
        sections["personal_info"] = SectionAnalysis(status=status, score=max(0, score), issues=issues)
        
        # 2. Summary
        summary = resume_data.get("summary", resume_data.get("career_objective", ""))
        if summary:
            sections["summary"] = SectionAnalysis(status="present", score=100)
        else:
            sections["summary"] = SectionAnalysis(status="missing", score=0, issues=[
                HealthIssue(section="summary", issue_type="missing_section", severity="high", message="Professional summary is missing.")
            ])
            
        # 3. Experience
        experience = resume_data.get("experience", resume_data.get("work_experience", []))
        if experience:
            sections["experience"] = SectionAnalysis(status="present", score=100)
        else:
            sections["experience"] = SectionAnalysis(status="missing", score=0, issues=[
                HealthIssue(section="experience", issue_type="missing_section", severity="informational", message="No work experience listed. If you are a student, ensure Projects and Education are strong.")
            ])
            
        # 4. Education
        education = resume_data.get("education", [])
        if education:
            sections["education"] = SectionAnalysis(status="present", score=100)
        else:
            sections["education"] = SectionAnalysis(status="missing", score=0, issues=[
                HealthIssue(section="education", issue_type="missing_section", severity="critical", message="Education section is missing.")
            ])
            
        # 5. Projects
        projects = resume_data.get("projects", [])
        if projects:
            sections["projects"] = SectionAnalysis(status="present", score=100)
        else:
            sections["projects"] = SectionAnalysis(status="missing", score=0, issues=[
                HealthIssue(section="projects", issue_type="missing_section", severity="medium", message="No projects listed.")
            ])
            
        # 6. Skills
        skills = resume_data.get("technical_skills", resume_data.get("skills", []))
        if skills:
            sections["skills"] = SectionAnalysis(status="present", score=100)
        else:
            sections["skills"] = SectionAnalysis(status="missing", score=0, issues=[
                HealthIssue(section="skills", issue_type="missing_section", severity="critical", message="Skills section is missing.")
            ])
            
        return sections
        
    @staticmethod
    def calculate_health_score(sections: Dict[str, SectionAnalysis], content_issues_count: int, evidence_gap_count: int) -> Tuple[int, Dict[str, Any]]:
        """
        Calculates a deterministic 0-100 health score.
        """
        HEALTH_CONFIG = {
            "completeness": 50,
            "content_quality": 30,
            "evidence": 20
        }
        
        # 1. Completeness Score (Average of required sections)
        req_sections = ["personal_info", "summary", "education", "skills"]
        total_section_score = sum([sections.get(s, SectionAnalysis(status="missing", score=0)).score for s in req_sections])
        
        # If experience is missing, projects must be strong
        if sections.get("experience", SectionAnalysis(status="missing", score=0)).score == 0:
            total_section_score += sections.get("projects", SectionAnalysis(status="missing", score=0)).score
            completeness_base = total_section_score / 5
        else:
            total_section_score += sections.get("experience", SectionAnalysis(status="missing", score=0)).score
            completeness_base = total_section_score / 5
            
        completeness_score = (completeness_base / 100) * HEALTH_CONFIG["completeness"]
        
        # 2. Content Quality Score
        # Deduct 5 points per content issue, max deduction is the full config weight
        cq_deduction = min(content_issues_count * 5, 100)
        cq_base = 100 - cq_deduction
        cq_score = (cq_base / 100) * HEALTH_CONFIG["content_quality"]
        
        # 3. Evidence Score
        # Deduct 10 points per evidence gap
        ev_deduction = min(evidence_gap_count * 10, 100)
        ev_base = 100 - ev_deduction
        ev_score = (ev_base / 100) * HEALTH_CONFIG["evidence"]
        
        overall = int(completeness_score + cq_score + ev_score)
        
        breakdown = {
            "completeness": {
                "score": int(completeness_base),
                "weight": HEALTH_CONFIG["completeness"],
                "reason": "Based on the presence of critical sections (Contact, Summary, Education, Skills, Experience/Projects)."
            },
            "content_quality": {
                "score": int(cq_base),
                "weight": HEALTH_CONFIG["content_quality"],
                "reason": f"Reduced by {cq_deduction} due to {content_issues_count} weak content markers (short bullets, missing metrics)."
            },
            "evidence": {
                "score": int(ev_base),
                "weight": HEALTH_CONFIG["evidence"],
                "reason": f"Reduced by {ev_deduction} due to {evidence_gap_count} skills listed without project or work evidence."
            }
        }
        
        return max(0, min(100, overall)), breakdown
