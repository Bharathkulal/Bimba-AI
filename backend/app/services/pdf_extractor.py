"""
PyMuPDF (fitz) Primary PDF Text Extraction Service for BIMBA AI
Extracts high-fidelity raw text page-by-page with quality checks and fallback.
"""

import io
import os
import logging
from typing import Dict, Any, List, Union

logger = logging.getLogger("bimba_ai_pipeline")

try:
    import fitz  # PyMuPDF
except ImportError:
    try:
        import pymupdf as fitz
    except ImportError:
        fitz = None


class PDFExtractor:
    @staticmethod
    def extract_text_from_pdf(file_input: Union[str, bytes, io.BytesIO], filename: str = "document.pdf") -> Dict[str, Any]:
        """
        Primary PDF Text Extractor using PyMuPDF (fitz).
        Extracts all pages without any truncation and performs quality verification.
        Falls back to pdfplumber if PyMuPDF output is empty or below quality threshold.
        """
        logger.info("INFO: PyMuPDF extraction started")
        
        pages: List[Dict[str, Any]] = []
        full_text = ""
        page_count = 0
        doc = None
        method = "PyMuPDF"
        quality = "GOOD"
        
        # 1. Primary Extraction with PyMuPDF
        if fitz is not None:
            try:
                if isinstance(file_input, str):
                    doc = fitz.open(file_input)
                elif isinstance(file_input, (bytes, bytearray)):
                    doc = fitz.open(stream=file_input, filetype="pdf")
                elif hasattr(file_input, "read"):
                    data = file_input.read()
                    doc = fitz.open(stream=data, filetype="pdf")
                
                if doc is not None:
                    page_count = len(doc)
                    logger.info(f"INFO: Page count: {page_count}")
                    
                    for page_number, page in enumerate(doc):
                        page_text = page.get_text("text") or ""
                        pages.append({
                            "page_number": page_number + 1,
                            "text": page_text,
                            "char_count": len(page_text)
                        })
                    
                    doc.close()
                    full_text = "\n\n".join(page["text"] for page in pages).strip()
            except Exception as e:
                logger.error(f"ERROR: PyMuPDF extraction failed: {str(e)}")
                doc = None

        # 2. Quality Validation (Check if text is empty or extremely short < 50 chars)
        extracted_char_count = len(full_text.strip())
        logger.info(f"INFO: Extracted characters: {extracted_char_count}")

        if extracted_char_count < 50:
            quality = "POOR"
            logger.warning(f"WARN: PyMuPDF extracted only {extracted_char_count} chars. Attempting pdfplumber fallback...")
            
            # 3. Fallback to pdfplumber
            try:
                import pdfplumber
                pdf_bytes_io = None
                if isinstance(file_input, str) and os.path.exists(file_input):
                    with open(file_input, "rb") as f:
                        pdf_bytes_io = io.BytesIO(f.read())
                elif isinstance(file_input, (bytes, bytearray)):
                    pdf_bytes_io = io.BytesIO(file_input)
                elif hasattr(file_input, "seek"):
                    file_input.seek(0)
                    pdf_bytes_io = io.BytesIO(file_input.read())

                if pdf_bytes_io:
                    fallback_pages = []
                    with pdfplumber.open(pdf_bytes_io) as plumber_pdf:
                        page_count = len(plumber_pdf.pages)
                        for p_num, p in enumerate(plumber_pdf.pages):
                            p_txt = p.extract_text() or ""
                            fallback_pages.append({
                                "page_number": p_num + 1,
                                "text": p_txt,
                                "char_count": len(p_txt)
                            })
                    
                    plumber_text = "\n\n".join(p["text"] for p in fallback_pages).strip()
                    if len(plumber_text) > extracted_char_count:
                        pages = fallback_pages
                        full_text = plumber_text
                        method = "pdfplumber_fallback"
                        quality = "GOOD" if len(full_text) >= 50 else "POOR"
                        logger.info(f"INFO: pdfplumber fallback extracted {len(full_text)} characters")
            except Exception as pe:
                logger.error(f"ERROR: pdfplumber fallback failed: {str(pe)}")

        if len(full_text.strip()) >= 50:
            logger.info("INFO: Extraction quality: GOOD")
        else:
            logger.warning("INFO: Extraction quality: POOR")

        return {
            "full_text": full_text,
            "raw_extracted_text": full_text,
            "pages": pages,
            "page_count": page_count if page_count > 0 else len(pages),
            "extraction_method": method,
            "extraction_quality": quality,
            "original_file_name": filename
        }


# Convenience functional alias
extract_text_from_pdf = PDFExtractor.extract_text_from_pdf
