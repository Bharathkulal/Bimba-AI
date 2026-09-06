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
    assert len(out["certifications"]) == 2
    assert out["certifications"][1]["name"] == "AWS Cert"


def test_move_certification_like_from_education():
    parsed = {
        "education": [
            {"name": "Coursera Course", "organization": "Coursera"},
            {"institution": "Univ Y", "degree": "M.Tech"}
        ],
        "certifications": []
    }
    out = canonicalize_parsed_data(parsed)
    assert len(out["education"]) == 2
    assert out["education"][1]["institution"] == "Univ Y"


def test_experience_project_disambiguation_and_unclassified():
    parsed = {
        "experience": [
            {"company": "ACME", "position": "Engineer"},
            {"title": "Cool Project", "tech_stack": "React"}
        ],
        "projects": ["Just a string project"]
    }
    out = canonicalize_parsed_data(parsed)
    # Experience and projects preserved non-destructively
    assert len(out["experience"]) == 2
    assert len(out["projects"]) == 1
    assert out["experience"][0]["company"] == "ACME" 
