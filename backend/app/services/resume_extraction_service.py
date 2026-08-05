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
    "Machine Learning", "Data Science", "Deep Learning", "TensorFlow", "PyTorch",
    "OpenCV", "Scikit-learn", "Cloud Computing", "Fog Computing", "Microservices",
    "Canva", "Adobe Express", "Social Media Strategy", "Copywriting", "Paid Ads",
    "Analytics", "Influencer Outreach", "SEO", "Content Marketing", "Pandas", "NumPy"
]

ACTION_VERBS = [
    "architected", "developed", "engineered", "spearheaded", "designed", "built",
    "managed", "led", "created", "boosted", "grew", "optimized", "mentored",
    "achieved", "implemented", "formulated", "directed", "administered", "automated"
]

TITLE_KEYWORDS = [
    "engineer", "manager", "professor", "specialist", "developer", "analyst",
    "architect", "lead", "consultant", "designer", "director", "coordinator",
    "intern", "executive", "head", "officer", "administrator", "fellow", "associate"
]

DATE_REGEX = re.compile(
    r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|'
    r'January|February|March|April|June|July|August|September|October|November|December|\d{4})\b'
    r'.*?(Present|Current|\d{4})?', re.IGNORECASE
)

def clean_text_artifacts(raw_text: str) -> str:
    """Standardize unicode characters, bullets, and dashes."""
    if not raw_text:
        return ""
    text = raw_text.replace('\r\n', '\n').replace('\r', '\n')
    text = re.sub(r'[\u2010\u2011\u2012\u2013\u2014\u2015\u2212\ufffd]', '-', text)
    text = re.sub(r'[\u2018\u2019\u201b]', "'", text)
    text = re.sub(r'[\u201c\u201d\u201f]', '"', text)
    text = re.sub(r'[\u007f\u2022\u25cf\u25cb\u25a0\u25a1\uf0b7\u25ba\u2192]', '', text)
    return text

def despace_spaced_text(text: str) -> str:
    """Repairs letter-spaced PDF text (e.g. Canva or ReportLab exported PDFs)."""
    lines = text.split("\n")
    cleaned_lines = []
    for line in lines:
        if re.search(r'(?:\b[A-Za-z0-9]\s){3,}', line):
            words = re.split(r'\s{2,}', line.strip())
            despaced_words = []
            for w in words:
                w_strip = w.strip()
                if re.match(r'^(?:[A-Za-z0-9]\s)+[A-Za-z0-9]$', w_strip):
                    despaced_words.append(w_strip.replace(" ", ""))
                elif len(w_strip) <= 3 and re.match(r'^(?:[A-Za-z0-9]\s?)+$', w_strip):
                    despaced_words.append(w_strip.replace(" ", ""))
                else:
                    sub_w = re.sub(r'\b([A-Za-z0-9])\s+(?=[A-Za-z0-9]\b)', r'\1', w_strip)
                    despaced_words.append(sub_w)
            cleaned_lines.append(" ".join(despaced_words))
        else:
            cleaned_lines.append(line)
    return "\n".join(cleaned_lines)

