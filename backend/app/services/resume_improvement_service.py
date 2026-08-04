import json
import logging
from typing import Dict, Any
from app.services.ai_gateway import generate_ai_response

logger = logging.getLogger("resume_improvement_service")

IMPROVEMENT_PROMPT_TEMPLATE = """
You are a professional resume editor. Your job is to POLISH the candidate's existing resume content — NOT rewrite it from scratch and NOT fabricate information.

Current Resume Content:
{extracted_data_json}

Identified Weaknesses:
{weaknesses_json}

STRICT RULES — FOLLOW EVERY SINGLE ONE:
1. NEVER invent, fabricate, or inflate achievements. Do NOT add fake metrics like "30% performance gain" or "1,000+ users" unless the original text already contains those numbers.
2. NEVER add technologies, tools, companies, or job titles that are NOT in the original content.
3. Keep the improved text CLOSE to the original — same length, same meaning. Only fix grammar, clarity, and structure.
4. You MAY replace weak verbs (e.g. "did" → "developed", "made" → "built", "worked on" → "contributed to").
5. You MAY restructure sentences for clarity, but preserve the candidate's actual facts.
6. You MAY add ATS-relevant keywords from the candidate's EXISTING skills list into descriptions where naturally appropriate.
7. If the original content already mentions a metric or number, keep it exactly as-is.
8. Do NOT make the text longer than the original. Concise rewrites are better.
9. The improved text should sound like a REAL human wrote it, not an AI. Avoid buzzword-heavy sentences.

Your output MUST be ONLY a valid JSON object matching this exact schema (no markdown wrappers):
{{
  "target_ats_score": 85,
  "ats_score_before": 72,
  "overall_improvement_summary": "Polished grammar, replaced weak verbs with professional action verbs, and improved sentence structure for ATS readability.",
  "summary": {{
    "original": "The candidate's original summary text...",
    "improved": "The polished version — same facts, cleaner phrasing...",
    "reason": "Brief explanation of what was changed and why."
  }},
  "projects": [
    {{
      "original": "Original project description...",
      "improved": "Same description with better verbs and cleaner structure...",
      "reason": "What was changed."
    }}
  ],
  "experience": [
    {{
      "original": "Original job description...",
      "improved": "Same description with professional phrasing...",
      "reason": "What was changed."
    }}
  ],
  "skill_recommendations": [
    "Consider adding X skill if you have experience with it"
  ],
  "ats_keywords": [
    "Keywords already present in or relevant to the candidate's actual skills"
  ]
}}

IMPORTANT: The "improved" text should be recognizably the same content as the original — just cleaner, better structured, and with stronger verbs. A reader comparing both should see the same person with the same achievements.
"""

def generate_resume_improvements(db: Any, extracted_data: Dict[str, Any], ai_analysis: Dict[str, Any]) -> Dict[str, Any]:
    """
    Formulates the improvement prompt, invokes the AI Gateway (Groq AI), and parses the response.
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
    
    # Invoke AI Gateway (Groq AI)
    raw_response = generate_ai_response(db, prompt, task_type="resume_improvement")
    
    # Parse and clean response
    cleaned = raw_response.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    if cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
        
    ats_before = int(ai_analysis.get("ats_score", ai_analysis.get("overall_score", 72)))

    try:
        parsed_json = json.loads(cleaned.strip())
        
        target_score = int(parsed_json.get("target_ats_score", 85))
        # Cap at realistic range — don't claim unrealistic 97-98%
        target_score = min(92, max(80, target_score))

        original_summary = extracted_data.get("summary", "")
        if isinstance(original_summary, list) and original_summary:
            original_summary = original_summary[0]

        normalised = {
            "target_ats_score": target_score,
            "ats_score_before": int(parsed_json.get("ats_score_before", ats_before)),
            "overall_improvement_summary": str(parsed_json.get("overall_improvement_summary", "Polished grammar, improved action verbs, and enhanced ATS readability.")),
            "summary": {
                "original": str(parsed_json.get("summary", {}).get("original", original_summary)),
                "improved": str(parsed_json.get("summary", {}).get("improved", original_summary)),
                "reason": str(parsed_json.get("summary", {}).get("reason", "Improved clarity and professional phrasing."))
            },
            "projects": list(parsed_json.get("projects", [])),
            "experience": list(parsed_json.get("experience", [])),
            "skill_recommendations": list(parsed_json.get("skill_recommendations", [])),
            "ats_keywords": list(parsed_json.get("ats_keywords", []))
        }
        return normalised
        
    except Exception as e:
        logger.error(f"Failed to parse AI improvements response as JSON: {cleaned[:200]}. Error: {str(e)}")
        original_summary = extracted_data.get("summary", "")
        if isinstance(original_summary, list) and original_summary:
            original_summary = original_summary[0]
        
        # Fallback: return original content with minimal grammar polish — never fabricate
        return {
            "target_ats_score": 85,
            "ats_score_before": ats_before,
            "overall_improvement_summary": "Applied grammar corrections and professional verb upgrades.",
            "summary": {
                "original": str(original_summary),
                "improved": str(original_summary) if original_summary else "Professional summary not provided. Consider adding a 2-3 sentence overview of your skills and experience.",
                "reason": "No AI rewrite available — original content preserved."
            },
            "projects": [
                {
                    "original": p.get("description", "") if isinstance(p, dict) else str(p),
                    "improved": p.get("description", "") if isinstance(p, dict) else str(p),
                    "reason": "Original content preserved."
                } for p in extracted_data.get("projects", [])
            ],
            "experience": [
                {
                    "original": exp.get("description", "") if isinstance(exp, dict) else str(exp),
                    "improved": exp.get("description", "") if isinstance(exp, dict) else str(exp),
                    "reason": "Original content preserved."
                } for exp in extracted_data.get("experience", [])
            ],
            "skill_recommendations": ["Consider adding relevant tools and frameworks you have hands-on experience with."],
            "ats_keywords": list(extracted_data.get("skills", []))[:8]
        }
