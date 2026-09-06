import re
import difflib
from typing import Dict, Any, List

COMMON_SKILLS = [
    "Python", "JavaScript", "TypeScript", "React", "React Native", "Vue", "Angular",
    "Node.js", "Express", "FastAPI", "Flask", "Django", "Spring Boot", "Java", "C", "C++",
    "C#", "Golang", "Rust", "Ruby", "PHP", "HTML", "CSS", "Tailwind CSS", "Bootstrap",
    "SQL", "MySQL", "PostgreSQL", "MSSQL", "MongoDB", "Redis", "SQLite", "Firebase", "AWS",
    "Azure", "GCP", "Docker", "Kubernetes", "Git", "GitHub", "CI/CD", "Linux", "Ubuntu", "Windows",
    "RESTful API", "GraphQL", "Redux", "Jira", "Scrum", "Agile", "Microservices",
    "Machine Learning", "Data Science", "Deep Learning", "TensorFlow", "PyTorch",
    "OpenCV", "Scikit-learn", "Cloud Computing", "Fog Computing", "Natural Language Processing", "NLP",
    "Data Mining", "Data Structures", "Algorithms", "Computer Networks", "DBMS", "Operating Systems",
    "Canva", "Adobe Express", "Social Media Strategy", "Copywriting", "Paid Ads",
    "Analytics", "Influencer Outreach", "SEO", "Content Marketing", "Pandas", "NumPy",
    "C/C++", "PL/SQL", "Oracle", "Big Data", "Hadoop", "Spark", "Tableau", "Power BI"
]

ACTION_VERBS = [
    "architected", "developed", "engineered", "spearheaded", "designed", "built",
    "managed", "led", "created", "boosted", "grew", "optimized", "mentored",
    "achieved", "implemented", "formulated", "directed", "administered", "automated",
    "cleared", "published", "authored", "co-authored", "researched", "presented", "analyzed"
]

TITLE_KEYWORDS = [
    "engineer", "manager", "professor", "specialist", "developer", "analyst",
    "architect", "lead", "consultant", "designer", "director", "coordinator",
    "intern", "executive", "head", "officer", "administrator", "fellow", "associate",
    "lecturer", "assistant professor", "researcher", "trainee"
]

DATE_REGEX = re.compile(
    r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|'
    r'January|February|March|April|June|July|August|September|October|November|December|\d{4})\b'
    r'.*?(Present|Current|\d{4})?', re.IGNORECASE
)

SECTION_TAXONOMY = {
    "summary": ["professional summary", "summary", "profile summary", "profile", "about me", "executive summary", "career profile", "about", "summary of qualifications", "summary of experience"],
    "objective": ["career objective", "objective", "career summary", "career goal", "objective & summary"],
    "experience": ["work experience", "professional experience", "experience", "employment history", "work history", "career history", "employment", "professional background"],
    "education": ["education", "academic background", "academic qualification", "educational qualification", "academics", "educational qualifications and trainings", "academic profile", "academic qualifications", "academic record"],
    "projects": ["academic & personal projects", "academic and personal projects", "projects", "personal projects", "key projects", "selected projects", "academic projects", "technical projects"],
    "technical_skills": ["technical skill set", "technical skills", "skills & technologies", "skills", "technologies", "core competencies", "technical proficiencies", "tech stack", "software skills", "key skills", "programming skills"],
    "soft_skills": ["personal skills", "soft skills", "interpersonal skills", "key strengths", "competencies", "strengths"],
    "certifications": ["certifications and online courses", "certifications & online courses", "certifications", "certificates", "courses", "training", "licenses & certifications", "credentials", "trainings & certifications", "online courses"],
    "internships": ["internship", "internships", "internship experience", "industrial training", "research internship"],
    "achievements": ["awards and achievements", "awards & achievements", "achievements", "awards", "honors & awards", "accomplishments", "co-curricular activities", "extra-curricular achievements"],
    "leadership": ["leadership", "leadership & responsibilities", "positions of responsibility", "responsibilities", "leadership roles", "extra-curricular responsibilities"],
    "publications": ["publications & research papers", "publications and research papers", "publications", "research papers", "patents", "research articles", "articles", "research publications", "conference papers"],
    "languages": ["languages", "languages spoken", "languages known"],
    "hobbies": ["hobbies & interests", "hobbies and interests", "hobbies", "interests", "activities"],
    "portfolio_links": ["links", "urls", "portfolio links", "social links"],
    "volunteer": ["volunteer experience", "volunteer work", "community service", "volunteering"],
    "references": ["references", "referees"],
    "personal_info": ["personal details", "personal information", "personal profile", "contact", "contact information"]
}

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

