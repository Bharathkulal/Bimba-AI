import os
import json
import random
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple
from app.core.mongodb import db
from ml.preprocessing.pii_remover import PIIRemover
from ml.preprocessing.cleaner import DataCleaner
from ml.features.extractor import FeatureExtractor
from ml.datasets.validator import RecordValidator
from ml.schemas.training_record import TrainingRecord, DatasetManifest

class DatasetBuilder:
    def __init__(self, dataset_version: str = "1.0.0", feature_version: str = "1.0.0", seed: int = 42):
        self.dataset_version = dataset_version
        self.feature_version = feature_version
        self.seed = seed
        self.output_dir = os.path.join(os.path.dirname(__file__), "..", "data", "processed")
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Fixed seed for reproducible splits
        random.seed(self.seed)
        
    def _split_data(self, records: List[Dict[str, Any]]) -> Tuple[List[Any], List[Any], List[Any]]:
        """
        70% Train, 15% Validation, 15% Test.
        Grouped by student_id to prevent data leakage.
        """
        # Group records by student_id
        student_groups = {}
        for r in records:
            # We fetch student_id from db doc since it's not in the record schema
            # Actually, let's keep it simple: we grouped beforehand or assume resume_id is unique per user for now
            # In Bimba AI, one student can have multiple resumes.
            s_id = r.get("_student_id", r.get("resume_id"))
            if s_id not in student_groups:
                student_groups[s_id] = []
            student_groups[s_id].append(r)
            
        group_keys = list(student_groups.keys())
        random.shuffle(group_keys)
        
        n = len(group_keys)
        train_idx = int(0.7 * n)
        val_idx = int(0.85 * n)
        
        train_keys = group_keys[:train_idx]
        val_keys = group_keys[train_idx:val_idx]
        test_keys = group_keys[val_idx:]
        
        train_records = []
        for k in train_keys:
            for r in student_groups[k]:
                r["split"] = "train"
                train_records.append(r)
                
        val_records = []
        for k in val_keys:
            for r in student_groups[k]:
                r["split"] = "validation"
                val_records.append(r)
                
        test_records = []
        for k in test_keys:
            for r in student_groups[k]:
                r["split"] = "test"
                test_records.append(r)
                
        return train_records, val_records, test_records

    def build_ats_prediction_dataset(self) -> None:
        """
        Builds the dataset for Resume Quality / ATS Prediction.
        NOTE: ATS scores currently in DB are deterministic, not human labeled.
        Model training is BLOCKED. This builds the pipeline structures only.
        """
        raw_resumes = list(db.resumes.find({}))
        records = []
        
        for index, doc in enumerate(raw_resumes):
            resume_data = doc.get("resume", {}) or {}
            
            # Extract label (ats_score)
            label = doc.get("ats_score", None)
            
            # Preprocess
            scrubbed = PIIRemover.clean(resume_data)
            cleaned = DataCleaner.clean(scrubbed)
            
            # Features
            features = FeatureExtractor.extract(cleaned)
            
            record_dict = {
                "record_id": f"rec_{doc.get('id', index)}_{self.dataset_version}",
                "resume_id": doc.get("id", index),
                "features": features,
                "label": label,
                "source": "Bimba_AI_Database",
                "dataset_version": self.dataset_version,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "_student_id": doc.get("student_id", index) # Internal grouping key
            }
            
            if RecordValidator.validate(record_dict):
                records.append(record_dict)
                
        # Split
        train, val, test = self._split_data(records)
        
        # Cleanup internal keys
        for r in train + val + test:
            r.pop("_student_id", None)
            
        final_records = train + val + test
        
        # Create manifest
        manifest = DatasetManifest(
            dataset_version=self.dataset_version,
            feature_version=self.feature_version,
            records=len(final_records),
            features=list(final_records[0]["features"].keys()) if final_records else [],
            label="ats_score",
            source="Bimba_AI_Database",
            created_at=datetime.now(timezone.utc).isoformat(),
            split={
                "train": len(train),
                "validation": len(val),
                "test": len(test)
            }
        )
        
        # Write files
        dataset_path = os.path.join(self.output_dir, f"resume_quality_dataset_v{self.dataset_version}.json")
        with open(dataset_path, "w") as f:
            json.dump(final_records, f, indent=2)
            
        manifest_path = os.path.join(self.output_dir, f"resume_quality_manifest_v{self.dataset_version}.json")
        with open(manifest_path, "w") as f:
            f.write(manifest.model_dump_json(indent=2))
            
        print(f"Successfully built dataset with {len(final_records)} valid records.")
        print(f"Splits -> Train: {len(train)}, Val: {len(val)}, Test: {len(test)}")
        print("Note: Model training is BLOCKED. Trustworthy labeled data required.")
