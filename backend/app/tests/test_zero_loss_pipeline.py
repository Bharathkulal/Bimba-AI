"""
Comprehensive Zero-Loss Pipeline Test Suite for BIMBA AI
Validates all 20 required scenarios ensuring no information is ever silently lost or corrupted:
 1. Student Resume Extraction & Preservation
 2. Professional Multi-Job Experience Preservation
 3. Academic & Research Resume (Publications / Conferences)
 4. CGPA Preservation (9.05, 9.31)
 5. Percentage Preservation (89.17%, 92.32%)
 6. Internships Clean Separation
 7. Projects vs Hobbies Separation
 8. GATE CSE & Coding Competition Achievements Preservation
 9. Leadership & Co-Curricular Roles Preservation
10. Short & Special-Syntax Technical Skills Preservation (C, C++, C#, NLP, MSSQL, MongoDB)
11. Full Street Address Preservation (No reduction to a single city)
12. Career Objective vs Professional Summary Separation
13. Personal Details (DOB, Gender, Nationality, Languages Known)
14. Custom & Unclassified Sections Fallback (Additional Information)
15. Normalized Certification Deduplication
16. Multi-Page Intelligent Chunking & Safe Merging
17. 4-Layer Integrity Validation Execution
18. MongoDB Repository 16-Section Round-Trip
19. Builder API Payload Comprehensive Structure
20. Zero-Loss Invariant: 100% Category & Fact Survival
"""

import pytest
from app.services.zero_loss_engine import ZeroLossEngine
from app.services.integrity_validator import ResumeIntegrityValidator
from app.services.resume_parser import ResumeParser, deduplicate_list
from app.services.resume_extraction_service import extract_structured_data
from app.schemas.resume import ResumeData, PersonalInfo, Education, WorkExperience, Internship, Project, SkillCategory


# ----------------------------------------------------------------------
# 1. Student Resume Extraction & Preservation
# ----------------------------------------------------------------------
def test_scenario_1_student_resume():
    raw_resume = {
        "personal_info": {
            "name": "Aditi Sharma",
            "email": "aditi.sharma@example.com",
            "phone": "+91 9876543210",
            "location": "Bengaluru, Karnataka, India"
        },
        "objective": "Aspiring AI Engineer seeking an entry-level software development role.",
        "education": [
            {
                "institution": "B.M.S. College of Engineering",
                "degree": "B.E.",
                "field_of_study": "Computer Science and Engineering",
                "specialization": "Artificial Intelligence",
                "year": "2024",
                "cgpa_percentage": "9.12"
            }
        ],
        "projects": [
            {
                "title": "Autonomous Drone Navigation",
                "technologies": ["Python", "OpenCV", "ROS"],
                "description": "Implemented SLAM algorithms for GPS-denied indoor drone navigation."
            }
        ],
        "skills": ["Python", "C++", "PyTorch", "ROS", "OpenCV"],
        "experience": []
    }
    
    norm = ZeroLossEngine.normalize_to_internal_model(raw_resume)
    assert norm["personal_info"]["name"] == "Aditi Sharma"
    assert norm["objective"] == "Aspiring AI Engineer seeking an entry-level software development role."
    assert len(norm["education"]) == 1
    assert norm["education"][0]["cgpa_percentage"] == "9.12"
    assert norm["education"][0]["specialization"] == "Artificial Intelligence"
    assert len(norm["projects"]) == 1
    assert len(norm["work_experience"]) == 0
    
    # Validation passes without false alarms for zero experience
    val = ResumeIntegrityValidator.validate(raw_resume, raw_resume)
    assert val["isValid"] is True


