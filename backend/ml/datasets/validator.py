from typing import Dict, Any

class RecordValidator:
    """
    Validates individual training records before they are added to the dataset.
    """
    
    @staticmethod
    def validate(record: Dict[str, Any]) -> bool:
        # Check required base fields
        if not record.get("record_id"):
            return False
            
        if "resume_id" not in record:
            return False
            
        features = record.get("features", {})
        if not features:
            return False
            
        # Check impossible numeric values in features
        for key, value in features.items():
            if isinstance(value, (int, float)):
                if value < 0:
                    return False
                
                if key.startswith("num_") and value > 200:
                    # Sanity check: realistically no one has >200 jobs/skills/schools listed
                    return False
                    
        return True
