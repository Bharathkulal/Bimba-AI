from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class DatasetManifest(BaseModel):
    dataset_version: str
    feature_version: str
    records: int
    features: List[str]
    label: Optional[str]
    source: str
    created_at: str
    split: Dict[str, int]

class TrainingRecord(BaseModel):
    record_id: str
    resume_id: int
    features: Dict[str, Any]
    label: Optional[float] = None
    source: str = "Bimba_AI_Database"
    dataset_version: str = "1.0.0"
    created_at: str
    
    # Internal flag to trace split assignment, not part of actual feature array
    split: Optional[str] = None