def normalize_text_lines(text: str) -> List[str]:
    text_clean = despace_spaced_text(clean_text_artifacts(text))
    text_clean = text_clean.replace("\\n", " ")
    raw_lines = [l.strip() for l in text_clean.split("\n")]
    lines = []
    for l in raw_lines:
        if not l:
            lines.append(l)
            continue
        if re.match(r'^(page\s+\d+(\s+of\s+\d+)?|\d+\s*/\s*\d+|\d+|---\s*page\s+\d+\s*---)$', l, re.IGNORECASE):
            continue
        lines.append(l)
    return lines

def extract_personal_info(lines: List[str]) -> Dict[str, Any]:
    text_clean = "\n".join(lines)
    
    # 1. Email Regex
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text_clean)
    email = email_match.group(0) if email_match else ""

    # 2. Phone Regex
    phone = ""
    for match in re.finditer(r'\+?[\d\s\-\(\)]{8,20}\d', text_clean):
        val = match.group(0).strip()
        digits = re.sub(r'\D', '', val)
        if 7 <= len(digits) <= 15:
            if not any(yr in val for yr in ["2020", "2021", "2022", "2023", "2024", "2025", "2026"]):
                phone = val
                break
    if not phone:
        phone_match = re.search(r'(\+?\d{1,4}[\s-]?)?\(?\d{2,5}\)?[\s-]?\d{3,5}[\s-]?\d{3,5}', text_clean)
        phone = phone_match.group(0).strip() if phone_match and len(re.sub(r'\D', '', phone_match.group(0))) >= 7 else ""

    # 3. Links
    linkedin_match = re.search(r'(linkedin\.com/in/[\w-]+)', text_clean, re.IGNORECASE)
    linkedin = linkedin_match.group(0) if linkedin_match else ""

    github_match = re.search(r'(github\.com/[\w-]+)', text_clean, re.IGNORECASE)
    github = github_match.group(0) if github_match else ""

    portfolio_match = re.search(r'\b(https?://[^\s]+|[\w-]+\.(?:com|io|dev|me|site))\b', text_clean, re.IGNORECASE)
    portfolio = ""
    if portfolio_match and "github" not in portfolio_match.group(0) and "linkedin" not in portfolio_match.group(0) and "@" not in portfolio_match.group(0):
        portfolio = portfolio_match.group(0)

    # 4. Full Address Extraction (Not reducing to single city!)
    address = ""
    loc_kw_match = re.search(r'(?:location)\s*[:\-]\s*([^\n|]+)', text_clean, re.IGNORECASE)
    addr_match = re.search(r'(?:address|residence|contact address)\s*[:\-]\s*([^\n|]+(?:\n[^\n|]+){0,2})', text_clean, re.IGNORECASE)
    if loc_kw_match:
        address = loc_kw_match.group(1).strip(' -,|')
    elif addr_match:
        address = " ".join(addr_match.group(1).split()).strip(' -,|')
    else:
        # Check top lines for address pattern (street, pin code, district, city)
        for line in lines[:12]:
            l_clean = line.strip()
            if any(kw in l_clean.lower() for kw in ["pin:", "pin code", "post:", "taluk", "district", "street", "road", "nagar", "cross", "state", "india", "karnataka", "maharashtra", "delhi", "california", "texas", "ny"]):
                if not any(k in l_clean.lower() for k in ["objective", "experience", "education", "skills", "projects", "email", "@"]):
                    address = l_clean
                    break

    location = address
    if not location:
        # Fallback city/state pattern
        loc_match = re.search(r'\b([A-Z][a-zA-Z\s]+,\s*[A-Z]{2}|[A-Z][a-zA-Z\s]+,\s*India|[A-Z][a-zA-Z\s]+,\s*USA)\b', text_clean)
        if loc_match:
            location = loc_match.group(0)

    # 5. Name Inference
    name = ""
    for l in lines[:15]:
        l_no_tags = re.sub(r'<[^>]+>', '', l).strip()
        if not l_no_tags:
            continue
        prop_matches = re.findall(r'\b([A-Z][a-z]{1,20}(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]{1,20}(?:\s+[A-Z][a-z]{1,20})?)\b', l_no_tags)
        for cand in prop_matches:
            cand_lower = cand.lower()
            non_name_terms = ["phone", "email", "address", "post", "pin", "contact", "location", "objective", "summary", "experience", "education", "skills", "projects", "m.tech", "b.e", "b.tech", "m.sc", "b.sc", "computer", "engineering", "technology", "science", "college", "institute", "university", "school", "course", "programme", "temple", "road", "village"]
            if not any(kw in cand_lower for kw in non_name_terms):
                name = cand
                break
        if name:
            break

    if not name and email:
        uname = email.split('@')[0]
        uname_clean = re.sub(r'\d+', '', uname).replace('.', ' ').replace('_', ' ').strip()
        if len(uname_clean) >= 3:
            name = " ".join(w.capitalize() for w in uname_clean.split())
    if not name:
        name = "Candidate Name"

    return {
        "name": name,
        "full_name": name,
        "email": email,
        "phone": phone,
        "address": address or location,
        "location": location or address,
        "linkedin": linkedin,
        "github": github,
        "portfolio": portfolio,
        "title": ""
    }

