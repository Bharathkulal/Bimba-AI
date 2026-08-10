import pytest
import re
from app.services.resume_extraction_service import extract_structured_data

def test_multi_page_resume_extraction():
    sample_resume = (
        "Jane Doe\n"
        "Email: jane.doe@example.com | Phone: +1 555-0199 | Location: Seattle\n"
        "--- PAGE 1 ---\n"
        "Objective\n"
        "To obtain a challenging position as a software development engineer.\n"
        "Technical Skill Set\n"
        "- Languages: Python, C++, SQL, Go\n"
        "- Frameworks: React, FastAPI, Node.js\n"
        "- Databases: PostgreSQL, MongoDB\n"
        "--- PAGE 2 ---\n"
        "Educational Qualifications and Trainings\n"
        "<TABLE>\n"
        "<TR-HEADER> Course | Institution | Percentage | Year </TR-HEADER>\n"
        "<TR> B.Tech CSE | Seattle University | 90% | 2025 </TR>\n"
        "<TR> High School | Seattle Prep | 95% | 2021 </TR>\n"
        "</TABLE>\n"
        "Internship\n"
        "Intern at TechSoft (June 2024 - August 2024) - Worked on python tools.\n"
        "Awards and Achievements\n"
        "- First Place in Seattle Hackathon 2024\n"
        "- Dean's List 2022, 2023\n"
        "Work Experience\n"
        "Software Developer at DevCorp (September 2024 - Present) - Developed scalable cloud components.\n"
        "--- PAGE 3 ---\n"
        "Certifications and Online Courses\n"
        "AWS Certified Cloud Practitioner by Amazon Web Services\n"
        "FastAPI Advanced Course by Udemy\n"
        "Projects and Research\n"
        "- CloudStore (FastAPI, React): Developed a microservices e-commerce application.\n"
        "- DataPipeline (Python, Go): Built a streaming data processor.\n"
        "Personal Details\n"
        "- Date of Birth: January 1, 2002\n"
        "- Gender: Female\n"
        "- Nationality: American\n"
    )

    parsed = extract_structured_data(sample_resume)

    # 1. Assertions on target sections mapping
    assert parsed["personal_info"]["name"] == "Jane Doe"
    assert parsed["personal_info"]["email"] == "jane.doe@example.com"
    assert parsed["personal_info"]["phone"] == "+1 555-0199"
    assert parsed["personal_info"]["address"] == "Seattle"

    # Objective
    assert parsed["objective"].strip() != ""
    assert "software development engineer" in parsed["objective"].lower()

    # Technical Skills
    assert len(parsed["technicalSkills"]) > 0
    assert "Python" in parsed["technicalSkills"]
    assert "FastAPI" in parsed["technicalSkills"]

    # Education table extraction
    assert len(parsed["education"]) >= 2
    edu0 = parsed["education"][0]
    assert "Seattle University" in edu0["institution"]
    assert "B.Tech CSE" in edu0["degree"]
    assert "2025" in edu0["year"]
    assert "90%" in edu0["cgpa_percentage"]

    # Internship
    assert len(parsed["internships"]) >= 1

    # Achievements / Awards
    assert len(parsed["achievements"]) >= 1
    assert "Seattle Hackathon 2024" in parsed["achievements"][0]

    # Experience
    assert len(parsed["experience"]) >= 1
    assert parsed["experience"][0]["company"] == "DevCorp"

    # Certifications
    assert len(parsed["certifications"]) >= 2
    assert parsed["certifications"][0]["name"] == "AWS Certified Cloud Practitioner"
    assert parsed["certifications"][0]["organization"] == "Amazon Web Services"

    # Projects
    assert len(parsed["projects"]) >= 2
    assert parsed["projects"][0]["title"] == "CloudStore"

    # Custom sections (e.g. Personal Details)
    assert len(parsed["custom_sections"]) >= 1
    custom_names = [cs["section_name"].lower() for cs in parsed["custom_sections"]]
    assert "personal details" in custom_names

    # 2. Assert no page boundary markers leak into any text field in JSON
    def check_no_page_leaks(val):
        if isinstance(val, str):
            assert not re.search(r'--- PAGE \d+ ---', val), f"Leaked page marker in string: {val}"
        elif isinstance(val, list):
            for item in val:
                check_no_page_leaks(item)
        elif isinstance(val, dict):
            for k, v in val.items():
                check_no_page_leaks(v)

    check_no_page_leaks(parsed)
