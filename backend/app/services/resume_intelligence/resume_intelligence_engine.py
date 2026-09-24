from typing import Dict, Any, Optional
from app.services.resume_intelligence.models import ResumeHealthReport, JobSpecificImprovementResult
from app.services.resume_intelligence.resume_health_analyzer import ResumeHealthAnalyzer
from app.services.resume_intelligence.content_quality_analyzer import ContentQualityAnalyzer
from app.services.resume_intelligence.achievement_analyzer import AchievementAnalyzer
from app.services.resume_intelligence.evidence_analyzer import EvidenceAnalyzer
from app.services.resume_intelligence.keyword_analyzer import KeywordAnalyzer
from app.services.resume_intelligence.recommendation_engine import RecommendationEngine

class ResumeIntelligenceEngine:
    @staticmethod
    def analyze(resume_data: Dict[str, Any], job_description: Optional[str] = None) -> ResumeHealthReport:
        # 1. Base Health & Completeness
        sections = ResumeHealthAnalyzer.analyze_completeness(resume_data)
        
        # 2. Extract issues list
        all_issues = []
        for s in sections.values():
            all_issues.extend(s.issues)
            
        # 3. Content Quality & Achievements
        exp_items = resume_data.get("experience", resume_data.get("work_experience", []))
        if isinstance(exp_items, list):
            cq_exp_issues = ContentQualityAnalyzer.analyze_bullets("experience", exp_items)
            ach_exp_issues = AchievementAnalyzer.analyze_achievements("experience", exp_items)
            all_issues.extend(cq_exp_issues)
            all_issues.extend(ach_exp_issues)
            
        proj_items = resume_data.get("projects", [])
        if isinstance(proj_items, list):
            cq_proj_issues = ContentQualityAnalyzer.analyze_bullets("projects", proj_items)
            ach_proj_issues = AchievementAnalyzer.analyze_achievements("projects", proj_items)
            all_issues.extend(cq_proj_issues)
            all_issues.extend(ach_proj_issues)
            
        summary = resume_data.get("summary", resume_data.get("career_objective", ""))
        all_issues.extend(ContentQualityAnalyzer.analyze_summary(summary))
        
        # 4. Evidence Analysis
        evidence_analysis = EvidenceAnalyzer.analyze(resume_data)
        
        # 5. Keyword Analysis
        keyword_analysis = KeywordAnalyzer.analyze_general(resume_data)
        
        # 6. Calculate Overall Score
        content_issues_count = len([i for i in all_issues if i.issue_type in ["weak_action_verbs", "too_short", "no_metrics", "cliche_language"]])
        evidence_gap_count = len(evidence_analysis.skills_without_evidence)
        
        overall_score, breakdown = ResumeHealthAnalyzer.calculate_health_score(sections, content_issues_count, evidence_gap_count)
        
        # 7. Job-Specific Gaps (if job text provided)
        job_gaps = None
        if job_description:
            from app.services.job_matching.job_requirement_parser import JobRequirementParser
            job_reqs = JobRequirementParser.parse(job_description)
            job_gaps = KeywordAnalyzer.job_specific_analysis(resume_data, job_reqs)
            
        # 8. Generate Recommendations
        recommendations = RecommendationEngine.generate(all_issues, evidence_analysis, job_gaps)
        
        return ResumeHealthReport(
            resume_health_score=overall_score,
            score_breakdown=breakdown,
            section_analysis=sections,
            issues=all_issues,
            keyword_analysis=keyword_analysis,
            evidence_analysis=evidence_analysis,
            recommendations=recommendations
        )
