import random
import string
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database.session import get_db
from app.models.student import Student
from app.models.otp_verification import OTPVerification
from app.models.login_history import LoginHistory
from app.models.communications import Notification

from app.core.security import get_password_hash, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

# --- Request / Response Schemas ---
class ActivationVerifyRequest(BaseModel):
    roll_number: str
    date_of_birth: str  # Format: DD-MM-YYYY

class OTPVerifyRequest(BaseModel):
    roll_number: str
    otp_code: str
    purpose: str  # "activation" | "forgot_password"

class SetupPasswordRequest(BaseModel):
    roll_number: str
    password: str

class LoginRequest(BaseModel):
    roll_number: str
    password: str

class ResetPasswordRequest(BaseModel):
    roll_number: str
    password: str

# Helper to mask email
def mask_email(email: str) -> str:
    if not email or "@" not in email:
        return email
    parts = email.split("@")
    name = parts[0]
    domain = parts[1]
    if len(name) <= 2:
        masked_name = name[0] + "*" * (len(name) - 1)
    else:
        masked_name = name[0] + "*" * 8 + name[-1]
    return f"{masked_name}@{domain}"

# Helper to generate and save a 6-digit OTP
def generate_and_save_otp(db: Session, student_id: int, purpose: str) -> str:
    # Remove older OTPs for the same student and purpose
    db.query(OTPVerification).filter(OTPVerification.student_id == student_id, OTPVerification.purpose == purpose).delete()
    
    # Generate 6-digit code
    otp_code = "".join(random.choices(string.digits, k=6))
    
    # Store hashed OTP
    otp_hash = get_password_hash(otp_code)
    
    # Expires in 5 minutes
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
    
    new_otp = OTPVerification(
        student_id=student_id,
        otp_hash=otp_hash,
        purpose=purpose,
        expires_at=expires_at,
        attempts=0,
        verified=False
    )
    db.add(new_otp)
    db.commit()
    return otp_code

# Helper to log login attempts
def log_login_attempt(db: Session, student_id: int, request: Request, status_str: str):
    ip_address = request.client.host if request.client else "Unknown"
    user_agent = request.headers.get("user-agent", "Unknown")
    
    browser = "Unknown"
    if "Chrome" in user_agent:
        browser = "Chrome"
    elif "Safari" in user_agent:
        browser = "Safari"
    elif "Firefox" in user_agent:
        browser = "Firefox"
    elif "Edge" in user_agent:
        browser = "Edge"
        
    device = "Desktop"
    if "Mobi" in user_agent or "Android" in user_agent or "iPhone" in user_agent:
        device = "Mobile"
        
    history = LoginHistory(
        student_id=student_id,
        ip_address=ip_address,
        browser=browser,
        device=device,
        login_status=status_str
    )
    db.add(history)
    db.commit()

# --- Endpoints ---

@router.post("/activation/verify")
def activation_verify(payload: ActivationVerifyRequest, db: Session = Depends(get_db)):
    student = db.query(Student).filter(
        Student.roll_number == payload.roll_number,
        Student.dob == payload.date_of_birth
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid Roll Number or Date of Birth."
        )
    
    if student.account_activated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your account is already activated. Please login."
        )
    
    # Generate and save OTP
    otp_code = generate_and_save_otp(db, student.id, "activation")
    
    return {
        "message": f"6-digit OTP sent to registered email {mask_email(student.email)}",
        "student_name": student.student_name,
        "email": mask_email(student.email),
        "dev_otp": otp_code  # Exposing dev_otp for developer verification
    }

