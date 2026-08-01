import os
import requests
from dotenv import load_dotenv

# Load env variables from backend/.env
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(dotenv_path)

def test_jsearch():
    print("=== Testing JSearch API ===")
    api_key = os.getenv("JSEARCH_API_KEY")
    api_host = os.getenv("JSEARCH_API_HOST")
    
    print(f"Loaded Host: '{api_host}'")
    print(f"Loaded Key: '{api_key}'")
    
    if not api_key:
        print("Error: JSEARCH_API_KEY is not set.")
        return
        
    print(f"Host: {api_host}")
    print(f"Key (truncated): {api_key[:8]}...{api_key[-4:] if len(api_key) > 4 else ''}")
    
    url = "https://jsearch.p.rapidapi.com/search-v2"
    headers = {
        "X-RapidAPI-Key": api_key,
        "X-RapidAPI-Host": api_host,
    }
    params = {
        "query": "Software Engineer in India",
        "page": "1",
        "num_pages": "1",
    }
    
    try:
        response = requests.get(url, headers=headers, params=params, timeout=15)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            data_content = data.get("data", {})
            jobs = data_content.get("jobs", []) if isinstance(data_content, dict) else []
            print(f"Success! Found {len(jobs)} jobs.")
            if jobs:
                print(f"Sample Job Title: {jobs[0].get('job_title')}")
                print(f"Sample Company: {jobs[0].get('employer_name')}")
        else:
            print(f"Failed. Response: {response.text[:500]}")
    except Exception as e:
        print(f"Request Exception: {e}")

def test_linkedin():
    print("\n=== Testing LinkedIn Job API ===")
    api_key = os.getenv("RAPIDAPI_KEY")
    api_host = os.getenv("RAPIDAPI_HOST", "linkedin-job-search-api.p.rapidapi.com")
    
    if not api_key:
        print("Error: RAPIDAPI_KEY is not set.")
        return
        
    print(f"Host: {api_host}")
    print(f"Key (truncated): {api_key[:8]}...{api_key[-4:] if len(api_key) > 4 else ''}")
    
    url = f"https://{api_host}/active-jb"
    headers = {
        "X-RapidAPI-Key": api_key,
        "X-RapidAPI-Host": api_host,
    }
    params = {
        "title": "Software Engineer",
        "location": "India",
        "limit": "5"
    }
    
    try:
        response = requests.get(url, headers=headers, params=params, timeout=15)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            raw_jobs = response.json()
            if not isinstance(raw_jobs, list):
                raw_jobs = raw_jobs.get("data", []) if isinstance(raw_jobs, dict) else []
            print(f"Success! Found {len(raw_jobs)} jobs.")
            if raw_jobs:
                print(f"Sample Job Title: {raw_jobs[0].get('title')}")
                print(f"Sample Company: {raw_jobs[0].get('organization')}")
        else:
            print(f"Failed. Response: {response.text[:500]}")
    except Exception as e:
        print(f"Request Exception: {e}")

if __name__ == "__main__":
    test_jsearch()
    test_linkedin()
