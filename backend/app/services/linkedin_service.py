import os
from typing import Any, Dict, Optional

import requests

from app.models.student import Student


class LinkedInService:
    def __init__(self):
        self.api_key = os.getenv("RAPIDAPI_KEY")
        self.api_host = os.getenv("RAPIDAPI_HOST", "linkedin-data-api.p.rapidapi.com")
        self.job_cache = {}

    def search_jobs(
        self,
        student: Optional[Student],
        keyword: Optional[str] = None,
        location: Optional[str] = None,
        page: int = 1,
        experience: Optional[str] = None,
        remote: Optional[bool] = None,
        employment_type: Optional[str] = None,
        salary: Optional[str] = None,
        limit: int = 10,
    ) -> Dict[str, Any]:
        if not self.api_key:
            return {"jobs": [], "total": 0, "page": page, "pages": 0, "limit": limit}

        url = f"https://{self.api_host}/active-jb"
        headers = {
            "X-RapidAPI-Key": self.api_key,
            "X-RapidAPI-Host": self.api_host,
        }
        params = {
            "title": keyword or "Software Engineer",
            "location": location or "India",
            "time_frame": "6m",
            "limit": str(limit),
            "offset": str((page - 1) * limit),
        }

        try:
            response = requests.get(url, headers=headers, params=params, timeout=10)
            if response.status_code != 200:
                raise ValueError(f"RapidAPI returned status {response.status_code}: {response.text}")

            raw_jobs = response.json()
            if not isinstance(raw_jobs, list):
                raw_jobs = raw_jobs.get("data", []) if isinstance(raw_jobs, dict) else []

            jobs = []
            for index, job in enumerate(raw_jobs):
                apply_url = str(job.get("url") or "").strip() or None
                jobs.append(
                    {
                        "id": str(job.get("id") or f"api_job_{index}"),
                        "title": str(job.get("title") or "Job title not available"),
                        "company": str(job.get("organization") or "Not disclosed"),
                        "location": str(job.get("locations_derived", ["Not available"])[0]) if job.get("locations_derived") else "Not available",
                        "logo": job.get("organization_logo"),
                        "salary": job.get("ai_salary_value") or "Not disclosed",
                        "employment_type": job.get("ai_employment_type") or "Not available",
                        "remote": bool(job.get("ai_work_arrangement") == "Remote"),
                        "posted_date": str(job.get("date_posted") or "Not available"),
                        "description": str(job.get("ai_requirements_summary") or "No description provided."),
                        "requirements": [job.get("ai_key_skills")] if job.get("ai_key_skills") else [],
                        "responsibilities": [job.get("ai_core_responsibilities")] if job.get("ai_core_responsibilities") else [],
                        "benefits": [job.get("ai_benefits")] if job.get("ai_benefits") else [],
                        "experience": job.get("ai_experience_level") or "Not available",
                        "ai_match_score": 0,
                        "skills_matched": [],
                        "skills_missing": [],
                        "apply_url": apply_url,
                        "application_url": apply_url,
                    }
                )

            total = len(jobs)
            return {
                "jobs": jobs[:limit],
                "total": total,
                "page": page,
                "pages": (total + limit - 1) // limit if total > 0 else 0,
                "limit": limit,
            }
        except Exception as exc:
            return {"jobs": [], "total": 0, "page": page, "pages": 0, "limit": limit}

    def get_job_details(self, student: Optional[Student], job_id: str) -> Optional[Dict[str, Any]]:
        return None


linkedin_service = LinkedInService()
