import re
import difflib
from typing import Dict, Any, List, Tuple, Optional

SECTION_TAXONOMY: Dict[str, List[str]] = {
    "summary": [
        "professional summary", "summary", "profile summary", "profile", "about me",
        "executive summary", "career profile", "about", "summary of qualifications",
        "summary of experience", "personal statement", "professional overview", "overview", "bio"
    ],
    "objective": [
        "career objective", "objective", "career summary", "career goal", "objective & summary",
        "professional objective", "target role"
    ],
    "experience": [
        "work experience", "professional experience", "experience", "employment history",
        "work history", "career history", "employment", "professional background",
        "relevant experience", "work background", "industry experience", "practical experience",
        "career odyssey", "career milestones", "career path", "professional journey"
    ],
    "education": [
        "education", "academic background", "academic qualification", "educational qualification",
        "academics", "educational qualifications and trainings", "academic profile",
        "academic qualifications", "academic record", "educational background", "degrees",
        "education and training", "academic history", "schooling", "academic odyssey"
    ],
    "projects": [
        "academic & personal projects", "academic and personal projects", "projects",
        "personal projects", "key projects", "selected projects", "academic projects",
        "technical projects", "capstone projects", "project work", "portfolio projects",
        "major projects", "mini projects"
    ],
    "technical_skills": [
        "technical skill set", "technical skills", "skills & technologies", "skills",
        "technologies", "core competencies", "technical proficiencies", "tech stack",
        "software skills", "key skills", "programming skills", "tools & technologies",
        "technical expertise", "skills & tools", "competencies", "areas of expertise",
        "technical toolbox", "toolbox", "technologies & tools", "tools"
    ],
    "soft_skills": [
        "personal skills", "soft skills", "interpersonal skills", "key strengths",
        "strengths", "behavioral competencies", "professional attributes"
    ],
    "certifications": [
        "certifications and online courses", "certifications & online courses",
        "certifications", "certificates", "courses", "training", "licenses & certifications",
        "credentials", "trainings & certifications", "online courses", "accreditations",
        "professional certifications", "workshops & certifications"
    ],
    "internships": [
        "internship", "internships", "internship experience", "industrial training",
        "research internship", "summer internship", "vocational training", "industry training"
    ],
    "achievements": [
        "awards and achievements", "awards & achievements", "achievements", "awards",
        "honors & awards", "accomplishments", "co-curricular activities",
        "extra-curricular achievements", "honors", "key accomplishments", "recognitions"
    ],
    "leadership": [
        "leadership", "leadership & responsibilities", "positions of responsibility",
        "responsibilities", "leadership roles", "extra-curricular responsibilities",
        "positions held", "administrative roles"
    ],
    "publications": [
        "publications & research papers", "publications and research papers", "publications",
        "research papers", "patents", "research articles", "articles", "research publications",
        "conference papers", "journal publications", "scholarly work"
    ],
    "languages": [
        "languages", "languages spoken", "languages known", "language proficiencies", "spoken languages"
    ],
    "hobbies": [
        "hobbies & interests", "hobbies and interests", "hobbies", "interests",
        "personal interests", "activities & interests", "leisure activities", "passions"
    ],
    "portfolio_links": [
        "links", "urls", "portfolio links", "social links", "profiles", "online presence"
    ],
    "volunteer": [
        "volunteer experience", "volunteer work", "community service", "volunteering",
        "social service", "community involvement"
    ],
    "references": [
        "references", "referees", "recommendations"
    ],
    "personal_details": [
        "personal details", "personal information", "personal profile", "additional personal details",
        "personal bio", "demographics"
    ]
}

# Compile sorted list of keywords for fast fuzzy & longest prefix matching
ALL_SECTION_KEYWORDS: List[Tuple[int, str, str]] = []
for sec_key, kw_list in SECTION_TAXONOMY.items():
    for kw in kw_list:
        ALL_SECTION_KEYWORDS.append((len(kw), kw, sec_key))
ALL_SECTION_KEYWORDS.sort(key=lambda x: x[0], reverse=True)

DATE_REGEX = re.compile(
    r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|'
    r'January|February|March|April|June|July|August|September|October|November|December|\d{4})\b'
    r'.*?(Present|Current|\d{4})?', re.IGNORECASE
)


