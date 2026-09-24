from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime
from app.services.ats.ats_config import ATS_ENGINE_VERSION

class ATSAnalysisBreakdown(BaseModel):
    completeness: int = 0
    skills: int = 0
    experience: int = 0
    projects: int = 0
    education: int = 0
    certifications: int = 0
    keywords: int = 0
    formatting: int = 0

class KeywordAnalysis(BaseModel):
    matched: List[str] = Field(default_factory=list)
    missing: List[str] = Field(default_factory=list)

class ATSAnalysis(BaseModel):
    score: int
    engineVersion: str = ATS_ENGINE_VERSION
    calculatedAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    resumeVersion: str = "1.0"
    breakdown: ATSAnalysisBreakdown
    strengths: List[str] = Field(default_factory=list)
    issues: List[str] = Field(default_factory=list)
    suggestions: List[str] = Field(default_factory=list)
    keywordAnalysis: KeywordAnalysis = Field(default_factory=KeywordAnalysis)
    skillAnalysis: dict = Field(default_factory=dict)
    jobMatch: Optional[dict] = None
    warnings: List[str] = Field(default_factory=list)
