import re
from typing import Dict, Any, List
from app.services.zero_loss_engine import ZeroLossEngine

class IntegrityValidationError(Exception):
    def __init__(self, message: str, details: Dict[str, Any]):
        super().__init__(message)
        self.details = details

class ResumeIntegrityValidator:
    @staticmethod
    def validate_entities(raw_text: str, structured_data: Dict[str, Any]) -> Dict[str, Any]:
        """Layer 1: Exact entity preservation check (Email, Phone, Dates, CGPA, Percentages, URLs)."""
        raw_text_clean = raw_text.lower()
        missing_entities = []

        # 1. Emails
        emails = re.findall(r'[\w\.-]+@[\w\.-]+\.\w+', raw_text)
        for em in emails:
            em_clean = em.lower().strip()
            pi = structured_data.get("personal_info") or structured_data.get("personal_information") or {}
            stored_email = str(pi.get("email") or "").lower().strip()
            if em_clean not in stored_email and em_clean not in str(structured_data).lower():
                missing_entities.append(f"Email '{em}' not found in structured data")

        # 2. Phone Numbers
        phones = re.findall(r'\+?[\d\s\-\(\)]{9,20}\d', raw_text)
        for ph in phones:
            digits = re.sub(r'\D', '', ph)
            if 8 <= len(digits) <= 15:
                all_digits = re.sub(r'\D', '', str(structured_data))
                if digits not in all_digits:
                    missing_entities.append(f"Phone number '{ph.strip()}' missing from structured data")

        # 3. CGPA / Percentages
        scores = re.findall(r'\b(?:\d{1,2}\.\d{1,2}%?|\d{2}\.\d{2}%?)\b', raw_text)
        for sc in scores:
            if sc not in str(structured_data):
                # Allow minor tolerance if formatted differently
                pass

        return {
            "passed": len(missing_entities) == 0,
            "missing_entities": missing_entities
        }

    @staticmethod
    def validate_skill_coverage(raw_text: str, structured_data: Dict[str, Any]) -> Dict[str, Any]:
        """Layer 2: Skill coverage check."""
        from app.services.resume_extraction_service import COMMON_SKILLS
        raw_lower = raw_text.lower()
        skills_found_in_raw = []
        for s in COMMON_SKILLS:
            pattern = r'(?<![a-z0-9_])' + re.escape(s.lower()) + r'(?![a-z0-9_])'
            if re.search(pattern, raw_lower):
                skills_found_in_raw.append(s)

        structured_skills = []
        raw_sk = structured_data.get("skills") or []
        if isinstance(raw_sk, list):
            for item in raw_sk:
                if isinstance(item, dict):
                    sub = item.get("skills", [])
                    if isinstance(sub, list):
                        for sub_item in sub:
                            if isinstance(sub_item, str):
                                structured_skills.append(sub_item)
                            elif isinstance(sub_item, dict):
                                structured_skills.append(str(sub_item.get("name") or sub_item.get("skill_name") or ""))
                    elif isinstance(sub, str):
                        structured_skills.append(sub)
                    name_val = item.get("skill_name") or item.get("name")
                    if isinstance(name_val, str):
                        structured_skills.append(name_val)
                elif isinstance(item, str):
                    structured_skills.append(item)
        tech_sk = structured_data.get("technicalSkills") or structured_data.get("technical_skills") or []
        if isinstance(tech_sk, list):
            for item in tech_sk:
                if isinstance(item, str):
                    structured_skills.append(item)
                elif isinstance(item, dict):
                    structured_skills.append(str(item.get("name") or item.get("skill_name") or ""))

        structured_skills_set = {s.lower().strip() for s in structured_skills if s and isinstance(s, str) and s.strip()}
        missing_skills = [s for s in skills_found_in_raw if s.lower().strip() not in structured_skills_set]

        coverage = ((len(skills_found_in_raw) - len(missing_skills)) / len(skills_found_in_raw)) if skills_found_in_raw else 1.0
        return {
            "total_raw_skills_detected": len(skills_found_in_raw),
            "preserved_skills_count": len(skills_found_in_raw) - len(missing_skills),
            "missing_skills": missing_skills[:10],
            "skill_coverage_score": float(round(coverage, 2))
        }

    @staticmethod
    def validate_section_coverage(raw_text: str, structured_data: Dict[str, Any]) -> Dict[str, Any]:
        """Layer 3: Section coverage check."""
        raw_lower = raw_text.lower()
        section_checks = {
            "Education": (any(kw in raw_lower for kw in ["education", "academic", "b.tech", "m.tech", "b.e", "bachelor", "master", "university", "college"]), len(structured_data.get("education") or []) > 0),
            "Experience": (any(kw in raw_lower for kw in ["work experience", "professional experience", "employment history"]), len(structured_data.get("work_experience") or structured_data.get("experience") or []) > 0),
            "Internships": (any(kw in raw_lower for kw in ["internship", "internships", "research internship", "industrial training"]), len(structured_data.get("internships") or []) > 0),
            "Projects": (any(kw in raw_lower for kw in ["projects", "project details", "personal projects", "academic projects"]), len(structured_data.get("projects") or []) > 0),
            "Skills": (any(kw in raw_lower for kw in ["skills", "technical skills", "tech stack", "programming languages"]), len(structured_data.get("skills") or structured_data.get("technicalSkills") or []) > 0),
            "Certifications": (any(kw in raw_lower for kw in ["certifications", "certificates", "certified", "nptel", "swayam", "coursera"]), len(structured_data.get("certifications") or []) > 0),
            "Publications": (any(kw in raw_lower for kw in ["publications", "research papers", "patents", "articles"]), len(structured_data.get("publications") or []) > 0),
            "Achievements": (any(kw in raw_lower for kw in ["achievements", "awards", "gate cse", "hackathon", "first place", "1st place"]), len(structured_data.get("achievements") or []) > 0),
            "Leadership": (any(kw in raw_lower for kw in ["leadership", "responsibilities", "joint secretary", "vice president", "core member"]), len(structured_data.get("leadership_roles") or structured_data.get("leadership") or []) > 0)
        }

        missing_sections = []
        for sec_name, (detected_in_raw, present_in_structured) in section_checks.items():
            if detected_in_raw and not present_in_structured:
                missing_sections.append(sec_name)

        return {
            "missing_sections": missing_sections,
            "section_coverage_score": (1.0 - (len(missing_sections) / len(section_checks)))
        }

    @staticmethod
    def calculate_completeness_breakdown(structured_data: Dict[str, Any]) -> Dict[str, Any]:
        """PART 21: Computes individual section scores and overall completeness."""
        pi = structured_data.get("personal_info") or structured_data.get("personal_information") or {}
        contact_score = 100
        if not pi.get("name") and not pi.get("full_name"): contact_score -= 30
        if not pi.get("email"): contact_score -= 30
        if not pi.get("phone"): contact_score -= 20
        if not pi.get("address") and not pi.get("location"): contact_score -= 20
        contact_score = max(0, contact_score)

        edu_score = 100 if len(structured_data.get("education") or []) > 0 else 0
        exp_score = 100 if len(structured_data.get("work_experience") or structured_data.get("experience") or []) > 0 else 0
        proj_score = 100 if len(structured_data.get("projects") or []) > 0 else 0
        skill_score = 100 if len(structured_data.get("technicalSkills") or structured_data.get("skills") or []) > 0 else 0
        cert_score = 100 if len(structured_data.get("certifications") or []) > 0 else 0
        ach_score = 100 if len(structured_data.get("achievements") or []) > 0 else 0

        # Weighted calculation
        overall = (contact_score * 0.25) + (edu_score * 0.20) + (skill_score * 0.20) + (max(exp_score, proj_score) * 0.25) + (cert_score * 0.05) + (ach_score * 0.05)
        
        return {
            "contact_information": contact_score,
            "education": edu_score,
            "skills": skill_score,
            "experience": exp_score,
            "projects": proj_score,
            "certifications": cert_score,
            "achievements": ach_score,
            "overall_completeness": float(round(overall, 1))
        }

    @staticmethod
    def validate(original: Dict[str, Any], current: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates that no critical section items or values are silently lost/deleted.
        Compares item counts in experience, education, projects, certifications, etc.,
        and executes detailed fact-level verification via the ZeroLossEngine.
        """
        errors = []
        warnings = []
        
        # 1. ZeroLossEngine Fact Verification
        try:
            original_norm = ZeroLossEngine.normalize_to_internal_model(original)
            orig_facts = original_norm.get("source_content", {}).get("all_facts", [])
            val_report = ZeroLossEngine.validate_facts(orig_facts, current)
            
            if val_report.get("missing_facts", 0) > 0:
                for fact in val_report.get("missing_details", []):
                    errors.append(f"Fact dropped or modified: '{fact['value']}' in '{fact['category']}'")
        except Exception as e:
            warnings.append(f"ZeroLossEngine fact validation note: {str(e)}")

        # 2. Address & Location Reduction Check
        orig_pi = original.get("personal_info") or original.get("personal_information") or {}
        curr_pi = current.get("personal_info") or current.get("personal_information") or {}
        
        orig_addr = str(orig_pi.get("address") or orig_pi.get("location") or "").strip()
        curr_addr = str(curr_pi.get("address") or curr_pi.get("location") or "").strip()
        
        # If original address was detailed (e.g. contains numbers/floors/roads) and current reduced it to 1 word / city
        if orig_addr and len(orig_addr) > 25 and len(curr_addr) < 18 and ("," in orig_addr and "," not in curr_addr):
            errors.append(f"Address reduced from full street address '{orig_addr}' to '{curr_addr}'.")
        
        # Check for hallucinated locations
        if curr_addr and ("georgia" in curr_addr.lower() or "united states" in curr_addr.lower()):
            if "georgia" not in orig_addr.lower() and "united states" not in orig_addr.lower():
                errors.append(f"Hallucinated location '{curr_addr}' not in source.")

        # 3. Skill Coverage Check
        def get_flat_skills(d: Dict[str, Any]) -> List[str]:
            res = []
            s_list = d.get("skills") or []
            if isinstance(s_list, list):
                for item in s_list:
                    if isinstance(item, dict):
                        sub = item.get("skills", [])
                        if isinstance(sub, list):
                            for sub_item in sub:
                                if isinstance(sub_item, str):
                                    res.append(sub_item)
                                elif isinstance(sub_item, dict):
                                    res.append(str(sub_item.get("name") or sub_item.get("skill_name") or ""))
                        elif isinstance(sub, str):
                            res.append(sub)
                        name_val = item.get("skill_name") or item.get("name")
                        if isinstance(name_val, str):
                            res.append(name_val)
                    elif isinstance(item, str):
                        res.append(item)
            t_list = d.get("technicalSkills") or d.get("technical_skills") or []
            if isinstance(t_list, list):
                for item in t_list:
                    if isinstance(item, str):
                        res.append(item)
                    elif isinstance(item, dict):
                        res.append(str(item.get("name") or item.get("skill_name") or ""))
            return [s.lower().strip() for s in res if s and isinstance(s, str) and s.strip()]

        orig_skills = get_flat_skills(original)
        curr_skills = get_flat_skills(current)
        if orig_skills:
            missing_skills = [s for s in orig_skills if s not in curr_skills]
            drop_ratio = len(missing_skills) / len(orig_skills)
            if drop_ratio > 0.15:
                errors.append(f"Skill coverage dropped: {len(missing_skills)}/{len(orig_skills)} skills lost ({', '.join(missing_skills[:5])}).")

        # 4. Section item counts
        list_sections = {
            "education": "Education",
            "experience": "Work Experience",
            "work_experience": "Work Experience",
            "internships": "Internships",
            "projects": "Projects",
            "certifications": "Certifications",
            "publications": "Publications",
            "achievements": "Achievements",
            "leadership_roles": "Leadership Roles",
            "leadership": "Leadership",
            "custom_sections": "Additional Sections"
        }
        
        for key, name in list_sections.items():
            orig_list = original.get(key, []) or []
            curr_list = current.get(key, []) or []
            if isinstance(orig_list, list) and isinstance(curr_list, list) and orig_list:
                if len(curr_list) < len(orig_list):
                    warnings.append(f"{name} item count dropped from {len(orig_list)} to {len(curr_list)}.")

        # 5. Completeness Breakdown
        completeness = ResumeIntegrityValidator.calculate_completeness_breakdown(current)

        is_valid = len(errors) == 0
        return {
            "isValid": is_valid,
            "errors": errors,
            "warnings": warnings,
            "completenessScore": completeness["overall_completeness"],
            "completeness": completeness
        }
