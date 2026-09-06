import re
from typing import Dict, Any, List, Optional, Union

class ZeroLossEngine:
    @staticmethod
    def normalize_to_internal_model(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Converts any parsed resume JSON into the required internal data model with zero information loss.
        """
        if not isinstance(data, dict):
            data = {}

        # 1. Personal & Contact Info
        pi = data.get("personal_info") or data.get("personal_information") or {}
        if not isinstance(pi, dict):
            pi = {}

        name_val = pi.get("name") or pi.get("full_name") or data.get("name") or "Candidate Name"
        addr_val = pi.get("address") or pi.get("location") or data.get("address") or ""
        loc_val = pi.get("location") or pi.get("address") or data.get("location") or addr_val
        email_val = pi.get("email") or data.get("email") or ""
        phone_val = pi.get("phone") or data.get("phone") or ""
        linkedin_val = pi.get("linkedin") or data.get("linkedin") or ""
        github_val = pi.get("github") or data.get("github") or ""
        portfolio_val = pi.get("portfolio") or pi.get("website") or data.get("portfolio") or ""
        title_val = pi.get("title") or data.get("title") or data.get("target_role") or ""

        personal_info = {
            "name": name_val,
            "full_name": name_val,
            "date_of_birth": pi.get("date_of_birth") or "",
            "gender": pi.get("gender") or "",
            "nationality": pi.get("nationality") or "",
            "mother_tongue": pi.get("mother_tongue") or ""
        }

        contact_info = {
            "email": email_val,
            "phone": phone_val,
            "address": addr_val,
            "location": loc_val,
            "linkedin": linkedin_val,
            "github": github_val,
            "portfolio": portfolio_val,
            "other_links": pi.get("other_links", []) if isinstance(pi.get("other_links"), list) else []
        }

        # 2. Skills Processing (Preserving Categories & Raw Lists)
        raw_skills = data.get("skills")
        tech_skills_raw = data.get("technicalSkills") or data.get("technical_skills") or []
        soft_skills_raw = data.get("softSkills") or data.get("soft_skills") or data.get("personal_skills") or []
        tools_raw = data.get("tools") or []

        all_flat_skills: List[str] = []
        skills_model: Dict[str, List[str]] = {
            "programming_languages": [],
            "frontend": [],
            "backend": [],
            "databases": [],
            "frameworks": [],
            "tools": list(tools_raw) if isinstance(tools_raw, list) else [],
            "cloud": [],
            "machine_learning": [],
            "other": []
        }
        skill_categories_list: List[Dict[str, Any]] = []

        if isinstance(raw_skills, list):
            for item in raw_skills:
                if isinstance(item, dict) and ("category" in item or "skills" in item):
                    cat_name = str(item.get("category", "General")).strip()
                    c_skills = item.get("skills", [])
                    if isinstance(c_skills, str):
                        c_skills = [s.strip() for s in re.split(r'[,|;]', c_skills) if s.strip()]
                    elif isinstance(c_skills, list):
                        c_skills = [str(s).strip() for s in c_skills if str(s).strip()]
                    skill_categories_list.append({"category": cat_name, "skills": c_skills})
                    all_flat_skills.extend(c_skills)
                elif isinstance(item, str) and item.strip():
                    all_flat_skills.append(item.strip())
                elif isinstance(item, dict):
                    for k, v in item.items():
                        if isinstance(v, list):
                            flat_v = [str(x).strip() for x in v if str(x).strip()]
                            skill_categories_list.append({"category": k, "skills": flat_v})
                            all_flat_skills.extend(flat_v)
                        elif isinstance(v, str) and v.strip():
                            all_flat_skills.append(v.strip())
        elif isinstance(raw_skills, dict):
            for k, v in raw_skills.items():
                if isinstance(v, list):
                    flat_v = [str(x).strip() for x in v if str(x).strip()]
                    skills_model[k] = flat_v
                    skill_categories_list.append({"category": k.replace("_", " ").title(), "skills": flat_v})
                    all_flat_skills.extend(flat_v)
                elif isinstance(v, str) and v.strip():
                    parts = [s.strip() for s in re.split(r'[,|;]', v) if s.strip()]
                    skills_model[k] = parts
                    skill_categories_list.append({"category": k.replace("_", " ").title(), "skills": parts})
                    all_flat_skills.extend(parts)

        if isinstance(tech_skills_raw, list):
            for s in tech_skills_raw:
                s_str = str(s).strip()
                if s_str and s_str not in all_flat_skills:
                    all_flat_skills.append(s_str)

        # 3. Clean list helper
        def get_clean_list(key: str) -> List[Any]:
            val = data.get(key) or []
            return list(val) if isinstance(val, list) else []

        work_exp = get_clean_list("work_experience") or get_clean_list("experience")
        internships = get_clean_list("internships")
        education = get_clean_list("education")
        projects = get_clean_list("projects")
        certifications = get_clean_list("certifications") or get_clean_list("certificates")
        publications = get_clean_list("publications") or get_clean_list("research_projects") or get_clean_list("research_articles")
        achievements = get_clean_list("achievements") or get_clean_list("awards")
        leadership = get_clean_list("leadership_roles") or get_clean_list("leadership")
        personal_skills = soft_skills_raw if isinstance(soft_skills_raw, list) else []
        hobbies = get_clean_list("hobbies") or get_clean_list("hobbies_interests")
        languages = get_clean_list("languages")
        additional_sections = get_clean_list("additional_information") or get_clean_list("custom_sections") or get_clean_list("additional_sections")
        personal_details = data.get("personal_details") or {}

        normalized = {
            "personal_info": {
                "name": name_val,
                "full_name": name_val,
                "email": email_val,
                "phone": phone_val,
                "address": addr_val,
                "location": loc_val,
                "linkedin": linkedin_val,
                "github": github_val,
                "portfolio": portfolio_val,
                "website": portfolio_val,
                "title": title_val,
                "other_links": contact_info["other_links"]
            },
            "personal_information": personal_info,
            "contact_information": contact_info,
            "objective": data.get("objective") or data.get("career_objective") or "",
            "summary": data.get("summary") or data.get("professional_summary") or "",
            "career_objective": data.get("objective") or data.get("career_objective") or "",
            "professional_summary": data.get("summary") or data.get("professional_summary") or "",
            
            "work_experience": work_exp,
            "experience": work_exp,
            "internships": internships,
            "education": education,
            "skills": skill_categories_list if skill_categories_list else all_flat_skills,
            "technicalSkills": all_flat_skills,
            "technical_skills": all_flat_skills,
            "softSkills": personal_skills,
            "personal_skills": personal_skills,
            "projects": projects,
            "certifications": certifications,
            "publications": publications,
            "achievements": achievements,
            "leadership_roles": leadership,
            "leadership": leadership,
            "hobbies": hobbies,
            "hobbies_interests": hobbies,
            "languages": languages,
            "personal_details": personal_details if isinstance(personal_details, dict) else {},
            "additional_information": additional_sections,
            "additional_sections": additional_sections,
            "custom_sections": additional_sections,
            "portfolioLinks": get_clean_list("portfolioLinks") or get_clean_list("portfolio_links"),
            "volunteerExperience": get_clean_list("volunteerExperience") or get_clean_list("volunteer_experience"),
            "references": get_clean_list("references")
        }

        # Build Source Content Registry
        facts = ZeroLossEngine.build_fact_registry(normalized)
        normalized["source_content"] = {
            "all_sections": list(normalized.keys()),
            "all_facts": facts
        }

        return normalized

    @staticmethod
    def chunk_resume_text(text: str, max_chunk_chars: int = 5000) -> List[Dict[str, Any]]:
        """
        Intelligently splits large resumes across page markers or logical paragraph boundaries.
        Never truncates or discards chunks.
        """
        if not text or len(text) <= max_chunk_chars:
            return [{
                "chunk_number": 1,
                "page_number": 1,
                "text": text or "",
                "char_count": len(text or "")
            }]

        chunks = []
        # Try splitting by page markers first
        pages = re.split(r'--- PAGE \d+ ---|\n\s*page\s+\d+\s*\n', text, flags=re.IGNORECASE)
        if len(pages) > 1 and all(len(p.strip()) > 0 for p in pages):
            for idx, p in enumerate(pages):
                p_clean = p.strip()
                if p_clean:
                    chunks.append({
                        "chunk_number": len(chunks) + 1,
                        "page_number": idx + 1,
                        "text": p_clean,
                        "char_count": len(p_clean)
                    })
            if chunks:
                return chunks

        # Fallback: chunk by double newlines (paragraphs/sections)
        paragraphs = text.split("\n\n")
        curr_chunk_lines = []
        curr_len = 0
        chunk_num = 1

        for p in paragraphs:
            p_len = len(p)
            if curr_len + p_len > max_chunk_chars and curr_chunk_lines:
                chunk_text = "\n\n".join(curr_chunk_lines).strip()
                chunks.append({
                    "chunk_number": chunk_num,
                    "page_number": chunk_num,
                    "text": chunk_text,
                    "char_count": len(chunk_text)
                })
                chunk_num += 1
                curr_chunk_lines = [p]
                curr_len = p_len
            else:
                curr_chunk_lines.append(p)
                curr_len += p_len

        if curr_chunk_lines:
            chunk_text = "\n\n".join(curr_chunk_lines).strip()
            chunks.append({
                "chunk_number": chunk_num,
                "page_number": chunk_num,
                "text": chunk_text,
                "char_count": len(chunk_text)
            })

        return chunks

    @staticmethod
    def safe_merge_results(results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Merges multiple structured extraction results without data loss:
        - Arrays are extended, never overwritten.
        - Non-empty scalars are never replaced with empty values.
        - Deduplication is performed after merging.
        """
        if not results:
            return {}
        if len(results) == 1:
            return results[0]

        from app.services.resume_parser import deduplicate_list

        merged: Dict[str, Any] = {}
        for res in results:
            if not isinstance(res, dict):
                continue
            for k, v in res.items():
                if k not in merged or merged[k] is None or merged[k] == "":
                    merged[k] = v
                elif isinstance(merged[k], list) and isinstance(v, list):
                    merged[k].extend(v)
                elif isinstance(merged[k], dict) and isinstance(v, dict):
                    # Recursive safe merge for nested dicts
                    for sub_k, sub_v in v.items():
                        if sub_k not in merged[k] or not merged[k][sub_k]:
                            merged[k][sub_k] = sub_v
                        elif isinstance(merged[k][sub_k], list) and isinstance(sub_v, list):
                            merged[k][sub_k].extend(sub_v)
                elif isinstance(merged[k], str) and isinstance(v, str):
                    if not merged[k] and v:
                        merged[k] = v

        # Deduplicate all lists in merged result
        for list_key in [
            "education", "work_experience", "experience", "internships", "projects",
            "certifications", "publications", "achievements", "leadership_roles",
            "leadership", "technicalSkills", "technical_skills", "softSkills",
            "personal_skills", "hobbies", "languages", "additional_information",
            "custom_sections", "portfolioLinks"
        ]:
            if list_key in merged and isinstance(merged[list_key], list):
                merged[list_key] = deduplicate_list(merged[list_key])

        return merged

    @staticmethod
    def build_fact_registry(normalized_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Recursively extracts factual items from normalized data to create the Source Fact Registry.
        """
        facts = []
        fact_id_counter = 1

        def add_fact(category: str, value: Any, field: str = None):
            nonlocal fact_id_counter
            if value is None:
                return
            val_str = str(value).strip()
            if not val_str or val_str in ["Candidate Name", "Your Name", "Tina Miller"]:
                return
            facts.append({
                "fact_id": f"FACT-{fact_id_counter:03d}",
                "category": category,
                "field": field or category,
                "value": val_str,
                "source_text": val_str,
                "source_page": 1
            })
            fact_id_counter += 1

        # Personal and contact info
        for field, val in normalized_data.get("personal_info", {}).items():
            if val and field != "other_links":
                add_fact("personal_info", val, field)

        # Objective & Summary
        if normalized_data.get("objective"):
            add_fact("objective", normalized_data["objective"])
        if normalized_data.get("summary"):
            add_fact("summary", normalized_data["summary"])

        # Education
        for idx, edu in enumerate(normalized_data.get("education", [])):
            if not isinstance(edu, dict):
                continue
            for field in ["institution", "degree", "specialization", "year", "score", "cgpa_percentage", "location"]:
                if edu.get(field):
                    add_fact(f"education_{idx+1}", edu[field], field)

        # Work Experience
        for idx, exp in enumerate(normalized_data.get("work_experience", [])):
            if not isinstance(exp, dict):
                continue
            for field in ["company", "organization", "role", "position", "start_date", "end_date", "duration", "description"]:
                if exp.get(field):
                    add_fact(f"work_experience_{idx+1}", exp[field], field)

        # Internships
        for idx, intern in enumerate(normalized_data.get("internships", [])):
            if not isinstance(intern, dict):
                continue
            for field in ["organization", "company", "role", "duration", "start_date", "end_date", "description"]:
                if intern.get(field):
                    add_fact(f"internship_{idx+1}", intern[field], field)

        # Projects
        for idx, proj in enumerate(normalized_data.get("projects", [])):
            if not isinstance(proj, dict):
                continue
            for field in ["title", "name", "technologies", "tech_stack", "duration", "description", "url"]:
                if proj.get(field):
                    add_fact(f"project_{idx+1}", proj[field], field)

        # Skills
        for skill in normalized_data.get("technicalSkills", []):
            if skill:
                add_fact("skills", skill, "technical_skill")
        for skill in normalized_data.get("softSkills", []):
            if skill:
                add_fact("skills", skill, "soft_skill")

        # Certifications
        for idx, cert in enumerate(normalized_data.get("certifications", [])):
            if isinstance(cert, dict):
                for field in ["name", "title", "provider", "organization", "issue_date", "description"]:
                    if cert.get(field):
                        add_fact(f"certification_{idx+1}", cert[field], field)
            elif cert:
                add_fact("certifications", cert)

        # Publications
        for idx, pub in enumerate(normalized_data.get("publications", [])):
            if isinstance(pub, dict):
                for field in ["title", "publisher", "year", "description"]:
                    if pub.get(field):
                        add_fact(f"publication_{idx+1}", pub[field], field)
            elif pub:
                add_fact("publications", pub)

        # Achievements
        for idx, ach in enumerate(normalized_data.get("achievements", [])):
            if isinstance(ach, dict):
                for field in ["title", "description", "date"]:
                    if ach.get(field):
                        add_fact(f"achievement_{idx+1}", ach[field], field)
            elif ach:
                add_fact("achievements", ach)

        # Leadership
        for idx, lead in enumerate(normalized_data.get("leadership_roles", [])):
            if isinstance(lead, dict):
                for field in ["organization", "role", "duration", "description"]:
                    if lead.get(field):
                        add_fact(f"leadership_{idx+1}", lead[field], field)
            elif lead:
                add_fact("leadership", lead)

        # Hobbies, Languages
        for h in normalized_data.get("hobbies", []):
            if h:
                add_fact("hobbies", h)
        for lang in normalized_data.get("languages", []):
            if lang:
                add_fact("languages", lang)

        # Personal Details
        for field, val in normalized_data.get("personal_details", {}).items():
            if val and field != "languages_known":
                add_fact("personal_details", val, field)

        # Additional Information
        for idx, sec in enumerate(normalized_data.get("additional_information", [])):
            if isinstance(sec, dict):
                name = sec.get("title") or sec.get("section_name") or "custom"
                content = sec.get("content") or []
                if name:
                    add_fact(f"additional_section_{idx+1}_title", name)
                if isinstance(content, list):
                    for item in content:
                        if item:
                            add_fact(f"additional_section_{idx+1}_content", item)
                elif content:
                    add_fact(f"additional_section_{idx+1}_content", content)
            elif sec:
                add_fact("additional_information", sec)

        return facts

    @staticmethod
    def validate_facts(original_facts: List[Dict[str, Any]], current_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates that all original facts are preserved in the current/enhanced resume JSON.
        Computes completeness score and status.
        """
        def flatten_to_string(val: Any) -> str:
            if isinstance(val, str):
                return val.lower()
            elif isinstance(val, list):
                return " ".join(flatten_to_string(item) for item in val).lower()
            elif isinstance(val, dict):
                return " ".join(flatten_to_string(v) for v in val.values()).lower()
            return str(val).lower()

        current_flat_text = flatten_to_string(current_data)
        missing_facts = []
        preserved_count = 0

        for fact in original_facts:
            val_str = str(fact.get("value", "")).strip()
            if not val_str:
                preserved_count += 1
                continue

            val_lower = val_str.lower()
            clean_val = re.sub(r'[^a-z0-9]', '', val_lower)
            clean_flat = re.sub(r'[^a-z0-9]', '', current_flat_text)

            if val_lower in current_flat_text or (clean_val and clean_val in clean_flat):
                preserved_count += 1
            else:
                words = [w for w in re.findall(r'\b\w{3,}\b', val_lower)]
                if len(words) >= 2:
                    matched_words = sum(1 for w in words if w in current_flat_text)
                    if matched_words / len(words) >= 0.60:
                        preserved_count += 1
                        continue
                missing_facts.append(fact)

        total_facts = len(original_facts)
        completeness = (preserved_count / total_facts * 100.0) if total_facts > 0 else 100.0

        status = "PASS" if len(missing_facts) == 0 else "WARNING"

        return {
            "total_source_facts": total_facts,
            "preserved_facts": preserved_count,
            "missing_facts": len(missing_facts),
            "validation_status": status,
            "content_completeness": float(round(completeness, 2)),
            "missing_details": missing_facts
        }
