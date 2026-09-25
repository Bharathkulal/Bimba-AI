from typing import Any, Dict
from app.services.job_provider.models import CanonicalJob

def normalize_jsearch_job(raw_job: Dict[str, Any]) -> CanonicalJob:
    job_id = str(raw_job.get("job_id", ""))
    
    # Extract location safely
    city = raw_job.get("job_city")
    state = raw_job.get("job_state")
    country = raw_job.get("job_country")
    
    location_parts = []
    if city: location_parts.append(city)
    if state: location_parts.append(state)
    if country: location_parts.append(country)
    location = ", ".join(location_parts) if location_parts else None

    # We do not fabricate salary if it's missing
    # We do not fabricate skills if they are missing
    
    return CanonicalJob(
        job_id=job_id,
        provider_job_id=job_id,
        title=str(raw_job.get("job_title", "Unknown Title")),
        company=str(raw_job.get("employer_name", "Unknown Company")),
        location=location,
        description=str(raw_job.get("job_description", "")),
        url=raw_job.get("job_apply_link"),
        source="jsearch",
        posted_at=raw_job.get("job_posted_at_datetime_utc"),
        employment_type=raw_job.get("job_employment_type"),
        skills=[], # If we had structured skills from provider, map them. Otherwise empty.
        salary_min=raw_job.get("job_min_salary"),
        salary_max=raw_job.get("job_max_salary"),
        salary_currency=raw_job.get("job_salary_currency"),
        remote=raw_job.get("job_is_remote"),
        metadata=raw_job
    )
