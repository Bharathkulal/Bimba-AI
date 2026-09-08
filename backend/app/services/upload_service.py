import os
import time
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
        t_start = time.perf_counter()
        t_extract = 0.0
        t_parse = 0.0
        t_ai = 0.0
        t_cloud = 0.0
        t_db = 0.0
        
        try:
            # 2. Extract Text via PyMuPDF (Primary) or OCRService (Fallback only if empty)
            t_extract_start = time.perf_counter()
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

                # Fallback to OCRService ONLY if text is empty or insufficient (< 50 chars)
                if not extracted_text or len(extracted_text.strip()) < 50:
                    log_stage("EXTRACTOR", "WARN", "PyMuPDF extracted insufficient text, attempting OCRService fallback...")
                    raw_ocr = self.ocr_service.extract_text(file_content, filename)
                    extracted_text, page_count, pages_meta = _unpack_raw(raw_ocr)
                    raw_extraction = raw_ocr
            else:
                raw_ocr = self.ocr_service.extract_text(file_content, filename)
                extracted_text, page_count, pages_meta = _unpack_raw(raw_ocr)
                raw_extraction = raw_ocr

            extracted_text = str(extracted_text or "").strip()
            t_extract = time.perf_counter() - t_extract_start
            log_stage("EXTRACTOR", "COMPLETED", f"Extracted {len(extracted_text)} characters in {t_extract:.3f}s")

            if not extracted_text:
                raise PipelineException(
                    step="Text Ingestion / Extraction",
                    provider="Core System",
                    message="This document does not contain extractable text. Please upload a text-based document.",
                    status_code=422
                )

            # 3. Parallel Cloudinary Upload (Async background thread so it doesn't block parsing)
            cloudinary_future = None
            t_cloud_start = time.perf_counter()
            from concurrent.futures import ThreadPoolExecutor
            executor = ThreadPoolExecutor(max_workers=2)
            
            def _async_cloudinary_upload():
                try:
                    from app.services.cloudinary_service import upload_file, is_configured
                    if is_configured:
                        return upload_file(file_content, filename, folder="uploaded-resumes")
                except Exception as ce:
                    logger.warning(f"Cloudinary upload skipped or failed: {str(ce)}")
                return None

            cloudinary_future = executor.submit(_async_cloudinary_upload)

            # 4. Fast Local Heuristic Resume Parsing (Provides immediate 100% complete baseline in ~150ms)
            t_parse_start = time.perf_counter()
            from app.services.resume_extraction_service import extract_structured_data
            parsed_data = extract_structured_data(extracted_text)
            t_parse = time.perf_counter() - t_parse_start

            # 5. Optional AI Structured Enrichment (with fast timeout and zero-loss fallback)
            t_ai_start = time.perf_counter()
            ai_warnings = []
            try:
                # Limit prompt text to prevent slow multi-token overhead
                truncated_text = extracted_text[:8000]
                prompt = RESUME_PARSE_PROMPT.replace("{resume_text}", truncated_text)
                raw_response = self.ai_manager.call_llm(prompt, feature="Resume Ingestion Parsing", response_format="json_object")
                ai_parsed = self.parser.parse_and_validate(raw_response)
                if ai_parsed and any(ai_parsed.values()):
                    parsed_data = ZeroLossEngine.safe_merge_results([parsed_data, ai_parsed])
                    logger.info("INFO: AI structured parsing merged successfully")
            except Exception as ai_err:
                logger.info(f"INFO: AI enhancement skipped ({str(ai_err)}), utilizing fast local heuristic parsing baseline.")
                ai_warnings.append(f"AI parsing note: {str(ai_err)}")
            t_ai = time.perf_counter() - t_ai_start

            # 6. Normalize to Internal Model (Guarantees all 16 sections exist)
            normalized_resume = ZeroLossEngine.normalize_to_internal_model(parsed_data)

            # 7. Information Loss Validation & Completeness Scoring
            val_results = ResumeIntegrityValidator.validate(parsed_data, normalized_resume)
            completeness = ResumeIntegrityValidator.calculate_completeness_breakdown(normalized_resume)
            
            validation_metadata = {
                "completeness_score": completeness.get("overall_completeness", 95.0),
                "breakdown": completeness,
                "warnings": val_results.get("warnings", []) + ai_warnings,
                "missing_details": val_results.get("errors", [])
            }

            # 8. Retrieve Cloudinary Result (with short non-blocking wait)
            cloudinary_url = None
            public_id = None
            try:
                if cloudinary_future:
                    c_res = cloudinary_future.result(timeout=2.0)
                    if c_res:
                        cloudinary_url = c_res.get("url")
                        public_id = c_res.get("public_id")
            except Exception as cle:
                logger.warning(f"Cloudinary async wait timed out or failed: {str(cle)}")
            finally:
                executor.shutdown(wait=False)
            t_cloud = time.perf_counter() - t_cloud_start

            # 9. Database Persistence
            t_db_start = time.perf_counter()
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
            t_db = time.perf_counter() - t_db_start
            t_total = time.perf_counter() - t_start

            # Performance Log
            logger.info(
                f"\n[PERFORMANCE]\n"
                f"PDF extraction: {t_extract:.3f}s\n"
                f"Resume parsing: {t_parse:.3f}s\n"
                f"AI processing:  {t_ai:.3f}s\n"
                f"Cloudinary:     {t_cloud:.3f}s\n"
                f"MongoDB save:   {t_db:.3f}s\n"
                f"Total:          {t_total:.3f}s\n"
            )

            warnings = validation_metadata["warnings"]
            return {
                "success": True,
                "resume_id": resume_id,
                "status": "completed_with_warnings" if warnings else "completed",
                "message": "Resume successfully ingested with zero loss protection",
                "next_step": "instant-verdict",
                "warnings": warnings,
                "parsed_data": normalized_resume,
                "completeness": completeness,
                "file_path": filepath,
                "cloudinary_url": cloudinary_url
            }
            
        except PipelineException as pe:
            raise pe
        except Exception as e:
            import traceback
            log_error("UPLOAD", f"Unexpected pipeline failure on {filename}", e)
            raise PipelineException(
                step="Orchestration Pipeline",
                provider="Core Service",
                message=f"Pipeline failed: {str(e)}",
                status_code=500
            )
