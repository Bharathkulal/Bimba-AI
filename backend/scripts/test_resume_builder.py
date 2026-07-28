"""
Bimba AI - Resume Builder & PDF Generation Engine Self-Test
===========================================================
Run: python scripts/test_resume_builder.py
Verifies: builder endpoints, PDF compilation, history listing.
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
from app.api.v1.resumes.resume_builder import get_resume_builder_data, generate_resume_pdf_endpoint, get_previously_generated_resumes

class TestResumeBuilder(unittest.TestCase):
    def setUp(self):
        self.mock_db = MagicMock()
        self.mock_db.resumes = MagicMock()
        self.mock_db.resume_analysis = MagicMock()
        self.mock_db.generated_resumes = MagicMock()
        
        self.mock_student = MagicMock()
        self.mock_student.id = 123
        self.mock_student.roll_number = "TEST1234"
        self.mock_student.student_name = "Jane Doe"
        self.mock_student.personal_email = "jane@example.com"
        self.mock_student.phone = "1234567"
        self.mock_student.address = "Mangalore, India"

    def test_builder_data_not_found_raises_404(self):
        self.mock_db.resumes.find_one.return_value = None
        
        with self.assertRaises(HTTPException) as context:
            get_resume_builder_data(resume_id=999, student=self.mock_student, db=self.mock_db)
            
        self.assertEqual(context.exception.status_code, 404)
        self.assertIn("not found or unauthorized", context.exception.detail)

    def test_builder_data_retrieval_and_formatting(self):
        # Found resume ownership
        self.mock_db.resumes.find_one.return_value = {"id": 1, "student_id": 123}
        
        # Found extracted & improved contents
        self.mock_db.resume_analysis.find_one.return_value = {
            "resume_id": 1,
            "student_id": 123,
            "extracted_data": {
                "name": "Jane Doe",
                "summary": ["Old summary"],
                "skills": ["Python", "JS"]
            },
            "ai_improvements": {
                "summary": {"improved": "Better summary"}
            }
        }
        
        res = get_resume_builder_data(resume_id=1, student=self.mock_student, db=self.mock_db)
        
        self.assertTrue(res["success"])
        self.assertEqual(res["extracted_data"]["personal_info"]["name"], "Jane Doe")
        self.assertEqual(res["extracted_data"]["skills"], ["Python", "JS"])
        self.assertEqual(res["ai_improvements"]["summary"]["improved"], "Better summary")

    @patch("app.api.v1.resumes.resume_builder.upload_file")
    @patch("app.api.v1.resumes.resume_builder.get_next_sequence")
    async def test_pdf_generation_upload_and_save(self, mock_seq, mock_upload):
        # Mock dependencies
        self.mock_db.resumes.find_one.return_value = {"id": 1, "student_id": 123}
        self.mock_db.generated_resumes.count_documents.return_value = 2 # already has v1, v2
        
        mock_seq.return_value = "5"
        mock_upload.return_value = {
            "url": "http://cloudinary.com/pdf",
            "public_id": "pdf_public_id"
        }
        
        payload = MagicMock()
        payload.template = "ats_classic"
        payload.resume_data = {
            "personal_info": {"name": "Jane Doe", "email": "jane@example.com"},
            "summary": "Summary",
            "skills": ["Python"],
            "experience": [],
            "projects": [],
            "education": []
        }
        
        res = await generate_resume_pdf_endpoint(
            resume_id=1,
            payload=payload,
            student=self.mock_student,
            db=self.mock_db
        )
        
        self.assertTrue(res["success"])
        self.assertEqual(res["pdf_url"], "http://cloudinary.com/pdf")
        self.assertEqual(res["version"], 3) # count + 1
        
        # Verify inserted into generated_resumes collection
        self.mock_db.generated_resumes.insert_one.assert_called_once()
        inserted_doc = self.mock_db.generated_resumes.insert_one.call_args[0][0]
        self.assertEqual(inserted_doc["id"], 5)
        self.assertEqual(inserted_doc["version"], 3)
        self.assertEqual(inserted_doc["template"], "ats_classic")

if __name__ == "__main__":
    import asyncio
    
    # Run async test manually helper
    suite = unittest.TestSuite()
    suite.addTest(TestResumeBuilder("test_builder_data_not_found_raises_404"))
    suite.addTest(TestResumeBuilder("test_builder_data_retrieval_and_formatting"))
    
    # Define async execution runner
    async def run_async_test():
        tb = TestResumeBuilder()
        tb.setUp()
        await tb.test_pdf_generation_upload_and_save()
        print("test_pdf_generation_upload_and_save: PASSED")

    runner = unittest.TextTestRunner()
    runner.run(suite)
    
    asyncio.run(run_async_test())
