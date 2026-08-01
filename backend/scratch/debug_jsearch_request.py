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
    "query": "Software Engineer in India",
    "page": "1",
    "num_pages": "1",
}

print("Headers sent:")
print(headers)

url = "https://jsearch.p.rapidapi.com/search"
response = requests.get(url, headers=headers, params=params, timeout=10)

print("\nResponse Status:", response.status_code)
print("Response Headers:")
for k, v in response.headers.items():
    print(f"  {k}: {v}")

print("\nResponse Body:")
print(response.text)
