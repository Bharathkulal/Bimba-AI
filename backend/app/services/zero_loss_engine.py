import re
from typing import Dict, Any, List

class ZeroLossEngine:
    @staticmethod
    def normalize_to_internal_model(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Converts any parsed resume JSON into the required internal data model.
        """
        if not isinstance(data, dict):
            data = {}

        # 1. Map personal info to personal_information and contact_information
        pi = data.get("personal_info") or data.get("personal_information") or {}
        if not isinstance(pi, dict):
            pi = {}

        personal_info = {
            "name": pi.get("name") or "Candidate Name",
            "date_of_birth": pi.get("date_of_birth") or "",
            "gender": pi.get("gender") or "",
            "nationality": pi.get("nationality") or "",
            "mother_tongue": pi.get("mother_tongue") or ""
        }

        contact_info = {
            "email": pi.get("email") or "",
            "phone": pi.get("phone") or "",
            "address": pi.get("address") or pi.get("location") or "",
            "linkedin": pi.get("linkedin") or "",
            "github": pi.get("github") or "",
            "portfolio": pi.get("portfolio") or pi.get("website") or ""
        }

        # 2. Handle skills grouping
        skills_raw = data.get("skills") or []
        tech_skills_raw = data.get("technicalSkills") or []
        soft_skills_raw = data.get("softSkills") or []
        tools_raw = data.get("tools") or []

        # Merge basic lists
        all_skills = list(skills_raw)
        for s in tech_skills_raw:
            if s not in all_skills:
                all_skills.append(s)

        skills_model = {
            "programming_languages": [],
            "frontend": [],
            "backend": [],
            "databases": [],
            "frameworks": [],
            "tools": tools_raw if isinstance(tools_raw, list) else [],
            "cloud": [],
            "machine_learning": [],
            "other": all_skills if isinstance(all_skills, list) else []
        }

        # Classify basic skills into groups if possible
        programming_keywords = ["python", "c", "c++", "c#", "java", "javascript", "typescript", "golang", "rust", "ruby", "php", "sql"]
        frontend_keywords = ["react", "vue", "angular", "html", "css", "tailwind", "bootstrap", "next.js"]
        backend_keywords = ["node.js", "express", "fastapi", "flask", "django", "spring boot"]
        db_keywords = ["mysql", "postgresql", "mongodb", "redis", "sqlite", "firebase"]
        cloud_keywords = ["aws", "azure", "gcp", "docker", "kubernetes", "cloud computing"]
        ml_keywords = ["machine learning", "deep learning", "tensorflow", "pytorch", "nlp", "computer vision"]

        for skill in list(skills_model["other"]):
            s_lower = str(skill).lower().strip()
            if any(k == s_lower or s_lower.startswith(k + " ") for k in programming_keywords):
                skills_model["programming_languages"].append(skill)
                skills_model["other"].remove(skill)
            elif any(k in s_lower for k in frontend_keywords):
                skills_model["frontend"].append(skill)
                skills_model["other"].remove(skill)
            elif any(k in s_lower for k in backend_keywords):
                skills_model["backend"].append(skill)
                skills_model["other"].remove(skill)
            elif any(k in s_lower for k in db_keywords):
                skills_model["databases"].append(skill)
                skills_model["other"].remove(skill)
            elif any(k in s_lower for k in cloud_keywords):
                skills_model["cloud"].append(skill)
                skills_model["other"].remove(skill)
            elif any(k in s_lower for k in ml_keywords):
                skills_model["machine_learning"].append(skill)
                skills_model["other"].remove(skill)

        # 3. Handle standard list categories
        def get_clean_list(key: str) -> List[Any]:
            val = data.get(key) or []
            return list(val) if isinstance(val, list) else []

        normalized = {
            "personal_information": personal_info,
            "contact_information": contact_info,
            "objective": data.get("objective") or data.get("summary") or "",
            "work_experience": get_clean_list("experience") or get_clean_list("work_experience"),
            "education": get_clean_list("education"),
            "skills": skills_model,
            "internships": get_clean_list("internships"),
            "projects": get_clean_list("projects"),
            "certifications": get_clean_list("certifications"),
            "research_projects": get_clean_list("research_projects"),
            "publications": get_clean_list("publications"),
            "research_articles": get_clean_list("research_articles"),
            "achievements": get_clean_list("achievements"),
            "leadership": get_clean_list("leadership"),
            "personal_skills": soft_skills_raw if isinstance(soft_skills_raw, list) else [],
            "hobbies_interests": get_clean_list("hobbies") or get_clean_list("hobbies_interests"),
            "languages": get_clean_list("languages"),
            "awards": get_clean_list("awards"),
            "extracurricular_activities": get_clean_list("activities") or get_clean_list("extracurricular_activities") or get_clean_list("volunteerExperience"),
            "additional_sections": get_clean_list("custom_sections") or get_clean_list("additional_sections"),
            
            # Backwards compatibility fields
            "personal_info": {
                "name": personal_info["name"],
                "email": contact_info["email"],
                "phone": contact_info["phone"],
                "address": contact_info["address"],
                "linkedin": contact_info["linkedin"],
                "github": contact_info["github"],
                "portfolio": contact_info["portfolio"],
                "title": data.get("title") or pi.get("title") or ""
            },
            "experience": get_clean_list("experience") or get_clean_list("work_experience"),
            "technicalSkills": all_skills,
            "softSkills": soft_skills_raw,
            "hobbies": get_clean_list("hobbies") or get_clean_list("hobbies_interests")
        }


        # Build Source Content Registry
        facts = ZeroLossEngine.build_fact_registry(normalized)
        normalized["source_content"] = {
            "all_sections": list(normalized.keys()),
            "all_facts": facts
        }

        return normalized

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
            if not val_str:
                return
            facts.append({
                "fact_id": f"FACT-{fact_id_counter:03d}",
                "category": category,
                "field": field,
                "value": val_str,
                "source_text": val_str,
                "source_page": 1
            })
            fact_id_counter += 1

        # Personal and contact info
        for field, val in normalized_data.get("personal_information", {}).items():
            if val: add_fact("personal_information", val, field)
        for field, val in normalized_data.get("contact_information", {}).items():
            if val: add_fact("contact_information", val, field)

        # Objective
        if normalized_data.get("objective"):
            add_fact("objective", normalized_data["objective"])

        # Education
        for idx, edu in enumerate(normalized_data.get("education", [])):
            if not isinstance(edu, dict): continue
            for field in ["institution", "degree", "passing_year", "year", "cgpa_percentage", "cgpa", "location"]:
                if edu.get(field):
                    add_fact(f"education_{idx+1}", edu[field], field)

        # Work Experience
        for idx, exp in enumerate(normalized_data.get("work_experience", [])):
            if not isinstance(exp, dict): continue
            for field in ["company", "position", "duration", "location", "description"]:
                if exp.get(field):
                    add_fact(f"work_experience_{idx+1}", exp[field], field)

        # Internships
        for idx, intern in enumerate(normalized_data.get("internships", [])):
            if not isinstance(intern, dict): continue
            for field in ["company", "role", "duration", "location", "description"]:
                if intern.get(field):
                    add_fact(f"internship_{idx+1}", intern[field], field)

        # Projects
        for idx, proj in enumerate(normalized_data.get("projects", [])):
            if not isinstance(proj, dict): continue
            for field in ["name", "title", "description", "tech_stack", "duration"]:
                if proj.get(field):
                    add_fact(f"project_{idx+1}", proj[field], field)

        # Skills profile
        skills = normalized_data.get("skills", {})
        if isinstance(skills, dict):
            for group, group_skills in skills.items():
                if isinstance(group_skills, list):
                    for s in group_skills:
                        add_fact("skills", s, group)

        # Certifications
        for idx, cert in enumerate(normalized_data.get("certifications", [])):
            if not isinstance(cert, dict):
                add_fact("certifications", cert)
                continue
            for field in ["name", "organization", "description"]:
                if cert.get(field):
                    add_fact(f"certification_{idx+1}", cert[field], field)

        # Other string list categories
        list_categories = {
            "achievements": "achievement",
            "personal_skills": "personal_skill",
            "hobbies_interests": "hobby_interest",
            "languages": "language",
            "awards": "award",
            "extracurricular_activities": "extracurricular_activity"
        }
        for key, cat_name in list_categories.items():
            for item in normalized_data.get(key, []):
                if item: add_fact(cat_name, item)

        # Additional sections / Custom sections
        for idx, sec in enumerate(normalized_data.get("additional_sections", [])):
            if not isinstance(sec, dict): continue
            name = sec.get("section_name") or sec.get("name") or "custom"
            content = sec.get("content") or []
            if name: add_fact(f"additional_section_{idx+1}_title", name)
            if isinstance(content, list):
                for item in content:
                    if item: add_fact(f"additional_section_{idx+1}_content", item)
            elif content:
                add_fact(f"additional_section_{idx+1}_content", content)

        return facts

    @staticmethod
    def validate_facts(original_facts: List[Dict[str, Any]], current_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates that all original facts are preserved in the current/enhanced resume JSON.
        Computes completeness score and status.
        """
        # Flatten current data to text representation for matching
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

            # Check exact or normalized substring presence in current flat text
            val_lower = val_str.lower()
            # Clean punctuation and spacing for more flexible checks (e.g. if formatting changed slightly)
            clean_val = re.sub(r'[^a-z0-9]', '', val_lower)
            clean_flat = re.sub(r'[^a-z0-9]', '', current_flat_text)

            if val_lower in current_flat_text or (clean_val and clean_val in clean_flat):
                preserved_count += 1
            else:
                missing_facts.append(fact)

        total_facts = len(original_facts)
        completeness = (preserved_count / total_facts * 100) if total_facts > 0 else 100.0

        status = "PASS" if len(missing_facts) == 0 else "FAIL"

        return {
            "total_source_facts": total_facts,
            "preserved_facts": preserved_count,
            "missing_facts": len(missing_facts),
            "modified_facts": 0,  # Included in missing/preservation logic
            "invented_facts": 0,
            "validation_status": status,
            "content_completeness": completeness,
            "missing_details": missing_facts
        }
