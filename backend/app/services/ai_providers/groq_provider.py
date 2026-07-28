import json
import urllib.request
import logging
import os
from typing import Dict, Any

logger = logging.getLogger("groq_provider")

def call_groq(prompt: str) -> Dict[str, Any]:
    """
    Calls the Groq API directly using REST endpoints.
    """
    groq_key = os.getenv("GROQ_API_KEY", "")
    
    if not groq_key:
        logger.error("Groq API key is not configured.")
        return {"success": False, "error": "Groq API key missing."}
        
    url = "https://api.groq.com/openapi/v1/chat/completions"
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {groq_key}"
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
                    
            logger.warning(f"Groq returned unexpected JSON structure: {res_body}")
            return {"success": False, "error": "Empty or invalid response structure."}
            
    except Exception as e:
        logger.error(f"Groq API call failed: {str(e)}")
        return {"success": False, "error": str(e)}
