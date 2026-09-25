import pytest
import httpx
from unittest.mock import patch, MagicMock, AsyncMock
from app.services.job_provider.jsearch_provider import JSearchProvider
from app.services.job_provider.errors import (
    ProviderNotConfiguredError,
    ProviderAuthFailedError,
    ProviderRateLimitedError,
    ProviderTimeoutError,
    ProviderNetworkError,
    ProviderInvalidResponseError,
    ProviderEmptyResultError
)

@pytest.fixture
def provider_env(monkeypatch):
    monkeypatch.setenv("JSEARCH_API_KEY", "test_key")
    monkeypatch.setenv("JSEARCH_API_HOST", "test.host")
    monkeypatch.setenv("JSEARCH_BASE_URL", "https://test.host")

@pytest.fixture
def mock_httpx_get():
    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        yield mock_get

@pytest.mark.anyio
async def test_provider_success(provider_env, mock_httpx_get):
    provider = JSearchProvider()
    
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "status": "OK",
        "request_id": "test-request",
        "data": [
            {
                "job_id": "provider-job-001",
                "job_title": "Python Developer",
                "employer_name": "Example Company",
                "job_city": "Bengaluru",
                "job_state": "Karnataka",
                "job_country": "India",
                "job_description": "Python FastAPI MongoDB developer",
                "job_apply_link": "https://example.com/apply",
                "job_employment_type": "FULLTIME"
            }
        ]
    }
    mock_httpx_get.return_value = mock_response

    jobs = await provider.search_jobs("Python", location="Bengaluru")
    
    assert len(jobs) == 1
    assert jobs[0].provider_job_id == "provider-job-001"
    assert jobs[0].title == "Python Developer"
    assert jobs[0].company == "Example Company"
    assert "Bengaluru" in jobs[0].location
    assert jobs[0].source == "jsearch"
    assert jobs[0].url == "https://example.com/apply"

@pytest.mark.anyio
async def test_missing_optional_fields(provider_env, mock_httpx_get):
    provider = JSearchProvider()
    
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "status": "OK",
        "data": [
            {
                "job_id": "provider-job-002",
                "job_title": "Python Developer",
                # missing salary, posted_at, employment_type
            }
        ]
    }
    mock_httpx_get.return_value = mock_response

    jobs = await provider.search_jobs("Python")
    
    assert jobs[0].salary_min is None
    assert jobs[0].salary_max is None
    assert jobs[0].posted_at is None
    assert jobs[0].employment_type is None

@pytest.mark.anyio
async def test_empty_response(provider_env, mock_httpx_get):
    provider = JSearchProvider()
    
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "status": "OK",
        "data": []
    }
    mock_httpx_get.return_value = mock_response

    with pytest.raises(ProviderEmptyResultError):
        await provider.search_jobs("Python")

@pytest.mark.anyio
async def test_invalid_response(provider_env, mock_httpx_get):
    provider = JSearchProvider()
    
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"status": "error"} # missing data
    mock_httpx_get.return_value = mock_response

    with pytest.raises(ProviderInvalidResponseError):
        await provider.search_jobs("Python")

@pytest.mark.anyio
async def test_401(provider_env, mock_httpx_get):
    provider = JSearchProvider()
    
    mock_response = MagicMock()
    mock_response.status_code = 401
    mock_httpx_get.return_value = mock_response

    with pytest.raises(ProviderAuthFailedError):
        await provider.search_jobs("Python")

@pytest.mark.anyio
async def test_429(provider_env, mock_httpx_get):
    provider = JSearchProvider()
    
    mock_response = MagicMock()
    mock_response.status_code = 429
    mock_httpx_get.return_value = mock_response

    with pytest.raises(ProviderRateLimitedError):
        await provider.search_jobs("Python")

@pytest.mark.anyio
async def test_timeout(provider_env, mock_httpx_get):
    provider = JSearchProvider()
    
    mock_httpx_get.side_effect = httpx.TimeoutException("Timeout")

    with pytest.raises(ProviderTimeoutError):
        await provider.search_jobs("Python")

@pytest.mark.anyio
async def test_network_failure(provider_env, mock_httpx_get):
    provider = JSearchProvider()
    
    mock_httpx_get.side_effect = httpx.RequestError("Network error")

    with pytest.raises(ProviderNetworkError):
        await provider.search_jobs("Python")

