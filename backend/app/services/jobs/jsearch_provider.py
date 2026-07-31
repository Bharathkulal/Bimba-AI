import logging
from typing import Any, Dict, List

import requests

from app.core.config import settings
from app.models.student import Student
from app.services.jobs.job_provider_interface import JobProviderInterface

logger = logging.getLogger("jsearch_provider")


class JSearchProvider(JobProviderInterface):
    def search_jobs(self, student: Student, keyword: str, location: str = "India", limit: int = 10) -> List[Dict[str, Any]]:
        if not settings.JSEARCH_API_KEY:
            logger.warning("JSearch API key is not configured.")
            raise ValueError("JSearch API key is not set")

        url = "https://jsearch.p.rapidapi.com/search"
        headers = {
            "X-RapidAPI-Key": settings.JSEARCH_API_KEY,
            "X-RapidAPI-Host": settings.JSEARCH_API_HOST,
        }
        params = {
            "query": f"{keyword} in {location}",
            "page": "1",
            "num_pages": "1",
        }

        logger.info("Querying JSearch for: %s in %s", keyword, location)
        try:
            response = requests.get(url, headers=headers, params=params, timeout=8)
            if response.status_code != 200:
                logger.error("JSearch API returned %s: %s", response.status_code, response.text)
                raise RuntimeError(f"JSearch request failed: {response.status_code}")

            data = response.json()
            jobs_list = data.get("data", []) if isinstance(data, dict) else []
            normalized: List[Dict[str, Any]] = []

            for job in jobs_list[:limit]:
                location_parts = [
                    job.get("job_city"),
                    job.get("job_state"),
                    job.get("job_country"),
                ]
                location_value = ", ".join(part for part in location_parts if part)
                apply_url = job.get("job_apply_link") or job.get("job_apply_link") or ""
                normalized.append({
                    "id": str(job.get("job_id") or ""),
                    "title": str(job.get("job_title") or "Job title not available"),
                    "company": str(job.get("employer_name") or "Not disclosed"),
                    "location": location_value or "Not available",
                    "description": str(job.get("job_description") or "No description provided."),
                    "url": str(apply_url).strip() if apply_url else "",
                    "apply_url": str(apply_url).strip() if apply_url else "",
                    "source": "jsearch",
                    "salary": str(job.get("job_min_salary") or job.get("job_max_salary") or "").strip() or "Not disclosed",
                    "employment_type": str(job.get("job_employment_type") or "Not available"),
                    "remote": bool(job.get("job_is_remote")),
                    "posted_date": str(job.get("job_posted_at_datetime_utc") or "Not available"),
                    "experience": str(job.get("job_required_experience") or "Not available"),
                    "logo": job.get("employer_logo"),
                    "requirements": [],
                    "responsibilities": [],
                    "benefits": [],
                })
            return normalized

        except Exception as exc:
            logger.error("Error querying JSearch API: %s", exc)
            raise exc
