from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Optional, Any
from pydantic import BaseModel
from datetime import datetime, timezone
import json, time, urllib.request, urllib.error
from app.database.session import get_db
from app.api.analytics import get_current_student
from app.models.student import Student
from app.services.cloudinary_service import upload_file
from app.core.mongodb import get_next_sequence

PDF_RENDERER_URL = "http://127.0.0.1:5174/render-pdf"

def _call_playwright_renderer(
    resume_data: dict, 
    template: str, 
    font_family: str = "Inter", 
    font_size: str = "11pt",
    custom_config: dict = None
) -> bytes:
    """
    Calls the Node.js Playwright PDF renderer microservice.
    Retries up to 3 times with 1s exponential backoff.
    Returns raw PDF bytes.
    """
    payload_dict = {
        "template": template,
        "data": resume_data,
        "fontFamily": font_family,
        "fontSize": font_size
    }
    if custom_config:
        payload_dict.update(custom_config)
    payload = json.dumps(payload_dict).encode("utf-8")

    last_error = None
    for attempt in range(1, 4):
        try:
            req = urllib.request.Request(
                PDF_RENDERER_URL,
                data=payload,
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=35) as resp:
                body = json.loads(resp.read().decode("utf-8"))
                if not body.get("success"):
                    raise RuntimeError(f"Renderer returned error: {body.get('error', 'unknown')}")
                import base64
                return base64.b64decode(body["pdf_base64"])
        except urllib.error.URLError as e:
            last_error = e
            print(f"[PDF renderer] Attempt {attempt}/3 failed (URLError): {e}")
            if attempt < 3:
                time.sleep(attempt * 1.0)
        except Exception as e:
            last_error = e
            print(f"[PDF renderer] Attempt {attempt}/3 failed: {e}")
            if attempt < 3:
                time.sleep(attempt * 1.0)

    raise RuntimeError(
        f"PDF renderer unreachable after 3 attempts. "
        f"Ensure the Node renderer is running: "
        f"cd backend/pdf_renderer && node server.mjs. "
        f"Last error: {last_error}"
    )

router = APIRouter(prefix="/resume", tags=["Resume Builder & PDF Engine"])

class GeneratePdfRequest(BaseModel):
    template: str
    resume_data: Dict[str, Any]
    font_family: Optional[str] = "Inter"
    font_size: Optional[str] = "11pt"
    custom_config: Optional[Dict[str, Any]] = None

