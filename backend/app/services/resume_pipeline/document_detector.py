import io
import re
from typing import Dict, Any, Tuple
from app.core.logging_service import log_stage, log_error

try:
    import pymupdf
except ImportError:
    try:
        import fitz as pymupdf
    except ImportError:
        pymupdf = None


class DocumentDetector:
    """
    Phase 1 — File Detection & Strategy Determination.
    Inspects PDF/DOCX content to determine:
    1. Text-based PDF (has selectable text with acceptable alphanumeric density)
    2. Scanned PDF (image-based with negligible text layer)
    3. Mixed PDF (some pages text, some pages scanned)
    4. DOCX / TXT
    """

    @staticmethod
    def detect_document_type(file_content: bytes, filename: str) -> Dict[str, Any]:
        ext = filename.lower().split('.')[-1] if '.' in filename else ""
        
        if ext == "pdf":
            return DocumentDetector._detect_pdf(file_content, filename)
        elif ext in ["docx", "doc"]:
            return {
                "file_type": "docx",
                "is_scanned": False,
                "needs_ocr": False,
                "strategy": "python-docx",
                "estimated_pages": 1,
                "confidence": 1.0
            }
        elif ext == "txt":
            return {
                "file_type": "txt",
                "is_scanned": False,
                "needs_ocr": False,
                "strategy": "raw_text",
                "estimated_pages": 1,
                "confidence": 1.0
            }
        else:
            return {
                "file_type": ext,
                "is_scanned": False,
                "needs_ocr": False,
                "strategy": "unsupported",
                "estimated_pages": 0,
                "confidence": 0.0
            }

    @staticmethod
    def _detect_pdf(file_content: bytes, filename: str) -> Dict[str, Any]:
        if not file_content:
            return {
                "file_type": "pdf",
                "sub_type": "empty",
                "is_scanned": False,
                "needs_ocr": False,
                "strategy": "failed",
                "page_count": 0,
                "pages_analysis": []
            }

        if pymupdf is None:
            return {
                "file_type": "pdf",
                "sub_type": "text_based",
                "is_scanned": False,
                "needs_ocr": False,
                "strategy": "pypdf_fallback",
                "page_count": 1,
                "pages_analysis": []
            }

        try:
            doc = pymupdf.open(stream=file_content, filetype="pdf")
            page_count = len(doc)
            pages_analysis = []
            scanned_pages = 0
            text_pages = 0

            for idx, page in enumerate(doc):
                text = page.get_text().strip()
                words = text.split()
                char_count = len(text)
                alnum_count = sum(1 for c in text if c.isalnum())
                
                # Check for images on this page
                images = page.get_images(full=True)
                has_images = len(images) > 0

                # Scanned criteria: very few characters (< 30) or very low alphanumeric ratio, but contains images
                is_page_scanned = (len(words) < 10 or char_count < 35) and has_images
                # If there are no images and no text, it might still need OCR (e.g. vector graphic text or empty)
                if not text and not has_images:
                    is_page_scanned = True

                confidence = (alnum_count / char_count) if char_count > 0 else 0.0

                page_info = {
                    "page_number": idx + 1,
                    "char_count": char_count,
                    "word_count": len(words),
                    "image_count": len(images),
                    "is_scanned": is_page_scanned,
                    "confidence": float(round(confidence, 2))
                }
                pages_analysis.append(page_info)

                if is_page_scanned:
                    scanned_pages += 1
                else:
                    text_pages += 1

            if scanned_pages == 0:
                sub_type = "text_based"
                needs_ocr = False
                strategy = "pymupdf_direct"
            elif text_pages == 0:
                sub_type = "scanned"
                needs_ocr = True
                strategy = "ocr_full"
            else:
                sub_type = "mixed"
                needs_ocr = True
                strategy = "pymupdf_selective_ocr"

            return {
                "file_type": "pdf",
                "sub_type": sub_type,
                "is_scanned": (sub_type == "scanned"),
                "needs_ocr": needs_ocr,
                "strategy": strategy,
                "page_count": page_count,
                "scanned_pages": scanned_pages,
                "text_pages": text_pages,
                "pages_analysis": pages_analysis
            }

        except Exception as e:
            log_error("DOCUMENT_DETECTOR", f"Error analyzing PDF {filename}", e)
            return {
                "file_type": "pdf",
                "sub_type": "unknown",
                "is_scanned": False,
                "needs_ocr": False,
                "strategy": "fallback",
                "page_count": 1,
                "pages_analysis": [],
                "error": str(e)
            }
