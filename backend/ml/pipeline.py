import json
import os
import sys
from ml.datasets.builder import DatasetBuilder

def generate_quality_report(dataset_path: str, manifest_path: str):
    print("========================================")
    print("DATASET QUALITY REPORT")
    print("========================================")
    
    if not os.path.exists(dataset_path) or not os.path.exists(manifest_path):
        print("Dataset files not found.")
        return
        
    with open(manifest_path, "r") as f:
        manifest = json.load(f)
        
    with open(dataset_path, "r") as f:
        dataset = json.load(f)
        
    print(f"Total valid records: {len(dataset)}")
    print(f"Features count: {len(manifest['features'])}")
    print(f"Label: {manifest['label']}")
    print(f"Train count: {manifest['split']['train']}")
    print(f"Validation count: {manifest['split']['validation']}")
    print(f"Test count: {manifest['split']['test']}")
    
    # Check for leakage
    train_resumes = set(r['resume_id'] for r in dataset if r['split'] == 'train')
    val_resumes = set(r['resume_id'] for r in dataset if r['split'] == 'validation')
    test_resumes = set(r['resume_id'] for r in dataset if r['split'] == 'test')
    
    leakage = train_resumes.intersection(val_resumes) or train_resumes.intersection(test_resumes) or val_resumes.intersection(test_resumes)
    
    if leakage:
        print(f"LEAKAGE DETECTED: {len(leakage)} resumes appear in multiple splits.")
    else:
        print("Potential leakage: NONE (Clean Split)")
        
    # Check PII (naive check)
    pii_found = 0
    for r in dataset:
        features = r.get("features", {})
        # Features should only contain numerics/categoricals. If any string looks like an email or phone, flag it.
        for val in features.values():
            if isinstance(val, str) and ("@" in val or "+1" in val):
                pii_found += 1
                
    print(f"PII detection summary: {pii_found} potential leaks found.")
    print("========================================\n")


def main():
    builder = DatasetBuilder(dataset_version="1.0.0", feature_version="1.0.0")
    print("Starting ML Pipeline...")
    builder.build_ats_prediction_dataset()
    
    dataset_path = os.path.join(builder.output_dir, "resume_quality_dataset_v1.0.0.json")
    manifest_path = os.path.join(builder.output_dir, "resume_quality_manifest_v1.0.0.json")
    
    generate_quality_report(dataset_path, manifest_path)

if __name__ == "__main__":
    main()
