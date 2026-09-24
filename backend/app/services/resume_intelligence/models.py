from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class HealthIssue(BaseModel):
    section: str
    item_id: Optional[int] = None
    issue_type: str
    severity: str # critical, high, medium, low, informational
    message: str

class ImprovementRecommendation(BaseModel):
    priority: str # critical, high, medium, low, informational
    severity: str
    category: str # completeness, content, skills, experience, education, projects, certifications, achievements, keywords, job_match, formatting
    message: str
    reason: str
    evidence: Optional[str] = None

class SectionAnalysis(BaseModel):
    status: str # present, missing, partial, not_required
    score: int
    issues: List[HealthIssue] = Field(default_factory=list)

class KeywordAnalysis(BaseModel):
    repeated_terms: List[str] = Field(default_factory=list)
    missing_critical_terms: List[str] = Field(default_factory=list)
    consistency_warnings: List[str] = Field(default_factory=list)

class EvidenceAnalysis(BaseModel):
    skills_with_evidence: List[str] = Field(default_factory=list)
    skills_without_evidence: List[str] = Field(default_factory=list)

class ResumeHealthReport(BaseModel):
    resume_health_score: int
    score_breakdown: Dict[str, Dict[str, Any]]
    section_analysis: Dict[str, SectionAnalysis]
    issues: List[HealthIssue] = Field(default_factory=list)
    recommendations: List[ImprovementRecommendation] = Field(default_factory=list)
    keyword_analysis: KeywordAnalysis
    evidence_analysis: EvidenceAnalysis
    calculation_version: str = "1.0.0"

class JobSpecificImprovementResult(BaseModel):
    match_score: int
    missing_requirements: List[str]
    recommendations: List[ImprovementRecommendation]
