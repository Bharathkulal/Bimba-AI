import re
import difflib
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

SECTION_TAXONOMY = {
    "summary": ["professional summary", "summary", "profile summary", "profile", "about me", "executive summary", "career profile", "about", "summary of qualifications", "summary of experience"],
    "objective": ["career objective", "objective", "career summary", "career goal", "objective & summary"],
    "experience": ["work experience", "professional experience", "experience", "employment history", "work history", "career history", "employment", "professional background"],
    "education": ["education", "academic background", "academic qualification", "educational qualification", "academics", "educational qualifications and trainings", "academic profile", "academic qualifications", "academic record"],
    "projects": ["projects and research", "academic & personal projects", "academic and personal projects", "projects", "personal projects", "key projects", "selected projects", "academic projects"],
    "technical_skills": ["technical skill set", "technical skills", "skills & technologies", "skills", "technologies", "core competencies", "technical proficiencies", "tech stack", "software skills", "key skills"],
    "soft_skills": ["personal skills", "soft skills", "interpersonal skills", "key strengths", "competencies", "strengths"],
    "certifications": ["certifications and online courses", "certifications & online courses", "certifications", "certificates", "courses", "training", "licenses & certifications", "credentials", "trainings & certifications"],
    "internships": ["internship", "internships", "internship experience", "industrial training"],
    "achievements": ["awards and achievements", "awards & achievements", "achievements", "awards", "honors & awards", "accomplishments"],
    "publications": ["publications & research papers", "publications and research papers", "publications", "research papers", "patents"],
    "languages": ["languages", "languages spoken"],
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
    # Replace literal \n embedded in single strings (if any) and normalize line breaks
    text_clean = text_clean.replace("\\n", "\n")
    raw_lines = [l.strip() for l in text_clean.split("\n")]
    lines = []
    for l in raw_lines:
        if not l:
            lines.append(l)
            continue
        # Strip lines matching page numbers or common page break templates
        if re.match(r'^(page\s+\d+(\s+of\s+\d+)?|\d+\s*/\s*\d+|\d+|---\s*page\s+\d+\s*---)$', l, re.IGNORECASE):
            continue
        lines.append(l)
    return lines

def extract_personal_info(lines: List[str]) -> Dict[str, Any]:
    text_clean = "\n".join(lines)
    
    # 1. robust regex for Emails
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text_clean)
    email = email_match.group(0) if email_match else ""

    # 2. robust regex for Phones (handles international and various separators)
    phone = ""
    for match in re.finditer(r'\+?[\d\s\-\(\)]{8,20}\d', text_clean):
        val = match.group(0).strip()
        digits = re.sub(r'\D', '', val)
        if len(digits) >= 7 and len(digits) <= 15:
            # Check it doesn't look like a year range
            if not any(yr in val for yr in ["2020", "2021", "2022", "2023", "2024", "2025", "2026"]):
                phone = val
                break
    # Fallback to the original regex if the above didn't find anything
    if not phone:
        phone_match = re.search(r'(\+?\d{1,4}[\s-]?)?\(?\d{2,5}\)?[\s-]?\d{3,5}[\s-]?\d{3,5}', text_clean)
        phone = phone_match.group(0).strip() if phone_match and len(re.sub(r'\D', '', phone_match.group(0))) >= 7 else ""

    # 3. robust regex for Links
    linkedin_match = re.search(r'(linkedin\.com/in/[\w-]+)', text_clean, re.IGNORECASE)
    linkedin = linkedin_match.group(0) if linkedin_match else ""

    github_match = re.search(r'(github\.com/[\w-]+)', text_clean, re.IGNORECASE)
    github = github_match.group(0) if github_match else ""

    portfolio_match = re.search(r'\b(https?://[^\s]+|[\w-]+\.(?:com|io|dev|me|site))\b', text_clean, re.IGNORECASE)
    portfolio = ""
    if portfolio_match and "github" not in portfolio_match.group(0) and "linkedin" not in portfolio_match.group(0) and "@" not in portfolio_match.group(0):
        portfolio = portfolio_match.group(0)

    # Location heuristic
    location = ""
    loc_match = re.search(r'(Bangalore|Mumbai|Delhi|Chennai|Pune|Mangalore|Brahmavar|Udupi|Hyderabad|New York|San Francisco|London|Seattle|Austin|Boston|California|Texas|Ontario|Toronto)', text_clean, re.IGNORECASE)
    if loc_match:
        location = loc_match.group(0)

    # 4. Infer Name from top lines without labels
    name = "Candidate Name"
    title = ""
    for l in lines[:10]:
        l_lower = l.lower()
        l_no_tags = re.sub(r'<[^>]+>', '', l).strip()
        
        # Skip if it's contact info or has common labels
        if (email and email in l) or (phone and phone in l) or "github.com" in l_lower or "linkedin.com" in l_lower or "@" in l:
            continue
            
        if any(kw in l_lower for kw in TITLE_KEYWORDS) and len(l_no_tags) < 60:
            if not title:
                title = l_no_tags
            continue
            
        # Stop inferring name if we hit a section header
        if any(sec_kw in l_lower for kws in SECTION_TAXONOMY.values() for sec_kw in kws):
            break

        # A good candidate for name is a short string, no numbers
        if len(l_no_tags) > 2 and len(l_no_tags) < 35 and not any(ch.isdigit() for ch in l_no_tags) and name == "Candidate Name":
            name = l_no_tags

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

