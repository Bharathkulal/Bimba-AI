from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database.base import Base

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    name = Column(String, nullable=False)
    template = Column(String, default="Standard")
    
    # Section completion flags
    personal_info_completed = Column(Boolean, default=False)
    summary_completed = Column(Boolean, default=False)
    experience_completed = Column(Boolean, default=False)
    education_completed = Column(Boolean, default=False)
    skills_completed = Column(Boolean, default=False)
    projects_completed = Column(Boolean, default=False)
    certifications_completed = Column(Boolean, default=False)
    languages_completed = Column(Boolean, default=False)
    achievements_completed = Column(Boolean, default=False)
    
    ats_score = Column(Integer, default=70)
    last_edited = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    status = Column(String, default="Draft")  # "Draft" | "Completed" | "Archived"

class ResumeVersion(Base):
    __tablename__ = "resume_versions"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    version_number = Column(Integer, nullable=False)
    ats_score = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), default=func.now())

class AIUsageLog(Base):
    __tablename__ = "ai_usage_logs"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    action_type = Column(String, nullable=False)  # "generation" | "improvement" | "chat" | "cover_letter" | "summary" | "keyword" | "rewrite"
    time_saved_minutes = Column(Integer, default=5)
    created_at = Column(DateTime(timezone=True), default=func.now())

class EditingSession(Base):
    __tablename__ = "editing_sessions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    start_time = Column(DateTime(timezone=True), default=func.now())
    end_time = Column(DateTime(timezone=True), default=func.now())
    duration_seconds = Column(Integer, default=0)

class DownloadLog(Base):
    __tablename__ = "download_logs"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    format = Column(String, nullable=False)  # "PDF" | "DOCX" | "Share" | "Print" | "Copy"
    created_at = Column(DateTime(timezone=True), default=func.now())

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    activity = Column(String, nullable=False)  # e.g., "Edited Resume"
    created_at = Column(DateTime(timezone=True), default=func.now())