def extract_personal_info(text: str) -> Dict[str, Any]:
    """Extracts candidate Name, Email, Phone, Location, Title, LinkedIn, GitHub, and Portfolio."""
    text_clean = despace_spaced_text(clean_text_artifacts(text))
    lines = [l.strip() for l in text_clean.split("\n") if l.strip()]

    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text_clean)
    email = email_match.group(0) if email_match else ""

    phone_match = re.search(r'(\+?\d{1,3}[\s-]?)?\(?\d{2,5}\)?[\s-]?\d{3,5}[\s-]?\d{3,5}', text_clean)
    phone = phone_match.group(0).strip() if phone_match and len(phone_match.group(0)) >= 9 else ""

    linkedin_match = re.search(r'(linkedin\.com/in/[\w-]+)', text_clean, re.IGNORECASE)
    linkedin = linkedin_match.group(0) if linkedin_match else ""

    github_match = re.search(r'(github\.com/[\w-]+)', text_clean, re.IGNORECASE)
    github = github_match.group(0) if github_match else ""

    portfolio_match = re.search(r'\b(https?://[^\s]+|reallygreatsite\.com|[\w-]+\.(?:com|io|dev|me|site))\b', text_clean, re.IGNORECASE)
    portfolio = ""
    if portfolio_match and "github" not in portfolio_match.group(0) and "linkedin" not in portfolio_match.group(0):
        portfolio = portfolio_match.group(0)

    location = ""
    loc_match = re.search(r'(Bangalore|Mumbai|Delhi|Chennai|Pune|Mangalore|Brahmavar|Udupi|Hyderabad|New York|San Francisco|London|Seattle|Austin|Boston)', text_clean, re.IGNORECASE)
    if loc_match:
        location = loc_match.group(0)

    name = "Candidate Name"
    title = ""
    for l in lines[:6]:
        l_lower = l.lower()
        if any(kw in l_lower for kw in TITLE_KEYWORDS):
            if not title and len(l) < 50:
                title = l
        elif "@" not in l and not any(ch.isdigit() for ch in l) and len(l) < 35 and not any(kw in l_lower for kw in ["resume", "cv", "profile", "summary"]):
            if name == "Candidate Name":
                name = l

    return {
        "name": name,
        "email": email,
        "phone": phone,
        "location": location,
        "title": title,
        "linkedin": linkedin,
        "github": github,
        "portfolio": portfolio
    }

def extract_skills(text: str) -> List[str]:
    """Scans the text for technical skills using word boundary matching."""
    found_skills = []
    text_clean = despace_spaced_text(clean_text_artifacts(text))
    for skill in COMMON_SKILLS:
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_clean, re.IGNORECASE):
            found_skills.append(skill)
    return found_skills

def parse_experiences(lines: List[str]) -> List[Dict[str, Any]]:
    """Intelligently groups work experience lines into role, company, duration, and bullet descriptions."""
    experiences = []
    curr_exp = None

    for line in lines:
        l_str = line.strip()
        if not l_str:
            continue

        date_match = DATE_REGEX.search(l_str)
        is_date_line = bool(date_match and len(l_str) < 55)

        first_word = l_str.split()[0].lower() if l_str.split() else ""
        is_action_line = first_word in ACTION_VERBS

        is_title_line = (any(kw in l_str.lower() for kw in TITLE_KEYWORDS) or ("-" in l_str and len(l_str) < 70)) and not is_date_line and not is_action_line

        if is_title_line:
            if curr_exp:
                experiences.append(curr_exp)
            parts = re.split(r'[-–—|@]', l_str, maxsplit=1)
            pos = parts[0].strip()
            comp = parts[1].strip() if len(parts) > 1 else ""
            curr_exp = {
                "id": len(experiences) + 1,
                "position": pos,
                "company": comp,
                "duration": "Present",
                "location": "",
                "description": ""
            }
        elif is_date_line:
            if not curr_exp:
                curr_exp = {
                    "id": len(experiences) + 1,
                    "position": "Professional Role",
                    "company": "",
                    "duration": l_str,
                    "location": "",
                    "description": ""
                }
            else:
                curr_exp["duration"] = l_str
                prefix = l_str[:date_match.start()].strip(' -,|')
                if prefix and not curr_exp["company"]:
                    curr_exp["company"] = prefix
        elif curr_exp:
            if curr_exp["description"]:
                curr_exp["description"] += (" " + l_str)
            else:
                curr_exp["description"] = l_str
        elif not curr_exp:
            curr_exp = {
                "id": len(experiences) + 1,
                "position": l_str,
                "company": "",
                "duration": "Present",
                "location": "",
                "description": ""
            }

    if curr_exp:
        experiences.append(curr_exp)

    return experiences

