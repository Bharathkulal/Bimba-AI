from typing import Any, Dict, List
import logging

logger = logging.getLogger("bimba_ai_pipeline")


def canonicalize_parsed_data(parsed: Dict[str, Any]) -> Dict[str, Any]:
    """
    Return a canonicalized copy of parsed resume data without destructive section swapping.

    Rules:
    - Use canonical keys: personal_info, summary, objective, education, experience, work_experience,
      internships, projects, skills, technicalSkills, softSkills, certifications, publications,
      achievements, leadership_roles, hobbies, personal_details, additional_information.
    - Preserve all original extracted content without dropping items.
    - Respect section boundaries: never move work experience into projects or internships into experience.
    - Ambiguous or unrecognized items are preserved in additional_information / unclassified_content.
    - Preserve raw_extraction, original_parsed_data, and extraction_version.
    """
    if not isinstance(parsed, dict):
        return {}

    out: Dict[str, Any] = {}

    # 1. Obvious scalar fields
    for k in [
        "personal_info", "personal_information", "contact_information",
        "summary", "objective", "career_objective", "professional_summary",
        "raw_extraction", "raw_extracted_text", "original_parsed_data",
        "extraction_version", "validation"
    ]:
        if k in parsed and parsed[k] is not None:
            out[k] = parsed[k]

    # 2. Canonical list extractor
    def get_list(k: str, alt: str = None) -> List[Any]:
        v = parsed.get(k)
        if isinstance(v, list) and v:
            return list(v)
        if alt:
            alt_v = parsed.get(alt)
            if isinstance(alt_v, list) and alt_v:
                return list(alt_v)
        if isinstance(v, (str, dict)) and v:
            return [v]
        return []

    out["education"] = get_list("education")
    out["work_experience"] = get_list("work_experience", alt="experience")
    out["experience"] = out["work_experience"]
    out["internships"] = get_list("internships", alt="internship")
    out["projects"] = get_list("projects")
    out["skills"] = parsed.get("skills") or get_list("technicalSkills", alt="technical_skills")
    out["technicalSkills"] = get_list("technicalSkills", alt="technical_skills")
    out["softSkills"] = get_list("softSkills", alt="soft_skills")
    out["certifications"] = get_list("certifications", alt="certificates")
    out["publications"] = get_list("publications", alt="research_papers")
    out["achievements"] = get_list("achievements", alt="awards")
    out["leadership_roles"] = get_list("leadership_roles", alt="leadership")
    out["leadership"] = out["leadership_roles"]
    out["hobbies"] = get_list("hobbies", alt="hobbies_interests")
    out["languages"] = get_list("languages")
    out["portfolioLinks"] = get_list("portfolioLinks", alt="portfolio_links")
    out["volunteerExperience"] = get_list("volunteerExperience", alt="volunteer_experience")
    out["references"] = get_list("references")
    out["personal_details"] = parsed.get("personal_details") if isinstance(parsed.get("personal_details"), dict) else {}

    # 3. Additional sections / unclassified content
    unclassified: List[Any] = list(parsed.get("unclassified_content") or [])
    add_info = get_list("additional_information", alt="custom_sections")
    if unclassified:
        add_info.extend([{"title": "Unclassified Content", "content": unclassified}])
    out["additional_information"] = add_info
    out["custom_sections"] = add_info
    out["unclassified_content"] = unclassified

    # 4. Copy any remaining non-canonical keys into additional_information
    known_keys = set(out.keys()) | {
        "personalInfo", "skillsInfo", "extra_curricular", "activities",
        "technical_skills", "soft_skills", "hobbies_interests", "portfolio_links",
        "volunteer_experience"
    }
    for k, v in parsed.items():
        if k not in known_keys and v:
            out["additional_information"].append({
                "title": k.replace("_", " ").title(),
                "section_name": k.replace("_", " ").title(),
                "content": v
            })

    return out
