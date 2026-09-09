import re
from typing import List, Dict, Any, Optional

DEGREE_PATTERNS = [
    r'\b(Ph\.?D|Doctor of Philosophy|Post\s*Doctorate)\b',
    r'\b(M\.?Tech|B\.?Tech|B\.?E\.?|M\.?E\.?|M\.?S\.?|B\.?S\.?|B\.?Sc|M\.?Sc|BCA|MCA|BBA|MBA|B\.?Com|M\.?Com)\b',
    r'\b(Bachelor of Technology|Bachelor of Engineering|Master of Technology|Master of Science|Bachelor of Science|Master of Computer Applications|Bachelor of Computer Applications)\b',
    r'\b(Bachelor\'?s|Master\'?s|Doctorate|Associate\'?s)\s*(?:Degree|of\s+[A-Za-z\s]+)?\b',
    r'\b(Class\s*XII|Class\s*X|12th\s*Grade|10th\s*Grade|Senior\s*Secondary|Higher\s*Secondary|Secondary\s*School|SSLC|PUC|Pre-University|CBSE|ICSE|State\s*Board|High\s*School|Diploma)\b'
]

SCORE_REGEX = re.compile(
    r'\b(?:CGPA|GPA|Score|Percentage|Aggregate|Marks)?\s*[:\-]?\s*'
    r'(\d{1,2}(?:\.\d{1,3})?\s*(?:/\s*(?:10(?:\.0)?|4(?:\.0)?|100))?%?|\d{2}(?:\.\d{1,2})?%)\b',
    re.IGNORECASE
)

YEAR_REGEX = re.compile(r'\b(19\d{2}|20\d{2})(?:\s*[-–—/]\s*(19\d{2}|20\d{2}|Present|Current))?\b', re.IGNORECASE)