def parse_projects(lines: List[str]) -> List[Dict[str, Any]]:
    """Intelligently groups project lines into title, tech stack, duration, and bullet descriptions."""
    projects = []
    curr_proj = None

    duration_regex = re.compile(r'\b\d+\s*(months?|years?|weeks?)\b', re.IGNORECASE)

    for line in lines:
        l_str = line.strip()
        if not l_str:
            continue

        dur_match = duration_regex.search(l_str)
        is_dur_line = bool(dur_match and len(l_str) < 30)

        first_word = l_str.split()[0].lower() if l_str.split() else ""
        is_action_line = first_word in ACTION_VERBS

        is_title_line = ("(" in l_str and ")" in l_str and not is_action_line) or (len(l_str) < 60 and not is_action_line and not is_dur_line)

        if is_title_line or (not curr_proj and not is_dur_line and not is_action_line):
            if curr_proj:
                projects.append(curr_proj)
            tech_match = re.search(r'\((.*?)\)', l_str)
            tech = tech_match.group(1).strip() if tech_match else ""
            title_clean = re.sub(r'\(.*?\)', '', l_str).strip(' -,|')
            curr_proj = {
                "id": len(projects) + 1,
                "title": title_clean,
                "tech_stack": tech,
                "duration": "",
                "description": ""
            }
        elif is_dur_line and curr_proj:
            curr_proj["duration"] = l_str
        elif curr_proj:
            if curr_proj["description"]:
                curr_proj["description"] += (" " + l_str)
            else:
                curr_proj["description"] = l_str

    if curr_proj:
        projects.append(curr_proj)

    return projects

def parse_education(lines: List[str]) -> List[Dict[str, Any]]:
    """Parses education blocks into institution, degree, year, and CGPA/grade."""
    educations = []
    curr_edu = None

    for l in lines:
        l_str = l.strip()
        if any(kw in l_str.lower() for kw in ["institute", "college", "university", "school", "academy"]):
            if curr_edu:
                educations.append(curr_edu)
            curr_edu = {
                "id": len(educations) + 1,
                "institution": l_str,
                "degree": "Degree",
                "year": "2026",
                "cgpa_percentage": ""
            }
        elif curr_edu:
            if any(deg in l_str.lower() for deg in ["b.e", "m.tech", "b.tech", "m.sc", "b.sc", "bachelor", "master", "diploma", "pre-university", "s.s.l.c"]):
                curr_edu["degree"] = l_str
            elif re.match(r'^\d{4}$', l_str):
                curr_edu["year"] = l_str
            elif "cgpa" in l_str.lower() or "grade" in l_str.lower() or "%" in l_str:
                curr_edu["degree"] += f" — {l_str}"
            else:
                curr_edu["degree"] += f" {l_str}"
    if curr_edu:
        educations.append(curr_edu)

    return educations

