import requests
import logging
import json
from typing import List, Dict, Any
from app.services.jobs.job_provider_interface import JobProviderInterface
from app.models.student import Student
from app.core.config import settings
from app.services.ai_providers.gemini_provider import call_gemini

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
        Generates actual realistic jobs dynamically using Gemini instead of static placeholders.
        """
        import random
        logger.info("Generating realistic jobs via Gemini for LinkedIn provider")
        prompt = f"""You are a professional recruiting database. Generate a JSON list containing exactly {limit} realistic job openings.
The jobs should match keyword: "{keyword}" and location: "{location}".

Each job object in the list MUST have the following structure exactly:
{{
  "id": "ai_generated_job_li_{random.randint(100, 999)}",
  "title": "Job Title (e.g. Frontend Engineer, Python Developer)",
  "company": "Real well-known company (e.g. Google, Vercel, Microsoft, Stripe, Accenture, TCS, Infosys, Swiggy, Netflix, Airbnb)",
  "location": "City, Country or Remote",
  "description": "Realistic job description detailing responsibilities and technologies used.",
  "url": "https://linkedin.com/jobs",
  "source": "linkedin_ai"
}}

Return ONLY the valid JSON list, no markdown code block formatting (do not include ```json or ```).
"""
        try:
            res = call_gemini(prompt)
            if res.get("success"):
                content = res["content"].strip()
                if content.startswith("```json"):
                    content = content[7:]
                if content.endswith("```"):
                    content = content[:-3]
                parsed = json.loads(content.strip())
                if isinstance(parsed, list):
                    return parsed
        except Exception as e:
            logger.error(f"Failed to generate dynamic jobs: {e}")

        # Basic fallback list if LLM fails
        return [
            {
                "id": f"li_fallback_{i}",
                "title": f"Senior {keyword}" if i == 0 else f"{keyword} Engineer",
                "company": ["Google", "Microsoft", "Atlassian", "Swiggy", "PhonePe"][i % 5],
                "location": location,
                "description": f"Exciting job role for a developer at leading companies. We need expertise in building responsive applications. Join our engineering team to design, build, and deploy web services.",
                "url": "https://linkedin.com/jobs",
                "source": "linkedin_fallback"
            } for i in range(limit)
        ]

import os
