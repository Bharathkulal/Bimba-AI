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

url = "https://jsearch.p.rapidapi.com/search"
try:
    response = requests.post(url, headers=headers, json=params, timeout=10)
    print("POST Status:", response.status_code)
    print("POST Body:", response.text)
except Exception as e:
    print("POST Error:", e)
