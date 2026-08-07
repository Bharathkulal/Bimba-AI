from fastapi.testclient import TestClient
from app.main import app
from app.api.analytics import get_current_student
from app.models.student import Student
import json
import os

async def mock_get_current_student():
    student = Student(email="test@example.com", name="Test User", hashed_password="pw")
    student.id = 1
    student.roll_number = "12345"
    return student

app.dependency_overrides[get_current_student] = mock_get_current_student

client = TestClient(app)

def test_resume(file_path):
    print(f"\n=============================================")
    print(f"Testing {os.path.basename(file_path)}")
    print(f"=============================================")
    with open(file_path, "rb") as f:
        response = client.post(
            "/api/resume-studio/upload",
            files={"file": (os.path.basename(file_path), f, "text/plain")}
        )
        
    if response.status_code == 200:
        print("Upload successful!")
        data = response.json()
        parsed_data = data.get("parsed_data", {})
        
        print("\n--- Personal Info ---")
        print(json.dumps(parsed_data.get("personal_info"), indent=2))
        
        print("\n--- Experience ---")
        print(json.dumps(parsed_data.get("experience"), indent=2))
        
        print("\n--- Custom Sections ---")
        print(json.dumps(parsed_data.get("custom_sections"), indent=2))
        
    else:
        print(f"Upload failed with status {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    test_files = [
        "test_resumes/labeled.txt",
        "test_resumes/plain_header.txt",
        "test_resumes/custom_sections.txt"
    ]
    for file in test_files:
        test_resume(file)
