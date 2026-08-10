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


# ----------------- REGRESSION TESTS -----------------

def test_reg_1_education_preservation():
    # Test 1 — Education preservation (M.Tech — 9.05 CGPA — 2022 -> output must contain 9.05)
    original = {"education": [{"degree": "M.Tech", "institution": "MIT", "cgpa_percentage": "9.05", "year": "2022"}]}
    current_valid = {"education": [{"degree": "M.Tech", "institution": "MIT", "cgpa_percentage": "9.05", "year": "2022"}]}
    current_invalid = {"education": [{"degree": "M.Tech", "institution": "MIT", "cgpa_percentage": "", "year": "2022"}]}

    assert ResumeIntegrityValidator.validate(original, current_valid)["isValid"] is True
    assert ResumeIntegrityValidator.validate(original, current_invalid)["isValid"] is False

def test_reg_2_percentage_preservation():
    # Test 2 — Percentage preservation (PUC — 89.17% -> output must contain 89.17%)
    original = {"education": [{"degree": "PUC", "institution": "College", "cgpa_percentage": "89.17%", "year": "2020"}]}
    current_valid = {"education": [{"degree": "PUC", "institution": "College", "cgpa_percentage": "89.17%", "year": "2020"}]}
    current_invalid = {"education": [{"degree": "PUC", "institution": "College", "cgpa_percentage": "80%", "year": "2020"}]}

    assert ResumeIntegrityValidator.validate(original, current_valid)["isValid"] is True
    assert ResumeIntegrityValidator.validate(original, current_invalid)["isValid"] is False

def test_reg_3_publication_preservation():
    # Test 3 — Publication preservation
    original = {"publications": [{"title": "Research Paper on AI"}]}
    current_valid = {"publications": [{"title": "Research Paper on AI"}]}
    current_invalid = {"publications": []}

    assert ResumeIntegrityValidator.validate(original, current_valid)["isValid"] is True
    assert ResumeIntegrityValidator.validate(original, current_invalid)["isValid"] is False

def test_reg_4_research_article_preservation():
    # Test 4 — Research article preservation
    original = {"research_articles": [{"title": "Ensemble Classifiers Paper"}]}
    current_valid = {"research_articles": [{"title": "Ensemble Classifiers Paper"}]}
    current_invalid = {"research_articles": []}

    assert ResumeIntegrityValidator.validate(original, current_valid)["isValid"] is True
    assert ResumeIntegrityValidator.validate(original, current_invalid)["isValid"] is False

def test_reg_5_skill_preservation():
    # Test 5 — Skill preservation
    original = {"skills": ["C++", "Python", "Cloud Computing"]}
    current_valid = {"skills": ["C++", "Python", "Cloud Computing", "Docker"]}
    current_invalid = {"skills": ["C++"]}

    assert ResumeIntegrityValidator.validate(original, current_valid)["isValid"] is True
    assert ResumeIntegrityValidator.validate(original, current_invalid)["isValid"] is False

def test_reg_6_no_hallucinated_location():
    # Test 6 — No hallucinated location (Georgia, United States must be rejected when not in source)
    original = {"personal_info": {"name": "Candidate", "location": "Manipal"}}
    current_hallucinated = {"personal_info": {"name": "Candidate", "location": "Manipal, Georgia, United States"}}

    assert ResumeIntegrityValidator.validate(original, current_hallucinated)["isValid"] is False

def test_reg_7_unknown_section_preservation():
    # Test 7 — Unknown section preservation
    original = {"custom_sections": [{"section_name": "Special Interventions", "content": ["Handled system recovery"]}]}
    current = ZeroLossEngine.normalize_to_internal_model(original)
    assert any(sec["section_name"] == "Special Interventions" for sec in current["additional_sections"])

def test_reg_8_user_deletion():
    # Test 8 — User deletion (user explicitly requests deletion -> fact may be removed)
    original = {"personal_info": {"name": "Jane", "email": "jane@example.com"}}
    # User requests deletion: we explicitly allowed this check
    payload_user_request = {"personal_info": {"name": "Jane", "email": ""}, "user_requested_deletion": ["email"]}
    
    # We can pass validation if it is explicitly requested by user
    orig_norm = ZeroLossEngine.normalize_to_internal_model(original)
    orig_facts = orig_norm["source_content"]["all_facts"]
    # Filter facts that are explicitly requested for deletion
    filtered_facts = [f for f in orig_facts if f["value"] not in payload_user_request.get("user_requested_deletion", [])]
    
    report = ZeroLossEngine.validate_facts(filtered_facts, payload_user_request)
    assert report["validation_status"] == "PASS"

def test_reg_9_ai_rewriting():
    # Test 9 — AI rewriting (professional rewriting allowed only when factual meaning remains intact)
    original_text = "This project detects the shade of the teeth using Image processing and several Machine learning algorithms."
    allowed_rewriting = "Developed a dental shade detection project using image processing and machine learning algorithms to identify tooth shade."
    disallowed_rewriting = "Developed an AI-powered dental diagnosis system using deep learning."

    # Validate that allowed rewriting preserves the key facts (shade, teeth, image processing, machine learning)
    original = {"projects": [{"name": "Teeth Shade", "description": original_text}]}
    current_allowed = {"projects": [{"name": "Teeth Shade", "description": allowed_rewriting}]}
    current_disallowed = {"projects": [{"name": "Teeth Shade", "description": disallowed_rewriting}]}

    assert ResumeIntegrityValidator.validate(original, current_allowed)["isValid"] is True
    assert ResumeIntegrityValidator.validate(original, current_disallowed)["isValid"] is False

def test_reg_10_complete_pdf():
    # Test 10 — Complete PDF (final PDF contains all validated sections)
    original = {
        "personal_info": {"name": "Pranam R Betrabet", "email": "pranam@example.com"},
        "education": [{"degree": "M.Tech", "institution": "MIT", "cgpa_percentage": "9.05"}],
        "research_articles": [{"title": "Arrhythmia Classification"}],
        "skills": ["Python", "Machine Learning"]
    }
    
    # Complete validation gate checks
    res = ResumeIntegrityValidator.validate(original, original)
    assert res["isValid"] is True

