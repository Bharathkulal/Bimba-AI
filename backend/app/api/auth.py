import random
import string
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database.session import get_db
from app.models.student import Student
from app.models.otp import OTP
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

# Helper to generate and save a 6-digit OTP
def generate_and_save_otp(db: Session, roll_number: str, purpose: str) -> str:
    # Remove older OTPs for the same roll number and purpose
    db.query(OTP).filter(OTP.roll_number == roll_number, OTP.purpose == purpose).delete()
    
    # Generate 6-digit code
    otp_code = "".join(random.choices(string.digits, k=6))
    
    # Expires in 5 minutes
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
    
    new_otp = OTP(
        roll_number=roll_number,
        otp_code=otp_code,
        purpose=purpose,
        expires_at=expires_at
    )
    db.add(new_otp)
    db.commit()
    return otp_code

# --- Endpoints ---

@router.post("/activation/verify")
def activation_verify(payload: ActivationVerifyRequest, db: Session = Depends(get_db)):
    student = db.query(Student).filter(
        Student.roll_number == payload.roll_number,
        Student.date_of_birth == payload.date_of_birth
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found with matching Roll Number and Date of Birth."
        )
    
    if student.is_activated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is already activated. Please login directly."
        )
    
    # Generate and save OTP
    otp_code = generate_and_save_otp(db, student.roll_number, "activation")
    
    # In development, return the OTP in the JSON so front-end testing is seamless
    return {
        "message": f"6-digit OTP sent to registered email {student.personal_email}",
        "email": student.personal_email,
        "dev_otp": otp_code  # Exposing dev_otp for developer verification
    }

@router.post("/activation/verify-otp")
def activation_verify_otp(payload: OTPVerifyRequest, db: Session = Depends(get_db)):
    otp_record = db.query(OTP).filter(
        OTP.roll_number == payload.roll_number,
        OTP.otp_code == payload.otp_code,
        OTP.purpose == payload.purpose
    ).first()
    
    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP code."
        )
    
    # Convert expires_at offset for comparison
    expires_naive = otp_record.expires_at
    # Make sure we compare correctly (e.g. UTC)
    if datetime.now(timezone.utc).replace(tzinfo=None) > expires_naive:
        db.delete(otp_record)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired (expires in 5 minutes)."
        )
        
    return {"message": "OTP verified successfully."}

@router.post("/activation/setup-password")
def activation_setup_password(payload: SetupPasswordRequest, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.roll_number == payload.roll_number).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found."
        )
        
    if student.is_activated:
         raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is already activated."
        )
         
    student.hashed_password = get_password_hash(payload.password)
    student.is_activated = True
    student.email_verified = True
    
    # Remove all verified OTPs for this student
    db.query(OTP).filter(OTP.roll_number == payload.roll_number).delete()
    db.commit()
    
    return {"message": "Account activated successfully. You can now login."}

@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.roll_number == payload.roll_number).first()
    
    if not student or not student.is_activated:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect Roll Number, or account not yet activated."
        )
        
    if not verify_password(payload.password, student.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect Password."
        )
        
    # Generate JWT
    token = create_access_token(subject=student.roll_number)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "student": {
            "roll_number": student.roll_number,
            "personal_email": student.personal_email,
            "department": student.department,
            "semester": student.semester
        }
    }

@router.post("/forgot-password/verify")
def forgot_password_verify(payload: ActivationVerifyRequest, db: Session = Depends(get_db)):
    student = db.query(Student).filter(
        Student.roll_number == payload.roll_number,
        Student.date_of_birth == payload.date_of_birth
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found with matching Roll Number and Date of Birth."
        )
        
    if not student.is_activated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is not yet activated. Please activate it first."
        )
        
    # Generate and save OTP
    otp_code = generate_and_save_otp(db, student.roll_number, "forgot_password")
    
    return {
        "message": f"6-digit OTP sent to registered email {student.personal_email}",
        "email": student.personal_email,
        "dev_otp": otp_code
    }

@router.post("/forgot-password/verify-otp")
def forgot_password_verify_otp(payload: OTPVerifyRequest, db: Session = Depends(get_db)):
    # This is identical to activation OTP check but uses "forgot_password" purpose
    return activation_verify_otp(payload, db)

@router.post("/forgot-password/reset")
def forgot_password_reset(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.roll_number == payload.roll_number).first()
    if not student or not student.is_activated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student account is not active."
        )
        
    student.hashed_password = get_password_hash(payload.password)
    # Clear OTP records
    db.query(OTP).filter(OTP.roll_number == payload.roll_number).delete()
    db.commit()
    
    return {"message": "Password reset successfully. You can now login."}
