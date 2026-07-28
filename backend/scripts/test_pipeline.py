import sys
import os
import unittest
from unittest.mock import MagicMock, patch

# Ensure app is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.exceptions import PipelineException, OCRException, AIParsingException, JSONValidationException, DatabaseException
from app.services.ocr_service import OCRService
from app.services.ai_provider_manager import AIProviderManager
from app.services.resume_parser import ResumeParser
from app.database.resume_repository import ResumeRepository

class TestPipelineUnitCases(unittest.TestCase):

    def test_invalid_file_type(self):
        """Should throw OCRException for unsupported formats"""
        with self.assertRaises(OCRException):
            OCRService.extract_text(b"raw data", "resume.xyz")

    def test_empty_text_ocr_error(self):
        """Should throw OCRException if extracted text is empty"""
        # mock page extraction returning nothing
        with patch('pypdf.PdfReader') as mock_reader:
            mock_reader.return_value.pages = []
            with self.assertRaises(OCRException):
                OCRService.extract_text(b"%PDF-1.4...", "empty_ocr.pdf")

    def test_corrupted_json_parsing(self):
        """Should throw JSONValidationException for invalid JSON text"""
        with self.assertRaises(JSONValidationException):
            ResumeParser.parse_and_validate("Not a JSON string")

    def test_missing_schema_keys(self):
        """Should automatically map keys and provide default empty lists/dicts if missing"""
        invalid_json = '{"personal_info": {"name": "Test", "email": "test@test.com"}}'
        result = ResumeParser.parse_and_validate(invalid_json)
        self.assertEqual(result["personal_info"]["name"], "Test")
        self.assertEqual(result["education"], [])
        self.assertEqual(result["experience"], [])

    @patch('urllib.request.urlopen')
    def test_api_key_invalid(self, mock_urlopen):
        """Should handle auth failures and proceed to fallback"""
        # Set keys to trigger validation but fail during execution
        os.environ["GEMINI_API_KEY"] = "valid_length_key_here"
        os.environ["GROQ_API_KEY"] = "valid_length_key_here"
        os.environ["OPENROUTER_API_KEY"] = "valid_length_key_here"
        
        manager = AIProviderManager()
        
        # Simulate urllib 401 error
        import urllib.error
        mock_urlopen.side_effect = urllib.error.HTTPError(
            url="http://google.com",
            code=401,
            msg="Unauthorized",
            hdrs=None,
            fp=None
        )
        
        # Should exhaust all and throw AIParsingException
        with self.assertRaises(AIParsingException):
            manager.call_llm("test prompt")

    @patch('pymongo.MongoClient')
    def test_mongodb_offline(self, mock_client):
        """Should throw DatabaseException if Mongo is unavailable"""
        mock_db = MagicMock()
        # mock ping throwing connection failure
        import pymongo.errors
        mock_db.client.admin.command.side_effect = pymongo.errors.ConnectionFailure("Server offline")
        
        repo = ResumeRepository(mock_db)
        with self.assertRaises(DatabaseException):
            repo.save_parsed_resume(1, {"personal_info": {"name": "Test", "email": "test@test.com"}}, "filepath")

if __name__ == "__main__":
    unittest.main()
