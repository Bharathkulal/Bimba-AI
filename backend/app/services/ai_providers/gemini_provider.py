import json
import urllib.request
import logging
from typing import Dict, Any
from app.core.config import settings

logger = logging.getLogger("gemini_provider")

def call_gemini(prompt: str) -> Dict[str, Any]:
    """
    Calls the Gemini API directly using REST endpoints.
    """
    api_key = settings.CLOUDINARY_API_KEY # Wait, let's verify if Settings has GEMINI_API_KEY.
    # We should read settings.GEMINI_API_KEY from environment or config.
    # In backend/.env, GEMINI_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY are configured.
    # Let's import os to load them directly from os.getenv to avoid any settings mapping issues.
    import os
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    
    if not gemini_key:
        logger.error("Gemini API key is not configured.")
        return {"success": False, "error": "Gemini API key missing."}
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
    
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
        
        # 10 second timeout for responsiveness
        with urllib.request.urlopen(req, timeout=12) as response:
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
            
    except Exception as e:
        logger.error(f"Gemini API call failed: {str(e)}")
        return {"success": False, "error": str(e)}
