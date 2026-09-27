import json
import os
import joblib
from datetime import datetime, timezone
from typing import Dict, Any, Tuple
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import numpy as np

class ModelTrainer:
    def __init__(self, dataset_path: str, manifest_path: str, random_seed: int = 42):
        self.dataset_path = dataset_path
        self.manifest_path = manifest_path
        self.random_seed = random_seed
        self.models_dir = os.path.join(os.path.dirname(__file__), "..", "models")
        
    def _load_data(self) -> Tuple[Dict[str, Any], list, list, list]:
        with open(self.manifest_path, "r") as f:
            manifest = json.load(f)
            
        with open(self.dataset_path, "r") as f:
            dataset = json.load(f)
            
        train_data = [r for r in dataset if r.get("split") == "train"]
        val_data = [r for r in dataset if r.get("split") == "validation"]
        test_data = [r for r in dataset if r.get("split") == "test"]
        
        return manifest, train_data, val_data, test_data

    def _extract_xy(self, data: list, features: list) -> Tuple[np.ndarray, np.ndarray]:
        X = []
        y = []
        for r in data:
            row = [r["features"].get(f, 0) for f in features]
            X.append(row)
            y.append(r["label"])
        return np.array(X), np.array(y)

    def train_baseline(self, model_name: str = "linear_regression"):
        """
        Trains a baseline model on the dataset.
        NOTE: Production training is BLOCKED unless real labeled data exists.
        This pipeline architecture acts as the test fixture and framework.
        """
        manifest, train_data, val_data, test_data = self._load_data()
        feature_names = manifest["features"]
        
        X_train, y_train = self._extract_xy(train_data, feature_names)
        X_val, y_val = self._extract_xy(val_data, feature_names)
        X_test, y_test = self._extract_xy(test_data, feature_names)
        
        if model_name == "linear_regression":
            model = LinearRegression()
        elif model_name == "random_forest":
            model = RandomForestRegressor(random_state=self.random_seed)
        else:
            raise ValueError(f"Unknown model_name: {model_name}")
            
        # Fit model
        model.fit(X_train, y_train)
        
        # Predict
        y_train_pred = model.predict(X_train)
        y_val_pred = model.predict(X_val)
        y_test_pred = model.predict(X_test)
        
        # Evaluate
        train_metrics = self._calculate_metrics(y_train, y_train_pred)
        val_metrics = self._calculate_metrics(y_val, y_val_pred)
        test_metrics = self._calculate_metrics(y_test, y_test_pred)
        
        # Feature Importance (if supported)
        feature_importance = {}
        if hasattr(model, "feature_importances_"):
            for name, imp in zip(feature_names, model.feature_importances_):
                feature_importance[name] = float(imp)
                
        # Save artifacts
        version = "1.0.0"
        model_id = f"{manifest['label']}_{model_name}_v{version}"
        
        metadata = {
            "model_name": model_id,
            "model_version": version,
            "dataset_version": manifest["dataset_version"],
            "feature_version": manifest["feature_version"],
            "task": "resume_quality",
            "problem_type": "regression",
            "training_records": len(X_train),
            "validation_records": len(X_val),
            "test_records": len(X_test),
            "features": feature_names,
            "hyperparameters": model.get_params() if hasattr(model, "get_params") else {},
            "metrics": {
                "train": train_metrics,
                "validation": val_metrics,
                "test": test_metrics
            },
            "feature_importance": feature_importance,
            "random_seed": self.random_seed,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Save metadata
        metadata_path = os.path.join(self.models_dir, "metadata", f"{model_id}.json")
        with open(metadata_path, "w") as f:
            json.dump(metadata, f, indent=2)
            
        # Save model object
        model_path = os.path.join(self.models_dir, "trained", f"{model_id}.joblib")
        joblib.dump(model, model_path)
        
        return metadata

    def _calculate_metrics(self, y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
        if len(y_true) == 0:
            return {"mae": 0.0, "rmse": 0.0, "r2": 0.0}
            
        mae = mean_absolute_error(y_true, y_pred)
        rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
        
        try:
            r2 = r2_score(y_true, y_pred)
        except Exception:
            r2 = 0.0
            
        return {
            "mae": float(mae),
            "rmse": float(rmse),
            "r2": float(r2)
        }
