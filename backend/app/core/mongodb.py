import os
from bson import ObjectId
from pymongo import MongoClient, ASCENDING

from app.core.config import settings

# Initialize client
client = MongoClient(settings.MONGODB_URI)
db = client[settings.DATABASE_NAME]

class MongoModel(dict):
    """
    A custom dictionary class that supports attribute (dot) access
    and provides fallback properties to match SQLAlchemy models.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Ensure we always have string representations of _id as id
        if "_id" in self and "id" not in self:
            try:
                # If _id is integer, cast it. Otherwise, cast to string.
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
            
        if name == "name":
            return self.get("provider_name")
            
        if name == "is_active":
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
        return_document=True
    )
    return counter["seq"]

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
    db.saved_jobs.create_index([("user_id", ASCENDING)])
    db.job_applications.create_index([("user_id", ASCENDING)])
    db.notifications.create_index([("student_id", ASCENDING)])
    
    # Secondary index on created_at/date for ordering and analytics
    db.notifications.create_index([("created_at", ASCENDING)])
    db.ai_usage_logs.create_index([("created_at", ASCENDING)])
    db.activity_logs.create_index([("created_at", ASCENDING)])
    db.download_logs.create_index([("created_at", ASCENDING)])
    
    print("MongoDB indexes created successfully!")