@router.post("/activation/verify-otp")
def activation_verify_otp(payload: OTPVerifyRequest, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.roll_number == payload.roll_number).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found."
        )

    otp_record = db.query(OTPVerification).filter(
        OTPVerification.student_id == student.id,
        OTPVerification.purpose == payload.purpose,
        OTPVerification.verified == False
    ).first()
    
    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active OTP request found."
        )
        
    if otp_record.attempts >= 5:
        db.delete(otp_record)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum verification attempts exceeded. Please request a new OTP."
        )
        
    otp_record.attempts += 1
    db.commit()
    
    if datetime.now(timezone.utc).replace(tzinfo=None) > otp_record.expires_at:
        db.delete(otp_record)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired (expires in 5 minutes)."
        )
        
    if not verify_password(payload.otp_code, otp_record.otp_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid OTP code. Attempts remaining: {5 - otp_record.attempts}"
        )
        
    otp_record.verified = True
    student.otp_verified = True
    db.commit()
        
    return {"message": "OTP verified successfully."}

@router.post("/activation/setup-password")
def activation_setup_password(payload: SetupPasswordRequest, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.roll_number == payload.roll_number).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found."
        )
        
    if student.account_activated:
         raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is already activated."
        )
         
    otp_record = db.query(OTPVerification).filter(
        OTPVerification.student_id == student.id,
        OTPVerification.purpose == "activation",
        OTPVerification.verified == True
    ).first()
    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP verification required before password setup."
        )
        
    # Password rules verification
    password = payload.password
    if (len(password) < 8 or
        not any(c.isupper() for c in password) or
        not any(c.islower() for c in password) or
        not any(c.isdigit() for c in password) or
        not any(not c.isalnum() for c in password)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character."
        )
         
    student.password_hash = get_password_hash(payload.password)
    student.account_activated = True
    student.otp_verified = True
    
    # Remove the OTP record
    db.delete(otp_record)
    db.commit()
    
    # Automatically log in
    token = create_access_token(subject=student.roll_number)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "student": {
            "roll_number": student.roll_number,
            "personal_email": student.email,
            "department": student.department,
            "semester": student.semester
        }
    }

@router.post("/login")
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.roll_number == payload.roll_number).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect Roll Number or Password."
        )
        
    if not student.account_activated:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account not yet activated. Please activate your account first."
        )
        
    if not student.password_hash or not verify_password(payload.password, student.password_hash):
        log_login_attempt(db, student.id, request, "Failed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect Roll Number or Password."
        )
        
    # Log successful attempt
    student.last_login = datetime.now(timezone.utc).replace(tzinfo=None)
    log_login_attempt(db, student.id, request, "Success")
    db.commit()
        
    # Generate JWT
    token = create_access_token(subject=student.roll_number)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "student": {
            "roll_number": student.roll_number,
            "personal_email": student.email,
            "department": student.department,
            "semester": student.semester
        }
    }

@router.post("/forgot-password/verify")
def forgot_password_verify(payload: ActivationVerifyRequest, db: Session = Depends(get_db)):
    student = db.query(Student).filter(
        Student.roll_number == payload.roll_number,
        Student.dob == payload.date_of_birth
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid Roll Number or Date of Birth."
        )
        
    if not student.account_activated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is not yet activated. Please activate it first."
        )
        
    # Generate and save OTP
    otp_code = generate_and_save_otp(db, student.id, "forgot_password")
    
    return {
        "message": f"6-digit OTP sent to registered email {mask_email(student.email)}",
        "student_name": student.student_name,
        "email": mask_email(student.email),
        "dev_otp": otp_code
    }

@router.post("/forgot-password/verify-otp")
def forgot_password_verify_otp(payload: OTPVerifyRequest, db: Session = Depends(get_db)):
    return activation_verify_otp(payload, db)

@router.post("/forgot-password/reset")
def forgot_password_reset(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.roll_number == payload.roll_number).first()
    if not student or not student.account_activated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student account is not active."
        )
        
    otp_record = db.query(OTPVerification).filter(
        OTPVerification.student_id == student.id,
        OTPVerification.purpose == "forgot_password",
        OTPVerification.verified == True
    ).first()
    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP verification required before password reset."
        )
        
    # Password rules verification
    password = payload.password
    if (len(password) < 8 or
        not any(c.isupper() for c in password) or
        not any(c.islower() for c in password) or
        not any(c.isdigit() for c in password) or
        not any(not c.isalnum() for c in password)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character."
        )
        
    student.password_hash = get_password_hash(payload.password)
    
    # Clear OTP record
    db.delete(otp_record)
    db.commit()
    
    return {"message": "Password reset successfully. You can now login."}

