from app.database.session import Base
from app.models.student import Student
from app.models.otp_verification import OTPVerification
from app.models.login_history import LoginHistory

__all__ = ["Base", "Student", "OTPVerification", "LoginHistory"]
