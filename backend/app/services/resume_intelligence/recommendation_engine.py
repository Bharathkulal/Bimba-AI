from typing import List, Dict, Any
from app.services.resume_intelligence.models import ImprovementRecommendation, HealthIssue, EvidenceAnalysis

class RecommendationEngine:
    @staticmethod
    def generate(
        issues: List[HealthIssue], 
        evidence: EvidenceAnalysis,
        job_specific_gaps: Dict[str, Any] = None
    ) -> List[ImprovementRecommendation]:
        
        recs = []
        
        # 1. Process Issues
        for issue in issues:
            if issue.severity in ["critical", "high"]:
                recs.append(ImprovementRecommendation(
                    priority="high",
                    severity=issue.severity,
                    category="completeness" if issue.issue_type.startswith("missing") else "content",
                    message=issue.message,
                    reason=f"Addressed {issue.issue_type} in {issue.section} section."
                ))
            elif issue.issue_type == "no_metrics":
                recs.append(ImprovementRecommendation(
                    priority="medium",
                    severity=issue.severity,
                    category="achievements",
                    message=issue.message,
                    reason=f"Quantifiable results in {issue.section} drastically improve recruiter response rates."
                ))
                
        # 2. Process Evidence Gaps
        if evidence.skills_without_evidence:
            recs.append(ImprovementRecommendation(
                priority="medium",
                severity="medium",
                category="evidence",
                message=f"Consider adding a real project or experience example demonstrating usage of: {', '.join(evidence.skills_without_evidence[:3])}.",
                reason="Skills without context may be ignored by recruiters."
            ))
            
        # 3. Job Specific Gaps (if any)
        if job_specific_gaps:
            missing_req = job_specific_gaps.get("missing_required", [])
            if missing_req:
                recs.append(ImprovementRecommendation(
                    priority="critical",
                    severity="critical",
                    category="job_match",
                    message=f"If you genuinely have experience with {', '.join(missing_req[:3])}, add it to the relevant skills/project/experience section.",
                    reason="These are mandatory requirements for the target job."
                ))
                
        return recs