def detect_section_header(line: str, is_preceded_by_empty: bool = False) -> str:
    if any(tag in line for tag in ["<TABLE>", "</TABLE>", "<TR>", "<TR-HEADER>"]):
        return None
    l_no_tags = re.sub(r'<[^>]+>', '', line).strip().lower()
    if len(l_no_tags) > 45 or not l_no_tags:
        return None
        
    has_cue = "<H>" in line
    best_match = None
    highest_ratio = 0.82
    
    for sec_key, kw_list in SECTION_TAXONOMY.items():
        for kw in kw_list:
            if l_no_tags == kw or l_no_tags.startswith(kw + " ") or l_no_tags.endswith(" " + kw) or l_no_tags.startswith(kw + ":"):
                return sec_key
            if kw in l_no_tags and len(l_no_tags) - len(kw) < 8:
                return sec_key
            ratio = difflib.SequenceMatcher(None, l_no_tags, kw).ratio()
            if ratio > highest_ratio:
                highest_ratio = ratio
                best_match = sec_key
                
    if best_match:
        return best_match
        
    is_caps_or_title = l_no_tags.istitle() or l_no_tags.isupper() or line.strip().istitle() or line.strip().isupper()
    no_date = not DATE_REGEX.search(line)
    short_len = 3 < len(l_no_tags) < 30
    no_punctuation = not any(p in l_no_tags for p in ['.', ',', '-', '!', '|', '(', ')'])
    
    if has_cue or (is_caps_or_title and short_len and no_date and no_punctuation and is_preceded_by_empty):
        return f"custom_{l_no_tags.replace(' ', '_')}"
        
    return None

def extract_skills_robust(text: str, skill_lines: List[str] = None) -> List[Dict[str, Any]]:
    """Extracts skills preserving categories (e.g. Programming Languages, Frontend, Databases)."""
    categorized_skills: List[Dict[str, Any]] = []
    flat_skills: List[str] = []
    text_clean = despace_spaced_text(clean_text_artifacts(re.sub(r'<[^>]+>', '', text)))

    if skill_lines:
        for line in skill_lines:
            l_str = line.strip()
            if not l_str:
                continue
            if ":" in l_str or "-" in l_str:
                parts = re.split(r'[:\-]', l_str, maxsplit=1)
                category = parts[0].strip(' •-*')
                skills_part = parts[1].strip()
                tokens = [s.strip() for s in re.split(r'[,|;•]', skills_part) if s.strip()]
                if tokens:
                    categorized_skills.append({
                        "category": category,
                        "skills": tokens
                    })
                    flat_skills.extend(tokens)
            else:
                tokens = [s.strip() for s in re.split(r'[,|;•]', l_str) if s.strip() and len(s.strip()) < 35]
                flat_skills.extend(tokens)

    # Match common skills from text body
    for skill in COMMON_SKILLS:
        pattern = r'(?<![A-Za-z0-9_])' + re.escape(skill) + r'(?![A-Za-z0-9_])'
        if re.search(pattern, text_clean, re.IGNORECASE):
            if skill not in flat_skills:
                flat_skills.append(skill)

    return {
        "categorized": categorized_skills,
        "flat": list(dict.fromkeys(flat_skills))
    }

