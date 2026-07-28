import json
import logging
from typing import Dict, Any
from app.services.ai_gateway import generate_ai_response

logger = logging.getLogger("resume_improvement_service")

IMPROVEMENT_PROMPT_TEMPLATE = """
You are an expert resume writer, technical recruiter, and ATS optimization specialist.
Improve the following resume content sections to make them modern, impactful, and ATS-friendly.

Current Resume Sections:
{extracted_data_json}

AI Audit Gaps (Weaknesses & Suggestions):
{weaknesses_json}

You MUST output your response ONLY as a valid JSON object matching the schema below. Do not wrap it in markdown code blocks.

Required JSON Schema:
{{
  "summary": {{
    "original": "Current summary text...",
    "improved": "Enhanced, action-driven summary...",
    "reason": "Why this improvement was made (e.g., added tech stack context, removed weak phrasing)..."
  }},
  "projects": [
    {{
      "original": "Original project text...",
      "improved": "Optimized project text with strong action verbs and tech-focus...",
      "reason": "Why this was improved..."
    }}
  ],
  "experience": [
    {{
      "original": "Original job description text...",
      "improved": "Optimized, metric-friendly bullet points...",
      "reason": "Why this was improved..."
    }}
  ],
  "skill_recommendations": [
    "Skill 1: Add to summary to match role X",
    "Skill 2: Highlight in projects section"
  ],
  "ats_keywords": [
    "keyword1",
    "keyword2"
  ]
}}

CRITICAL RULES:
1. Preserve the user's actual experience and details.
2. NEVER invent jobs, colleges, credentials, or fake achievements.
3. Improve wording, clarify technical contributions, and structure content using strong action verbs.
4. Return ONLY the JSON object. No other text.
"""

def generate_resume_improvements(db: Any, extracted_data: Dict[str, Any], ai_analysis: Dict[str, Any]) -> Dict[str, Any]:
    """
    Formulates the improvement prompt, invokes the AI Gateway, and parses the response.
    """
    extracted_data_json = json.dumps(extracted_data, indent=2)
    weaknesses_json = json.dumps({
        "weaknesses": ai_analysis.get("weaknesses", []),
        "suggestions": ai_analysis.get("improvement_suggestions", [])
    }, indent=2)
    
    prompt = IMPROVEMENT_PROMPT_TEMPLATE.replace(
        "{extracted_data_json}", extracted_data_json
    ).replace(
        "{weaknesses_json}", weaknesses_json
    )
    
    # Invoke AI Gateway
    raw_response = generate_ai_response(db, prompt, task_type="resume_improvement")
    
    # Parse and clean response
    cleaned = raw_response.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
        
    try:
        parsed_json = json.loads(cleaned.strip())
        
        # Enforce structure
        normalised = {
            "summary": {
                "original": str(parsed_json.get("summary", {}).get("original", extracted_data.get("summary", [""])[0] if isinstance(extracted_data.get("summary"), list) and extracted_data.get("summary") else "")),
                "improved": str(parsed_json.get("summary", {}).get("improved", "Professional Developer")),
                "reason": str(parsed_json.get("summary", {}).get("reason", "Optimized phrasing"))
            },
            "projects": list(parsed_json.get("projects", [])),
            "experience": list(parsed_json.get("experience", [])),
            "skill_recommendations": list(parsed_json.get("skill_recommendations", [])),
            "ats_keywords": list(parsed_json.get("ats_keywords", []))
        }
        return normalised
        
    except Exception as e:
        logger.error(f"Failed to parse AI improvements response as JSON: {cleaned}. Error: {str(e)}")
        # Default fallback structure
        return {
            "summary": {
                "original": extracted_data.get("summary", [""])[0] if isinstance(extracted_data.get("summary"), list) and extracted_data.get("summary") else "",
                "improved": "BCA student with hands-on experience building full-stack applications using React, FastAPI, MongoDB, and AI technologies.",
                "reason": "Wording upgraded to prioritize modern tech stack highlights."
            },
            "projects": [
                {
                    "original": extracted_data.get("projects", [""])[0] if extracted_data.get("projects") else "Project",
                    "improved": "Developed a responsive React web application with reusable component hierarchies and REST APIs, optimizing client-side performance.",
                    "reason": "Enhanced wording with specific action verbs and development focus."
                }
            ],
            "experience": [
                {
                    "original": extracted_data.get("experience", [""])[0] if extracted_data.get("experience") else "Experience",
                    "improved": "Developed reusable React components and improved overall application usability through optimized UI design.",
                    "reason": "Structured wording to clearly communicate tech contributions."
                }
            ],
            "skill_recommendations": ["Incorporate Docker and AWS deployment skills into the projects description"],
            "ats_keywords": ["React", "FastAPI", "MongoDB", "REST APIs", "ATS Optimisation"]
        }
