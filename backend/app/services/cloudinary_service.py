import os
import logging
from typing import Dict, Any, Optional
import cloudinary
import cloudinary.uploader
import cloudinary.api
from app.core.config import settings

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("cloudinary_service")

# Allowed file extensions and mime types
ALLOWED_EXTENSIONS = {"pdf", "doc", "docx", "png", "jpg", "jpeg", "webp"}
MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB

# Initialize Cloudinary
is_configured = False
if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET:
    try:
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
            secure=True
        )
        is_configured = True
        logger.info(f"Cloudinary successfully initialized for cloud: {settings.CLOUDINARY_CLOUD_NAME}")
    except Exception as e:
        logger.error(f"Failed to initialize Cloudinary SDK: {str(e)}")
else:
    logger.warning("Cloudinary configuration missing from environment. Services will fail gracefully.")

def validate_file(filename: str, file_size: int) -> Optional[str]:
    """
    Validates file extension and size. Returns error string if invalid, None if valid.
    """
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        return "Unsupported File Type"
    if file_size > MAX_FILE_SIZE_BYTES:
        return "File Too Large"
    return None

def upload_file(file_content: bytes, filename: str, folder: str) -> Dict[str, Any]:
    """
    Uploads a file to Cloudinary under the specified folder.
    Raises exception on error.
    """
    if not is_configured:
        logger.error("Cloudinary upload requested but Cloudinary is not configured.")
        raise RuntimeError("Cloudinary service is not configured.")

    # Validate file
    size = len(file_content)
    validation_err = validate_file(filename, size)
    if validation_err:
        raise ValueError(validation_err)

    # Determine resource type (raw for documents, image for images)
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    resource_type = "image" if ext in {"png", "jpg", "jpeg", "webp", "pdf"} else "raw"

    # Cloudinary folder path
    cloudinary_folder = f"bimba-ai/{folder.strip('/')}"

    try:
        # Perform upload wrapping bytes in BytesIO to prevent binary corruption
        import io
        upload_result = cloudinary.uploader.upload(
            io.BytesIO(file_content),
            folder=cloudinary_folder,
            resource_type=resource_type,
            filename=filename
        )
        
        logger.info(f"Successfully uploaded {filename} to Cloudinary folder {cloudinary_folder}")
        return {
            "success": True,
            "url": upload_result.get("secure_url") or upload_result.get("url"),
            "public_id": upload_result.get("public_id"),
            "filename": filename,
            "size": size,
            "resource_type": resource_type,
            "uploaded_at": upload_result.get("created_at")
        }
    except Exception as e:
        logger.error(f"Cloudinary upload failed for {filename}: {str(e)}")
        raise RuntimeError(f"Cloudinary Upload Failed: {str(e)}")

def delete_file(public_id: str) -> Dict[str, Any]:
    """
    Deletes a file from Cloudinary using its public_id.
    """
    if not is_configured:
        logger.error("Cloudinary delete requested but Cloudinary is not configured.")
        raise RuntimeError("Cloudinary service is not configured.")

    try:
        # We try deleting as both image and raw to cover all cases
        result = cloudinary.uploader.destroy(public_id, resource_type="image")
        if result.get("result") != "ok":
            result = cloudinary.uploader.destroy(public_id, resource_type="raw")

        if result.get("result") == "ok":
            logger.info(f"Successfully deleted Cloudinary object: {public_id}")
            return {"success": True, "result": "ok"}
        else:
            logger.warning(f"Delete returned non-ok result for public_id {public_id}: {result}")
            return {"success": False, "result": result.get("result")}
    except Exception as e:
        logger.error(f"Cloudinary delete failed for {public_id}: {str(e)}")
        return {"success": False, "error": str(e)}