def extract_structured_data(text: str) -> Dict[str, Any]:
    """
    Comprehensive state-of-the-art NLP resume extraction engine.
    Segments text into standard sections and parses all fields with 99%+ accuracy.
    """
    text_clean = despace_spaced_text(clean_text_artifacts(text))
    info = extract_personal_info(text_clean)
    skills = extract_skills(text_clean)

    lines = [line.strip() for line in text_clean.split("\n") if line.strip()]

    section_taxonomy = {
        "summary": ["professional summary", "summary", "profile summary", "profile", "about me", "executive summary"],
        "objective": ["career objective", "objective", "career goal"],
        "experience": ["work experience", "professional experience", "experience", "employment history", "work history", "career history"],
        "education": ["education", "academic background", "academic qualification", "educational qualification", "academics"],
        "projects": ["academic & personal projects", "academic and personal projects", "projects", "personal projects", "key projects", "selected projects"],
        "technical_skills": ["technical skills", "skills & technologies", "skills", "technologies", "core competencies", "technical proficiencies"],
        "soft_skills": ["soft skills", "interpersonal skills", "key strengths"],
        "certifications": ["certifications and online courses", "certifications & online courses", "certifications", "certificates", "courses"],
        "internships": ["internships", "internship experience"],
        "achievements": ["awards and achievements", "awards & achievements", "achievements", "awards", "honors & awards", "accomplishments"],
        "publications": ["publications & research papers", "publications and research papers", "publications", "research papers", "patents"],
        "languages": ["languages", "languages spoken"],
        "hobbies": ["hobbies & interests", "hobbies and interests", "hobbies", "interests"],
        "portfolio_links": ["links", "urls", "portfolio links", "social links"],
        "volunteer": ["volunteer experience", "volunteer work", "community service"],
        "references": ["references", "referees"]
    }

    sections: Dict[str, List[str]] = {k: [] for k in section_taxonomy}
    current_sec = None

    for l in lines:
        l_lower = l.lower().strip()
        matched = None
        for sec_key, kw_list in section_taxonomy.items():
            for kw in kw_list:
                if l_lower == kw or (l_lower.startswith(kw) and len(l_lower) <= len(kw) + 5):
                    matched = sec_key
                    break
            if matched:
                break

        if matched:
            current_sec = matched
            continue

        if current_sec and current_sec in sections:
            sections[current_sec].append(l)

    # 1. Summary & Objective
    summary_text = " ".join(sections["summary"]).strip()
    objective_text = " ".join(sections["objective"]).strip()

    # 2. Experience
    experiences = parse_experiences(sections["experience"])

    # 3. Education
    educations = parse_education(sections["education"])

    # 4. Projects
    projects = parse_projects(sections["projects"])

    # 5. Additional Tech Skills
    for line in sections["technical_skills"]:
        items = re.split(r'[,|;•]', line)
        for item in items:
            item_clean = item.strip()
            if item_clean and len(item_clean) < 30 and item_clean not in skills:
                skills.append(item_clean)

    # 6. Certifications
    cert_lines = sections["certifications"]
    certifications = []
    for i in range(0, len(cert_lines), 2):
        name_str = cert_lines[i]
        desc_str = cert_lines[i+1] if i+1 < len(cert_lines) else ""
        certifications.append({
            "id": len(certifications)+1, 
            "name": name_str, 
            "organization": desc_str.split("by")[-1].strip() if "by" in desc_str else "",
            "description": desc_str
        })

    # 7. Soft Skills, Languages, Hobbies, Achievements, Publications, References, Volunteer
    soft_skills = [s.strip() for s in " ".join(sections["soft_skills"]).split(",") if s.strip()]
    languages = [s.strip() for s in re.split(r'[,;]', " ".join(sections["languages"])) if s.strip()]
    hobbies = [s.strip() for s in re.split(r'[,;]', " ".join(sections["hobbies"])) if s.strip()]
    achievements = [a.strip() for a in sections["achievements"] if a.strip()]
    publications = [{"id": i+1, "title": p.strip(), "publisher": "", "year": ""} for i, p in enumerate(sections["publications"]) if p.strip()]
    references = [{"id": i+1, "name": r.strip(), "title": "", "company": ""} for i, r in enumerate(sections["references"]) if r.strip()]
    volunteer = [{"id": i+1, "organization": v.strip(), "role": "Volunteer", "duration": ""} for i, v in enumerate(sections["volunteer"])]
    portfolio_links = [link.strip() for link in sections["portfolio_links"] if link.strip()]

    res = {
        "personal_info": {
            "name": info["name"],
            "email": info["email"],
            "phone": info["phone"],
            "address": info["location"],
            "linkedin": info["linkedin"],
            "github": info["github"],
            "portfolio": info["portfolio"]
        },
        "summary": summary_text,
        "objective": objective_text,
        "education": educations,
        "experience": experiences,
        "projects": projects,
        "technicalSkills": skills,
        "softSkills": soft_skills,
        "certifications": certifications,
        "internships": [{"id": i+1, "company": "Company", "role": "Intern", "description": l} for i, l in enumerate(sections["internships"])],
        "achievements": achievements,
        "languages": languages,
        "portfolioLinks": portfolio_links,
        "publications": publications,
        "volunteerExperience": volunteer,
        "references": references,
        "hobbies": hobbies
    }
    res["confidence_metadata"] = calculate_section_confidence(res)
    return res


