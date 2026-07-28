"""
Bimba AI - Job Recommendation Engine Self-Test
==============================================
Run: python scripts/test_job_recommendation.py
Verifies: provider fallback logic, AI matching score, DB caching.
"""

import os
import sys

# Ensure project root is on the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

import unittest
from unittest.mock import MagicMock, patch
from fastapi import HTTPException
from app.api.jobs import generate_job_recommendations_endpoint, get_existing_recommendations_endpoint

class TestJobRecommendations(unittest.TestCase):
    def setUp(self):
        self.mock_db = MagicMock()
        self.mock_db.resumes = MagicMock()
        self.mock_db.resume_analysis = MagicMock()
        self.mock_db.job_recommendations = MagicMock()
        
        self.mock_student = MagicMock()
        self.mock_student.id = 123

    def test_recommend_unauthorized_raises_404(self):
        self.mock_db.resumes.find_one.return_value = None
        
        with self.assertRaises(HTTPException) as context:
            generate_job_recommendations_endpoint(resume_id=999, student=self.mock_student, db=self.mock_db)
            
        self.assertEqual(context.exception.status_code, 404)
        self.assertIn("not found or unauthorized", context.exception.detail)

    @patch("app.services.jobs.job_recommendation_service.get_job_recommendations_with_matching")
    @patch("app.api.jobs.get_next_sequence")
    def test_recommendation_generation_and_saving(self, mock_seq, mock_matching_engine):
        # Found resume ownership
        self.mock_db.resumes.find_one.return_value = {"id": 1, "student_id": 123}
        
        # Found resume analysis
        self.mock_db.resume_analysis.find_one.return_value = {
            "resume_id": 1,
            "student_id": 123,
            "status": "ai_completed",
            "extracted_data": {
                "skills": ["React", "Python"],
                "target_role": "Fullstack Developer"
            }
        }
        
        mock_seq.return_value = "8"
        mock_matching_engine.return_value = [
            {
                "id": "job_1",
                "title": "React Engineer",
                "company": "Tech Corp",
                "location": "India",
                "match_score": 90,
                "reason": "Strong skill match",
                "matched_skills": ["React"],
                "missing_skills": []
            }
        ]
        
        res = generate_job_recommendations_endpoint(resume_id=1, student=self.mock_student, db=self.mock_db)
        
        self.assertTrue(res["success"])
        self.assertEqual(res["recommendations"][0]["match_score"], 90)
        
        # Verify db insert
        self.mock_db.job_recommendations.insert_one.assert_called_once()
        inserted_doc = self.mock_db.job_recommendations.insert_one.call_args[0][0]
        self.assertEqual(inserted_doc["id"], 8)
        self.assertEqual(inserted_doc["jobs"][0]["company"], "Tech Corp")

    def test_get_recommendations_cached(self):
        # Stored recommendations found
        self.mock_db.job_recommendations.find_one.return_value = {
            "resume_id": 1,
            "student_id": 123,
            "jobs": [
                {"title": "React Engineer", "match_score": 90}
            ]
        }
        
        res = get_existing_recommendations_endpoint(resume_id=1, student=self.mock_student, db=self.mock_db)
        
        self.assertTrue(res["success"])
        self.assertEqual(res["recommendations"][0]["title"], "React Engineer")

if __name__ == "__main__":
    unittest.main()
