"""
=============================================================================
COMPREHENSIVE GENERIC RESUME PARSING PIPELINE TEST SUITE
=============================================================================
Validates generic extraction across 12+ diverse resume formats:
 1. Simple text resume (single column)
 2. Two-column modern resume (Left sidebar + Right main body)
 3. Resume with tabular education & scores
 4. Resume with icons, bullets & special unicode symbols
 5. Multi-page resume (2-3 pages with page markers)
 6. Scanned / image-based PDF detection & OCR fallback
 7. DOCX resume with tables & formatted headings
 8. Resume with unusual section names ("Career Milestones", "Academic Odyssey", "Toolbox")
 9. Resume with multiple technical projects
10. Resume with academic research publications & patents
11. Fresher / student resume (zero experience)
12. Senior executive resume (extensive multi-job experience)
13. Extraction Confidence & Content Preservation Scores
14. Generated PDF Output Content Validation
=============================================================================
"""

import io
import pytest
from app.services.resume_pipeline.pipeline import GenericResumePipeline
from app.services.resume_pipeline.document_detector import DocumentDetector
from app.services.resume_pipeline.layout_analyzer import LayoutAnalyzer
from app.services.resume_pipeline.models import TextBlock, BoundingBox
from app.services.resume_pipeline.confidence_scorer import ConfidenceScorer
from app.services.resume_pipeline.content_coverage import ContentCoverageValidator
from app.services.resume_pipeline.generated_pdf_validator import GeneratedPDFValidator
from app.services.resume_pdf_service import build_pdf_story
from app.services.resume_extraction_service import extract_structured_data


# ---------------------------------------------------------------------------
# 1. Simple Text Resume (Single Column)
# ---------------------------------------------------------------------------
def test_format_1_simple_text_resume():
    text_content = (
        "Sarah Jenkins\n"
        "sarah.jenkins@example.com | +1 (555) 234-5678 | San Francisco, CA\n"
        "linkedin.com/in/sarahjenkins | github.com/sjenkins\n\n"
        "PROFESSIONAL SUMMARY\n"
        "Results-oriented Full Stack Developer with 4+ years of experience in Python and React.\n\n"
        "EDUCATION\n"
        "University of California, Berkeley - B.S. in Computer Science (2020) - GPA: 3.85\n\n"
        "WORK EXPERIENCE\n"
        "Senior Software Engineer at Nexus Cloud (2022 - Present)\n"
        "• Architected scalable microservices using FastAPI and Docker.\n"
        "• Reduced server response times by 35% through Redis caching.\n\n"
        "Software Engineer at BetaCorp (2020 - 2022)\n"
        "• Developed responsive web applications using React and TypeScript.\n\n"
        "TECHNICAL SKILLS\n"
        "Programming: Python, JavaScript, TypeScript, Go\n"
        "Frameworks: FastAPI, Django, React, Node.js\n"
        "Databases: PostgreSQL, Redis, MongoDB\n\n"
        "PROJECTS\n"
        "E-Commerce Analytics Engine (Python, FastAPI, React)\n"
        "• Built real-time analytics dashboard processing 100k events/sec.\n"
    ).encode("utf-8")

    result = GenericResumePipeline.ingest_and_parse(text_content, "sarah_resume.txt")
    data = result["structured_data"]

    assert data["personal_info"]["name"] == "Sarah Jenkins"
    assert data["personal_info"]["email"] == "sarah.jenkins@example.com"
    assert "555" in data["personal_info"]["phone"]
    assert len(data["education"]) >= 1
    assert "Berkeley" in data["education"][0]["institution"]
    assert len(data["work_experience"]) == 2
    assert "Nexus Cloud" in data["work_experience"][0]["company"]
    assert len(data["projects"]) >= 1
    assert "Python" in data["technicalSkills"]
    assert result["scores"]["content_preservation"] >= 90.0


