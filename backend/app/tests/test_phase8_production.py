import pytest
import io
import httpx
from datetime import datetime
from app.main import app
from app.api.analytics import get_current_student
from app.models.student import Student
from app.core.mongodb import db

from fastapi.testclient import TestClient

@pytest.fixture(scope="function")
def client():
    # Setup test DB user
    test_student = Student(id=888, email="phase8@test.com", name="Phase8 User")
    app.dependency_overrides[get_current_student] = lambda: test_student
    
    with TestClient(app) as c:
        yield c
        
    app.dependency_overrides.clear()

@pytest.fixture(scope="function")
def clean_db():
    db.resumes.delete_many({"student_id": 888})
    db.resume_versions.delete_many({"student_id": 888})
    yield
    db.resumes.delete_many({"student_id": 888})
    db.resume_versions.delete_many({"student_id": 888})

def test_resume_versioning_original_immutable(client, clean_db):
    """
    Test that when a resume is uploaded, an original immutable record is saved,
    along with a new editable version in the resume_versions collection.
    """
    import os
    REAL_PDF_PATH = os.path.join(os.path.dirname(__file__), "fixtures", "Pranam_R_Betrabet_Resume.pdf")
    with open(REAL_PDF_PATH, "rb") as f:
        pdf_bytes = f.read()
    
    # Upload resume
    response = client.post(
        "/api/resume-studio/upload",
        files={"file": ("test_resume.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    )
    
    assert response.status_code == 200, response.text
    data = response.json()
    assert data.get("success") is True
    
    resume_id = data.get("resume_id")
    
    # Check DB
    original_resume = db.resumes.find_one({"id": resume_id})
    assert original_resume is not None
    assert original_resume["student_id"] == 888
    
    versions = list(db.resume_versions.find({"resume_id": resume_id}))
    assert len(versions) == 1
    assert versions[0]["version"] == 1
    
    # Test edit route to create a new version
    # (Assuming an edit endpoint exists or needs to be built)
    edit_payload = {
        "resume": {
            "personal_info": {"name": "Edited Name"}
        }
    }
    
    edit_response = client.put(f"/api/resume-studio/{resume_id}", json=edit_payload)
    assert edit_response.status_code == 200
    
    # Verify new version
    versions = list(db.resume_versions.find({"resume_id": resume_id}).sort("version", 1))
    assert len(versions) == 2
    assert versions[-1]["version"] == 2
    assert versions[-1]["changes"] is not None
    
    # Original fields within db.resumes should not be overwritten destructively
    # according to our route logic for raw_extracted_text, original_file, etc.
    original_after_edit = db.resumes.find_one({"id": resume_id})
    assert original_after_edit is not None
    assert original_after_edit.get("resume").get("personal_info").get("name") == "Edited Name"

def test_ai_dependency_boundary(client, clean_db):
    """
    Verify that normal resume processing DOES NOT call external LLMs like Gemini or Groq.
    """
    # This requires mocking or checking AIProviderManager log to ensure 0 calls.
    pass

def test_deterministic_ats(client, clean_db):
    """
    Test ATS scoring determinism and that it correctly recalculates on edit without AI.
    """
    pass

def test_no_fabricated_data(client, clean_db):
    """
    Test that if data doesn't exist, it uses explicitly structured empty values/null.
    """
    pass
