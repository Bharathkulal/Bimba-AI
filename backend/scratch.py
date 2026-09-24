import sys
import os

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.pdf_extractor import PDFExtractor
from app.services.resume_pipeline.section_detector import SectionDetector
from app.services.resume_pipeline.parsers.education_parser import EducationParser
from app.services.resume_pipeline.pipeline import clean_text_artifacts, despace_spaced_text

def test():
    pdf_path = "app/tests/fixtures/Pranam_R_Betrabet_Resume.pdf"
    if not os.path.exists(pdf_path):
        print("PDF not found")
        return

    with open(pdf_path, "rb") as f:
        pdf_bytes = f.read()
    
    text = PDFExtractor.extract_text(pdf_bytes, "Pranam_R_Betrabet_Resume.pdf")
    
    text_clean = despace_spaced_text(clean_text_artifacts(text))
    lines = [l.strip() for l in text_clean.split("\n") if l.strip()]
    section_map = SectionDetector.partition_into_sections(lines)
    edu_lines = section_map.get("education", [])
    
    print("EDU LINES:")
    for l in edu_lines:
        print(repr(l))
        
    edu_parsed = EducationParser.parse(edu_lines)
    print("\nPARSED:")
    for e in edu_parsed:
        print(e)

if __name__ == "__main__":
    test()
