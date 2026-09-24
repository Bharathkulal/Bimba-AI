from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime

class NormalizedSkill(BaseModel):
    canonical: str
    display: str
    source: str = ""

class ParsedJobRequirements(BaseModel):
    job_title: str = ""
    department: str = ""
    location: str = ""
    employment_type: str = ""
    seniority: str = ""
    years_of_experience: int = 0
    required_skills: List[str] = Field(default_factory=list)
    preferred_skills: List[str] = Field(default_factory=list)
    required_education: List[str] = Field(default_factory=list)
    required_certifications: List[str] = Field(default_factory=list)

class SkillEvidence(BaseModel):
    source: str
    text: str

class MatchedSkill(BaseModel):
    skill: str
    matched: bool
    evidence: List[SkillEvidence] = Field(default_factory=list)

class SkillGap(BaseModel):
    skill: str
    gap_type: str # "Required", "Preferred", "Evidence Gap"
    message: str = ""

class JobMatchResult(BaseModel):
    overall_match_score: int
    required_skill_match: int
    preferred_skill_match: int
    experience_match: int
    education_match: int
    certification_match: int
    responsibility_match: int = 0
    matched_skills: List[MatchedSkill] = Field(default_factory=list)
    missing_required_skills: List[str] = Field(default_factory=list)
    missing_preferred_skills: List[str] = Field(default_factory=list)
    skill_gaps: List[SkillGap] = Field(default_factory=list)
    evidence: List[SkillEvidence] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    calculation_version: str = "1.0.0"

class JobMatchResponse(BaseModel):
    resume_id: str
    job_id: Optional[str] = None
    calculation_version: str = "1.0.0"
    result: JobMatchResult
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
