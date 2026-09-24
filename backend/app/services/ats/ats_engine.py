from typing import Dict, Any, List
from datetime import datetime
from app.services.ats.models import ATSAnalysis, ATSAnalysisBreakdown, KeywordAnalysis
from app.services.ats.analyzers import Analyzers
from app.services.ats.score_calculator import ScoreCalculator
from app.services.ats.job_description_parser import JobDescriptionParser

class ATSEngine:
    @staticmethod
    def analyze_resume(resume_data: Dict[str, Any], raw_text: str = "", job_description: str = "") -> Dict[str, Any]:
        """
        Main entry point for local deterministic ATS analysis.
        """
        comp_res = Analyzers.analyze_completeness(resume_data)
        skills_res = Analyzers.analyze_skills(resume_data)
        exp_res = Analyzers.analyze_experience(resume_data)
        proj_res = Analyzers.analyze_projects(resume_data)
        edu_res = Analyzers.analyze_education(resume_data)
        cert_res = Analyzers.analyze_certifications(resume_data)
        kw_res = Analyzers.analyze_keywords(resume_data, raw_text)
        fmt_res = Analyzers.analyze_formatting(raw_text)
        
        breakdown = {
            "completeness": comp_res["score"],
            "skills": skills_res["score"],
            "experience": exp_res["score"],
            "projects": proj_res["score"],
            "education": edu_res["score"],
            "certifications": cert_res["score"],
            "keywords": kw_res["score"],
            "formatting": fmt_res["score"]
        }
        
        final_score = ScoreCalculator.calculate_final_score(breakdown)
        
        issues = (
            comp_res["issues"] + skills_res["issues"] + exp_res["issues"] +
            proj_res["issues"] + edu_res["issues"] + cert_res["issues"] +
            kw_res["issues"] + fmt_res["issues"]
        )
        
        suggestions = (
            skills_res.get("suggestions", []) + exp_res.get("suggestions", []) +
            proj_res.get("suggestions", []) + edu_res.get("suggestions", []) +
            cert_res.get("suggestions", []) + kw_res.get("suggestions", []) +
            fmt_res.get("suggestions", [])
        )
        
        strengths = (
            skills_res.get("strengths", []) + exp_res.get("strengths", []) +
            proj_res.get("strengths", []) + edu_res.get("strengths", []) +
            cert_res.get("strengths", []) + kw_res.get("strengths", []) +
            fmt_res.get("strengths", [])
        )
        
        job_match = None
        if job_description:
            parsed_jd = JobDescriptionParser.parse(job_description)
            job_match = {
                "job_title": parsed_jd["job_title"],
                "match_score": 0, # Placeholder for deterministic match
                "matched_skills": [],
                "missing_skills": []
            }
        
        analysis = ATSAnalysis(
            score=final_score,
            breakdown=ATSAnalysisBreakdown(**breakdown),
            strengths=strengths,
            issues=issues,
            suggestions=suggestions,
            jobMatch=job_match,
            skillAnalysis={"normalized": skills_res.get("normalized", [])}
        )
        
        return analysis.dict()
