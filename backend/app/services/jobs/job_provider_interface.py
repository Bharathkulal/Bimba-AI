from abc import ABC, abstractmethod
from typing import List, Dict, Any
from app.models.student import Student

class JobProviderInterface(ABC):
    @abstractmethod
    def search_jobs(self, student: Student, keyword: str, location: str = "India", limit: int = 10) -> List[Dict[str, Any]]:
        """
        Searches and returns normalized list of jobs.
        Each job should have the following dictionary format:
        {
            "id": str,
            "title": str,
            "company": str,
            "location": str,
            "description": str,
            "url": str,
            "source": str # e.g. "jsearch" or "linkedin"
        }
        """
        pass
