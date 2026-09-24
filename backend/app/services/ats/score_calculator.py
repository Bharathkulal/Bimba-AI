from typing import Dict, Any
from app.services.ats.ats_config import ATS_WEIGHTS

class ScoreCalculator:
    @staticmethod
    def calculate_final_score(breakdown: Dict[str, int]) -> int:
        score = 0.0
        for category, weight in ATS_WEIGHTS.items():
            comp_score = breakdown.get(category, 0)
            score += (comp_score * weight) / 100.0
            
        final_score = int(round(score))
        return max(0, min(100, final_score))
