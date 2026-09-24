import pytest
from app.services.resume_pipeline.parsers.education_parser import EducationParser
from app.services.resume_pipeline.parsers.experience_parser import ExperienceParser
from app.services.resume_pipeline.parsers.project_parser import ProjectParser
from app.services.resume_pipeline.parsers.personal_details_parser import PersonalDetailsParser
from app.services.resume_pipeline.parsers.skills_parser import SkillsParser
from app.services.resume_pipeline.section_detector import SectionDetector
from app.services.local_resume_extraction.extractor import enhance_with_spacy

def test_section_detector():
    lines = [
        "John Doe",
        "john.doe@example.com",
        "",
        "WORK EXPERIENCE",
        "Google",
        "Software Engineer",
        "Jan 2020 - Present",
        "",
        "EDUCATION",
        "Massachusetts Institute of Technology",
        "B.S. Computer Science",
        "",
        "SKILLS",
        "Python",
        "Java"
    ]
    sections = SectionDetector.partition_into_sections(lines)
    assert "Google" in sections["experience"]
    assert "Massachusetts Institute of Technology" in sections["education"]
    assert "Python" in sections["technical_skills"]

def test_education_parser():
    lines = [
        "Bachelor of Computer Applications",
        "Dr. B.B. Hegde First Grade College",
        "Kundapura",
        "2024 - 2028",
        "CGPA: 8.2"
    ]
    edu = EducationParser.parse(lines)
    assert len(edu) == 1
    assert "Bachelor of Computer Applications" in edu[0]["degree"]
    assert "8.2" in edu[0]["score"]
    assert "2024" in edu[0]["passing_year"]

def test_experience_parser():
    lines = [
        "Software Engineer at Google",
        "January 2025 - Present",
        "• Built web apps."
    ]
    exp = ExperienceParser.parse(lines)
    assert len(exp) > 0
    assert "January 2025 - Present" in str(exp)

def test_skills_parser():
    lines = [
        "Programming: Python, Java, JavaScript",
        "Tools: Docker, Kubernetes"
    ]
    skills = SkillsParser.parse(lines)
    flat_skills = [s.lower() for s in skills.get("flat", [])]
    
    assert "python" in flat_skills
    assert "java" in flat_skills
    assert "javascript" in flat_skills
    assert "docker" in flat_skills
    assert "kubernetes" in flat_skills

def test_spacy_name_enhancement():
    raw_text = "Alice Smith\nalice@example.com\n555-1234\nSUMMARY\nGreat developer."
    parsed = {"personal_info": {"name": "Candidate Name", "email": "alice@example.com"}}
    enhanced = enhance_with_spacy(raw_text, parsed)
    assert enhanced["personal_info"]["name"] == "Alice Smith"
