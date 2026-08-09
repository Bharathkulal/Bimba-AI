import io
import pypdf
import docx
from app.core.exceptions import OCRException
from app.core.logging_service import log_stage, log_error

from app.services.layered_extractor import LayeredExtractor

class OCRService:
    @staticmethod
    def extract_text(file_content: bytes, filename: str) -> dict:
        """Return full extraction result including raw_document and pages metadata.

        Backwards-compatible callers should consume the returned dict and use the
        `text` key if only plain text is required.
        """
        result = LayeredExtractor.extract_text(file_content, filename)
        return result
