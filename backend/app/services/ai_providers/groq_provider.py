import json
import urllib.request
import logging
import os
from typing import Dict, Any

logger = logging.getLogger("groq_provider")

def call_groq(prompt: str, api_key: str = None, timeout: int = 12) -> Dict[str, Any]:
    """
    Calls the Groq API directly using REST endpoints.
    """
    if not api_key:
        import os
        api_key = os.getenv("GROQ_API_KEY", "").strip()
    
    if not api_key:
        logger.error("Groq API key is not configured.")
        return {"success": False, "error": "Groq API key missing."}
        
    url = "https://api.groq.com/openai/v1/chat/completions"
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    
    payload = {
        "model": "mixtral-8x7b-32768",
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
                    
            logger.warning(f"Groq returned unexpected JSON structure: {res_body}")
            return {"success": False, "error": "Empty or invalid response structure."}
            
    except urllib.error.HTTPError as e:
        logger.error(f"Groq API HTTP Error {e.code}: {e.reason}")
        return {
            "success": False, 
            "error": f"HTTP Error {e.code}: {e.reason}", 
            "status_code": e.code
        }
    except urllib.error.URLError as e:
        logger.error(f"Groq API Network/Timeout Error: {e.reason}")
        return {
            "success": False, 
            "error": f"Network Error: {e.reason}", 
            "is_network_error": True
        }
    except Exception as e:
        logger.error(f"Groq API unexpected failure: {str(e)}")
        return {"success": False, "error": str(e)}

