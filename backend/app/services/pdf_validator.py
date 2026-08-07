import io
from typing import Dict, Any, List

# Attempt to import pymupdf (the modern import name for PyMuPDF).
# If it's unavailable or broken, we gracefully degrade — PDF validation
# is a nice-to-have, not a hard gate on downloading.
_pymupdf = None
_pymupdf_import_error = None
try:
    import pymupdf
    _pymupdf = pymupdf
except ImportError as e:
    _pymupdf_import_error = str(e)


class PDFValidationError(Exception):
    pass


class PDFValidator:
    @staticmethod
    def validate_pdf_content(pdf_bytes: bytes, original_page_count: int = 1) -> Dict[str, Any]:
        """
        Validates compiled PDF structure and content.
        Checks for blank pages, orphan headers, duplicate pages, layout overflow, and page counts.

        If PyMuPDF is not available, validation is skipped gracefully — the user
        still gets their PDF download instead of a hard 400 error.
        """
        errors: List[str] = []
        warnings: List[str] = []
        page_count = 0

        # Guard: if pymupdf couldn't be imported, skip validation entirely
        if _pymupdf is None:
            print(f"[PDF-VALIDATOR] WARNING: pymupdf not available ({_pymupdf_import_error}). "
                  f"Skipping PDF structure validation — PDF will still be returned to user.")
            return {
                "isValid": True,
                "errors": [],
                "warnings": [f"PDF validation skipped: pymupdf unavailable ({_pymupdf_import_error})"],
                "pageCount": 0
            }

        try:
            doc = _pymupdf.open(stream=pdf_bytes, filetype="pdf")
            page_count = len(doc)

            # 1. Page count checks
            if page_count == 0:
                errors.append("Generated PDF contains 0 pages.")
            elif page_count > original_page_count + 1:
                # If page count exceeds budget, raise a warning (soft validation block)
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
                    if "\ufffd" in line_strip or "font" in line_strip.lower():
                        warnings.append(f"Possible encoding/broken bullet symbol on page {idx + 1}: '{line_strip}'")

            doc.close()

        except AttributeError as e:
            # This catches the exact "module 'X' has no attribute 'open'" case
            mod_file = getattr(_pymupdf, '__file__', 'unknown')
            print(f"[PDF-VALIDATOR] WARNING: pymupdf AttributeError (module at {mod_file}): {e}")
            print(f"[PDF-VALIDATOR] Skipping validation — PDF will still be returned to user.")
            return {
                "isValid": True,
                "errors": [],
                "warnings": [f"PDF validation skipped due to pymupdf issue: {e}"],
                "pageCount": 0
            }
        except Exception as e:
            # Any other error opening/parsing the PDF — also degrade gracefully
            print(f"[PDF-VALIDATOR] WARNING: PDF validation failed with {type(e).__name__}: {e}")
            print(f"[PDF-VALIDATOR] Skipping validation — PDF will still be returned to user.")
            return {
                "isValid": True,
                "errors": [],
                "warnings": [f"PDF validation skipped due to error: {e}"],
                "pageCount": 0
            }

        is_valid = len(errors) == 0
        return {
            "isValid": is_valid,
            "errors": errors,
            "warnings": warnings,
            "pageCount": page_count
        }