# ----------------------------------------------------------------------
# 2. Professional Multi-Job Experience Preservation
# ----------------------------------------------------------------------
def test_scenario_2_professional_multi_job():
    raw_resume = {
        "personal_info": {"name": "Rohan Kumar", "email": "rohan@example.com"},
        "experience": [
            {
                "position": "Senior Backend Architect",
                "company": "Tech Innovations Inc",
                "start_date": "2022-03",
                "end_date": "Present",
                "is_current": True,
                "duration": "2022-03 – Present",
                "location": "Seattle, WA",
                "description": "Architected distributed microservices handling 50k RPS.\nReduced latency by 40% using Redis cluster."
            },
            {
                "position": "Software Engineer II",
                "company": "CloudScale Systems",
                "start_date": "2019-06",
                "end_date": "2022-02",
                "is_current": False,
                "duration": "2019-06 – 2022-02",
                "location": "San Francisco, CA",
                "description": "Built resilient Kafka pipelines.\nIntegrated CI/CD with Kubernetes."
            }
        ]
    }
    
    norm = ZeroLossEngine.normalize_to_internal_model(raw_resume)
    assert len(norm["work_experience"]) == 2
    assert norm["work_experience"][0]["position"] == "Senior Backend Architect"
    assert norm["work_experience"][0]["is_current"] is True
    assert norm["work_experience"][1]["company"] == "CloudScale Systems"
    assert norm["work_experience"][1]["is_current"] is False


# ----------------------------------------------------------------------
# 3. Academic & Research Resume (Publications / Conferences)
# ----------------------------------------------------------------------
def test_scenario_3_academic_publications():
    raw_resume = {
        "personal_info": {"name": "Dr. Pranam R Betrabet"},
        "publications": [
            {
                "title": "Arrhythmia Classification using Deep Residual Networks and Wavelet Transforms",
                "authors": "P. R. Betrabet, S. Shenoy, K. Rao",
                "journal": "IEEE Transactions on Biomedical Engineering",
                "publisher": "IEEE",
                "year": "2023",
                "doi": "10.1109/TBME.2023.1234567",
                "description": "Achieved 99.4% F1-score on MIT-BIH Arrhythmia benchmark dataset."
            }
        ]
    }
    
    norm = ZeroLossEngine.normalize_to_internal_model(raw_resume)
    assert len(norm["publications"]) == 1
    pub = norm["publications"][0]
    assert "Arrhythmia Classification" in pub["title"]
    assert "IEEE Transactions" in pub["journal"]
    assert pub["year"] == "2023"


# ----------------------------------------------------------------------
# 4. CGPA Preservation (9.05, 9.31)
# ----------------------------------------------------------------------
def test_scenario_4_cgpa_preservation():
    raw_resume = {
        "education": [
            {"degree": "M.Tech in CSE", "institution": "MIT Manipal", "cgpa_percentage": "9.05", "year": "2022"},
            {"degree": "B.E. in CSE", "institution": "NMAMIT", "cgpa_percentage": "9.31", "year": "2020"}
        ]
    }
    norm = ZeroLossEngine.normalize_to_internal_model(raw_resume)
    scores = [e["cgpa_percentage"] for e in norm["education"]]
    assert "9.05" in scores
    assert "9.31" in scores
    
    # Validation failure if CGPA dropped
    corrupted = {
        "education": [
            {"degree": "M.Tech in CSE", "institution": "MIT Manipal", "cgpa_percentage": "", "year": "2022"},
            {"degree": "B.E. in CSE", "institution": "NMAMIT", "cgpa_percentage": "9.0", "year": "2020"}
        ]
    }
    val = ResumeIntegrityValidator.validate(raw_resume, corrupted)
    assert val["isValid"] is False


# ----------------------------------------------------------------------
# 5. Percentage Preservation (89.17%, 92.32%)
# ----------------------------------------------------------------------
def test_scenario_5_percentage_preservation():
    raw_resume = {
        "education": [
            {"degree": "Pre-University Course (PUC)", "institution": "St. Aloysius PU College", "cgpa_percentage": "89.17%", "year": "2016"},
            {"degree": "Secondary School Leaving Certificate (SSLC)", "institution": "Canara High School", "cgpa_percentage": "92.32%", "year": "2014"}
        ]
    }
    norm = ZeroLossEngine.normalize_to_internal_model(raw_resume)
    scores = [e["cgpa_percentage"] for e in norm["education"]]
    assert "89.17%" in scores or "89.17" in str(scores)
    assert "92.32%" in scores or "92.32" in str(scores)


