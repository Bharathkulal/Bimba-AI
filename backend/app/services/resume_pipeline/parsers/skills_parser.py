import re
from typing import List, Dict, Any, Optional

COMMON_SKILLS_CATALOGUE = [
    "Python", "JavaScript", "TypeScript", "React", "React Native", "Vue", "Angular",
    "Node.js", "Express", "FastAPI", "Flask", "Django", "Spring Boot", "Java", "C", "C++",
    "C#", "Golang", "Rust", "Ruby", "PHP", "HTML", "CSS", "Tailwind CSS", "Bootstrap",
    "SQL", "MySQL", "PostgreSQL", "MSSQL", "MongoDB", "Redis", "SQLite", "Firebase", "AWS",
    "Azure", "GCP", "Docker", "Kubernetes", "Git", "GitHub", "CI/CD", "Linux", "Ubuntu", "Windows",
    "RESTful API", "GraphQL", "Redux", "Jira", "Scrum", "Agile", "Microservices",
    "Machine Learning", "Data Science", "Deep Learning", "TensorFlow", "PyTorch",
    "OpenCV", "Scikit-learn", "Cloud Computing", "Fog Computing", "Natural Language Processing", "NLP",
    "Data Mining", "Data Structures", "Algorithms", "Computer Networks", "DBMS", "Operating Systems",
    "Canva", "Adobe Express", "Social Media Strategy", "Copywriting", "Paid Ads",
    "Analytics", "Influencer Outreach", "SEO", "Content Marketing", "Pandas", "NumPy",
    "PL/SQL", "Oracle", "Big Data", "Hadoop", "Spark", "Tableau", "Power BI", "Next.js"
]

class SkillsParser:
    """
    Modular Parser for Technical Skills, Soft Skills, and Categorized Competencies.
    Preserves categories, comma-separated tokens, and special character syntax (C++, C#, .NET).
    """

    @staticmethod
    def parse(skill_lines: List[str], full_text: str = "") -> Dict[str, Any]:
        categorized_skills: List[Dict[str, Any]] = []
        flat_skills: List[str] = []

        if skill_lines:
            merged_lines: List[str] = []
            for line in skill_lines:
                l_str = re.sub(r'<[^>]+>', '', line).strip()
                if not l_str:
                    continue
                if ":" in l_str or " - " in l_str:
                    parts = re.split(r'[:\-]', l_str, maxsplit=1)
                    cat_name = parts[0].strip(' •-*')
                    if len(cat_name.split()) <= 6:
                        merged_lines.append(l_str)
                    elif merged_lines:
                        merged_lines[-1] = merged_lines[-1] + " " + l_str
                    else:
                        merged_lines.append(l_str)
                elif merged_lines:
                    merged_lines[-1] = merged_lines[-1] + " " + l_str
                else:
                    merged_lines.append(l_str)

            for l_str in merged_lines:
                if ":" in l_str:
                    parts = l_str.split(":", 1)
                    category = parts[0].strip(' •-*')
                    skills_part = parts[1].strip()
                    tokens = [s.strip() for s in re.split(r'[,|;•\t]', skills_part) if s.strip()]
                    if tokens:
                        categorized_skills.append({
                            "category": category,
                            "skills": tokens
                        })
                        flat_skills.extend(tokens)
                else:
                    tokens = [s.strip() for s in re.split(r'[,|;•\t]', l_str) if s.strip() and len(s.strip()) < 40]
                    flat_skills.extend(tokens)

        # Match known catalogue skills in full text if not already captured
        search_text = (full_text + " " + " ".join(skill_lines)) if full_text else " ".join(skill_lines)
        for skill in COMMON_SKILLS_CATALOGUE:
            if skill == "C":
                pattern = r'(?<![A-Za-z0-9_+#])C(?![A-Za-z0-9_+#])'
            elif skill in ["C++", "C#"]:
                pattern = r'(?<![A-Za-z0-9_])' + re.escape(skill) + r'(?![A-Za-z0-9_])'
            else:
                escaped = r'\s+'.join(re.escape(w) for w in skill.split())
                pattern = r'(?<![A-Za-z0-9_])' + escaped + r'(?![A-Za-z0-9_])'

            if re.search(pattern, search_text, re.IGNORECASE):
                # Add to flat list if not case-insensitively present
                if not any(f.lower() == skill.lower() for f in flat_skills):
                    flat_skills.append(skill)

        # Deduplicate flat skills preserving original casing
        seen = set()
        unique_flat = []
        for s in flat_skills:
            s_clean = s.strip()
            s_lower = s_clean.lower()
            if s_lower and s_lower not in seen:
                seen.add(s_lower)
                unique_flat.append(s_clean)

        return {
            "categorized": categorized_skills,
            "flat": unique_flat
        }
