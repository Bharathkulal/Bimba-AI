import re
from typing import Dict, Any, List

# Standard list of technical skills to match against resume text
COMMON_SKILLS = [
    "Python", "JavaScript", "TypeScript", "React", "React Native", "Vue", "Angular",
    "Node.js", "Express", "FastAPI", "Flask", "Django", "Spring Boot", "Java", "C++",
    "C#", "Golang", "Rust", "Ruby", "PHP", "HTML", "CSS", "Tailwind CSS", "Bootstrap",
    "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "SQLite", "Firebase", "AWS",
    "Azure", "GCP", "Docker", "Kubernetes", "Git", "GitHub", "CI/CD", "Linux",
    "RESTful API", "GraphQL", "Redux", "Jira", "Scrum", "Agile", "TypeScript",
    "Machine Learning", "Data Science", "Deep Learning", "TensorFlow", "PyTorch"
]

def extract_personal_info(text: str) -> Dict[str, Any]:
    """
    Regex rules to search for Name, Email, Phone, and Location from text.
    """
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    email = email_match.group(0) if email_match else ""
    
    phone_match = re.search(r'\+?\d[\d -]{8,14}\d', text)
    phone = phone_match.group(0) if phone_match else ""
    
    # Simple name match: often on the very first non-empty line of a resume
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    name = "Candidate Name"
    for line in lines[:3]:
        # Ignore lines with @ or digits or common headers
        if "@" not in line and not any(ch.isdigit() for ch in line) and len(line) < 40 and not any(kw in line.lower() for kw in ["resume", "cv", "portfolio"]):
            name = line
            break
            
    # Simple location match
    location = "Not Specified"
    location_match = re.search(r'(New York|San Francisco|Bangalore|Mumbai|London|Seattle|Boston|Austin|Chicago|Denver|Berlin|Delhi|Chennai|Pune|Mangalore|Hyderabad)', text, re.IGNORECASE)
    if location_match:
        location = location_match.group(0)
        
    return {
        "name": name,
        "email": email,
        "phone": phone,
        "location": location
    }

def extract_skills(text: str) -> List[str]:
    """
    Scans the resume text against a whitelist of common technical skills.
    """
    found_skills = []
    # Case-insensitive match, but using boundary checks to avoid partial words (e.g. Git in Github)
    for skill in COMMON_SKILLS:
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text, re.IGNORECASE):
            found_skills.append(skill)
    return found_skills

def segment_sections(text: str) -> Dict[str, List[str]]:
    """
    Basic parsing rules to separate lines into Experience, Education, Projects, and Certifications.
    """
    lines = text.split("\n")
    current_section = "summary"
    
    sections = {
        "summary": [],
        "experience": [],
        "education": [],
        "projects": [],
        "certifications": [],
        "publications": []
    }
    
    # Section keywords mapping
    keywords = {
        "experience": ["experience", "work history", "employment", "professional history", "career history"],
        "education": ["education", "academic", "degree", "university", "college", "school"],
        "projects": ["projects", "personal projects", "academic projects", "key projects"],
        "certifications": ["certifications", "certificates", "courses", "credentials", "licenses"],
        "publications": ["publications", "patents", "research papers", "papers", "books"]
    }
    
    for line in lines:
        line_clean = line.strip()
        if not line_clean:
            continue
            
        # Check if line is a section header
        header_detected = False
        for sec_name, key_list in keywords.items():
            for kw in key_list:
                if re.search(r'^\b' + re.escape(kw) + r'\b', line_clean, re.IGNORECASE) and len(line_clean) < 30:
                    current_section = sec_name
                    header_detected = True
                    break
            if header_detected:
                break
                
        if header_detected:
            continue
            
        if current_section in sections:
            sections[current_section].append(line_clean)
            
    return sections

def extract_structured_data(text: str) -> Dict[str, Any]:
    """
    Orchestrates the metadata extraction process.
    """
    clean_text = text
    # Pre-cleaning specific known PDF space splits
    clean_text = clean_text.replace("EDUCA TION", "EDUCATION")
    clean_text = clean_text.replace("PUBLICA TIONS", "PUBLICATIONS")
    clean_text = clean_text.replace("T echnology", "Technology")
    clean_text = clean_text.replace("F ull", "Full")
    clean_text = clean_text.replace("HyperT rade", "HyperTrade")
    clean_text = clean_text.replace("A WS", "AWS")
    clean_text = clean_text.replace("T erraform", "Terraform")
    clean_text = clean_text.replace("leveragingA WS", "leveraging AWS")
    clean_text = clean_text.replace("Y ouT ube", "YouTube")
    clean_text = clean_text.replace("F rameworks", "Frameworks")

    info = extract_personal_info(clean_text)
    skills = extract_skills(clean_text)
    sections = segment_sections(clean_text)
    
    # Process structured publication list
    pub_list = []
    for item in sections.get("publications", []):
        quote_match = re.search(r'["“]([^"”]+)["”]', item)
        title = quote_match.group(1) if quote_match else item.split(".")[0]
        year_match = re.search(r"\b(19|20)\d{2}\b", item)
        year = year_match.group(0) if year_match else ""
        pub_list.append({
            "title": title.strip(),
            "publisher": item,
            "year": year,
            "url": "",
            "description": item
        })

    return {
        "name": info["name"],
        "email": info["email"],
        "phone": info["phone"],
        "location": info["location"],
        "skills": skills,
        "education": sections["education"][:5],
        "experience": sections["experience"][:10],
        "projects": sections["projects"][:10],
        "certifications": sections["certifications"][:5],
        "publications": pub_list
    }
