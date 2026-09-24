import pytest
from fastapi.testclient import TestClient
from datetime import datetime
from app.main import app
from app.database.session import get_db

client = TestClient(app)

class MockDB:
    def __init__(self):
        self.resumes = self.Collection()
        self.resume_profiles = self.Collection()
        
    class Collection:
        def __init__(self):
            self.data = {}
        
        def find_one(self, query):
            # very naive mock for {"id": X}
            return self.data.get(query.get("id"))
            
        def update_one(self, query, update, upsert=False):
            doc = self.data.get(query.get("id")) or query
            if "$set" in update:
                doc.update(update["$set"])
            self.data[query.get("id") or query.get("resumeId")] = doc
            
        def insert_one(self, doc):
            self.data[doc.get("id")] = doc

mock_db = MockDB()

def override_get_db():
    return mock_db

def override_get_current_student():
    from app.models.student import Student
    return Student({"id": 1, "roll_number": "TEST01", "department": "CS", "section": "A"})

app.dependency_overrides[get_db] = override_get_db
from app.api.analytics import get_current_student
app.dependency_overrides[get_current_student] = override_get_current_student

@pytest.fixture(autouse=True)
def setup_db():
    mock_db.resumes.data.clear()
    mock_db.resume_profiles.data.clear()
    
    # Initialize a complete resume with all fields (Step 1)
    mock_db.resumes.data[999] = {
        "_id": "dummy",
        "id": 999,
        "student_id": 1,
        "name": "Complete Resume",
        "resume": {
            "personal_info": {"fullName": "John Doe", "email": "john@test.com"},
            "summary": "Great engineer.",
            "education": [{"id": 1, "degree": "BTech"}],
            "experience": [{"id": 1, "company": "Tech Corp"}],
            "projects": [{"id": 1, "title": "Bimba"}],
            "certifications": [{"id": 1, "name": "AWS"}],
            "achievements": [{"id": 1, "title": "Winner"}],
            "languages": ["English"],
            "courses": ["CS101"],
            "research": ["Quantum Physics"],
            "volunteering": ["NGO"],
            "leadership": ["Captain"],
            "links": ["http://github.com"],
            "metadata": {"source": "pdf"},
            "raw_extracted_text": "John Doe BTech Tech Corp...",
            "original_parsed_data": {"test": True},
            "original_file": {"url": "http://cloud/1.pdf"}
        }
    }

def test_data_loss_1():
    # Update only personal_info
    payload = {
        "personal_info": {"fullName": "Jane Doe", "email": "jane@test.com"}
    }
    response = client.put("/api/v1/resume-studio/999/update", json=payload)
    assert response.status_code == 200
    
    # Verify other fields remain
    doc = mock_db.resumes.data[999]["resume"]
    assert doc["personal_info"]["fullName"] == "Jane Doe"
    assert "projects" in doc
    assert "certifications" in doc
    assert "raw_extracted_text" in doc
    assert "original_file" in doc

def test_data_loss_2():
    # Update only skills
    payload = {
        "skills": ["Python", "React"]
    }
    response = client.put("/api/v1/resume-studio/999/update", json=payload)
    assert response.status_code == 200
    
    doc = mock_db.resumes.data[999]["resume"]
    assert "Python" in doc["skills"]
    assert "education" in doc
    assert "experience" in doc
    assert "achievements" in doc

def test_data_loss_3():
    # Update only education
    payload = {
        "education": [{"id": 1, "degree": "MTech"}]
    }
    response = client.put("/api/v1/resume-studio/999/update", json=payload)
    assert response.status_code == 200
    
    doc = mock_db.resumes.data[999]["resume"]
    assert doc["education"][0]["degree"] == "MTech"
    assert "projects" in doc
    assert "languages" in doc

def test_data_loss_4():
    # Legacy resume
    mock_db.resumes.data[888] = {
        "_id": "dummy2",
        "id": 888,
        "student_id": 1,
        "resume": {
            "certificates": [{"id": 1, "name": "Old Cert"}]
        }
    }
    payload = {"personal_info": {"fullName": "Legacy"}}
    response = client.put("/api/v1/resume-studio/888/update", json=payload)
    
    doc = mock_db.resumes.data[888]["resume"]
    assert "certificates" in doc
    assert doc["certificates"][0]["name"] == "Old Cert"

def test_data_loss_5():
    # Test zero-loss fields protection
    payload = {
        "personal_info": {"fullName": "Hacker"},
        "raw_extracted_text": "I tried to overwrite this",
        "original_file": None
    }
    response = client.put("/api/v1/resume-studio/999/update", json=payload)
    assert response.status_code == 200
    
    doc = mock_db.resumes.data[999]["resume"]
    assert doc["personal_info"]["fullName"] == "Hacker"
    assert doc["raw_extracted_text"] != "I tried to overwrite this"
    assert doc["original_file"] is not None
