import sys
import os
import json
import urllib.request
import urllib.error

# Add backend directory to python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.mongodb import db
from app.core.security import create_access_token

def main():
    resume_id = 184
    resume = db.resumes.find_one({"id": resume_id})
    if not resume:
        print("Resume not found")
        return
        
    student_id = resume["student_id"]
    student = db.students.find_one({"id": student_id})
    if not student:
        print("Student not found")
        return
        
    print("Generating token for roll number:", student["roll_number"])
    token = create_access_token(subject=student["roll_number"])
    
    # Prepare payload exactly like frontend
    payload_data = {
        "template": resume.get("template_id") or "jakes",
        "resume_data": resume.get("resume") or {},
        "font_family": "Roboto",
        "font_size": "12pt"
    }
    
    url = f"http://127.0.0.1:8000/api/resume/generate-pdf/{resume_id}"
    req = urllib.request.Request(
        url,
        data=json.dumps(payload_data).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        },
        method="POST"
    )
    
    print("Sending POST request to:", url)
    try:
        with urllib.request.urlopen(req) as resp:
            print("Response status:", resp.status)
            body = json.loads(resp.read().decode("utf-8"))
            print("Response keys:", list(body.keys()))
            print("Success:", body.get("success"))
    except urllib.error.HTTPError as e:
        print("HTTP Error status:", e.code)
        try:
            err_body = e.read().decode("utf-8")
            print("Error body:", err_body)
        except Exception:
            pass
    except Exception as e:
        print("Failed with exception:", e)

if __name__ == '__main__':
    main()
