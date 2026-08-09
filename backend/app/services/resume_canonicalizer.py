from typing import Any, Dict, List
import logging

logger = logging.getLogger("bimba_ai_pipeline")


def is_education_like(item: Dict[str, Any]) -> bool:
    if not isinstance(item, dict):
        return False
    keys = set(k.lower() for k in item.keys())
    # education usually has institution or degree or passing_year/cgpa
    return bool(keys & {"institution", "degree", "field_of_study", "passing_year", "year", "cgpa", "cgpa_percentage"})


def is_certification_like(item: Dict[str, Any]) -> bool:
    if not isinstance(item, dict):
        return False
    keys = set(k.lower() for k in item.keys())
    # certifications usually have name + organization/issuer or issue_date
    return bool(("name" in keys and ("organization" in keys or "issuer" in keys or "issue_date" in keys)))


def canonicalize_parsed_data(parsed: Dict[str, Any]) -> Dict[str, Any]:
    """Return a canonicalized copy of parsed resume data.

    Rules:
    - Use canonical keys: education, experience, projects, certifications, skills, technicalSkills, achievements, etc.
    - Treat `certificates` as a synonym for `certifications` but do not mix unrelated sections.
    - If items appear in the wrong section (education-like in certifications), move them to the correct canonical section.
    - Ambiguous items are preserved in `unclassified_content` instead of being dropped.
    - Preserve `raw_extraction` and `original_parsed_data`.
    """
    if not isinstance(parsed, dict):
        return parsed

    out = {}
    # copy obvious scalar fields
    for k in [
        "personal_info", "summary", "objective", "raw_extraction", "original_parsed_data", "extraction_version"
    ]:
        if k in parsed:
            out[k] = parsed[k]

    # canonical lists
    def get_list(k, alt=None):
        v = parsed.get(k)
        if v:
            return list(v)
        if alt and parsed.get(alt):
            return list(parsed.get(alt))
        return []

    education = get_list("education")
    experience = get_list("experience")
    projects = get_list("projects")
    skills = get_list("skills") or get_list("technicalSkills")
    certifications = get_list("certifications", alt="certificates")
    achievements = get_list("achievements")

    unclassified: List[Any] = list(parsed.get("unclassified_content") or [])

    # Move obviously misclassified items
    # Certifications that look like education -> move
    certs_to_keep = []
    for item in certifications:
        if is_education_like(item):
            logger.warning("Canonicalizer: moving item from certifications->education due to education-like fields")
            education.append(item)
        else:
            certs_to_keep.append(item)
    certifications = certs_to_keep

    # Education that look like certifications -> move
    edu_to_keep = []
    for item in education:
        if is_certification_like(item):
            logger.warning("Canonicalizer: moving item from education->certifications due to certification-like fields")
            certifications.append(item)
        else:
            edu_to_keep.append(item)
    education = edu_to_keep

    # Experience vs projects ambiguous items: if item has company -> experience; if has technologies/tech_stack -> project
    proj_to_keep = []
    exp_to_keep = []
    for item in projects:
        if isinstance(item, dict) and ("company" in item or "position" in item):
            logger.warning("Canonicalizer: moving item from projects->experience due to company/position fields")
            experience.append(item)
        else:
            proj_to_keep.append(item)
    projects = proj_to_keep

    for item in experience:
        if isinstance(item, dict) and ("title" in item or "tech_stack" in item or "technologies" in item):
            logger.warning("Canonicalizer: moving item from experience->projects due to project-like fields")
            projects.append(item)
        else:
            exp_to_keep.append(item)
    experience = exp_to_keep

    # Any remaining non-dict or unrecognized items should be preserved in unclassified
    def cleanup_list(lst):
        cleaned = []
        for it in lst:
            if isinstance(it, dict):
                cleaned.append(it)
            else:
                unclassified.append(it)
        return cleaned

    education = cleanup_list(education)
    experience = cleanup_list(experience)
    projects = cleanup_list(projects)
    skills = cleanup_list(skills)
    certifications = cleanup_list(certifications)
    achievements = cleanup_list(achievements)

    out["education"] = education
    out["experience"] = experience
    out["projects"] = projects
    out["skills"] = skills
    out["certifications"] = certifications
    out["achievements"] = achievements
    out["unclassified_content"] = unclassified

    # preserve any other sections that are lists but not canonicalized
    for k, v in parsed.items():
        if k in out or k in ["personal_info", "summary", "objective", "raw_extraction", "original_parsed_data", "extraction_version"]:
            continue
        out[k] = v

    return out
