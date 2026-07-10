from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Attempt to connect to Postgres, fallback to SQLite if it fails
try:
    # If the URL is postgresql and connection fails, we catch it
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
    )
    # Quick connectivity test
    with engine.connect() as conn:
        pass
    print("Successfully connected to PostgreSQL database.")
except Exception as e:
    print(f"PostgreSQL connection failed: {e}")
    print("Falling back to local SQLite database (sqlite:///./bimba_ai.db)...")
    # Override settings URL
    settings.DATABASE_URL = "sqlite:///./bimba_ai.db"
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False}
    )

# SessionLocal factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative Base
Base = declarative_base()

# Dependency to get db session in FastAPI routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    # Import models to register them on Base.metadata
    from app.models.student import Student
    from app.models.otp_verification import OTPVerification
    from app.models.login_history import LoginHistory
    from app.models.analytics import Resume, ResumeVersion, AIUsageLog, EditingSession, DownloadLog, ActivityLog
    from app.models.ai_admin import AIProvider, AIGatewayLog, AISystemSettings
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
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Seed development record
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

        # Seed notifications
        notification_count = db.query(Notification).count()
        if notification_count == 0:
            n1 = Notification(type="Dataset Imported", message="Student directory batch file 'student_list_v1.csv' has been imported. 120 records created.")
            n2 = Notification(type="Backup Completed", message="Automatic daily database backup generated successfully: backup_2026_07_10.db")
            db.add_all([n1, n2])
            db.commit()
            print("Successfully seeded notification logs")

        # Seed initial system health stats
        health_count = db.query(SystemHealth).count()
        if health_count == 0:
            h = SystemHealth(cpu_usage=24.5, ram_usage=62.1, disk_usage=45.8, db_health="Healthy", api_health="Healthy", latency_ms=120, db_queries_count=1200, request_rate=15)
            db.add(h)
            db.commit()

        # Seed default templates
        tpl_count = db.query(ResumeTemplate).count()
        if tpl_count == 0:
            templates = [
                ResumeTemplate(slug="professional", name="Professional", category="Professional", ats_rating=97, popularity=95, color_theme="blue", thumbnail=""),
                ResumeTemplate(slug="ats_friendly", name="ATS Friendly", category="ATS Friendly", ats_rating=99, popularity=98, color_theme="slate", thumbnail=""),
                ResumeTemplate(slug="modern", name="Modern", category="Modern", ats_rating=96, popularity=94, color_theme="indigo", thumbnail=""),
                ResumeTemplate(slug="minimal", name="Minimal", category="Minimal", ats_rating=95, popularity=90, color_theme="emerald", thumbnail=""),
                ResumeTemplate(slug="corporate", name="Corporate", category="Corporate", ats_rating=97, popularity=92, color_theme="blue", thumbnail=""),
                ResumeTemplate(slug="creative", name="Creative", category="Creative", ats_rating=92, popularity=88, color_theme="violet", thumbnail=""),
                ResumeTemplate(slug="developer", name="Developer", category="Developer", ats_rating=98, popularity=97, color_theme="zinc", thumbnail=""),
                ResumeTemplate(slug="student", name="Student", category="Student", ats_rating=95, popularity=89, color_theme="blue", thumbnail=""),
                ResumeTemplate(slug="classic", name="Classic", category="Classic", ats_rating=94, popularity=85, color_theme="slate", thumbnail=""),
            ]
            db.add_all(templates)
            db.commit()
            print("Successfully seeded resume templates")

        test_student = db.query(Student).filter(Student.roll_number == "BCA25008").first()
        if not test_student:
            test_student = Student(
                roll_number="BCA25008",
                student_name="Bharath Kulal",
                dob="29-05-2007",
                email="bharathkulal2007@gmail.com",
                department="CS",
                semester=3,
                section="A",
                academic_year="2023-2026",
                status="Active",
                account_activated=True,
                otp_verified=True,
                password_hash=get_password_hash("Test@12345")
            )
            db.add(test_student)
            db.commit()
            db.refresh(test_student)
            print("Successfully seeded development student: BCA25008")
        else:
            test_student.account_activated = True
            test_student.otp_verified = True
            test_student.password_hash = get_password_hash("Test@12345")
            db.commit()

        test_student_24001 = db.query(Student).filter(Student.roll_number == "BCA24001").first()
        if not test_student_24001:
            test_student_24001 = Student(
                roll_number="BCA24001",
                student_name="Test Student",
                dob="15-08-2005",
                email="bharathkulal2007@gmail.com",
                department="BCA",
                semester=3,
                section="A",
                academic_year="2024-2027",
                status="Active",
                account_activated=True,
                otp_verified=True,
                password_hash=get_password_hash("Test@12345")
            )
            db.add(test_student_24001)
            db.commit()
            print("Successfully seeded activation test student: BCA24001")
        else:
            test_student_24001.account_activated = True
            test_student_24001.otp_verified = True
            test_student_24001.password_hash = get_password_hash("Test@12345")
            db.commit()

        # Seed analytics data if BCA25008 has no resumes yet
        resumes_count = db.query(Resume).filter(Resume.student_id == test_student.id).count()
        if resumes_count == 0:
            print("Seeding real-time analytics data for BCA25008...")
            
            # 1. Resumes
            r1 = Resume(
                student_id=test_student.id,
                name="Fullstack Engineer Resume",
                template="Celestial",
                personal_info_completed=True,
                summary_completed=True,
                experience_completed=True,
                education_completed=True,
                skills_completed=True,
                projects_completed=True,
                certifications_completed=True,
                languages_completed=False,
                achievements_completed=False,
                ats_score=96,
                status="Draft"
            )
            
            r2 = Resume(
                student_id=test_student.id,
                name="Product Designer CV",
                template="Astral",
                personal_info_completed=True,
                summary_completed=True,
                experience_completed=True,
                education_completed=True,
                skills_completed=False,
                projects_completed=False,
                certifications_completed=False,
                languages_completed=False,
                achievements_completed=False,
                ats_score=72,
                status="Draft"
            )
            
            db.add_all([r1, r2])
            db.commit()
            db.refresh(r1)
            db.refresh(r2)
            
            # 2. Resume Versions (ATS improvements)
            v1_1 = ResumeVersion(resume_id=r1.id, version_number=1, ats_score=67, created_at=datetime.now() - timedelta(days=5))
            v1_2 = ResumeVersion(resume_id=r1.id, version_number=2, ats_score=82, created_at=datetime.now() - timedelta(days=3))
            v1_3 = ResumeVersion(resume_id=r1.id, version_number=3, ats_score=96, created_at=datetime.now() - timedelta(hours=2))
            
            v2_1 = ResumeVersion(resume_id=r2.id, version_number=1, ats_score=60, created_at=datetime.now() - timedelta(days=2))
            v2_2 = ResumeVersion(resume_id=r2.id, version_number=2, ats_score=72, created_at=datetime.now() - timedelta(hours=4))
            
            db.add_all([v1_1, v1_2, v1_3, v2_1, v2_2])
            
            # 3. AI Usage Logs
            ai_logs = [
                AIUsageLog(student_id=test_student.id, action_type="generation", time_saved_minutes=15, created_at=datetime.now() - timedelta(days=6)),
                AIUsageLog(student_id=test_student.id, action_type="improvement", time_saved_minutes=10, created_at=datetime.now() - timedelta(days=5)),
                AIUsageLog(student_id=test_student.id, action_type="chat", time_saved_minutes=5, created_at=datetime.now() - timedelta(days=4)),
                AIUsageLog(student_id=test_student.id, action_type="cover_letter", time_saved_minutes=20, created_at=datetime.now() - timedelta(days=3)),
                AIUsageLog(student_id=test_student.id, action_type="summary", time_saved_minutes=8, created_at=datetime.now() - timedelta(days=2)),
                AIUsageLog(student_id=test_student.id, action_type="keyword", time_saved_minutes=6, created_at=datetime.now() - timedelta(days=1)),
                AIUsageLog(student_id=test_student.id, action_type="rewrite", time_saved_minutes=12, created_at=datetime.now() - timedelta(hours=3)),
            ]
            db.add_all(ai_logs)
            
            # 4. Editing Sessions
            edit_sessions = [
                EditingSession(student_id=test_student.id, start_time=datetime.now() - timedelta(days=6, hours=2), end_time=datetime.now() - timedelta(days=6, hours=1, minutes=40), duration_seconds=1200),
                EditingSession(student_id=test_student.id, start_time=datetime.now() - timedelta(days=5, hours=3), end_time=datetime.now() - timedelta(days=5, hours=2, minutes=15), duration_seconds=2700),
                EditingSession(student_id=test_student.id, start_time=datetime.now() - timedelta(days=3, hours=1), end_time=datetime.now() - timedelta(days=3, hours=0, minutes=20), duration_seconds=2400),
                EditingSession(student_id=test_student.id, start_time=datetime.now() - timedelta(hours=3), end_time=datetime.now() - timedelta(hours=2), duration_seconds=3600),
            ]
            db.add_all(edit_sessions)
            
            # 5. Download Logs
            download_logs = [
                DownloadLog(student_id=test_student.id, format="PDF", created_at=datetime.now() - timedelta(days=5)),
                DownloadLog(student_id=test_student.id, format="DOCX", created_at=datetime.now() - timedelta(days=3)),
                DownloadLog(student_id=test_student.id, format="PDF", created_at=datetime.now() - timedelta(hours=2)),
                DownloadLog(student_id=test_student.id, format="Share", created_at=datetime.now() - timedelta(hours=1)),
            ]
            db.add_all(download_logs)
            
            # 6. Activity Logs
            activity_logs = [
                ActivityLog(student_id=test_student.id, activity="Created Resume: Fullstack Engineer Resume", created_at=datetime.now() - timedelta(days=6)),
                ActivityLog(student_id=test_student.id, activity="Generated Cover Letter with AI", created_at=datetime.now() - timedelta(days=3)),
                ActivityLog(student_id=test_student.id, activity="Improved ATS Score to 96%", created_at=datetime.now() - timedelta(hours=2, minutes=15)),
                ActivityLog(student_id=test_student.id, activity="Downloaded Resume: PDF Format", created_at=datetime.now() - timedelta(hours=2)),
                ActivityLog(student_id=test_student.id, activity="Edited Resume Details", created_at=datetime.now() - timedelta(hours=1)),
            ]
            db.add_all(activity_logs)
            
            db.commit()
            print("Successfully seeded all real-time analytics data!")
            
        # Seed AI admin default settings and providers if they don't exist yet
        providers_count = db.query(AIProvider).count()
        if providers_count == 0:
            print("Seeding AI Providers and Admin settings...")
            from app.utils.crypto import encrypt_key
            
            p1 = AIProvider(
                name="Gemini",
                slug="gemini",
                encrypted_api_key=encrypt_key("AIzaSyB1-mockGeminiKey92348572"),
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
                encrypted_api_key=encrypt_key("sk-or-v1-mockOpenRouterKey2384723"),
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
                encrypted_api_key=encrypt_key("gsk_mockGroqAPIKey238472938479"),
                priority=3,
                is_active=True,
                status="Connected",
                today_requests=6,
                latency_ms=450,
                success_rate=100
            )
            
            db.add_all([p1, p2, p3])
            
            # Seed default system settings
            settings = AISystemSettings(
                auto_retry=True,
                fallback=True,
                ai_timeout=20,
                request_limit=50,
                log_retention=90,
                debug=False
            )
            db.add(settings)
            
            # Seed gateway activity logs
            db.add_all([
                AIGatewayLog(provider="Gemini", feature="Resume Generator", status="Success", latency_ms=812, user_roll="BCA25008"),
                AIGatewayLog(provider="Gemini", feature="Resume Improve", status="Success", latency_ms=640, user_roll="BCA25008"),
                AIGatewayLog(provider="OpenRouter", feature="ATS Analysis", status="Success", latency_ms=1150, user_roll="BCA25008"),
                AIGatewayLog(provider="Groq", feature="AI Chat Assistant", status="Success", latency_ms=420, user_roll="BCA25008"),
                AIGatewayLog(provider="Gemini", feature="Cover Letter", status="Failed", latency_ms=2500, user_roll="BCA25008"),
            ])
            db.commit()
            print("Successfully seeded default AI Management config and logs!")
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        db.close()
