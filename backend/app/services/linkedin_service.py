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
        from app.services.jobs.jsearch_provider import JSearchProvider
        from app.services.jobs.glassdoor_provider import GlassdoorProvider
        
        jsearch = JSearchProvider()
        glassdoor = GlassdoorProvider()
        
        kw = keyword or "Software Engineer"
        loc = location or "India"
        
        jobs = []
        source_used = "jsearch"
        
        try:
            jobs = jsearch.search_jobs(student, keyword=kw, location=loc, limit=limit)
        except Exception as e:
            print(f"JSearch failed: {str(e)}. Falling back to Glassdoor provider.")
            source_used = "glassdoor"
            try:
                jobs = glassdoor.search_jobs(student, keyword=kw, location=loc, limit=limit)
            except Exception as ge:
                print(f"Glassdoor fallback failed: {str(ge)}")
                jobs = []

        # Convert provider results to the expected frontend schema
        formatted_jobs = []
        for index, job in enumerate(jobs):
            apply_url = str(job.get("apply_url") or job.get("url") or "").strip() or None
            formatted_jobs.append(
                {
                    "id": str(job.get("id") or f"api_job_{index}"),
                    "title": str(job.get("title") or "Job title not available"),
                    "company": str(job.get("company") or "Not disclosed"),
                    "location": str(job.get("location") or "Not available"),
                    "logo": job.get("logo"),
                    "salary": job.get("salary") or "Not disclosed",
                    "employment_type": job.get("employment_type") or "Not available",
                    "remote": bool(job.get("remote")),
                    "posted_date": str(job.get("posted_date") or "Not available"),
                    "description": str(job.get("description") or "No description provided."),
                    "requirements": job.get("requirements", []),
                    "responsibilities": job.get("responsibilities", []),
                    "benefits": job.get("benefits", []),
                    "experience": job.get("experience") or "Not available",
                    "ai_match_score": 85,
                    "skills_matched": job.get("skills_matched", []),
                    "skills_missing": job.get("skills_missing", []),
                    "apply_url": apply_url,
                    "application_url": apply_url,
                }
            )

        total = len(formatted_jobs)
        return {
            "jobs": formatted_jobs,
            "total": total,
            "page": page,
            "pages": 1 if total > 0 else 0,
            "limit": limit,
        }

    def get_job_details(self, student: Optional[Student], job_id: str) -> Optional[Dict[str, Any]]:
        return None


linkedin_service = LinkedInService()
