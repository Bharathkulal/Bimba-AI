from pydantic import BaseModel, Field
from typing import List, Dict, Optional

class SkillGapItem(BaseModel):
    skill: str
    priority: int
    demand_count: int
    required_count: int
    preferred_count: int
    related_jobs: int
    reason: str
    learning_action: str

class CareerRoleRecommendation(BaseModel):
    role_title: str
    match_score: int
    reason: str
    next_skills: List[str]

class SkillGapResponse(BaseModel):
    resume_id: str
    status: str = "success"
    message: str = ""
    current_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    required_missing_skills: List[str] = Field(default_factory=list)
    preferred_missing_skills: List[str] = Field(default_factory=list)
    skill_gaps: List[SkillGapItem] = Field(default_factory=list)
    top_priorities: List[str] = Field(default_factory=list)
    career_recommendations: List[CareerRoleRecommendation] = Field(default_factory=list)
    learning_roadmap: List[str] = Field(default_factory=list)
    data_source: str = "real_job_data"
