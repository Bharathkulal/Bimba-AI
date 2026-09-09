import re
from typing import List, Dict, Any

class AdditionalParser:
    """
    Modular Parser for Custom, Unclassified, and Additional Sections.
    Enforces Phase 8 Zero Data Loss Policy by preserving all text chunks.
    """

    @staticmethod
    def parse(custom_sections_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        preserved_sections: List[Dict[str, Any]] = []

        for sec in custom_sections_data:
            heading = sec.get("heading", "Additional Information")
            raw_content = sec.get("content", [])

            clean_items: List[str] = []
            if isinstance(raw_content, list):
                for item in raw_content:
                    clean_str = re.sub(r'<[^>]+>', '', str(item)).strip()
                    if clean_str:
                        clean_items.append(clean_str)
            elif isinstance(raw_content, str) and raw_content.strip():
                clean_items.append(raw_content.strip())

            if clean_items:
                preserved_sections.append({
                    "title": heading,
                    "section_name": heading,
                    "content": clean_items,
                    "original_context": "\n".join(clean_items)
                })

        return preserved_sections
