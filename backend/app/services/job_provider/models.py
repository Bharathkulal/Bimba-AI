from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field

class CanonicalJob(BaseModel):
    job_id: str
    provider_job_id: str
    title: str
    company: str
    location: Optional[str] = None
    description: str
    url: Optional[str] = None
    source: str
    posted_at: Optional[str] = None
    employment_type: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_currency: Optional[str] = None
    remote: Optional[bool] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
