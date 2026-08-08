import os
from typing import Any
from bson import ObjectId
from pymongo import MongoClient, ASCENDING, ReturnDocument

from app.core.config import settings

# Initialize client with connection pooling optimizations
client = MongoClient(
    settings.MONGODB_URI,
    maxPoolSize=100,
    minPoolSize=10,
    maxIdleTimeMS=30000,
    waitQueueTimeoutMS=5000,
    connectTimeoutMS=5000
)
db = client[settings.DATABASE_NAME]

def stringify_object_ids(obj: Any) -> Any:
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, dict):
        return {k: stringify_object_ids(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [stringify_object_ids(item) for item in obj]
    return obj

class MongoModel(dict):
    """
    A custom dictionary class that supports attribute (dot) access
    and provides fallback properties to match SQLAlchemy models.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for k, v in list(self.items()):
            if isinstance(v, ObjectId):
                self[k] = str(v)
            elif isinstance(v, (dict, list)):
                self[k] = stringify_object_ids(v)
        # Ensure we always have string representations of _id as id
        if "_id" in self and "id" not in self:
            try:
                if isinstance(self["_id"], int):
                    self["id"] = self["_id"]
                else:
                    self["id"] = str(self["_id"])
            except Exception:
                pass

    def __getattr__(self, name):
        # Allow standard key retrieval
        if name in self:
            return self[name]
            
        # SQLAlchemy properties compatibility fallbacks
        if name == "id":
            # Expose _id as a string or integer
            val = self.get("_id")
            if val is not None:
                if isinstance(val, int):
                    return val
                return str(val)
            return None
            
        if name == "personal_email":
            return self.get("email")
            
        if name == "date_of_birth":
            return self.get("dob")
            
        if name == "is_activated":
            return self.get("account_activated", False)
            
        if name == "is_read":
            return self.get("read", False)
            
        if name == "student_id":
            return self.get("user_id")

        if name == "languages_list":
            return self.get("languages", "")

        if name == "achievements_list":
            return self.get("achievements", "")
            
        if name == "full_name":
            return self.get("student_name") or self.get("full_name")
            
        if name == "name":
            return self.get("provider_name")

        if name == "is_active":
            if "is_active" in self:
                return self["is_active"]
            return self.get("is_enabled", True)
            
        if name == "status":
            return self.get("connection_status", "Not Configured")
            
        if name in ("today_requests", "latency_ms"):
            return 0
            
        if name == "success_rate":
            return 100
            
        # Return None for any other non-existent fields to mimic nullable SQLAlchemy columns
        return None

    def __setattr__(self, name, value):
        self[name] = value

    def __delattr__(self, name):
        if name in self:
            del self[name]

def get_next_sequence(collection_name: str) -> int:
    """
    Generate an auto-incrementing integer ID using a counters collection in MongoDB.
    """
    counter = db.counters.find_one_and_update(
        {"_id": collection_name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER
    )
    return counter["seq"]

def get_next_sequence_batch(collection_name: str, count: int) -> int:
    """
    Generate the starting sequence ID for a batch of `count` items in a single query.
    """
    if count <= 0:
        return 0
    counter = db.counters.find_one_and_update(
        {"_id": collection_name},
        {"$inc": {"seq": count}},
        upsert=True,
        return_document=ReturnDocument.AFTER
    )
    return counter["seq"] - count + 1

def create_indexes():
    """
    Create all required database indexes in MongoDB.
    """
    print("Creating MongoDB Indexes...")
    # Unique index on student roll number and email
    db.students.create_index([("roll_number", ASCENDING)], unique=True)
    db.students.create_index([("email", ASCENDING)], unique=True)
    
    # Secondary index on user_id / student_id for resumes, jobs, applications, saved_jobs
    db.resumes.create_index([("student_id", ASCENDING)])
    db.resumes.create_index([("id", ASCENDING)], unique=True)
    db.resumes.create_index([("skills.name", ASCENDING)])
    db.resumes.create_index([("target_role", ASCENDING)])
    db.saved_jobs.create_index([("user_id", ASCENDING)])
    db.saved_jobs.create_index([("job_id", ASCENDING)])
    db.job_applications.create_index([("user_id", ASCENDING)])
    db.job_applications.create_index([("job_id", ASCENDING)])
    db.job_applications.create_index([("status", ASCENDING)])
    db.notifications.create_index([("student_id", ASCENDING)])
    
    # Secondary index on created_at/date for ordering and analytics
    db.notifications.create_index([("created_at", ASCENDING)])
    db.ai_usage_logs.create_index([("created_at", ASCENDING)])
    db.activity_logs.create_index([("created_at", ASCENDING)])
    db.download_logs.create_index([("created_at", ASCENDING)])
    
    # Versioning indexes
    db.resume_versions.create_index([("resume_id", ASCENDING)])
    db.resume_versions.create_index([("created_at", ASCENDING)])
    db.resume_analyses.create_index([("resume_id", ASCENDING)])
    
    # SaaS platform enhancement collections
    db.resume_uploads.create_index([("userId", ASCENDING)])
    db.resume_uploads.create_index([("resumeId", ASCENDING)])
    db.resume_uploads.create_index([("checksum", ASCENDING)])
    db.resume_extractions.create_index([("userId", ASCENDING)])
    db.resume_extractions.create_index([("resumeId", ASCENDING)])
    db.resume_profiles.create_index([("userId", ASCENDING)])
    db.resume_profiles.create_index([("resumeId", ASCENDING)])
    db.career_interviews.create_index([("userId", ASCENDING)])
    db.career_interviews.create_index([("resumeId", ASCENDING)])
    
    print("MongoDB indexes created successfully!")
