from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Job list item for Dashboard cards
class JobListItem(BaseModel):
    id: str
    title: str
    company: str
    location: str
    logo: Optional[str] = None
    salary: Optional[str] = None
    employment_type: Optional[str] = None  # Full-time, Part-time, Internship, etc.
    remote: Optional[bool] = False         # True / False
    posted_date: Optional[str] = None
    ai_match_score: Optional[int] = None   # Match score: 0-100
    skills_matched: Optional[List[str]] = []
    skills_missing: Optional[List[str]] = []
    apply_url: Optional[str] = None

class JobSearchResponse(BaseModel):
    jobs: List[JobListItem]
    total: int
    page: int
    pages: int
    limit: int

# Full Job details
class JobDetailResponse(BaseModel):
    id: str
    title: str
    company: str
    location: str
    logo: Optional[str] = None
    banner: Optional[str] = None
    salary: Optional[str] = None
    employment_type: Optional[str] = None
    remote: Optional[bool] = False
    posted_date: Optional[str] = None
    description: str
    requirements: Optional[List[str]] = []
    responsibilities: Optional[List[str]] = []
    benefits: Optional[List[str]] = []
    experience: Optional[str] = None      # Entry, Mid, Senior
    ai_match_score: Optional[int] = None
    skills_matched: Optional[List[str]] = []
    skills_missing: Optional[List[str]] = []
    apply_url: Optional[str] = None
    company_info: Optional[Dict[str, Any]] = None

# Save job request
class JobSaveRequest(BaseModel):
    job_id: str
    company: str
    title: str
    location: str
    logo: Optional[str] = None

# Saved Job response schema
class SavedJobResponse(BaseModel):
    id: int
    job_id: str
    company: str
    title: str
    location: str
    logo: Optional[str] = None
    saved_at: datetime

    class Config:
        from_attributes = True

# Job application tracker request
class JobApplicationCreate(BaseModel):
    job_id: str
    company: str
    title: str
    logo: Optional[str] = None
    location: Optional[str] = None
    status: str = "Applied"  # Applied, Interview, Rejected, Offer, Accepted
    notes: Optional[str] = None

# Job application status update
class JobApplicationUpdate(BaseModel):
    status: str
    notes: Optional[str] = None

# Job application response
class JobApplicationResponse(BaseModel):
    id: int
    job_id: str
    company: str
    title: str
    logo: Optional[str] = None
    location: Optional[str] = None
    status: str
    application_date: datetime
    notes: Optional[str] = None

    class Config:
        from_attributes = True
