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

endpoints = [
    "https://jsearch.p.rapidapi.com/search",
    "https://jsearch.p.rapidapi.com/search/",
    "https://jsearch.p.rapidapi.com/job-search",
    "https://jsearch.p.rapidapi.com/",
]

for url in endpoints:
    print(f"\n--- Testing URL: {url} ---")
    try:
        res = requests.get(url, headers=headers, params={"query": "developer"}, timeout=10)
        print(f"Status: {res.status_code}")
        print(f"Response: {res.text[:300]}")
    except Exception as e:
        print(f"Error: {e}")
