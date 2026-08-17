import os
import urllib.request
import urllib.error
import json
from dotenv import load_dotenv

# Load env file
dotenv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
print(f"Loading env from: {dotenv_path}")
load_dotenv(dotenv_path)

headers_base = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def test_gemini():
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return "Not Configured"
    # standard gemini check
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={api_key}"
    payload = {
        "contents": [{"parts": [{"text": "Hello"}]}]
    }
    headers = {"Content-Type": "application/json", **headers_base}
    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            res_json = json.loads(response.read().decode("utf-8"))
            return "Working!"
    except urllib.error.HTTPError as e:
        try:
            err_body = e.read().decode("utf-8")
            return f"Failed: HTTP {e.code} - {err_body}"
        except:
            return f"Failed: HTTP {e.code}"
    except Exception as e:
        return f"Failed: {str(e)}"

def test_openrouter():
    api_key = os.getenv("OPENROUTER_API_KEY", "").strip()
    if not api_key:
        return "Not Configured"
    # Hit limits endpoint to check key validity
    url = "https://openrouter.ai/api/v1/auth/key"
    headers = {
        "Authorization": f"Bearer {api_key}",
        **headers_base
    }
    req = urllib.request.Request(url, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            res_json = json.loads(response.read().decode("utf-8"))
            return f"Working! Limit info: {res_json}"
    except urllib.error.HTTPError as e:
        try:
            err_body = e.read().decode("utf-8")
            return f"Failed: HTTP {e.code} - {err_body}"
        except:
            return f"Failed: HTTP {e.code}"
    except Exception as e:
        return f"Failed: {str(e)}"

def test_groq():
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key:
        return "Not Configured"
    url = "https://api.groq.com/openai/v1/chat/completions"
    payload = {
        "model": "groq/compound",
        "messages": [{"role": "user", "content": "Hello"}]
    }
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
        **headers_base
    }
    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            res_json = json.loads(response.read().decode("utf-8"))
            text = res_json["choices"][0]["message"]["content"].strip()
            return f"Working (Response: {text})"
    except urllib.error.HTTPError as e:
        try:
            err_body = e.read().decode("utf-8")
            return f"Failed: HTTP {e.code} - {err_body}"
        except:
            return f"Failed: HTTP {e.code}"
    except Exception as e:
        return f"Failed: {str(e)}"

if __name__ == "__main__":
    print("\n--- Testing API Keys with Headers ---")
    print(f"Gemini: {test_gemini()}")
    print(f"OpenRouter: {test_openrouter()}")
    print(f"Groq: {test_groq()}")
