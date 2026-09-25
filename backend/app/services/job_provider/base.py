from typing import List, Optional
from app.services.job_provider.models import CanonicalJob

class JobProvider:
    async def search_jobs(
        self,
        query: str,
        location: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> List[CanonicalJob]:
        raise NotImplementedError
