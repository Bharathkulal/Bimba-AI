import json
from typing import Dict, Any, List, Optional
from app.services.skill_gap.skill_gap_models import SkillGapResponse, SkillGapItem, CareerRoleRecommendation
from app.services.job_matching.job_requirement_parser import JobRequirementParser
from app.services.job_matching.job_match_engine import JobMatchEngine
from app.services.job_matching.skill_normalizer import SkillNormalizer

class SkillGapEngine:
    @staticmethod
    def _aggregate_skills(jobs: List[Dict[str, Any]]) -> Dict[str, Dict[str, int]]:
        """Aggregates skills from a list of jobs."""
        demand = {}
        for job in jobs:
            text = job.get("description", "")
            if not text:
                continue
            reqs = JobRequirementParser.parse(text, structured_job=job)
            
            for skill in reqs.required_skills:
                norm = SkillNormalizer.normalize(skill)
                if norm not in demand:
                    demand[norm] = {"required": 0, "preferred": 0, "jobs": 0, "display": skill}
                demand[norm]["required"] += 1
                demand[norm]["jobs"] += 1
                
            for skill in reqs.preferred_skills:
                norm = SkillNormalizer.normalize(skill)
                if norm not in demand:
                    demand[norm] = {"required": 0, "preferred": 0, "jobs": 0, "display": skill}
                demand[norm]["preferred"] += 1
                demand[norm]["jobs"] += 1
                
        return demand

    @staticmethod
    def _generate_learning_action(skill: str, count: int) -> str:
        return f"1. Learn fundamentals of {skill}\n2. Build a small project using {skill}\n3. Add it to your resume to match {count} more jobs."

    @staticmethod
    def _extract_titles(jobs: List[Dict[str, Any]]) -> List[str]:
        titles = []
        for j in jobs:
            if "title" in j and j["title"]:
                titles.append(j["title"])
        return titles

    @staticmethod
    def analyze(resume_data: Dict[str, Any], jobs_data: List[Dict[str, Any]], resume_id: str) -> SkillGapResponse:
        if not jobs_data:
            return SkillGapResponse(
                resume_id=resume_id,
                status="insufficient_data",
                message="Not enough real job data is available to calculate current skill demand.",
                data_source="real_job_data"
            )
            
        # Extract current skills
        resume_skills_tuples = JobMatchEngine._extract_resume_skills(resume_data)
        current_normalized = {SkillNormalizer.normalize(s[0]): s[0] for s in resume_skills_tuples}
        
        # Aggregate demand
        demand_agg = SkillGapEngine._aggregate_skills(jobs_data)
        
        missing_gaps = []
        req_missing = []
        pref_missing = []
        
        for norm_skill, stats in demand_agg.items():
            if norm_skill not in current_normalized:
                priority = (stats["required"] * 2) + stats["preferred"]
                item = SkillGapItem(
                    skill=stats["display"],
                    priority=priority,
                    demand_count=stats["jobs"],
                    required_count=stats["required"],
                    preferred_count=stats["preferred"],
                    related_jobs=stats["jobs"],
                    reason=f"Appears in {stats['jobs']} retrieved jobs ({stats['required']} required).",
                    learning_action=SkillGapEngine._generate_learning_action(stats["display"], stats["jobs"])
                )
                missing_gaps.append(item)
                if stats["required"] > 0:
                    req_missing.append(stats["display"])
                elif stats["preferred"] > 0:
                    pref_missing.append(stats["display"])
                    
        # Sort by priority
        missing_gaps.sort(key=lambda x: x.priority, reverse=True)
        top_priorities = [g.skill for g in missing_gaps[:3]]
        
        # Role recommendations (Naive deterministic role match based on titles)
        titles = SkillGapEngine._extract_titles(jobs_data)
        title_counts = {}
        for t in titles:
            title_counts[t] = title_counts.get(t, 0) + 1
            
        sorted_titles = sorted(title_counts.items(), key=lambda x: x[1], reverse=True)
        
        recommendations = []
        for title, count in sorted_titles[:3]:
            # Simulate a match score (dummy naive calculation for explainability)
            match_score = min(100, 50 + (count * 5) + len(current_normalized))
            reason = f"Your existing {len(current_normalized)} skills align well. '{title}' appears {count} times in the local job market."
            recommendations.append(CareerRoleRecommendation(
                role_title=title,
                match_score=match_score,
                reason=reason,
                next_skills=top_priorities
            ))
            
        roadmap = []
        if top_priorities:
            roadmap = ["Current Skills"] + top_priorities + [recommendations[0].role_title if recommendations else "Target Role"]
            
        return SkillGapResponse(
            resume_id=resume_id,
            status="success",
            current_skills=list(current_normalized.values()),
            missing_skills=[g.skill for g in missing_gaps],
            required_missing_skills=req_missing,
            preferred_missing_skills=pref_missing,
            skill_gaps=missing_gaps,
            top_priorities=top_priorities,
            career_recommendations=recommendations,
            learning_roadmap=roadmap
        )
