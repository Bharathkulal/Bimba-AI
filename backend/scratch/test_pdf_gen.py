import sys
import os
import traceback

# Add backend directory to python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.mongodb import db

def main():
    print("MongoDB Connected.")
    
    resume_id = 184
    resume = db.resumes.find_one({"id": resume_id})
    if not resume:
        print("Resume 184 not found.")
        return
        
    student_id = resume["student_id"]
    student = db.students.find_one({"id": student_id})
    
    # Get original data
    original_data = {}
    analysis_record = db.resume_analysis.find_one({"resume_id": resume_id}) or db.resume_analysis.find_one({"id": resume_id})
    if analysis_record and "extracted_data" in analysis_record:
        original_data = analysis_record["extracted_data"]
    
    # Extract the nested "resume" field, which is what the frontend sends as resume_data
    resume_data = resume.get("resume") or {}
    
    # Clean any ObjectIds if they exist
    resume_data.pop("_id", None)
    
    # Prepare payload data
    for k, v in original_data.items():
        if v and (k not in resume_data or not resume_data[k]):
            resume_data[k] = v
            
    print("Running quality gate...")
    from app.api.v1.resumes.resume_builder import run_quality_gate
    gate_errors = run_quality_gate(resume_data, original_data)
    print("Quality gate errors:", gate_errors)
    
    print("Calling Playwright renderer...")
    from app.api.v1.resumes.resume_builder import _call_playwright_renderer
    try:
        pdf_bytes = _call_playwright_renderer(
            resume_data=resume_data,
            template="ats_classic",
            font_family="Roboto",
            font_size="12pt"
        )
        print(f"Renderer OK: {len(pdf_bytes)} bytes")
    except Exception as e:
        print("Renderer failed:")
        traceback.print_exc()
        return

    print("Running PDF validation...")
    try:
        from app.services.pdf_validator import PDFValidator
        orig_pages = analysis_record.get("extracted_data", {}).get("pages", 1) if analysis_record else 1
        pdf_val = PDFValidator.validate_pdf_content(pdf_bytes, original_page_count=orig_pages)
        print("PDF Validation result:", pdf_val)
    except Exception as e:
        print("PDF validation failed:")
        traceback.print_exc()
        return
        
    print("Running lossless check...")
    try:
        import pymupdf
        doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
        pdf_text = "".join(page.get_text() for page in doc).lower()
        doc.close()
        print("Lossless check completed. PDF Text length:", len(pdf_text))
    except Exception as e:
        print("Lossless check failed:")
        traceback.print_exc()
        return
        
    print("All checks completed successfully!")

if __name__ == '__main__':
    main()
