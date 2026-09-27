import pytest
import os
from ml.preprocessing.pii_remover import PIIRemover
from ml.preprocessing.cleaner import DataCleaner
from ml.features.extractor import FeatureExtractor
from ml.datasets.validator import RecordValidator
from ml.schemas.training_record import TrainingRecord

def test_pii_remover():
    data = {
        "name": "John Doe",
        "email": "test@test.com",
        "phone": "+1234567890",
        "skills": [{"name": "Python"}],
        "personal_info": {"address": "123 Main St"}
    }
    clean_data = PIIRemover.clean(data)
    assert "name" not in clean_data
    assert "email" not in clean_data
    assert "phone" not in clean_data
    assert "skills" in clean_data
    assert clean_data.get("personal_info") == {"scrubbed": True}

def test_data_cleaner():
    data = {
        "skills": ["Python", "python", "machine-learning"],
        "summary": "  Hello World  "
    }
    clean = DataCleaner.clean(data)
    assert len(clean["skills"]) == 2
    assert "machine learning" in clean["skills"]
    assert "python" in clean["skills"]
    assert clean["summary"] == "Hello World"
    assert clean["education"] == [] # added default array
    
def test_feature_extractor():
    data = {
        "skills": ["python", "java"],
        "experience": [{"description": "Dev"}, {"description": "Ops"}],
        "summary": "Hello"
    }
    feats = FeatureExtractor.extract(data)
    assert feats["num_skills"] == 2
    assert feats["num_experience"] == 2
    assert feats["has_summary"] == 1
    assert feats["total_experience_text_length"] == 6
    
def test_record_validator():
    valid = {
        "record_id": "1",
        "resume_id": 123,
        "features": {"num_skills": 5},
        "created_at": "2023-01-01"
    }
    assert RecordValidator.validate(valid)
    
    invalid = {
        "record_id": "1",
        # missing resume_id
        "features": {"num_skills": 5},
        "created_at": "2023-01-01"
    }
    assert not RecordValidator.validate(invalid)
    
    invalid_feat = {
        "record_id": "1",
        "resume_id": 123,
        "features": {"num_skills": -1}, # negative not allowed
        "created_at": "2023-01-01"
    }
    assert not RecordValidator.validate(invalid_feat)
