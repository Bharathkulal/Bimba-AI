import sys
import os

# Ensure app is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.ocr_service import OCRService

pdf_path = r"C:\Users\LENOVO\Downloads\karan_resume.pdf"
with open(pdf_path, "rb") as f:
    content = f.read()

text = OCRService.extract_text(content, "karan_resume.pdf")

print("--- EXTRACTED TEXT START ---")
print(text)
print("--- EXTRACTED TEXT END ---")

with open("scratch/extracted_pdf_text.txt", "w", encoding="utf-8") as out:
    out.write(text)
