"""
Bimba AI - Database Indexes Setup
=================================
Run: python scripts/setup_db_indexes.py
Sets up indexes in MongoDB collections for high performance query resolution.
"""

import os
import sys
from pymongo import MongoClient, ASCENDING, DESCENDING

# Ensure project root is on the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

def setup_indexes():
    mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    db_name = os.getenv("DATABASE_NAME", "bimba_ai")
    
    print(f"Connecting to MongoDB at {mongo_uri}...")
    client = MongoClient(mongo_uri)
    db = client[db_name]
    
    # 1. Students collection
    print("Indexing 'students' collection...")
    db.students.create_index("id", unique=True)
    db.students.create_index("roll_number", unique=True)
    db.students.create_index("personal_email")
    
    # 2. Resumes collection
    print("Indexing 'resumes' collection...")
    db.resumes.create_index("id", unique=True)
    db.resumes.create_index("student_id")
    db.resumes.create_index([("student_id", ASCENDING), ("status", ASCENDING)])

    # 3. Resume Analysis collection
    print("Indexing 'resume_analysis' collection...")
    db.resume_analysis.create_index([("resume_id", ASCENDING), ("student_id", ASCENDING)], unique=True)
    db.resume_analysis.create_index("status")
    
    # 4. Generated Resumes collection
    print("Indexing 'generated_resumes' collection...")
    db.generated_resumes.create_index("id", unique=True)
    db.generated_resumes.create_index([("resume_id", ASCENDING), ("student_id", ASCENDING)])
    db.generated_resumes.create_index([("resume_id", ASCENDING), ("version", DESCENDING)])
    
    # 5. Job Recommendations collection
    print("Indexing 'job_recommendations' collection...")
    db.job_recommendations.create_index([("resume_id", ASCENDING), ("student_id", ASCENDING)], unique=True)
    db.job_recommendations.create_index("created_at")

    # 6. Saved Jobs collection
    print("Indexing 'saved_jobs' collection...")
    db.saved_jobs.create_index([("user_id", ASCENDING), ("job_id", ASCENDING)], unique=True)
    db.saved_jobs.create_index("saved_at")

    # 7. Job Applications collection
    print("Indexing 'job_applications' collection...")
    db.job_applications.create_index("id", unique=True)
    db.job_applications.create_index([("user_id", ASCENDING), ("job_id", ASCENDING)], unique=True)
    db.job_applications.create_index("status")
    
    # 8. AI Usage Logs collection
    print("Indexing 'ai_usage_logs' collection...")
    db.ai_usage_logs.create_index("task_type")
    db.ai_usage_logs.create_index("created_at")
    
    # SaaS platform collections
    print("Indexing SaaS resume & interview collections...")
    db.resume_uploads.create_index("userId")
    db.resume_uploads.create_index("resumeId")
    db.resume_uploads.create_index("checksum")
    db.resume_extractions.create_index("userId")
    db.resume_extractions.create_index("resumeId")
    db.resume_profiles.create_index("userId")
    db.resume_profiles.create_index("resumeId")
    db.career_interviews.create_index("userId")
    db.career_interviews.create_index("resumeId")
    
    print("\nDatabase indexes setup successfully!")

if __name__ == "__main__":
    setup_indexes()
