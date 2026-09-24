import re

SCORE_REGEX = re.compile(
    r'\b(?:CGPA|GPA|Score|Percentage|Aggregate|Marks)?\s*[:\-]?\s*'
    r'(\d{1,2}(?:\.\d{1,3})?\s*(?:/\s*(?:10(?:\.0)?|4(?:\.0)?|100))?%?|\d{2}(?:\.\d{1,2})?%)(?!\w)',
    re.IGNORECASE
)

print("9.05:", SCORE_REGEX.search("CGPA : 9.05"))

has_degree = any(re.search(pat, "M. Tech. in Computer Science", re.IGNORECASE) for pat in [r'\b(M\.?Tech)\b'])
print("has_degree:", has_degree)
