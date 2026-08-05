import pytest
import io
from app.services.layered_extractor import LayeredExtractor
from app.services.resume_extraction_service import extract_structured_data, calculate_section_confidence
from app.api.v1.resumes.resumes_routes import improve_and_validate_resume
from app.services.integrity_validator import ResumeIntegrityValidator
from app.services.pdf_validator import PDFValidator

# ----------------- LAYERED EXTRACTOR & OCR TESTS -----------------

def test_layered_extractor_txt_file():
    content = b"Candidate Name\nEmail: candidate@test.com\nPython, FastAPI\nEducation: BCA"
    result = LayeredExtractor.extract_text(content, "resume.txt")
    assert result["pages"] == 1
    assert "candidate@test.com" in result["text"]
    assert result["method"] == "raw_text"
    assert result["confidence"] == 1.0

def test_layered_extractor_unsupported_type():
    with pytest.raises(Exception):
        LayeredExtractor.extract_text(b"content", "resume.exe")

def test_layered_extractor_empty_bytes():
    result = LayeredExtractor.extract_text(b"", "resume.txt")
    assert result["text"] == ""
    assert result["confidence"] == 1.0

# ----------------- SECTION CONFIDENCE ENGINE TESTS -----------------

def test_calculate_section_confidence_full():
    data = {
        "personal_info": { "name": "John Doe", "email": "john.doe@example.com", "phone": "1234567890", "address": "Udupi" },
        "summary": "Detail-oriented software engineer.",
        "education": [{"institution": "Bimba University", "degree": "B.Tech", "passing_year": "2026"}],
        "experience": [{"company": "Acme Corp", "position": "Software Engineer", "duration": "2 years"}],
        "projects": [{"name": "Placement Portal", "description": "Developed full system."}],
        "technicalSkills": ["Python", "FastAPI", "React"],
        "softSkills": ["Leadership"]
    }
    confidence = calculate_section_confidence(data)
    assert confidence["personal_info"]["score"] == 100
    assert confidence["summary"]["score"] == 100
    assert confidence["education"]["score"] == 100
    assert confidence["experience"]["score"] == 100
    assert confidence["projects"]["score"] == 100
    assert confidence["technicalSkills"]["score"] == 100

def test_calculate_section_confidence_missing_fields():
    # Deductions occur when critical fields are missing
    data = {
        "personal_info": { "name": "Candidate Name", "email": "" }, # Missing email and phone
        "summary": "",
        "education": [{"institution": "", "degree": "B.Tech"}], # Missing institution
        "experience": [{"company": "Acme Corp", "position": ""}], # Missing position
        "projects": [{"name": "", "description": ""}], # Missing all
        "technicalSkills": ["Python"] # Under 3 skills
    }
    confidence = calculate_section_confidence(data)
    assert confidence["personal_info"]["score"] < 100
    assert confidence["summary"]["score"] == 0
    assert confidence["education"]["score"] < 100
    assert confidence["experience"]["score"] < 100
    assert confidence["projects"]["score"] < 100
    assert confidence["technicalSkills"]["score"] < 100

# ----------------- HEURISTICS PARSING TESTS -----------------

def test_extract_structured_data_heuristic_mapping():
    sample_text = (
        "John Doe\n"
        "john.doe@example.com\n"
        "SUMMARY\n"
        "Detail-oriented software engineer.\n"
        "EDUCATION\n"
        "Bimba University, B.Tech, 2026\n"
        "EXPERIENCE\n"
        "Software Engineer at Acme Corp (2024-Present)\n"
        "Worked on backend APIs using FastAPI and Python.\n"
        "PROJECTS\n"
        "Placement Portal (React, Node) - Developed full system.\n"
        "TECHNICAL SKILLS\n"
        "Python, React, MongoDB, AWS, Docker\n"
        "LANGUAGES\n"
        "English, Hindi\n"
    )
    
    parsed = extract_structured_data(sample_text)
    
    keys = [
        "personal_info", "summary", "objective", "education", "experience", "projects",
        "technicalSkills", "softSkills", "certifications", "internships", "achievements",
        "languages", "portfolioLinks", "publications", "volunteerExperience", "references", "hobbies"
    ]
    for key in keys:
        assert key in parsed
        
    assert parsed["personal_info"]["email"] == "john.doe@example.com"
    assert "Python" in parsed["technicalSkills"]
    assert "English" in parsed["languages"]
    assert len(parsed["experience"]) >= 1
    assert len(parsed["projects"]) >= 1
    assert "confidence_metadata" in parsed

