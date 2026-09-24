from typing import List
from app.services.job_matching.models import SkillGap, ParsedJobRequirements

class RecommendationEngine:
    @staticmethod
    def generate(gaps: List[SkillGap], job_reqs: ParsedJobRequirements) -> List[str]:
        """
        Generates actionable, explainable recommendations based on the skill gaps.
        """
        recommendations = []
        
        required_missing = [g for g in gaps if g.gap_type == "Required"]
        preferred_missing = [g for g in gaps if g.gap_type == "Preferred"]
        evidence_gaps = [g for g in gaps if g.gap_type == "Evidence Gap"]
        
        if required_missing:
            recommendations.append(
                "Consider adding missing required skills (e.g. " + 
                ", ".join([g.skill for g in required_missing[:3]]) + 
                ") only if you genuinely possess them."
            )
            
        if preferred_missing:
            recommendations.append(
                "Adding preferred skills such as " + 
                preferred_missing[0].skill + 
                " could give you a competitive advantage if you have experience with it."
            )
            
        if evidence_gaps:
            recommendations.append(
                f"You listed {evidence_gaps[0].skill} as a skill, but we couldn't find evidence of it in your projects or experience. Detail how you used it to strengthen your profile."
            )
            
        if not recommendations:
            recommendations.append("Your resume aligns well with this job description. Ensure your contact information is up to date.")
            
        return recommendations