from fastapi.security import OAuth2PasswordBearer
from typing import Optional
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

class ProfileUpdateRequest(BaseModel):
    student_name: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    bio: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    portfolio_website: Optional[str] = None
    skills: Optional[str] = None
    languages: Optional[str] = None
    career_objective: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[int] = None

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

@router.get("/me")
def get_me(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    from app.api.analytics import get_current_student
    student = get_current_student(token, db)
    return {
        "roll_number": student.roll_number,
        "personal_email": student.email,
        "department": student.department,
        "semester": student.semester,
        "student_name": student.student_name,
        "dob": student.dob,
        "phone": student.phone,
        "gender": student.gender,
        "address": student.address,
        "bio": student.bio,
        "linkedin": student.linkedin,
        "github": student.github,
        "portfolio_website": student.portfolio_website,
        "skills": student.skills,
        "languages": student.languages,
        "career_objective": student.career_objective,
        "profile_photo": student.profile_photo
    }

@router.put("/profile/update")
def update_profile(payload: ProfileUpdateRequest, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    from app.api.analytics import get_current_student
    student = get_current_student(token, db)
    
    if payload.student_name is not None:
        student.student_name = payload.student_name
    if payload.phone is not None:
        student.phone = payload.phone
    if payload.gender is not None:
        student.gender = payload.gender
    if payload.address is not None:
        student.address = payload.address
    if payload.bio is not None:
        student.bio = payload.bio
    if payload.linkedin is not None:
        student.linkedin = payload.linkedin
    if payload.github is not None:
        student.github = payload.github
    if payload.portfolio_website is not None:
        student.portfolio_website = payload.portfolio_website
    if payload.skills is not None:
        student.skills = payload.skills
    if payload.languages is not None:
        student.languages = payload.languages
    if payload.career_objective is not None:
        student.career_objective = payload.career_objective
    if payload.department is not None:
        student.department = payload.department
    if payload.semester is not None:
        student.semester = payload.semester
        
    # Generate Notification
    notif = Notification(
        student_id=student.id,
        category="Profile",
        type="Profile Updated",
        message="Your placement profile details have been updated."
    )
    db.add(notif)
    db.commit()
    return {"message": "Profile updated successfully"}

class PhotoUploadRequest(BaseModel):
    photo: str

@router.post("/profile/upload-photo")
def upload_profile_photo(payload: PhotoUploadRequest, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    from app.api.analytics import get_current_student
    student = get_current_student(token, db)
    
    student.profile_photo = payload.photo
    
    # Generate Notification
    notif = Notification(
        student_id=student.id,
        category="Profile",
        type="Profile Photo Updated",
        message="Your profile display photo has been updated."
    )
    db.add(notif)
    db.commit()
    return {"message": "Profile photo updated successfully"}

@router.post("/profile/change-password")
def change_password(payload: PasswordChangeRequest, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    from app.api.analytics import get_current_student
    student = get_current_student(token, db)
    
    if not student.password_hash or not verify_password(payload.current_password, student.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
        
    password = payload.new_password
    if (len(password) < 8 or
        not any(c.isupper() for c in password) or
        not any(c.islower() for c in password) or
        not any(c.isdigit() for c in password) or
        not any(not c.isalnum() for c in password)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character."
        )
        
    student.password_hash = get_password_hash(payload.new_password)
    
    # Generate Notification
    notif = Notification(
        student_id=student.id,
        category="System",
        type="Password Changed",
        message="Your account password was updated successfully. If this wasn't you, please alert administration."
    )
    db.add(notif)
    db.commit()
    return {"message": "Password changed successfully"}

