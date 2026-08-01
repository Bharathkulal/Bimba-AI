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

url = "https://jsearch.p.rapidapi.com/search?query=Software+Engineer+in+India&page=1&num_pages=1"
try:
    response = requests.get(url, headers=headers, timeout=15)
    print("Status:", response.status_code)
    print("Body:", response.text[:1000])
except Exception as e:
    print("Error:", e)
