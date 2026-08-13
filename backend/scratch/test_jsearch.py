import os
from dotenv import load_dotenv
load_dotenv(".env")

from app.core.config import settings
from app.services.jobs.jsearch_provider import JSearchProvider
from app.models.student import Student

print("JSEARCH_API_KEY:", settings.JSEARCH_API_KEY)
print("GLASSDOOR_API_KEY:", settings.GLASSDOOR_API_KEY)

jsearch = JSearchProvider()
student = Student({"id": 8, "roll_number": "BCA25008"})

try:
    jobs = jsearch.search_jobs(student, "Software Engineer", "India", 3)
    print("Found jobs:")
    for j in jobs:
        print(j["title"], "-", j["company"])
except Exception as e:
    print("JSearch Error:", e)
