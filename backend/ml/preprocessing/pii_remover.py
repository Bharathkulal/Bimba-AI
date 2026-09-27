from typing import Dict, Any

class PIIRemover:
    """
    Strips personally identifiable information from resume data 
    before it enters the feature extraction or training pipeline.
    """
    
    PII_FIELDS = {
        "name", "email", "phone", "address", "location", 
        "linkedin", "github", "portfolio", "website",
        "father_name", "mother_name", "date_of_birth"
    }

    @staticmethod
    def clean(resume_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Recursively remove keys that match PII field names.
        """
        return PIIRemover._recursive_clean(resume_data)

    @staticmethod
    def _recursive_clean(data: Any) -> Any:
        if isinstance(data, dict):
            cleaned_dict = {}
            for k, v in data.items():
                if k.lower() in PIIRemover.PII_FIELDS:
                    continue
                # Also scrub nested personal_info block if it exists
                if k.lower() == "personal_info":
                    cleaned_dict[k] = {"scrubbed": True}
                    continue
                cleaned_dict[k] = PIIRemover._recursive_clean(v)
            return cleaned_dict
        elif isinstance(data, list):
            return [PIIRemover._recursive_clean(item) for item in data]
        else:
            return data
