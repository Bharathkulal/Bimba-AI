import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.pdf_extractor import PDFExtractor
from app.services.resume_pipeline.section_detector import SectionDetector
from app.services.resume_pipeline.parsers.certification_parser import CertificationParser
from app.services.resume_pipeline.pipeline import clean_text_artifacts, despace_spaced_text

def test():
    pdf_path = "app/tests/fixtures/Pranam_R_Betrabet_Resume.pdf"
    with open(pdf_path, "rb") as f:
        pdf_bytes = f.read()
    res = PDFExtractor.extract_text_from_pdf(pdf_bytes, "Pranam_R_Betrabet_Resume.pdf")
    text = res["full_text"]
    text_clean = despace_spaced_text(clean_text_artifacts(text))
    lines = [l.strip() for l in text_clean.split("\n") if l.strip()]
    section_map = SectionDetector.partition_into_sections(lines)
    cert_lines = section_map.get("certifications", [])
    
    print("CERT LINES:")
    for l in cert_lines:
        print(repr(l))
        
    parsed = CertificationParser.parse(cert_lines)
    print("\nPARSED:")
    for e in parsed:
        print(e)

if __name__ == "__main__":
    test()
