import io
import fitz  # PyMuPDF
from typing import Dict, Any, List

class PDFValidationError(Exception):
    pass

class PDFValidator:
    @staticmethod
    def validate_pdf_content(pdf_bytes: bytes, original_page_count: int = 1) -> Dict[str, Any]:
        """
        Validates compiled PDF structure and content.
        Checks for blank pages, orphan headers, duplicate pages, layout overflow, and page counts.
        """
        errors = []
        warnings = []
        
        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            page_count = len(doc)
            
            # 1. Page count checks
            if page_count == 0:
                errors.append("Generated PDF contains 0 pages.")
            elif page_count > original_page_count + 1:
                # If page count exceeds budget, raise a warning/error (soft validation block)
                warnings.append(f"Page count overflow: budget is {original_page_count} but generated PDF has {page_count} pages.")
            
            seen_text = set()
            
            for idx, page in enumerate(doc):
                page_text = page.get_text().strip()
                
                # 2. Blank page check
                if not page_text:
                    errors.append(f"Page {idx + 1} is completely blank.")
                    
                # 3. Duplicate page detection
                normalized_text = "".join(page_text.split())[:300]  # First 300 non-whitespace characters
                if normalized_text:
                    if normalized_text in seen_text:
                        errors.append(f"Page {idx + 1} appears to be a duplicate of a previous page.")
                    seen_text.add(normalized_text)
                    
                # 4. Check for broken bullet symbols or orphan headers
                lines = page_text.split("\n")
                for line_idx, line in enumerate(lines):
                    line_strip = line.strip()
                    # Orphan headings: heading at the very bottom of the page
                    if line_idx == len(lines) - 1 and len(line_strip) < 40 and line_strip.isupper():
                        warnings.append(f"Possible orphan heading found at bottom of page {idx + 1}: '{line_strip}'")
                    # Broken bullet symbol artifacts (e.g. empty bullet boxes or question marks)
                    if "" in line_strip or "font" in line_strip.lower():
                        warnings.append(f"Possible encoding/broken bullet symbol on page {idx + 1}: '{line_strip}'")
                        
        except Exception as e:
            errors.append(f"PDF structure is corrupt or failed to open: {str(e)}")
            
        is_valid = len(errors) == 0
        return {
            "isValid": is_valid,
            "errors": errors,
            "warnings": warnings,
            "pageCount": len(doc) if 'doc' in locals() else 0
        }
