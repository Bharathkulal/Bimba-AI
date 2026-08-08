from fastapi.testclient import TestClient
from app.main import app
from app.api.analytics import get_current_student
from app.models.student import Student
import os

async def mock_get_current_student():
    student = Student(email="test@example.com", name="Test User", hashed_password="pw")
    student.id = 1
    student.roll_number = "12345"
    return student

app.dependency_overrides[get_current_student] = mock_get_current_student
client = TestClient(app)

def test_pdf_upload():
    pdf_path = "../Minimalist Modern Simple Business Social Media Manager Resume.pdf"
    if not os.path.exists(pdf_path):
        print(f"Error: {pdf_path} does not exist.")
        return
        
    print(f"Uploading {pdf_path}...")
    with open(pdf_path, "rb") as f:
        response = client.post(
            "/api/resume-studio/upload",
            files={"file": (os.path.basename(pdf_path), f, "application/pdf")}
        )
        
    print(f"Status Code: {response.status_code}")
    print(response.text[:2000])

if __name__ == "__main__":
    test_pdf_upload()
