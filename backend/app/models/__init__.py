from app.models.student import Student
from app.models.admin_user import AdminUser
from app.models.ai_admin import AIProvider, AIGatewayLog, AISystemSettings, AIModel, AIPrompt, AIUsage
from app.models.analytics import Resume, ResumeVersion, AIUsageLog, EditingSession, DownloadLog, ActivityLog
from app.models.saved_job import SavedJob, JobApplication
from app.models.resume_studio import (
    ResumeMaster, ResumeVersion as ResumeStudioVersion, ResumeEducation,
    ResumeExperience, ResumeProject, ResumeSkill, ResumeCertificate,
    ResumeTemplate, ResumeDownload, ResumeATS, ResumeAILog, CareerReadiness
)
from app.models.academic import Department, Subject
from app.models.communications import Announcement, EmailTemplate, EmailQueueLog, Notification
from app.models.login_history import LoginHistory
from app.models.otp import OTP
from app.models.otp_verification import OTPVerification
from app.models.system import Backup, DatasetImport, AuditLog, SystemHealth
