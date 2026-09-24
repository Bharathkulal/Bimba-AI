import re
from typing import Dict, Any, List, Tuple
from app.services.job_matching.models import JobMatchResult, MatchedSkill, SkillEvidence, ParsedJobRequirements
from app.services.job_matching.skill_normalizer import SkillNormalizer
from app.services.job_matching.job_requirement_parser import JobRequirementParser
from app.services.job_matching.skill_gap_analyzer import SkillGapAnalyzer
from app.services.job_matching.recommendation_engine import RecommendationEngine

class JobMatchEngine:
    MATCH_CONFIG = {
        "required_skills": 40,
        "preferred_skills": 15,
        "experience": 20,
        "education": 15,
        "certifications": 10
    }

    @staticmethod
    def _extract_resume_skills(resume_data: Dict[str, Any]) -> List[Tuple[str, str]]:
        """
        Extracts skills from ResumeData and associates them with their source section.
        Returns List of (skill_string, source_section)
        """
        extracted = []
        
        # Explicit Skills Section
        skills_raw = resume_data.get("technical_skills", resume_data.get("skills", []))
        if isinstance(skills_raw, dict):
            flat = skills_raw.get("flat", [])
            for s in flat:
                if isinstance(s, str):
                    extracted.append((s, "technical_skills"))
        elif isinstance(skills_raw, list):
            for s in skills_raw:
                if isinstance(s, dict) and "skills" in s:
                    for sub_s in s.get("skills", []):
                        if isinstance(sub_s, str):
                            extracted.append((sub_s, "technical_skills"))
                elif isinstance(s, str):
                    extracted.append((s, "technical_skills"))
                    
        # Projects Section
        for proj in resume_data.get("projects", []):
            if isinstance(proj, dict):
                desc = proj.get("description", "")
                tech = proj.get("technologies", proj.get("tech_stack", ""))
                if isinstance(tech, list):
                    for t in tech: extracted.append((str(t), "projects"))
                elif isinstance(tech, str) and tech:
                    # Naive split by comma
                    for t in tech.split(","): extracted.append((t.strip(), "projects"))
                if desc:
                    extracted.append((desc, "projects_description")) # Store full description for substring match
                    
        # Experience Section
        for exp in resume_data.get("experience", resume_data.get("work_experience", [])):
            if isinstance(exp, dict):
                desc = exp.get("description", "")
                if desc:
                    extracted.append((desc, "experience"))
                for resp in exp.get("responsibilities", []):
                    extracted.append((resp, "experience"))
                    
        return extracted

    @staticmethod
    def match(resume_data: Dict[str, Any], job_reqs: ParsedJobRequirements) -> JobMatchResult:
        result = JobMatchResult(
            overall_match_score=0,
            required_skill_match=0,
            preferred_skill_match=0,
            experience_match=0,
            education_match=0,
            certification_match=0
        )
        
        resume_skills_raw = JobMatchEngine._extract_resume_skills(resume_data)
        
        # 1. Skill Matching
        def match_skill_list(required_list: List[str]) -> Tuple[int, List[MatchedSkill], List[str]]:
            if not required_list:
                return 100, [], []
                
            matched = []
            missing = []
            match_count = 0
            
            for req in required_list:
                is_matched = False
                evidences = []
                for (can_skill, source) in resume_skills_raw:
                    if SkillNormalizer.is_match(req, can_skill):
                        is_matched = True
                        evidences.append(SkillEvidence(source=source, text=can_skill[:50] + ("..." if len(can_skill) > 50 else "")))
                        
                if is_matched:
                    match_count += 1
                    # Deduplicate evidences by source
                    unique_evidences = {e.source: e for e in evidences}.values()
                    matched.append(MatchedSkill(skill=req, matched=True, evidence=list(unique_evidences)))
                else:
                    missing.append(req)
                    
            score = int((match_count / len(required_list)) * 100)
            return score, matched, missing

        req_score, req_matched, req_missing = match_skill_list(job_reqs.required_skills)
        pref_score, pref_matched, pref_missing = match_skill_list(job_reqs.preferred_skills)
        
        result.required_skill_match = req_score
        result.preferred_skill_match = pref_score
        result.matched_skills = req_matched + pref_matched
        result.missing_required_skills = req_missing
        result.missing_preferred_skills = pref_missing
        
        # 2. Experience Matching (Naive implementation for determinism)
        resume_exp_years = 0
        for exp in resume_data.get("experience", resume_data.get("work_experience", [])):
            if isinstance(exp, dict) and exp.get("duration"):
                # Very naive: assume each entry is ~1 year if duration is present unless it says "months"
                if "month" not in str(exp.get("duration", "")).lower():
                    resume_exp_years += 1
                    
        if job_reqs.years_of_experience > 0:
            if resume_exp_years >= job_reqs.years_of_experience:
                result.experience_match = 100
            else:
                result.experience_match = int((resume_exp_years / job_reqs.years_of_experience) * 100)
        else:
            result.experience_match = 100 # No strict requirement
            
        # 3. Education Matching
        result.education_match = 100
        if job_reqs.required_education:
            edu_score = 0
            resume_edus = resume_data.get("education", [])
            has_degree = False
            for edu in resume_edus:
                if isinstance(edu, dict):
                    deg = str(edu.get("degree", "")).lower()
                    if "bachelor" in deg or "master" in deg or "b." in deg or "m." in deg or "bca" in deg or "mca" in deg or "btech" in deg or "mtech" in deg:
                        has_degree = True
                        break
            if has_degree:
                edu_score = 100
            result.education_match = edu_score
            if edu_score == 0:
                result.warnings.append("Missing required education degree.")
                
        # 4. Certifications
        result.certification_match = 100 # Defaults to 100 if no requirement
        
        # 5. Overall Score Calculation
        overall = 0.0
        overall += (result.required_skill_match * JobMatchEngine.MATCH_CONFIG["required_skills"]) / 100.0
        overall += (result.preferred_skill_match * JobMatchEngine.MATCH_CONFIG["preferred_skills"]) / 100.0
        overall += (result.experience_match * JobMatchEngine.MATCH_CONFIG["experience"]) / 100.0
        overall += (result.education_match * JobMatchEngine.MATCH_CONFIG["education"]) / 100.0
        overall += (result.certification_match * JobMatchEngine.MATCH_CONFIG["certifications"]) / 100.0
        
        result.overall_match_score = max(0, min(100, int(round(overall))))
        
        # 6. Gap Analysis & Recommendations
        result.skill_gaps = SkillGapAnalyzer.analyze(req_missing, pref_missing, result.matched_skills)
        result.recommendations = RecommendationEngine.generate(result.skill_gaps, job_reqs)
        
        return result
