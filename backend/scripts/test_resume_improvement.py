"""
Bimba AI - Resume Improvement Engine Self-Test
==============================================
Run: python scripts/test_resume_improvement.py
Verifies: endpoint routing, database updates, fallback silently handled.
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
from app.api.v1.resumes.resume_extract import improve_resume_endpoint

class TestResumeImprovementEndpoint(unittest.TestCase):
    def setUp(self):
        self.mock_db = MagicMock()
        self.mock_db.resume_analysis = MagicMock()
        
        self.mock_student = MagicMock()
        self.mock_student.id = 123
        self.mock_student.roll_number = "TEST1234"

    def test_resume_not_found_raises_404(self):
        self.mock_db.resume_analysis.find_one.return_value = None
        
        with self.assertRaises(HTTPException) as context:
            improve_resume_endpoint(resume_id=999, student=self.mock_student, db=self.mock_db)
            
        self.assertEqual(context.exception.status_code, 404)
        self.assertIn("extraction data not found", context.exception.detail)

    def test_analysis_incomplete_raises_400(self):
        # AI Analysis status not completed
        self.mock_db.resume_analysis.find_one.return_value = {
            "resume_id": 1,
            "student_id": 123,
            "status": "completed", # missing ai_analysis
            "ai_analysis": None
        }
        
        with self.assertRaises(HTTPException) as context:
            improve_resume_endpoint(resume_id=1, student=self.mock_student, db=self.mock_db)
            
        self.assertEqual(context.exception.status_code, 400)
        self.assertIn("AI analysis has not been executed", context.exception.detail)

    @patch("app.services.resume_improvement_service.generate_ai_response")
    def test_improvement_generation_and_saving(self, mock_gateway_call):
        # Setup mocks
        self.mock_db.resume_analysis.find_one.return_value = {
            "resume_id": 1,
            "student_id": 123,
            "status": "ai_completed",
            "extracted_data": {
                "summary": ["Old summary text"]
            },
            "ai_analysis": {
                "weaknesses": ["Weak summary phrasing"]
            }
        }
        
        mock_response_json = {
            "summary": {
                "original": "Old summary text",
                "improved": "BCA student experienced in React",
                "reason": "Clearer value definition"
            },
            "projects": [],
            "experience": [],
            "skill_recommendations": ["AWS"],
            "ats_keywords": ["React"]
        }
        
        import json
        mock_gateway_call.return_value = json.dumps(mock_response_json)
        
        res = improve_resume_endpoint(resume_id=1, student=self.mock_student, db=self.mock_db)
        
        self.assertTrue(res["success"])
        self.assertEqual(res["improvements"]["summary"]["improved"], "BCA student experienced in React")
        
        # Check database update was triggered
        self.mock_db.resume_analysis.update_one.assert_called_once()
        update_args = self.mock_db.resume_analysis.update_one.call_args[0]
        self.assertEqual(update_args[0]["resume_id"], 1)
        self.assertEqual(update_args[0]["student_id"], 123)

if __name__ == "__main__":
    unittest.main()
