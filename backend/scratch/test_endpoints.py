from pymongo import MongoClient
from app.models.student import Student
from app.api.analytics import get_dashboard_analytics, get_ats_analytics, get_activity_timeline
from app.api.jobs import search_jobs
import pprint

client = MongoClient("mongodb://localhost:27017")
db = client["bimba_ai"]

student_doc = db.students.find_one({"roll_number": "BCA25008"})
student = Student(student_doc)

print("--- TESTING ANALYTICS ENDPOINTS ---")
print("Dashboard Analytics:")
try:
    dash = get_dashboard_analytics(student=student, db=db)
    pprint.pprint(dash)
except Exception as e:
    print("Error:", e)

print("\nATS Analytics:")
try:
    ats = get_ats_analytics(student=student, db=db)
    pprint.pprint(ats)
except Exception as e:
    print("Error:", e)

print("\nActivity Timeline:")
try:
    activity = get_activity_timeline(student=student, db=db)
    pprint.pprint(activity)
except Exception as e:
    print("Error:", e)

print("\n--- TESTING JOBS SEARCH ENDPOINT ---")
try:
    jobs = search_jobs(limit=3, student=student, db=db)
    pprint.pprint(jobs)
except Exception as e:
    print("Error:", e)