def detect_section_header(line: str, is_preceded_by_empty: bool = False) -> str:
    """Detects if a line is a section header based on fuzzy matching and visual cues."""
    if any(tag in line for tag in ["<TABLE>", "</TABLE>", "<TR>", "<TR-HEADER>"]):
        return None
    l_no_tags = re.sub(r'<[^>]+>', '', line).strip().lower()
    if len(l_no_tags) > 40 or not l_no_tags: # Headers are usually short
        return None
        
    # Check if it has a visual cue from the extractor
    has_cue = "<H>" in line
    
    # Fuzzy match with section taxonomy
    best_match = None
    highest_ratio = 0.8  # Threshold for fuzzy match
    
    for sec_key, kw_list in SECTION_TAXONOMY.items():
        for kw in kw_list:
            if l_no_tags == kw or l_no_tags.startswith(kw + " ") or l_no_tags.endswith(" " + kw):
                return sec_key
            if kw in l_no_tags and len(l_no_tags) - len(kw) < 10:
                return sec_key
            # Fuzzy match
            ratio = difflib.SequenceMatcher(None, l_no_tags, kw).ratio()
            if ratio > highest_ratio:
                highest_ratio = ratio
                best_match = sec_key
                
    if best_match:
        return best_match
        
    is_caps_or_title = l_no_tags.istitle() or l_no_tags.isupper() or line.strip().istitle() or line.strip().isupper()
    no_date = not DATE_REGEX.search(line)
    short_len = 3 < len(l_no_tags) < 30
    no_punctuation = not any(p in l_no_tags for p in ['.', ',', '-', '!', ':', '|', '(', ')'])
    
    if has_cue or (is_caps_or_title and short_len and no_date and no_punctuation and is_preceded_by_empty):
        # It's marked as a header, but doesn't match known sections -> custom section
        return f"custom_{l_no_tags.replace(' ', '_')}"
        
    return None

def extract_skills(text: str) -> List[str]:
    found_skills = []
    text_clean = despace_spaced_text(clean_text_artifacts(re.sub(r'<[^>]+>', '', text)))
    for skill in COMMON_SKILLS:
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_clean, re.IGNORECASE):
            found_skills.append(skill)
    return found_skills