def parse_experiences(lines: List[str]) -> List[Dict[str, Any]]:
    experiences = []
    curr_exp = None
    
    for line in lines:
        if "<TR-HEADER>" in line or "<TABLE>" in line or "</TABLE>" in line:
            continue
            
        l_str = re.sub(r'<[^>]+>', '', line).strip()
        if not l_str:
            continue

        if "<TR>" in line:
            parts = [p.strip() for p in l_str.split("|")]
            if len(parts) >= 2:
                if curr_exp: experiences.append(curr_exp)
                curr_exp = {
                    "id": len(experiences) + 1,
                    "position": parts[0],
                    "role": parts[0],
                    "company": parts[1] if len(parts) > 1 else "",
                    "organization": parts[1] if len(parts) > 1 else "",
                    "duration": parts[2] if len(parts) > 2 else "",
                    "location": parts[3] if len(parts) > 3 else "",
                    "description": " ".join(parts[4:]) if len(parts) > 4 else "",
                    "is_current": "present" in (parts[2].lower() if len(parts) > 2 else "")
                }
            continue

        date_match = DATE_REGEX.search(l_str)
        is_date_line = bool(date_match and len(l_str) < 55)
        first_word = l_str.split()[0].lower() if l_str.split() else ""
        is_action_line = first_word in ACTION_VERBS
        is_title_line = (any(kw in l_str.lower() for kw in TITLE_KEYWORDS) or ("-" in l_str and len(l_str) < 70)) and not is_date_line and not is_action_line

        if is_title_line:
            if curr_exp:
                experiences.append(curr_exp)
            
            pos = l_str
            comp = ""
            if " at " in l_str.lower():
                idx = l_str.lower().find(" at ")
                pos = l_str[:idx].strip()
                comp = l_str[idx + 4:].strip()
            else:
                parts = re.split(r'[-–—|@]', l_str, maxsplit=1)
                pos = parts[0].strip()
                comp = parts[1].strip() if len(parts) > 1 else ""
                
            description = ""
            date_match = DATE_REGEX.search(comp)
            dur = "Present"
            is_curr = True
            if date_match:
                dur = date_match.group(0)
                is_curr = "present" in dur.lower() or "current" in dur.lower()
                desc_part = comp[date_match.end():].strip(' -,|()')
                comp = comp[:date_match.start()].strip(' -,|()')
                if desc_part:
                    description = desc_part
            else:
                date_match_pos = DATE_REGEX.search(pos)
                if date_match_pos:
                    dur = date_match_pos.group(0)
                    is_curr = "present" in dur.lower() or "current" in dur.lower()
                    desc_part = pos[date_match_pos.end():].strip(' -,|()')
                    pos = pos[:date_match_pos.start()].strip(' -,|()')
                    if desc_part:
                        description = desc_part

            curr_exp = {
                "id": len(experiences) + 1,
                "position": pos,
                "role": pos,
                "company": comp,
                "organization": comp,
                "duration": dur,
                "is_current": is_curr,
                "location": "",
                "description": description
            }
        elif is_date_line:
            if not curr_exp:
                curr_exp = {
                    "id": len(experiences) + 1,
                    "position": "Professional Role",
                    "role": "Professional Role",
                    "company": "",
                    "organization": "",
                    "duration": l_str,
                    "is_current": "present" in l_str.lower(),
                    "location": "",
                    "description": ""
                }
            else:
                curr_exp["duration"] = l_str
                curr_exp["is_current"] = "present" in l_str.lower()
                prefix = l_str[:date_match.start()].strip(' -,|')
                if prefix and not curr_exp["company"]:
                    curr_exp["company"] = prefix
                    curr_exp["organization"] = prefix
        elif curr_exp:
            if curr_exp["description"]:
                curr_exp["description"] += (" " + l_str)
            else:
                curr_exp["description"] = l_str
        elif not curr_exp:
            curr_exp = {
                "id": len(experiences) + 1,
                "position": l_str,
                "role": l_str,
                "company": "",
                "organization": "",
                "duration": "Present",
                "is_current": True,
                "location": "",
                "description": ""
            }

    if curr_exp:
        experiences.append(curr_exp)

    return experiences