@router.get("/builder/{resume_id}")
def get_resume_builder_data(
    resume_id: int,
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    """
    GET /api/resume/builder/{resume_id}
    Retrieves the raw extracted data and improvements for the editor.
    """
    # 1. Fetch resume and verify ownership
    resume_doc = db.resumes.find_one({"id": resume_id, "student_id": student.id})
    if not resume_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found or unauthorized"
        )
        
    # 2. Fetch analysis record containing extracted_data and ai_improvements
    analysis_record = db.resume_analysis.find_one({
        "resume_id": resume_id,
        "student_id": student.id
    })
    
    db_resume_data = resume_doc.get("resume") or {}
    
    extracted = {}
    if db_resume_data:
        extracted = db_resume_data
    
    # Load sections prioritizing edit payload then root fields then analysis_record
    summary = extracted.get("summary") or resume_doc.get("summary") or ""
    if not summary and analysis_record:
        summary = analysis_record.get("extracted_data", {}).get("summary", "")
        
    skills_raw = extracted.get("skills") or resume_doc.get("skills") or []
    if not skills_raw and analysis_record:
        skills_raw = analysis_record.get("extracted_data", {}).get("skills", [])
        
    # Map skills array of dictionaries or strings cleanly to a string list
    skills = []
    if isinstance(skills_raw, list):
        for s in skills_raw:
            if isinstance(s, dict):
                skills.append(s.get("name") or s.get("skill") or "")
            elif s:
                skills.append(str(s))
    elif isinstance(skills_raw, str):
        skills = [s.strip() for s in skills_raw.split(",") if s.strip()]
        
    experience = extracted.get("experience") or resume_doc.get("experience") or []
    if not experience and analysis_record:
        experience = analysis_record.get("extracted_data", {}).get("experience", [])
        
    projects = extracted.get("projects") or resume_doc.get("projects") or []
    if not projects and analysis_record:
        projects = analysis_record.get("extracted_data", {}).get("projects", [])
        
    education = extracted.get("education") or resume_doc.get("education") or []
    if not education and analysis_record:
        education = analysis_record.get("extracted_data", {}).get("education", [])

    improvements = {}
    if analysis_record:
        improvements = analysis_record.get("ai_improvements", {})

    personal_info = extracted.get("personal_info") or {}
    doc_name = resume_doc.get("name") or ""
    clean_name = doc_name.replace("AI Parsed - ", "").replace("AI Diagnostic - ", "").replace("AI Optimized - ", "").strip()
    if clean_name.lower() == "resume":
        clean_name = ""

    if not personal_info:
        personal_info = {
            "name": extracted.get("name") or clean_name or student.student_name or "",
            "email": extracted.get("email") or resume_doc.get("email") or student.personal_email or "",
            "phone": extracted.get("phone") or resume_doc.get("phone") or student.phone or "",
            "location": extracted.get("location") or resume_doc.get("address") or student.address or ""
        }
        
    # Standard validation without fake fallbacks
    if not personal_info.get("name"):
        personal_info["name"] = student.student_name or ""
    if not personal_info.get("email"):
        personal_info["email"] = student.personal_email or ""
    if not personal_info.get("phone"):
        personal_info["phone"] = student.phone or ""
    if not personal_info.get("location"):
        personal_info["location"] = student.address or ""

    # Check MongoDB resume_profiles collection
    profile_doc = db.resume_profiles.find_one({"resumeId": resume_id}) or {}

    # Construct clean response with all 15 sections
    return {
        "success": True,
        "extracted_data": {
            "personal_info": profile_doc.get("personal_info") or personal_info,
            "summary": profile_doc.get("summary") or (summary[0] if isinstance(summary, list) and summary else str(summary or "")),
            "objective": profile_doc.get("objective") or "",
            "skills": profile_doc.get("technicalSkills") or skills,
            "technicalSkills": profile_doc.get("technicalSkills") or skills,
            "softSkills": profile_doc.get("softSkills") or [],
            "experience": profile_doc.get("experience") or [
                {
                    "position": exp.get("position") or exp.get("role") or "",
                    "company": exp.get("company") or "",
                    "duration": exp.get("duration") or exp.get("year") or "",
                    "description": exp.get("description") or ""
                } if isinstance(exp, dict) else {
                    "position": "",
                    "company": "",
                    "duration": "",
                    "description": str(exp)
                } for exp in experience
            ] if isinstance(experience, list) else [],
            "projects": profile_doc.get("projects") or [
                {
                    "title": proj.get("title") or proj.get("name") or "",
                    "technologies": proj.get("technologies") or proj.get("tech_stack") or "",
                    "description": proj.get("description") or ""
                } if isinstance(proj, dict) else {
                    "title": "",
                    "technologies": "",
                    "description": str(proj)
                } for proj in projects
            ] if isinstance(projects, list) else [],
            "education": profile_doc.get("education") or [
                {
                    "degree": edu.get("degree") or edu.get("course") or "",
                    "institution": edu.get("institution") or edu.get("school") or edu.get("college") or "",
                    "year": edu.get("year") or edu.get("passing_year") or ""
                } if isinstance(edu, dict) else {
                    "degree": "",
                    "institution": "",
                    "year": str(edu)
                } for edu in education
            ] if isinstance(education, list) else [],
            "certifications": profile_doc.get("certifications") or [],
            "internships": profile_doc.get("internships") or [],
            "achievements": profile_doc.get("achievements") or [],
            "languages": profile_doc.get("languages") or [],
            "portfolioLinks": profile_doc.get("portfolioLinks") or [],
            "publications": profile_doc.get("publications") or [],
            "volunteerExperience": profile_doc.get("volunteerExperience") or [],
            "references": profile_doc.get("references") or []
        },
        "ai_improvements": improvements
    }

