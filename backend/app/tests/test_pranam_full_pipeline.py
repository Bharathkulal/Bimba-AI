"""
=============================================================================
REAL PDF EXTRACTION TEST: PRANAM R BETRABET ORIGINAL RESUME
=============================================================================
Uses the authentic original PDF file (SHA256: 34811ddb3bd6c53ef5b81945808d87f0b98bb191466e5df686b0916e611d0fbe).
No synthetic text. No fake contact info. No invented scores or percentiles.
Full pipeline verification:
PDF File -> PyMuPDF (Primary Extraction) -> Raw Resume Text (Source of Truth)
-> Structured Parsing -> Pydantic Validation -> ZeroLoss Registry.
"""

import os
import json
import hashlib
import pytest

from app.services.pdf_extractor import PDFExtractor
from app.services.resume_extraction_service import extract_structured_data
from app.services.zero_loss_engine import ZeroLossEngine
from app.services.integrity_validator import ResumeIntegrityValidator
from app.schemas.resume import ResumeData


REAL_PDF_PATH = os.path.join(os.path.dirname(__file__), "fixtures", "Pranam_R_Betrabet_Resume.pdf")
EXPECTED_SHA256 = "34811ddb3bd6c53ef5b81945808d87f0b98bb191466e5df686b0916e611d0fbe"


def test_real_pdf_fixture_integrity():
    """Verify that the test fixture is the authentic original PDF."""
    assert os.path.exists(REAL_PDF_PATH), f"Real PDF file not found at: {REAL_PDF_PATH}"
    with open(REAL_PDF_PATH, "rb") as f:
        pdf_bytes = f.read()
    
    sha256 = hashlib.sha256(pdf_bytes).hexdigest()
    assert sha256 == EXPECTED_SHA256, f"PDF SHA256 mismatch! Expected {EXPECTED_SHA256}, got {sha256}"
    assert len(pdf_bytes) == 5595


def test_real_pdf_pymupdf_extraction():
    """Verify PyMuPDF extraction on the authentic PDF without character truncation."""
    with open(REAL_PDF_PATH, "rb") as f:
        pdf_bytes = f.read()

    extraction_res = PDFExtractor.extract_text_from_pdf(pdf_bytes, "Pranam_R_Betrabet_Resume.pdf")

    assert extraction_res["extraction_method"] == "PyMuPDF"
    assert extraction_res["extraction_quality"] == "GOOD"
    assert extraction_res["page_count"] == 2
    assert len(extraction_res["full_text"]) > 3000

    raw_text = extraction_res["full_text"]

    # Verify actual raw text contains the authentic details
    assert "Pranam R Betrabet" in raw_text
    assert "pranamrrao@gmail.com" in raw_text
    assert "+91 7349113044" in raw_text
    assert "Shantananda" in raw_text
    assert "576213" in raw_text
    assert "9.05" in raw_text
    assert "9.31" in raw_text
    assert "89.17%" in raw_text
    assert "92.32%" in raw_text
    assert "Cleared GATE CSE in 2020" in raw_text
    assert "M Rajesh Rao" in raw_text
    assert "26-10-1998" in raw_text