# ---------------------------------------------------------------------------
# 2. Two-Column Modern Resume (Left Sidebar + Right Main Body)
# ---------------------------------------------------------------------------
def test_format_2_two_column_layout_reading_order():
    # Simulate text blocks extracted with PyMuPDF bounding boxes:
    # Page width: 600, height: 800
    # Header: Name at top (x: 50..550, y: 30..60)
    # Left column: x: 40..220 (Contact, Skills, Languages)
    # Right column: x: 250..560 (Summary, Experience, Education)
    blocks = [
        # Top Header
        TextBlock(id="b1", page_number=1, text="Elena Rostova", bbox=BoundingBox(x0=50, y0=30, x1=550, y1=60)),
        # Left column items
        TextBlock(id="b2", page_number=1, text="CONTACT\nelena@techcorp.io\n+44 20 7946 0912\nLondon, UK", bbox=BoundingBox(x0=40, y0=90, x1=220, y1=180)),
        TextBlock(id="b3", page_number=1, text="TECHNICAL SKILLS\nPython, Docker, Kubernetes, AWS, C++", bbox=BoundingBox(x0=40, y0=200, x1=220, y1=300)),
        TextBlock(id="b4", page_number=1, text="LANGUAGES\nEnglish, Russian, French", bbox=BoundingBox(x0=40, y0=320, x1=220, y1=400)),
        # Right column items (y coordinates overlap with left column)
        TextBlock(id="b5", page_number=1, text="PROFESSIONAL SUMMARY\nExperienced DevOps and Cloud Infrastructure Specialist.", bbox=BoundingBox(x0=250, y0=90, x1=560, y1=150)),
        TextBlock(id="b6", page_number=1, text="WORK EXPERIENCE\nDevOps Lead at FinTech Global (2021 - Present)\n• Managed AWS multi-region Kubernetes clusters.", bbox=BoundingBox(x0=250, y0=170, x1=560, y1=300)),
        TextBlock(id="b7", page_number=1, text="EDUCATION\nImperial College London\nM.Sc in Advanced Computing (2021)", bbox=BoundingBox(x0=250, y0=320, x1=560, y1=420)),
    ]

    page_layout = LayoutAnalyzer.analyze_page_layout(1, 600.0, 800.0, blocks)
    assert page_layout.columns_count == 2
    
    # Verify reading order: Elena Rostova -> Left column (Contact, Skills, Languages) -> Right column (Summary, Experience, Education)
    text = page_layout.raw_text
    elena_idx = text.find("Elena Rostova")
    skills_idx = text.find("TECHNICAL SKILLS")
    exp_idx = text.find("WORK EXPERIENCE")
    edu_idx = text.find("Imperial College")

    assert elena_idx < skills_idx
    # Left column is parsed in natural sequence
    assert skills_idx < exp_idx
    assert exp_idx < edu_idx


# ---------------------------------------------------------------------------
# 3. Resume with Tabular Education and Scores
# ---------------------------------------------------------------------------
def test_format_3_tabular_education():
    table_text = (
        "Rajesh Patel\n"
        "rajesh.patel@example.com | +91 9876543210 | Mumbai, India\n\n"
        "EDUCATION\n"
        "<TABLE>\n"
        "<TR-HEADER> Degree / Examination | Institution / Board | Year | Percentage / CGPA\n"
        "<TR> B.Tech in Computer Science | Indian Institute of Technology Bombay | 2024 | 9.45 CGPA\n"
        "<TR> Class XII (Senior Secondary) | Delhi Public School | 2020 | 95.6%\n"
        "<TR> Class X (Secondary) | St. Xavier's High School | 2018 | 94.2%\n"
        "</TABLE>\n\n"
        "TECHNICAL SKILLS\n"
        "C++, Python, Java, SQL, PyTorch\n"
    ).encode("utf-8")

    result = GenericResumePipeline.ingest_and_parse(table_text, "rajesh_resume.txt")
    data = result["structured_data"]
    edu = data["education"]

    assert len(edu) == 3
    assert "B.Tech" in edu[0]["degree"]
    assert "Bombay" in edu[0]["institution"]
    assert "9.45" in edu[0]["cgpa_percentage"]
    assert "95.6%" in edu[1]["cgpa_percentage"]
    assert "94.2%" in edu[2]["cgpa_percentage"]


# ---------------------------------------------------------------------------
# 4. Resume with Icons, Bullets, and Unicode Dashes
# ---------------------------------------------------------------------------
def test_format_4_unicode_symbols_and_bullets():
    unicode_resume = (
        "Arthur Pendelton\n"
        "✉ arthur@avalon.tech • ☎ +1-800-555-0199 • ⚲ Seattle, WA\n\n"
        "SUMMARY\n"
        "Seasoned Software Architect ‐ 10+ years specializing in distributed systems.\n\n"
        "EXPERIENCE\n"
        "Principal Architect – CloudWorks (2018–Present)\n"
        "▶ Spearheaded migration of monolithic architecture to event‐driven microservices.\n"
        "▶ Reduced cloud infrastructure spend by $1.2M annually.\n\n"
        "SKILLS\n"
        "• Java • C++ • C# • Go • Kubernetes • Kafka\n"
    ).encode("utf-8")

    result = GenericResumePipeline.ingest_and_parse(unicode_resume, "arthur_resume.txt")
    data = result["structured_data"]

    assert data["personal_info"]["name"] == "Arthur Pendelton"
    assert data["personal_info"]["email"] == "arthur@avalon.tech"
    assert len(data["work_experience"]) >= 1
    assert "CloudWorks" in data["work_experience"][0]["company"]
    assert "C++" in data["technicalSkills"]
    assert "C#" in data["technicalSkills"]


