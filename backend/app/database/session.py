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
    from app.models.otp import OTP
    from app.models.analytics import Resume, ResumeVersion, AIUsageLog, EditingSession, DownloadLog, ActivityLog
    from app.models.ai_admin import AIProvider, AIGatewayLog, AISystemSettings
    from datetime import datetime, timedelta, timezone
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Seed development record
    db = SessionLocal()
    try:
        # Check if the dev record exists
        test_student = db.query(Student).filter(Student.roll_number == "BCA25008").first()
        if not test_student:
            test_student = Student(
                roll_number="BCA25008",
                date_of_birth="29-05-2007",
                personal_email="bharathkulal2007@gmail.com",
                department="CS",
                semester=3,
                status="Active",
                is_activated=False,
                email_verified=False
            )
            db.add(test_student)
            db.commit()
            db.refresh(test_student)
            print("Successfully seeded development student: BCA25008")

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
