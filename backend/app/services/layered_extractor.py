import io
import fitz  # PyMuPDF
import pdfplumber
import docx
import re
from typing import Dict, Any, List
from app.core.exceptions import OCRException
from app.core.logging_service import log_stage, log_error

class LayeredExtractor:
    @staticmethod
    def extract_text(file_content: bytes, filename: str) -> Dict[str, Any]:
        ext = filename.lower().split('.')[-1]
        
        log_stage("EXTRACTOR", "START", f"Running layered extraction for {filename}")
        
        if ext == "pdf":
            return LayeredExtractor._extract_pdf(file_content, filename)
        elif ext in ["docx", "doc"]:
            return LayeredExtractor._extract_docx(file_content, filename)
        elif ext == "txt":
            text = file_content.decode("utf-8", errors="ignore")
            return {
                "text": text.strip(),
                "pages": 1,
                "confidence": 1.0,
                "method": "raw_text"
            }
        else:
            raise OCRException(f"Unsupported file type: {ext}")

    @staticmethod
    def _extract_pdf(file_content: bytes, filename: str) -> Dict[str, Any]:
        log_stage("EXTRACTOR", "START", f"Running layered extraction for {filename}")
        
        try:
            doc = fitz.open(stream=file_content, filetype="pdf")
            pages_count = len(doc)
        except Exception as e:
            log_error("EXTRACTOR", "Failed to open PDF file", e)
            return {
                "text": "",
                "pages": 1,
                "confidence": 0.0,
                "method": "failed",
                "pages_metadata": []
            }

        extracted_pages_text = []
        pages_metadata = []
        method_log = ["PyMuPDF"]
        ocr_performed_pages = 0
        easyocr_reader = None

        for idx, page in enumerate(doc):
            # Step 1: Extract selectable text layer
            page_text = page.get_text().strip()
            
            # Step 2: Compute text confidence density
            words_count = len(page_text.split())
            alphanumeric_count = sum(1 for char in page_text if char.isalnum())
            total_char_count = len(page_text)
            
            confidence = 1.0
            if total_char_count > 0:
                confidence = alphanumeric_count / total_char_count
            
            # Skip OCR if the text layer is valid and readable
            if page_text and words_count >= 20 and confidence >= 0.4:
                extracted_pages_text.append(page_text)
                pages_metadata.append({
                    "page_number": idx + 1,
                    "confidence": float(round(confidence, 2)),
                    "source": "PyMuPDF",
                    "text": page_text
                })
                continue
            
            # Step 3: Run real OCR on the image-only or low-confidence page
            log_stage("EXTRACTOR", "OCR_TRIGGERED", f"Page {idx+1} has low confidence ({confidence:.2f}) or is empty. Running OCR...")
            ocr_performed_pages += 1
            page_ocr_text = ""
            page_source = "PyMuPDF"
            page_conf = confidence
            
            try:
                pix = page.get_pixmap(dpi=150)
                img_data = pix.tobytes("png")
                
                # 1. Try PyTesseract first
                try:
                    import pytesseract
                    from PIL import Image
                    image = Image.open(io.BytesIO(img_data))
                    page_ocr_text = pytesseract.image_to_string(image).strip()
                    page_source = "OCR (PyTesseract)"
                    page_conf = 0.85 # Standard high confidence OCR fallback default
                except Exception as t_err:
                    log_error("EXTRACTOR", "PyTesseract failed, trying EasyOCR fallback", t_err)
                    
                    # 2. Try EasyOCR fallback
                    try:
                        import easyocr
                        if not easyocr_reader:
                            easyocr_reader = easyocr.Reader(['en'], gpu=False)
                        results = easyocr_reader.readtext(img_data, detail=0)
                        page_ocr_text = " ".join(results).strip()
                        page_source = "OCR (EasyOCR)"
                        page_conf = 0.75 # EasyOCR fallback baseline
                    except Exception as e_err:
                        log_error("EXTRACTOR", "EasyOCR fallback failed", e_err)
                        page_ocr_text = ""
            except Exception as render_err:
                log_error("EXTRACTOR", f"Failed to render page {idx+1} as image", render_err)
            
            if page_ocr_text:
                extracted_pages_text.append(page_ocr_text)
                pages_metadata.append({
                    "page_number": idx + 1,
                    "confidence": float(round(page_conf, 2)),
                    "source": page_source,
                    "text": page_ocr_text
                })
                if "OCR" not in method_log:
                    method_log.append("OCR")
            else:
                extracted_pages_text.append(page_text)
                pages_metadata.append({
                    "page_number": idx + 1,
                    "confidence": float(round(confidence, 2)),
                    "source": "PyMuPDF (Low Confidence)",
                    "text": page_text
                })

        # Merge results from all pages
        merged_text = ""
        for p_meta in pages_metadata:
            merged_text += f"\n--- PAGE {p_meta['page_number']} ---\n{p_meta['text']}\n"
        merged_text = merged_text.strip()

        # Clean text artifacts
        from app.services.resume_extraction_service import clean_text_artifacts
        merged_text = clean_text_artifacts(merged_text)

        # Calculate final combined confidence metric
        alphanumeric_count = sum(1 for char in merged_text if char.isalnum())
        total_char_count = len(merged_text)
        final_confidence = 1.0
        if total_char_count > 0:
            final_confidence = alphanumeric_count / total_char_count

        return {
            "text": merged_text.strip(),
            "pages": pages_count or 1,
            "confidence": float(round(final_confidence, 2)),
            "method": " + ".join(method_log),
            "pages_metadata": pages_metadata
        }

    @staticmethod
    def _extract_docx(file_content: bytes, filename: str) -> Dict[str, Any]:
        text = ""
        try:
            doc = docx.Document(io.BytesIO(file_content))
            for para in doc.paragraphs:
                if para.text:
                    text += para.text + "\n"
            
            # Extract table layouts
            for table in doc.tables:
                for row in table.rows:
                    row_cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                    if row_cells:
                        text += " | ".join(row_cells) + "\n"
        except Exception as e:
            # Fallback for old .doc binary files
            log_stage("EXTRACTOR", "FALLBACK", "DOCX parsing failed, decoding binary strings")
            text = file_content.decode('utf-8', errors='ignore')
            text = "".join(ch for ch in text if ch.isprintable() or ch in "\n\r\t ")

        return {
            "text": text.strip(),
            "pages": 1,
            "confidence": 1.0,
            "method": "python-docx",
            "pages_metadata": [
                {
                    "page_number": 1,
                    "confidence": 1.0,
                    "source": "python-docx",
                    "text": text.strip()
                }
            ]
        }
