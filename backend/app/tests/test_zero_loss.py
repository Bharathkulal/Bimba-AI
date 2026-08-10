import pytest
from app.services.zero_loss_engine import ZeroLossEngine
from app.services.integrity_validator import ResumeIntegrityValidator

def test_zero_loss_normalization():
    raw_data = {
        "personal_info": {
            "name": "Jane Doe",
            "email": "jane@example.com",
            "phone": "9876543210",
            "location": "Mangalore"
        },
        "summary": "AI researcher specializing in Computer Vision.",
        "education": [
            {
                "institution": "Manipal Institute of Technology",
                "degree": "M.Tech",
                "passing_year": "2022",
                "cgpa_percentage": "9.05"
            }
        ],
        "skills": ["Python", "PyTorch", "OpenCV"],
        "experience": [
            {
                "company": "Bimba AI Labs",
                "position": "Research Engineer",
                "duration": "2022-Present",
                "description": "Authored two research papers."
            }
        ]
    }

    norm = ZeroLossEngine.normalize_to_internal_model(raw_data)
    assert norm["personal_information"]["name"] == "Jane Doe"
    assert norm["contact_information"]["email"] == "jane@example.com"
    assert len(norm["education"]) == 1
    assert norm["education"][0]["cgpa_percentage"] == "9.05"

    facts = norm["source_content"]["all_facts"]
    assert len(facts) > 0
    
    # Check that critical facts exist in registry
    fact_values = [f["value"] for f in facts]
    assert "Jane Doe" in fact_values
    assert "9.05" in fact_values
    assert "Bimba AI Labs" in fact_values

def test_zero_loss_validation_pass():
    original = {
        "personal_info": {
            "name": "Jane Doe",
            "email": "jane@example.com"
        },
        "education": [
            {
                "institution": "MIT",
                "degree": "M.Tech",
                "cgpa_percentage": "9.05"
            }
        ],
        "skills": ["Python"]
    }

    # Enhanced version preserves all facts but changes layout/wording
    enhanced = {
        "personal_info": {
            "name": "Jane Doe",
            "email": "jane@example.com"
        },
        "education": [
            {
                "institution": "MIT",
                "degree": "Master of Technology (M.Tech)",
                "cgpa_percentage": "9.05"
            }
        ],
        "skills": ["Python", "FastAPI"]  # Added skill, none dropped
    }

    res = ResumeIntegrityValidator.validate(original, enhanced)
    assert res["isValid"] is True

def test_zero_loss_validation_fail_missing_fact():
    original = {
        "personal_info": {
            "name": "Jane Doe",
            "email": "jane@example.com"
        },
        "education": [
            {
                "institution": "MIT",
                "degree": "M.Tech",
                "cgpa_percentage": "9.05"
            }
        ]
    }

    # Dropped CGPA in current version
    current = {
        "personal_info": {
            "name": "Jane Doe",
            "email": "jane@example.com"
        },
        "education": [
            {
                "institution": "MIT",
                "degree": "M.Tech",
                "cgpa_percentage": ""
            }
        ]
    }

    res = ResumeIntegrityValidator.validate(original, current)
    assert res["isValid"] is False
    assert any("Fact dropped or modified: '9.05'" in e for e in res["errors"])
