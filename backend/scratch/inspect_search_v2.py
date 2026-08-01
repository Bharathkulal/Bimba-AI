import os
import requests
import json
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
params = {
    "query": "Software Engineer in India",
    "page": "1",
    "num_pages": "1"
}

url = "https://jsearch.p.rapidapi.com/search-v2"
try:
    response = requests.get(url, headers=headers, params=params, timeout=20)
    print("Status:", response.status_code)
    if response.status_code == 200:
        data = response.json()
        print("Response JSON structure keys:", list(data.keys()))
        data_content = data.get("data", {})
        if isinstance(data_content, dict):
            print("data keys:", list(data_content.keys()))
            jobs = data_content.get("jobs", [])
            print(f"Number of jobs returned: {len(jobs)}")
            if jobs:
                print("First job keys:", list(jobs[0].keys()))
                print("First job sample title:", jobs[0].get("job_title"))
        else:
            print("data type is:", type(data_content))
    else:
        print("Failed:", response.text)
except Exception as e:
    print("Error:", e)
