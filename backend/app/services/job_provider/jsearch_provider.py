import httpx
import os
from typing import List, Optional
from app.services.job_provider.base import JobProvider
from app.services.job_provider.models import CanonicalJob
from app.services.job_provider.normalizer import normalize_jsearch_job
from app.services.job_provider.errors import (
    ProviderNotConfiguredError,
    ProviderAuthFailedError,
    ProviderRateLimitedError,
    ProviderTimeoutError,
    ProviderNetworkError,
    ProviderInvalidResponseError,
    ProviderEmptyResultError
)

class JSearchProvider(JobProvider):
    def __init__(self):
        self.api_key = os.getenv("JSEARCH_API_KEY")
        self.host = os.getenv("JSEARCH_API_HOST", "jsearch.p.rapidapi.com")
        self.base_url = os.getenv("JSEARCH_BASE_URL", f"https://{self.host}")
        
        if not self.api_key:
            raise ProviderNotConfiguredError("JSEARCH_API_KEY is not set")
            
    async def search_jobs(
        self,
        query: str,
        location: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> List[CanonicalJob]:
        
        headers = {
            "x-rapidapi-key": self.api_key,
            "x-rapidapi-host": self.host
        }
        
        search_query = query
        if location:
            search_query += f" in {location}"
            
        params = {
            "query": search_query,
            "page": str(page),
            "num_pages": "1" # Jsearch page abstraction
        }
        
        url = f"{self.base_url}/search"
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers, params=params, timeout=10.0)
                
                if response.status_code == 401 or response.status_code == 403:
                    raise ProviderAuthFailedError()
                elif response.status_code == 429:
                    raise ProviderRateLimitedError()
                elif response.status_code >= 500:
                    raise ProviderNetworkError(f"Provider returned 5xx status: {response.status_code}")
                
                response.raise_for_status()
                data = response.json()
                
        except httpx.TimeoutException:
            raise ProviderTimeoutError()
        except httpx.RequestError as e:
            raise ProviderNetworkError(str(e))
        except ValueError: # JSON decode error
            raise ProviderInvalidResponseError("Invalid JSON from provider")
            
        if not isinstance(data, dict) or "data" not in data:
            raise ProviderInvalidResponseError("Missing 'data' field in provider response")
            
        raw_jobs = data.get("data", [])
        if not raw_jobs:
            raise ProviderEmptyResultError()
            
        canonical_jobs = []
        for raw in raw_jobs:
            canonical_jobs.append(normalize_jsearch_job(raw))
            
        return canonical_jobs
