import io
import docx
import re
from typing import Dict, Any, List
from app.core.exceptions import OCRException
from app.core.logging_service import log_stage, log_error

try:
    import pymupdf
except ImportError:
    try:
        import fitz as pymupdf
    except ImportError:
        pymupdf = None

try:
    import pdfplumber
except ImportError:
    pdfplumber = None


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
    def _is_inside_table(bbox: Any, table_bboxes: List[tuple]) -> bool:
        if not bbox or not table_bboxes:
            return False
        if isinstance(bbox, dict):
            x0 = bbox["x"]
            y0 = bbox["y"]
            x1 = x0 + bbox["width"]
            y1 = y0 + bbox["height"]
        else:
            x0, y0, x1, y1 = bbox
            
        for tx0, ty0, tx1, ty1 in table_bboxes:
            ix0 = max(x0, tx0)
            iy0 = max(y0, ty0)
            ix1 = min(x1, tx1)
            iy1 = min(y1, ty1)
            if ix1 > ix0 and iy1 > iy0:
                overlap_area = (ix1 - ix0) * (iy1 - iy0)
                block_area = (x1 - x0) * (y1 - y0)
                if block_area > 0 and (overlap_area / block_area) > 0.5:
                    return True
        return False

    @staticmethod
    def _strip_page_numbers_and_markers(text: str) -> str:
        lines = text.split("\n")
        cleaned_lines = []
        for line in lines:
            l_strip = line.strip()
            if re.match(r'^(page\s+\d+(\s+of\s+\d+)?|\d+\s*/\s*\d+|\d+|---\s*page\s+\d+\s*---)$', l_strip, re.IGNORECASE):
                continue
            cleaned_lines.append(line)
        return "\n".join(cleaned_lines)

    @staticmethod
    def _extract_pdf(file_content: bytes, filename: str) -> Dict[str, Any]:
        log_stage("EXTRACTOR", "START", f"Running layered extraction for {filename}")
        
        pages_count = 1
        doc = None
        if pymupdf is not None:
            try:
                doc = pymupdf.open(stream=file_content, filetype="pdf")
                pages_count = len(doc)
            except Exception as e:
                log_error("EXTRACTOR", "Failed to open PDF file with PyMuPDF", e)
                doc = None

        if doc is None:
            try:
                import pypdf
                reader = pypdf.PdfReader(io.BytesIO(file_content))
                extracted = []
                for p in reader.pages:
                    txt = p.extract_text() or ""
                    if txt:
                        extracted.append(txt)
                full_text = "\n".join(extracted)
                return {
                    "text": full_text.strip(),
                    "pages": len(reader.pages),
                    "confidence": 0.8,
                    "method": "pypdf_fallback",
                    "pages_metadata": [{"text": full_text}]
                }
            except Exception as pe:
                log_error("EXTRACTOR", "pypdf fallback failed", pe)
                return {
                    "text": "",
                    "pages": 1,
                    "confidence": 0.0,
                    "method": "failed",
                    "pages_metadata": []
                }


        # Attempt to pre-extract tables via pdfplumber
        table_bboxes_by_page = {}
        tables_data_by_page = {}
        try:
            import pdfplumber
            with pdfplumber.open(io.BytesIO(file_content)) as pdf:
                for p_idx, pdf_page in enumerate(pdf.pages):
                    table_bboxes_by_page[p_idx] = []
                    tables_data_by_page[p_idx] = []
                    found_tables = pdf_page.find_tables()
                    for t in found_tables:
                        table_bboxes_by_page[p_idx].append(t.bbox)
                        tables_data_by_page[p_idx].append({
                            "bbox": t.bbox,
                            "data": t.extract()
                        })
            if tables_data_by_page:
                log_stage("EXTRACTOR", "TABLES_DETECTED", f"Detected tables across pages: {list(tables_data_by_page.keys())}")
        except Exception as table_err:
            log_error("EXTRACTOR", "pdfplumber table detection failed", table_err)

        extracted_pages_text = []
        pages_metadata = []
        raw_pages = []
        all_blocks = []
        method_log = ["PyMuPDF"]
        ocr_performed_pages = 0
        easyocr_reader = None

        for idx, page in enumerate(doc):
            # Step 1: Extract selectable text layer
            try:
                page_dict = page.get_text("dict")
            except Exception:
                page_dict = None

            page_text = ""
            page_blocks = []
            
            page_table_bboxes = table_bboxes_by_page.get(idx, [])
            page_tables_data = tables_data_by_page.get(idx, [])
            
            layout_items = []
            
            if page_dict and isinstance(page_dict, dict):
                for b in page_dict.get("blocks", []):
                    block_text = ""
                    spans = []
                    for line in b.get("lines", []):
                        for span in line.get("spans", []):
                            span_text = span.get("text", "").strip()
                            if span_text:
                                block_text += (span_text + " ")
                                spans.append({
                                    "text": span_text,
                                    "font": span.get("font", ""),
                                    "size": span.get("size", 0)
                                })
                    block_text = block_text.strip()
                    if block_text:
                        bbox = b.get("bbox", None)
                        bbox_obj = None
                        if bbox and isinstance(bbox, (list, tuple)) and len(bbox) == 4:
                            x0, y0, x1, y1 = bbox
                            bbox_obj = {
                                "x": float(x0),
                                "y": float(y0),
                                "width": float(x1 - x0),
                                "height": float(y1 - y0)
                            }

                        # Check if inside table bounding box
                        if bbox and LayeredExtractor._is_inside_table(bbox, page_table_bboxes):
                            continue

                        block = {
                            "id": f"p{idx+1}_b{len(page_blocks)+1}",
                            "page": idx+1,
                            "text": block_text,
                            "bbox": bbox_obj,
                            "block_type": b.get("type", "text"),
                            "spans": spans
                        }
                        page_blocks.append(block)
                        all_blocks.append(block)
                        
                        layout_items.append({
                            "type": "text",
                            "y0": bbox[1] if bbox else 0,
                            "text": block_text
                        })
                        
                # Add tables
                for t_idx, t_data in enumerate(page_tables_data):
                    layout_items.append({
                        "type": "table",
                        "y0": t_data["bbox"][1],
                        "data": t_data["data"]
                    })
                    
                # Sort page components vertically to respect visual layout
                layout_items.sort(key=lambda item: item["y0"])
                
                constructed_parts = []
                for item in layout_items:
                    if item["type"] == "text":
                        constructed_parts.append(item["text"])
                    elif item["type"] == "table":
                        table_text = "<TABLE>\n"
                        for r_idx, row in enumerate(item["data"]):
                            if not row:
                                continue
                            row_cells = [str(cell or "").strip().replace("\n", "\\n") for cell in row]
                            if not any(row_cells):
                                continue
                            if r_idx == 0:
                                table_text += "<TR-HEADER> " + " | ".join(row_cells) + "\n"
                            else:
                                table_text += "<TR> " + " | ".join(row_cells) + "\n"
                        table_text += "</TABLE>"
                        constructed_parts.append(table_text)
                page_text = "\n".join(constructed_parts)
            else:
                page_text = page.get_text().strip()
                # If page dict failed, construct fallback with table appending
                if page_tables_data:
                    for t_data in page_tables_data:
                        table_text = "\n<TABLE>\n"
                        for r_idx, row in enumerate(t_data["data"]):
                            if not row:
                                continue
                            row_cells = [str(cell or "").strip().replace("\n", "\\n") for cell in row]
                            if not any(row_cells):
                                continue
                            if r_idx == 0:
                                table_text += "<TR-HEADER> " + " | ".join(row_cells) + "\n"
                            else:
                                table_text += "<TR> " + " | ".join(row_cells) + "\n"
                        table_text += "</TABLE>\n"
                        page_text += table_text
            
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
                raw_pages.append({
                    "page_number": idx + 1,
                    "width": float(page.rect.width),
                    "height": float(page.rect.height),
                    "blocks": page_blocks
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
                    page_conf = 0.85
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
                        page_conf = 0.75
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
                raw_pages.append({
                    "page_number": idx + 1,
                    "width": float(page.rect.width),
                    "height": float(page.rect.height),
                    "blocks": page_blocks or [{"id": f"p{idx+1}_ocr", "page": idx+1, "text": page_ocr_text, "bbox": None, "spans": []}]
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
                raw_pages.append({
                    "page_number": idx + 1,
                    "width": float(page.rect.width),
                    "height": float(page.rect.height),
                    "blocks": page_blocks
                })

        # Merge results from all pages, stripping raw page number boundary markers completely
        merged_text = ""
        for p_meta in pages_metadata:
            cleaned_p_text = LayeredExtractor._strip_page_numbers_and_markers(p_meta['text'])
            merged_text += f"\n{cleaned_p_text}\n"
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
            "pages_metadata": pages_metadata,
            "raw_document": {
                "pages": raw_pages,
                "blocks": all_blocks,
                "source": "pymupdf",
            }
        }

    @staticmethod
    def _extract_docx(file_content: bytes, filename: str) -> Dict[str, Any]:
        text = ""
        try:
            from docx.document import Document
            from docx.oxml.table import CT_Tbl
            from docx.oxml.text.paragraph import CT_P
            from docx.table import _Cell, Table
            from docx.text.paragraph import Paragraph

            doc = docx.Document(io.BytesIO(file_content))
            
            def iter_block_items(parent):
                if isinstance(parent, Document):
                    parent_elm = parent.element.body
                elif isinstance(parent, _Cell):
                    parent_elm = parent._tc
                else:
                    return

                for child in parent_elm.iterchildren():
                    if isinstance(child, CT_P):
                        yield Paragraph(child, parent)
                    elif isinstance(child, CT_Tbl):
                        yield Table(child, parent)

            for block in iter_block_items(doc):
                if isinstance(block, Paragraph):
                    if block.text.strip():
                        # Add bold/upper cues for heuristic parser
                        is_heading = False
                        if len(block.text) < 60:
                            if any(run.bold for run in block.runs if run.text.strip()):
                                is_heading = True
                            if block.text.isupper():
                                is_heading = True
                        if is_heading:
                            text += f"<H> {block.text.strip()} </H>\n"
                        else:
                            text += block.text.strip() + "\n"
                elif isinstance(block, Table):
                    text += "<TABLE>\n"
                    for i, row in enumerate(block.rows):
                        row_data = []
                        for cell in row.cells:
                            # Extract text from cell preserving newlines
                            cell_text = "\\n".join(p.text.strip() for p in cell.paragraphs if p.text.strip())
                            row_data.append(cell_text)
                        if any(row_data):
                            # Mark first row as header if it's the first row
                            if i == 0:
                                text += "<TR-HEADER> " + " | ".join(row_data) + "\n"
                            else:
                                text += "<TR> " + " | ".join(row_data) + "\n"
                    text += "</TABLE>\n"

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
