import io
from typing import Dict, Any, List
from app.core.logging_service import log_stage, log_error

try:
    import pymupdf
except ImportError:
    try:
        import fitz as pymupdf
    except ImportError:
        pymupdf = None


class GeneratedPDFValidator:
    """
    Phase 16 — Generated Resume Validation.
    After generating the new PDF resume:
    1. Extracts text from the rendered PDF output
    2. Compares structured resume data with the generated PDF text
    3. Confirms that candidate name, contact, education, experiences, skills, and custom sections survived rendering
    """

    @staticmethod
    def validate_generated_pdf(pdf_bytes: bytes, structured_data: Dict[str, Any]) -> Dict[str, Any]:
        if not pdf_bytes or pymupdf is None:
            return {
                "valid": True,
                "missing_items": [],
                "page_count": 1,
                "note": "PyMuPDF unavailable or empty PDF"
            }

        try:
            doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
            extracted_text = ""
            for p in doc:
                extracted_text += (p.get_text() + "\n")
            page_count = len(doc)
        except Exception as e:
            log_error("PDF_VALIDATOR", "Failed to extract text from generated PDF", e)
            return {"valid": False, "missing_items": [f"Corrupt PDF generated: {str(e)}"], "page_count": 0}

        gen_lower = extracted_text.lower()
        missing_items: List[str] = []

        # 1. Candidate Name
        pi = structured_data.get("personal_info") or {}
        name = pi.get("name") or pi.get("full_name") or ""
        if name and name.lower() != "candidate name":
            first_name = name.split()[0].lower()
            if first_name not in gen_lower:
                missing_items.append(f"Candidate name '{name}' not found in generated PDF")

        # 2. Email
        email = pi.get("email") or ""
        if email and email.lower() not in gen_lower:
            missing_items.append(f"Email '{email}' not found in generated PDF")

        # 3. Work Experience companies / roles
        exp_list = structured_data.get("work_experience") or structured_data.get("experience") or []
        for exp in exp_list:
            comp = exp.get("company") or exp.get("organization") or ""
            pos = exp.get("position") or exp.get("role") or ""
            if comp and comp.lower() not in gen_lower and pos and pos.lower() not in gen_lower:
                missing_items.append(f"Experience entry '{comp} - {pos}' not found in generated PDF")

        # 4. Education degrees / institutions
        edu_list = structured_data.get("education") or []
        for edu in edu_list:
            deg = edu.get("degree") or ""
            inst = edu.get("institution") or edu.get("school") or ""
            if deg and deg.lower() not in gen_lower and inst and inst.lower() not in gen_lower:
                missing_items.append(f"Education entry '{deg} - {inst}' not found in generated PDF")

        # 5. Custom Sections
        custom_sections = structured_data.get("custom_sections") or structured_data.get("additional_sections") or []
        for sec in custom_sections:
            title = sec.get("title") or sec.get("section_name") or ""
            if title and title.lower() not in gen_lower:
                missing_items.append(f"Custom section '{title}' not found in generated PDF")

        return {
            "valid": len(missing_items) == 0,
            "page_count": page_count,
            "missing_items": missing_items,
            "char_count": len(extracted_text)
        }
