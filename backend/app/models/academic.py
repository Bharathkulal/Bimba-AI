from sqlalchemy import Column, Integer, String, ForeignKey
from app.database.session import Base

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    hod_name = Column(String, nullable=True)
    status = Column(String, default="Active")  # "Active" | "Disabled"
    student_count = Column(Integer, default=0)
    subject_count = Column(Integer, default=0)
    faculty_count = Column(Integer, default=0)

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    semester = Column(Integer, nullable=False)
    credits = Column(Integer, default=3)
    faculty_name = Column(String, nullable=True)
    status = Column(String, default="Active")  # "Active" | "Archived"
    students_enrolled = Column(Integer, default=0)
