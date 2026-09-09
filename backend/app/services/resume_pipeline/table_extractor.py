import io
from typing import List, Dict, Any, Tuple, Optional
from app.services.resume_pipeline.models import TableBlock, BoundingBox
from app.core.logging_service import log_stage, log_error

try:
    import pdfplumber
except ImportError:
    pdfplumber = None


class TableExtractor:
    """
    Phase 10 — Table Extraction.
    Extracts structured tables separately from PDFs and DOCX files.
    Identifies:
    - Header rows
    - Data rows
    - Deduplicates repeated page headers across page breaks
    - Cleans empty cells / whitespace
    """

    @staticmethod
    def extract_pdf_tables(file_content: bytes) -> Dict[int, List[TableBlock]]:
        """
        Extracts tables page by page from PDF using pdfplumber.
        Returns mapping of page_index (0-based) -> List[TableBlock].
        """
        tables_by_page: Dict[int, List[TableBlock]] = {}
        if pdfplumber is None or not file_content:
            return tables_by_page

        try:
            with pdfplumber.open(io.BytesIO(file_content)) as pdf:
                last_header_signature = None

                for page_idx, page in enumerate(pdf.pages):
                    page_tables = []
                    found = page.find_tables()
                    for t_idx, t in enumerate(found):
                        extracted_matrix = t.extract()
                        if not extracted_matrix or len(extracted_matrix) == 0:
                            continue

                        # Clean and normalize matrix rows
                        cleaned_rows: List[List[str]] = []
                        for row in extracted_matrix:
                            if not row:
                                continue
                            clean_cells = [str(c or "").strip() for c in row]
                            if any(clean_cells):
                                cleaned_rows.append(clean_cells)

                        if not cleaned_rows:
                            continue

                        # Header detection
                        first_row = cleaned_rows[0]
                        headers = first_row
                        data_rows = cleaned_rows[1:] if len(cleaned_rows) > 1 else []

                        # Deduplicate repeated page header across page breaks
                        header_sig = " | ".join(h.lower() for h in headers)
                        if header_sig == last_header_signature and page_idx > 0 and len(cleaned_rows) == 1:
                            # Skip standalone duplicate header
                            continue
                        last_header_signature = header_sig

                        bbox_tuple = t.bbox
                        bbox_obj = None
                        if bbox_tuple and len(bbox_tuple) == 4:
                            bbox_obj = BoundingBox(
                                x0=float(bbox_tuple[0]),
                                y0=float(bbox_tuple[1]),
                                x1=float(bbox_tuple[2]),
                                y1=float(bbox_tuple[3])
                            )

                        tbl_block = TableBlock(
                            id=f"p{page_idx+1}_t{t_idx+1}",
                            page_number=page_idx + 1,
                            headers=headers,
                            rows=data_rows,
                            bbox=bbox_obj,
                            raw_data=cleaned_rows
                        )
                        page_tables.append(tbl_block)

                    tables_by_page[page_idx] = page_tables

        except Exception as e:
            log_error("TABLE_EXTRACTOR", "Failed to extract tables via pdfplumber", e)

        return tables_by_page

    @staticmethod
    def is_bbox_inside_tables(bbox: Any, tables: List[TableBlock]) -> bool:
        """Checks if a text block's bounding box is covered by any table."""
        if not bbox or not tables:
            return False

        if isinstance(bbox, BoundingBox):
            bx0, by0, bx1, by1 = bbox.x0, bbox.y0, bbox.x1, bbox.y1
        elif isinstance(bbox, dict):
            bx0 = bbox.get("x0", bbox.get("x", 0))
            by0 = bbox.get("y0", bbox.get("y", 0))
            bx1 = bbox.get("x1", bx0 + bbox.get("width", 0))
            by1 = bbox.get("y1", by0 + bbox.get("height", 0))
        elif isinstance(bbox, (list, tuple)) and len(bbox) == 4:
            bx0, by0, bx1, by1 = bbox
        else:
            return False

        b_area = (bx1 - bx0) * (by1 - by0)
        if b_area <= 0:
            return False

        for t in tables:
            if not t.bbox:
                continue
            tx0, ty0, tx1, ty1 = t.bbox.x0, t.bbox.y0, t.bbox.x1, t.bbox.y1
            ix0 = max(bx0, tx0)
            iy0 = max(by0, ty0)
            ix1 = min(bx1, tx1)
            iy1 = min(by1, ty1)

            if ix1 > ix0 and iy1 > iy0:
                overlap = (ix1 - ix0) * (iy1 - iy0)
                if (overlap / b_area) > 0.5:
                    return True

        return False