import re

def run_quality_gate(resume_data: dict, original_data: dict) -> List[str]:
    errors = []
    
    # 1. Contact details present
    pi = resume_data.get("personal_info", {}) or {}
    if not pi.get("name") or str(pi.get("name")).strip() == "" or pi.get("name") == "Candidate Name":
        errors.append("Contact Details: Candidate Name is missing or default.")
    if not pi.get("email") or str(pi.get("email")).strip() == "":
        errors.append("Contact Details: Email address is missing.")
    if not pi.get("phone") or str(pi.get("phone")).strip() == "":
        errors.append("Contact Details: Phone number is missing.")
        
    # 2. No empty headings
    for idx, edu in enumerate(resume_data.get("education", [])):
        if not edu.get("institution") or str(edu.get("institution")).strip() == "":
            errors.append(f"Education item {idx+1}: Institution name is empty.")
        if not edu.get("degree") or str(edu.get("degree")).strip() == "":
            errors.append(f"Education item {idx+1}: Degree name is empty.")
            
    for idx, exp in enumerate(resume_data.get("experience", [])):
        if not exp.get("company") or str(exp.get("company")).strip() == "":
            errors.append(f"Experience item {idx+1}: Company name is empty.")
        if not exp.get("position") or str(exp.get("position")).strip() == "":
            errors.append(f"Experience item {idx+1}: Position title is empty.")
            
    for idx, proj in enumerate(resume_data.get("projects", [])):
        title = proj.get("title") or proj.get("name")
        if not title or str(title).strip() == "":
            errors.append(f"Project item {idx+1}: Project title is empty.")
            
    # 3. Valid date sequences
    def parse_year(val):
        if not val:
            return None
        match = re.search(r'\b(19|20)\d{2}\b', str(val))
        return int(match.group(0)) if match else None
        
    for idx, exp in enumerate(resume_data.get("experience", [])):
        dur = exp.get("duration", "")
        if dur and "-" in dur:
            parts = dur.split("-")
            start_yr = parse_year(parts[0])
            end_yr = parse_year(parts[1])
            if start_yr and end_yr and start_yr > end_yr:
                errors.append(f"Experience item {idx+1}: Start date ({start_yr}) cannot be after end date ({end_yr}).")
                
    # 4. Integrity validation (prevent missing sections)
    if original_data:
        from app.services.integrity_validator import ResumeIntegrityValidator
        val_res = ResumeIntegrityValidator.validate(original_data, resume_data)
        if not val_res["isValid"]:
            errors.extend(val_res["errors"])
            
    return errors

