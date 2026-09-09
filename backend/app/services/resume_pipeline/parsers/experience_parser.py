import re
from typing import List, Dict, Any, Optional

DATE_SPAN_REGEX = re.compile(
    r'\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|'
    r'Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?|\d{4})'
    r'(?:\s*[\d,]*\s*[-–—/to\s]+\s*(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|'
    r'Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?|\d{4}|Present|Current))\b',
    re.IGNORECASE
)

ACTION_VERBS = [
    "architected", "developed", "engineered", "spearheaded", "designed", "built",
    "managed", "led", "created", "boosted", "grew", "optimized", "mentored",
    "achieved", "implemented", "formulated", "directed", "administered", "automated",
    "cleared", "published", "authored", "co-authored", "researched", "presented", "analyzed",
    "investigated", "conducted", "served", "leveraged", "acquired", "explored", "completed",
    "demonstrating", "contributing", "evaluating", "identifying", "maintained", "collaborated",
    "scaled", "drove", "reduced", "delivered", "supervised", "oversaw", "orchestrated",
    "transformed", "established", "headed", "headed", "monitored", "accelerated", "initiated"
]

TITLE_KEYWORDS = [
    "engineer", "developer", "manager", "architect", "lead", "consultant",
    "designer", "director", "coordinator", "intern", "analyst", "specialist",
    "administrator", "associate", "head", "officer", "executive", "fellow",
    "professor", "lecturer", "instructor", "researcher", "trainee", "vp", "president", "cto", "ceo", "coo"
]

class ExperienceParser:
    """
    Modular Parser for Work Experience, Professional History, and Roles.
    Distinguishes titles from companies, preserves bullet points, and parses date ranges.
    """

    @staticmethod
    def parse(lines: List[str]) -> List[Dict[str, Any]]:
        experiences: List[Dict[str, Any]] = []
        curr_exp = None

        for line in lines:
            if "<TABLE>" in line or "</TABLE>" in line or "<TR-HEADER>" in line:
                continue

            l_str = re.sub(r'<[^>]+>', '', line).strip()
            if not l_str:
                continue

            # Table row experience
            if "<TR>" in line:
                parts = [p.strip() for p in l_str.split("|")]
                if len(parts) >= 2:
                    if curr_exp: experiences.append(curr_exp)
                    curr_exp = {
                        "id": len(experiences) + 1,
                        "position": parts[0],
                        "role": parts[0],
                        "company": parts[1] if len(parts) > 1 else "",
                        "organization": parts[1] if len(parts) > 1 else "",
                        "duration": parts[2] if len(parts) > 2 else "",
                        "location": parts[3] if len(parts) > 3 else "",
                        "description": " ".join(parts[4:]) if len(parts) > 4 else "",
                        "is_current": "present" in (parts[2].lower() if len(parts) > 2 else "")
                    }
                continue

            # Detect Date Span
            date_match = DATE_SPAN_REGEX.search(l_str)
            has_company_separator = any(sep in l_str for sep in [" at ", " At ", " AT ", " @ ", "@", " - ", " – ", " — ", " | "])
            has_title_kw = any(re.search(r'\b' + re.escape(kw) + r'\b', l_str, re.IGNORECASE) for kw in TITLE_KEYWORDS)

            is_date_only_line = bool(date_match and len(l_str) < 55 and len(l_str.split()) <= 6 and not has_company_separator and not has_title_kw)

            first_word = l_str.split()[0].lower() if l_str.split() else ""
            first_word_clean = re.sub(r'[^a-z]', '', first_word)
            is_explicit_bullet = l_str.startswith(("•", "-", "*", "–", "—", ">", "+")) or (first_word_clean in ACTION_VERBS and not has_company_separator and not date_match)
            ends_with_period = l_str.endswith(".") and not any(l_str.endswith(abbr) for abbr in ["Inc.", "Corp.", "LLC.", "Ltd.", "Co."])

            if curr_exp:
                is_heading_candidate = (
                    not is_explicit_bullet and
                    not ends_with_period and
                    len(l_str) < 110 and
                    (has_company_separator or date_match)
                )
            else:
                is_heading_candidate = (
                    not is_explicit_bullet and
                    len(l_str) < 110 and
                    (has_company_separator or date_match or has_title_kw or not ends_with_period)
                )

            if is_heading_candidate:
                if curr_exp:
                    experiences.append(curr_exp)

                pos = l_str
                comp = ""
                dur = ""
                is_curr = False

                if date_match:
                    dur = date_match.group(0)
                    is_curr = "present" in dur.lower() or "current" in dur.lower()
                    pos = l_str[:date_match.start()].strip(' -,|:()')

                if " at " in pos.lower():
                    idx = pos.lower().find(" at ")
                    comp = pos[idx + 4:].strip(' -,|:')
                    pos = pos[:idx].strip(' -,|:')
                elif "@" in pos:
                    parts = pos.split("@", 1)
                    pos = parts[0].strip(' -,|:')
                    comp = parts[1].strip(' -,|:')
                elif " - " in pos or " | " in pos or " – " in pos or " — " in pos:
                    parts = re.split(r'[-–—|]', pos, maxsplit=1)
                    pos = parts[0].strip(' -,|:')
                    comp = parts[1].strip(' -,|:') if len(parts) > 1 else ""

                curr_exp = {
                    "id": len(experiences) + 1,
                    "position": pos,
                    "role": pos,
                    "company": comp,
                    "organization": comp,
                    "duration": dur,
                    "is_current": is_curr,
                    "location": "",
                    "description": ""
                }
            elif is_date_only_line:
                if curr_exp:
                    if not curr_exp["duration"]:
                        curr_exp["duration"] = l_str
                        curr_exp["is_current"] = "present" in l_str.lower() or "current" in l_str.lower()
                else:
                    curr_exp = {
                        "id": len(experiences) + 1,
                        "position": "Professional Role",
                        "role": "Professional Role",
                        "company": "",
                        "organization": "",
                        "duration": l_str,
                        "is_current": "present" in l_str.lower() or "current" in l_str.lower(),
                        "location": "",
                        "description": ""
                    }
            elif curr_exp:
                clean_bullet = l_str.lstrip("•-*–—>+ ").strip()
                if curr_exp["description"]:
                    curr_exp["description"] += ("\n• " + clean_bullet if is_explicit_bullet else " " + clean_bullet)
                else:
                    curr_exp["description"] = "• " + clean_bullet if is_explicit_bullet else clean_bullet
            else:
                # First line fallback
                curr_exp = {
                    "id": len(experiences) + 1,
                    "position": l_str,
                    "role": l_str,
                    "company": "",
                    "organization": "",
                    "duration": "",
                    "is_current": False,
                    "location": "",
                    "description": ""
                }

        if curr_exp:
            experiences.append(curr_exp)

        return experiences