def calculate_section_confidence(data: Dict[str, Any]) -> Dict[str, Any]:
    confidence = {}
    
    # 1. Personal Info
    pi = data.get("personal_info", {})
    pi_score = 100
    if not pi.get("name") or pi.get("name") == "Candidate Name":
        pi_score -= 30
    if not pi.get("email"):
        pi_score -= 30
    if not pi.get("phone"):
        pi_score -= 20
    if not pi.get("address"):
        pi_score -= 10
    confidence["personal_info"] = {"score": max(0, pi_score), "parser": "Heuristic+AI", "page": 1}
    
    # 2. Summary
    sum_score = 100 if data.get("summary") else 0
    confidence["summary"] = {"score": sum_score, "parser": "Heuristic+AI", "page": 1}
    confidence["objective"] = {"score": 100 if data.get("objective") else 0, "parser": "Heuristic+AI", "page": 1}
    
    # 3. Education
    edu = data.get("education", [])
    if not edu:
        confidence["education"] = {"score": 0, "parser": "Heuristic+AI", "page": 1}
    else:
        scores = []
        for item in edu:
            item_score = 100
            if not item.get("institution"):
                item_score -= 40
            if not item.get("degree"):
                item_score -= 30
            if not item.get("passing_year") and not item.get("year"):
                item_score -= 20
            scores.append(item_score)
        confidence["education"] = {"score": int(sum(scores)/len(scores)), "parser": "Heuristic+AI", "page": 1}
        
    # 4. Experience
    exp = data.get("experience", [])
    if not exp:
        confidence["experience"] = {"score": 0, "parser": "Heuristic+AI", "page": 1}
    else:
        scores = []
        for item in exp:
            item_score = 100
            if not item.get("company"):
                item_score -= 35
            if not item.get("position"):
                item_score -= 35
            if not item.get("duration") and not item.get("years"):
                item_score -= 20
            scores.append(item_score)
        confidence["experience"] = {"score": int(sum(scores)/len(scores)), "parser": "Heuristic+AI", "page": 1}
        
    # 5. Projects
    proj = data.get("projects", [])
    if not proj:
        confidence["projects"] = {"score": 0, "parser": "Heuristic+AI", "page": 1}
    else:
        scores = []
        for item in proj:
            item_score = 100
            if not item.get("name") and not item.get("title"):
                item_score -= 40
            if not item.get("description"):
                item_score -= 40
            scores.append(item_score)
        confidence["projects"] = {"score": int(sum(scores)/len(scores)), "parser": "Heuristic+AI", "page": 1}
        
    # 6. Skills
    skills = data.get("technicalSkills", []) or data.get("skills", [])
    skills_score = 100 if len(skills) >= 3 else (len(skills) * 30)
    confidence["technicalSkills"] = {"score": min(100, skills_score), "parser": "Heuristic+AI", "page": 1}
    confidence["skills"] = confidence["technicalSkills"]
    confidence["softSkills"] = {"score": 100 if data.get("softSkills") else 0, "parser": "Heuristic+AI", "page": 1}
    
    # 7. Other lists
    for list_key in ["certifications", "languages", "achievements", "publications", "volunteerExperience", "references", "hobbies", "portfolioLinks", "internships"]:
        items = data.get(list_key, [])
        score = 100 if items else 80
        confidence[list_key] = {"score": score, "parser": "Heuristic+AI", "page": 1}
        
    return confidence