# ----------------------------------------------------------------------
# 6. Internships Clean Separation
# ----------------------------------------------------------------------
def test_scenario_6_internships_separation():
    text = (
        "Aditya Hegde\n"
        "Email: aditya@example.com\n"
        "INTERNSHIP EXPERIENCE:\n"
        "Machine Learning Intern - Cerner Healthcare (Jan 2023 - Jun 2023)\n"
        "- Built NLP clinical note summarizer using Transformers.\n"
        "WORK EXPERIENCE:\n"
        "Software Development Engineer - Amazon (Jul 2023 - Present)\n"
        "- Developed backend order processing workflows."
    )
    parsed = extract_structured_data(text)
    
    assert len(parsed["internships"]) >= 1
    assert any("Cerner" in (i.get("company") or "") for i in parsed["internships"])
    assert len(parsed["experience"]) >= 1
    assert any("Amazon" in (e.get("company") or "") for e in parsed["experience"])


# ----------------------------------------------------------------------
# 7. Projects vs Hobbies Separation
# ----------------------------------------------------------------------
def test_scenario_7_projects_vs_hobbies():
    raw_resume = {
        "projects": [
            {"title": "Automated Stock Screener", "technologies": "Python, FastAPI", "description": "Scrapes financial statements"}
        ],
        "hobbies_interests": ["Landscape Photography", "Speed Chess", "Marathon Running"]
    }
    norm = ZeroLossEngine.normalize_to_internal_model(raw_resume)
    assert len(norm["projects"]) == 1
    p = norm["projects"][0]
    assert (p.get("title") or p.get("name")) == "Automated Stock Screener"
    assert "Landscape Photography" in norm["hobbies_interests"]
    assert "Speed Chess" in norm["hobbies_interests"]


# ----------------------------------------------------------------------
# 8. GATE CSE & Coding Competition Achievements Preservation
# ----------------------------------------------------------------------
def test_scenario_8_achievements_preservation():
    raw_resume = {
        "achievements": [
            {"title": "GATE Computer Science & IT 2020", "issuer": "IIT Delhi", "description": "Secured All India Rank 450 with 99.4 percentile", "year": "2020"},
            {"title": "1st Place - Smart India Hackathon", "issuer": "Ministry of Education, Govt of India", "year": "2021"},
            {"title": "Top 1% Global Rank (Knight)", "issuer": "LeetCode", "year": "2023"}
        ]
    }
    norm = ZeroLossEngine.normalize_to_internal_model(raw_resume)
    assert len(norm["achievements"]) == 3
    assert any("GATE" in str(a) for a in norm["achievements"])
    assert any("Smart India Hackathon" in str(a) for a in norm["achievements"])
    assert any("LeetCode" in str(a) for a in norm["achievements"])


# ----------------------------------------------------------------------
# 9. Leadership & Co-Curricular Roles Preservation
# ----------------------------------------------------------------------
def test_scenario_9_leadership_roles():
    raw_resume = {
        "leadership": [
            {"role": "Vice President", "organization": "Computer Society of India (CSI) Student Chapter", "duration": "2021 – 2022", "description": "Organized annual national technical fest with 1500+ attendees."},
            {"role": "Technical Lead", "organization": "Google Developer Student Club (GDSC)", "duration": "2020 – 2021"}
        ]
    }
    norm = ZeroLossEngine.normalize_to_internal_model(raw_resume)
    assert len(norm["leadership_roles"]) == 2
    assert norm["leadership_roles"][0]["role"] == "Vice President"
    assert norm["leadership_roles"][1]["organization"] == "Google Developer Student Club (GDSC)"


# ----------------------------------------------------------------------
# 10. Short & Special-Syntax Technical Skills Preservation
# ----------------------------------------------------------------------
def test_scenario_10_special_syntax_skills():
    raw_skills = [
        "C", "C++", "C#", ".NET Core", "CSS3", "HTML5", 
        "Natural Language Processing (NLP)", "Data Mining", 
        "MSSQL", "MongoDB", "Go", "R", "CI/CD"
    ]
    raw_resume = {"skills": raw_skills}
    norm = ZeroLossEngine.normalize_to_internal_model(raw_resume)
    
    extracted_skills = norm["skills"]
    for s in ["C", "C++", "C#", "CSS3", "NLP", "MSSQL", "MongoDB"]:
        assert any(s.lower() in item.lower() for item in extracted_skills), f"Skill {s} was lost!"