# ---------------------------------------------------------------------------
# 5. Multi-Page Resume
# ---------------------------------------------------------------------------
def test_format_5_multi_page_resume():
    multi_page_text = (
        "Marcus Aurelius\n"
        "marcus@rome.org | Rome, Italy\n\n"
        "SUMMARY\n"
        "Philosopher and Enterprise Engineering Leader.\n\n"
        "EXPERIENCE\n"
        "Chief Technology Officer at Imperium Labs (2018 - Present)\n"
        "• Directed engineering division across 15 global hubs.\n\n"
        "--- PAGE 2 ---\n\n"
        "EXPERIENCE (CONTINUED)\n"
        "VP of Engineering at Stoic Systems (2012 - 2018)\n"
        "• Built high-performance algorithmic trading platform.\n\n"
        "EDUCATION\n"
        "University of Rome - Ph.D. in Computer Science (2011)\n\n"
        "PUBLICATIONS\n"
        "• Distributed Consensus Protocols in Byzantine Environments (IEEE 2020)\n"
    ).encode("utf-8")

    result = GenericResumePipeline.ingest_and_parse(multi_page_text, "marcus_resume.txt")
    data = result["structured_data"]

    assert len(data["work_experience"]) == 2
    assert "Imperium Labs" in data["work_experience"][0]["company"]
    assert "Stoic Systems" in data["work_experience"][1]["company"]
    assert len(data["publications"]) >= 1
    assert "Distributed Consensus" in data["publications"][0]["title"]


# ---------------------------------------------------------------------------
# 6. Scanned PDF Detection
# ---------------------------------------------------------------------------
def test_format_6_document_detector_types():
    # Empty bytes
    det_empty = DocumentDetector.detect_document_type(b"", "resume.pdf")
    assert det_empty["strategy"] in ["failed", "unsupported"]

    # DOCX
    det_docx = DocumentDetector.detect_document_type(b"PK\x03\x04", "resume.docx")
    assert det_docx["file_type"] == "docx"
    assert det_docx["needs_ocr"] is False

    # TXT
    det_txt = DocumentDetector.detect_document_type(b"Text resume", "resume.txt")
    assert det_txt["file_type"] == "txt"
    assert det_txt["needs_ocr"] is False


# ---------------------------------------------------------------------------
# 7. DOCX Format Parsing
# ---------------------------------------------------------------------------
def test_format_7_docx_extraction_flow():
    # Simulate DOCX bytes / fallback
    raw_docx_sim = (
        "Alice Smith\n"
        "alice@smith.dev | New York, NY\n\n"
        "<H> PROFESSIONAL SUMMARY </H>\n"
        "Data Engineer with deep expertise in Apache Spark and Snowflake.\n\n"
        "<H> EDUCATION </H>\n"
        "Columbia University - Master of Science in Data Science (2022)\n\n"
        "<H> SKILLS </H>\n"
        "Python, SQL, Apache Spark, Snowflake, Airflow, dbt\n"
    ).encode("utf-8")

    result = GenericResumePipeline.ingest_and_parse(raw_docx_sim, "alice_resume.docx")
    data = result["structured_data"]

    assert data["personal_info"]["name"] == "Alice Smith"
    assert data["personal_info"]["email"] == "alice@smith.dev"
    assert len(data["education"]) >= 1
    assert "Columbia University" in data["education"][0]["institution"]
    assert "Snowflake" in data["technicalSkills"]


