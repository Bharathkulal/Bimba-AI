import re
from typing import List, Dict, Any, Optional

YEAR_REGEX = re.compile(r'\b(19\d{2}|20\d{2})\b')

class PublicationParser:
    """
    Modular Parser for Publications, Research Papers, Journal Articles, and Patents.
    """

    @staticmethod
    def parse(lines: List[str]) -> List[Dict[str, Any]]:
        publications: List[Dict[str, Any]] = []

        for line in lines:
            if "<TABLE>" in line or "</TABLE>" in line or "<TR-HEADER>" in line:
                continue

            l_str = re.sub(r'<[^>]+>', '', line).strip()
            if not l_str:
                continue

            clean_str = l_str.lstrip("•-*–—>+ ").strip()

            # Detect year
            year_match = YEAR_REGEX.search(clean_str)
            year_val = year_match.group(0).strip() if year_match else ""

            # Check publication type (Journal, Conference, Patent, Paper)
            pub_type = "Conference"
            if "journal" in clean_str.lower():
                pub_type = "Journal"
            elif "patent" in clean_str.lower():
                pub_type = "Patent"
            elif "book" in clean_str.lower() or "chapter" in clean_str.lower():
                pub_type = "Book Chapter"

            # Parse title, authors, publisher
            title = clean_str
            publisher = ""
            if " - " in clean_str or " | " in clean_str:
                parts = re.split(r'[-–—|]', clean_str)
                title = parts[0].strip()
                publisher = parts[1].strip() if len(parts) > 1 else ""
            elif "," in clean_str and len(clean_str.split(",")) >= 3:
                parts = clean_str.split(",")
                title = parts[0].strip()
                publisher = parts[1].strip()

            publications.append({
                "id": len(publications) + 1,
                "title": title,
                "publication_type": pub_type,
                "publisher": publisher,
                "year": year_val,
                "description": clean_str,
                "authorship_type": "Author"
            })

        return publications
