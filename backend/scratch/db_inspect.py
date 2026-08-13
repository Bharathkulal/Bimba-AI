import os
from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017")
db = client["bimba_ai"]

print("Students:")
for s in db.students.find().limit(5):
    print(f"ID: {s.get('id')} ({type(s.get('id'))}), Roll: {s.get('roll_number')}, Email: {s.get('email')}")

print("\nActivity Logs:")
for l in db.activity_logs.find().limit(5):
    print(f"ID: {l.get('id')}, Student ID: {l.get('student_id')} ({type(l.get('student_id'))}), Activity: {l.get('activity')}")

print("\nResumes:")
for r in db.resumes.find().limit(5):
    print(f"ID: {r.get('id')}, Student ID: {r.get('student_id')} ({type(r.get('student_id'))}), Name: {r.get('name')}")

print("\nRecommended Jobs (cache):")
print(f"Count: {db.recommended_jobs.count_documents({})}")
for rj in db.recommended_jobs.find().limit(5):
    print(f"ID: {rj.get('id')}, Title: {rj.get('title')}, Company: {rj.get('company')}")
