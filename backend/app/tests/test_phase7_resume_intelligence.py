import pytest
import json
import copy
from app.services.resume_intelligence.resume_intelligence_engine import ResumeIntelligenceEngine

def get_sample_resume():
    return {
        "personal_info": {
            "name": "Jane Doe",
            "email": "jane@example.com",
            "phone": "1234567890",
            "linkedin": ""
        },
        "summary": "I am a hardworking team player looking for a job.",
        "skills": ["Python", "FastAPI", "React", "AWS"],
        "experience": [
            {
                "company": "Tech Corp",
                "role": "Developer",
                "description": "Worked on backend. Improved performance.",
                "responsibilities": ["Wrote code", "Did testing"]
            }
        ],
        "projects": [
            {
                "title": "My Project",
                "description": "A python web app with FastAPI and React. Increased users by 40%.",
                "technologies": ["Python", "React"]
            }
        ],
        "education": [
            {
                "degree": "B.Tech",
                "institution": "University"
            }
        ]
    }

def test_completeness_and_health_score():
    resume = get_sample_resume()
    report = ResumeIntelligenceEngine.analyze(resume)
    
    assert report.section_analysis["personal_info"].status == "complete"
    assert report.section_analysis["education"].status == "present"
    assert report.section_analysis["experience"].status == "present"
    
    assert report.resume_health_score > 0
    assert report.resume_health_score <= 100

def test_content_quality():
    resume = get_sample_resume()
    report = ResumeIntelligenceEngine.analyze(resume)
    
    issues = [i for i in report.issues if i.section == "experience"]
    # "Worked on backend" uses weak verb
    assert any(i.issue_type == "too_short" or i.issue_type == "weak_action_verbs" for i in issues)
    
    summary_issues = [i for i in report.issues if i.section == "summary"]
    assert any(i.issue_type == "cliche_language" for i in summary_issues)

def test_achievement_detection():
    resume = get_sample_resume()
    report = ResumeIntelligenceEngine.analyze(resume)
    
    # Project has "40%"
    proj_issues = [i for i in report.issues if i.section == "projects" and i.issue_type == "no_metrics"]
    assert len(proj_issues) == 0
    
    # Experience has no metrics
    exp_issues = [i for i in report.issues if i.section == "experience" and i.issue_type == "no_metrics"]
    assert len(exp_issues) > 0

def test_evidence_gap():
    resume = get_sample_resume()
    report = ResumeIntelligenceEngine.analyze(resume)
    
    # AWS has no evidence
    assert "AWS" in report.evidence_analysis.skills_without_evidence
    # Python has evidence in project
    assert "Python" in report.evidence_analysis.skills_with_evidence

def test_job_specific_analysis():
    resume = get_sample_resume()
    job_desc = """
    Required Skills:
    - Python
    - FastAPI
    - Docker
    """
    
    report = ResumeIntelligenceEngine.analyze(resume, job_description=job_desc)
    
    recs = report.recommendations
    job_recs = [r for r in recs if r.category == "job_match"]
    assert len(job_recs) > 0
    assert "docker" in job_recs[0].message.lower()

def test_determinism_and_zero_loss():
    resume = get_sample_resume()
    original_resume = copy.deepcopy(resume)
    
    report1 = ResumeIntelligenceEngine.analyze(resume)
    report2 = ResumeIntelligenceEngine.analyze(resume)
    
    # Determinism
    assert report1.resume_health_score == report2.resume_health_score
    assert len(report1.issues) == len(report2.issues)
    
    # Zero loss
    assert resume == original_resume
