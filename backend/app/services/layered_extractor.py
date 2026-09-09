import io
import re
from typing import Dict, Any, List
from app.core.exceptions import OCRException
from app.core.logging_service import log_stage, log_error
from app.services.resume_pipeline.pipeline import GenericResumePipeline

class LayeredExtractor:
    """
    Backwards-compatible facade over GenericResumePipeline.
    Provides multi-column layout analysis, PyMuPDF primary extraction,
    pdfplumber table extraction, python-docx parsing, and selective OCR fallback.
    """

    @staticmethod
    def extract_text(file_content: bytes, filename: str) -> Dict[str, Any]:
        ext = filename.lower().split('.')[-1] if '.' in filename else ""
        if ext not in ["pdf", "docx", "doc", "txt"]:
            raise OCRException(f"Unsupported file type: {ext}")

        if not file_content:
            return {
                "text": "",
                "pages": 1,
                "confidence": 1.0,
                "method": "empty_input",
                "pages_metadata": []
            }

        result = GenericResumePipeline.ingest_and_parse(file_content, filename)
        
        # Format backwards-compatible dictionary
        return {
            "text": result["text"],
            "raw_text": result["raw_text"],
            "pages": result["pages"],
            "confidence": result["confidence"],
            "method": result["method"],
            "pages_metadata": result.get("pages_metadata", []),
            "structured_data": result.get("structured_data", {}),
            "raw_document": {
                "source": result["method"],
                "pages": result.get("pages_metadata", [])
            }
        }