def parse_projects(lines: List[str]) -> List[Dict[str, Any]]:
    projects = []
    curr_proj = None

    for line in lines:
        if "<TR-HEADER>" in line or "<TABLE>" in line or "</TABLE>" in line:
            continue
        
        l_str = re.sub(r'<[^>]+>', '', line).strip()
        if not l_str:
            continue
            
        first_word = l_str.split()[0].lower() if l_str.split() else ""
        is_action_line = first_word in ACTION_VERBS
        is_title_line = ("(" in l_str and ")" in l_str and not is_action_line) or (len(l_str) < 65 and not is_action_line)

        if is_title_line or not curr_proj:
            if curr_proj:
                projects.append(curr_proj)
            tech_match = re.search(r'\((.*?)\)', l_str)
            tech = tech_match.group(1).strip() if tech_match else ""
            title_clean = re.sub(r'\(.*?\)', '', l_str).strip(' -,|')
            
            description = ""
            for separator in [":", " - "]:
                if separator in title_clean:
                    parts = title_clean.split(separator, 1)
                    title_clean = parts[0].strip(' -,|')
                    description = parts[1].strip()
                    break
                    
            curr_proj = {
                "id": len(projects) + 1,
                "title": title_clean,
                "name": title_clean,
                "technologies": tech,
                "tech_stack": tech,
                "duration": "",
                "description": description
            }
        elif curr_proj:
            if curr_proj["description"]:
                curr_proj["description"] += (" " + l_str)
            else:
                curr_proj["description"] = l_str

    if curr_proj:
        projects.append(curr_proj)

    return projects

def parse_education(lines: List[str]) -> List[Dict[str, Any]]:
    educations = []
    curr_edu = None
    col_map = {"inst": 0, "deg": 1, "yr": 2, "cgpa": 3}

    for line in lines:
        if "<TABLE>" in line or "</TABLE>" in line:
            continue
            
        l_str = re.sub(r'<[^>]+>', '', line).strip()
        if not l_str:
            continue

        if "<TR-HEADER>" in line:
            parts = [p.strip().lower() for p in l_str.split("|")]
            for idx, p in enumerate(parts):
                if any(k in p for k in ["inst", "college", "school", "university", "academy"]):
                    col_map["inst"] = idx
                elif any(k in p for k in ["course", "degree", "qualification", "exam", "program", "stream"]):
                    col_map["deg"] = idx
                elif any(k in p for k in ["year", "passing", "date"]):
                    col_map["yr"] = idx
                elif any(k in p for k in ["cgpa", "percentage", "marks", "gpa", "grade", "score", "%"]):
                    col_map["cgpa"] = idx
            continue

        if "<TR>" in line:
            parts = [p.strip() for p in l_str.split("|")]
            if len(parts) >= 2:
                if curr_edu: educations.append(curr_edu)
                
                inst = parts[col_map["inst"]] if col_map["inst"] < len(parts) else ""
                deg = parts[col_map["deg"]] if col_map["deg"] < len(parts) else ""
                yr = parts[col_map["yr"]] if col_map["yr"] < len(parts) else ""
                cgpa = parts[col_map["cgpa"]] if col_map["cgpa"] < len(parts) else ""

                if (re.search(r'\b(19|20)\d{2}\b', cgpa) and not re.search(r'\b(19|20)\d{2}\b', yr)) or ("%" in yr or "cgpa" in yr.lower() or "gpa" in yr.lower()):
                    cgpa, yr = yr, cgpa

                if yr and not re.search(r'\b(19|20)\d{2}\b', yr):
                    y_match = re.search(r'\b(19|20)\d{2}\b', yr)
                    yr = y_match.group(0) if y_match else yr

                score_type = "CGPA" if "cgpa" in cgpa.lower() or ("." in cgpa and not "%" in cgpa) else ("Percentage" if "%" in cgpa else "")

                curr_edu = {
                    "id": len(educations) + 1,
                    "institution": inst,
                    "degree": deg,
                    "specialization": "",
                    "year": yr,
                    "score": cgpa,
                    "score_type": score_type,
                    "cgpa_percentage": cgpa
                }
            continue

        is_degree = any(deg in l_str.lower() for deg in ["b.e", "m.tech", "b.tech", "m.sc", "b.sc", "bachelor", "master", "diploma", "pre-university", "s.s.l.c", "puc", "sslc"])
        is_inst = any(kw in l_str.lower() for kw in ["institute", "college", "university", "school", "academy", "mit", "iit", "iiit"])
        
        if is_inst or is_degree:
            if curr_edu:
                educations.append(curr_edu)
            
            cgpa_val = ""
            cgpa_match = re.search(r'\b(?:cgpa|gpa|percentage|marks|score)?\s*:?\s*(\d{1,2}\.\d{1,2}%?|\d{2}\.\d{2}%?)\b', l_str, re.IGNORECASE)
            if cgpa_match:
                cgpa_val = cgpa_match.group(1)
            elif "%" in l_str:
                pct_match = re.search(r'\b(\d{2}(?:\.\d{1,2})?%)\b', l_str)
                if pct_match:
                    cgpa_val = pct_match.group(1)
                    
            year_val = ""
            year_match = re.search(r'\b(20\d{2}|19\d{2})\b', l_str)
            if year_match:
                year_val = year_match.group(1)

            curr_edu = {
                "id": len(educations) + 1,
                "institution": l_str if is_inst else "Institution",
                "degree": l_str if is_degree else "Degree",
                "specialization": "",
                "year": year_val,
                "score": cgpa_val,
                "score_type": "Percentage" if "%" in cgpa_val else "CGPA",
                "cgpa_percentage": cgpa_val
            }
        elif curr_edu:
            if any(deg in l_str.lower() for deg in ["b.e", "m.tech", "b.tech", "m.sc", "b.sc", "bachelor", "master", "diploma", "pre-university", "s.s.l.c", "puc", "sslc"]):
                curr_edu["degree"] = l_str
            elif re.match(r'^\d{4}$', l_str) or DATE_REGEX.search(l_str):
                curr_edu["year"] = l_str
            elif "cgpa" in l_str.lower() or "grade" in l_str.lower() or "%" in l_str:
                curr_edu["score"] = l_str
                curr_edu["cgpa_percentage"] = l_str
            else:
                curr_edu["degree"] += f" {l_str}"

    if curr_edu:
        educations.append(curr_edu)

    return educations

