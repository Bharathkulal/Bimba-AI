import os
import json
import joblib
from typing import Dict, Any

from ml.preprocessing.pii_remover import PIIRemover
from ml.preprocessing.cleaner import DataCleaner
from ml.features.extractor import FeatureExtractor

class ResumeQualityPredictor:
    def __init__(self, model_id: str):
        """
        Initializes the predictor with a specific model ID.
        Example model_id: 'ats_score_random_forest_v1.0.0'
        """
        self.model_id = model_id
        self.models_dir = os.path.join(os.path.dirname(__file__), "..", "models")
        
        # Load metadata
        metadata_path = os.path.join(self.models_dir, "metadata", f"{model_id}.json")
        if not os.path.exists(metadata_path):
            raise FileNotFoundError(f"Model metadata not found: {metadata_path}")
            
        with open(metadata_path, "r") as f:
            self.metadata = json.load(f)
            
        # Load model artifact
        model_path = os.path.join(self.models_dir, "trained", f"{model_id}.joblib")
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model artifact not found: {model_path}")
            
        self.model = joblib.load(model_path)
        self.feature_names = self.metadata.get("features", [])

    def predict(self, raw_resume_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        End-to-end inference for a single raw resume payload.
        """
        # 1. Preprocess (Same as training pipeline)
        scrubbed = PIIRemover.clean(raw_resume_data)
        cleaned = DataCleaner.clean(scrubbed)
        
        # 2. Feature Extraction
        features_dict = FeatureExtractor.extract(cleaned)
        
        # 3. Construct Feature Vector matching the model's expected input
        feature_vector = [[features_dict.get(f, 0) for f in self.feature_names]]
        
        # 4. Predict
        prediction = self.model.predict(feature_vector)[0]
        
        # 5. Explainability (Feature Contributions based on importance)
        explanations = []
        if "feature_importance" in self.metadata:
            importances = self.metadata["feature_importance"]
            for feature_name, value in features_dict.items():
                if feature_name in importances:
                    weight = importances[feature_name]
                    # Simple human-readable explanation rule
                    if weight > 0.05: # threshold
                        explanations.append({
                            "feature": feature_name,
                            "value": value,
                            "importance_weight": weight
                        })
        
        # Sort explanations by importance
        explanations.sort(key=lambda x: x["importance_weight"], reverse=True)
        
        return {
            "predicted_score": float(prediction),
            "model_version": self.metadata.get("model_version"),
            "explanations": explanations
        }
