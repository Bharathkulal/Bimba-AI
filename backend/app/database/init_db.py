from app.database.base import Base
from app.database.database import engine
from app.database.session import SessionLocal

def init_db():
    # Import models to register them on Base.metadata
    from app.models.student import Student
    from app.models.otp_verification import OTPVerification
    from app.models.login_history import LoginHistory
    from app.models.analytics import Resume, ResumeVersion, AIUsageLog, EditingSession, DownloadLog, ActivityLog
    from app.models.ai_admin import AIProvider, AIGatewayLog, AISystemSettings, AIModel, AIPrompt, AIUsage
    from app.models.admin_user import AdminUser
    from app.models.academic import Department, Subject
    from app.models.communications import Announcement, EmailTemplate, EmailQueueLog, Notification
    from app.models.system import Backup, DatasetImport, AuditLog, SystemHealth
    from app.models.resume_studio import (
        ResumeMaster, ResumeVersion as ResumeStudioVersion, ResumeEducation, 
        ResumeExperience, ResumeProject, ResumeSkill, ResumeCertificate, 
        ResumeTemplate, ResumeDownload, ResumeATS, ResumeAILog, CareerReadiness
    )
    from datetime import datetime, timedelta, timezone
    from app.core.security import get_password_hash
    import random
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Seed development records
    db = SessionLocal()
    try:
        # Seed Admin User if none exists
        admin_count = db.query(AdminUser).count()
        if admin_count == 0:
            super_admin = AdminUser(
                username="admin",
                email="admin@bimba.ai",
                password_hash=get_password_hash("admin"),
                role="super_admin",
                is_active=True
            )
            moderator = AdminUser(
                username="moderator",
                email="mod@bimba.ai",
                password_hash=get_password_hash("moderator"),
                role="moderator",
                is_active=True
            )
            db.add_all([super_admin, moderator])
            db.commit()
            print("Successfully seeded admin users (admin, moderator)")

        # Seed initial departments
        dept_count = db.query(Department).count()
        if dept_count == 0:
            cs_dept = Department(
                code="CS",
                name="Computer Science & Engineering",
                description="Core computer systems and algorithms engineering department.",
                hod_name="Dr. Alan Turing",
                status="Active",
                student_count=120,
                subject_count=12,
                faculty_count=8
            )
            bca_dept = Department(
                code="BCA",
                name="Bachelor of Computer Applications",
                description="Practical software applications and systems deployment.",
                hod_name="Dr. Grace Hopper",
                status="Active",
                student_count=85,
                subject_count=10,
                faculty_count=6
            )
            db.add_all([cs_dept, bca_dept])
            db.commit()
            print("Successfully seeded departments")

        # Seed initial subjects
        sub_count = db.query(Subject).count()
        if sub_count == 0:
            cs = db.query(Department).filter(Department.code == "CS").first()
            bca = db.query(Department).filter(Department.code == "BCA").first()
            if cs and bca:
                s1 = Subject(code="CS301", name="Database Management Systems", department_id=cs.id, semester=3, credits=4, faculty_name="Prof. John Doe", status="Active", students_enrolled=45)
                s2 = Subject(code="CS302", name="Operating Systems", department_id=cs.id, semester=3, credits=3, faculty_name="Prof. Jane Smith", status="Active", students_enrolled=45)
                s3 = Subject(code="BCA301", name="Web Technologies", department_id=bca.id, semester=3, credits=3, faculty_name="Prof. Bob Johnson", status="Active", students_enrolled=40)
                db.add_all([s1, s2, s3])
                db.commit()
                print("Successfully seeded subjects")

        # Seed email templates
        template_count = db.query(EmailTemplate).count()
        if template_count == 0:
            t1 = EmailTemplate(name="OTP", subject="Your Bimba AI One-Time Password", body="Hello, your OTP verification code is {{otp}}. This code is valid for 10 minutes.")
            t2 = EmailTemplate(name="Welcome", subject="Welcome to Bimba AI Portal", body="Hello {{student_name}},\n\nYour account has been successfully created. Welcome aboard!")
            t3 = EmailTemplate(name="Password Reset", subject="Bimba AI Password Reset Request", body="Hello, click the following link to reset your password: {{reset_link}}")
            t4 = EmailTemplate(name="Announcement", subject="New Academic Announcement", body="Dear Students,\n\nA new announcement has been published:\n\n{{announcement_title}}\n\n{{announcement_content}}")
            t5 = EmailTemplate(name="Resume Ready", subject="Your AI Resume is Ready!", body="Great news! Your resume has been optimized with our AI gateway and is ready for download.")
            db.add_all([t1, t2, t3, t4, t5])
            db.commit()
            print("Successfully seeded email templates")

        # Seed AI default settings and providers if they don't exist yet
        providers_count = db.query(AIProvider).count()
        if providers_count == 0:
            print("Seeding AI Providers and Admin settings...")
            
            p1 = AIProvider(
                name="Gemini",
                slug="gemini",
                encrypted_api_key=None,
                priority=1,
                is_active=True,
                status="Healthy",
                today_requests=102,
                latency_ms=800,
                success_rate=99
            )
            p2 = AIProvider(
                name="OpenRouter",
                slug="openrouter",
                encrypted_api_key=None,
                priority=2,
                is_active=True,
                status="Connected",
                today_requests=10,
                latency_ms=1100,
                success_rate=98
            )
            p3 = AIProvider(
                name="Groq",
                slug="groq",
                encrypted_api_key=None,
                priority=3,
                is_active=True,
                status="Connected",
                today_requests=6,
                latency_ms=450,
                success_rate=100
            )
            db.add_all([p1, p2, p3])
            
            settings = AISystemSettings(
                auto_retry=True,
                fallback=True,
                ai_timeout=20,
                request_limit=50,
                log_retention=90,
                debug=False
            )
            db.add(settings)
            db.commit()
            print("Successfully seeded default AI configuration!")

        # Seed default students
        student_count = db.query(Student).count()
        if student_count == 0:
            print("Seeding students...")
            s1 = Student(
                roll_number="BCA24001",
                student_name="John Doe",
                email="student@bimba.ai",
                dob="15-08-2005",
                department="BCA",
                semester=3,
                status="Active",
                password_hash=get_password_hash("Test@12345"),
                account_activated=True,
                otp_verified=True
            )
            s2 = Student(
                roll_number="BCA24002",
                student_name="Jane Smith",
                email="jane@bimba.ai",
                dob="01-01-2005",
                department="BCA",
                semester=3,
                status="Active",
                password_hash=get_password_hash("Test@12345"),
                account_activated=True,
                otp_verified=True
            )
            db.add_all([s1, s2])
            db.commit()
            print("Successfully seeded student data!")
            
    except Exception as e:
        print(f"Error seeding database in init_db: {e}")
    finally:
        db.close()
