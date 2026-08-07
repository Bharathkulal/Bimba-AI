from datetime import datetime, timezone
from app.core.mongodb import db, create_indexes
from app.core.security import get_password_hash

def init_db():
    try:
        print("Initializing MongoDB collections and seeding data...")
        
        # Create indexes first
        create_indexes()
        
        # 1. Seed Admin Users
        if db.admin_users.count_documents({}) == 0:
            db.admin_users.insert_many([
                {
                    "id": 1,
                    "username": "admin",
                    "email": "admin@bimba.ai",
                    "password_hash": get_password_hash("admin"),
                    "role": "super_admin",
                    "is_active": True,
                    "force_logout": False,
                    "created_at": datetime.now(timezone.utc)
                },
                {
                    "id": 2,
                    "username": "moderator",
                    "email": "mod@bimba.ai",
                    "password_hash": get_password_hash("moderator"),
                    "role": "moderator",
                    "is_active": True,
                    "force_logout": False,
                    "created_at": datetime.now(timezone.utc)
                },
                {
                    "id": 3,
                    "username": "placement",
                    "email": "placement@bimba.ai",
                    "password_hash": get_password_hash("placement"),
                    "role": "placement_officer",
                    "is_active": True,
                    "force_logout": False,
                    "created_at": datetime.now(timezone.utc)
                }
            ])
            db.counters.update_one({"_id": "admin_users"}, {"$set": {"seq": 3}}, upsert=True)
            print("Seeded admin users.")
            
        if db.admin_users.count_documents({"username": "placement"}) == 0:
            db.admin_users.insert_one({
                "id": 3,
                "username": "placement",
                "email": "placement@bimba.ai",
                "password_hash": get_password_hash("placement"),
                "role": "placement_officer",
                "is_active": True,
                "force_logout": False,
                "created_at": datetime.now(timezone.utc)
            })
            db.counters.update_one({"_id": "admin_users"}, {"$set": {"seq": 3}}, upsert=True)
            print("Seeded placement officer user.")

        # 2. Seed Departments
        if db.departments.count_documents({}) == 0:
            db.departments.insert_many([
                {
                    "id": 1,
                    "code": "CS",
                    "name": "Computer Science & Engineering",
                    "description": "Core computer systems and algorithms engineering department.",
                    "hod_name": "Dr. Alan Turing",
                    "status": "Active",
                    "student_count": 120,
                    "subject_count": 12,
                    "faculty_count": 8
                },
                {
                    "id": 2,
                    "code": "BCA",
                    "name": "Bachelor of Computer Applications",
                    "description": "Practical software applications and systems deployment.",
                    "hod_name": "Dr. Grace Hopper",
                    "status": "Active",
                    "student_count": 85,
                    "subject_count": 10,
                    "faculty_count": 6
                }
            ])
            db.counters.update_one({"_id": "departments"}, {"$set": {"seq": 2}}, upsert=True)
            print("Seeded departments.")

        # 3. Seed Subjects
        if db.subjects.count_documents({}) == 0:
            # We assume department ID 1 is CS, and ID 2 is BCA
            db.subjects.insert_many([
                {
                    "id": 1,
                    "code": "CS301",
                    "name": "Database Management Systems",
                    "department_id": 1,
                    "semester": 3,
                    "credits": 4,
                    "faculty_name": "Prof. John Doe",
                    "status": "Active",
                    "students_enrolled": 45
                },
                {
                    "id": 2,
                    "code": "CS302",
                    "name": "Operating Systems",
                    "department_id": 1,
                    "semester": 3,
                    "credits": 3,
                    "faculty_name": "Prof. Jane Smith",
                    "status": "Active",
                    "students_enrolled": 45
                },
                {
                    "id": 3,
                    "code": "BCA301",
                    "name": "Web Technologies",
                    "department_id": 2,
                    "semester": 3,
                    "credits": 3,
                    "faculty_name": "Prof. Bob Johnson",
                    "status": "Active",
                    "students_enrolled": 40
                }
            ])
            db.counters.update_one({"_id": "subjects"}, {"$set": {"seq": 3}}, upsert=True)
            print("Seeded subjects.")

        # 4. Seed Email Templates
        if db.email_templates.count_documents({}) == 0:
            db.email_templates.insert_many([
                {
                    "id": 1,
                    "name": "OTP",
                    "subject": "Your Bimba AI One-Time Password",
                    "body": "Hello, your OTP verification code is {{otp}}. This code is valid for 10 minutes."
                },
                {
                    "id": 2,
                    "name": "Welcome",
                    "subject": "Welcome to Bimba AI Portal",
                    "body": "Hello {{student_name}},\n\nYour account has been successfully created. Welcome aboard!"
                },
                {
                    "id": 3,
                    "name": "Password Reset",
                    "subject": "Bimba AI Password Reset Request",
                    "body": "Hello, click the following link to reset your password: {{reset_link}}"
                },
                {
                    "id": 4,
                    "name": "Announcement",
                    "subject": "New Academic Announcement",
                    "body": "Dear Students,\n\nA new announcement has been published:\n\n{{announcement_title}}\n\n{{announcement_content}}"
                },
                {
                    "id": 5,
                    "name": "Resume Ready",
                    "subject": "Your AI Resume is Ready!",
                    "body": "Great news! Your resume has been optimized with our AI gateway and is ready for download."
                }
            ])
            db.counters.update_one({"_id": "email_templates"}, {"$set": {"seq": 5}}, upsert=True)
            print("Seeded email templates.")

        # 5. Seed AI Providers and System Settings
        if db.ai_providers.count_documents({}) == 0:
            db.ai_providers.insert_many([
                {
                    "id": 1,
                    "provider_name": "Gemini",
                    "slug": "gemini",
                    "encrypted_api_key": None,
                    "model_name": "gemini-2.0-flash",
                    "priority": 1,
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "max_tokens": 4096,
                    "timeout": 30,
                    "retry_attempts": 3,
                    "rate_limit": 60,
                    "fallback_enabled": True,
                    "is_enabled": True,
                    "connection_status": "Healthy",
                    "last_tested_at": None,
                    "created_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc),
                    "updated_by": None
                },
                {
                    "id": 2,
                    "provider_name": "OpenRouter",
                    "slug": "openrouter",
                    "encrypted_api_key": None,
                    "model_name": "google/gemini-2.0-flash-001",
                    "priority": 2,
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "max_tokens": 4096,
                    "timeout": 30,
                    "retry_attempts": 3,
                    "rate_limit": 60,
                    "fallback_enabled": True,
                    "is_enabled": True,
                    "connection_status": "Connected",
                    "last_tested_at": None,
                    "created_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc),
                    "updated_by": None
                },
                {
                    "id": 3,
                    "provider_name": "Groq",
                    "slug": "groq",
                    "encrypted_api_key": None,
                    "model_name": "llama-3.3-70b-versatile",
                    "priority": 3,
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "max_tokens": 4096,
                    "timeout": 30,
                    "retry_attempts": 3,
                    "rate_limit": 60,
                    "fallback_enabled": True,
                    "is_enabled": True,
                    "connection_status": "Connected",
                    "last_tested_at": None,
                    "created_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc),
                    "updated_by": None
                }
            ])
            db.counters.update_one({"_id": "ai_providers"}, {"$set": {"seq": 3}}, upsert=True)
            print("Seeded AI providers.")

        if db.ai_system_settings.count_documents({}) == 0:
            db.ai_system_settings.insert_one({
                "id": 1,
                "auto_retry": True,
                "fallback": True,
                "ai_timeout": 20,
                "request_limit": 50,
                "log_retention": 90,
                "debug": False,
                "jwt_enabled": True,
                "https_enabled": False,
                "rate_limit_enabled": True,
                "firewall_enabled": False,
                "validation_enabled": True,
                "xss_protected": True,
                "sql_injection_protected": True
            })
            print("Seeded AI system settings.")

        # 6. Seed Default Students
        # 6. Seed Default Students
        students_to_seed = [
            {
                "roll_number": "BCA24001",
                "student_name": "John Doe",
                "full_name": "John Doe",
                "email": "student@bimba.ai",
                "dob": "15-08-2005",
                "phone": "9876543210",
                "department": "BCA",
                "semester": 3,
                "status": "Active",
                "password_hash": get_password_hash("15-08-2005"),
                "is_active": True,
                "account_activated": True,
                "otp_verified": True,
            },
            {
                "roll_number": "BCA24002",
                "student_name": "Jane Smith",
                "full_name": "Jane Smith",
                "email": "jane@bimba.ai",
                "dob": "01-01-2005",
                "phone": "9876543211",
                "department": "BCA",
                "semester": 3,
                "status": "Active",
                "password_hash": get_password_hash("01-01-2005"),
                "is_active": True,
                "account_activated": True,
                "otp_verified": True,
            },
            {
                "roll_number": "BCA24003",
                "student_name": "Alice Johnson",
                "full_name": "Alice Johnson",
                "email": "alice@bimba.ai",
                "dob": "10-10-2005",
                "phone": "9876543212",
                "department": "BCA",
                "semester": 3,
                "status": "Active",
                "password_hash": get_password_hash("10-10-2005"),
                "is_active": True,
                "account_activated": True,
                "otp_verified": True,
            },
            {
                "roll_number": "BCA24004",
                "student_name": "Bob Wilson",
                "full_name": "Bob Wilson",
                "email": "bob@bimba.ai",
                "dob": "12-12-2005",
                "phone": "9876543213",
                "department": "BCA",
                "semester": 3,
                "status": "Active",
                "password_hash": get_password_hash("12-12-2005"),
                "is_active": True,
                "account_activated": True,
                "otp_verified": True,
            },
            {
                "roll_number": "BCA24005",
                "student_name": "Charlie Brown",
                "full_name": "Charlie Brown",
                "email": "charlie@bimba.ai",
                "dob": "20-05-2005",
                "phone": "9876543214",
                "department": "BCA",
                "semester": 3,
                "status": "Active",
                "password_hash": get_password_hash("20-05-2005"),
                "is_active": True,
                "account_activated": True,
                "otp_verified": True,
            }
        ]

        seeded_count = 0
        from app.core.mongodb import get_next_sequence
        for sdata in students_to_seed:
            existing = db.students.find_one({"roll_number": sdata["roll_number"]})
            if not existing:
                email_conflict = db.students.find_one({"email": sdata["email"]})
                if email_conflict:
                    continue
                new_id = get_next_sequence("students")
                while db.students.find_one({"id": new_id}):
                    new_id = get_next_sequence("students")
                sdata["id"] = new_id
                sdata["created_at"] = datetime.now(timezone.utc)
                sdata["updated_at"] = datetime.now(timezone.utc)
                db.students.insert_one(sdata)
                seeded_count += 1
        if seeded_count > 0:
            print(f"Seeded {seeded_count} student accounts.")

        # 7. Seed Default Resume Templates
        if db.resume_templates.count_documents({}) == 0:
            try:
                import sys
                import os
                backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                if backend_dir not in sys.path:
                    sys.path.append(backend_dir)
                from seed_templates import seed_templates
                seed_templates()
                print("Seeded all 20 resume templates using seed_templates.py.")
            except Exception as e:
                print(f"Failed to seed templates using seed_templates.py: {e}. Seeding minimalist-modern fallback...")
                templates_list = [
                    {
                        "templateId": "minimalist-modern",
                        "id": "minimalist-modern",
                        "slug": "minimalist-modern",
                        "name": "Minimalist Modern (Premium ATS)",
                        "category": "Premium",
                        "atsScore": 100,
                        "atsFriendly": True,
                        "featured": False,
                        "premium": False,
                        "description": "Premium 100% ATS-compliant layout designed for professional impact and readability.",
                        "layout": {
                            "columns": 1,
                            "header": "top",
                            "spacing": 16,
                            "margin": 32
                        },
                        "colors": {
                            "primary": "#111827",
                            "secondary": "#4B5563"
                        },
                        "font": {
                            "family": "Helvetica",
                            "heading": 18,
                            "body": 11
                        },
                        "sections": ["profile", "experience", "education", "skills", "projects", "certifications", "hobbies"],
                        "renderer": "standard",
                        "enabled": True,
                        "displayOrder": 1,
                        "createdAt": datetime.now(timezone.utc),
                        "updatedAt": datetime.now(timezone.utc)
                    }
                ]
                db.resume_templates.insert_many(templates_list)
                db.counters.update_one({"_id": "resume_templates"}, {"$set": {"seq": 1}}, upsert=True)
                print("Seeded minimalist-modern fallback template.")
            
        print("Successfully initialized and seeded MongoDB database!")
    except Exception as e:
        print(f"Error seeding MongoDB database: {e}")

