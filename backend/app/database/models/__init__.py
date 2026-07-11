from app.database.base import Base
from app.database.models.student import Student
from app.database.models.otp_verification import OTPVerification
from app.database.models.login_history import LoginHistory
from app.database.models.admin_user import AdminUser
from app.database.models.academic import Department, Subject
from app.database.models.communications import Announcement, EmailTemplate, EmailQueueLog, Notification
from app.database.models.system import Backup, DatasetImport, AuditLog, SystemHealth
from app.database.models.resume_studio import (
    ResumeMaster, ResumeVersion as ResumeStudioVersion, ResumeEducation, 
    ResumeExperience, ResumeProject, ResumeSkill, ResumeCertificate, 
    ResumeTemplate, ResumeDownload, ResumeATS, ResumeAILog, CareerReadiness
)

__all__ = [
    "Base", 
    "Student", 
    "OTPVerification", 
    "LoginHistory",
    "AdminUser",
    "Department",
    "Subject",
    "Announcement",
    "EmailTemplate",
    "EmailQueueLog",
    "Notification",
    "Backup",
    "DatasetImport",
    "AuditLog",
    "SystemHealth",
    "ResumeMaster",
    "ResumeStudioVersion",
    "ResumeEducation",
    "ResumeExperience",
    "ResumeProject",
    "ResumeSkill",
    "ResumeCertificate",
    "ResumeTemplate",
    "ResumeDownload",
    "ResumeATS",
    "ResumeAILog",
    "CareerReadiness"
]
