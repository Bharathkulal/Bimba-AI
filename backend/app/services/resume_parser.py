import json
import re
from typing import Dict, Any, List, Union
from app.core.exceptions import JSONValidationException
from app.core.logging_service import log_stage, log_error

def unwrap_json_text(text: Any) -> str:
    if text is None:
        return ""
    if isinstance(text, dict):
        for k in ["summary", "professionalSummary", "profile_summary", "profileSummary", "objective", "content", "text", "description", "value", "title"]:
            if k in text and text[k] and isinstance(text[k], (str, dict)):
                res = unwrap_json_text(text[k])
                if res:
                    return res
        vals = [unwrap_json_text(v) for v in text.values() if isinstance(v, (str, dict)) and str(v).strip()]
        return " ".join([v for v in vals if v]) if vals else str(text)
    
    if isinstance(text, str):
        s = text.strip()
        if s.startswith("```"):
            lines = s.split("\n")
            if len(lines) > 2 and lines[-1].startswith("```"):
                s = "\n".join(lines[1:-1]).strip()
        if s.startswith("{") and s.endswith("}"):
            try:
                data = json.loads(s)
                return unwrap_json_text(data)
            except Exception:
                pass
        return s.strip('"\'')
    return str(text)


def normalize_comparison_string(s: Any) -> str:
    """Normalizes string for comparison without modifying display string."""
    if s is None:
        return ""
    if isinstance(s, dict):
        # Extract prominent text
        s = s.get("name") or s.get("title") or s.get("value") or str(s)
    text = str(s).lower().strip()
    text = re.sub(r'[\u2010\u2011\u2012\u2013\u2014\u2015\u2212\-—]', ' ', text)
    text = re.sub(r'[^\w\s]', '', text)
    return " ".join(text.split())


def deduplicate_list(items: List[Any], key_field: str = None, key_func=None) -> List[Any]:
    """Deduplicates list preserving first occurrence and original display values."""
    if not items or not isinstance(items, list):
        return []
    
    seen = set()
    result = []
    
    for item in items:
        if item is None:
            continue
        if key_func is not None:
            raw_key = key_func(item)
            cmp_key = normalize_comparison_string(str(raw_key))
            if cmp_key and cmp_key not in seen:
                seen.add(cmp_key)
                result.append(item)
            elif not cmp_key:
                result.append(item)
            continue

        if isinstance(item, str):
            clean_str = item.strip()
            if not clean_str:
                continue
            cmp_key = normalize_comparison_string(clean_str)
            if cmp_key and cmp_key not in seen:
                seen.add(cmp_key)
                result.append(clean_str)
        elif isinstance(item, dict):
            if key_field and key_field in item and item[key_field]:
                cmp_key = normalize_comparison_string(item[key_field])
            else:
                # Combine prominent keys
                parts = [
                    str(item.get("name") or item.get("title") or ""),
                    str(item.get("organization") or item.get("provider") or item.get("company") or item.get("institution") or "")
                ]
                cmp_key = normalize_comparison_string(" ".join(filter(None, parts)))
                if not cmp_key:
                    cmp_key = normalize_comparison_string(str(item))
            
            if cmp_key and cmp_key not in seen:
                seen.add(cmp_key)
                result.append(item)
            elif not cmp_key:
                result.append(item)
        else:
            result.append(item)
            
    return result


