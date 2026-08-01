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
params = {
    "query": "Software Engineer",
}

endpoints = [
    "https://jsearch.p.rapidapi.com/search-v2",
    "https://jsearch.p.rapidapi.com/job-search",
]

for url in endpoints:
    try:
        response = requests.get(url, headers=headers, params=params, timeout=10)
        print("URL:", url)
        print("Status:", response.status_code)
        print("Body:", response.text[:200])
    except Exception as e:
        print("Error:", e)
