import os
import urllib.request
import urllib.error
import json
from dotenv import load_dotenv

# Load env file
dotenv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv(dotenv_path)

api_key = os.getenv("GEMINI_API_KEY", "").strip()
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"

req = urllib.request.Request(url, headers={
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
}, method="GET")

try:
    with urllib.request.urlopen(req, timeout=10) as response:
        res_json = json.loads(response.read().decode("utf-8"))
        print("Supported Models:")
        for m in res_json.get("models", []):
            print(f"- {m['name']}")
except urllib.error.HTTPError as e:
    print(f"Error {e.code}: {e.read().decode('utf-8')}")
except Exception as e:
    print(f"Failed: {str(e)}")
