from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from app.database.base import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    roll_number = Column(String, unique=True, index=True, nullable=False)
    student_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    dob = Column(String, nullable=False)  # DD-MM-YYYY
    department = Column(String, nullable=False)
    semester = Column(Integer, nullable=False)
    section = Column(String, nullable=True)
    academic_year = Column(String, nullable=True)
    status = Column(String, default="Active")
    password_hash = Column(String, nullable=True)
    account_activated = Column(Boolean, default=False)
    otp_verified = Column(Boolean, default=False)
    last_login = Column(DateTime, nullable=True)
    
    # Profile management fields
    phone = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    address = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    linkedin = Column(String, nullable=True)
    github = Column(String, nullable=True)
    portfolio_website = Column(String, nullable=True)
    skills = Column(Text, nullable=True)
    languages = Column(String, nullable=True)
    career_objective = Column(Text, nullable=True)
    profile_photo = Column(Text, nullable=True)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


    # Compatibility properties for old code if any exists
    @property
    def personal_email(self):
        return self.email
        
    @property
    def date_of_birth(self):
        return self.dob
        
    @property
    def is_activated(self):
        return self.account_activated
