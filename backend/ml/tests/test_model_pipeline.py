import pytest
import os
import json
from ml.training.trainer import ModelTrainer
from ml.inference.predictor import ResumeQualityPredictor

@pytest.fixture
def dummy_dataset_and_manifest(tmp_path):
    dataset_path = os.path.join(tmp_path, "dataset.json")
    manifest_path = os.path.join(tmp_path, "manifest.json")
    
    # Create fake test fixture data (TEST FIXTURE ONLY - Not production training data)
    manifest = {
        "dataset_version": "0.0.0-test",
        "feature_version": "0.0.0-test",
        "records": 3,
        "features": ["num_skills", "has_summary"],
        "label": "test_score",
        "source": "test",
        "created_at": "2023-01-01",
        "split": {"train": 1, "validation": 1, "test": 1}
    }
    
    dataset = [
        {
            "record_id": "1",
            "split": "train",
            "features": {"num_skills": 10, "has_summary": 1},
            "label": 80.0
        },
        {
            "record_id": "2",
            "split": "validation",
            "features": {"num_skills": 5, "has_summary": 0},
            "label": 50.0
        },
        {
            "record_id": "3",
            "split": "test",
            "features": {"num_skills": 15, "has_summary": 1},
            "label": 95.0
        }
    ]
    
    with open(manifest_path, "w") as f:
        json.dump(manifest, f)
        
    with open(dataset_path, "w") as f:
        json.dump(dataset, f)
        
    return dataset_path, manifest_path

def test_training_pipeline_and_inference(dummy_dataset_and_manifest):
    dataset_path, manifest_path = dummy_dataset_and_manifest
    
    trainer = ModelTrainer(dataset_path, manifest_path)
    
    # Train Linear Regression baseline
    metadata_lr = trainer.train_baseline("linear_regression")
    assert metadata_lr["task"] == "resume_quality"
    assert "mae" in metadata_lr["metrics"]["test"]
    
    # Train Random Forest baseline
    metadata_rf = trainer.train_baseline("random_forest")
    assert "feature_importance" in metadata_rf
    assert len(metadata_rf["feature_importance"]) == 2
    
    # Test Inference Interface
    model_id = metadata_rf["model_name"]
    predictor = ResumeQualityPredictor(model_id)
    
    raw_resume = {
        "name": "Jane Doe", # PII to be scrubbed
        "skills": ["python", "java", "sql"],
        "summary": "Great dev"
    }
    
    prediction = predictor.predict(raw_resume)
    assert "predicted_score" in prediction
    assert "explanations" in prediction