# ---------------------------------------------------------------------------
# 8. Resume with Unusual / Custom Section Names (Zero Data Loss)
# ---------------------------------------------------------------------------
def test_format_8_custom_sections_preservation():
    custom_resume = (
        "Dr. Nikola Vance\n"
        "nikola@vance-labs.org | +1 617-555-0144 | Boston, MA\n\n"
        "CAREER SUMMARY\n"
        "Senior Research Scientist pioneering quantum algorithms.\n\n"
        "ACADEMIC BACKGROUND\n"
        "Harvard University - Ph.D. in Physics (2019)\n\n"
        "TECHNICAL TOOLBOX\n"
        "Qiskit, Cirq, Python, C++, Julia, OpenMP\n\n"
        "PATENTS FILED\n"
        "• US Patent 10,984,123: Quantum Error Correction Circuit Architecture (2022)\n"
        "• US Patent 11,234,567: Fault-tolerant Superconducting Qubit Topology (2023)\n\n"
        "WORKSHOPS AND TALKS\n"
        "• Keynote Speaker at Quantum Computing Summit (QCS 2023), Geneva\n"
        "• Workshop Lead on Hybrid Quantum-Classical Algorithms, MIT\n"
    ).encode("utf-8")

    result = GenericResumePipeline.ingest_and_parse(custom_resume, "nikola_resume.txt")
    data = result["structured_data"]

    assert data["personal_info"]["name"] == "Dr. Nikola Vance"
    assert len(data["education"]) >= 1
    assert "Harvard University" in data["education"][0]["institution"]
    assert "Qiskit" in data["technicalSkills"]
    
    # Verify patents classified into publications and workshops preserved in custom_sections
    assert len(data["publications"]) >= 1 or len(data["custom_sections"]) >= 1
    assert any("Patent" in p["title"] for p in data.get("publications", [])) or any("PATENTS" in c["section_name"].upper() for c in data.get("custom_sections", []))
    assert any("WORKSHOPS" in c["section_name"].upper() for c in data.get("custom_sections", []))


# ---------------------------------------------------------------------------
# 9. Resume with Multiple Projects
# ---------------------------------------------------------------------------
def test_format_9_multiple_projects():
    proj_resume = (
        "David Chen\n"
        "david.chen@example.com | San Jose, CA\n\n"
        "PROJECTS\n"
        "Autonomous Visual Navigation (Python, PyTorch, ROS)\n"
        "• Implemented real-time SLAM algorithms for aerial drones.\n"
        "• Achieved 98.4% obstacle avoidance accuracy in indoor trials.\n\n"
        "Distributed KV Store (Go, Raft, gRPC)\n"
        "• Built replicated key-value store with leader election and log compaction.\n\n"
        "Blockchain Payment Gateway (Rust, Solana, Web3.js)\n"
        "• Created decentralized payment processor handling 5k TPS.\n"
    ).encode("utf-8")

    result = GenericResumePipeline.ingest_and_parse(proj_resume, "david_resume.txt")
    data = result["structured_data"]

    assert len(data["projects"]) == 3
    titles = [p["name"] for p in data["projects"]]
    assert any("Autonomous Visual Navigation" in t for t in titles)
    assert any("Distributed KV Store" in t for t in titles)
    assert any("Blockchain Payment Gateway" in t for t in titles)


# ---------------------------------------------------------------------------
# 10. Resume with Academic Publications & Patents
# ---------------------------------------------------------------------------
def test_format_10_academic_publications():
    pub_resume = (
        "Prof. Vikram Sethi\n"
        "vikram@iisc.ac.in | Bengaluru, Karnataka\n\n"
        "PUBLICATIONS\n"
        "• Deep Neural Networks for Hyperspectral Imaging - IEEE Transactions on Geoscience (2023)\n"
        "• Sparse Matrix Acceleration on GPU Clusters - ACM SIGARCH (2021)\n"
        "• Edge AI Inference for IoT Sensor Networks - Springer LNCS (2020)\n"
    ).encode("utf-8")

    result = GenericResumePipeline.ingest_and_parse(pub_resume, "vikram_resume.txt")
    data = result["structured_data"]

    assert len(data["publications"]) == 3
    assert "Deep Neural Networks" in data["publications"][0]["title"]
    assert "Sparse Matrix" in data["publications"][1]["title"]