def verify_extraction_coverage(source_text: str, structured_data: Dict[str, Any]) -> float:
    source_words = [w.lower() for w in re.findall(r'\b\w+\b', source_text) if not w.isdigit()]
    source_word_set = set(source_words)
    if not source_word_set:
        return 1.0
    def collect_words(val):
        words = []
        if isinstance(val, str):
            words.extend([w.lower() for w in re.findall(r'\b\w+\b', val) if not w.isdigit()])
        elif isinstance(val, list):
            for item in val:
                words.extend(collect_words(item))
        elif isinstance(val, dict):
            for k, v in val.items():
                words.extend(collect_words(v))
        return words
    structured_words = collect_words(structured_data)
    structured_word_set = set(structured_words)
    captured = source_word_set.intersection(structured_word_set)
    return len(captured) / len(source_word_set) if source_word_set else 1.0

def extract_structured_data(text: str) -> Dict[str, Any]:
    lines = normalize_text_lines(text)
    
    info = extract_personal_info(lines)

    sections: Dict[str, List[str]] = {k: [] for k in SECTION_TAXONOMY}
    custom_sections: Dict[str, List[str]] = {}
    current_sec = None

    for i, l in enumerate(lines):
        if not l.strip():
            continue
            
        is_preceded_by_empty = (i == 0) or (lines[i-1].strip() == "")
        sec_key = detect_section_header(l, is_preceded_by_empty)
        if sec_key and sec_key.startswith("custom_") and i < 3:
            sec_key = None
        
        if sec_key:
            current_sec = sec_key
            if current_sec.startswith("custom_") and current_sec not in custom_sections:
                custom_sections[current_sec] = []
            continue

        if current_sec:
            if current_sec.startswith("custom_"):
                custom_sections[current_sec].append(l)
            elif current_sec in sections:
                sections[current_sec].append(l)

    def untag(lines_list):
        return [re.sub(r'<[^>]+>', '', l).strip() for l in lines_list]

    summary_text = " ".join(untag(sections["summary"])).strip()
    objective_text = " ".join(untag(sections["objective"])).strip()

    if objective_text:
        clean_obj_lines = []
        for line_item in untag(sections["objective"]):
            l_item_lower = line_item.lower()
            if any(k in l_item_lower for k in ["programming languages:", "front end:", "database management", "operating systems", "<table", "<tr", "course |", "internship :-", "work experience"]):
                break
            clean_obj_lines.append(line_item)
        objective_text = " ".join(clean_obj_lines).strip()

    experiences = parse_experiences(sections["experience"])
    educations = parse_education(sections["education"])

    if not educations:
        table_lines = [l for l in lines if ("<TR" in l or (l.count("|") >= 2 and any(k in l.lower() for k in ["inst", "college", "university", "school", "course", "degree", "m.tech", "b.e", "b.tech", "puc", "sslc", "percentage", "year"])))]
        if table_lines:
            educations = parse_education(table_lines)

    projects = parse_projects(sections["projects"])

    if not experiences:
        exp_lines = [l for l in lines if any(k in l.lower() for k in ["senior software engineer", "assistant professor", "developer", "engineer", "manager"])]
        if exp_lines:
            experiences = parse_experiences(exp_lines)

    # Robust Skills Extraction
    skills_extracted = extract_skills_robust(text, untag(sections["technical_skills"]))
    flat_skills = skills_extracted["flat"]
    categorized_skills = skills_extracted["categorized"]

    # Certifications
    cert_lines = untag(sections["certifications"])
    if not cert_lines:
        cert_lines = [re.sub(r'<[^>]+>', '', l).strip() for l in lines if any(k in l.lower() for k in ["swayam", "gold medal", "coursera", "nptel", "udemy", "certified", "certification"])]

    certifications = []
    for line in cert_lines:
        line_clean = line.strip()
        if not line_clean or len(line_clean) < 5:
            continue
        org = ""
        name_str = line_clean
        for keyword in [" by ", " from ", " - ", " | "]:
            if keyword in line_clean:
                parts = line_clean.split(keyword, 1)
                name_str = parts[0].strip()
                org = parts[1].strip()
                break
        paren_match = re.search(r'\((.*?)\)', name_str)
        if paren_match and not org:
            org = paren_match.group(1).strip()
            name_str = re.sub(r'\(.*?\)', '', name_str).strip()
        certifications.append({
            "id": len(certifications)+1, 
            "name": name_str,
            "title": name_str,
            "provider": org,
            "organization": org, 
            "description": line_clean
        })

    # Internships (Dedicated)
    internships = parse_experiences(sections["internships"])
    if not internships:
        for i, l in enumerate(untag(sections["internships"])):
            if l.strip():
                internships.append({
                    "id": i + 1,
                    "organization": "Organization",
                    "company": "Organization",
                    "role": "Intern",
                    "description": l.strip()
                })

    # Publications (Dedicated)
    publications = []
    for i, p in enumerate(untag(sections["publications"])):
        if p.strip():
            publications.append({
                "id": i + 1,
                "title": p.strip(),
                "publication_type": "Publication",
                "authorship_type": "Author",
                "publisher": "",
                "year": ""
            })

    # Achievements (Dedicated)
    achievements = []
    for i, a in enumerate(untag(sections["achievements"])):
        if a.strip():
            achievements.append({
                "id": i + 1,
                "title": a.strip(),
                "description": a.strip()
            })

    # Leadership (Dedicated)
    leadership = []
    for i, lead in enumerate(untag(sections["leadership"])):
        if lead.strip():
            leadership.append({
                "id": i + 1,
                "organization": lead.strip(),
                "role": "Role / Member",
                "description": lead.strip()
            })

    soft_skills = [s.strip() for s in " ".join(untag(sections["soft_skills"])).split(",") if s.strip()]
    languages = [s.strip() for s in re.split(r'[,;]', " ".join(untag(sections["languages"]))) if s.strip()]
    hobbies = [s.strip() for s in re.split(r'[,;]', " ".join(untag(sections["hobbies"]))) if s.strip()]
    portfolio_links = [link.strip() for link in untag(sections["portfolio_links"]) if link.strip()]

    # Format custom sections & Personal details
    formatted_custom_sections = []
    personal_details_dict = {}
    
    for k, v in custom_sections.items():
        if v:
            title = k.replace("custom_", "").replace("_", " ").title()
            formatted_custom_sections.append({
                "title": title,
                "section_name": title,
                "content": untag(v)
            })

    if sections.get("personal_info"):
        personal_lines = untag(sections["personal_info"])
        for pline in personal_lines:
            if ":" in pline:
                parts = pline.split(":", 1)
                k_norm = parts[0].strip(' -*•:\t').lower().replace(" ", "_")
                if k_norm:
                    personal_details_dict[k_norm] = parts[1].strip()

    res = {
        "personal_info": {
            "name": info["name"],
            "full_name": info["name"],
            "email": info["email"],
            "phone": info["phone"],
            "address": info["address"],
            "location": info["location"],
            "linkedin": info["linkedin"],
            "github": info["github"],
            "portfolio": info["portfolio"],
            "website": info["portfolio"],
            "title": info["title"]
        },
        "summary": summary_text,
        "objective": objective_text,
        "education": educations,
        "experience": experiences,
        "work_experience": experiences,
        "internships": internships,
        "projects": projects,
        "skills": categorized_skills if categorized_skills else flat_skills,
        "technicalSkills": flat_skills,
        "technical_skills": flat_skills,
        "softSkills": soft_skills,
        "personal_skills": soft_skills,
        "certifications": certifications,
        "publications": publications,
        "achievements": achievements,
        "leadership_roles": leadership,
        "leadership": leadership,
        "languages": languages,
        "hobbies": hobbies,
        "personal_details": personal_details_dict,
        "portfolioLinks": portfolio_links,
        "volunteerExperience": [l.strip() for l in untag(sections.get("volunteer", [])) if l.strip()],
        "volunteer_experience": [l.strip() for l in untag(sections.get("volunteer", [])) if l.strip()],
        "references": [l.strip() for l in untag(sections.get("references", [])) if l.strip()],
        "additional_information": formatted_custom_sections,
        "custom_sections": formatted_custom_sections
    }
    
    coverage = verify_extraction_coverage(text, res)
    res["confidence_metadata"] = {
        "coverage_score": float(round(coverage, 2)),
        "low_coverage_warning": bool(coverage < 0.85)
    }
    return res


