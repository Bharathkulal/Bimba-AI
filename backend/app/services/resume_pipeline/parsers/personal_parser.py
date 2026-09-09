import re
from typing import List, Dict, Any, Optional

EMAIL_REGEX = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b')
PHONE_REGEX = re.compile(r'(?:\+?\d{1,4}[-.\s]?)?\(?\d{2,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5}\b')
LINKEDIN_REGEX = re.compile(r'(?:https?://)?(?:www\.)?linkedin\.com/in/([a-zA-Z0-9_\-]+)', re.IGNORECASE)
GITHUB_REGEX = re.compile(r'(?:https?://)?(?:www\.)?github\.com/([a-zA-Z0-9_\-]+)', re.IGNORECASE)
URL_REGEX = re.compile(r'\b(?:https?://|www\.)[^\s<>"{}|\\^`]+', re.IGNORECASE)

class PersonalParser:
    """
    Modular Parser for Personal, Contact, and Location information.
    Works generically across any name, address format, and international contact pattern.
    """

    @staticmethod
    def parse(header_lines: List[str], all_lines: List[str]) -> Dict[str, Any]:
        full_text = "\n".join(all_lines)
        top_text = "\n".join(header_lines[:15]) if header_lines else "\n".join(all_lines[:15])

        # 1. Email Extraction
        email = ""
        email_matches = EMAIL_REGEX.findall(full_text)
        if email_matches:
            email = email_matches[0].strip()

        # 2. Phone Extraction
        phone = ""
        for match in re.finditer(r'\+?[\d\s\-\(\)]{8,20}\d', full_text):
            val = match.group(0).strip()
            digits = re.sub(r'\D', '', val)
            if 7 <= len(digits) <= 15:
                # Avoid matching lone graduation years e.g. 2020-2024
                if not re.match(r'^(?:19|20)\d{2}[-\s](?:19|20)\d{2}$', val.strip()):
                    phone = val
                    break

        # 3. LinkedIn & GitHub
        linkedin = ""
        li_match = LINKEDIN_REGEX.search(full_text)
        if li_match:
            linkedin = li_match.group(0).strip()
            if not linkedin.startswith("http"):
                linkedin = "https://" + linkedin

        github = ""
        gh_match = GITHUB_REGEX.search(full_text)
        if gh_match:
            github = gh_match.group(0).strip()
            if not github.startswith("http"):
                github = "https://" + github

        # 4. Portfolio / Website
        portfolio = ""
        other_links = []
        for u in URL_REGEX.findall(full_text):
            u_clean = u.strip('.,;()[]')
            if "linkedin" not in u_clean.lower() and "github" not in u_clean.lower():
                if not portfolio:
                    portfolio = u_clean
                else:
                    other_links.append(u_clean)

        # 5. Full Address Extraction (No hardcoded city or person names!)
        address = ""
        addr_match = re.search(
            r'(?:address|location|residence|contact address)\s*[:\-]\s*([^\n|]+(?:\n[^\n|]+){0,3})',
            full_text,
            re.IGNORECASE
        )
        if addr_match:
            raw_addr_lines = addr_match.group(1).split('\n')
            clean_parts = []
            for a_line in raw_addr_lines:
                a_strip = a_line.strip(' -,|')
                a_lower = a_strip.lower()
                # Stop if hitting another major section header
                if any(k in a_lower for k in ["objective", "summary", "experience", "education", "skills", "projects", "email:", "phone:"]):
                    break
                if a_strip:
                    clean_parts.append(a_strip)
            if clean_parts:
                address = " ".join(clean_parts)

        if not address:
            # Check lines for postal/address patterns (PIN/ZIP codes, street indicators, country)
            addr_parts = []
            search_lines = header_lines if header_lines else all_lines[:10]
            for line in search_lines:
                l_str = line.strip()
                l_clean = l_str
                if email:
                    l_clean = l_clean.replace(email, "")
                if phone:
                    l_clean = l_clean.replace(phone, "")
                l_clean = re.sub(r'[\u2022\u25cf\u25cb\u25a0\u25a1\uf0b7\u25ba\u2192|•]', ' ', l_clean).strip(' -,|')

                # Check generic address keywords
                has_addr_signal = bool(re.search(r'\b(pin|pin code|zip|zip code|postal|street|road|st\.|ave|avenue|blvd|lane|cross|nagar|taluk|district|state|city|country|india|usa|uk|canada|germany|singapore|australia)\b', l_clean, re.IGNORECASE))
                has_pincode = bool(re.search(r'\b\d{5,6}\b', l_clean))

                if has_addr_signal or has_pincode:
                    if not any(k in l_clean.lower() for k in ["objective", "summary", "experience", "education", "skills", "projects", "b.tech", "b.e", "engineer", "developer"]):
                        if len(l_clean) > 3:
                            addr_parts.append(l_clean)
                elif addr_parts:
                    break

            if addr_parts:
                address = " ".join(addr_parts)

        # 6. Candidate Name Extraction
        name = ""
        # Inspect top lines of header
        candidate_lines = header_lines[:8] if header_lines else all_lines[:8]
        for l in candidate_lines:
            l_clean = re.sub(r'<[^>]+>', '', l).strip()
            if not l_clean:
                continue
            # Remove email, phone, links from candidate line
            if email:
                l_clean = l_clean.replace(email, "")
            if phone:
                l_clean = l_clean.replace(phone, "")
            l_clean = re.sub(r'https?://[^\s]+', '', l_clean).strip(' -,|•\t')

            if not l_clean or len(l_clean) > 60:
                continue

            # Check if line looks like a person's name (2 to 4 words, alphabetic, title-cased or upper-cased)
            words = [w for w in re.split(r'\s+', l_clean) if w.strip()]
            if 1 <= len(words) <= 5:
                # Exclude obvious non-name headings
                l_lower = l_clean.lower()
                non_name = [
                    "resume", "curriculum", "vitae", "cv", "page", "contact", "email",
                    "phone", "address", "summary", "profile", "objective", "experience",
                    "education", "skills", "projects", "certifications", "engineer", "developer"
                ]
                if not any(kw in l_lower for kw in non_name):
                    # Check character composition (mostly letters)
                    letters_count = sum(1 for c in l_clean if c.isalpha() or c in " .'-")
                    if letters_count / len(l_clean) > 0.85:
                        name = l_clean
                        break

        # Fallback name from email if not found
        if not name and email:
            uname = email.split('@')[0]
            uname_clean = re.sub(r'\d+', '', uname).replace('.', ' ').replace('_', ' ').replace('-', ' ').strip()
            if len(uname_clean) >= 3:
                name = " ".join(w.capitalize() for w in uname_clean.split())

        if not name:
            name = "Candidate Name"

        return {
            "name": name,
            "full_name": name,
            "email": email,
            "phone": phone,
            "address": address,
            "location": address,
            "linkedin": linkedin,
            "github": github,
            "portfolio": portfolio,
            "website": portfolio,
            "other_links": other_links,
            "title": ""
        }
