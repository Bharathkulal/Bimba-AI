import pytest
import io
from app.services.upload_service import UploadService
from app.core.exceptions import PipelineException
from app.services.zero_loss_engine import ZeroLossEngine
from app.services.integrity_validator import ResumeIntegrityValidator
from app.services.resume_extraction_service import extract_structured_data

class MockDB:
    def __init__(self):
        class ClientAdmin:
            def command(self, cmd):
                return {"ok": 1.0}
        class Client:
            admin = ClientAdmin()
        class Collection:
            def find_one(self, *args, **kwargs):
                return None
            def insert_one(self, *args, **kwargs):
                class InsertRes:
                    inserted_id = 1
                return InsertRes()
            def update_one(self, *args, **kwargs):
                return None
            def count_documents(self, *args, **kwargs):
                return 0
        self.client = Client()
        self.resumes = Collection()
        self.resume_profiles = Collection()
        self.resume_versions = Collection()
        self.resume_ats = Collection()
        self.students = Collection()



class MockOCRService:
    def __init__(self, mock_return):
        self.mock_return = mock_return
    def extract_text(self, file_content, filename):
        return self.mock_return

class MockAIManager:
    def __init__(self, should_fail=False):
        self.should_fail = should_fail
    def call_llm(self, *args, **kwargs):
        if self.should_fail:
            raise RuntimeError("AI Provider Offline")
        return '{"personal_info": {"name": "Test Candidate"}, "education": []}'

def test_extraction_reg_1_normal_text_pdf():
    # Test 1 — Normal text PDF (extraction succeeds)
    service = UploadService(MockDB())
    service.ocr_service = MockOCRService({"text": "Pranam R Betrabet\nEmail: pranam@example.com\nEducation: M.Tech MIT 9.05 CGPA"})
    service.ai_manager = MockAIManager()
    
    pdf_content = b"%PDF-1.4\n%..."
    res = service.process_upload(pdf_content, "resume.pdf", 1)
    assert res["success"] is True
    assert res["resume_id"] is not None


def test_extraction_reg_2_multipage_pdf():
    # Test 2 — Multi-page PDF (all pages extracted)
    service = UploadService(MockDB())
    service.ocr_service = MockOCRService({
        "text": "Page 1 info\nPage 2 info\nPage 3 info",
        "pages_metadata": [
            {"page_number": 1, "text": "Page 1 info"},
            {"page_number": 2, "text": "Page 2 info"},
            {"page_number": 3, "text": "Page 3 info"}
        ]
    })
    service.ai_manager = MockAIManager()
    
    pdf_content = b"%PDF-1.4\n%..."
    res = service.process_upload(pdf_content, "resume.pdf", 1)
    assert res["success"] is True

def test_extraction_reg_3_extractor_returns_dict():
    # Test 3 — Extractor returns dictionary (normalized correctly)
    service = UploadService(MockDB())
    service.ocr_service = MockOCRService({
        "pages_metadata": [
            {"text": "Dictionary style page 1"},
            {"text": "Dictionary style page 2"}
        ]
    })
    service.ai_manager = MockAIManager()
    pdf_content = b"%PDF-1.4\n%..."
    res = service.process_upload(pdf_content, "resume.pdf", 1)
    assert res["success"] is True

def test_extraction_reg_4_extractor_returns_list():
    # Test 4 — Extractor returns list (normalized correctly)
    service = UploadService(MockDB())
    service.ocr_service = MockOCRService([
        "List style item 1",
        "List style item 2"
    ])
    service.ai_manager = MockAIManager()
    pdf_content = b"%PDF-1.4\n%..."
    res = service.process_upload(pdf_content, "resume.pdf", 1)
    assert res["success"] is True

def test_extraction_reg_5_empty_extraction():
    # Test 5 — Empty extraction (fallback / exception attempted)
    service = UploadService(MockDB())
    service.ocr_service = MockOCRService(None)
    service.ai_manager = MockAIManager()
    
    pdf_content = b"%PDF-1.4\n%..."
    with pytest.raises(PipelineException) as excinfo:
        service.process_upload(pdf_content, "resume.pdf", 1)
    assert excinfo.value.status_code == 422
    assert "does not contain extractable text" in excinfo.value.message

def test_extraction_reg_6_scanned_pdf():
    # Test 6 — Scanned PDF (controlled 422)
    service = UploadService(MockDB())
    service.ocr_service = MockOCRService("")  # yields empty text
    service.ai_manager = MockAIManager()
    
    pdf_content = b"%PDF-1.4\n%..."
    with pytest.raises(PipelineException) as excinfo:
        service.process_upload(pdf_content, "scanned.pdf", 1)
    assert excinfo.value.status_code == 422
    assert "does not contain extractable text" in excinfo.value.message

