import json
import logging
from typing import Dict, Any
from app.services.ai_gateway import generate_ai_response

logger = logging.getLogger("resume_ai_analyzer")

ANALYSIS_PROMPT_TEMPLATE = """
You are an expert technical recruiter, ATS (Applicant Tracking System) specialist, and career coach.
Analyze the following structured resume data representing a candidate's profile.

Resume Data:
{resume_data_json}

Provide a comprehensive, recruiter-level feedback analysis.
You MUST output your response ONLY as a valid JSON object matching the schema below. Do not wrap it in markdown code blocks.

Required JSON Schema:
{{
  "overall_score": 85,
  "ats_score": 82,
  "summary_analysis": "Brief recruiter impression overview...",
  "strengths": [
    "Strength 1 description",
    "Strength 2 description"
  ],
  "weaknesses": [
    "Weakness 1 description",
    "Weakness 2 description"
  ],
  "missing_skills": [
    "Skill 1",
    "Skill 2"
  ],
  "section_scores": {{
    "summary": 80,
    "skills": 90,
    "experience": 75,
    "projects": 85
  }},
  "improvement_suggestions": [
    "Suggestion 1",
    "Suggestion 2"
  ]
}}

CRITICAL RULES:
1. Base your evaluation strictly on the provided resume data.
2. Focus on software, engineering, and technology careers.
3. Be direct, professional, and provide highly actionable feedback.
4. Return ONLY the JSON object. No other text.
"""

def analyze_resume(db: Any, extracted_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Constructs the prompt, invokes the AI Gateway, and parses the response.
    """
    # 1. Prepare prompt
    resume_data_json = json.dumps(extracted_data, indent=2)
    prompt = ANALYSIS_PROMPT_TEMPLATE.replace("{resume_data_json}", resume_data_json)
    
    # 2. Invoke AI Gateway
    raw_response = generate_ai_response(db, prompt, task_type="resume_analysis")
    
    # 3. Clean and parse JSON response
    cleaned = raw_response.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
        
    try:
        parsed_json = json.loads(cleaned.strip())
        
        # Enforce type constraints and default fallbacks
        normalised = {
            "overall_score": int(parsed_json.get("overall_score", 70)),
            "ats_score": int(parsed_json.get("ats_score", 65)),
            "summary_analysis": str(parsed_json.get("summary_analysis", "Review complete")),
            "strengths": list(parsed_json.get("strengths", [])),
            "weaknesses": list(parsed_json.get("weaknesses", [])),
            "missing_skills": list(parsed_json.get("missing_skills", [])),
            "section_scores": dict(parsed_json.get("section_scores", {
                "summary": 70,
                "skills": 70,
                "experience": 70,
                "projects": 70
            })),
            "improvement_suggestions": list(parsed_json.get("improvement_suggestions", []))
        }
        return normalised
        
    except Exception as e:
        logger.error(f"Failed to parse AI response as JSON: {cleaned}. Error: {str(e)}")
        # Return a normalized fallback structure
        return {
            "overall_score": 70,
            "ats_score": 65,
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
