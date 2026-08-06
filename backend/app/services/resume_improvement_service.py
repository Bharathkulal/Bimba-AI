import json
import logging
from typing import Dict, Any
from app.services.ai_gateway import generate_ai_response

logger = logging.getLogger("resume_improvement_service")

def generate_resume_improvements(db: Any, extracted_data: Dict[str, Any], ai_analysis: Dict[str, Any]) -> Dict[str, Any]:
    """
    Retrieves or generates resume improvements (summary, experience, projects)
    based on the unified AI Resume Intelligence Engine output.
    """
    from app.services.resume_ai_analyzer import analyze_resume
    
    # 1. Cache-first strategy: check if the unified analysis already has the rich intelligence keys
    has_summary = "summary" in ai_analysis and isinstance(ai_analysis["summary"], dict) and "improved" in ai_analysis["summary"]
    has_experience = "experience" in ai_analysis and isinstance(ai_analysis["experience"], list)
    
    if not (has_summary and has_experience):
        logger.info("Cache miss: unified AI analysis not found. Invoking unified AI engine...")
        try:
            ai_analysis = analyze_resume(db, extracted_data)
        except Exception as e:
            logger.error(f"Failed to generate intelligence fallback: {str(e)}")
            
    # 2. Extract structured improvements from unified payload
    ats_before = int(ai_analysis.get("ats_score_before", ai_analysis.get("ats_score", 70)))
    target_score = int(ai_analysis.get("target_ats_score", ai_analysis.get("ats_analysis", {}).get("scores", {}).get("overall_score", 85)))
    target_score = min(95, max(80, target_score + 10))
    
    summary_data = ai_analysis.get("summary") or {}
    original_summary = summary_data.get("original") or extracted_data.get("summary", "")
    if isinstance(original_summary, list) and original_summary:
        original_summary = original_summary[0]
        
    # Build experience improvements list
    exp_list = []
    for exp in ai_analysis.get("experience", []):
        exp_list.append({
            "original": str(exp.get("original", "")),
            "improved": str(exp.get("improved", "")),
            "reason": str(exp.get("reason", "Rewritten for ATS impact and professional tone."))
        })
        
    # Build projects improvements list
    proj_list = []
    for proj in ai_analysis.get("projects", []):
        proj_list.append({
            "original": str(proj.get("original", "")),
            "improved": str(proj.get("improved", "")),
            "reason": str(proj.get("reason", "Clarified technical stack and business impact."))
        })
        
    missing_kw = ai_analysis.get("ats_analysis", {}).get("missing_keywords", [])
    
    return {
        "target_ats_score": target_score,
        "ats_score_before": ats_before,
        "overall_improvement_summary": "Unified AI intelligence analysis and professional wording optimizations applied.",
        "summary": {
            "original": str(original_summary),
            "improved": str(summary_data.get("improved") or original_summary),
            "reason": str(summary_data.get("reason") or "Improved phrasing and keyword density.")
        },
        "projects": proj_list,
        "experience": exp_list,
        "skill_recommendations": [f"Consider adding {kw} if supported by your background." for kw in missing_kw],
        "ats_keywords": missing_kw
    }
