import re
from typing import Dict, Any, List
from app.services.resume_intelligence.models import HealthIssue

class ContentQualityAnalyzer:
    WEAK_VERBS = [
        "worked", "did", "was", "were", "helped", "assisted", "responsible for",
        "involved in", "tasks included", "handled", "managed to", "contributed"
    ]
    
    @staticmethod
    def analyze_bullets(section_name: str, items: List[Dict[str, Any]]) -> List[HealthIssue]:
        issues = []
        
        for idx, item in enumerate(items):
            desc = item.get("description", "")
            if not desc:
                continue
                
            # Check length
            if len(desc.split()) < 5:
                issues.append(HealthIssue(
                    section=section_name,
                    item_id=idx,
                    issue_type="too_short",
                    severity="medium",
                    message="The description is too short to provide meaningful context."
                ))
                
            # Check generic verbs
            desc_lower = desc.lower()
            found_weak = [verb for verb in ContentQualityAnalyzer.WEAK_VERBS if verb in desc_lower]
            if found_weak:
                issues.append(HealthIssue(
                    section=section_name,
                    item_id=idx,
                    issue_type="weak_action_verbs",
                    severity="low",
                    message=f"Uses weak phrasing ('{found_weak[0]}'). Try strong action verbs like 'Architected', 'Implemented', or 'Optimized'."
                ))
                
            # First person
            if re.search(r'\b(i|me|my|mine|we|our)\b', desc_lower):
                issues.append(HealthIssue(
                    section=section_name,
                    item_id=idx,
                    issue_type="first_person",
                    severity="medium",
                    message="Uses first-person pronouns (I, my). Resumes should be written in implied first-person without pronouns."
                ))
                
        return issues

    @staticmethod
    def analyze_summary(summary: str) -> List[HealthIssue]:
        issues = []
        if not summary:
            return issues
            
        word_count = len(summary.split())
        if word_count < 15:
            issues.append(HealthIssue(
                section="summary",
                issue_type="too_short",
                severity="medium",
                message="Summary is very brief. A good professional summary is typically 3-5 sentences."
            ))
            
        summary_lower = summary.lower()
        if re.search(r'\b(hardworking|team player|motivated|enthusiastic|dedicated|passionate)\b', summary_lower):
            issues.append(HealthIssue(
                section="summary",
                issue_type="cliche_language",
                severity="low",
                message="Contains cliché buzzwords (e.g., 'team player', 'motivated'). Focus on concrete skills and achievements instead."
            ))
            
        return issues
