import io
from typing import Dict, Any, Optional
from app.core.logging_service import log_stage, log_error

class PipelineOCRService:
    """
    Phase 2 & Phase 19 — Selective OCR Fallback.
    OCR triggers ONLY when:
    1. Extracted text is empty or < 35 characters
    2. Character confidence is severely degraded
    3. DocumentDetector flags page as scanned
    
    Never executes OCR on standard text-based PDFs to preserve maximum speed (< 150ms).
    """

    _easyocr_reader = None

    @classmethod
    def get_easyocr_reader(cls):
        if cls._easyocr_reader is None:
            try:
                import easyocr
                cls._easyocr_reader = easyocr.Reader(['en'], gpu=False)
            except Exception as e:
                log_error("OCR", "EasyOCR initialization failed", e)
                cls._easyocr_reader = False
        return cls._easyocr_reader if cls._easyocr_reader is not False else None

    @classmethod
    def perform_ocr_on_image_bytes(cls, img_bytes: bytes) -> Dict[str, Any]:
        """Runs PyTesseract or EasyOCR on image bytes."""
        text = ""
        engine = "none"
        confidence = 0.0

        # 1. Try PyTesseract first
        try:
            import pytesseract
            from PIL import Image
            image = Image.open(io.BytesIO(img_bytes))
            text = pytesseract.image_to_string(image).strip()
            if text:
                engine = "PyTesseract"
                confidence = 0.85
                return {"text": text, "engine": engine, "confidence": confidence}
        except Exception as t_err:
            log_error("OCR", "PyTesseract OCR failed, attempting fallback", t_err)

        # 2. Try EasyOCR fallback
        try:
            reader = cls.get_easyocr_reader()
            if reader:
                results = reader.readtext(img_bytes, detail=0)
                text = " ".join(results).strip()
                if text:
                    engine = "EasyOCR"
                    confidence = 0.75
                    return {"text": text, "engine": engine, "confidence": confidence}
        except Exception as e_err:
            log_error("OCR", "EasyOCR OCR fallback failed", e_err)

        return {"text": text, "engine": engine, "confidence": confidence}

    @classmethod
    def ocr_page_pixmap(cls, page: Any, dpi: int = 150) -> Dict[str, Any]:
        """Renders PyMuPDF page pixmap and runs selective OCR."""
        try:
            pix = page.get_pixmap(dpi=dpi)
            img_bytes = pix.tobytes("png")
            return cls.perform_ocr_on_image_bytes(img_bytes)
        except Exception as e:
            log_error("OCR", "Failed to render page pixmap for OCR", e)
            return {"text": "", "engine": "failed", "confidence": 0.0}
