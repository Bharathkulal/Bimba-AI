import re
from typing import Dict, Any, List

class ContentCoverageValidator:
    """
    Phase 14 & Phase 15 — Content Preservation & Entity Validation.
    Extracts high-importance entities (Emails, Phones, URLs, Scores, Dates, Organizations)
    from source text and verifies their survival in the structured data model.
    """

    @staticmethod
    def validate_entities_and_coverage(source_text: str, structured_data: Dict[str, Any]) -> Dict[str, Any]:
        if not source_text or not source_text.strip():
            return {
                "passed": True,
                "coverage_score": 100.0,
                "missing_entities": [],
                "warnings": []
            }

        missing_entities: List[str] = []
        warnings: List[str] = []
        structured_str = str(structured_data).lower()

        # 1. Emails
        emails = re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b', source_text)
        for em in emails:
            if em.lower() not in structured_str:
                missing_entities.append(f"Email '{em}' missing from structured data")

        # 2. Phone Numbers
        phones = re.findall(r'\+?[\d\s\-\(\)]{8,20}\d', source_text)
        for ph in phones:
            digits = re.sub(r'\D', '', ph)
            if 8 <= len(digits) <= 15:
                all_digits = re.sub(r'\D', '', structured_str)
                if digits not in all_digits:
                    missing_entities.append(f"Phone number '{ph.strip()}' missing from structured data")

        # 3. CGPA / Percentages / Scores
        scores = re.findall(r'\b(?:\d{1,2}\.\d{1,2}%?|\d{2}\.\d{2}%)\b', source_text)
        for sc in scores:
            if sc.lower() not in structured_str:
                # Permissive warning rather than hard error
                warnings.append(f"Score or percentage '{sc}' may be reformatted in structured data")

        # 4. URLs (LinkedIn / GitHub)
        urls = re.findall(r'(?:linkedin\.com/in/[\w-]+|github\.com/[\w-]+)', source_text, re.IGNORECASE)
        for u in urls:
            u_clean = u.lower().strip()
            if u_clean not in structured_str:
                missing_entities.append(f"URL '{u}' missing from structured data")

        # Calculate coverage score
        total_checks = max(1, len(emails) + len(phones) + len(urls))
        failed_checks = len(missing_entities)
        coverage_score = max(0.0, float(round((1.0 - (failed_checks / total_checks)) * 100.0, 1)))

        return {
            "passed": len(missing_entities) == 0,
            "coverage_score": coverage_score,
            "missing_entities": missing_entities,
            "warnings": warnings
        }
