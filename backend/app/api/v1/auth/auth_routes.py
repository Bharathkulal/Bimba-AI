import random
import string
from datetime import datetime, timedelta, timezone
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel

from app.database.session import get_db
from app.models.student import Student
from app.models.otp_verification import OTPVerification
from app.models.login_history import LoginHistory
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
def generate_and_save_otp(db: Any, student_id: int, purpose: str) -> str:
    # Remove older OTPs for the same student and purpose
    db.otp_verifications.delete_many({"student_id": student_id, "purpose": purpose})
    
    # Generate 6-digit code
    otp_code = "".join(random.choices(string.digits, k=6))
    
    # Store hashed OTP
    otp_hash = get_password_hash(otp_code)
    
    # Expires in 5 minutes
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    
    db.otp_verifications.insert_one({
        "student_id": student_id,
        "otp_hash": otp_hash,
        "purpose": purpose,
        "expires_at": expires_at,
        "attempts": 0,
        "verified": False
    })
    return otp_code

# Helper to log login attempts
def log_login_attempt(db: Any, student_id: int, request: Request, status_str: str):
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
        
    db.login_histories.insert_one({
        "student_id": student_id,
        "ip_address": ip_address,
        "browser": browser,
        "device": device,
        "login_status": status_str,
        "created_at": datetime.utcnow()
    })

# --- Endpoints ---

@router.post("/activation/verify")
def activation_verify(payload: ActivationVerifyRequest, db: Any = Depends(get_db)):
    student_doc = db.students.find_one({
        "roll_number": payload.roll_number,
        "dob": payload.date_of_birth
    })
    
    if not student_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid Roll Number or Date of Birth."
        )
    
    student = Student(student_doc)
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
def activation_verify_otp(payload: OTPVerifyRequest, db: Any = Depends(get_db)):
    student_doc = db.students.find_one({"roll_number": payload.roll_number})
    if not student_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found."
        )
    
    student = Student(student_doc)

    otp_doc = db.otp_verifications.find_one({
        "student_id": student.id,
        "purpose": payload.purpose,
        "verified": False
    })
    
    if not otp_doc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active OTP request found."
        )
        
    otp_record = OTPVerification(otp_doc)
    if otp_record.attempts >= 5:
        db.otp_verifications.delete_one({"_id": otp_doc["_id"]})
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum verification attempts exceeded. Please request a new OTP."
        )
        
    db.otp_verifications.update_one(
        {"_id": otp_doc["_id"]},
        {"$inc": {"attempts": 1}}
    )
    otp_record.attempts += 1
    
    if datetime.utcnow() > otp_record.expires_at:
        db.otp_verifications.delete_one({"_id": otp_doc["_id"]})
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired (expires in 5 minutes)."
        )
        
    if not verify_password(payload.otp_code, otp_record.otp_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid OTP code. Attempts remaining: {5 - otp_record.attempts}"
        )
        
    db.otp_verifications.update_one(
        {"_id": otp_doc["_id"]},
        {"$set": {"verified": True}}
    )
    db.students.update_one(
        {"_id": student_doc["_id"]},
        {"$set": {"otp_verified": True}}
    )
        
    return {"message": "OTP verified successfully."}

@router.post("/activation/setup-password")
def activation_setup_password(payload: SetupPasswordRequest, db: Any = Depends(get_db)):
    student_doc = db.students.find_one({"roll_number": payload.roll_number})
    if not student_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found."
        )
        
    student = Student(student_doc)
    if student.account_activated:
         raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is already activated."
        )
         
    otp_doc = db.otp_verifications.find_one({
        "student_id": student.id,
        "purpose": "activation",
        "verified": True
    })
    if not otp_doc:
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
         
    db.students.update_one(
        {"_id": student_doc["_id"]},
        {"$set": {
            "password_hash": get_password_hash(payload.password),
            "account_activated": True,
            "otp_verified": True
        }}
    )
    
    # Remove the OTP record
    db.otp_verifications.delete_one({"_id": otp_doc["_id"]})
    
    # Refresh student details
    student = Student(db.students.find_one({"_id": student_doc["_id"]}))
    
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
def login(payload: LoginRequest, request: Request, db: Any = Depends(get_db)):
    student_doc = db.students.find_one({"roll_number": payload.roll_number})
    
    if not student_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect Roll Number or Password."
        )
        
    student = Student(student_doc)
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
    db.students.update_one(
        {"_id": student_doc["_id"]},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    log_login_attempt(db, student.id, request, "Success")
        
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
def forgot_password_verify(payload: ActivationVerifyRequest, db: Any = Depends(get_db)):
    student_doc = db.students.find_one({
        "roll_number": payload.roll_number,
        "dob": payload.date_of_birth
    })
    
    if not student_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid Roll Number or Date of Birth."
        )
        
    student = Student(student_doc)
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
def forgot_password_verify_otp(payload: OTPVerifyRequest, db: Any = Depends(get_db)):
    return activation_verify_otp(payload, db)

@router.post("/forgot-password/reset")
def forgot_password_reset(payload: ResetPasswordRequest, db: Any = Depends(get_db)):
    student_doc = db.students.find_one({"roll_number": payload.roll_number})
    if not student_doc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student account is not active."
        )
        
    student = Student(student_doc)
    if not student.account_activated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student account is not active."
        )
        
    otp_doc = db.otp_verifications.find_one({
        "student_id": student.id,
        "purpose": "forgot_password",
        "verified": True
    })
    if not otp_doc:
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
        
    db.students.update_one(
        {"_id": student_doc["_id"]},
        {"$set": {"password_hash": get_password_hash(payload.password)}}
    )
    
    # Clear OTP record
    db.otp_verifications.delete_one({"_id": otp_doc["_id"]})
    
    return {"message": "Password reset successfully. You can now login."}

from fastapi.security import OAuth2PasswordBearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

@router.get("/me")
def get_me(token: str = Depends(oauth2_scheme), db: Any = Depends(get_db)):
    from app.api.analytics import get_current_student
    # Create a mock Request
    class MockRequest:
        query_params = {}
    
    student = get_current_student(MockRequest(), token, db)
    return {
        "roll_number": student.roll_number,
        "personal_email": student.email,
        "department": student.department,
        "semester": student.semester
    }
