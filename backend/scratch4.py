import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.pdf_extractor import PDFExtractor

def test():
    pdf_path = "app/tests/fixtures/Pranam_R_Betrabet_Resume.pdf"
    with open(pdf_path, "rb") as f:
        pdf_bytes = f.read()
    res = PDFExtractor.extract_text_from_pdf(pdf_bytes, "Pranam_R_Betrabet_Resume.pdf")
    text = res["full_text"]
    
    # print around certifications
    idx = text.lower().find("certifications")
    if idx != -1:
        print(text[idx:idx+1000])

if __name__ == "__main__":
    test()