class EducationParser:
    """
    Modular Parser for Academic Background & Educational Qualifications.
    Parses both tabular structures and free-form paragraphs/bullet points.
    """

    @staticmethod
    def parse(lines: List[str]) -> List[Dict[str, Any]]:
        education_list: List[Dict[str, Any]] = []

        # 1. Check for Table Rows
        table_rows = [l for l in lines if "<TR>" in l or "<TR-HEADER>" in l]
        if table_rows:
            parsed_tables = EducationParser._parse_table_rows(lines)
            if parsed_tables:
                return parsed_tables

        # 2. Parse text lines
        curr_edu = None

        for line in lines:
            if "<TABLE>" in line or "</TABLE>" in line or "<TR-HEADER>" in line:
                continue

            l_str = re.sub(r'<[^>]+>', '', line).strip()
            if not l_str:
                continue

            # Check if line contains a degree pattern
            has_degree = any(re.search(pat, l_str, re.IGNORECASE) for pat in DEGREE_PATTERNS)
            is_new_entry = has_degree and (not curr_edu or len(curr_edu.get("degree", "")) > 0)

            # Score detection
            score_match = SCORE_REGEX.search(l_str)
            score_val = score_match.group(0).strip() if score_match else ""

            # Year detection
            year_match = YEAR_REGEX.search(l_str)
            year_val = year_match.group(0).strip() if year_match else ""

            if has_degree or is_new_entry:
                if curr_edu:
                    education_list.append(curr_edu)

                degree_title = ""
                for pat in DEGREE_PATTERNS:
                    m = re.search(pat, l_str, re.IGNORECASE)
                    if m:
                        degree_title = m.group(0).strip()
                        break

                inst_part = l_str
                if degree_title:
                    inst_part = l_str.replace(degree_title, "").strip(' -,|:•\t')

                if score_val:
                    inst_part = inst_part.replace(score_val, "").strip(' -,|:•\t')
                if year_val:
                    inst_part = inst_part.replace(year_val, "").strip(' -,|:•\t')

                # Extract specialization if in parentheses or after 'in'
                spec = ""
                spec_m = re.search(r'\bin\s+([A-Za-z\s&]+)', l_str, re.IGNORECASE)
                if spec_m:
                    spec = spec_m.group(1).strip(' -,|()')

                curr_edu = {
                    "id": len(education_list) + 1,
                    "degree": degree_title or l_str,
                    "specialization": spec,
                    "field_of_study": spec,
                    "institution": inst_part or "",
                    "school": inst_part or "",
                    "university": inst_part or "",
                    "passing_year": year_val,
                    "year": year_val,
                    "start_date": year_val.split('-')[0].strip() if '-' in year_val else year_val,
                    "end_date": year_val.split('-')[1].strip() if '-' in year_val else year_val,
                    "score": score_val,
                    "cgpa_percentage": score_val,
                    "description": ""
                }
            elif curr_edu:
                # Add details to existing education record
                if score_val and not curr_edu["score"]:
                    curr_edu["score"] = score_val
                    curr_edu["cgpa_percentage"] = score_val
                if year_val and not curr_edu["passing_year"]:
                    curr_edu["passing_year"] = year_val
                    curr_edu["year"] = year_val

                clean_l = l_str
                if score_val: clean_l = clean_l.replace(score_val, "")
                if year_val: clean_l = clean_l.replace(year_val, "")
                clean_l = clean_l.strip(' -,|:•\t')

                if clean_l:
                    if not curr_edu["institution"]:
                        curr_edu["institution"] = clean_l
                        curr_edu["school"] = clean_l
                        curr_edu["university"] = clean_l
                    elif clean_l not in curr_edu["institution"]:
                        if curr_edu["description"]:
                            curr_edu["description"] += f" | {clean_l}"
                        else:
                            curr_edu["description"] = clean_l
            else:
                # First line without explicit degree keyword
                curr_edu = {
                    "id": len(education_list) + 1,
                    "degree": l_str,
                    "specialization": "",
                    "field_of_study": "",
                    "institution": "",
                    "school": "",
                    "university": "",
                    "passing_year": year_val,
                    "year": year_val,
                    "score": score_val,
                    "cgpa_percentage": score_val,
                    "description": ""
                }

        if curr_edu:
            education_list.append(curr_edu)

        return education_list

    @staticmethod
    def _parse_table_rows(lines: List[str]) -> List[Dict[str, Any]]:
        """Parses tabular education lines e.g. Course | Institution | Year | Score."""
        results = []
        headers = []

        for line in lines:
            l_clean = re.sub(r'<[^>]+>', '', line).strip()
            if "<TR-HEADER>" in line:
                headers = [h.strip().lower() for h in l_clean.split("|")]
                continue

            if "<TR>" in line:
                cells = [c.strip() for c in l_clean.split("|")]
                if not any(cells):
                    continue

                deg = ""
                inst = ""
                yr = ""
                sc = ""

                if headers and len(headers) == len(cells):
                    for h, val in zip(headers, cells):
                        if any(k in h for k in ["course", "degree", "qualification", "exam", "programme"]):
                            deg = val
                        elif any(k in h for k in ["institution", "school", "college", "university", "board"]):
                            inst = val
                        elif any(k in h for k in ["year", "passing", "session", "duration"]):
                            yr = val
                        elif any(k in h for k in ["score", "percentage", "cgpa", "marks", "grade"]):
                            sc = val
                else:
                    # Generic positional mapping
                    deg = cells[0] if len(cells) > 0 else ""
                    inst = cells[1] if len(cells) > 1 else ""
                    yr = cells[2] if len(cells) > 2 else ""
                    sc = cells[3] if len(cells) > 3 else ""

                if deg or inst:
                    results.append({
                        "id": len(results) + 1,
                        "degree": deg,
                        "specialization": "",
                        "field_of_study": "",
                        "institution": inst,
                        "school": inst,
                        "university": inst,
                        "passing_year": yr,
                        "year": yr,
                        "score": sc,
                        "cgpa_percentage": sc,
                        "description": ""
                    })

        return results