class SectionDetector:
    """
    Phase 5 & Phase 8 — Section Detection & Zero Data Loss.
    Detects standard and custom section headings using typography, keywords, and heuristics.
    """

    @staticmethod
    def detect_heading(line: str, is_preceded_by_empty: bool = False) -> Optional[Tuple[str, str]]:
        """
        Returns (section_canonical_key, original_heading_title) if line is a heading, else None.
        If unrecognized heading, returns ("custom_section", original_heading_title).
        """
        if not line or not line.strip():
            return None

        # Ignore table rows
        if any(tag in line for tag in ["<TABLE>", "</TABLE>", "<TR>", "<TR-HEADER>"]):
            return None

        clean_line = re.sub(r'<[^>]+>', '', line).strip()
        l_lower = clean_line.lower().strip(': -—–#*')

        # Heading length constraints (headings rarely exceed 50 characters)
        if len(l_lower) < 2 or len(l_lower) > 55:
            return None

        has_cue = "<H>" in line or "</H>" in line

        # 1. Exact match pass
        for sec_key, kw_list in SECTION_TAXONOMY.items():
            for kw in kw_list:
                if l_lower == kw:
                    return (sec_key, clean_line)

        # 2. Longest prefix/suffix matching
        for _, kw, sec_key in ALL_SECTION_KEYWORDS:
            if l_lower.startswith(kw + " ") or l_lower.endswith(" " + kw):
                return (sec_key, clean_line)
            if kw in l_lower and len(l_lower) - len(kw) <= 6:
                return (sec_key, clean_line)

        # 3. Fuzzy similarity matching
        for _, kw, sec_key in ALL_SECTION_KEYWORDS:
            ratio = difflib.SequenceMatcher(None, l_lower, kw).ratio()
            if ratio >= 0.85:
                return (sec_key, clean_line)

        # 4. Custom Section Detection (e.g. "Workshops", "Research Experience", "Patents", "Key Milestones")
        is_all_caps = clean_line.isupper() and len(clean_line.split()) <= 4
        is_title_case = clean_line.istitle() and len(clean_line.split()) <= 4
        no_dates = not bool(DATE_REGEX.search(clean_line))
        no_punctuation = not any(p in clean_line for p in ['.', ',', ';', '(', ')', '/', '\\', '@', 'http'])
        is_short = 3 <= len(clean_line) <= 40

        if has_cue or ((is_all_caps or is_title_case) and no_dates and no_punctuation and is_short and (is_preceded_by_empty or is_all_caps)):
            # Avoid detecting candidate name as custom section if it's the first line
            non_section_words = ["resume", "curriculum vitae", "cv", "page", "phone", "email", "address"]
            if not any(w in l_lower for w in non_section_words):
                return ("custom_section", clean_line)

        return None

    @staticmethod
    def partition_into_sections(lines: List[str]) -> Dict[str, Any]:
        """
        Splits a list of normalized lines into section buckets.
        Returns dictionary of section_key -> list of content lines / structures.
        """
        sections: Dict[str, List[str]] = {
            "header": [],
            "summary": [],
            "objective": [],
            "experience": [],
            "education": [],
            "technical_skills": [],
            "soft_skills": [],
            "projects": [],
            "certifications": [],
            "internships": [],
            "achievements": [],
            "leadership": [],
            "publications": [],
            "languages": [],
            "hobbies": [],
            "portfolio_links": [],
            "volunteer": [],
            "references": [],
            "personal_details": [],
            "custom_sections": []  # List of {"heading": str, "content": List[str]}
        }

        current_sec = "header"
        current_custom_heading = None
        custom_chunk: List[str] = []

        for i, line in enumerate(lines):
            l_strip = line.strip()
            if not l_strip:
                continue

            prev_empty = (i > 0 and not lines[i-1].strip())
            heading_info = SectionDetector.detect_heading(line, is_preceded_by_empty=prev_empty)

            if heading_info:
                sec_type, heading_title = heading_info

                # If we were in a custom section, save its collected lines
                if current_sec == "custom_section" and current_custom_heading and custom_chunk:
                    sections["custom_sections"].append({
                        "heading": current_custom_heading,
                        "content": custom_chunk
                    })
                    custom_chunk = []

                if sec_type == "custom_section":
                    current_sec = "custom_section"
                    current_custom_heading = heading_title
                else:
                    current_sec = sec_type
                    current_custom_heading = None
            else:
                if current_sec == "custom_section":
                    custom_chunk.append(line)
                elif current_sec in sections:
                    sections[current_sec].append(line)
                else:
                    sections["header"].append(line)

        # Flush trailing custom chunk
        if current_sec == "custom_section" and current_custom_heading and custom_chunk:
            sections["custom_sections"].append({
                "heading": current_custom_heading,
                "content": custom_chunk
            })

        return sections
