import os
import sys
from dotenv import load_dotenv

# Load env variables
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(dotenv_path)

# Add app to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.student import Student
from app.services.jobs.jsearch_provider import JSearchProvider
from app.services.jobs.glassdoor_provider import GlassdoorProvider

def test_providers():
    student_mock = Student(
        id="test_student_123",
        email="student@test.com",
        full_name="John Doe",
        skills=["Python", "React", "Node.js"]
    )
    
    print("--- 1. Testing JSearchProvider ---")
    jsearch = JSearchProvider()
    try:
        jobs = jsearch.search_jobs(student_mock, "Software Engineer", "India", limit=2)
        print(f"JSearch returned {len(jobs)} jobs.")
        for j in jobs:
            print(f"  [{j.get('source')}] Title: {j.get('title')} | Company: {j.get('company')} | URL: {j.get('url')[:50]}...")
    except Exception as e:
        print("JSearch failed:", e)

    print("\n--- 2. Testing GlassdoorProvider ---")
    glassdoor = GlassdoorProvider()
    try:
        jobs = glassdoor.search_jobs(student_mock, "Software Engineer", "India", limit=2)
        print(f"Glassdoor returned {len(jobs)} jobs.")
        for j in jobs:
            print(f"  [{j.get('source')}] Title: {j.get('title')} | Company: {j.get('company')} | URL: {j.get('url')[:50]}...")
    except Exception as e:
        print("Glassdoor failed:", e)

if __name__ == "__main__":
    test_providers()