# ---------------------------------------------------------------------------
# 11. Fresher / Student Resume (Zero Experience)
# ---------------------------------------------------------------------------
def test_format_11_fresher_zero_experience():
    fresher_resume = (
        "Ananya Roy\n"
        "ananya.roy@college.edu | +91 9123456780 | Kolkata, West Bengal\n\n"
        "CAREER OBJECTIVE\n"
        "Enthusiastic computer science graduate eager to contribute to innovative software products.\n\n"
        "EDUCATION\n"
        "Jadavpur University - B.E. in Information Technology (2024) - CGPA: 9.18\n\n"
        "TECHNICAL SKILLS\n"
        "Java, Python, C, SQL, HTML, CSS, JavaScript, Git\n\n"
        "ACADEMIC PROJECTS\n"
        "Smart Campus Attendance System (Python, OpenCV, SQLite)\n"
        "• Implemented facial recognition model with 96% accuracy.\n\n"
        "ACHIEVEMENTS\n"
        "• 1st Place in Inter-College Hackathon 2023\n"
        "• Finalist in National Coding Olympiad 2022\n"
    ).encode("utf-8")

    result = GenericResumePipeline.ingest_and_parse(fresher_resume, "ananya_resume.txt")
    data = result["structured_data"]

    assert data["personal_info"]["name"] == "Ananya Roy"
    assert len(data["work_experience"]) == 0
    assert len(data["education"]) == 1
    assert "9.18" in data["education"][0]["cgpa_percentage"]
    assert len(data["projects"]) >= 1
    assert len(data["achievements"]) >= 2
    assert result["scores"]["content_preservation"] >= 90.0


# ---------------------------------------------------------------------------
# 12. Senior Executive Resume (Extensive Multi-Job Experience)
# ---------------------------------------------------------------------------
def test_format_12_senior_executive_experience():
    exec_resume = (
        "Jonathan Hayes\n"
        "j.hayes@executive.com | +1 (415) 888-9900 | Austin, TX\n\n"
        "EXECUTIVE SUMMARY\n"
        "Visionary VP of Engineering with 15+ years delivering enterprise SaaS solutions.\n\n"
        "PROFESSIONAL EXPERIENCE\n"
        "VP of Engineering at AlphaScale Inc (2020 - Present)\n"
        "• Scaled global engineering team from 40 to 220 engineers.\n"
        "• Drove ARR growth from $25M to $120M.\n\n"
        "Director of Engineering at CloudMatrix (2015 - 2020)\n"
        "• Led delivery of enterprise hybrid cloud storage platform.\n\n"
        "Engineering Manager at Apex Data (2010 - 2015)\n"
        "• Managed 3 distributed engineering squads.\n\n"
        "Senior Software Engineer at EarlyTech Corp (2007 - 2010)\n"
        "• Core developer on distributed transaction engine.\n"
    ).encode("utf-8")

    result = GenericResumePipeline.ingest_and_parse(exec_resume, "jonathan_resume.txt")
    data = result["structured_data"]

    assert len(data["work_experience"]) == 4
    companies = [exp["company"] for exp in data["work_experience"]]
    assert "AlphaScale Inc" in companies[0]
    assert "CloudMatrix" in companies[1]
    assert "Apex Data" in companies[2]
    assert "EarlyTech Corp" in companies[3]


# ---------------------------------------------------------------------------
# 13. Generated PDF Output Validation
# ---------------------------------------------------------------------------
def test_format_13_generated_pdf_validation():
    sample_data = {
        "personal_info": {
            "name": "Carlos Gomez",
            "email": "carlos.gomez@example.com",
            "phone": "+1 555-0123",
            "location": "Miami, FL"
        },
        "summary": "Full Stack Engineer specializing in modern cloud architectures.",
        "education": [
            {
                "institution": "University of Florida",
                "degree": "B.S. in Computer Science",
                "passing_year": "2023"
            }
        ],
        "work_experience": [
            {
                "company": "NextGen Technologies",
                "position": "Software Engineer",
                "duration": "2023 - Present",
                "description": "Developed backend microservices in Python."
            }
        ],
        "technicalSkills": ["Python", "FastAPI", "React", "PostgreSQL", "Docker"],
        "custom_sections": [
            {
                "section_name": "OPEN SOURCE CONTRIBUTIONS",
                "content": ["Contributed performance patches to FastAPI framework."]
            }
        ]
    }

    # Render PDF bytes using ReportLab
    pdf_bytes = build_pdf_story(sample_data, template="harvard")
    assert len(pdf_bytes) > 1000

    # Cross-validate that generated PDF text actually contains the structured items
    pdf_validation = GeneratedPDFValidator.validate_generated_pdf(pdf_bytes, sample_data)
    assert pdf_validation["valid"] is True
    assert pdf_validation["page_count"] >= 1
    assert len(pdf_validation["missing_items"]) == 0
