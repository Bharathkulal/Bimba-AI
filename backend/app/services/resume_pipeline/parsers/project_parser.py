import re
from typing import List, Dict, Any, Optional

URL_REGEX = re.compile(r'\b(?:https?://|www\.)[^\s<>"{}|\\^`]+', re.IGNORECASE)

class ProjectParser:
    """
    Modular Parser for Academic, Personal, and Open-Source Projects.
    Extracts project titles, tech stack parameters, and bullet-point descriptions.
    """

    @staticmethod
    def parse(lines: List[str]) -> List[Dict[str, Any]]:
        projects: List[Dict[str, Any]] = []
        curr_proj = None

        for line in lines:
            if "<TABLE>" in line or "</TABLE>" in line or "<TR-HEADER>" in line:
                continue

            l_str = re.sub(r'<[^>]+>', '', line).strip()
            if not l_str:
                continue

            # Check if line looks like a project title:
            # - Short line (< 120 chars)
            # - Has parentheses e.g. "Dental Shading (Python, OpenCV)" or colon "Project Name: Description"
            # - Starts with bold/title cues and is not a long descriptive sentence
            is_bullet = l_str.startswith(("•", "-", "*", "–", "—", ">", "+"))
            has_parentheses_tech = bool(re.search(r'\([A-Za-z0-9\s,\.\+#\-/]+\)', l_str))
            is_title_candidate = (len(l_str) < 110 and not l_str.endswith((".", ";")) and not is_bullet) or has_parentheses_tech

            if is_title_candidate or not curr_proj:
                if curr_proj:
                    projects.append(curr_proj)

                # Extract technologies in parentheses if present
                tech_match = re.search(r'\((.*?)\)', l_str)
                tech = tech_match.group(1).strip() if tech_match else ""
                title_clean = re.sub(r'\(.*?\)', '', l_str).strip(' -,|:•\t')

                description = ""
                for separator in [":", " - ", " – ", " — "]:
                    if separator in title_clean and len(title_clean.split(separator, 1)[0]) < 60:
                        parts = title_clean.split(separator, 1)
                        title_clean = parts[0].strip(' -,|:•\t')
                        description = parts[1].strip()
                        break

                # Extract project URL if present
                url_m = URL_REGEX.search(l_str)
                proj_url = url_m.group(0).strip() if url_m else ""

                curr_proj = {
                    "id": len(projects) + 1,
                    "title": title_clean or l_str,
                    "name": title_clean or l_str,
                    "technologies": [t.strip() for t in tech.split(',') if t.strip()] if tech else [],
                    "tech_stack": tech,
                    "duration": "",
                    "url": proj_url,
                    "github": proj_url if "github" in proj_url.lower() else "",
                    "description": description
                }
            elif curr_proj:
                clean_bullet = l_str.lstrip("•-*–—>+ ").strip()
                if curr_proj["description"]:
                    curr_proj["description"] += ("\n• " + clean_bullet if is_bullet else " " + clean_bullet)
                else:
                    curr_proj["description"] = "• " + clean_bullet if is_bullet else clean_bullet

        if curr_proj:
            projects.append(curr_proj)

        return projects