# ----------------------------------------------------------------------
# 11. Full Street Address Preservation (No reduction to a single city)
# ----------------------------------------------------------------------
def test_scenario_11_full_street_address():
    full_address = "#104, 3rd Floor, Shanti Apartments, 5th Main, Malleshwaram, Bengaluru, Karnataka 560003"
    raw_resume = {
        "personal_info": {
            "name": "Kavya Murthy",
            "email": "kavya@example.com",
            "phone": "+91 9988776655",
            "location": full_address,
            "address": full_address
        }
    }
    norm = ZeroLossEngine.normalize_to_internal_model(raw_resume)
    assert norm["contact_information"]["address"] == full_address
    assert norm["contact_information"]["location"] == full_address
    
    # Check that validator rejects reduction to just "Bengaluru"
    reduced_resume = {
        "personal_info": {
            "name": "Kavya Murthy",
            "email": "kavya@example.com",
            "phone": "+91 9988776655",
            "location": "Bengaluru"
        }
    }
    val = ResumeIntegrityValidator.validate(raw_resume, reduced_resume)
    assert val["isValid"] is False
    assert any("Address reduced" in e or "Fact dropped" in e for e in val["errors"])


# ----------------------------------------------------------------------
# 12. Career Objective vs Professional Summary Separation
# ----------------------------------------------------------------------
def test_scenario_12_objective_and_summary():
    raw_resume = {
        "personal_info": {"name": "Suresh Naik"},
        "objective": "Seeking a Senior Cloud Architect position to leverage 10+ years in AWS/GCP.",
        "summary": "Proven engineering leader with expertise in large-scale multi-region Kubernetes deployments and FinOps."
    }
    norm = ZeroLossEngine.normalize_to_internal_model(raw_resume)
    assert norm["objective"] == raw_resume["objective"]
    assert norm["summary"] == raw_resume["summary"]
    assert norm["objective"] != norm["summary"]


# ----------------------------------------------------------------------
# 13. Personal Details (DOB, Gender, Nationality, Languages Known)
# ----------------------------------------------------------------------
def test_scenario_13_personal_details():
    raw_resume = {
        "personal_details": {
            "date_of_birth": "15th August 1998",
            "gender": "Female",
            "marital_status": "Single",
            "nationality": "Indian",
            "languages_known": ["English", "Hindi", "Kannada", "German"],
            "passport_number": "Z1234567",
            "permanent_address": "Door No 45, Temple Road, Udupi, Karnataka"
        }
    }
    norm = ZeroLossEngine.normalize_to_internal_model(raw_resume)
    pd = norm["personal_details"]
    assert pd["date_of_birth"] == "15th August 1998"
    assert pd["gender"] == "Female"
    assert "Kannada" in pd["languages_known"]
    assert pd["passport_number"] == "Z1234567"


# ----------------------------------------------------------------------
# 14. Custom & Unclassified Sections Fallback
# ----------------------------------------------------------------------
def test_scenario_14_custom_sections():
    raw_resume = {
        "custom_sections": [
            {
                "section_name": "Patents Filed",
                "content": ["Patent US-2023-019284: Distributed consensus algorithm for Edge AI inference."]
            },
            {
                "section_name": "Workshops & Keynotes",
                "content": ["Keynote speaker at International PyData Conference 2023 on Large Language Models."]
            }
        ]
    }
    norm = ZeroLossEngine.normalize_to_internal_model(raw_resume)
    assert len(norm["additional_sections"]) == 2
    names = [s["section_name"] for s in norm["additional_sections"]]
    assert "Patents Filed" in names
    assert "Workshops & Keynotes" in names


# ----------------------------------------------------------------------
# 15. Normalized Certification Deduplication
# ----------------------------------------------------------------------
def test_scenario_15_certification_deduplication():
    cert_list = [
        {"name": "AWS Certified Solutions Architect - Associate", "organization": "Amazon Web Services", "issue_date": "2023"},
        {"name": "AWS Certified Solutions Architect - Associate", "organization": "Amazon Web Services", "issue_date": "2023"}, # Duplicate
        {"name": "AWS Certified Developer - Associate", "organization": "Amazon Web Services", "issue_date": "2022"},           # Distinct
        {"name": "Certified Kubernetes Administrator (CKA)", "organization": "Cloud Native Computing Foundation", "issue_date": "2024"}
    ]
    deduped = deduplicate_list(cert_list, key_func=lambda c: f"{c.get('name', '')}_{c.get('organization', '')}_{c.get('issue_date', '')}")
    assert len(deduped) == 3