class ResumeParser:
    @staticmethod
    def parse_and_validate(raw_ai_text: str) -> Dict[str, Any]:
        if not raw_ai_text:
            raise JSONValidationException("Empty response from AI parser")

        # 1. Clean markdown formatting
        cleaned = raw_ai_text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()
        
        # 2. Repair trailing commas in arrays/objects
        cleaned = re.sub(r',\s*([\]}])', r'\1', cleaned)
        
        # 3. Deserialize JSON
        parsed = None
        try:
            parsed = json.loads(cleaned)
        except Exception:
            # Secondary regex-based recovery
            try:
                start_idx = cleaned.find('{')
                end_idx = cleaned.rfind('}')
                if start_idx != -1 and end_idx != -1:
                    repaired = cleaned[start_idx:end_idx+1]
                    repaired = re.sub(r',\s*([\]}])', r'\1', repaired)
                    parsed = json.loads(repaired)
                else:
                    raise JSONValidationException("Could not locate JSON block in AI response")
            except Exception as repair_err:
                log_error("PARSER", "Failed to parse AI response to valid JSON", repair_err)
                raise JSONValidationException(f"AI response is not valid JSON: {str(repair_err)}")
                
        if not isinstance(parsed, dict):
            raise JSONValidationException("AI response JSON did not decode to a dictionary")

        # 4. Standard Keys Mapping
        standard_keys = {
            "personal_info": ["personal_info", "personalInfo", "contact", "profile", "personal_information", "personal", "basic_info", "contact_information", "contact_info"],
            "summary": ["summary", "profile_summary", "professional_summary", "professionalSummary", "profileSummary", "about_me", "about", "summary_text"],
            "objective": ["objective", "career_objective", "career_goal"],
            "education": ["education", "educationInfo", "academic", "academics", "studies", "degree", "degrees", "qualifications", "academic_background"],
            "work_experience": ["work_experience", "workExperience", "experience", "history", "employment", "jobs", "work_history", "experiences", "professional_experience"],
            "internships": ["internships", "internship", "internship_experience", "industrial_training"],
            "projects": ["projects", "project_details", "portfolio_projects", "academic_projects", "project_list", "key_projects"],
            "skills": ["skills", "skill_categories", "categorized_skills"],
            "technicalSkills": ["technicalSkills", "technical_skills", "key_skills", "technologies", "skillset", "core_competencies"],
            "softSkills": ["softSkills", "soft_skills", "personal_skills", "interpersonal_skills"],
            "tools": ["tools", "tool_list", "technologies_tools"],
            "languages": ["languages", "languages_spoken", "spoken_languages"],
            "certifications": ["certifications", "certificates", "certifications_list", "credentials", "courses", "trainings"],
            "achievements": ["achievements", "awards_achievements", "accomplishments", "hackathons", "honors"],
            "awards": ["awards", "honors_awards"],
            "publications": ["publications", "research_papers", "papers", "research", "research_publications", "articles"],
            "leadership_roles": ["leadership_roles", "leadership", "leadership_experience", "positions_of_responsibility", "responsibilities_held"],
            "volunteerExperience": ["volunteerExperience", "volunteer", "social_service", "community_service"],
            "hobbies": ["hobbies", "interests", "hobbies_interests", "personal_interests", "extracurricular_activities"],
            "personal_details": ["personal_details", "personalDetails", "personal_profile"],
            "portfolioLinks": ["portfolioLinks", "portfolio_links", "links", "urls", "social_links", "socials"],
            "references": ["references", "referees"],
            "additional_information": ["additional_information", "additional_sections", "custom_sections", "custom", "other_information", "unclassified_content"]
        }
        
        normalized: Dict[str, Any] = {}
        for target, variations in standard_keys.items():
            val = None
            for var in variations:
                if var in parsed and parsed[var] is not None:
                    val = parsed[var]
                    break
            
            if target in ["summary", "objective"]:
                normalized[target] = unwrap_json_text(val) if val else ""
            elif target in ["personal_info", "personal_details"]:
                normalized[target] = val if isinstance(val, dict) else {}
            else:
                if isinstance(val, list):
                    normalized[target] = val
                elif isinstance(val, str) and val.strip():
                    normalized[target] = [val.strip()]
                elif isinstance(val, dict) and val:
                    normalized[target] = [val]
                else:
                    normalized[target] = []

        # 5. Process Personal Info (merge contact info + personal info)
        pi_data = normalized.get("personal_info", {})
        contact_data = parsed.get("contact_information") or parsed.get("contact_info") or parsed.get("contact") or {}
        if isinstance(contact_data, dict):
            merged_pi = {**contact_data, **(pi_data if isinstance(pi_data, dict) else {})}
        else:
            merged_pi = pi_data if isinstance(pi_data, dict) else {}

        name_val = merged_pi.get("name") or merged_pi.get("fullName") or merged_pi.get("full_name") or ""
        email_val = merged_pi.get("email") or merged_pi.get("emailAddress") or merged_pi.get("email_address") or ""
        phone_val = merged_pi.get("phone") or merged_pi.get("phoneNumber") or merged_pi.get("phone_number") or merged_pi.get("contact_number") or merged_pi.get("mobile") or ""
        addr_val = merged_pi.get("address") or merged_pi.get("full_address") or merged_pi.get("residence") or ""
        loc_val = merged_pi.get("location") or merged_pi.get("city_state") or addr_val
        
        # If address is empty but location has content, preserve location in address
        if not addr_val and loc_val:
            addr_val = loc_val
        if not loc_val and addr_val:
            loc_val = addr_val

        linkedin_val = merged_pi.get("linkedin") or merged_pi.get("linkedin_url") or merged_pi.get("linkedinUrl") or ""
        github_val = merged_pi.get("github") or merged_pi.get("github_url") or merged_pi.get("githubUrl") or ""
        portfolio_val = merged_pi.get("portfolio") or merged_pi.get("portfolio_url") or merged_pi.get("portfolioUrl") or merged_pi.get("website") or ""
        title_val = merged_pi.get("title") or merged_pi.get("target_role") or merged_pi.get("role") or merged_pi.get("designation") or merged_pi.get("headline") or ""

        normalized["personal_info"] = {
            "name": unwrap_json_text(name_val),
            "full_name": unwrap_json_text(name_val),
            "email": unwrap_json_text(email_val),
            "phone": unwrap_json_text(phone_val),
            "address": unwrap_json_text(addr_val),
            "location": unwrap_json_text(loc_val),
            "linkedin": unwrap_json_text(linkedin_val),
            "github": unwrap_json_text(github_val),
            "portfolio": unwrap_json_text(portfolio_val),
            "website": unwrap_json_text(portfolio_val),
            "title": unwrap_json_text(title_val),
            "other_links": merged_pi.get("other_links", []) if isinstance(merged_pi.get("other_links"), list) else []
        }

        # 6. Process Skills (Categorized + Flat)
        all_skills_flat: List[str] = []
        skills_categorized: List[Dict[str, Any]] = []
        
        raw_skills = parsed.get("skills")
        if isinstance(raw_skills, list):
            for item in raw_skills:
                if isinstance(item, dict) and ("category" in item or "skills" in item):
                    cat_name = item.get("category") or "General"
                    c_skills = item.get("skills") or []
                    if isinstance(c_skills, str):
                        c_skills = [s.strip() for s in re.split(r'[,|;]', c_skills) if s.strip()]
                    elif isinstance(c_skills, list):
                        c_skills = [unwrap_json_text(s) for s in c_skills if str(s).strip()]
                    skills_categorized.append({
                        "category": cat_name,
                        "skills": deduplicate_list(c_skills)
                    })
                    all_skills_flat.extend(c_skills)
                elif isinstance(item, str) and item.strip():
                    all_skills_flat.append(item.strip())
                elif isinstance(item, dict):
                    for k, v in item.items():
                        if isinstance(v, list):
                            flat_v = [unwrap_json_text(x) for x in v if str(x).strip()]
                            skills_categorized.append({"category": k, "skills": deduplicate_list(flat_v)})
                            all_skills_flat.extend(flat_v)
                        elif isinstance(v, str) and v.strip():
                            all_skills_flat.append(unwrap_json_text(v))

        elif isinstance(raw_skills, dict):
            for k, v in raw_skills.items():
                if isinstance(v, list):
                    flat_v = [unwrap_json_text(x) for x in v if str(x).strip()]
                    skills_categorized.append({"category": k, "skills": deduplicate_list(flat_v)})
                    all_skills_flat.extend(flat_v)
                elif isinstance(v, str) and v.strip():
                    parts = [s.strip() for s in re.split(r'[,|;]', v) if s.strip()]
                    skills_categorized.append({"category": k, "skills": parts})
                    all_skills_flat.extend(parts)

        # Merge with technical_skills field if present
        raw_tech = parsed.get("technical_skills") or parsed.get("technicalSkills") or []
        if isinstance(raw_tech, list):
            for t in raw_tech:
                if isinstance(t, str) and t.strip():
                    all_skills_flat.append(t.strip())
                elif isinstance(t, dict):
                    all_skills_flat.append(unwrap_json_text(t))

        # Deduplicate flat skills list
        deduped_skills = deduplicate_list(all_skills_flat)
        normalized["technicalSkills"] = deduped_skills
        normalized["technical_skills"] = deduped_skills
        normalized["skills"] = skills_categorized if skills_categorized else deduped_skills

        # 7. Process Education with Score & CGPA Preservation
        norm_edu = []
        for edu in normalized.get("education", []):
            if isinstance(edu, dict):
                score_val = edu.get("score") or edu.get("cgpa_percentage") or edu.get("cgpa") or edu.get("percentage") or edu.get("marks") or ""
                score_type_val = edu.get("score_type") or ("CGPA" if "cgpa" in str(score_val).lower() else ("Percentage" if "%" in str(score_val) else ""))
                norm_edu.append({
                    "id": edu.get("id"),
                    "degree": unwrap_json_text(edu.get("degree") or edu.get("course") or ""),
                    "specialization": unwrap_json_text(edu.get("specialization") or edu.get("stream") or edu.get("field_of_study") or ""),
                    "institution": unwrap_json_text(edu.get("institution") or edu.get("college") or edu.get("university") or edu.get("school") or ""),
                    "location": unwrap_json_text(edu.get("location") or ""),
                    "start_date": unwrap_json_text(edu.get("start_date") or ""),
                    "end_date": unwrap_json_text(edu.get("end_date") or ""),
                    "year": unwrap_json_text(edu.get("year") or edu.get("passing_year") or ""),
                    "score": unwrap_json_text(score_val),
                    "score_type": unwrap_json_text(score_type_val),
                    "cgpa_percentage": unwrap_json_text(score_val),
                    "description": unwrap_json_text(edu.get("description") or ""),
                    "achievements": unwrap_json_text(edu.get("achievements") or "")
                })
            elif isinstance(edu, str) and edu.strip():
                norm_edu.append({
                    "degree": edu.strip(),
                    "specialization": "",
                    "institution": "",
                    "year": "",
                    "score": "",
                    "cgpa_percentage": ""
                })
        normalized["education"] = deduplicate_list(norm_edu, key_field="institution")

        # 8. Process Work Experience & Internships (SEPARATE!)
        norm_exp = []
        raw_work = normalized.get("work_experience") or parsed.get("experience") or []
        for exp in raw_work:
            if isinstance(exp, dict):
                comp = exp.get("company") or exp.get("organization") or exp.get("employer") or ""
                pos = exp.get("position") or exp.get("role") or exp.get("job_title") or exp.get("title") or ""
                s_date = exp.get("start_date") or ""
                e_date = exp.get("end_date") or ""
                is_curr = bool(exp.get("is_current") or "present" in str(e_date).lower() or "current" in str(e_date).lower())
                dur = exp.get("duration") or (f"{s_date} – {'Present' if is_curr else e_date}" if s_date else "")
                desc = exp.get("description") or ""
                if isinstance(exp.get("responsibilities"), list) and not desc:
                    desc = "\n".join(exp["responsibilities"])
                norm_exp.append({
                    "id": exp.get("id"),
                    "company": unwrap_json_text(comp),
                    "organization": unwrap_json_text(comp),
                    "role": unwrap_json_text(pos),
                    "position": unwrap_json_text(pos),
                    "employment_type": unwrap_json_text(exp.get("employment_type") or ""),
                    "location": unwrap_json_text(exp.get("location") or ""),
                    "start_date": unwrap_json_text(s_date),
                    "end_date": None if is_curr else unwrap_json_text(e_date),
                    "duration": unwrap_json_text(dur),
                    "is_current": is_curr,
                    "description": unwrap_json_text(desc),
                    "responsibilities": exp.get("responsibilities", []) if isinstance(exp.get("responsibilities"), list) else [],
                    "technologies": exp.get("technologies", []) if isinstance(exp.get("technologies"), list) else []
                })
        normalized["work_experience"] = deduplicate_list(norm_exp, key_field="company")
        normalized["experience"] = normalized["work_experience"]

        norm_intern = []
        for intern in normalized.get("internships", []):
            if isinstance(intern, dict):
                comp = intern.get("organization") or intern.get("company") or ""
                pos = intern.get("role") or intern.get("position") or "Intern"
                s_date = intern.get("start_date") or ""
                e_date = intern.get("end_date") or ""
                dur = intern.get("duration") or (f"{s_date} – {e_date}" if s_date else "")
                desc = intern.get("description") or ""
                norm_intern.append({
                    "id": intern.get("id"),
                    "organization": unwrap_json_text(comp),
                    "company": unwrap_json_text(comp),
                    "role": unwrap_json_text(pos),
                    "position": unwrap_json_text(pos),
                    "location": unwrap_json_text(intern.get("location") or ""),
                    "start_date": unwrap_json_text(s_date),
                    "end_date": unwrap_json_text(e_date),
                    "duration": unwrap_json_text(dur),
                    "description": unwrap_json_text(desc),
                    "responsibilities": intern.get("responsibilities", []) if isinstance(intern.get("responsibilities"), list) else [],
                    "technologies": intern.get("technologies", []) if isinstance(intern.get("technologies"), list) else []
                })
            elif isinstance(intern, str) and intern.strip():
                norm_intern.append({
                    "organization": "Organization",
                    "role": "Intern",
                    "description": intern.strip()
                })
        normalized["internships"] = deduplicate_list(norm_intern, key_field="organization")

        # 9. Process Projects (Distinct from Hobbies and Publications)
        norm_proj = []
        for proj in normalized.get("projects", []):
            if isinstance(proj, dict):
                title = proj.get("title") or proj.get("name") or "Project"
                tech = proj.get("technologies") or proj.get("tech_stack") or proj.get("tech") or ""
                if isinstance(tech, list):
                    tech = ", ".join(tech)
                norm_proj.append({
                    "id": proj.get("id"),
                    "title": unwrap_json_text(title),
                    "name": unwrap_json_text(title),
                    "description": unwrap_json_text(proj.get("description") or ""),
                    "technologies": unwrap_json_text(tech),
                    "tech_stack": unwrap_json_text(tech),
                    "duration": unwrap_json_text(proj.get("duration") or ""),
                    "start_date": unwrap_json_text(proj.get("start_date") or ""),
                    "end_date": unwrap_json_text(proj.get("end_date") or ""),
                    "url": unwrap_json_text(proj.get("url") or proj.get("github") or proj.get("link") or ""),
                    "achievements": proj.get("achievements", []) if isinstance(proj.get("achievements"), list) else []
                })
            elif isinstance(proj, str) and proj.strip():
                norm_proj.append({
                    "title": proj.strip(),
                    "description": "",
                    "technologies": ""
                })
        normalized["projects"] = deduplicate_list(norm_proj, key_field="title")

        # 10. Process Certifications (Deduplicated)
        norm_certs = []
        raw_certs = normalized.get("certifications") or parsed.get("certificates") or []
        for cert in raw_certs:
            if isinstance(cert, dict):
                c_name = cert.get("name") or cert.get("title") or cert.get("certificate") or ""
                c_org = cert.get("provider") or cert.get("organization") or cert.get("issuer") or ""
                c_date = cert.get("issue_date") or cert.get("date") or cert.get("year") or ""
                norm_certs.append({
                    "id": cert.get("id"),
                    "name": unwrap_json_text(c_name),
                    "title": unwrap_json_text(c_name),
                    "provider": unwrap_json_text(c_org),
                    "organization": unwrap_json_text(c_org),
                    "issuer": unwrap_json_text(c_org),
                    "issue_date": unwrap_json_text(c_date),
                    "credential_id": unwrap_json_text(cert.get("credential_id") or ""),
                    "credential_url": unwrap_json_text(cert.get("credential_url") or ""),
                    "description": unwrap_json_text(cert.get("description") or "")
                })
            elif isinstance(cert, str) and cert.strip():
                norm_certs.append({
                    "name": cert.strip(),
                    "provider": "",
                    "issue_date": "",
                    "description": cert.strip()
                })
        normalized["certifications"] = deduplicate_list(norm_certs, key_field="name")

        # 11. Process Publications (Dedicated Section)
        norm_pubs = []
        for pub in normalized.get("publications", []):
            if isinstance(pub, dict):
                norm_pubs.append({
                    "id": pub.get("id"),
                    "title": unwrap_json_text(pub.get("title") or pub.get("name") or ""),
                    "publication_type": unwrap_json_text(pub.get("publication_type") or pub.get("type") or ""),
                    "authorship_type": unwrap_json_text(pub.get("authorship_type") or ""),
                    "description": unwrap_json_text(pub.get("description") or ""),
                    "publisher": unwrap_json_text(pub.get("publisher") or pub.get("journal") or pub.get("conference") or ""),
                    "year": unwrap_json_text(pub.get("year") or pub.get("date") or ""),
                    "url": unwrap_json_text(pub.get("url") or "")
                })
            elif isinstance(pub, str) and pub.strip():
                norm_pubs.append({
                    "title": pub.strip(),
                    "publication_type": "Publication",
                    "description": "",
                    "publisher": "",
                    "year": ""
                })
        normalized["publications"] = deduplicate_list(norm_pubs, key_field="title")

        # 12. Process Achievements
        norm_ach = []
        raw_ach = normalized.get("achievements") or parsed.get("awards") or []
        for ach in raw_ach:
            if isinstance(ach, dict):
                title = ach.get("title") or ach.get("name") or ach.get("achievement") or ""
                desc = ach.get("description") or ""
                date = ach.get("date") or ach.get("year") or ""
                norm_ach.append({
                    "id": ach.get("id"),
                    "title": unwrap_json_text(title),
                    "description": unwrap_json_text(desc),
                    "date": unwrap_json_text(date),
                    "organization": unwrap_json_text(ach.get("organization") or "")
                })
            elif isinstance(ach, str) and ach.strip():
                norm_ach.append({
                    "title": ach.strip(),
                    "description": "",
                    "date": ""
                })
        normalized["achievements"] = deduplicate_list(norm_ach, key_field="title")

        # 13. Process Leadership Roles
        norm_lead = []
        raw_lead = normalized.get("leadership_roles") or parsed.get("leadership") or []
        for lead in raw_lead:
            if isinstance(lead, dict):
                org = lead.get("organization") or lead.get("club") or lead.get("society") or ""
                role = lead.get("role") or lead.get("position") or lead.get("title") or ""
                norm_lead.append({
                    "id": lead.get("id"),
                    "organization": unwrap_json_text(org),
                    "role": unwrap_json_text(role),
                    "start_date": unwrap_json_text(lead.get("start_date") or ""),
                    "end_date": unwrap_json_text(lead.get("end_date") or ""),
                    "duration": unwrap_json_text(lead.get("duration") or ""),
                    "description": unwrap_json_text(lead.get("description") or "")
                })
            elif isinstance(lead, str) and lead.strip():
                norm_lead.append({
                    "organization": lead.strip(),
                    "role": "Role",
                    "description": ""
                })
        normalized["leadership_roles"] = deduplicate_list(norm_lead, key_field="organization")
        normalized["leadership"] = normalized["leadership_roles"]

        # 14. Personal Skills, Hobbies, Languages
        raw_pskills = normalized.get("softSkills") or parsed.get("personal_skills") or []
        if isinstance(raw_pskills, list):
            norm_pskills = [unwrap_json_text(s) for s in raw_pskills if str(s).strip()]
        elif isinstance(raw_pskills, str):
            norm_pskills = [s.strip() for s in re.split(r'[,|;]', raw_pskills) if s.strip()]
        else:
            norm_pskills = []
        normalized["softSkills"] = deduplicate_list(norm_pskills)
        normalized["personal_skills"] = normalized["softSkills"]

        raw_hobbies = normalized.get("hobbies") or parsed.get("hobbies_interests") or []
        if isinstance(raw_hobbies, list):
            norm_hobbies = [unwrap_json_text(h) for h in raw_hobbies if str(h).strip()]
        elif isinstance(raw_hobbies, str):
            norm_hobbies = [h.strip() for h in re.split(r'[,|;]', raw_hobbies) if h.strip()]
        else:
            norm_hobbies = []
        normalized["hobbies"] = deduplicate_list(norm_hobbies)

        raw_langs = normalized.get("languages") or []
        if isinstance(raw_langs, list):
            norm_langs = [unwrap_json_text(l) for l in raw_langs if str(l).strip()]
        elif isinstance(raw_langs, str):
            norm_langs = [l.strip() for l in re.split(r'[,|;]', raw_langs) if l.strip()]
        else:
            norm_langs = []
        normalized["languages"] = deduplicate_list(norm_langs)

        # 15. Personal Details
        p_details = normalized.get("personal_details", {})
        if isinstance(p_details, dict):
            normalized["personal_details"] = {
                "date_of_birth": unwrap_json_text(p_details.get("date_of_birth") or p_details.get("dob") or ""),
                "father_name": unwrap_json_text(p_details.get("father_name") or p_details.get("father") or ""),
                "mother_name": unwrap_json_text(p_details.get("mother_name") or p_details.get("mother") or ""),
                "gender": unwrap_json_text(p_details.get("gender") or ""),
                "nationality": unwrap_json_text(p_details.get("nationality") or ""),
                "mother_tongue": unwrap_json_text(p_details.get("mother_tongue") or ""),
                "languages_known": p_details.get("languages_known") or normalized["languages"]
            }
        else:
            normalized["personal_details"] = {}

        # 16. Additional Information / Unclassified Content Fallback
        known_vars = set()
        for target, variations in standard_keys.items():
            known_vars.update(variations)
        known_vars.update([
            "contact_information", "contact_info", "personal_information",
            "source_content", "source_facts", "all_facts", "all_sections",
            "raw_extraction", "original_parsed_data", "extraction_version",
            "extraction_incomplete", "extraction_incomplete_reason"
        ])

        additional_items = normalized.get("additional_information", [])
        if not isinstance(additional_items, list):
            additional_items = [additional_items]

        for key, val in parsed.items():
            if key not in known_vars and val:
                content_list = []
                if isinstance(val, list):
                    for item in val:
                        cleaned_item = unwrap_json_text(item)
                        if cleaned_item:
                            content_list.append(cleaned_item)
                elif isinstance(val, dict):
                    cleaned_item = unwrap_json_text(val)
                    if cleaned_item:
                        content_list.append(cleaned_item)
                else:
                    cleaned_item = unwrap_json_text(val)
                    if cleaned_item:
                        content_list.append(cleaned_item)
                
                if content_list:
                    additional_items.append({
                        "title": key.replace("_", " ").title(),
                        "section_name": key.replace("_", " ").title(),
                        "content": content_list
                    })

        normalized["additional_information"] = additional_items
        normalized["custom_sections"] = additional_items

        return normalized
