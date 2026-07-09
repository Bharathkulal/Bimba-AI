from sqlalchemy import Column, Integer, String, Boolean
from app.database.session import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    roll_number = Column(String, unique=True, index=True, nullable=False)
    date_of_birth = Column(String, nullable=False)  # DD-MM-YYYY
    personal_email = Column(String, nullable=False)
    hashed_password = Column(String, nullable=True)  # Nullable until activated
    department = Column(String, nullable=False)
    semester = Column(Integer, nullable=False)
    status = Column(String, default="Active")
    is_activated = Column(Boolean, default=False)
    email_verified = Column(Boolean, default=False)