def parse_experiences(lines: List[str]) -> List[Dict[str, Any]]:
    experiences = []
    curr_exp = None
    
    for line in lines:
        # Handle Table parsing generically
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
                    "company": parts[1] if len(parts) > 1 else "",
                    "duration": parts[2] if len(parts) > 2 else "",
                    "location": parts[3] if len(parts) > 3 else "",
                    "description": " ".join(parts[4:]) if len(parts) > 4 else ""
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
            if date_match:
                dur = date_match.group(0)
                desc_part = comp[date_match.end():].strip(' -,|()')
                comp = comp[:date_match.start()].strip(' -,|()')
                if desc_part:
                    description = desc_part
            else:
                date_match_pos = DATE_REGEX.search(pos)
                if date_match_pos:
                    dur = date_match_pos.group(0)
                    desc_part = pos[date_match_pos.end():].strip(' -,|()')
                    pos = pos[:date_match_pos.start()].strip(' -,|()')
                    if desc_part:
                        description = desc_part

            curr_exp = {
                "id": len(experiences) + 1,
                "position": pos,
                "company": comp,
                "duration": dur,
                "location": "",
                "description": description
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
    projects = []
    curr_proj = None
    duration_regex = re.compile(r'\b\d+\s*(months?|years?|weeks?)\b', re.IGNORECASE)

    for line in lines:
        if "<TR-HEADER>" in line or "<TABLE>" in line or "</TABLE>" in line:
            continue
        
        l_str = re.sub(r'<[^>]+>', '', line).strip()
        if not l_str:
            continue
            
        if "<TR>" in line:
            parts = [p.strip() for p in l_str.split("|")]
            if len(parts) >= 2:
                if curr_proj: projects.append(curr_proj)
                curr_proj = {
                    "id": len(projects) + 1,
                    "title": parts[0],
                    "tech_stack": parts[1] if len(parts) > 1 else "",
                    "duration": parts[2] if len(parts) > 2 else "",
                    "description": " ".join(parts[3:]) if len(parts) > 3 else ""
                }
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
                "tech_stack": tech,
                "duration": "",
                "description": description
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
    educations = []
    curr_edu = None
    col_map = {"inst": 0, "deg": 1, "yr": 2, "cgpa": 3}  # Defaults

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
                
                # Check if yr and cgpa are swapped (if we mapped defaults and actual content looks swapped)
                if col_map["yr"] == 2 and col_map["cgpa"] == 3 and ("%" in yr or "cgpa" in yr.lower()):
                    cgpa, yr = yr, cgpa
                    
                curr_edu = {
                    "id": len(educations) + 1,
                    "institution": inst,
                    "degree": deg,
                    "year": yr,
                    "cgpa_percentage": cgpa
                }
            continue

        if any(kw in l_str.lower() for kw in ["institute", "college", "university", "school", "academy"]):
            if curr_edu:
                educations.append(curr_edu)
            curr_edu = {
                "id": len(educations) + 1,
                "institution": l_str,
                "degree": "Degree",
                "year": "",
                "cgpa_percentage": ""
            }
        elif curr_edu:
            if any(deg in l_str.lower() for deg in ["b.e", "m.tech", "b.tech", "m.sc", "b.sc", "bachelor", "master", "diploma", "pre-university", "s.s.l.c"]):
                curr_edu["degree"] = l_str
            elif re.match(r'^\d{4}$', l_str) or DATE_REGEX.search(l_str):
                curr_edu["year"] = l_str
            elif "cgpa" in l_str.lower() or "grade" in l_str.lower() or "%" in l_str:
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
    skills_all = extract_skills(text)

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

    # Dev-only debug logs: show mapped text blocks to sections
    print("\n========== DEV DEBUG: SECTION MAPPING ==========")
    for sec_name, sec_lines in sections.items():
        if sec_lines:
            print(f"Section '{sec_name}': mapped {len(sec_lines)} lines.")
            print("  Preview: " + " | ".join(sec_lines[:3]) + ("..." if len(sec_lines) > 3 else ""))
    for cust_name, cust_lines in custom_sections.items():
        if cust_lines:
            print(f"Custom Section '{cust_name}': mapped {len(cust_lines)} lines.")
            print("  Preview: " + " | ".join(cust_lines[:3]) + ("..." if len(cust_lines) > 3 else ""))
    print("================================================\n")

    # Clean text from visual tags before assignment
    def untag(lines_list):
        return [re.sub(r'<[^>]+>', '', l).strip() for l in lines_list]

    summary_text = " ".join(untag(sections["summary"])).strip()
    objective_text = " ".join(untag(sections["objective"])).strip()

    experiences = parse_experiences(sections["experience"])
    educations = parse_education(sections["education"])
    projects = parse_projects(sections["projects"])

    # Skills merge
    for line in untag(sections["technical_skills"]):
        items = re.split(r'[,|;•]', line)
        for item in items:
            item_clean = item.strip()
            if item_clean and len(item_clean) < 30 and item_clean not in skills_all:
                skills_all.append(item_clean)

    # Certifications
    cert_lines = untag(sections["certifications"])
    certifications = []
    for line in cert_lines:
        line_clean = line.strip()
        if not line_clean:
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
            "organization": org,
            "description": line_clean
        })

    soft_skills = [s.strip() for s in " ".join(untag(sections["soft_skills"])).split(",") if s.strip()]
    languages = [s.strip() for s in re.split(r'[,;]', " ".join(untag(sections["languages"]))) if s.strip()]
    hobbies = [s.strip() for s in re.split(r'[,;]', " ".join(untag(sections["hobbies"]))) if s.strip()]
    achievements = [a.strip() for a in untag(sections["achievements"]) if a.strip()]
    publications = [{"id": i+1, "title": p.strip(), "publisher": "", "year": ""} for i, p in enumerate(untag(sections["publications"])) if p.strip()]
    references = [{"id": i+1, "name": r.strip(), "title": "", "company": ""} for i, r in enumerate(untag(sections["references"])) if r.strip()]
    volunteer = [{"id": i+1, "organization": v.strip(), "role": "Volunteer", "duration": ""} for i, v in enumerate(untag(sections["volunteer"]))]
    portfolio_links = [link.strip() for link in untag(sections["portfolio_links"]) if link.strip()]

    # Format custom sections properly
    formatted_custom_sections = []
    for k, v in custom_sections.items():
        if v:
            title = k.replace("custom_", "").replace("_", " ").title()
            formatted_custom_sections.append({
                "section_name": title,
                "content": untag(v)
            })

    # If there is content in personal_info (like DOB, Gender, Nationality), format as a custom section "Personal Details"
    if sections.get("personal_info"):
        formatted_custom_sections.append({
            "section_name": "Personal Details",
            "content": untag(sections["personal_info"])
        })

    res = {
        "personal_info": {
            "name": info["name"],
            "email": info["email"],
            "phone": info["phone"],
            "address": info["location"],
            "linkedin": info["linkedin"],
            "github": info["github"],
            "portfolio": info["portfolio"],
            "title": info["title"]
        },
        "summary": summary_text,
        "objective": objective_text,
        "education": educations,
        "experience": experiences,
        "projects": projects,
        "technicalSkills": skills_all,
        "softSkills": soft_skills,
        "certifications": certifications,
        "internships": [{"id": i+1, "company": "Company", "role": "Intern", "description": l} for i, l in enumerate(untag(sections["internships"]))],
        "achievements": achievements,
        "languages": languages,
        "portfolioLinks": portfolio_links,
        "publications": publications,
        "volunteerExperience": volunteer,
        "references": references,
        "hobbies": hobbies,
        "custom_sections": formatted_custom_sections
    }
    
    coverage = verify_extraction_coverage(text, res)
    res["confidence_metadata"] = calculate_section_confidence(res)
    res["confidence_metadata"]["coverage_score"] = float(round(coverage, 2))
    res["confidence_metadata"]["low_coverage_warning"] = bool(coverage < 0.85)
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
    for list_key in ["certifications", "languages", "achievements", "publications", "volunteerExperience", "references", "hobbies", "portfolioLinks", "internships", "custom_sections"]:
        items = data.get(list_key, [])
        score = 100 if items else 80
        confidence[list_key] = {"score": score, "parser": "Heuristic+AI", "page": 1}
        
    return confidence
