import os
import requests
from dotenv import load_dotenv

load_dotenv()

key = os.getenv("RAPIDAPI_KEY")
host = os.getenv("RAPIDAPI_HOST", "linkedin-job-search-api.p.rapidapi.com")

print(f"Key: {key[:10]}...")
print(f"Host: {host}")

url = f"https://{host}/active-jb"
headers = {
    "X-RapidAPI-Key": key,
    "X-RapidAPI-Host": host
}
params = {
    "title": "Software Engineer",
    "location": "India",
    "limit": "5"
}

try:
    response = requests.get(url, headers=headers, params=params, timeout=10)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text[:200]}")
except Exception as e:
    print(f"Error: {e}")
