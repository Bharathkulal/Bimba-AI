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
            # Write physical backup copy
            import uuid
            os.makedirs("uploads/resumes", exist_ok=True)
            file_id = str(uuid.uuid4())
            secure_filename = f"{file_id}_{filename}"
            filepath = os.path.join("uploads/resumes", secure_filename)
            
            with open(filepath, "wb") as f:
                f.write(file_content)
                
            # 2. Extract Text via OCRService
            extracted_text = self.ocr_service.extract_text(file_content, filename)
            
            # 3. AI Parsing / Falling Back
            prompt = RESUME_PARSE_PROMPT.replace("{resume_text}", extracted_text)
            
            # Execute LLM Call using manager fallback chain
            raw_response = self.ai_manager.call_llm(prompt, feature="Resume Ingestion Parsing")
            
            # 4. JSON / Schema Verification
            parsed_data = self.parser.parse_and_validate(raw_response)
            
            # 5. Database Save Operations
            resume_id = self.repository.save_parsed_resume(student_id, parsed_data, filepath)
            
            log_stage("UPLOAD", "COMPLETED", f"Orchestration completed successfully for {filename}")
            return {
                "success": True,
                "resume_id": resume_id,
                "parsed_data": parsed_data,
                "file_path": filepath
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
