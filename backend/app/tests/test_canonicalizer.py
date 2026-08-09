from app.services.resume_canonicalizer import canonicalize_parsed_data


def test_move_education_like_from_certifications():
    parsed = {
        "certifications": [
            {"institution": "Univ X", "degree": "B.Sc"},
            {"name": "AWS Cert", "organization": "Amazon"}
        ],
        "education": []
    }
    out = canonicalize_parsed_data(parsed)
    assert len(out["education"]) == 1
    assert out["education"][0]["institution"] == "Univ X"
    assert len(out["certifications"]) == 1
    assert out["certifications"][0]["name"] == "AWS Cert"


def test_move_certification_like_from_education():
    parsed = {
        "education": [
            {"name": "Coursera Course", "organization": "Coursera"},
            {"institution": "Univ Y", "degree": "M.Tech"}
        ],
        "certifications": []
    }
    out = canonicalize_parsed_data(parsed)
    assert len(out["certifications"]) == 1
    assert out["certifications"][0]["organization"] == "Coursera"
    assert len(out["education"]) == 1


def test_experience_project_disambiguation_and_unclassified():
    parsed = {
        "experience": [
            {"company": "ACME", "position": "Engineer"},
            {"title": "Cool Project", "tech_stack": "React"}
        ],
        "projects": ["Just a string project"]
    }
    out = canonicalize_parsed_data(parsed)
    # Project-like item moved from experience into projects
    assert any((isinstance(p, dict) and p.get("tech_stack") == "React") for p in out["projects"]) 
    # string project moved to unclassified_content
    assert any(isinstance(x, str) for x in out["unclassified_content"]) 