def calculate_section_confidence(data: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    """Calculates section confidence scores based on completeness of fields."""
    res = {}
    
    # Personal Info
    pi = data.get("personal_info") or data.get("personal_information") or {}
    pi_score = 100
    if not pi.get("name") or pi.get("name") == "Candidate Name":
        pi_score -= 30
    if not pi.get("email"):
        pi_score -= 30
    if not pi.get("phone"):
        pi_score -= 20
    if not pi.get("address") and not pi.get("location"):
        pi_score -= 20
    res["personal_info"] = {"score": max(0, pi_score)}
    
    # Summary
    summary = data.get("summary") or ""
    res["summary"] = {"score": 100 if len(summary.strip()) > 10 else 0}
    
    # Education
    edu = data.get("education") or []
    if not edu:
        res["education"] = {"score": 0}
    else:
        edu_scores = []
        for e in edu:
            s = 100
            if not e.get("institution"): s -= 40
            if not e.get("degree"): s -= 40
            edu_scores.append(max(0, s))
        res["education"] = {"score": int(sum(edu_scores) / len(edu_scores))}
        
    # Experience
    exp = data.get("experience") or data.get("work_experience") or []
    if not exp:
        res["experience"] = {"score": 0}
    else:
        exp_scores = []
        for ex in exp:
            s = 100
            if not ex.get("company"): s -= 40
            if not ex.get("position") and not ex.get("role"): s -= 40
            exp_scores.append(max(0, s))
        res["experience"] = {"score": int(sum(exp_scores) / len(exp_scores))}
        
    # Projects
    proj = data.get("projects") or []
    if not proj:
        res["projects"] = {"score": 0}
    else:
        proj_scores = []
        for p in proj:
            s = 100
            if not p.get("name") and not p.get("title"): s -= 50
            if not p.get("description"): s -= 50
            proj_scores.append(max(0, s))
        res["projects"] = {"score": int(sum(proj_scores) / len(proj_scores))}
        
    # Technical Skills
    skills = data.get("technicalSkills") or data.get("skills") or []
    if isinstance(skills, list):
        count = len(skills)
        if count >= 3:
            s_score = 100
        elif count > 0:
            s_score = count * 30
        else:
            s_score = 0
    else:
        s_score = 100 if skills else 0
    res["technicalSkills"] = {"score": s_score}
    
    return res
