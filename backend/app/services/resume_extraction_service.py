import re
import difflib
from typing import Dict, Any, List, Optional

from app.services.resume_pipeline.section_detector import (
    SECTION_TAXONOMY, ALL_SECTION_KEYWORDS, DATE_REGEX, SectionDetector
)
from app.services.resume_pipeline.parsers import (
    PersonalParser, EducationParser, ExperienceParser, SkillsParser,
    ProjectParser, CertificationParser, PublicationParser, AchievementParser,
    PersonalDetailsParser, AdditionalParser
)
from app.services.resume_pipeline.pipeline import clean_text_artifacts, despace_spaced_text
from app.services.resume_pipeline.parsers.skills_parser import COMMON_SKILLS_CATALOGUE as COMMON_SKILLS
from app.services.resume_pipeline.parsers.experience_parser import ACTION_VERBS, TITLE_KEYWORDS

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
    return PersonalParser.parse(lines[:15], lines)

def detect_section_header(line: str, is_preceded_by_empty: bool = False) -> Optional[str]:
    res = SectionDetector.detect_heading(line, is_preceded_by_empty=is_preceded_by_empty)
    if res:
        sec_key, _ = res
        return sec_key
    return None

def extract_skills_robust(text: str, skill_lines: List[str] = None) -> Dict[str, Any]:
    return SkillsParser.parse(skill_lines or [], full_text=text)

def parse_experiences(lines: List[str]) -> List[Dict[str, Any]]:
    return ExperienceParser.parse(lines)

def parse_projects(lines: List[str]) -> List[Dict[str, Any]]:
    return ProjectParser.parse(lines)

def parse_education(lines: List[str]) -> List[Dict[str, Any]]:
    return EducationParser.parse(lines)

def parse_certifications(lines: List[str]) -> List[Dict[str, Any]]:
    return CertificationParser.parse(lines)

def parse_publications(lines: List[str]) -> List[Dict[str, Any]]:
    return PublicationParser.parse(lines)

def parse_achievements(lines: List[str]) -> List[Dict[str, Any]]:
    return AchievementParser.parse(lines)

def parse_personal_details(lines: List[str]) -> Dict[str, Any]:
    return PersonalDetailsParser.parse(lines)

def verify_extraction_coverage(source_text: str, parsed_result: Dict[str, Any]) -> float:
    if not source_text or not source_text.strip():
        return 1.0
    source_words = set(re.findall(r'\b[A-Za-z0-9+#.-]{3,}\b', source_text.lower()))
    if not source_words:
        return 1.0
    structured_dump = str(parsed_result).lower()
    structured_words = set(re.findall(r'\b[A-Za-z0-9+#.-]{3,}\b', structured_dump))
    survived = source_words.intersection(structured_words)
    return float(round(len(survived) / len(source_words), 2))

def extract_structured_data(raw_text: str) -> Dict[str, Any]:
    """
    Generic heuristic extractor parsing text lines into the 16 standard section models
    with zero loss of custom or unclassified data.
    """
    text_clean = despace_spaced_text(clean_text_artifacts(raw_text))
    lines = [l.strip() for l in text_clean.split("\n") if l.strip()]

    # Filter out standalone page numbers
    filtered_lines = []
    for l in lines:
        if re.match(r'^(page\s+\d+(\s+of\s+\d+)?|\d+\s*/\s*\d+|\d+|---\s*page\s+\d+\s*---)$', l, re.IGNORECASE):
            continue
        filtered_lines.append(l)

    section_map = SectionDetector.partition_into_sections(filtered_lines)

    # 1. Contact & Personal Info
    header_lines = section_map.get("header", [])
    personal_info = PersonalParser.parse(header_lines, filtered_lines)

    # 2. Summary & Objective
    summary_lines = section_map.get("summary", [])
    summary_text = " ".join(summary_lines).strip()

    obj_lines = section_map.get("objective", [])
    obj_text = " ".join(obj_lines).strip()

    # 3. Education
    education = EducationParser.parse(section_map.get("education", []))

    # 4. Experience & Internships
    experience = ExperienceParser.parse(section_map.get("experience", []))
    internships = ExperienceParser.parse(section_map.get("internships", []))

    # 5. Skills
    skills_res = SkillsParser.parse(section_map.get("technical_skills", []), full_text=text_clean)
    soft_skills_res = SkillsParser.parse(section_map.get("soft_skills", []))

    # 6. Projects & Certifications
    projects = ProjectParser.parse(section_map.get("projects", []))
    certifications = CertificationParser.parse(section_map.get("certifications", []))

    # 7. Publications & Achievements
    publications = PublicationParser.parse(section_map.get("publications", []))
    achievements = AchievementParser.parse(section_map.get("achievements", []))

    # 8. Leadership, Languages, Hobbies
    leadership = ExperienceParser.parse(section_map.get("leadership", []))

    languages = []
    for l in section_map.get("languages", []):
        languages.extend([t.strip() for t in re.split(r'[,|;•\t]', l) if t.strip() and len(t.strip()) < 30])

    hobbies = []
    for h in section_map.get("hobbies", []):
        hobbies.extend([t.strip() for t in re.split(r'[,|;•\t]', h) if t.strip() and len(t.strip()) < 40])

    # 9. Personal Details
    personal_details_lines = section_map.get("personal_details", []) + header_lines
    personal_details = PersonalDetailsParser.parse(personal_details_lines)

    # 10. Custom & Additional Sections
    custom_raw = section_map.get("custom_sections", [])
    additional_sections = AdditionalParser.parse(custom_raw)

    result = {
        "personal_info": personal_info,
        "personal_information": personal_info,
        "contact_information": personal_info,
        "summary": summary_text,
        "professional_summary": summary_text,
        "objective": obj_text,
        "career_objective": obj_text,
        "education": education,
        "work_experience": experience,
        "experience": experience,
        "internships": internships,
        "skills": skills_res["categorized"] if skills_res["categorized"] else skills_res["flat"],
        "technicalSkills": skills_res["flat"],
        "technical_skills": skills_res["flat"],
        "softSkills": soft_skills_res["flat"],
        "soft_skills": soft_skills_res["flat"],
        "personal_skills": soft_skills_res["flat"],
        "projects": projects,
        "certifications": certifications,
        "publications": publications,
        "achievements": achievements,
        "leadership_roles": leadership,
        "leadership": leadership,
        "languages": list(dict.fromkeys(languages)),
        "hobbies": list(dict.fromkeys(hobbies)),
        "hobbies_interests": list(dict.fromkeys(hobbies)),
        "personal_details": personal_details,
        "additional_sections": additional_sections,
        "custom_sections": additional_sections,
        "additional_information": additional_sections,
        "portfolioLinks": personal_info.get("other_links", []),
        "volunteerExperience": [l.strip() for l in section_map.get("volunteer", []) if l.strip()],
        "volunteer_experience": [l.strip() for l in section_map.get("volunteer", []) if l.strip()],
        "references": [l.strip() for l in section_map.get("references", []) if l.strip()]
    }

    coverage = verify_extraction_coverage(raw_text, result)
    result["confidence_metadata"] = {
        "coverage_score": float(round(coverage, 2)),
        "low_coverage_warning": bool(coverage < 0.85)
    }

    return result

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
            if not e.get("institution") and not e.get("school") and not e.get("university"): s -= 40
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
            if not ex.get("company") and not ex.get("organization"): s -= 40
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
