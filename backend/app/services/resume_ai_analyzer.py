import json
import logging
from typing import Dict, Any
from app.services.ai_gateway import generate_ai_response

logger = logging.getLogger("resume_ai_analyzer")

def analyze_resume(
    db: Any, 
    extracted_data: Dict[str, Any], 
    raw_text: str = "", 
    ocr_confidence: float = 1.0, 
    resume_language: str = "en",
    target_job: str = None,
    target_industry: str = None
) -> Dict[str, Any]:
    """
    Invokes the unified AI Resume Intelligence Engine.
    Analyzes, improves, groups, and optimizes the resume dynamically without hardcoded logic.
    """
    from app.ai.resume_prompts import RESUME_INTELLIGENCE_PROMPT
    
    # 1. Prepare inputs and build prompt
    resume_json_str = json.dumps(extracted_data, indent=2)
    prompt = RESUME_INTELLIGENCE_PROMPT.replace(
        "{resume_json}", resume_json_str
    ).replace(
        "{original_text}", raw_text or "No raw text available."
    ).replace(
        "{ocr_confidence}", str(ocr_confidence)
    ).replace(
        "{resume_language}", resume_language
    ).replace(
        "{target_job}", target_job or "Not specified"
    ).replace(
        "{target_industry}", target_industry or "Not specified"
    )
    
    # 2. Invoke AI Gateway
    raw_response = generate_ai_response(db, prompt, task_type="resume_analysis")
    
    # 3. Clean and parse JSON response
    cleaned = raw_response.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    if cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
        
    try:
        parsed_json = json.loads(cleaned.strip())
        
        # Backwards compatibility check: if response has legacy structure at root level, map to new structure
        if "overall_score" in parsed_json and "ats_analysis" not in parsed_json:
            parsed_json["ats_analysis"] = {
                "scores": {
                    "overall_score": parsed_json.get("overall_score"),
                    "formatting_score": parsed_json.get("section_scores", {}).get("formatting", parsed_json.get("overall_score")),
                    "completeness_score": parsed_json.get("section_scores", {}).get("completeness", parsed_json.get("overall_score")),
                    "keywords_score": parsed_json.get("section_scores", {}).get("skills", parsed_json.get("overall_score")),
                    "experience_score": parsed_json.get("section_scores", {}).get("experience", parsed_json.get("overall_score")),
                    "skills_score": parsed_json.get("section_scores", {}).get("skills", parsed_json.get("overall_score")),
                    "projects_score": parsed_json.get("section_scores", {}).get("projects", parsed_json.get("overall_score")),
                    "grammar_score": parsed_json.get("section_scores", {}).get("grammar", parsed_json.get("overall_score")),
                    "readability_score": parsed_json.get("section_scores", {}).get("readability", parsed_json.get("overall_score"))
                },
                "strengths": parsed_json.get("strengths", []),
                "weaknesses": parsed_json.get("weaknesses", []),
                "improvement_suggestions": parsed_json.get("improvement_suggestions", []),
                "missing_keywords": parsed_json.get("missing_skills", [])
            }
            
        # 4. Normalize and ensure full key presence
        detected_metadata = parsed_json.get("detected_metadata", {})
        summary = parsed_json.get("summary", {})
        experience = parsed_json.get("experience", [])
        projects = parsed_json.get("projects", [])
        skills_groups = parsed_json.get("skills_groups", [])
        ats_analysis = parsed_json.get("ats_analysis", {})
        ats_scores = ats_analysis.get("scores", {})
        
        overall = int(ats_scores.get("overall_score", 75))
        
        normalized = {
            "detected_metadata": {
                "resume_type": str(detected_metadata.get("resume_type", "Software Engineer")),
                "career_level": str(detected_metadata.get("career_level", "Junior")),
                "section_order": list(detected_metadata.get("section_order", ["summary", "education", "skills", "experience", "projects"]))
            },
            "summary": {
                "original": str(summary.get("original", "")),
                "improved": str(summary.get("improved", "")),
                "reason": str(summary.get("reason", ""))
            },
            "experience": [
                {
                  "company": str(exp.get("company", "")),
                  "position": str(exp.get("position", "")),
                  "duration": str(exp.get("duration", "")),
                  "original": str(exp.get("original", "")),
                  "improved": str(exp.get("improved", "")),
                  "reason": str(exp.get("reason", ""))
                } for exp in experience
            ],
            "projects": [
                {
                  "title": str(proj.get("title", "")),
                  "original": str(proj.get("original", "")),
                  "improved": str(proj.get("improved", "")),
                  "reason": str(proj.get("reason", ""))
                } for proj in projects
            ],
            "skills_groups": [
                {
                  "group_name": str(sg.get("group_name", "Skills")),
                  "skills": list(sg.get("skills", []))
                } for sg in skills_groups
            ],
            "ats_analysis": {
                "scores": {
                  "overall_score": overall,
                  "formatting_score": int(ats_scores.get("formatting_score", overall)),
                  "completeness_score": int(ats_scores.get("completeness_score", overall)),
                  "keywords_score": int(ats_scores.get("keywords_score", overall)),
                  "experience_score": int(ats_scores.get("experience_score", overall)),
                  "skills_score": int(ats_scores.get("skills_score", overall)),
                  "projects_score": int(ats_scores.get("projects_score", overall)),
                  "grammar_score": int(ats_scores.get("grammar_score", overall)),
                  "readability_score": int(ats_scores.get("readability_score", overall))
                },
                "strengths": list(ats_analysis.get("strengths", [])),
                "weaknesses": list(ats_analysis.get("weaknesses", [])),
                "improvement_suggestions": list(ats_analysis.get("improvement_suggestions", [])),
                "missing_keywords": list(ats_analysis.get("missing_keywords", []))
            },
            "confidence": float(parsed_json.get("confidence", 0.90)),
            
            # Backwards compatibility fields
            "overall_score": overall,
            "ats_score": int(parsed_json.get("ats_score") or parsed_json.get("ats_analysis", {}).get("scores", {}).get("overall_score", overall)),
            "summary_analysis": str(ats_analysis.get("summary_analysis", "Review complete")),
            "strengths": list(ats_analysis.get("strengths", [])),
            "weaknesses": list(ats_analysis.get("weaknesses", [])),
            "missing_skills": list(ats_analysis.get("missing_keywords", [])),
            "section_scores": {
                "summary": int(ats_scores.get("summary_score", ats_scores.get("overall_score", 70))),
                "skills": int(ats_scores.get("skills_score", ats_scores.get("overall_score", 70))),
                "experience": int(ats_scores.get("experience_score", ats_scores.get("overall_score", 70))),
                "projects": int(ats_scores.get("projects_score", ats_scores.get("overall_score", 70)))
            },
            "improvement_suggestions": list(ats_analysis.get("improvement_suggestions", []))
        }
        return normalized
        
    except Exception as e:
        logger.error(f"Failed to parse AI response as JSON: {cleaned}. Error: {str(e)}")
        # Return fallback structures matching schema
        overall = 70
        return {
            "detected_metadata": {
                "resume_type": "Software Engineer",
                "career_level": "Entry Level",
                "section_order": ["summary", "education", "skills", "experience", "projects"]
            },
            "summary": {
                "original": extracted_data.get("summary", ""),
                "improved": extracted_data.get("summary", ""),
                "reason": "Fallback default due to parsing error."
            },
            "experience": [
                {
                  "company": exp.get("company", ""),
                  "position": exp.get("position", ""),
                  "duration": exp.get("duration", ""),
                  "original": exp.get("description", ""),
                  "improved": exp.get("description", ""),
                  "reason": "Fallback default due to parsing error."
                } for exp in extracted_data.get("experience", [])
            ],
            "projects": [
                {
                  "title": proj.get("name", proj.get("title", "")),
                  "original": proj.get("description", ""),
                  "improved": proj.get("description", ""),
                  "reason": "Fallback default due to parsing error."
                } for proj in extracted_data.get("projects", [])
            ],
            "skills_groups": [
                {
                  "group_name": "Technical Skills",
                  "skills": extracted_data.get("technicalSkills", extracted_data.get("skills", []))
                }
            ],
            "ats_analysis": {
                "scores": {
                  "overall_score": overall,
                  "formatting_score": overall,
                  "completeness_score": overall,
                  "keywords_score": overall,
                  "experience_score": overall,
                  "skills_score": overall,
                  "projects_score": overall,
                  "grammar_score": overall,
                  "readability_score": overall
                },
                "strengths": ["Clear section layouts"],
                "weaknesses": ["Unquantified metrics"],
                "improvement_suggestions": ["Re-run analysis to generate detailed recruiter recommendations"],
                "missing_keywords": []
            },
            "confidence": 0.5,
            
            # Backwards compatibility fields
            "overall_score": overall,
            "ats_score": overall,
            "summary_analysis": "Failed to parse AI response. Evaluation defaulted to baseline values.",
            "strengths": ["Clear section layouts"],
            "weaknesses": ["Unquantified metrics"],
            "missing_skills": [],
            "section_scores": {
                "summary": 70,
                "skills": 70,
                "experience": 70,
                "projects": 70
            },
            "improvement_suggestions": ["Re-run analysis to generate detailed recruiter recommendations"]
        }
