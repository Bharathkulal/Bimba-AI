import json
import logging
from typing import List, Dict, Any
from app.services.jobs.jsearch_provider import JSearchProvider
from app.services.jobs.linkedin_provider import LinkedInProvider
from app.services.ai_gateway import generate_ai_response
from app.models.student import Student

logger = logging.getLogger("job_recommendation_service")

JOB_MATCHING_PROMPT_TEMPLATE = """
You are an expert technical recruiter and ATS resume matching engine.
Compare the candidate's resume profile with the job description below and calculate their match suitability.

Candidate Resume Profile:
- Skills: {skills}
- Summary: {summary}
- Target Role: {target_role}

Job Details:
- Title: {job_title}
- Company: {company}
- Location: {location}
- Description: {job_desc}

You MUST output your response ONLY as a valid JSON object matching the schema below. Do not wrap it in markdown code blocks.

Required JSON Schema:
{{
  "match_score": 92,
  "reason": "Strong match in React development, but lacks AWS cloud deployment experience",
  "matched_skills": ["React", "JavaScript"],
  "missing_skills": ["AWS", "Docker"]
}}

CRITICAL RULES:
1. Output match_score as an integer between 0 and 100.
2. Under matched_skills, include only skills that appear in BOTH the candidate profile and the job description.
3. Under missing_skills, include skills required for the job that the candidate lacks.
4. Output ONLY the JSON. No other text.
"""

def get_job_recommendations_with_matching(
    db: Any,
    student: Student,
    resume_analysis: Dict[str, Any],
    keyword: str,
    location: str = "India",
    limit: int = 5
) -> List[Dict[str, Any]]:
    """
    Main coordinator:
    1. Search jobs via JSearch.
    2. Fallback to LinkedIn if JSearch raises error.
    3. Run AI matching on each job.
    4. Return ranked list.
    """
    # ── 1. Search Jobs with Fallback ──
    jobs = []
    
    # Try JSearch
    try:
        jsearch = JSearchProvider()
        jobs = jsearch.search_jobs(student, keyword, location, limit)
    except Exception as e:
        logger.warning(f"JSearch Provider failed: {str(e)}. Falling back to LinkedIn.")
        
    # Fallback to LinkedIn
    if not jobs:
        try:
            linkedin = LinkedInProvider()
            jobs = linkedin.search_jobs(student, keyword, location, limit)
        except Exception as e:
            logger.error(f"LinkedIn Provider failed: {str(e)}")
            jobs = []
            
    if not jobs:
        logger.warning("No jobs returned by any provider.")
        return []

    # ── 2. Parse Candidate Profile ──
    ext_data = resume_analysis.get("extracted_data", {})
    skills_list = ext_data.get("skills", [])
    skills_str = ", ".join(skills_list)
    summary_text = ext_data.get("summary", [""])[0] if isinstance(ext_data.get("summary"), list) and ext_data.get("summary") else ext_data.get("summary", "")
    target_role = ext_data.get("target_role", keyword)

    # ── 3. Match Jobs with AI Gateway ──
    ranked_jobs = []
    
    for job in jobs:
        prompt = JOB_MATCHING_PROMPT_TEMPLATE.format(
            skills=skills_str,
            summary=summary_text,
            target_role=target_role,
            job_title=job["title"],
            company=job["company"],
            location=job["location"],
            job_desc=job["description"][:1000] # truncate to avoid token exhaust
        )
        
        # Invoke AI Gateway
        try:
            raw_response = generate_ai_response(db, prompt, task_type="job_matching")
            cleaned = raw_response.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
                
            parsed = json.loads(cleaned.strip())
            match_score = int(parsed.get("match_score", 65))
            reason = str(parsed.get("reason", "Medium match level"))
            matched_skills = list(parsed.get("matched_skills", []))
            missing_skills = list(parsed.get("missing_skills", []))
        except Exception as e:
            logger.error(f"AI Match Parsing failed for job {job['id']}: {str(e)}")
            # Default fallback matching
            match_score = 75
            reason = "Default matching applied"
            matched_skills = [s for s in skills_list[:3]]
            missing_skills = ["Docker"]

        ranked_jobs.append({
            "id": job["id"],
            "title": job["title"],
            "company": job["company"],
            "location": job["location"],
            "description": job["description"],
            "url": job["url"],
            "source": job["source"],
            "match_score": match_score,
            "reason": reason,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills
        })

    # Sort by match score descending
    ranked_jobs.sort(key=lambda x: x["match_score"], reverse=True)
    return ranked_jobs
