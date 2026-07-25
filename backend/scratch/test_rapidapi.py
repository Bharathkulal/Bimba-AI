import os
import requests
from dotenv import load_dotenv

# Load env variables from backend/.env
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(dotenv_path)

api_key = os.getenv("RAPIDAPI_KEY")
api_host = os.getenv("RAPIDAPI_HOST", "linkedin-data-api.p.rapidapi.com")

print(f"Loaded RAPIDAPI_KEY: {api_key[:5]}...{api_key[-5:] if api_key else 'None'}")
print(f"Loaded RAPIDAPI_HOST: {api_host}")

def test_api():
    url = f"https://{api_host}/active-jb"
    headers = {
        "X-RapidAPI-Key": api_key,
        "X-RapidAPI-Host": api_host
    }
    params = {
        "title": "Software Engineer",
        "location": "United States",
        "time_frame": "6m",
        "limit": "5",
        "offset": "0"
    }
    
    print("\nSending request to:", url)
    print("Params:", params)
    try:
        response = requests.get(url, headers=headers, params=params, timeout=15)
        print(f"Status Code: {response.status_code}")
        try:
            res_json = response.json()
            print("Response JSON (first 500 chars):")
            import json
            print(json.dumps(res_json, indent=2)[:500])
        except Exception:
            print("Response Text (first 500 chars):")
            print(response.text[:500])
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    if not api_key:
        print("RAPIDAPI_KEY is not set in environment variables.")
    else:
        test_api()