def test_real_pdf_complete_structured_extraction_and_pydantic_validation():
    """Verify structured parsing, Pydantic validation, and exact entity matching against real PDF."""
    with open(REAL_PDF_PATH, "rb") as f:
        pdf_bytes = f.read()

    # 1. PyMuPDF Extraction
    extraction_res = PDFExtractor.extract_text_from_pdf(pdf_bytes, "Pranam_R_Betrabet_Resume.pdf")
    raw_text = extraction_res["full_text"]

    # 2. Structured Extraction & Normalization
    parsed = extract_structured_data(raw_text)
    normalized = ZeroLossEngine.normalize_to_internal_model(parsed)

    # 3. Pydantic Schema Validation
    validated_model = ResumeData(**normalized)
    assert validated_model is not None

    data_dump = validated_model.model_dump()
    print("\n=== REAL PDF STRUCTURED EXTRACTION OUTPUT ===")
    print(json.dumps(data_dump, indent=2, default=str))

    # 4. Contact Information Verification
    p_info = data_dump["personal_info"]
    assert p_info["name"] == "Pranam R Betrabet"
    assert p_info["email"] == "pranamrrao@gmail.com"
    assert "7349113044" in p_info["phone"]
    full_address = p_info["address"] or p_info["location"]
    assert "Shantananda" in full_address or "Brahmavar" in full_address or "576213" in full_address

    # 5. Work Experience Verification
    work_exp = data_dump["work_experience"]
    assert len(work_exp) >= 2
    exp_str = " ".join(str(w) for w in work_exp)
    assert "Senior Software Engineer" in exp_str
    assert "Assistant Professor" in exp_str
    assert "MIT, Manipal" in exp_str or "Dr. B. B. Hegde" in exp_str

    # 6. Education Verification (All 4 levels & exact scores)
    education = data_dump["education"]
    assert len(education) >= 4
    edu_str = " ".join(str(e) for e in education)
    assert "9.05" in edu_str
    assert "9.31" in edu_str
    assert "89.17" in edu_str
    assert "92.32" in edu_str

    # 7. Projects Verification (All 3 projects)
    projects = data_dump["projects"]
    assert len(projects) >= 3
    proj_titles = [p.get("title", "") or p.get("name", "") for p in projects]
    assert any("Dental Shading" in t for t in proj_titles)
    assert any("Whale Optimization" in t for t in proj_titles)
    assert any("Prediction of execution time" in t for t in proj_titles)

    # 8. Certifications Verification (All 3 SWAYAM certs)
    certifications = data_dump["certifications"]
    assert len(certifications) >= 3
    cert_str = " ".join(str(c) for c in certifications)
    assert "Big Data Computing" in cert_str
    assert "Python for Data Science" in cert_str
    assert "Quantum Computing" in cert_str

    # 9. Internships Verification (NITK Surathkal Cloud & Fog Computing)
    internships = data_dump["internships"]
    assert len(internships) >= 1
    int_str = " ".join(str(i) for i in internships)
    assert "National Institute of Technology, Surathkal" in int_str or "NITK" in int_str

    # 10. Achievements Verification (GATE CSE 2020 & AJIET Coding Event)
    achievements = data_dump["achievements"]
    assert len(achievements) >= 2
    ach_str = " ".join(str(a) for a in achievements)
    assert "Cleared GATE CSE in 2020" in ach_str
    assert "AJIET" in ach_str or "1st place in coding event" in ach_str

    # 11. Leadership Roles Verification (CSI, IEI, DSC)
    leadership = data_dump["leadership_roles"]
    assert len(leadership) >= 3
    lead_str = " ".join(str(l) for l in leadership)
    assert "CSI" in lead_str
    assert "IEI" in lead_str
    assert "DSC" in lead_str

    # 12. Hobbies Verification
    hobbies = data_dump["hobbies"]
    assert len(hobbies) >= 4
    assert "Teaching" in hobbies
    assert "Coding" in hobbies
    assert "Playing Badminton" in hobbies
    assert "Listening to Music" in hobbies

    # 13. Languages Verification
    languages = data_dump["languages"]
    assert "English" in languages
    assert "Kannada" in languages
    assert "Hindi" in languages
    assert "Konkani" in languages

    # 14. Personal Details Verification (DOB, Father's Name, Gender, Nationality, Mother Tongue)
    p_details = data_dump["personal_details"]
    assert p_details.get("date_of_birth") == "26-10-1998"
    assert "Rajesh Rao" in p_details.get("father_name", "")
    assert p_details.get("gender") == "Male"
    assert p_details.get("nationality") == "Indian"
    assert p_details.get("mother_tongue") == "Konkani"

    # 15. Zero-Loss Integrity Validation
    integrity_report = ResumeIntegrityValidator.validate(normalized, normalized)
    assert integrity_report["isValid"] is True
    assert integrity_report["completenessScore"] >= 90.0


def test_real_pdf_production_upload_endpoint():
    """Verify that POST /api/resume-studio/upload correctly parses and saves the real PDF."""
    import io
    from fastapi.testclient import TestClient
    from app.main import app
    from app.api.analytics import get_current_student
    from app.models.student import Student

    app.dependency_overrides[get_current_student] = lambda: Student(id=1, email="pranamrrao@gmail.com", name="Pranam R Betrabet")

    with open(REAL_PDF_PATH, "rb") as f:
        pdf_bytes = f.read()

    client = TestClient(app)
    response = client.post(
        "/api/resume-studio/upload",
        files={"file": ("Pranam_R_Betrabet_Resume.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    )

    assert response.status_code == 200, f"Upload endpoint failed: {response.text}"
    res_data = response.json()
    assert res_data.get("success") is True
    assert res_data.get("resume_id") is not None

    p_info = res_data.get("parsed_data", {}).get("personal_info", {})
    assert p_info.get("name") == "Pranam R Betrabet"
    assert p_info.get("email") == "pranamrrao@gmail.com"
    assert "7349113044" in p_info.get("phone", "")
    assert res_data.get("parsed_data", {}).get("personal_details", {}).get("date_of_birth") == "26-10-1998"
    assert "Rajesh Rao" in res_data.get("parsed_data", {}).get("personal_details", {}).get("father_name", "")
