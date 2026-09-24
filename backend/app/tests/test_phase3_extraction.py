import pytest
from app.services.local_resume_extraction.extractor import enhance_with_spacy, extract_structured_data

def test_local_pipeline_e2e():
    raw_text = """
John Doe
Software Engineer
john.doe@example.com | 555-1234
    
SUMMARY
Experienced software engineer with 5 years of Python development.

EXPERIENCE
Google
Software Engineer
Jan 2020 - Present
- Built scalable web applications using Python and React.

EDUCATION
B.S. in Computer Science
MIT
2015 - 2019

SKILLS
Python, React, AWS
"""
    
    # 1. Base Structured Extraction
    base_extracted = extract_structured_data(raw_text)
    
    # 2. Enhance with spaCy
    enhanced = enhance_with_spacy(raw_text, base_extracted)
    
    # Assertions
    pi = enhanced.get("personal_info", {})
    assert "John Doe" in pi.get("name", "")
    assert "john.doe@example.com" in pi.get("email", "")
    
    # Check experience
    exp = enhanced.get("experience", [])
    assert len(exp) > 0
    assert "Google" in str(exp[0])
    
    # Check education
    edu = enhanced.get("education", [])
    assert len(edu) > 0
    
    # Check skills
    skills = enhanced.get("skills", [])
    assert "Python" in skills
    assert "React" in skills
