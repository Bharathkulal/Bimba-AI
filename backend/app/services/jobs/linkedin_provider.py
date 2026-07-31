import logging
import os
from typing import Any, Dict, List

import requests

from app.core.config import settings
from app.models.student import Student
from app.services.jobs.job_provider_interface import JobProviderInterface

logger = logging.getLogger("linkedin_provider")


class LinkedInProvider(JobProviderInterface):
    def search_jobs(self, student: Student, keyword: str, location: str = "India", limit: int = 10) -> List[Dict[str, Any]]:
        api_key = settings.LINKEDIN_API_KEY or os.getenv("RAPIDAPI_KEY")
        api_host = settings.LINKEDIN_API_HOST or "linkedin-data-api.p.rapidapi.com"

        if not api_key:
            logger.warning("LinkedIn API key is missing.")
            return []

        url = f"https://{api_host}/search-jobs"
        headers = {
            "X-RapidAPI-Key": api_key,
            "X-RapidAPI-Host": api_host,
        }
        params = {
            "keywords": keyword,
            "location": location,
            "count": str(limit),
        }

        logger.info("Querying LinkedIn for: %s in %s", keyword, location)
        try:
            response = requests.get(url, headers=headers, params=params, timeout=8)
            if response.status_code != 200:
                logger.warning("LinkedIn API failed with %s", response.status_code)
                return []

            data = response.json()
            jobs_list = data.get("data", []) if isinstance(data, dict) else []
            normalized: List[Dict[str, Any]] = []

            for job in jobs_list[:limit]:
                company = job.get("company") or {}
                company_name = company.get("name") if isinstance(company, dict) else None
                apply_url = job.get("url") or job.get("job_apply_link") or ""
                normalized.append({
                    "id": str(job.get("id") or job.get("job_id") or ""),
                    "title": str(job.get("title") or job.get("job_title") or "Job title not available"),
                    "company": str(company_name or job.get("company_name") or "Not disclosed"),
                    "location": str(job.get("location") or "Not available"),
                    "description": str(job.get("description") or "No description provided."),
                    "url": str(apply_url).strip() if apply_url else "",
                    "apply_url": str(apply_url).strip() if apply_url else "",
                    "source": "linkedin",
                    "salary": str(job.get("salary") or "Not disclosed"),
                    "employment_type": str(job.get("employment_type") or "Not available"),
                    "remote": bool(job.get("remote")),
                    "posted_date": str(job.get("posted_date") or "Not available"),
                    "experience": str(job.get("experience") or "Not available"),
                    "logo": job.get("logo") or company.get("logo") if isinstance(company, dict) else None,
                    "requirements": [],
                    "responsibilities": [],
                    "benefits": [],
                })
            return normalized

        except Exception as exc:
            logger.error("Error querying LinkedIn Job Search API: %s", exc)
            return []
