from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from typing import Any
from app.database.session import get_db
from app.api.analytics import get_current_student
from app.models.student import Student
from app.services.cloudinary_service import upload_file, delete_file, is_configured
from app.core.config import settings

# Router for files prefix (/api/files)
router = APIRouter(prefix="/files", tags=["Files Storage"])

# Router for cloudinary prefix (/api/cloudinary)
cloudinary_router = APIRouter(prefix="/cloudinary", tags=["Cloudinary System"])

@cloudinary_router.get("/health")
def get_cloudinary_health():
    """
    GET /api/cloudinary/health
    Verifies Cloudinary SDK config status and env settings.
    """
    if is_configured:
        return {
            "service": "Cloudinary",
            "status": "healthy",
            "cloud_name": settings.CLOUDINARY_CLOUD_NAME
        }
    else:
        return {
            "status": "failed",
            "reason": "Cloudinary credentials missing or SDK initialization failed."
        }

@router.post("/upload-resume")
async def upload_resume_file(
    file: UploadFile = File(...),
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    """
    POST /api/files/upload-resume
    Uploads original resume. Stores inside: bimba-ai/uploaded-resumes/
    """
    try:
        content = await file.read()
        filename = file.filename or "resume.pdf"
        
        # Upload
        result = upload_file(content, filename, folder="uploaded-resumes")
        
        # Save metadata to MongoDB
        cloudinary_metadata = {
            "public_id": result["public_id"],
            "url": result["url"],
            "resource_type": result["resource_type"],
            "uploaded_at": result["uploaded_at"],
            "folder": "uploaded-resumes"
        }
        
        # Find or create a resume master record in MongoDB
        # Check if student already has a resume or create new metadata link
        db.resumes.insert_one({
            "student_id": student.id,
            "filename": filename,
            "resume": {
                "cloudinary": cloudinary_metadata
            }
        })
        
        return {
            "success": True,
            "url": result["url"],
            "public_id": result["public_id"],
            "filename": filename,
            "size": result["size"]
        }
        
    except ValueError as ve:
        err_msg = str(ve)
        if "Unsupported File Type" in err_msg:
            raise HTTPException(status_code=415, detail="Unsupported File Type")
        elif "File Too Large" in err_msg:
            raise HTTPException(status_code=413, detail="File Too Large")
        else:
            raise HTTPException(status_code=400, detail=err_msg)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cloudinary Upload Failed: {str(e)}")

@router.post("/upload-profile-image")
async def upload_profile_image(
    file: UploadFile = File(...),
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    """
    POST /api/files/upload-profile-image
    Uploads profile image. Stores inside: bimba-ai/profile-images/
    """
    try:
        content = await file.read()
        filename = file.filename or "profile.jpg"
        
        # Upload
        result = upload_file(content, filename, folder="profile-images")
        
        # Store inside MongoDB student profile photo reference
        db.students.update_one(
            {"id": student.id},
            {"$set": {
                "profile_photo": {
                    "public_id": result["public_id"],
                    "url": result["url"],
                    "resource_type": result["resource_type"],
                    "uploaded_at": result["uploaded_at"],
                    "folder": "profile-images"
                }
            }}
        )
        
        return {
            "success": True,
            "url": result["url"],
            "public_id": result["public_id"],
            "filename": filename,
            "size": result["size"]
        }
        
    except ValueError as ve:
        err_msg = str(ve)
        if "Unsupported File Type" in err_msg:
            raise HTTPException(status_code=415, detail="Unsupported File Type")
        elif "File Too Large" in err_msg:
            raise HTTPException(status_code=413, detail="File Too Large")
        else:
            raise HTTPException(status_code=400, detail=err_msg)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cloudinary Upload Failed: {str(e)}")

@router.post("/upload-company-logo")
async def upload_company_logo(
    file: UploadFile = File(...),
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    """
    POST /api/files/upload-company-logo
    Uploads company logo. Stores inside: bimba-ai/company-logos/
    """
    try:
        content = await file.read()
        filename = file.filename or "logo.png"
        
        # Upload
        result = upload_file(content, filename, folder="company-logos")
        
        return {
            "success": True,
            "url": result["url"],
            "public_id": result["public_id"],
            "filename": filename,
            "size": result["size"]
        }
        
    except ValueError as ve:
        err_msg = str(ve)
        if "Unsupported File Type" in err_msg:
            raise HTTPException(status_code=415, detail="Unsupported File Type")
        elif "File Too Large" in err_msg:
            raise HTTPException(status_code=413, detail="File Too Large")
        else:
            raise HTTPException(status_code=400, detail=err_msg)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cloudinary Upload Failed: {str(e)}")

@router.delete("/{public_id:path}")
def delete_cloudinary_file(
    public_id: str,
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    """
    DELETE /api/files/{public_id:path}
    Deletes both Cloudinary object and its reference in MongoDB.
    """
    # 1. Cloudinary Delete
    res = delete_file(public_id)
    if not res.get("success"):
        raise HTTPException(status_code=500, detail="Cloudinary Delete Failed")
    
    # 2. MongoDB References Delete
    db.resumes.update_many(
        {"resume.cloudinary.public_id": public_id},
        {"$unset": {"resume.cloudinary": ""}}
    )
    db.students.update_many(
        {"profile_photo.public_id": public_id},
        {"$unset": {"profile_photo": ""}}
    )
    
    return {
        "success": True,
        "message": "Successfully deleted file from Cloudinary and MongoDB reference."
    }
