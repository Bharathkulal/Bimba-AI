from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Float
from sqlalchemy.sql import func
from app.database.base import Base

class ResumeMaster(Base):
    __tablename__ = "resume_master"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    resume_type = Column(String, default="Fresher")  # "Fresher" | "Internship" | "Experienced"
    target_role = Column(String, nullable=True)
    career_objective = Column(Text, nullable=True)
    preferred_industry = Column(String, nullable=True)
    language = Column(String, default="English")
    expected_salary = Column(String, nullable=True)
    visibility = Column(String, default="Private")  # "Public" | "Private"
    template_id = Column(String, default="modern")
    color_theme = Column(String, default="blue")
    status = Column(String, default="Draft")  # "Draft" | "Completed" | "Archived"
    ats_score = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())

class ResumeVersion(Base):
    __tablename__ = "resume_studio_versions"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resume_master.id", ondelete="CASCADE"), nullable=False)
    version_number = Column(Integer, nullable=False)
    name = Column(String, nullable=False)
    data = Column(Text, nullable=False)  # JSON dump of full resume data state
    ats_score = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=func.now())

class ResumeEducation(Base):
    __tablename__ = "resume_education"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resume_master.id", ondelete="CASCADE"), nullable=False)
    institution = Column(String, nullable=False)
    degree = Column(String, nullable=False)  # "10th" | "12th" | "BCA" | "CS" etc.
    board = Column(String, nullable=True)
    percentage = Column(Float, nullable=True)
    cgpa = Column(Float, nullable=True)
    passing_year = Column(Integer, nullable=False)
    achievements = Column(Text, nullable=True)

class ResumeExperience(Base):
    __tablename__ = "resume_experience"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resume_master.id", ondelete="CASCADE"), nullable=False)
    company = Column(String, nullable=False)
    position = Column(String, nullable=False)
    duration = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    achievements = Column(Text, nullable=True)

class ResumeProject(Base):
    __tablename__ = "resume_projects"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resume_master.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    tech_stack = Column(String, nullable=False)  # comma separated or text
    role = Column(String, nullable=True)
    duration = Column(String, nullable=True)
    github_link = Column(String, nullable=True)
    live_demo = Column(String, nullable=True)
    achievements = Column(Text, nullable=True)

class ResumeSkill(Base):
    __tablename__ = "resume_skills"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resume_master.id", ondelete="CASCADE"), nullable=False)
    category = Column(String, nullable=False)  # "Programming" | "Web" | "Databases" etc.
    name = Column(String, nullable=False)
    level = Column(Integer, default=3)  # Rating 1-5

class ResumeCertificate(Base):
    __tablename__ = "resume_certificates"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resume_master.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    organization = Column(String, nullable=False)
    issue_date = Column(String, nullable=True)
    credential_id = Column(String, nullable=True)
    credential_url = Column(String, nullable=True)

class ResumeTemplate(Base):
    __tablename__ = "resume_templates"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True, nullable=False)  # "modern" | "ats" etc.
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    ats_rating = Column(Integer, default=95)
    popularity = Column(Integer, default=100)
    color_theme = Column(String, default="blue")
    thumbnail = Column(String, nullable=True)

class ResumeDownload(Base):
    __tablename__ = "resume_downloads"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resume_master.id", ondelete="CASCADE"), nullable=False)
    format = Column(String, nullable=False)  # "PDF" | "DOCX"
    created_at = Column(DateTime(timezone=True), default=func.now())

class ResumeATS(Base):
    __tablename__ = "resume_ats"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resume_master.id", ondelete="CASCADE"), nullable=False)
    overall_score = Column(Integer, default=70)
    formatting_score = Column(Integer, default=70)
    keyword_match = Column(Integer, default=70)
    grammar_score = Column(Integer, default=70)
    readability_score = Column(Integer, default=70)
    recruiter_score = Column(Integer, default=70)
    missing_keywords = Column(Text, nullable=True)
    suggestions = Column(Text, nullable=True)
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())

class ResumeAILog(Base):
    __tablename__ = "resume_ai_logs"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resume_master.id", ondelete="CASCADE"), nullable=False)
    action_type = Column(String, nullable=False)  # "summary" | "rewrite" | "ats_optimization" etc.
    prompt_used = Column(Text, nullable=True)
    response_received = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=func.now())

class CareerReadiness(Base):
    __tablename__ = "career_readiness"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resume_master.id", ondelete="CASCADE"), nullable=True)
    readiness_score = Column(Integer, default=70)
    job_readiness = Column(String, default="Ready")  # "Ready" | "Needs Improvement"
    skill_gap = Column(Text, nullable=True)
    recommended_certifications = Column(Text, nullable=True)
    recommended_projects = Column(Text, nullable=True)
    recommended_courses = Column(Text, nullable=True)
    interview_readiness = Column(Integer, default=70)
    learning_roadmap = Column(Text, nullable=True)
