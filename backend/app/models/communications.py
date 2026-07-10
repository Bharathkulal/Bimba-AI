from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from app.database.session import Base

class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    status = Column(String, default="Published")  # "Published" | "Draft" | "Scheduled" | "Archive"
    pinned = Column(Boolean, default=False)
    attachment_pdf = Column(String, nullable=True)
    attachment_image = Column(String, nullable=True)
    target_audience = Column(String, default="Entire College")  # "Entire College" | "Department" | "Semester" | "Section" | "Individual Student"
    target_value = Column(String, nullable=True)
    delivery_status = Column(String, default="Sent")
    read_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=func.now())

class EmailTemplate(Base):
    __tablename__ = "email_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    subject = Column(String, nullable=False)
    body = Column(Text, nullable=False)

class EmailQueueLog(Base):
    __tablename__ = "email_logs"

    id = Column(Integer, primary_key=True, index=True)
    recipient = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    status = Column(String, default="Queued")  # "Queued" | "Sent" | "Failed"
    error_message = Column(String, nullable=True)
    scheduled_time = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=func.now())

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)  # "Student Activated" | "Dataset Imported" | "Announcement Published" | "Backup Completed" | "AI Provider Error" | "SMTP Failure" | "Server Error"
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=func.now())
