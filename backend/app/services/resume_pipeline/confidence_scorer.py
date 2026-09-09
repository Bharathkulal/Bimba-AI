import re
from typing import Dict, Any, List

class ConfidenceScorer:
    """
    Phase 9 & Phase 17 — Two Separate Scoring Engines:
    1. Extraction Confidence Score: Reliability of structured parsing (lack of ambiguity, completeness).
    2. Content Preservation Score: Survival of source document words, entities, and facts into structured data.
    """

    @staticmethod
    def calculate_scores(
        source_text: str,
        structured_data: Dict[str, Any],
        raw_extraction_confidence: float = 1.0
    ) -> Dict[str, Any]:
        extraction_conf = ConfidenceScorer._compute_extraction_confidence(structured_data, raw_extraction_confidence)
        preservation_score, coverage_breakdown = ConfidenceScorer._compute_preservation_score(source_text, structured_data)

        section_scores = ConfidenceScorer._compute_section_confidence_breakdown(structured_data)

        return {
            "extraction_confidence_score": float(round(extraction_conf, 2)),
            "content_preservation_score": float(round(preservation_score, 2)),
            "needs_human_review": (extraction_conf < 75.0 or preservation_score < 85.0),
            "review_reasons": ConfidenceScorer._get_review_reasons(extraction_conf, preservation_score, structured_data),
            "section_confidences": section_scores,
            "coverage_breakdown": coverage_breakdown
        }

    @staticmethod
    def _compute_extraction_confidence(structured_data: Dict[str, Any], base_raw_conf: float) -> float:
        score = 100.0 * min(1.0, max(0.5, base_raw_conf))
        pi = structured_data.get("personal_info") or {}

        # Deduct for missing essential contact fields
        if not pi.get("name") or pi.get("name") == "Candidate Name":
            score -= 15.0
        if not pi.get("email"):
            score -= 15.0
        if not pi.get("phone"):
            score -= 10.0

        # Check for vague placeholder company/institution names
        edu = structured_data.get("education") or []
        for e in edu:
            inst = (e.get("institution") or "").lower()
            if inst in ["institution", "university", "college", "school", "unknown"]:
                score -= 10.0

        exp = structured_data.get("work_experience") or structured_data.get("experience") or []
        for x in exp:
            comp = (x.get("company") or "").lower()
            if comp in ["company", "employer", "organization", "unknown"]:
                score -= 10.0

        return max(10.0, min(100.0, score))

    @staticmethod
    def _compute_preservation_score(source_text: str, structured_data: Dict[str, Any]) -> tuple:
        if not source_text or not source_text.strip():
            return 100.0, {}

        # Extract words from source (filtering short punctuation/stop words)
        source_words = set(re.findall(r'\b[A-Za-z0-9+#.-]{3,}\b', source_text.lower()))
        if not source_words:
            return 100.0, {}

        # Extract words from structured data dump
        structured_dump = str(structured_data).lower()
        structured_words = set(re.findall(r'\b[A-Za-z0-9+#.-]{3,}\b', structured_dump))

        # Check overlap
        survived_words = source_words.intersection(structured_words)
        preservation_ratio = len(survived_words) / len(source_words)
        preservation_percentage = float(round(preservation_ratio * 100.0, 1))

        breakdown = {
            "source_tokens_count": len(source_words),
            "preserved_tokens_count": len(survived_words),
            "preservation_percentage": preservation_percentage
        }

        return preservation_percentage, breakdown

    @staticmethod
    def _compute_section_confidence_breakdown(structured_data: Dict[str, Any]) -> Dict[str, Any]:
        conf: Dict[str, Any] = {}

        # Personal Info
        pi = structured_data.get("personal_info") or {}
        p_score = 100
        if not pi.get("name") or pi.get("name") == "Candidate Name": p_score -= 30
        if not pi.get("email"): p_score -= 30
        if not pi.get("phone"): p_score -= 20
        conf["personal_info"] = {"score": max(0, p_score), "status": "confident" if p_score >= 80 else "needs_review"}

        # Education
        edu = structured_data.get("education") or []
        e_score = 100 if edu else 50
        conf["education"] = {"score": e_score, "item_count": len(edu)}

        # Experience
        exp = structured_data.get("work_experience") or structured_data.get("experience") or []
        x_score = 100 if exp else 50
        conf["experience"] = {"score": x_score, "item_count": len(exp)}

        # Skills
        sk = structured_data.get("technicalSkills") or structured_data.get("skills") or []
        s_score = 100 if len(sk) >= 3 else (60 if sk else 30)
        conf["skills"] = {"score": s_score, "item_count": len(sk)}

        # Projects
        proj = structured_data.get("projects") or []
        conf["projects"] = {"score": 100 if proj else 50, "item_count": len(proj)}

        return conf

    @staticmethod
    def _get_review_reasons(extraction_conf: float, preservation_score: float, structured_data: Dict[str, Any]) -> List[str]:
        reasons = []
        if extraction_conf < 75.0:
            reasons.append(f"Extraction confidence is {extraction_conf:.1f}%. Some contact or institution fields may be incomplete.")
        if preservation_score < 85.0:
            reasons.append(f"Content preservation is {preservation_score:.1f}%. Some sections or details from the original document may need verification.")
        
        pi = structured_data.get("personal_info") or {}
        if not pi.get("email"):
            reasons.append("Email address could not be automatically confirmed.")
        if not pi.get("phone"):
            reasons.append("Phone number could not be automatically confirmed.")

        return reasons
