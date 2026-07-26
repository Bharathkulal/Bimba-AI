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
                }
            ])
            db.counters.update_one({"_id": "admin_users"}, {"$set": {"seq": 2}}, upsert=True)
            print("Seeded admin users.")

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
                    "model_name": "gemini-2.5-flash",
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
                    "model_name": "gemini-2.5-flash",
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
                    "model_name": "llama3-70b-8192",
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
        if db.students.count_documents({}) == 0:
            db.students.insert_many([
                {
                    "id": 1,
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
                    "created_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc)
                },
                {
                    "id": 2,
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
                    "created_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc)
                },
                {
                    "id": 3,
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
                    "created_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc)
                },
                {
                    "id": 4,
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
                    "created_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc)
                },
                {
                    "id": 5,
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
                    "created_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc)
                }
            ])
            db.counters.update_one({"_id": "students"}, {"$set": {"seq": 5}}, upsert=True)
            print("Seeded student accounts.")

        # 7. Seed Default Resume Templates
        db.resume_templates.delete_many({})
        templates_list = [
            # Free templates
            {"id": 1, "slug": "modern", "name": "Modern Professional", "category": "Professional", "ats_rating": 99, "popularity": 150, "color_theme": "blue", "is_enabled": True, "is_premium": False, "is_ats_optimized": True, "html_content": "<div class='theme-blue font-sans'>Modern Professional Layout</div>", "reportlab_code": '{"margins": [40, 40, 40, 40], "primary_color": "#1E3A8A"}'},
            {"id": 2, "slug": "harvard", "name": "Harvard Resume", "category": "Minimalist", "ats_rating": 100, "popularity": 140, "color_theme": "slate", "is_enabled": True, "is_premium": False, "is_ats_optimized": True, "html_content": "<div class='theme-slate font-serif'>Harvard Layout</div>", "reportlab_code": '{"margins": [40, 40, 40, 40], "primary_color": "#0F172A"}'},
            {"id": 3, "slug": "google", "name": "Google Resume", "category": "Minimalist", "ats_rating": 100, "popularity": 130, "color_theme": "slate", "is_enabled": True, "is_premium": False, "is_ats_optimized": True, "html_content": "<div class='theme-slate font-sans'>Google Layout</div>", "reportlab_code": '{"margins": [40, 40, 40, 40], "primary_color": "#1F2937"}'},
            {"id": 4, "slug": "faang", "name": "FAANG Resume", "category": "Technical", "ats_rating": 99, "popularity": 120, "color_theme": "slate", "is_enabled": True, "is_premium": False, "is_ats_optimized": True, "html_content": "<div class='theme-slate font-sans'>FAANG Layout</div>", "reportlab_code": '{"margins": [30, 30, 30, 30], "primary_color": "#111827"}'},
            {"id": 5, "slug": "fresher", "name": "Fresher Resume", "category": "Entry Level", "ats_rating": 98, "popularity": 110, "color_theme": "emerald", "is_enabled": True, "is_premium": False, "is_ats_optimized": True, "html_content": "<div class='theme-emerald font-sans'>Fresher Layout</div>", "reportlab_code": '{"margins": [40, 40, 40, 40], "primary_color": "#059669"}'},
            {"id": 6, "slug": "experienced", "name": "Experienced Resume", "category": "Professional", "ats_rating": 98, "popularity": 100, "color_theme": "indigo", "is_enabled": True, "is_premium": False, "is_ats_optimized": True, "html_content": "<div class='theme-indigo font-sans'>Experienced Layout</div>", "reportlab_code": '{"margins": [35, 35, 35, 35], "primary_color": "#4F46E5"}'},
            {"id": 7, "slug": "executive", "name": "Executive Resume", "category": "Executive", "ats_rating": 97, "popularity": 95, "color_theme": "blue", "is_enabled": True, "is_premium": False, "is_ats_optimized": True, "html_content": "<div class='theme-blue font-sans'>Executive Layout</div>", "reportlab_code": '{"margins": [40, 40, 40, 40], "primary_color": "#1E40AF"}'},
            {"id": 8, "slug": "creative", "name": "Creative ATS Resume", "category": "Creative", "ats_rating": 95, "popularity": 90, "color_theme": "emerald", "is_enabled": True, "is_premium": False, "is_ats_optimized": True, "html_content": "<div class='theme-emerald font-sans'>Creative Layout</div>", "reportlab_code": '{"margins": [35, 35, 35, 35], "primary_color": "#10B981"}'},
            {"id": 9, "slug": "minimal", "name": "Minimal Resume", "category": "Minimalist", "ats_rating": 100, "popularity": 85, "color_theme": "slate", "is_enabled": True, "is_premium": False, "is_ats_optimized": True, "html_content": "<div class='theme-slate font-sans'>Minimal Layout</div>", "reportlab_code": '{"margins": [45, 45, 45, 45], "primary_color": "#475569"}'},
            {"id": 10, "slug": "twocolumn", "name": "Two Column ATS Resume", "category": "Modern", "ats_rating": 96, "popularity": 80, "color_theme": "blue", "is_enabled": True, "is_premium": False, "is_ats_optimized": True, "html_content": "<div class='theme-blue font-sans'>Two Column Layout</div>", "reportlab_code": '{"margins": [40, 40, 40, 40], "primary_color": "#2563EB"}'},
            # Premium templates
            {"id": 11, "slug": "stanford", "name": "Stanford Resume", "category": "Academic", "ats_rating": 99, "popularity": 75, "color_theme": "red", "is_enabled": True, "is_premium": True, "is_ats_optimized": True, "html_content": "", "reportlab_code": ""},
            {"id": 12, "slug": "oxford", "name": "Oxford Resume", "category": "Academic", "ats_rating": 99, "popularity": 70, "color_theme": "blue", "is_enabled": True, "is_premium": True, "is_ats_optimized": True, "html_content": "", "reportlab_code": ""},
            {"id": 13, "slug": "ivyleague", "name": "Ivy League Resume", "category": "Executive", "ats_rating": 98, "popularity": 65, "color_theme": "indigo", "is_enabled": True, "is_premium": True, "is_ats_optimized": True, "html_content": "", "reportlab_code": ""},
            {"id": 14, "slug": "corporate", "name": "Corporate Resume", "category": "Professional", "ats_rating": 97, "popularity": 60, "color_theme": "slate", "is_enabled": True, "is_premium": True, "is_ats_optimized": True, "html_content": "", "reportlab_code": ""},
            {"id": 15, "slug": "startup", "name": "Startup Resume", "category": "Creative", "ats_rating": 96, "popularity": 55, "color_theme": "purple", "is_enabled": True, "is_premium": True, "is_ats_optimized": True, "html_content": "", "reportlab_code": ""},
            {"id": 16, "slug": "developer", "name": "Developer Resume", "category": "Technical", "ats_rating": 98, "popularity": 50, "color_theme": "slate", "is_enabled": True, "is_premium": True, "is_ats_optimized": True, "html_content": "", "reportlab_code": ""},
            {"id": 17, "slug": "datascientist", "name": "Data Scientist Resume", "category": "Technical", "ats_rating": 99, "popularity": 45, "color_theme": "blue", "is_enabled": True, "is_premium": True, "is_ats_optimized": True, "html_content": "", "reportlab_code": ""},
            {"id": 18, "slug": "aiengineer", "name": "AI Engineer Resume", "category": "Technical", "ats_rating": 100, "popularity": 40, "color_theme": "emerald", "is_enabled": True, "is_premium": True, "is_ats_optimized": True, "html_content": "", "reportlab_code": ""},
            {"id": 19, "slug": "cybersecurity", "name": "Cyber Security Resume", "category": "Technical", "ats_rating": 98, "popularity": 35, "color_theme": "red", "is_enabled": True, "is_premium": True, "is_ats_optimized": True, "html_content": "", "reportlab_code": ""},
            {"id": 20, "slug": "devops", "name": "DevOps Resume", "category": "Technical", "ats_rating": 98, "popularity": 30, "color_theme": "orange", "is_enabled": True, "is_premium": True, "is_ats_optimized": True, "html_content": "", "reportlab_code": ""},
            {"id": 21, "slug": "cloudengineer", "name": "Cloud Engineer Resume", "category": "Technical", "ats_rating": 97, "popularity": 25, "color_theme": "blue", "is_enabled": True, "is_premium": True, "is_ats_optimized": True, "html_content": "", "reportlab_code": ""},
            {"id": 22, "slug": "businessanalyst", "name": "Business Analyst Resume", "category": "Professional", "ats_rating": 97, "popularity": 20, "color_theme": "slate", "is_enabled": True, "is_premium": True, "is_ats_optimized": True, "html_content": "", "reportlab_code": ""},
            {"id": 23, "slug": "finance", "name": "Finance Resume", "category": "Professional", "ats_rating": 98, "popularity": 15, "color_theme": "blue", "is_enabled": True, "is_premium": True, "is_ats_optimized": True, "html_content": "", "reportlab_code": ""},
            {"id": 24, "slug": "marketing", "name": "Marketing Resume", "category": "Creative", "ats_rating": 96, "popularity": 10, "color_theme": "pink", "is_enabled": True, "is_premium": True, "is_ats_optimized": True, "html_content": "", "reportlab_code": ""},
            {"id": 25, "slug": "sales", "name": "Sales Resume", "category": "Professional", "ats_rating": 96, "popularity": 5, "color_theme": "orange", "is_enabled": True, "is_premium": True, "is_ats_optimized": True, "html_content": "", "reportlab_code": ""},
            {"id": 26, "slug": "hr", "name": "HR Resume", "category": "Professional", "ats_rating": 97, "popularity": 5, "color_theme": "purple", "is_enabled": True, "is_premium": True, "is_ats_optimized": True, "html_content": "", "reportlab_code": ""},
            {"id": 27, "slug": "teacher", "name": "Teacher Resume", "category": "Entry Level", "ats_rating": 97, "popularity": 5, "color_theme": "green", "is_enabled": True, "is_premium": True, "is_ats_optimized": True, "html_content": "", "reportlab_code": ""},
            {"id": 28, "slug": "medical", "name": "Medical Resume", "category": "Professional", "ats_rating": 98, "popularity": 5, "color_theme": "blue", "is_enabled": True, "is_premium": True, "is_ats_optimized": True, "html_content": "", "reportlab_code": ""},
            {"id": 29, "slug": "mba", "name": "MBA Resume", "category": "Executive", "ats_rating": 99, "popularity": 5, "color_theme": "blue", "is_enabled": True, "is_premium": True, "is_ats_optimized": True, "html_content": "", "reportlab_code": ""},
            {"id": 30, "slug": "law", "name": "Law Resume", "category": "Academic", "ats_rating": 98, "popularity": 5, "color_theme": "slate", "is_enabled": True, "is_premium": True, "is_ats_optimized": True, "html_content": "", "reportlab_code": ""},
            {"id": 31, "slug": "research", "name": "Research Resume", "category": "Academic", "ats_rating": 99, "popularity": 5, "color_theme": "slate", "is_enabled": True, "is_premium": True, "is_ats_optimized": True, "html_content": "", "reportlab_code": ""},
            {"id": 32, "slug": "productmanager", "name": "Product Manager Resume", "category": "Executive", "ats_rating": 98, "popularity": 5, "color_theme": "blue", "is_enabled": True, "is_premium": True, "is_ats_optimized": True, "html_content": "", "reportlab_code": ""},
            {"id": 33, "slug": "uiuxdesigner", "name": "UI UX Designer Resume", "category": "Creative", "ats_rating": 95, "popularity": 5, "color_theme": "purple", "is_enabled": True, "is_premium": True, "is_ats_optimized": True, "html_content": "", "reportlab_code": ""},
            {"id": 34, "slug": "graphicdesigner", "name": "Graphic Designer Resume", "category": "Creative", "ats_rating": 94, "popularity": 5, "color_theme": "pink", "is_enabled": True, "is_premium": True, "is_ats_optimized": True, "html_content": "", "reportlab_code": ""},
            {"id": 35, "slug": "consultant", "name": "Consultant Resume", "category": "Professional", "ats_rating": 98, "popularity": 5, "color_theme": "slate", "is_enabled": True, "is_premium": True, "is_ats_optimized": True, "html_content": "", "reportlab_code": ""},
            {"id": 36, "slug": "government", "name": "Government Resume", "category": "Minimalist", "ats_rating": 99, "popularity": 5, "color_theme": "slate", "is_enabled": True, "is_premium": True, "is_ats_optimized": True, "html_content": "", "reportlab_code": ""},
            {"id": 37, "slug": "international", "name": "International Resume", "category": "Professional", "ats_rating": 97, "popularity": 5, "color_theme": "blue", "is_enabled": True, "is_premium": True, "is_ats_optimized": True, "html_content": "", "reportlab_code": ""},
            {"id": 38, "slug": "internship", "name": "Internship Resume", "category": "Entry Level", "ats_rating": 98, "popularity": 5, "color_theme": "emerald", "is_enabled": True, "is_premium": True, "is_ats_optimized": True, "html_content": "", "reportlab_code": ""},
            {"id": 39, "slug": "graduate", "name": "Graduate Resume", "category": "Entry Level", "ats_rating": 98, "popularity": 5, "color_theme": "blue", "is_enabled": True, "is_premium": True, "is_ats_optimized": True, "html_content": "", "reportlab_code": ""},
            {"id": 40, "slug": "academic_cv", "name": "Academic CV", "category": "Academic", "ats_rating": 99, "popularity": 5, "color_theme": "slate", "is_enabled": True, "is_premium": True, "is_ats_optimized": True, "html_content": "", "reportlab_code": ""}
        ]
        db.resume_templates.insert_many(templates_list)
        db.counters.update_one({"_id": "resume_templates"}, {"$set": {"seq": 40}}, upsert=True)
        print(f"Seeded {len(templates_list)} resume templates.")
            
        print("Successfully initialized and seeded MongoDB database!")
    except Exception as e:
        print(f"Error seeding MongoDB database: {e}")
