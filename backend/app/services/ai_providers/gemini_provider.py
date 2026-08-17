import json
import urllib.request
import logging
from typing import Dict, Any
from app.core.config import settings

logger = logging.getLogger("gemini_provider")

def call_gemini(prompt: str, api_key: str = None, timeout: int = 12, model: str = None) -> Dict[str, Any]:
    """
    Calls the Gemini API directly using REST endpoints.
    """
    if not api_key:
        import os
        api_key = os.getenv("GEMINI_API_KEY", "").strip()
    
    if not api_key:
        logger.error("Gemini API key is not configured.")
        return {"success": False, "error": "Gemini API key missing."}
        
    if not model:
        model = "gemini-2.0-flash"
    elif model.startswith("models/"):
        model = model.replace("models/", "")
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    
    headers = {
        "Content-Type": "application/json"
    }
    
    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": prompt
                    }
                ]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }
    
    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        
        with urllib.request.urlopen(req, timeout=timeout) as response:
            res_body = response.read().decode("utf-8")
            res_json = json.loads(res_body)
            
            # Extract content from response structure
            candidates = res_json.get("candidates", [])
            if candidates:
                text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                if text:
                    return {
                        "success": True,
                        "content": text
                    }
            
            logger.warning(f"Gemini returned unexpected JSON structure: {res_body}")
            return {"success": False, "error": "Empty or invalid response structure."}
            
    except urllib.error.HTTPError as e:
        logger.error(f"Gemini API HTTP Error {e.code}: {e.reason}")
        return {
            "success": False, 
            "error": f"HTTP Error {e.code}: {e.reason}", 
            "status_code": e.code
        }
    except urllib.error.URLError as e:
        logger.error(f"Gemini API Network/Timeout Error: {e.reason}")
        return {
            "success": False, 
            "error": f"Network Error: {e.reason}", 
            "is_network_error": True
        }
    except Exception as e:
        logger.error(f"Gemini API unexpected failure: {str(e)}")
        return {"success": False, "error": str(e)}

