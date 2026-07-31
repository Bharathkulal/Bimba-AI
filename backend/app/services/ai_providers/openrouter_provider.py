import json
import urllib.request
import logging
import os
from typing import Dict, Any

logger = logging.getLogger("openrouter_provider")

def call_openrouter(prompt: str, api_key: str = None, timeout: int = 12) -> Dict[str, Any]:
    """
    Calls the OpenRouter API directly using REST endpoints.
    """
    if not api_key:
        import os
        api_key = os.getenv("OPENROUTER_API_KEY", "").strip()
    
    if not api_key:
        logger.error("OpenRouter API key is not configured.")
        return {"success": False, "error": "OpenRouter API key missing."}
        
    url = "https://openrouter.ai/api/v1/chat/completions"
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": "https://bimba.ai",
        "X-Title": "Bimba AI"
    }
    
    payload = {
        "model": "meta-llama/llama-3-8b-instruct:free",
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
        "response_format": {
            "type": "json_object"
        },
        "temperature": 0.1
    }
    
    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        
        with urllib.request.urlopen(req, timeout=timeout) as response:
            res_body = response.read().decode("utf-8")
            res_json = json.loads(res_body)
            
            choices = res_json.get("choices", [])
            if choices:
                text = choices[0].get("message", {}).get("content", "")
                if text:
                    return {
                        "success": True,
                        "content": text
                    }
                    
            logger.warning(f"OpenRouter returned unexpected JSON structure: {res_body}")
            return {"success": False, "error": "Empty or invalid response structure."}
            
    except urllib.error.HTTPError as e:
        logger.error(f"OpenRouter API HTTP Error {e.code}: {e.reason}")
        return {
            "success": False, 
            "error": f"HTTP Error {e.code}: {e.reason}", 
            "status_code": e.code
        }
    except urllib.error.URLError as e:
        logger.error(f"OpenRouter API Network/Timeout Error: {e.reason}")
        return {
            "success": False, 
            "error": f"Network Error: {e.reason}", 
            "is_network_error": True
        }
    except Exception as e:
        logger.error(f"OpenRouter API unexpected failure: {str(e)}")
        return {"success": False, "error": str(e)}

