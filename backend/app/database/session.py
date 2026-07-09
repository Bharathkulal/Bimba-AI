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
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Seed development record
    db = SessionLocal()
    try:
        # Check if the dev record exists
        test_student = db.query(Student).filter(Student.roll_number == "BCA25008").first()
        if not test_student:
            new_student = Student(
                roll_number="BCA25008",
                date_of_birth="29-05-2007",
                personal_email="bharathkulal2007@gmail.com",
                department="CS",
                semester=3,
                status="Active",
                is_activated=False,
                email_verified=False
            )
            db.add(new_student)
            db.commit()
            print("Successfully seeded development student: BCA25008")
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        db.close()
