import os
from typing import Dict, Any
from app.core.exceptions import PipelineException
from app.core.logging_service import log_stage, log_error
from app.services.ocr_service import OCRService
from app.services.ai_provider_manager import AIProviderManager
from app.services.resume_parser import ResumeParser
from app.database.resume_repository import ResumeRepository
from app.ai.resume_prompts import RESUME_PARSE_PROMPT

class UploadService:
    def __init__(self, db: Any):
        self.db = db
        self.ocr_service = OCRService()
        self.ai_manager = AIProviderManager(db)
        self.parser = ResumeParser()
        self.repository = ResumeRepository(db)

    def process_upload(self, file_content: bytes, filename: str, student_id: int) -> Dict[str, Any]:
        log_stage("UPLOAD", "START", f"Starting upload pipeline orchestration for {filename}")
        
        # 1. Ingestion / Size Check
        size_kb = len(file_content) // 1024
        log_stage("UPLOAD", "INFO", f"Filename: {filename} | Size: {size_kb} KB")
        
        filepath = ""
        try:
            # Do not save physical local backup anymore, keep it in Cloudinary only.
            filepath = ""
                
            # 2. Extract Text via OCRService
            extracted_text = self.ocr_service.extract_text(file_content, filename)
            
            # 3. AI Parsing / Falling Back
            prompt = RESUME_PARSE_PROMPT.replace("{resume_text}", extracted_text)
            
            # Execute LLM Call using manager fallback chain
            raw_response = self.ai_manager.call_llm(prompt, feature="Resume Ingestion Parsing")
            
            # 4. JSON / Schema Verification
            parsed_data = self.parser.parse_and_validate(raw_response)
            
            # 5. Database Save Operations
            cloudinary_url = None
            public_id = None
            try:
                from app.services.cloudinary_service import upload_file, is_configured
                if is_configured:
                    log_stage("UPLOAD", "INFO", f"Uploading {filename} to Cloudinary...")
                    c_res = upload_file(file_content, filename, folder="uploaded-resumes")
                    cloudinary_url = c_res.get("url")
                    public_id = c_res.get("public_id")
                    log_stage("UPLOAD", "INFO", f"Cloudinary upload success! URL: {cloudinary_url}")
            except Exception as cle:
                log_error("UPLOAD", "Cloudinary upload failed, falling back to local file copy", cle)

            resume_id = self.repository.save_parsed_resume(
                student_id=student_id,
                parsed_data=parsed_data,
                filepath=filepath,
                cloudinary_url=cloudinary_url,
                public_id=public_id
            )
            
            log_stage("UPLOAD", "COMPLETED", f"Orchestration completed successfully for {filename}")
            return {
                "success": True,
                "resume_id": resume_id,
                "parsed_data": parsed_data,
                "file_path": filepath,
                "cloudinary_url": cloudinary_url
            }
            
        except PipelineException as pe:
            # Re-raise known step exceptions directly
            raise pe
        except Exception as e:
            # Package generic unexpected failures cleanly
            log_error("UPLOAD", f"Unexpected pipeline failure on {filename}", e)
            raise PipelineException(
                step="Orchestration Pipeline",
                provider="Core Service",
                message=f"Pipeline failed: {str(e)}"
            )
