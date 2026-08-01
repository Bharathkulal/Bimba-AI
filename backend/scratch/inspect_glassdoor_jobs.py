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
    print("Status:", response.status_code)
    if response.status_code == 200:
        data = response.json()
        print("Keys in top level response:", list(data.keys()))
        data_content = data.get("data", {})
        if isinstance(data_content, dict):
            print("Keys in data:", list(data_content.keys()))
            jobs = data_content.get("jobListings", [])
            print(f"Found {len(jobs)} jobs.")
            if jobs:
                jobview = jobs[0].get("jobview", {})
                print("jobview keys:", list(jobview.keys()))
                if "header" in jobview:
                    print("  header keys:", list(jobview["header"].keys()))
                if "job" in jobview:
                    print("  job keys:", list(jobview["job"].keys()))
                print("Sample jobview serialization:")
                print(json.dumps(jobview, indent=2)[:2000])
        else:
            print("Data is not a dict:", type(data_content))
    else:
        print("Failed:", response.text)
except Exception as e:
    print("Error:", e)
