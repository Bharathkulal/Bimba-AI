from app.database.session import Base
from app.models.student import Student
from app.models.otp_verification import OTPVerification
from app.models.login_history import LoginHistory
from app.models.admin_user import AdminUser
from app.models.academic import Department, Subject
from app.models.communications import Announcement, EmailTemplate, EmailQueueLog, Notification
from app.models.system import Backup, DatasetImport, AuditLog, SystemHealth
from app.models.resume_studio import (
    ResumeMaster, ResumeVersion as ResumeStudioVersion, ResumeEducation, 
    ResumeExperience, ResumeProject, ResumeSkill, ResumeCertificate, 
    ResumeTemplate, ResumeDownload, ResumeATS, ResumeAILog, CareerReadiness,
    ResumeAnalysis, ResumeImprovementHistory, JobDescriptionOptimization
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
    "CareerReadiness",
    "ResumeAnalysis",
    "ResumeImprovementHistory",
    "JobDescriptionOptimization"
]

