import re
from typing import List, Dict, Any, Optional

YEAR_REGEX = re.compile(r'\b(19\d{2}|20\d{2})\b')

class AchievementParser:
    """
    Modular Parser for Awards, Honors, Competitions, Hackathons, and Recognitions.
    """

    @staticmethod
    def parse(lines: List[str]) -> List[Dict[str, Any]]:
        achievements: List[Dict[str, Any]] = []

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

            # Check title vs description
            title = clean_str
            description = ""
            if ":" in clean_str and len(clean_str.split(":", 1)[0]) < 50:
                parts = clean_str.split(":", 1)
                title = parts[0].strip()
                description = parts[1].strip()
            elif " - " in clean_str and len(clean_str.split(" - ", 1)[0]) < 50:
                parts = clean_str.split(" - ", 1)
                title = parts[0].strip()
                description = parts[1].strip()

            achievements.append({
                "id": len(achievements) + 1,
                "title": title,
                "description": description or clean_str,
                "year": year_val,
                "date": year_val,
                "organization": ""
            })

        return achievements
