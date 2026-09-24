import pytest
import io
import os
from app.services.pdf_extractor import PDFExtractor
from app.services.local_resume_extraction.extractor import extract_docx_text_local
try:
    import reportlab.pdfgen.canvas as canvas
except ImportError:
    canvas = None

def generate_dummy_pdf(text_content):
    if not canvas:
        pytest.skip("reportlab not installed, skipping synthetic PDF generation")
    packet = io.BytesIO()
    c = canvas.Canvas(packet)
    c.drawString(100, 800, text_content)
    c.save()
    packet.seek(0)
    return packet

def test_pdf_extraction_good_quality():
    if not canvas:
        pytest.skip("reportlab not installed")
    text_content = "John Doe\njohn@example.com\nSoftware Engineer with 5 years experience in Python and React."
    packet = generate_dummy_pdf(text_content)
    result = PDFExtractor.extract_text_from_pdf(packet, "dummy.pdf")
    
    assert result["extraction_quality"] == "GOOD"
    assert result["extraction_method"] == "PyMuPDF"
    assert "John Doe" in result["full_text"]

def test_pdf_extraction_poor_quality():
    if not canvas:
        pytest.skip("reportlab not installed")
    text_content = "Too short."
    packet = generate_dummy_pdf(text_content)
    result = PDFExtractor.extract_text_from_pdf(packet, "short.pdf")
    
    # Due to pdfplumber fallback also returning poor, it will still have text but POOR quality
    assert result["extraction_quality"] == "POOR"
    assert "Too short." in result["full_text"]
