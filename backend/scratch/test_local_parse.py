import os
import sys
import time

sys.path.insert(0, os.path.abspath("."))
from dotenv import load_dotenv
load_dotenv(".env")

from app.services.pdf_extractor import PDFExtractor
from app.services.resume_extraction_service import extract_structured_data

filepath = "d:/Bimba AI/Minimalist Modern Simple Business Social Media Manager Resume.pdf"
with open(filepath, "rb") as f:
    file_content = f.read()

filename = os.path.basename(filepath)

t0 = time.perf_counter()
pdf_res = PDFExtractor.extract_text_from_pdf(file_content, filename)
txt = pdf_res["full_text"]
t_pdf = time.perf_counter() - t0

t1 = time.perf_counter()
structured = extract_structured_data(txt)
t_extract = time.perf_counter() - t1

print(f"PDF extract: {t_pdf:.4f}s")
print(f"Heuristic parse: {t_extract:.4f}s")
print("Parsed sections:", list(structured.keys()))
print("Personal info:", structured.get("personal_info"))
print("Total local time: ", t_pdf + t_extract)
