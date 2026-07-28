import requests
import logging
from typing import List, Dict, Any
from app.services.jobs.job_provider_interface import JobProviderInterface
from app.models.student import Student
from app.core.config import settings

logger = logging.getLogger("jsearch_provider")

class JSearchProvider(JobProviderInterface):
    def search_jobs(self, student: Student, keyword: str, location: str = "India", limit: int = 10) -> List[Dict[str, Any]]:
        """
        Searches jobs using JSearch API on RapidAPI.
        """
        if not settings.JSEARCH_API_KEY:
            logger.warning("JSearch API Key is missing. Skipping search.")
            raise ValueError("JSearch API Key is not set")
            
        url = "https://jsearch.p.rapidapi.com/search"
        headers = {
            "X-RapidAPI-Key": settings.JSEARCH_API_KEY,
            "X-RapidAPI-Host": settings.JSEARCH_API_HOST
        }
        
        params = {
            "query": f"{keyword} in {location}",
            "page": "1",
            "num_pages": "1"
        }
        
        logger.info(f"Querying JSearch for: {keyword} in {location}")
        try:
            res = requests.get(url, headers=headers, params=params, timeout=8)
            if res.status_code != 200:
                logger.error(f"JSearch API returned error status: {res.status_code}, response: {res.text}")
                raise RuntimeError(f"JSearch request failed: {res.status_code}")
                
            data = res.json()
            jobs_list = data.get("data", [])
            
            normalized = []
            for j in jobs_list[:limit]:
                normalized.append({
                    "id": str(j.get("job_id", "")),
                    "title": str(j.get("job_title", "Software Developer")),
                    "company": str(j.get("employer_name", "Technology Corporation")),
                    "location": f"{j.get('job_city', '')}, {j.get('job_state', '')}, {j.get('job_country', '')}".strip(", "),
                    "description": str(j.get("job_description", "")),
                    "url": str(j.get("job_apply_link", "https://jsearch.p.rapidapi.com")),
                    "source": "jsearch"
                })
            return normalized
            
        except Exception as e:
            logger.error(f"Error querying JSearch API: {str(e)}")
            raise e
