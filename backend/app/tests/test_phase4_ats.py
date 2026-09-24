import pytest
from app.services.ats.ats_engine import ATSEngine
from app.services.ats.job_description_parser import JobDescriptionParser

@pytest.fixture
def golden_resume():
    return {
        "personal_info": {
            "name": "Rahul Sharma",
            "email": "rahul@example.com"
        },
        "education": [
            {
                "degree": "Bachelor of Computer Applications",
                "institution": "Dr. B.B. Hegde College",
                "year": "2024"
            }
        ],
        "skills": [
            "Python",
            "FastAPI",
            "MongoDB",
            "React",
            "Git"
        ],
        "projects": [
            {
                "title": "Resume Platform",
                "tech_stack": "React, FastAPI, MongoDB",
                "description": "Built a React-based placement dashboard that reduced manual tracking by 20%."
            }
        ],
        "experience": [
            {
                "company": "ABC Technologies",
                "position": "Software Intern",
                "duration": "January 2024 - Present",
                "description": "Developed backend APIs."
            }
        ],
        "certifications": [
            {
                "name": "Python Certification",
                "issuer": "Coursera"
            }
        ],
        "languages": [
            "English",
            "Hindi"
        ]
    }

def test_ats_engine_golden_case(golden_resume):
    # Same input must equal same score (deterministic)
    raw_text = "Rahul Sharma rahul@example.com Python FastAPI React ABC Technologies Software Intern Built placement dashboard 20% improve."
    
    analysis1 = ATSEngine.analyze_resume(golden_resume, raw_text=raw_text)
    analysis2 = ATSEngine.analyze_resume(golden_resume, raw_text=raw_text)
    
    assert analysis1["score"] == analysis2["score"], "ATS engine is not deterministic."
    
    assert 0 <= analysis1["score"] <= 100, "ATS score out of bounds."
    
    breakdown = analysis1["breakdown"]
    assert breakdown["completeness"] > 50
    assert breakdown["skills"] > 0
    assert breakdown["experience"] > 50
    assert breakdown["projects"] > 50
    
def test_student_resume_no_experience():
    resume = {
        "personal_info": {"name": "Student", "email": "s@s.com"},
        "education": [{"degree": "B.Tech"}],
        "projects": [{"title": "Project", "description": "Good project"}]
    }
    analysis = ATSEngine.analyze_resume(resume, "")
    # Should not be 0 since projects exist
    assert analysis["breakdown"]["experience"] >= 0
    # Suggestions should mention projects making up for experience
    assert any("projects" in s.lower() for s in analysis["suggestions"])

def test_job_description_parser():
    jd = "Software Engineer\n3+ years experience\nRequired: Python, React, AWS\nDegree in Computer Science"
    parsed = JobDescriptionParser.parse(jd)
    assert parsed["job_title"].lower() == "software engineer"
    assert "3+ years" in parsed["experience_requirements"]
