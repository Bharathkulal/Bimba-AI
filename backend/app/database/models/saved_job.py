from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from app.database.base import Base

class SavedJob(Base):
    __tablename__ = "saved_jobs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(String, index=True, nullable=False)
    company = Column(String, nullable=False)
    title = Column(String, nullable=False)
    location = Column(String, nullable=False)
    logo = Column(String, nullable=True)
    saved_at = Column(DateTime(timezone=True), server_default=func.now())

class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(String, index=True, nullable=False)
    company = Column(String, nullable=False)
    title = Column(String, nullable=False)
    logo = Column(String, nullable=True)
    location = Column(String, nullable=True)
    status = Column(String, default="Applied", nullable=False)  # Applied, Interview, Rejected, Offer, Accepted
    application_date = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text, nullable=True)
