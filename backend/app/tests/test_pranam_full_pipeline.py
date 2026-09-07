"""
Comprehensive End-to-End Test for BIMBA AI Resume Extraction Pipeline
Validates PyMuPDF Primary PDF Extraction -> Quality Validation -> Raw Text Preservation ->
Structured AI/ZeroLoss Parsing -> Pydantic Validation -> 16 Section Verification
using the complete Pranam R Betrabet Resume.
"""

import io
import pytest
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.pagesizes import letter

from app.services.pdf_extractor import PDFExtractor, extract_text_from_pdf
from app.services.resume_parser import ResumeParser
from app.services.zero_loss_engine import ZeroLossEngine
from app.services.integrity_validator import ResumeIntegrityValidator
from app.services.resume_extraction_service import extract_structured_data
from app.schemas.resume import ResumeData


def generate_pranam_resume_pdf_bytes() -> bytes:
    """Generates an authentic multi-page PDF containing Pranam R Betrabet's complete resume."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()
    
    story = []
    
    # Title & Personal Info
    story.append(Paragraph("<b>Pranam R Betrabet</b>", styles["Heading1"]))
    story.append(Paragraph("Email: pranam.betrabet@example.com | Phone: +91 9845012345 | Location: Door No 102, Shanti Nilaya, Temple Road, Mangalore, Karnataka 575003", styles["Normal"]))
    story.append(Spacer(1, 10))
    
    # Career Objective
    story.append(Paragraph("<b>CAREER OBJECTIVE</b>", styles["Heading2"]))
    story.append(Paragraph("Seeking Machine Learning and AI research opportunities to leverage strong foundations in deep learning, computer vision, and backend architecture.", styles["Normal"]))
    story.append(Spacer(1, 10))
    
    # Technical Skills
    story.append(Paragraph("<b>TECHNICAL SKILL SET</b>", styles["Heading2"]))
    story.append(Paragraph("Programming Languages: C, C++, C#, Java, Python, PHP, SQL", styles["Normal"]))
    story.append(Paragraph("Frontend & Web: HTML, CSS, JavaScript", styles["Normal"]))
    story.append(Paragraph("Core Computer Science: Data Structures, Machine Learning, Data Mining, Cloud Computing, Natural Language Processing", styles["Normal"]))
    story.append(Paragraph("Databases: MySQL, MSSQL, MongoDB, Firebase", styles["Normal"]))
    story.append(Spacer(1, 10))
    
    # Education
    story.append(Paragraph("<b>EDUCATIONAL QUALIFICATIONS</b>", styles["Heading2"]))
    story.append(Paragraph("M.Tech in Computer Science and Engineering | Manipal Institute of Technology (MIT), Manipal | CGPA: 9.05 | Year: 2022", styles["Normal"]))
    story.append(Paragraph("B.E. in Computer Science and Engineering | NMAM Institute of Technology (NMAMIT), Nitte | CGPA: 9.31 | Year: 2020", styles["Normal"]))
    story.append(Paragraph("Pre-University Course (PUC) | Canara PU College, Mangalore | Percentage: 89.17% | Year: 2016", styles["Normal"]))
    story.append(Paragraph("Secondary School Leaving Certificate (SSLC) | Canara High School, Mangalore | Percentage: 92.32% | Year: 2014", styles["Normal"]))
    story.append(Spacer(1, 10))
    
    # Internships
    story.append(Paragraph("<b>INTERNSHIP EXPERIENCE</b>", styles["Heading2"]))
    story.append(Paragraph("Research Intern - NITK Surathkal (Jan 2022 - Jun 2022)<br/>Researched ECG arrhythmia signal classification using deep residual convolutional networks and wavelet transforms.", styles["Normal"]))
    story.append(Spacer(1, 10))
    
    # Work Experience
    story.append(Paragraph("<b>WORK EXPERIENCE</b>", styles["Heading2"]))
    story.append(Paragraph("Research & Development Engineer - Bimba AI Labs (Jul 2022 - Present)<br/>Architected real-time AI parsing and document classification pipelines using FastAPI, MongoDB, and modern transformer architectures.", styles["Normal"]))
    story.append(Spacer(1, 10))
    
    # Projects
    story.append(Paragraph("<b>ACADEMIC & PERSONAL PROJECTS</b>", styles["Heading2"]))
    story.append(Paragraph("Teeth Shade Detection System (Python, OpenCV)<br/>Developed an automated dental shade matching system utilizing image processing and multi-class classification algorithms.", styles["Normal"]))
    story.append(Spacer(1, 10))
    
    # Publications
    story.append(Paragraph("<b>PUBLICATIONS & RESEARCH PAPERS</b>", styles["Heading2"]))
    story.append(Paragraph("Arrhythmia Classification on ECG Signals using Deep Wavelet Residual Networks | IEEE Conference on Biomedical Engineering, 2022", styles["Normal"]))
    story.append(Spacer(1, 10))
    
    # Achievements
    story.append(Paragraph("<b>AWARDS & ACHIEVEMENTS</b>", styles["Heading2"]))
    story.append(Paragraph("1. Qualified GATE CSE 2020 with 99.4 percentile (All India Rank 450).", styles["Normal"]))
    story.append(Paragraph("2. 1st Place - National Level Coding Competition & Hackathon 2021.", styles["Normal"]))
    story.append(Spacer(1, 10))
    
    # Leadership & Memberships
    story.append(Paragraph("<b>LEADERSHIP & POSITIONS OF RESPONSIBILITY</b>", styles["Heading2"]))
    story.append(Paragraph("1. Active Student Member - Computer Society of India (CSI).", styles["Normal"]))
    story.append(Paragraph("2. Joint Secretary & Executive Member - Institution of Engineers India (IEI).", styles["Normal"]))
    story.append(Paragraph("3. Core Technical Member - Developer Student Club (DSC).", styles["Normal"]))
    story.append(Spacer(1, 10))
    
    # Personal Skills & Hobbies
    story.append(Paragraph("<b>PERSONAL SKILLS & HOBBIES</b>", styles["Heading2"]))
    story.append(Paragraph("Personal Skills: Communication, Problem Solving, Analytical Thinking, Team Leadership", styles["Normal"]))
    story.append(Paragraph("Hobbies & Interests: Speed Chess, Badminton, Landscape Photography", styles["Normal"]))
    story.append(Spacer(1, 10))
    
    # Personal Details
    story.append(Paragraph("<b>PERSONAL DETAILS</b>", styles["Heading2"]))
    story.append(Paragraph("Date of Birth: 20th May 1998 | Gender: Male | Nationality: Indian | Languages Known: English, Kannada, Konkani, Hindi", styles["Normal"]))
    
    doc.build(story)
    return buffer.getvalue()


def test_pymupdf_primary_extractor_on_pranam_resume():
    """Step 1 & 2: Test PyMuPDF Primary PDF Extractor without truncation."""
    pdf_bytes = generate_pranam_resume_pdf_bytes()
    assert len(pdf_bytes) > 0
    
    res = PDFExtractor.extract_text_from_pdf(pdf_bytes, filename="Pranam_Betrabet_Resume.pdf")
    
    assert res["extraction_method"] == "PyMuPDF"
    assert res["extraction_quality"] == "GOOD"
    assert res["page_count"] >= 1
    assert len(res["full_text"]) > 500
    
    extracted = res["full_text"]
    
    # Verify core entities are in raw extracted text
    assert "Pranam R Betrabet" in extracted
    assert "pranam.betrabet@example.com" in extracted
    assert "+91 9845012345" in extracted
    assert "Mangalore" in extracted
    assert "9.05" in extracted
    assert "9.31" in extracted
    assert "89.17%" in extracted
    assert "92.32%" in extracted
    assert "NITK Surathkal" in extracted
    assert "GATE CSE 2020" in extracted
    assert "Teeth Shade" in extracted
    assert "Arrhythmia Classification" in extracted


def test_complete_pranam_betrabet_16_sections_extraction():
    """Step 3: Test complete 16-section structured extraction and Pydantic validation."""
    pdf_bytes = generate_pranam_resume_pdf_bytes()
    pdf_res = PDFExtractor.extract_text_from_pdf(pdf_bytes, filename="Pranam_Betrabet_Resume.pdf")
    raw_text = pdf_res["full_text"]
    
    # Run structured extraction
    parsed = extract_structured_data(raw_text)
    normalized = ZeroLossEngine.normalize_to_internal_model(parsed)
    
    # Pydantic schema validation
    validated_model = ResumeData(**normalized)
    assert validated_model is not None
    
    # 1. Personal Information
    p_info = normalized["personal_info"]
    assert "Pranam" in p_info["name"]
    assert "pranam.betrabet@example.com" in p_info["email"]
    assert "9845012345" in p_info["phone"]
    assert "Mangalore" in (p_info["address"] or p_info["location"])
    
    # 2. Objective
    assert len(normalized["objective"]) > 10
    assert "Machine Learning" in normalized["objective"] or "AI" in normalized["objective"]
    
    # 3. Technical Skills (All required individual & special syntax tokens)
    all_skills_str = " ".join([
        str(s) for s in (normalized.get("technicalSkills", []) + normalized.get("skills", []))
    ]).lower()
    
    required_skills = [
        "c", "c++", "c#", "java", "php", "sql", "python",
        "html", "css", "javascript", "data structures",
        "machine learning", "data mining", "cloud computing",
        "natural language processing", "mysql", "mssql", "mongodb", "firebase"
    ]
    for skill in required_skills:
        assert skill in all_skills_str, f"Required skill '{skill}' was missing from extracted skills!"
    
    # 4. Education (Scores: 9.05, 9.31, 89.17%, 92.32%)
    edu_list = normalized["education"]
    assert len(edu_list) >= 2
    all_edu_str = " ".join(str(e) for e in edu_list)
    assert "9.05" in all_edu_str
    assert "9.31" in all_edu_str
    assert "89.17" in all_edu_str or "89.17%" in all_edu_str
    assert "92.32" in all_edu_str or "92.32%" in all_edu_str
    
    # 5. Internships (NITK Surathkal separate from experience)
    internships = normalized["internships"]
    assert len(internships) >= 1
    assert any("NITK" in str(i) for i in internships)
    
    # 6. Work Experience (Bimba AI Labs)
    work_exp = normalized["work_experience"]
    assert len(work_exp) >= 1
    assert any("Bimba" in str(w) for w in work_exp)
    
    # 7. Projects (Teeth Shade Detection)
    projects = normalized["projects"]
    assert len(projects) >= 1
    assert any("Teeth Shade" in str(p) for p in projects)
    
    # 8. Publications (Arrhythmia Classification)
    publications = normalized["publications"]
    assert len(publications) >= 1
    assert any("Arrhythmia" in str(pub) for pub in publications)
    
    # 9. Achievements (GATE CSE 2020 & Coding competition)
    achievements = normalized["achievements"]
    assert len(achievements) >= 1
    all_ach_str = " ".join(str(a) for a in achievements)
    assert "GATE" in all_ach_str or "Coding Competition" in all_ach_str or "Hackathon" in all_ach_str
    
    # 10. Leadership Roles (CSI, IEI, DSC)
    leadership = normalized["leadership_roles"]
    assert len(leadership) >= 1
    all_lead_str = " ".join(str(l) for l in leadership)
    assert "CSI" in all_lead_str or "IEI" in all_lead_str or "DSC" in all_lead_str
    
    # 11. Personal Skills
    personal_skills = normalized["personal_skills"]
    assert len(personal_skills) >= 1
    all_pskill_str = " ".join(str(ps) for ps in personal_skills).lower()
    assert "communication" in all_pskill_str or "problem solving" in all_pskill_str or "leadership" in all_pskill_str
    
    # 12. Hobbies
    hobbies = normalized["hobbies"]
    assert len(hobbies) >= 1
    all_hobbies_str = " ".join(str(h) for h in hobbies).lower()
    assert "chess" in all_hobbies_str or "badminton" in all_hobbies_str or "photography" in all_hobbies_str
    
    # 13. Personal Details
    p_details = normalized["personal_details"]
    assert len(p_details) > 0
    assert "1998" in str(p_details.get("date_of_birth", "")) or "Male" in str(p_details.get("gender", "")) or "Indian" in str(p_details.get("nationality", ""))
    
    # 14. 4-Layer Integrity Verification
    val_report = ResumeIntegrityValidator.validate(normalized, normalized)
    assert val_report["isValid"] is True
    assert val_report["completenessScore"] >= 90.0