# ----------------- ZERO DELETION MERGE TESTS -----------------

class MockDb:
    pass

def test_improve_and_validate_resume_zero_deletion():
    original_normalized = {
        "personal_info": { "name": "John Doe", "email": "john.doe@example.com" },
        "summary": "Detail-oriented software engineer.",
        "education": [{"id": 1, "institution": "Bimba University", "degree": "B.Tech"}],
        "experience": [{"id": 2, "company": "Acme Corp", "position": "Software Engineer", "description": "Backend developer."}],
        "projects": [{"id": 3, "title": "Portal", "description": "Developed backend APIs."}],
        "skills": ["Python", "FastAPI"]
    }
    
    db = MockDb()
    result_empty = improve_and_validate_resume(
        db=db,
        prompt="Polish this resume",
        resume_id=101,
        user_id=1,
        original_normalized=original_normalized,
        roll_number="BCA25008"
    )
    
    assert len(result_empty["experience"]) == 1
    assert result_empty["experience"][0]["company"] == "Acme Corp"
    assert len(result_empty["projects"]) == 1
    assert result_empty["projects"][0]["title"] == "Portal"
    assert "Python" in result_empty["skills"]

# ----------------- INTEGRITY VALIDATOR TESTS -----------------

def test_integrity_validator_valid():
    original = {
        "education": [{"id": 1, "institution": "College"}],
        "experience": [{"id": 2, "company": "Acme"}],
        "projects": [{"id": 3, "name": "Portal"}],
        "skills": ["Python"],
        "personal_info": {"name": "John"}
    }
    current = {
        "education": [{"id": 1, "institution": "College"}],
        "experience": [{"id": 2, "company": "Acme"}],
        "projects": [{"id": 3, "name": "Portal"}],
        "skills": ["Python"],
        "personal_info": {"name": "John"}
    }
    res = ResumeIntegrityValidator.validate(original, current)
    assert res["isValid"] is True
    assert len(res["errors"]) == 0

def test_integrity_validator_item_dropped():
    original = {
        "education": [{"id": 1, "institution": "College"}],
        "experience": [{"id": 2, "company": "Acme"}],
        "projects": [{"id": 3, "name": "Portal"}],
        "skills": ["Python"],
        "personal_info": {"name": "John"}
    }
    current = {
        "education": [], # Drop education item
        "experience": [{"id": 2, "company": "Acme"}],
        "projects": [], # Drop project item
        "skills": ["Python"],
        "personal_info": {"name": ""} # Cleared personal info
    }
    res = ResumeIntegrityValidator.validate(original, current)
    assert res["isValid"] is False
    assert any("Education Nodes count dropped" in e for e in res["errors"])
    assert any("Showcase Projects count dropped" in e for e in res["errors"])
    assert any("Personal Information field 'name' was cleared." in e for e in res["errors"])

# ----------------- PDF LAYOUT VALIDATOR TESTS -----------------

def test_pdf_validator_corrupt_bytes():
    res = PDFValidator.validate_pdf_content(b"corrupt pdf data", original_page_count=1)
    assert res["isValid"] is False
    assert "corrupt" in res["errors"][0].lower()

def test_pdf_validator_empty_pages_count():
    # If len(doc) is 0
    res = PDFValidator.validate_pdf_content(b"", original_page_count=1)
    assert res["isValid"] is False
