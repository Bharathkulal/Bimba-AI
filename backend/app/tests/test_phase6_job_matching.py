import pytest
from app.services.job_matching.job_requirement_parser import JobRequirementParser
from app.services.job_matching.skill_normalizer import SkillNormalizer
from app.services.job_matching.job_match_engine import JobMatchEngine

def test_job_requirement_parser():
    job_text = """
    We are looking for a Software Engineer.
    Required Skills:
    - Python
    - FastAPI
    - MongoDB
    Preferred Skills:
    - Docker
    - AWS
    Experience: 3+ years of experience
    Must have a Bachelor's degree in Computer Science.
    """
    parsed = JobRequirementParser.parse(job_text)
    assert "python" in [s.lower() for s in parsed.required_skills]
    assert "fastapi" in [s.lower() for s in parsed.required_skills]
    assert "docker" in [s.lower() for s in parsed.preferred_skills]
    assert parsed.years_of_experience == 3

def test_skill_normalizer():
    # Aliases
    assert SkillNormalizer.normalize("ReactJS") == "react"
    assert SkillNormalizer.normalize("React.js") == "react"
    assert SkillNormalizer.normalize("Python 3") == "python"
    
    # False match protection
    assert SkillNormalizer.is_match("Java", "Java") == True
    assert SkillNormalizer.is_match("Java", "JavaScript") == False
    assert SkillNormalizer.is_match("React", "React Native") == False
    assert SkillNormalizer.is_match("React", "ReactJS") == True

def test_job_matching():
    job_text = """
    Required Skills:
    - Python
    - FastAPI
    - MongoDB
    Preferred Skills:
    - Docker
    - AWS
    Experience: 3 years experience
    Education: Bachelor's degree
    """
    job_reqs = JobRequirementParser.parse(job_text)
    
    resume_data = {
        "technical_skills": ["Python", "FastAPI", "MongoDB"],
        "experience": [
            {"duration": "2 years", "description": "Python dev"},
            {"duration": "1 year", "description": "FastAPI dev"}
        ],
        "education": [{"degree": "Bachelor of Science in CS"}]
    }
    
    # Perfect match for required skills
    match_result = JobMatchEngine.match(resume_data, job_reqs)
    
    # required (40%) + exp (66% of 20 = 13.2) + edu (15%) + cert (10%) = 78%
    # No preferred skills matched (0 of 15%)
    assert match_result.overall_match_score == 78
    assert match_result.required_skill_match == 100
    assert match_result.preferred_skill_match == 0
    assert "docker" in [s.lower() for s in match_result.missing_preferred_skills]
    
    # Determinism
    match_result2 = JobMatchEngine.match(resume_data, job_reqs)
    assert match_result.overall_match_score == match_result2.overall_match_score

def test_zero_data_loss():
    job_reqs = JobRequirementParser.parse("Required: Python")
    resume_data = {"skills": ["Python"]}
    resume_data_copy = dict(resume_data)
    JobMatchEngine.match(resume_data, job_reqs)
    # Ensure resume_data was not mutated
    assert resume_data == resume_data_copy
