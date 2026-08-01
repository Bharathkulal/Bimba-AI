import os
import requests
import json
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
params = {
    "query": "Software Engineer",
    "location": "India",
}

url = f"https://{api_host}/jobs/search"
try:
    response = requests.get(url, headers=headers, params=params, timeout=40)
    if response.status_code == 200:
        data = response.json()
        jobs = data.get("data", {}).get("jobListings", [])
        if jobs:
            jobview = jobs[0].get("jobview", {})
            print("--- Root jobview keys and type/val overview ---")
            for k, v in jobview.items():
                if isinstance(v, dict):
                    print(f"Key '{k}': dict with keys {list(v.keys())}")
                elif isinstance(v, list):
                    print(f"Key '{k}': list of length {len(v)}")
                else:
                    print(f"Key '{k}': {type(v)} = {v}")
    else:
        print("Failed:", response.status_code)
except Exception as e:
    print("Error:", e)