def test_extraction_reg_7_invalid_pdf():
    # Test 7 — Invalid PDF (controlled client error 400)
    service = UploadService(MockDB())
    with pytest.raises(PipelineException) as excinfo:
        service.process_upload(b"NOT_A_PDF", "invalid.pdf", 1)
    assert excinfo.value.status_code == 400
    assert "does not have a valid PDF header" in excinfo.value.message

def test_extraction_reg_8_ai_unavailable():
    # Test 8 — AI unavailable (resume extraction remains successful)
    service = UploadService(MockDB())
    service.ocr_service = MockOCRService({"text": "Pranam R Betrabet\nEmail: pranam@example.com\nEducation: M.Tech MIT 9.05 CGPA"})
    service.ai_manager = MockAIManager(should_fail=True) # AI call fails
    
    pdf_content = b"%PDF-1.4\n%..."
    res = service.process_upload(pdf_content, "resume.pdf", 1)
    assert res["success"] is True
    # Make sure we got candidate details via heuristic fallback
    assert res["parsed_data"]["personal_info"]["email"] == "pranam@example.com"

def test_extraction_reg_9_full_pranam_resume():
    # Test 9 — Full Pranam resume (education scores preserved, research articles/papers, projects preserved)
    text = (
        "Pranam R Betrabet\n"
        "Email: pranam@example.com\n"
        "EDUCATION:\n"
        "M.Tech in CS at MIT (CGPA: 9.05) - 2022\n"
        "B.E in CS (CGPA: 9.31) - 2020\n"
        "PUC (89.17%) - 2016\n"
        "SSLC (92.32%) - 2014\n"
        "RESEARCH ARTICLES:\n"
        "- Arrhythmia Classification Paper\n"
        "PROJECTS:\n"
        "- Teeth Shade Detection Project\n"
    )
    parsed = extract_structured_data(text)
    
    assert "9.05" in str(parsed)
    assert "9.31" in str(parsed)
    assert "89.17%" in str(parsed)
    assert "92.32%" in str(parsed)
    assert any("Arrhythmia" in p["title"] for p in parsed["publications"])
    assert any("Teeth Shade" in p["title"] for p in parsed["projects"])

def test_extraction_reg_10_zeroloss_validation():
    # Test 10 — ZeroLoss validation integration (no facts lost, no hallucinations)
    original = {
        "personal_info": {"name": "Pranam R Betrabet", "email": "pranam@example.com"},
        "education": [{"degree": "M.Tech", "institution": "MIT", "cgpa_percentage": "9.05"}],
        "research_articles": [{"title": "Arrhythmia Classification"}],
        "skills": ["Python", "Machine Learning"]
    }
    
    # Passing check
    res = ResumeIntegrityValidator.validate(original, original)
    assert res["isValid"] is True
    
    # Dropped fact check
    invalid = {**original, "education": [{"degree": "M.Tech", "institution": "MIT", "cgpa_percentage": ""}]}
    res_inv = ResumeIntegrityValidator.validate(original, invalid)
    assert res_inv["isValid"] is False

def test_validate_api_key_variations(monkeypatch):
    import dotenv
    monkeypatch.setattr(dotenv, "load_dotenv", lambda *args, **kwargs: None)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    
    from app.services.ai_provider_manager import AIProviderManager
    manager = AIProviderManager()
    
    # 1. api_key is None, and valid env key is present
    monkeypatch.setenv("GEMINI_API_KEY", "valid_gemini_key_12345")
    provider_info = {
        "provider_name": "Gemini",
        "slug": "gemini",
        "env_key": "GEMINI_API_KEY",
        "api_key": None
    }
    key = manager._validate_api_key(provider_info)
    assert key == "valid_gemini_key_12345"

    # 2. api_key is "", and valid env key is present
    provider_info["api_key"] = ""
    key = manager._validate_api_key(provider_info)
    assert key == "valid_gemini_key_12345"

    # 3. api_key is "   ", and valid env key is present
    provider_info["api_key"] = "   "
    key = manager._validate_api_key(provider_info)
    assert key == "valid_gemini_key_12345"

    # 4. api_key is valid direct key
    provider_info["api_key"] = "direct_valid_key_12345"
    key = manager._validate_api_key(provider_info)
    assert key == "direct_valid_key_12345"

    # 5. api_key is None, and no env key is present
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    provider_info["api_key"] = None
    with pytest.raises(ValueError) as excinfo:
        manager._validate_api_key(provider_info)
    assert "missing or empty" in str(excinfo.value)
    
    # 6. api_key is invalid/placeholder
    provider_info["api_key"] = "mock_placeholder"
    with pytest.raises(ValueError) as excinfo:
        manager._validate_api_key(provider_info)
    assert "placeholder or mock" in str(excinfo.value)

