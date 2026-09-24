from typing import List
from app.services.job_matching.models import SkillGap, MatchedSkill

class SkillGapAnalyzer:
    @staticmethod
    def analyze(
        missing_required: List[str], 
        missing_preferred: List[str], 
        matched_skills: List[MatchedSkill]
    ) -> List[SkillGap]:
        """
        Categorizes skill gaps into Required, Preferred, or Evidence gaps.
        """
        gaps = []
        
        for req in missing_required:
            gaps.append(SkillGap(
                skill=req, 
                gap_type="Required", 
                message=f"Missing mandatory requirement: {req}"
            ))
            
        for pref in missing_preferred:
            gaps.append(SkillGap(
                skill=pref, 
                gap_type="Preferred", 
                message=f"Missing preferred requirement: {pref}"
            ))
            
        for match in matched_skills:
            if match.matched and len(match.evidence) == 1 and match.evidence[0].source == "technical_skills":
                # Evidence gap: skill exists in "skills" list but nowhere in experience or projects
                gaps.append(SkillGap(
                    skill=match.skill,
                    gap_type="Evidence Gap",
                    message=f"Skill listed, but project/work evidence is limited for {match.skill}."
                ))
                
        return gaps
