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
    "location": "United States", # Try US for faster/more stable scraping
}

url = f"https://{api_host}/jobs/search"
try:
    response = requests.get(url, headers=headers, params=params, timeout=25)
    if response.status_code == 200:
        data = response.json()
        jobs = data.get("data", {}).get("jobListings", [])
        if jobs:
            jobview = jobs[0].get("jobview", {})
            print("--- KEYS AND VALUES IN JOBVIEW ---")
            for k in jobview.keys():
                val = jobview[k]
                if isinstance(val, dict):
                    print(f"\n[{k}] keys: {list(val.keys())}")
                    # Print top level fields of this dict
                    for k2, v2 in val.items():
                        if not isinstance(v2, (dict, list)):
                            print(f"  {k2}: {v2}")
                        else:
                            print(f"  {k2}: (dict/list of keys {list(v2.keys()) if isinstance(v2, dict) else len(v2)})")
                else:
                    print(f"\n[{k}]: {val}")
    else:
        print("Failed:", response.status_code)
except Exception as e:
    print("Error:", e)
