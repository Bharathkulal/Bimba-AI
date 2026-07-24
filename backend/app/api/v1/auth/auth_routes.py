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
from app.models.admin_user import AdminUser
from app.core.security import get_password_hash, verify_password, create_access_token, verify_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

# --- Request / Response Schemas ---
class LoginRequest(BaseModel):
    roll_number: str
    password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

class ForgotPasswordRequest(BaseModel):
    roll_number: str

class OTPVerifyRequest(BaseModel):
    roll_number: str
    otp_code: str
    purpose: str = "forgot_password"

class ResetPasswordRequest(BaseModel):
    roll_number: str
    password: str

class AdminResetPasswordRequest(BaseModel):
    roll_number: str

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
    db.otp_verifications.delete_many({"student_id": student_id, "purpose": purpose})
    otp_code = "".join(random.choices(string.digits, k=6))
    otp_hash = get_password_hash(otp_code)
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

# Helper dependency to resolve admin
def get_current_admin(request: Request, db: Any = Depends(get_db)) -> AdminUser:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    token = auth_header.split(" ")[1]
    username = verify_token(token)
    if not username:
        raise HTTPException(status_code=401, detail="Invalid token")
        
    admin_doc = db.admin_users.find_one({"username": username})
    if not admin_doc:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    admin = AdminUser(admin_doc)
    if not admin.is_active:
        raise HTTPException(status_code=401, detail="Admin account is disabled")
        
    return admin

from fastapi.security import OAuth2PasswordBearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

# --- Endpoints ---

@router.post("/login")
def login(payload: LoginRequest, request: Request, db: Any = Depends(get_db)):
    student_doc = db.students.find_one({"roll_number": payload.roll_number})
    
    if not student_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect Roll Number or Password."
        )
        
    student = Student(student_doc)
    # Check if student is active
    if not student.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated. Please contact the administrator."
        )
        
    # Check password
    if not student.password_hash or not verify_password(payload.password, student.password_hash):
        log_login_attempt(db, student.id, request, "Failed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect Roll Number or Password."
        )
        
    # Log successful attempt and update last login
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
            "semester": student.semester,
            "student_name": student.student_name,
            "full_name": student.full_name or student.student_name,
            "dob": student.dob,
            "phone": student.phone
        }
    }

@router.post("/logout")
def logout():
    return {"message": "Logged out successfully."}

@router.post("/change-password")
def change_password(payload: ChangePasswordRequest, token: str = Depends(oauth2_scheme), db: Any = Depends(get_db)):
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    roll_number = verify_token(token)
    if not roll_number:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
        
    student_doc = db.students.find_one({"roll_number": roll_number})
    if not student_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
        
    student = Student(student_doc)
    if not student.password_hash or not verify_password(payload.current_password, student.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password does not match."
        )
        
    if len(payload.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters long."
        )
        
    if payload.new_password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Confirm password does not match."
        )
        
    db.students.update_one(
        {"_id": student_doc["_id"]},
        {"$set": {"password_hash": get_password_hash(payload.new_password)}}
    )
    return {"message": "Password changed successfully."}

@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Any = Depends(get_db)):
    student_doc = db.students.find_one({"roll_number": payload.roll_number})
    if not student_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student Roll Number not found."
        )
        
    student = Student(student_doc)
    if not student.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is deactivated. Contact the administrator."
        )
        
    if not student.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No registered email address found. Contact the administrator."
        )
        
    # Generate and save OTP
    otp_code = generate_and_save_otp(db, student.id, "forgot_password")
    
    return {
        "message": f"6-digit OTP sent to registered email {mask_email(student.email)}",
        "student_name": student.student_name,
        "email": mask_email(student.email),
        "dev_otp": otp_code  # Exposing dev_otp for easy verification in development
    }

@router.post("/forgot-password/verify-otp")
def forgot_password_verify_otp(payload: OTPVerifyRequest, db: Any = Depends(get_db)):
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
            detail="No active OTP verification session found."
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
    
    if datetime.utcnow() > otp_record.expires_at:
        db.otp_verifications.delete_one({"_id": otp_doc["_id"]})
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired. Please request a new one."
        )
        
    if not verify_password(payload.otp_code, otp_record.otp_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid OTP code. Attempts remaining: {4 - otp_record.attempts}"
        )
        
    db.otp_verifications.update_one(
        {"_id": otp_doc["_id"]},
        {"$set": {"verified": True}}
    )
    return {"message": "OTP verified successfully."}

@router.post("/forgot-password/reset")
def forgot_password_reset(payload: ResetPasswordRequest, db: Any = Depends(get_db)):
    student_doc = db.students.find_one({"roll_number": payload.roll_number})
    if not student_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found."
        )
        
    student = Student(student_doc)
    otp_doc = db.otp_verifications.find_one({
        "student_id": student.id,
        "purpose": "forgot_password",
        "verified": True
    })
    
    if not otp_doc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP verification required before resetting password."
        )
        
    # Validate password rules
    password = payload.password
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long."
        )
        
    db.students.update_one(
        {"_id": student_doc["_id"]},
        {"$set": {"password_hash": get_password_hash(payload.password)}}
    )
    
    # Clear the OTP verification record
    db.otp_verifications.delete_one({"_id": otp_doc["_id"]})
    
    return {"message": "Password reset successfully. You can now log in."}

@router.post("/reset-password")
def admin_reset_password(payload: AdminResetPasswordRequest, admin: AdminUser = Depends(get_current_admin), db: Any = Depends(get_db)):
    student_doc = db.students.find_one({"roll_number": payload.roll_number})
    if not student_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found."
        )
        
    dob = student_doc.get("dob")
    if not dob:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student Date of Birth is not registered. Cannot reset password."
        )
        
    db.students.update_one(
        {"_id": student_doc["_id"]},
        {"$set": {"password_hash": get_password_hash(dob)}}
    )
    return {"message": "Password reset to student's Date of Birth (hashed) successfully."}

@router.get("/me")
def get_me(token: str = Depends(oauth2_scheme), db: Any = Depends(get_db)):
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
        
    roll_number = verify_token(token)
    if not roll_number:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
        
    student_doc = db.students.find_one({"roll_number": roll_number})
    if not student_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
        
    student = Student(student_doc)
    return {
        "roll_number": student.roll_number,
        "personal_email": student.email,
        "department": student.department,
        "semester": student.semester,
        "student_name": student.student_name,
        "full_name": student.full_name or student.student_name,
        "dob": student.dob,
        "phone": student.phone,
        "is_active": student.is_active,
        "last_login": student.last_login.isoformat() if student.last_login else None
    }
