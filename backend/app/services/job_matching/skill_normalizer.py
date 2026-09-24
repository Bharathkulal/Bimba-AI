import re
from typing import Dict, Any, List

class SkillNormalizer:
    # A lightweight deterministic alias map to protect against false positive/negative matches
    ALIAS_MAP = {
        "reactjs": "react",
        "react.js": "react",
        "react js": "react",
        "node.js": "node js",
        "nodejs": "node js",
        "vue.js": "vue",
        "vuejs": "vue",
        "python 3": "python",
        "python programming": "python",
        "mongo": "mongodb",
        "mongo db": "mongodb",
        "machine learning": "ml",
        "artificial intelligence": "ai",
        "fast api": "fastapi",
        "aws": "amazon web services",
        "gcp": "google cloud platform",
        "k8s": "kubernetes",
        "ts": "typescript",
        "js": "javascript",
        "postgres": "postgresql",
    }
    
    # Explicit non-equivalents that naive substring match might confuse
    # e.g., "Java" in "JavaScript"
    PROTECTED_TERMS = ["java", "javascript", "c", "c++", "c#", "react", "react native", "aws", "azure", "mysql", "postgresql", "sql", "nosql"]

    @staticmethod
    def normalize(skill: str) -> str:
        """
        Takes a raw skill string and normalizes it to a canonical lower-case format.
        """
        if not skill:
            return ""
        
        normalized = skill.lower().strip()
        # Remove common punctuation artifacts like trailing dots or extra spaces
        normalized = re.sub(r'[\.,;:]$', '', normalized)
        normalized = re.sub(r'\s+', ' ', normalized)
        
        # Replace aliases
        if normalized in SkillNormalizer.ALIAS_MAP:
            return SkillNormalizer.ALIAS_MAP[normalized]
            
        return normalized

    @staticmethod
    def is_match(required_skill: str, candidate_skill: str) -> bool:
        """
        Deterministically checks if a candidate skill matches a required skill.
        Prevents false matches (e.g. Java matching JavaScript).
        """
        req_norm = SkillNormalizer.normalize(required_skill)
        can_norm = SkillNormalizer.normalize(candidate_skill)
        
        if req_norm == can_norm:
            return True
            
        # If it's a protected term, require exact match (no substring)
        if req_norm in SkillNormalizer.PROTECTED_TERMS:
            # E.g. req="java", can="javascript" -> false
            # Only true if req_norm == can_norm
            return req_norm == can_norm
            
        # Otherwise, allow substring match if word boundaries are respected
        # e.g., req="python", can="python developer" -> True
        if re.search(r'\b' + re.escape(req_norm) + r'\b', can_norm):
            return True
            
        return False
