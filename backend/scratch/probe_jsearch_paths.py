import os
import requests
from dotenv import load_dotenv

# Load env variables from backend/.env
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(dotenv_path)

api_key = os.getenv("JSEARCH_API_KEY")
api_host = os.getenv("JSEARCH_API_HOST", "jsearch.p.rapidapi.com")

headers = {
    "X-RapidAPI-Key": api_key,
    "X-RapidAPI-Host": api_host,
}

paths = [
    "/search",
    "/job-search",
    "/jobs/search",
    "/jobs",
    "/job",
    "/search-jobs",
    "/search_jobs",
    "/job_search",
    "/search-v2",
    "/job-details", # We know this one works, let's keep it as reference
]

for path in paths:
    url = f"https://{api_host}{path}"
    try:
        response = requests.get(url, headers=headers, params={"query": "Developer", "job_id": "qiSPjUMr0Em0hqHoAAAAAA=="}, timeout=10)
        print(f"Path: {path} -> Status: {response.status_code}")
        if response.status_code == 200:
            print(f"  Success response: {response.text[:200]}")
        else:
            print(f"  Fail response: {response.text[:150]}")
    except Exception as e:
        print(f"Path: {path} -> Error: {e}")
