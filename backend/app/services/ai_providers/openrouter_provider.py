import json
import urllib.request
import logging
import os
from typing import Dict, Any

logger = logging.getLogger("openrouter_provider")

def call_openrouter(prompt: str) -> Dict[str, Any]:
    """
    Calls the OpenRouter API directly using REST endpoints.
    """
    openrouter_key = os.getenv("OPENROUTER_API_KEY", "")
    
    if not openrouter_key:
        logger.error("OpenRouter API key is not configured.")
        return {"success": False, "error": "OpenRouter API key missing."}
        
    url = "https://openrouter.ai/api/v1/chat/completions"
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {openrouter_key}",
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
        
        with urllib.request.urlopen(req, timeout=12) as response:
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
            
    except Exception as e:
        logger.error(f"OpenRouter API call failed: {str(e)}")
        return {"success": False, "error": str(e)}