@router.post("/generate-pdf/{resume_id}")
async def generate_resume_pdf_endpoint(
    resume_id: int,
    payload: GeneratePdfRequest,
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    """
    POST /api/resume/generate-pdf/{resume_id}
    Generates ReportLab PDF, uploads it to Cloudinary, and stores metadata link.
    """
    import traceback
    print(f"\n{'='*60}")
    print(f"[PDF-GEN] Starting PDF generation for resume_id={resume_id}, student_id={student.id}")
    print(f"[PDF-GEN] Template: {payload.template}, Font: {payload.font_family}/{payload.font_size}")
    print(f"{'='*60}")

    try:
        # 1. Verify resume ownership
        print(f"[PDF-GEN] Step 1: Verifying resume ownership...")
        resume_doc = db.resumes.find_one({"id": resume_id, "student_id": student.id})
        if not resume_doc:
            print(f"[PDF-GEN] Step 1 FAILED: Resume {resume_id} not found for student {student.id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resume not found or unauthorized"
            )
        print(f"[PDF-GEN] Step 1 OK: Resume found (name={resume_doc.get('name', 'N/A')})")

        # 2. Run Quality Gate checks
        print(f"[PDF-GEN] Step 2: Running quality gate checks...")
        original_data = {}
        analysis_record = db.resume_analysis.find_one({"resume_id": resume_id, "student_id": student.id})
        if analysis_record and "extracted_data" in analysis_record:
            original_data = analysis_record["extracted_data"]
            print(f"[PDF-GEN] Step 2: Found analysis record with extracted_data")
        else:
            print(f"[PDF-GEN] Step 2: No analysis record found — using empty original_data (scratch resume)")

        gate_errors = run_quality_gate(payload.resume_data, original_data)
        if gate_errors:
            print(f"[PDF-GEN] Step 2 FAILED: Quality gate errors: {gate_errors}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "message": "Quality Gate validation failed. Please address the errors before exporting.",
                    "errors": gate_errors
                }
            )
        print(f"[PDF-GEN] Step 2 OK: Quality gate passed")

        # 3. Build PDF via Playwright headless browser renderer
        print(f"[PDF-GEN] Step 3: Calling Playwright renderer...")
        try:
            pdf_bytes = _call_playwright_renderer(
                resume_data=payload.resume_data,
                template=payload.template,
                font_family=payload.font_family if hasattr(payload, 'font_family') else "Inter",
                font_size=payload.font_size if hasattr(payload, 'font_size') else "11pt",
                custom_config=payload.custom_config if hasattr(payload, 'custom_config') else None
            )
            print(f"[PDF-GEN] Step 3 OK: Renderer returned {len(pdf_bytes)} bytes")
        except RuntimeError as e:
            print(f"[PDF-GEN] Step 3 FAILED (RuntimeError): {e}")
            traceback.print_exc()
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"PDF renderer unavailable: {str(e)}"
            )
        except Exception as e:
            print(f"[PDF-GEN] Step 3 FAILED (Exception): {e}")
            traceback.print_exc()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"PDF compilation failed: {str(e)}"
            )

        # 4. Post-generation PDF Validator checks
        print(f"[PDF-GEN] Step 4: Validating PDF content...")
        from app.services.pdf_validator import PDFValidator
        orig_pages = analysis_record.get("extracted_data", {}).get("pages", 1) if analysis_record else 1
        if not isinstance(orig_pages, int):
            orig_pages = 1
        pdf_val = PDFValidator.validate_pdf_content(pdf_bytes, original_page_count=orig_pages)
        print(f"[PDF-GEN] Step 4: Validation result: isValid={pdf_val['isValid']}, errors={pdf_val.get('errors', [])}, warnings={pdf_val.get('warnings', [])}")
        if not pdf_val["isValid"]:
            print(f"[PDF-GEN] Step 4 FAILED: PDF validation errors: {pdf_val['errors']}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "message": "Generated PDF readability checks failed.",
                    "errors": pdf_val["errors"]
                }
            )
        print(f"[PDF-GEN] Step 4 OK: PDF validation passed")

        # 5. Upload PDF bytes to Cloudinary (optional — gracefully skip if not configured)
        print(f"[PDF-GEN] Step 5: Uploading to Cloudinary...")
        filename = f"resume_student_{student.id}_v"
        upload_res = None
        current_version = 1
        try:
            version_count = db.generated_resumes.count_documents({"resume_id": resume_id})
            current_version = version_count + 1
            print(f"[PDF-GEN] Step 5: Version={current_version}, filename={filename}{current_version}.pdf")

            from app.services.cloudinary_service import is_configured as cloudinary_configured
            if not cloudinary_configured:
                print(f"[PDF-GEN] Step 5 SKIPPED: Cloudinary not configured — returning base64 only")
            else:
                upload_res = upload_file(
                    pdf_bytes,
                    filename=f"{filename}{current_version}.pdf",
                    folder="generated-resumes"
                )
                print(f"[PDF-GEN] Step 5 OK: Cloudinary upload succeeded, url={upload_res.get('url', 'N/A')}")
        except Exception as e:
            print(f"[PDF-GEN] Step 5 WARNING: Cloudinary upload failed (non-fatal): {e}")
            traceback.print_exc()
            # Don't raise — we can still return the PDF as base64

        # 6. Save metadata to generated_resumes collection
        print(f"[PDF-GEN] Step 6: Saving metadata to MongoDB...")
        gen_id = str(get_next_sequence("generated_resumes"))
        pdf_url = upload_res["url"] if upload_res else ""
        public_id = upload_res["public_id"] if upload_res else ""
        db.generated_resumes.insert_one({
            "id": int(gen_id),
            "student_id": student.id,
            "resume_id": resume_id,
            "template": payload.template,
            "pdf_url": pdf_url,
            "public_id": public_id,
            "version": current_version,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        print(f"[PDF-GEN] Step 6 OK: Metadata saved (gen_id={gen_id})")

        import base64
        pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
        print(f"[PDF-GEN] COMPLETE: PDF generated successfully ({len(pdf_base64)} base64 chars)")

        return {
            "success": True,
            "message": "Resume PDF generated successfully",
            "pdf_url": pdf_url,
            "pdf_base64": pdf_base64,
            "version": current_version
        }

    except HTTPException:
        raise  # Re-raise FastAPI HTTP exceptions as-is
    except Exception as e:
        print(f"[PDF-GEN] UNEXPECTED ERROR: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected PDF generation error: {str(e)}"
        )

@router.get("/generated/{resume_id}")
def get_previously_generated_resumes(
    resume_id: int,
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    """
    GET /api/resume/generated/{resume_id}
    Retrieves previous versions list of generated PDF resumes.
    """
    # Verify resume belongs to student
    resume_doc = db.resumes.find_one({"id": resume_id, "student_id": student.id})
    if not resume_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found or unauthorized"
        )
        
    records = list(db.generated_resumes.find(
        {"resume_id": resume_id, "student_id": student.id}
    ).sort("version", -1))
    
    result = []
    for r in records:
        result.append({
            "id": r.get("id"),
            "template": r.get("template", "ats_classic"),
            "pdf_url": r.get("pdf_url"),
            "version": r.get("version", 1),
            "created_at": r.get("created_at")
        })
    return result

@router.get("/download-pdf/{version_id}")
def download_pdf_version(
    version_id: int,
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    """
    GET /api/resume/download-pdf/{version_id}
    Retrieves and streams the PDF document as a local attachment download, avoiding browser CORS block.
    """
    from fastapi.responses import StreamingResponse
    import io
    import requests
    
    record = db.generated_resumes.find_one({"id": version_id, "student_id": student.id})
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PDF version not found"
        )
        
    pdf_url = record.get("pdf_url")
    if not pdf_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PDF URL missing from version record"
        )
        
    try:
        res = requests.get(pdf_url)
        res.raise_for_status()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch document from cloud storage: {str(e)}"
        )
        
    resume = db.resumes.find_one({"id": record.get("resume_id")}) or {}
    name_str = (resume.get("personal_info", {}).get("name") if isinstance(resume.get("personal_info"), dict) else resume.get("name")) or student.student_name
    import re
    cleaned = re.sub(r'[^a-zA-Z0-9_\- ]', '', str(name_str or 'Resume')).strip().replace(' ', '_')
    if not cleaned or cleaned.lower() in ["untitled", "resume", "new_resume"]:
        filename = f"Resume_V{record.get('version', 1)}.pdf"
    elif not cleaned.lower().endswith("_resume"):
        filename = f"{cleaned}_Resume.pdf"
    else:
        filename = f"{cleaned}.pdf"

    return StreamingResponse(
        io.BytesIO(res.content),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )
