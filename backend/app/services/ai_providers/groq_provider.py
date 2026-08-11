import json
import urllib.request
import logging
import os
from typing import Dict, Any

logger = logging.getLogger("groq_provider")

def call_groq(prompt: str, api_key: str = None, timeout: int = 12, model: str = None) -> Dict[str, Any]:
    """
    Calls the Groq API directly using REST endpoints.
    Tries high-speed Groq Llama 3 models with fallback.
    """
    if not api_key:
        try:
            import dotenv
            env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), ".env")
            if os.path.exists(env_path):
                dotenv.load_dotenv(dotenv_path=env_path, override=True)
            else:
                dotenv.load_dotenv(override=True)
        except Exception:
            pass
        api_key = os.getenv("GROQ_API_KEY", "").strip()
    
    if not api_key or api_key.lower() in ["development_key", "your_groq_api_key", "change_me"]:
        logger.error("GROQ_API_KEY in backend/.env is unconfigured or set to placeholder 'development_key'.")
        return {"success": False, "error": "GROQ_API_KEY in backend/.env is placeholder 'development_key'. Please enter a valid API key from https://console.groq.com."}
        
    url = "https://api.groq.com/openai/v1/chat/completions"
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
        "User-Agent": "BimbaAI/1.0 (Windows NT 10.0; Win64; x64)"
    }
    
    # Active high-performance models on Groq API
    models_to_try = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"]
    if model:
        models_to_try = [model] + [m for m in models_to_try if m != model]
    
    last_err = None
    for model_name in models_to_try:
        payload = {
            "model": model_name,
            "messages": [
                {
                    "role": "system",
                    "content": "You are an expert ATS (Applicant Tracking System) recruiter and resume analyzer. Return valid JSON only."
                },
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
                        logger.info(f"Groq API succeeded using model '{model_name}'.")
                        return {
                            "success": True,
                            "content": text,
                            "model": model_name
                        }
        except urllib.error.HTTPError as e:
            if e.code == 401:
                last_err = "Groq API Key Unauthorized (Invalid or placeholder key)."
                logger.error("[Groq Provider Error] HTTP 401 Unauthorized: GROQ_API_KEY in backend/.env is placeholder 'development_key'. Please set a valid key from https://console.groq.com")
            else:
                last_err = f"HTTP Error {e.code}: {e.reason}"
                logger.warning(f"Groq model '{model_name}' HTTP error: {last_err}")
            continue
        except Exception as e:
            last_err = str(e)
            logger.warning(f"Groq model '{model_name}' attempt failed: {e}. Trying next model...")
            continue
            
    logger.error(f"All Groq models failed. Last error: {last_err}")
    return {"success": False, "error": f"Groq execution failed: {last_err}"}
