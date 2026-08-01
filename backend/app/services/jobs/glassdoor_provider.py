import logging
from typing import Any, Dict, List
import requests

from app.core.config import settings
from app.models.student import Student
from app.services.jobs.job_provider_interface import JobProviderInterface

logger = logging.getLogger("glassdoor_provider")

class GlassdoorProvider(JobProviderInterface):
    def search_jobs(self, student: Student, keyword: str, location: str = "India", limit: int = 10) -> List[Dict[str, Any]]:
        api_key = settings.GLASSDOOR_API_KEY
        api_host = settings.GLASSDOOR_API_HOST

        if not api_key:
            logger.warning("Glassdoor API key is not configured.")
            return []

        url = f"https://{api_host}/jobs/search"
        headers = {
            "X-RapidAPI-Key": api_key,
            "X-RapidAPI-Host": api_host,
        }
        params = {
            "query": keyword,
            "location": location,
        }

        logger.info("Querying Glassdoor for: %s in %s", keyword, location)
        try:
            response = requests.get(url, headers=headers, params=params, timeout=20)
            if response.status_code != 200:
                logger.error("Glassdoor API returned %s: %s", response.status_code, response.text)
                return []

            data = response.json()
            data_content = data.get("data", {})
            job_listings = data_content.get("jobListings", []) if isinstance(data_content, dict) else []
            normalized: List[Dict[str, Any]] = []

            for listing in job_listings[:limit]:
                jobview = listing.get("jobview", {})
                header = jobview.get("header", {})
                job = jobview.get("job", {})
                employer = header.get("employer", {})

                # ID
                job_id = str(job.get("listingId") or header.get("adOrderId") or "")

                # Title
                title = str(job.get("jobTitleText") or header.get("normalizedJobTitle") or "Job title not available")

                # Company
                company = str(employer.get("name") or header.get("employerNameFromSearch") or "Not disclosed")

                # Location
                job_location = str(header.get("locationName") or "Not available")

                # URL
                apply_url = str(header.get("jobViewUrl") or "")

                # Description synthesis from attributes
                extracted_attrs = header.get("indeedJobAttribute", {}).get("extractedJobAttributes", [])
                if extracted_attrs:
                    attrs_list = [attr.get("value") for attr in extracted_attrs if attr.get("value")]
                    description = f"Job requirements/features: {', '.join(attrs_list)}. Please click Apply to view complete details on Glassdoor."
                else:
                    description = "No description provided. Click Apply to view full details on Glassdoor."

                # Salary
                salary = str(header.get("payPeriodAdjustedPay") or "Not disclosed")

                # Logo
                logo = employer.get("squareLogoUrl")

                # Remote check
                is_remote = "remote" in job_location.lower() or "remote" in title.lower()

                normalized.append({
                    "id": job_id,
                    "title": title,
                    "company": company,
                    "location": job_location,
                    "description": description,
                    "url": apply_url,
                    "apply_url": apply_url,
                    "source": "glassdoor",
                    "salary": salary,
                    "employment_type": "Not available",
                    "remote": is_remote,
                    "posted_date": "Not available",
                    "experience": "Not available",
                    "logo": logo,
                    "requirements": [],
                    "responsibilities": [],
                    "benefits": [],
                })
            return normalized

        except Exception as exc:
            logger.error("Error querying Glassdoor API: %s", exc)
            return []
