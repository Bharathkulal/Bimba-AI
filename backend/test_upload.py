from fastapi.testclient import TestClient
from app.main import app
from app.api.analytics import get_current_student
from app.models.student import Student

async def mock_get_current_student():
    student = Student(email="test@example.com", name="Test User", hashed_password="pw")
    student.id = 1
    student.roll_number = "12345"
    return student

app.dependency_overrides[get_current_student] = mock_get_current_student

client = TestClient(app)

def test_upload_resume():
    with open("test_resume.txt", "rb") as f:
        response = client.post(
            "/api/resume-studio/upload",
            files={"file": ("test_resume.txt", f, "text/plain")}
        )
    
    print(f"Status Code: {response.status_code}")
    if response.status_code != 200:
        print(f"Error Details: {response.text}")
        return

    data = response.json()
    print("Response JSON keys:", data.keys())
    
    parsed = data.get("parsed_data", {})
    print("\n--- Parsed Personal Info ---")
    print(parsed.get("personal_info"))
    
    print("\n--- Parsed Education ---")
    print(parsed.get("education"))
    
    print("\n--- Parsed Experience ---")
    print(parsed.get("experience"))
    
    print("\n--- Parsed Skills ---")
    print(parsed.get("technicalSkills"))

if __name__ == "__main__":
    test_upload_resume()