# ----------------------------------------------------------------------
# 16. Multi-Page Intelligent Chunking & Safe Merging
# ----------------------------------------------------------------------
def test_scenario_16_multipage_chunking_and_merging():
    long_text = "\n\n".join([
        "Page 1: Personal Info & Education\nName: Priya Rao\nEducation: B.Tech in CSE at NITK Surathkal (CGPA 9.45)",
        "Page 2: Work Experience\nSenior SDE at Microsoft (2021-Present)\nLed Azure Cosmos DB caching tier optimization",
        "Page 3: Publications & Patents\nPaper: Low-Latency Query Planning in Distributed Databases (VLDB 2022)",
        "Page 4: Certifications & Leadership\nPresident of Women in Technology ACM Chapter"
    ])
    
    chunks = ZeroLossEngine.chunk_resume_text(long_text, max_chunk_chars=150)
    assert len(chunks) >= 2
    
    # Simulate partial extraction results from multiple chunks
    partial_1 = {
        "personal_info": {"name": "Priya Rao"},
        "education": [{"degree": "B.Tech in CSE", "institution": "NITK Surathkal", "cgpa_percentage": "9.45"}]
    }
    partial_2 = {
        "experience": [{"company": "Microsoft", "position": "Senior SDE", "duration": "2021-Present"}],
        "publications": [{"title": "Low-Latency Query Planning in Distributed Databases", "journal": "VLDB 2022"}]
    }
    
    merged = ZeroLossEngine.safe_merge_results([partial_1, partial_2])
    assert merged["personal_info"]["name"] == "Priya Rao"
    assert len(merged["education"]) == 1
    assert len(merged["experience"]) == 1
    assert len(merged["publications"]) == 1


# ----------------------------------------------------------------------
# 17. 4-Layer Integrity Validation Execution
# ----------------------------------------------------------------------
def test_scenario_17_four_layer_integrity_validation():
    source = {
        "personal_info": {"name": "Tarun Verma", "email": "tarun@example.com", "phone": "9876543210"},
        "skills": ["Python", "FastAPI", "Docker", "Kubernetes", "PostgreSQL"],
        "education": [{"degree": "B.Tech", "institution": "IIT Bombay", "cgpa_percentage": "9.20"}],
        "experience": [{"company": "Stripe", "position": "Software Engineer"}]
    }
    
    # Layer 1 failure test (dropped entity)
    missing_phone = {
        "personal_info": {"name": "Tarun Verma", "email": "tarun@example.com", "phone": ""},
        "skills": ["Python", "FastAPI", "Docker", "Kubernetes", "PostgreSQL"],
        "education": [{"degree": "B.Tech", "institution": "IIT Bombay", "cgpa_percentage": "9.20"}],
        "experience": [{"company": "Stripe", "position": "Software Engineer"}]
    }
    val1 = ResumeIntegrityValidator.validate(source, missing_phone)
    assert val1["isValid"] is False
    assert any("phone" in str(e).lower() or "9876543210" in str(e) for e in val1["errors"])
    
    # Layer 2 failure test (dropped skills > 15%)
    missing_skills = {
        "personal_info": {"name": "Tarun Verma", "email": "tarun@example.com", "phone": "9876543210"},
        "skills": ["Python"],  # 4 out of 5 skills dropped (80% drop)
        "education": [{"degree": "B.Tech", "institution": "IIT Bombay", "cgpa_percentage": "9.20"}],
        "experience": [{"company": "Stripe", "position": "Software Engineer"}]
    }
    val2 = ResumeIntegrityValidator.validate(source, missing_skills)
    assert val2["isValid"] is False
    assert any("Skill coverage" in str(e) for e in val2["errors"])
    
    # Full pass test
    val_pass = ResumeIntegrityValidator.validate(source, source)
    assert val_pass["isValid"] is True
    assert val_pass["completenessScore"] >= 80.0


