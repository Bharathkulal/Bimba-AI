import re
from typing import Dict, Any, List
from app.services.resume_intelligence.models import HealthIssue

class AchievementAnalyzer:
    @staticmethod
    def extract_metrics(text: str) -> bool:
        """
        Detects numbers, percentages, scales, and rankings in text.
        Returns True if measurable signals are found.
        """
        if not text:
            return False
            
        # Match percentages (e.g., 40%, 40 percent)
        if re.search(r'\d+\s*(?:%|percent)', text, re.IGNORECASE):
            return True
            
        # Match money (e.g., $500, ₹10 lakh, 10k)
        if re.search(r'(?:\$|₹|€|£)\s*\d+', text):
            return True
        if re.search(r'\d+\s*[kKmMbB]', text):
            return True
            
        # Match user counts, scales, times (e.g. 500 users, 2 seconds, 10x)
        if re.search(r'\d+\s*(?:users|clients|customers|servers|nodes|requests|seconds|ms|hours|days|x)', text, re.IGNORECASE):
            return True
            
        # Match rankings (e.g., 1st, top 10)
        if re.search(r'(?:1st|2nd|3rd|\d+th|top\s*\d+)', text, re.IGNORECASE):
            return True
            
        return False

    @staticmethod
    def analyze_achievements(section_name: str, items: List[Dict[str, Any]]) -> List[HealthIssue]:
        issues = []
        for idx, item in enumerate(items):
            desc = item.get("description", "")
            if not desc:
                continue
                
            has_metric = AchievementAnalyzer.extract_metrics(desc)
            if not has_metric:
                issues.append(HealthIssue(
                    section=section_name,
                    item_id=idx,
                    issue_type="no_metrics",
                    severity="medium",
                    message="Description lacks measurable outcomes. Consider quantifying achievements (e.g., improved performance by X%, managed team of Y)."
                ))
        return issues
