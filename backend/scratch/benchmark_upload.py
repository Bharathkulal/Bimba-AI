import os
import sys
import time

sys.path.insert(0, os.path.abspath("."))
from dotenv import load_dotenv
load_dotenv(".env")

from app.database.session import get_db
from app.services.pdf_extractor import PDFExtractor
from app.services.ocr_service import OCRService
from app.services.ai_provider_manager import AIProviderManager
from app.services.resume_parser import ResumeParser
from app.services.zero_loss_engine import ZeroLossEngine
from app.services.integrity_validator import ResumeIntegrityValidator
from app.database.resume_repository import ResumeRepository
from app.ai.resume_prompts import RESUME_PARSE_PROMPT

db = next(get_db())

# Find a sample PDF
filepath = "d:/Bimba AI/Minimalist Modern Simple Business Social Media Manager Resume.pdf"
if not os.path.exists(filepath):
    filepath = "../Minimalist Modern Simple Business Social Media Manager Resume.pdf"

if not os.path.exists(filepath):
    print("Finding any PDF in workspace...")
    import glob
    pdfs = glob.glob("d:/Bimba AI/**/*.pdf", recursive=True)
    if pdfs:
        filepath = pdfs[0]

print("Using test PDF:", filepath)
with open(filepath, "rb") as f:
    file_content = f.read()

filename = os.path.basename(filepath)
student_id = 1

t0 = time.perf_counter()

# Step 1: PDF text extraction
t_pdf_start = time.perf_counter()
pdf_res = PDFExtractor.extract_text_from_pdf(file_content, filename)
extracted_text = pdf_res.get("full_text", "")
t_pdf = time.perf_counter() - t_pdf_start
print(f"[BENCHMARK] PDF Extraction: {t_pdf:.3f}s (Extracted {len(extracted_text)} chars)")

# Step 2: AI Parsing
t_ai_start = time.perf_counter()
ai_manager = AIProviderManager(db)
parser = ResumeParser()
prompt = RESUME_PARSE_PROMPT.replace("{resume_text}", extracted_text)
raw_response = ai_manager.call_llm(prompt, feature="Benchmark Parsing", response_format="json_object")
parsed_data = parser.parse_and_validate(raw_response)
t_ai = time.perf_counter() - t_ai_start
print(f"[BENCHMARK] AI LLM & Parsing: {t_ai:.3f}s")

# Step 3: Normalization & Integrity validation
t_val_start = time.perf_counter()
normalized_resume = ZeroLossEngine.normalize_to_internal_model(parsed_data)
val_results = ResumeIntegrityValidator.validate(parsed_data, normalized_resume)
completeness = ResumeIntegrityValidator.calculate_completeness_breakdown(normalized_resume)
t_val = time.perf_counter() - t_val_start
print(f"[BENCHMARK] Normalization & Validation: {t_val:.3f}s")

# Step 4: Cloudinary upload (if configured)
t_cloud_start = time.perf_counter()
from app.services.cloudinary_service import upload_file, is_configured
cloudinary_url = None
public_id = None
if is_configured:
    try:
        c_res = upload_file(file_content, filename, folder="uploaded-resumes")
        cloudinary_url = c_res.get("url")
        public_id = c_res.get("public_id")
    except Exception as e:
        print("Cloudinary upload failed:", e)
t_cloud = time.perf_counter() - t_cloud_start
print(f"[BENCHMARK] Cloudinary Upload: {t_cloud:.3f}s (is_configured={is_configured})")

# Step 5: Database Persistence
t_db_start = time.perf_counter()
repository = ResumeRepository(db)
validation_metadata = {
    "completeness_score": completeness.get("overall_completeness", 95.0),
    "breakdown": completeness,
    "warnings": val_results.get("warnings", []),
    "missing_details": val_results.get("errors", [])
}
original_file_meta = {
    "filename": filename,
    "size_bytes": len(file_content),
    "file_type": "pdf",
    "page_count": 1,
    "raw_extracted_text": extracted_text,
    "cloudinary_url": cloudinary_url
}
resume_id = repository.save_parsed_resume(
    student_id=student_id,
    parsed_data=normalized_resume,
    filepath="",
    cloudinary_url=cloudinary_url,
    public_id=public_id,
    raw_extraction_data=pdf_res,
    raw_text=extracted_text,
    original_file_meta=original_file_meta,
    validation_meta=validation_metadata
)
t_db = time.perf_counter() - t_db_start
print(f"[BENCHMARK] MongoDB Save: {t_db:.3f}s (resume_id={resume_id})")

total_t = time.perf_counter() - t0
print(f"\n[BENCHMARK SUMMARY]")
print(f"PDF Extraction:    {t_pdf:.3f}s")
print(f"AI LLM & Parsing:  {t_ai:.3f}s")
print(f"Normalization:     {t_val:.3f}s")
print(f"Cloudinary Upload: {t_cloud:.3f}s")
print(f"MongoDB Save:      {t_db:.3f}s")
print(f"Total Time:        {total_t:.3f}s")
