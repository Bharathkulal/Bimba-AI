"""
ATS Engine Configuration
"""

ATS_ENGINE_VERSION = "1.0.0"

ATS_WEIGHTS = {
    "completeness": 15,
    "skills": 20,
    "experience": 15,
    "projects": 15,
    "education": 10,
    "certifications": 5,
    "keywords": 5,
    "formatting": 15, # Bumped formatting to 15 to make it 100 since original prompt had 10 which sums to 95. Wait, 15+20+15+15+10+5+5+10 = 95. So let's make formatting 15 to sum to 100.
}

assert sum(ATS_WEIGHTS.values()) == 100, f"ATS_WEIGHTS must sum to 100, currently sums to {sum(ATS_WEIGHTS.values())}"
