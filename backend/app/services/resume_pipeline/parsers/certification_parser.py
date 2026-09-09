import re
from typing import List, Dict, Any, Optional

CERT_PROVIDERS = [
    "SWAYAM", "NPTEL", "Coursera", "edX", "Udemy", "LinkedIn Learning", "AWS",
    "Amazon Web Services", "Microsoft", "Google", "IBM", "Oracle", "Cisco",
    "Stanford Online", "Harvard Online", "MIT OpenCourseWare", "Udacity", "Datacamp"
]

YEAR_REGEX = re.compile(r'\b(19\d{2}|20\d{2})\b')

class CertificationParser:
    """
    Modular Parser for Certifications, Online Courses, and Accreditations.
    """

    @staticmethod
    def parse(lines: List[str]) -> List[Dict[str, Any]]:
        certifications: List[Dict[str, Any]] = []

        for line in lines:
            if "<TABLE>" in line or "</TABLE>" in line or "<TR-HEADER>" in line:
                continue

            l_str = re.sub(r'<[^>]+>', '', line).strip()
            if not l_str:
                continue

            # Remove leading bullet characters
            clean_str = l_str.lstrip("•-*–—>+ ").strip()

            # Detect provider
            provider = ""
            for prov in CERT_PROVIDERS:
                if re.search(r'\b' + re.escape(prov) + r'\b', clean_str, re.IGNORECASE):
                    provider = prov
                    break

            # Detect year / date
            year_match = YEAR_REGEX.search(clean_str)
            year_val = year_match.group(0).strip() if year_match else ""

            # Detect title
            title = clean_str
            if " - " in clean_str or " – " in clean_str or " — " in clean_str or " | " in clean_str:
                parts = re.split(r'[-–—|]', clean_str)
                title = parts[0].strip()
                if len(parts) > 1 and not provider:
                    for p in parts[1:]:
                        for prov in CERT_PROVIDERS:
                            if prov.lower() in p.lower():
                                provider = prov
                                break
            elif ":" in clean_str:
                parts = clean_str.split(":", 1)
                title = parts[1].strip()
                if not provider and any(prov.lower() in parts[0].lower() for prov in CERT_PROVIDERS):
                    provider = parts[0].strip()

            if title:
                certifications.append({
                    "id": len(certifications) + 1,
                    "name": title,
                    "title": title,
                    "organization": provider,
                    "provider": provider,
                    "issuer": provider,
                    "issue_date": year_val,
                    "date": year_val,
                    "year": year_val,
                    "description": clean_str if clean_str != title else ""
                })

        return certifications
