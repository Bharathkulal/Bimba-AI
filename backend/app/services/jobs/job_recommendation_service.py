import logging
import re
from typing import Any, Dict, List

from app.models.student import Student
from app.services.jobs.jsearch_provider import JSearchProvider
from app.services.jobs.glassdoor_provider import GlassdoorProvider

logger = logging.getLogger("job_recommendation_service")

STOP_WORDS = {
    "the",
    "and",
    "for",
    "with",
    "using",
    "build",
    "building",
    "team",
    "role",
    "developer",
    "engineer",
    "software",
    "service",
    "services",
    "platform",
    "product",
    "developer",
    "senior",
    "junior",
    "mid",
    "level",
    "company",
    "work",
    "remote",
    "full",
    "time",
    "part",
    "intern",
    "internship",
    "experience",
    "experience",
    "years",
    "year",
}


def _normalize_text(value: Any) -> str:
    if not value:
        return ""
    return str(value).strip()


def _normalize_list(values: Any) -> List[str]:
    if not values:
        return []
    if isinstance(values, str):
        values = [values]
    return [str(item).strip() for item in values if str(item).strip()]


def _extract_years(experience_items: List[Dict[str, Any]]) -> int:
    total_years = 0
    for item in experience_items:
        if isinstance(item, dict):
            duration = item.get("duration") or item.get("years") or ""
        else:
            duration = ""
        numbers = re.findall(r"(\d+)", str(duration))
        if numbers:
            total_years += int(numbers[0])
    return total_years


def _extract_candidate_profile(resume_analysis: Dict[str, Any], student: Student, keyword: str) -> Dict[str, Any]:
    if not resume_analysis:
        resume_analysis = {}
    ext_data = resume_analysis.get("extracted_data") or resume_analysis.get("resume") or resume_analysis
    
    raw_skills = ext_data.get("skills") or []
    skills = []
    for s in raw_skills:
        if isinstance(s, dict):
            skills.append(s.get("name") or "")
        else:
            skills.append(str(s))
            
    technologies = _normalize_list(ext_data.get("technologies") or ext_data.get("skills_matched") or [])
    experience_items = ext_data.get("experience") or []
    education = ext_data.get("education") or []
    
    target_role = _normalize_text(ext_data.get("target_role") or ext_data.get("personal_info", {}).get("title") or keyword) or "Software Engineer"
    p_info = ext_data.get("personal_info") or {}
    location_preference = _normalize_text(ext_data.get("location_preference") or ext_data.get("preferred_location") or p_info.get("address") or student.address or "India")
    experience_years = _extract_years(experience_items if isinstance(experience_items, list) else [])

    return {
        "skills": [s for s in skills if s],
        "technologies": technologies,
        "experience_years": experience_years,
        "education": education,
        "target_role": target_role,
        "location_preference": location_preference,
        "salary_preference": _normalize_text(ext_data.get("salary_preference") or ""),
        "industry": _normalize_text(ext_data.get("industry") or ext_data.get("preferred_industry") or ""),
    }


def _tokenize(text: str) -> List[str]:
    tokens = re.findall(r"[a-z0-9+#.]+", (text or "").lower())
    return [token for token in tokens if len(token) > 2 and token not in STOP_WORDS]


def _experience_match(profile: Dict[str, Any], job: Dict[str, Any]) -> int:
    profile_years = profile.get("experience_years", 0)
    job_experience = _normalize_text(job.get("experience") or "")
    if not job_experience:
        return 15

    if "senior" in job_experience.lower() and profile_years >= 4:
        return 15
    if "mid" in job_experience.lower() and profile_years >= 2:
        return 15
    if "entry" in job_experience.lower() and profile_years >= 0:
        return 15
    return 8


def calculate_resume_job_match_score(profile: Dict[str, Any], job: Dict[str, Any]) -> int:
    profile_skills = [skill.lower() for skill in profile.get("skills", []) + profile.get("technologies", []) if skill]
    profile_terms = set(profile_skills)

    job_text = " ".join([
        _normalize_text(job.get("title")),
        _normalize_text(job.get("description")),
        _normalize_text(job.get("location")),
        _normalize_text(job.get("employment_type")),
        _normalize_text(job.get("experience")),
        _normalize_text(job.get("salary")),
    ])
    job_tokens = set(_tokenize(job_text))

    matched_skills = [skill for skill in sorted(profile_terms) if skill in job_tokens]
    missing_skills = [skill for skill in sorted(profile_terms) if skill not in job_tokens]

    skills_score = 0
    if profile_terms:
        skills_score = round((len(matched_skills) / max(1, len(profile_terms))) * 45)

    experience_score = _experience_match(profile, job)

    location_preference = (profile.get("location_preference") or "").lower()
    job_location = (job.get("location") or "").lower()
    if "remote" in job_location or "remote" in location_preference:
        location_score = 10
    elif location_preference and location_preference in job_location:
        location_score = 10
    else:
        location_score = 5

    education_score = 10 if not profile.get("education") else 10
    keyword_score = round(min(10, len(matched_skills) * 2))

    title_tokens = set(_tokenize(_normalize_text(job.get("title"))))
    role_tokens = set(_tokenize(_normalize_text(profile.get("target_role"))))
    title_similarity = round((len(title_tokens & role_tokens) / max(1, len(role_tokens))) * 5) if role_tokens else 0

    seniority_score = 5 if "senior" in _normalize_text(job.get("title")).lower() and profile.get("experience_years", 0) >= 3 else 3

    score = min(100, skills_score + experience_score + location_score + education_score + keyword_score + title_similarity + seniority_score)
    return int(score)


