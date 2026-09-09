import re
from typing import List, Dict, Any, Optional

class PersonalDetailsParser:
    """
    Modular Parser for Personal Details (Date of Birth, Father's Name, Gender, Nationality, Mother Tongue, Languages).
    """

    @staticmethod
    def parse(lines: List[str]) -> Dict[str, Any]:
        details = {
            "date_of_birth": "",
            "father_name": "",
            "mother_name": "",
            "gender": "",
            "nationality": "",
            "mother_tongue": "",
            "languages_known": []
        }

        full_text = "\n".join(lines)

        # 1. Date of Birth
        dob_m = re.search(r'(?:date of birth|dob|d\.o\.b)\s*[:\-]\s*([0-9]{1,2}[-/.][0-9]{1,2}[-/.][0-9]{2,4}|[A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}\s+[A-Za-z]+\s+\d{4})', full_text, re.IGNORECASE)
        if dob_m:
            details["date_of_birth"] = dob_m.group(1).strip()

        # 2. Father's Name
        father_m = re.search(r'(?:father(?:\'?s)?(?:\s+name)?)\s*[:\-]\s*([A-Za-z\s\.]+)', full_text, re.IGNORECASE)
        if father_m:
            val = father_m.group(1).split('\n')[0].strip(' -,|')
            if len(val) < 50:
                details["father_name"] = val

        # 3. Mother's Name
        mother_m = re.search(r'(?:mother(?:\'?s)?(?:\s+name)?)\s*[:\-]\s*([A-Za-z\s\.]+)', full_text, re.IGNORECASE)
        if mother_m:
            val = mother_m.group(1).split('\n')[0].strip(' -,|')
            if len(val) < 50:
                details["mother_name"] = val

        # 4. Gender
        gender_m = re.search(r'\bgender\s*[:\-]\s*(Male|Female|Non-binary|Other)\b', full_text, re.IGNORECASE)
        if gender_m:
            details["gender"] = gender_m.group(1).capitalize()

        # 5. Nationality
        nat_m = re.search(r'\bnationality\s*[:\-]\s*([A-Za-z]+)', full_text, re.IGNORECASE)
        if nat_m:
            details["nationality"] = nat_m.group(1).capitalize()

        # 6. Mother Tongue
        mt_m = re.search(r'\bmother\s*tongue\s*[:\-]\s*([A-Za-z]+)', full_text, re.IGNORECASE)
        if mt_m:
            details["mother_tongue"] = mt_m.group(1).capitalize()

        # 7. Languages Known
        lang_m = re.search(r'(?:languages(?:\s+known|\s+spoken)?)\s*[:\-]\s*([^\n]+)', full_text, re.IGNORECASE)
        if lang_m:
            langs_raw = lang_m.group(1).strip()
            tokens = [l.strip() for l in re.split(r'[,|;•\t/]', langs_raw) if l.strip()]
            details["languages_known"] = tokens

        return details
