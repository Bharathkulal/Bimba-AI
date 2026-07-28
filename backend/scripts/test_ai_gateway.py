"""
Bimba AI - AI Gateway and Resume Intelligence Engine Self-Test
==============================================================
Run: python scripts/test_ai_gateway.py
Verifies: fallback logic, usage logging, AI analysis parsing.
"""

import os
import sys

# Ensure project root is on the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

import unittest
from unittest.mock import patch, MagicMock
from app.services.ai_gateway import generate_ai_response
from app.services.resume_ai_analyzer import analyze_resume

class TestAiGatewayAndAnalyzer(unittest.TestCase):
    def setUp(self):
        # Create a mock MongoDB database instance
        self.mock_db = MagicMock()
        self.mock_db.ai_usage_logs = MagicMock()
        
        self.sample_extracted_data = {
            "name": "Alex Dev",
            "email": "alex@bimba.ai",
            "phone": "+919999999999",
            "location": "Mangalore",
            "skills": ["Python", "React", "MongoDB"],
            "education": ["BCA - Tech College"],
            "experience": ["Junior Dev - Software Inc (1 year)"],
            "projects": ["Bimba AI Platform"],
            "certifications": ["AWS Practitioner"]
        }

    @patch("app.services.ai_gateway.call_gemini")
    def test_gemini_success(self, mock_gemini):
        # Mock Gemini succeeding
        mock_gemini.return_value = {"success": True, "content": "Gemini response text"}
        
        res = generate_ai_response(self.mock_db, "hello", "test_task")
        
        self.assertEqual(res, "Gemini response text")
        self.mock_db.ai_usage_logs.insert_one.assert_called_once()
        log_doc = self.mock_db.ai_usage_logs.insert_one.call_args[0][0]
        self.assertEqual(log_doc["status"], "success")

    @patch("app.services.ai_gateway.call_groq")
    @patch("app.services.ai_gateway.call_gemini")
    def test_gemini_fails_groq_succeeds(self, mock_gemini, mock_groq):
        # Mock Gemini failure, Groq success
        mock_gemini.return_value = {"success": False, "error": "Quota exceeded"}
        mock_groq.return_value = {"success": True, "content": "Groq response text"}
        
        res = generate_ai_response(self.mock_db, "hello", "test_task")
        
        self.assertEqual(res, "Groq response text")
        mock_gemini.assert_called_once()
        mock_groq.assert_called_once()

    @patch("app.services.ai_gateway.call_openrouter")
    @patch("app.services.ai_gateway.call_groq")
    @patch("app.services.ai_gateway.call_gemini")
    def test_all_fail_raises_exception(self, mock_gemini, mock_groq, mock_openrouter):
        # Mock all failing
        mock_gemini.return_value = {"success": False, "error": "Error"}
        mock_groq.return_value = {"success": False, "error": "Error"}
        mock_openrouter.return_value = {"success": False, "error": "Error"}
        
        with self.assertRaises(RuntimeError) as context:
            generate_ai_response(self.mock_db, "hello", "test_task")
            
        self.assertIn("AI_SERVICE_UNAVAILABLE", str(context.exception))

    @patch("app.services.resume_ai_analyzer.generate_ai_response")
    def test_resume_analyzer_parsing_schema(self, mock_gateway_call):
        # Mock the raw response returned by the AI Gateway
        mock_response_json = {
            "overall_score": 90,
            "ats_score": 85,
            "summary_analysis": "Excellent profile",
            "strengths": ["Strong React skills"],
            "weaknesses": ["No deployment metrics"],
            "missing_skills": ["Docker"],
            "section_scores": {
                "summary": 90,
                "skills": 95,
                "experience": 80,
                "projects": 90
            },
            "improvement_suggestions": ["Add metrics"]
        }
        
        import json
        mock_gateway_call.return_value = json.dumps(mock_response_json)
        
        analysis = analyze_resume(self.mock_db, self.sample_extracted_data)
        
        self.assertEqual(analysis["overall_score"], 90)
        self.assertEqual(analysis["ats_score"], 85)
        self.assertEqual(analysis["strengths"], ["Strong React skills"])
        self.assertEqual(analysis["missing_skills"], ["Docker"])

if __name__ == "__main__":
    unittest.main()
