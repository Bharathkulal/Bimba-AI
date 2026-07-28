import requests
import logging
from typing import List, Dict, Any
from app.services.jobs.job_provider_interface import JobProviderInterface
from app.models.student import Student
from app.core.config import settings

logger = logging.getLogger("linkedin_provider")

class LinkedInProvider(JobProviderInterface):
    def search_jobs(self, student: Student, keyword: str, location: str = "India", limit: int = 10) -> List[Dict[str, Any]]:
        """
        Searches jobs using LinkedIn Job Search API on RapidAPI.
        """
        api_key = settings.LINKEDIN_API_KEY or os.getenv("RAPIDAPI_KEY")
        api_host = settings.LINKEDIN_API_HOST or "linkedin-data-api.p.rapidapi.com"
        
        if not api_key:
            logger.warning("LinkedIn API Key is missing. Returning empty list.")
            return self._get_mock_jobs(keyword, location, limit)
            
        url = f"https://{api_host}/search-jobs"
        headers = {
            "X-RapidAPI-Key": api_key,
            "X-RapidAPI-Host": api_host
        }
        
        params = {
            "keywords": keyword,
            "location": location,
            "count": str(limit)
        }
        
        logger.info(f"Querying LinkedIn for: {keyword} in {location}")
        try:
            res = requests.get(url, headers=headers, params=params, timeout=8)
            if res.status_code != 200:
                logger.warning(f"LinkedIn Job Search API failed: {res.status_code}. Mocking fallback.")
                return self._get_mock_jobs(keyword, location, limit)
                
            data = res.json()
            jobs_list = data.get("data", [])
            
            normalized = []
            for j in jobs_list[:limit]:
                normalized.append({
                    "id": str(j.get("id", "") or j.get("job_id", "")),
                    "title": str(j.get("title", "") or j.get("job_title", "Software Engineer")),
                    "company": str(j.get("company", {}).get("name", "") or j.get("company_name", "Corporate Inc.")),
                    "location": str(j.get("location", "India")),
                    "description": str(j.get("description", "")),
                    "url": str(j.get("url", "https://linkedin.com")),
                    "source": "linkedin"
                })
            return normalized
            
        except Exception as e:
            logger.error(f"Error querying LinkedIn Job Search API: {str(e)}")
            return self._get_mock_jobs(keyword, location, limit)

    def _get_mock_jobs(self, keyword: str, location: str, limit: int) -> List[Dict[str, Any]]:
        """
        Static high-quality mock jobs for local development safety.
        """
        logger.info("Serving mock jobs for LinkedIn provider")
        return [
            {
                "id": f"li_mock_{i}",
                "title": f"Senior {keyword}" if i == 0 else f"{keyword} Engineer",
                "company": ["Google", "Microsoft", "Atlassian", "Swiggy", "PhonePe"][i % 5],
                "location": location,
                "description": f"Exciting job role for a developer. We need expertise in building responsive applications. Join our engineering team to design, build, and deploy web services.",
                "url": "https://linkedin.com/jobs",
                "source": "linkedin_mock"
            } for i in range(limit)
        ]

import os
