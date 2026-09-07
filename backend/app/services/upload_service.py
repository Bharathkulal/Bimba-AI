import os
import logging
from typing import Dict, Any, List
from app.core.exceptions import PipelineException
from app.core.logging_service import log_stage, log_error
from app.services.pdf_extractor import PDFExtractor
from app.services.ocr_service import OCRService
from app.services.ai_provider_manager import AIProviderManager
from app.services.resume_parser import ResumeParser
from app.services.zero_loss_engine import ZeroLossEngine
from app.services.integrity_validator import ResumeIntegrityValidator
from app.database.resume_repository import ResumeRepository
from app.ai.resume_prompts import RESUME_PARSE_PROMPT

logger = logging.getLogger("bimba_ai_pipeline")


class UploadService:
    def __init__(self, db: Any):
        self.db = db
        self.ocr_service = OCRService()
        self.ai_manager = AIProviderManager(db)
        self.parser = ResumeParser()
        self.repository = ResumeRepository(db)

    def process_upload(self, file_content: bytes, filename: str, student_id: int) -> Dict[str, Any]:
        # 1. Ingestion / Security Checks
        logger.info("INFO: Resume upload started")
        size_mb = len(file_content) / (1024 * 1024)
        if size_mb > 15.0:
            raise PipelineException(
                step="Ingestion / Size Check",
                provider="Core System",
                message=f"File exceeds maximum size limit of 15MB. Uploaded: {size_mb:.2f}MB",
                status_code=400
            )

        ext = filename.lower().split('.')[-1] if '.' in filename else ""
        if ext not in ["pdf", "docx", "doc", "txt"]:
            raise PipelineException(
                step="Ingestion / Format Validation",
                provider="Core System",
                message=f"Forbidden file type: .{ext}. Only .pdf, .docx, .doc, and .txt files are allowed.",
                status_code=400
            )

        # PDF Validity Check
        if ext == "pdf":
            if len(file_content) == 0:
                raise PipelineException(
                    step="Ingestion / Format Validation",
                    provider="Core System",
                    message="Empty PDF file uploaded.",
                    status_code=422
                )
            if not file_content.startswith(b"%PDF-") and b"%PDF-" not in file_content[:1024]:
                raise PipelineException(
                    step="Ingestion / Format Validation",
                    provider="Core System",
                    message="Invalid PDF file: File does not have a valid PDF header.",
                    status_code=400
                )

        # Sanitize filename
        filename = "".join([c for c in filename if c.isalnum() or c in "._- "]).strip()
        log_stage("UPLOAD", "START", f"Starting upload pipeline for: {filename} ({size_mb:.2f} MB, .{ext})")
        
        filepath = ""
        try:
            # 2. Extract Text via PyMuPDF (Primary) or OCRService
            log_stage("EXTRACTOR", "START", f"Running layered extraction for {filename}")
            
            raw_extraction = None
            extracted_text = ""
            page_count = 1
            pages_meta = []
            
            def _unpack_raw(raw_data):
                if isinstance(raw_data, str):
                    return raw_data, 1, [{"page_number": 1, "text": raw_data}]
                if isinstance(raw_data, dict):
                    txt = raw_data.get("full_text") or raw_data.get("text", "")
                    if not txt and "pages_metadata" in raw_data:
                        txt = "\n\n".join(p.get("text", "") for p in raw_data["pages_metadata"] if isinstance(p, dict))
                    elif not txt and "pages" in raw_data:
                        txt = "\n\n".join(p.get("text", "") if isinstance(p, dict) else str(p) for p in raw_data["pages"])
                    p_count = raw_data.get("page_count", len(raw_data.get("pages_metadata", raw_data.get("pages", [1]))))
                    p_meta = raw_data.get("pages", raw_data.get("pages_metadata", []))
                    return txt, p_count, p_meta
                if isinstance(raw_data, list):
                    parts = []
                    for item in raw_data:
                        if isinstance(item, dict):
                            parts.append(item.get("text", ""))
                        else:
                            parts.append(str(item))
                    txt = "\n\n".join(parts)
                    return txt, len(raw_data), [{"page_number": idx + 1, "text": t} for idx, t in enumerate(parts)]
                return str(raw_data or ""), 1, []

            if ext == "pdf":
                pdf_res = PDFExtractor.extract_text_from_pdf(file_content, filename)
                extracted_text, page_count, pages_meta = _unpack_raw(pdf_res)
                raw_extraction = pdf_res

                # Fallback to OCRService if text is still empty
                if not extracted_text or not extracted_text.strip():
                    log_stage("EXTRACTOR", "WARN", "PyMuPDF extracted empty text, attempting OCRService layered extraction...")
                    raw_ocr = self.ocr_service.extract_text(file_content, filename)
                    extracted_text, page_count, pages_meta = _unpack_raw(raw_ocr)
                    raw_extraction = raw_ocr
            else:
                raw_ocr = self.ocr_service.extract_text(file_content, filename)
                extracted_text, page_count, pages_meta = _unpack_raw(raw_ocr)
                raw_extraction = raw_ocr

            extracted_text = str(extracted_text or "").strip()
            log_stage("EXTRACTOR", "INFO", f"Extracted {len(extracted_text)} characters")

            if not extracted_text:
                log_stage("EXTRACTOR", "WARN", "Extracted text is empty; raising extraction error")
                raise PipelineException(
                    step="Text Ingestion / Extraction",
                    provider="Core System",
                    message="This document does not contain extractable text. Please upload a text-based document or ensure OCR is supported.",
                    status_code=422
                )
            log_stage("EXTRACTOR", "COMPLETED", f"Final extracted characters: {len(extracted_text)}")

            # 3. AI Structured Extraction with Intelligent Chunking if large
            logger.info("INFO: Sending resume to AI parser")
            log_stage("UPLOAD", "INFO", "Structured AI parsing started")
            parsed_data = None
            ai_warnings = []

            # Determine if chunking is needed (resumes > 6000 chars)
            chunks = ZeroLossEngine.chunk_resume_text(extracted_text, max_chunk_chars=6000)
            
            if len(chunks) == 1:
                prompt = RESUME_PARSE_PROMPT.replace("{resume_text}", extracted_text)
                try:
                    raw_response = self.ai_manager.call_llm(prompt, feature="Resume Ingestion Parsing", response_format="json_object")
                    parsed_data = self.parser.parse_and_validate(raw_response)
                    logger.info("INFO: AI structured parsing completed")
                    log_stage("UPLOAD", "INFO", "Structured AI parsing completed for single chunk")
                except Exception as ai_err:
                    log_error("UPLOAD", "AI parsing failed; falling back to heuristic parsing", ai_err)
                    ai_warnings.append(f"AI parsing warning: {str(ai_err)}")
            else:
                # Process all chunks sequentially without truncation and merge safely
                chunk_results = []
                log_stage("UPLOAD", "INFO", f"Processing {len(chunks)} intelligent chunks...")
                for c in chunks:
                    c_prompt = RESUME_PARSE_PROMPT.replace("{resume_text}", c["text"])
                    try:
                        c_resp = self.ai_manager.call_llm(c_prompt, feature=f"Resume Parsing Chunk {c['chunk_number']}", response_format="json_object")
                        c_parsed = self.parser.parse_and_validate(c_resp)
                        chunk_results.append(c_parsed)
                    except Exception as c_err:
                        log_error("UPLOAD", f"Chunk {c['chunk_number']} AI parsing failed; using heuristic", c_err)
                        from app.services.resume_extraction_service import extract_structured_data
                        c_heuristic = extract_structured_data(c["text"])
                        chunk_results.append(c_heuristic)
                
                parsed_data = ZeroLossEngine.safe_merge_results(chunk_results)
                logger.info("INFO: AI structured parsing completed")
                log_stage("UPLOAD", "INFO", f"Safely merged {len(chunk_results)} chunk results without information loss")

            # Fallback to heuristic parser if AI returned empty data
            if not parsed_data or not any(parsed_data.values()):
                from app.services.resume_extraction_service import extract_structured_data
                parsed_data = extract_structured_data(extracted_text)

            # 4. Normalize to Internal Model (Guarantees all 16 sections exist)
            normalized_resume = ZeroLossEngine.normalize_to_internal_model(parsed_data)

            # 5. Information Loss Validation & Completeness Scoring
            val_results = ResumeIntegrityValidator.validate(parsed_data, normalized_resume)
            completeness = ResumeIntegrityValidator.calculate_completeness_breakdown(normalized_resume)
            
            validation_metadata = {
                "completeness_score": completeness.get("overall_completeness", 95.0),
                "breakdown": completeness,
                "warnings": val_results.get("warnings", []) + ai_warnings,
                "missing_details": val_results.get("errors", [])
            }

            # 6. Cloudinary Upload (Preserving original document)
            warnings = []
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
                log_error("UPLOAD", "Cloudinary upload skipped or failed", cle)
                warnings.append(f"Cloudinary upload note: {str(cle)}")

            # 7. Database Persistence
            original_file_meta = {
                "filename": filename,
                "size_bytes": len(file_content),
                "file_type": ext,
                "page_count": page_count,
                "raw_extracted_text": extracted_text,
                "cloudinary_url": cloudinary_url
            }

            resume_id = self.repository.save_parsed_resume(
                student_id=student_id,
                parsed_data=normalized_resume,
                filepath=filepath,
                cloudinary_url=cloudinary_url,
                public_id=public_id,
                raw_extraction_data=(raw_extraction if isinstance(raw_extraction, dict) else None),
                raw_text=extracted_text,
                original_file_meta=original_file_meta,
                validation_meta=validation_metadata
            )

            logger.info("INFO: Resume saved successfully")
            log_stage("UPLOAD", "COMPLETED", f"Orchestration completed successfully for {filename}")
            return {
                "success": True,
                "resume_id": resume_id,
                "status": "completed_with_warnings" if warnings else "completed",
                "message": "Resume successfully ingested with zero loss protection",
                "next_step": "instant-verdict",
                "warnings": warnings + validation_metadata["warnings"],
                "parsed_data": normalized_resume,
                "completeness": completeness,
                "file_path": filepath,
                "cloudinary_url": cloudinary_url
            }
            
        except PipelineException as pe:
            raise pe
        except Exception as e:
            import traceback
            tb_str = traceback.format_exc()
            log_error("UPLOAD", f"Unexpected pipeline failure on {filename}", e)
            raise PipelineException(
                step="Orchestration Pipeline",
                provider="Core Service",
                message=f"Pipeline failed: {str(e)}",
                details=tb_str
            )