def _build_reason(profile: Dict[str, Any], job: Dict[str, Any], matched_skills: List[str], missing_skills: List[str], score: int) -> str:
    if matched_skills:
        return f"Strong overlap with your {', '.join(matched_skills[:3])} profile and a {score}% overall fit." 
    if missing_skills:
        return f"This role aligns with your background, but you may want to strengthen {', '.join(missing_skills[:3])}."
    return f"This role is a {score}% fit based on the resume profile and job requirements."


def get_job_recommendations_with_matching(
    db: Any,
    student: Student,
    resume_analysis: Dict[str, Any],
    keyword: str,
    location: str = "India",
    limit: int = 5,
) -> List[Dict[str, Any]]:
    jobs: List[Dict[str, Any]] = []

    try:
        jsearch = JSearchProvider()
        jobs = jsearch.search_jobs(student, keyword, location, limit)
    except Exception as exc:
        logger.warning("JSearch provider failed: %s", exc)

    if not jobs:
        try:
            glassdoor = GlassdoorProvider()
            jobs = glassdoor.search_jobs(student, keyword, location, limit)
        except Exception as exc:
            logger.error("Glassdoor provider failed: %s", exc)
            jobs = []

    if not jobs:
        logger.warning("No jobs returned by any provider. Activating LLM Job Generation Fallback.")
        profile = _extract_candidate_profile(resume_analysis, student, keyword)
        try:
            from app.services.ai_provider_manager import AIProviderManager
            import json
            
            ai_manager = AIProviderManager(db)
            skills_str = ", ".join(profile.get("skills", []))
            prompt = f"""You are an expert recruiter. Generate 6 highly realistic, current job openings in {location} matching the candidate's target role: "{profile.get('target_role')}" and skills: {skills_str}.

Each job must have:
- title: Specific job title
- company: Realistic hiring company
- location: City and country (matching candidate preference or tech hubs)
- description: Detailed, professional job description
- salary: Realistic salary range
- employment_type: "Full-time", "Part-time", "Contract", or "Internship"
- remote: true or false
- posted_date: "1 day ago" or similar
- experience: e.g. "Entry Level", "Mid Level", "Senior", or "2-4 years"
- url: A search link on LinkedIn or Google Jobs, e.g. "https://www.linkedin.com/jobs/search/?keywords=software+engineer"
- requirements: List of 3-5 technical requirements
- responsibilities: List of 3-5 key responsibilities
- benefits: List of 2-3 benefits

Return ONLY a JSON object with a single root key "jobs" containing the list of jobs, without markdown wrappers:
{{
  "jobs": [
    {{
      "title": "...",
      "company": "...",
      "location": "...",
      "description": "...",
      "salary": "...",
      "employment_type": "...",
      "remote": true,
      "posted_date": "...",
      "experience": "...",
      "url": "...",
      "requirements": [],
      "responsibilities": [],
      "benefits": []
    }}
  ]
}}"""
            raw_response = ai_manager.call_llm(prompt, feature="Job Generation Fallback", response_format="json_object")
            cleaned = raw_response.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("```")[1]
                if cleaned.startswith("json"):
                    cleaned = cleaned[4:]
            res_data = json.loads(cleaned.strip())
            jobs = res_data.get("jobs", [])
            for job in jobs:
                job["source"] = "ai_fallback"
        except Exception as ai_exc:
            logger.error("LLM Job Generation Fallback failed: %s", ai_exc)
            jobs = []

    if not jobs:
        return []

    profile = _extract_candidate_profile(resume_analysis, student, keyword)
    ranked_jobs: List[Dict[str, Any]] = []

    for job in jobs:
        score = calculate_resume_job_match_score(profile, job)
        matched_skills = []
        missing_skills = []
        if profile.get("skills") or profile.get("technologies"):
            profile_terms = [skill.lower() for skill in profile.get("skills", []) + profile.get("technologies", []) if skill]
            matched_skills = [skill for skill in sorted(set(profile_terms)) if skill in _tokenize(" ".join([
                _normalize_text(job.get("title")),
                _normalize_text(job.get("description")),
            ]))]
            missing_skills = [skill for skill in sorted(set(profile_terms)) if skill not in matched_skills]

        application_url = _normalize_text(job.get("url") or job.get("apply_url") or job.get("application_url"))
        ranked_jobs.append({
            "id": str(job.get("id") or ""),
            "title": _normalize_text(job.get("title") or "Job title not available"),
            "company": _normalize_text(job.get("company") or "Not disclosed"),
            "location": _normalize_text(job.get("location") or "Not available"),
            "description": _normalize_text(job.get("description") or "No description provided."),
            "url": application_url,
            "application_url": application_url,
            "apply_url": application_url,
            "source": _normalize_text(job.get("source") or "provider"),
            "salary": _normalize_text(job.get("salary") or "Not disclosed"),
            "employment_type": _normalize_text(job.get("employment_type") or "Not available"),
            "remote": bool(job.get("remote")),
            "posted_date": _normalize_text(job.get("posted_date") or "Not available"),
            "experience": _normalize_text(job.get("experience") or "Not available"),
            "logo": job.get("logo"),
            "requirements": job.get("requirements") or [],
            "responsibilities": job.get("responsibilities") or [],
            "benefits": job.get("benefits") or [],
            "match_score": score,
            "ai_match_score": score,
            "reason": _build_reason(profile, job, matched_skills, missing_skills, score),
            "matched_skills": matched_skills[:5],
            "missing_skills": missing_skills[:5],
        })

    ranked_jobs.sort(key=lambda item: item["match_score"], reverse=True)
    return ranked_jobs