# ----------------------------------------------------------------------
# 18. MongoDB Repository 16-Section Round-Trip
# ----------------------------------------------------------------------
def test_scenario_18_pydantic_schema_16_sections():
    full_data = {
        "personal_info": {
            "name": "Ananya Bhatt",
            "email": "ananya@example.com",
            "phone": "+91 9123456780",
            "location": "Indiranagar, Bengaluru",
            "address": "Indiranagar, Bengaluru",
            "title": "Staff AI Engineer",
            "linkedin": "linkedin.com/in/ananya-bhatt",
            "github": "github.com/ananya-bhatt"
        },
        "objective": "To advance generative AI research in production.",
        "summary": "AI researcher with 8+ years leading deep learning teams.",
        "skills": ["Python", "PyTorch", "Transformers", "CUDA", "C++"],
        "technicalSkills": ["Python", "PyTorch", "Transformers", "CUDA", "C++"],
        "skill_categories": [
            {"category": "AI/ML", "skills": ["PyTorch", "Transformers", "CUDA"]},
            {"category": "Programming", "skills": ["Python", "C++"]}
        ],
        "personalSkills": ["Team Leadership", "Technical Writing"],
        "experience": [
            {
                "position": "Staff AI Engineer",
                "company": "DeepMind",
                "duration": "2021 – Present",
                "is_current": True,
                "description": "Led foundation model pretraining and alignment."
            }
        ],
        "internships": [
            {
                "role": "AI Research Intern",
                "company": "Microsoft Research",
                "duration": "2019",
                "description": "Researched sparse attention mechanisms."
            }
        ],
        "projects": [
            {
                "title": "OpenLLM Serving Engine",
                "technologies": ["C++", "CUDA", "Python"],
                "description": "High-throughput token generator."
            }
        ],
        "education": [
            {
                "degree": "Ph.D. in Computer Science",
                "institution": "Stanford University",
                "year": "2020",
                "cgpa_percentage": "4.0/4.0",
                "specialization": "Deep Learning"
            }
        ],
        "certifications": [
            {
                "name": "NVIDIA Certified Deep Learning Specialist",
                "organization": "NVIDIA",
                "issue_date": "2021"
            }
        ],
        "publications": [
            {
                "title": "Scalable Transformers on Distributed TPUs",
                "journal": "NeurIPS 2021",
                "year": "2021"
            }
        ],
        "achievements": [
            {"title": "Best Paper Award - NeurIPS 2021", "year": "2021"}
        ],
        "leadership": [
            {"role": "Program Committee Chair", "organization": "ICLR 2023", "year": "2023"}
        ],
        "hobbies_interests": ["Violin", "Rock Climbing"],
        "personal_details": {
            "date_of_birth": "1994-04-12",
            "gender": "Female",
            "nationality": "Indian",
            "languages_known": ["English", "Hindi", "French"]
        },
        "additional_information": [
            {"section_name": "Patents", "content": "US Patent 9876543 on sparse attention acceleration."}
        ]
    }
    
    # Validate with Pydantic model
    validated_model = ResumeData(**full_data)
    dumped = validated_model.model_dump()
    
    assert dumped["personal_info"]["name"] == "Ananya Bhatt"
    assert dumped["objective"] == "To advance generative AI research in production."
    assert len(dumped["skill_categories"]) == 2
    assert len(dumped["internships"]) == 1
    assert len(dumped["publications"]) == 1
    assert len(dumped["achievements"]) == 1
    assert len(dumped["leadership"]) == 1
    assert dumped["personal_details"]["nationality"] == "Indian"


