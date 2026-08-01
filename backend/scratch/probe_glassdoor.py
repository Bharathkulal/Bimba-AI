import os
import requests
from dotenv import load_dotenv

# Load env variables from backend/.env
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(dotenv_path)

api_key = os.getenv("GLASSDOOR_API_KEY")
api_host = os.getenv("GLASSDOOR_API_HOST", "glassdoor-real-time.p.rapidapi.com")

headers = {
    "X-RapidAPI-Key": api_key,
    "X-RapidAPI-Host": api_host,
}

# In the screenshot, we see categories: Jobs, Companies, Salaries, Conversations.
# Under Companies, we see "companies/interview-details".
# Standard endpoint paths on RapidAPI scrapers typically mirror the categories, e.g.:
# "jobs/search", "jobs/list", "job-search", "jobs"
paths = [
    "/jobs/search",
    "/jobs/list",
    "/job/search",
    "/jobs",
    "/search",
    "/companies/search",
]

for path in paths:
    url = f"https://{api_host}{path}"
    try:
        response = requests.get(url, headers=headers, params={"query": "Software Engineer", "location": "India"}, timeout=10)
        print(f"Path: {path} -> Status: {response.status_code}")
        print(f"  Response: {response.text[:250]}\n")
    except Exception as e:
        print(f"Path: {path} -> Error: {e}\n")