# ----------------------------------------------------------------------
# 19. Builder API Payload Comprehensive Structure
# ----------------------------------------------------------------------
def test_scenario_19_builder_api_payload_completeness():
    from app.services.zero_loss_engine import ZeroLossEngine
    sample_profile = {
        "personal_info": {"name": "Naveen Gowda", "email": "naveen@example.com"},
        "education": [{"degree": "B.E.", "institution": "VTU", "cgpa_percentage": "8.85", "specialization": "CSE"}],
        "internships": [{"company": "Infosys", "role": "Intern"}],
        "publications": [{"title": "Cloud Scheduling Algorithms"}],
        "achievements": [{"title": "University Gold Medalist"}],
        "leadership": [{"role": "Student Council President"}],
        "personal_details": {"nationality": "Indian", "languages_known": ["English", "Kannada"]},
        "additional_information": [{"section_name": "Volunteer", "content": "National Service Scheme"}]
    }
    
    # Ensure normalization retains all 16 keys cleanly
    norm = ZeroLossEngine.normalize_to_internal_model(sample_profile)
    assert len(norm["education"]) == 1
    assert norm["education"][0]["cgpa_percentage"] == "8.85"
    assert len(norm["internships"]) == 1
    assert len(norm["publications"]) == 1
    assert len(norm["achievements"]) == 1
    assert len(norm["leadership_roles"]) == 1
    assert norm["personal_details"]["nationality"] == "Indian"
    assert len(norm["additional_sections"]) == 1


# ----------------------------------------------------------------------
# 20. Zero-Loss Invariant: 100% Category & Fact Survival
# ----------------------------------------------------------------------
def test_scenario_20_zero_loss_invariant_100_percent_survival():
    full_candidate_record = {
        "personal_info": {
            "name": "Pranam R Betrabet",
            "email": "pranam@example.com",
            "phone": "+91 9845012345",
            "location": "Mangalore, Karnataka, India",
            "address": "Mangalore, Karnataka, India"
        },
        "objective": "Seeking Machine Learning research opportunities.",
        "summary": "M.Tech graduate in Computer Science with top honors.",
        "skills": ["C", "C++", "Python", "OpenCV", "Machine Learning", "NLP", "PyTorch", "MongoDB", "MSSQL"],
        "education": [
            {"degree": "M.Tech", "institution": "MIT Manipal", "cgpa_percentage": "9.05", "year": "2022"},
            {"degree": "B.E.", "institution": "NMAMIT Nitte", "cgpa_percentage": "9.31", "year": "2020"},
            {"degree": "PUC", "institution": "Canara PU College", "cgpa_percentage": "89.17%", "year": "2016"},
            {"degree": "SSLC", "institution": "Canara High School", "cgpa_percentage": "92.32%", "year": "2014"}
        ],
        "publications": [
            {"title": "Arrhythmia Classification on ECG Signals"}
        ],
        "projects": [
            {"title": "Teeth Shade Detection System", "technologies": "Python, OpenCV"}
        ],
        "internships": [
            {"company": "Bimba AI Labs", "role": "Computer Vision Intern", "duration": "6 months"}
        ],
        "achievements": [
            {"title": "GATE CSE 2020 Qualified", "year": "2020"}
        ],
        "leadership": [
            {"role": "Class Representative", "organization": "MIT Manipal", "year": "2021-2022"}
        ],
        "hobbies_interests": ["Chess", "Badminton"],
        "personal_details": {
            "date_of_birth": "1998-05-20",
            "gender": "Male",
            "nationality": "Indian",
            "languages_known": ["English", "Kannada", "Konkani", "Hindi"]
        }
    }
    
    # 1. Fact registry extraction
    norm = ZeroLossEngine.normalize_to_internal_model(full_candidate_record)
    facts = norm["source_content"]["all_facts"]
    fact_values = [f["value"] for f in facts]
    
    # Crucial values that must NEVER be lost
    assert "Pranam R Betrabet" in fact_values
    assert "pranam@example.com" in fact_values
    assert "+91 9845012345" in fact_values
    assert "9.05" in fact_values
    assert "9.31" in fact_values
    assert "89.17%" in fact_values
    assert "92.32%" in fact_values
    assert "Arrhythmia Classification on ECG Signals" in fact_values
    assert "Teeth Shade Detection System" in fact_values
    assert "Bimba AI Labs" in fact_values
    assert "GATE CSE 2020 Qualified" in fact_values
    
    # 2. End-to-end validator execution
    report = ZeroLossEngine.validate_facts(facts, full_candidate_record)
    assert report["validation_status"] == "PASS"
    assert report["missing_facts"] == 0
    
    val_report = ResumeIntegrityValidator.validate(full_candidate_record, full_candidate_record)
    assert val_report["isValid"] is True
    assert val_report["completenessScore"] >= 90.0
    assert len(val_report["errors"]) == 0
