import os
import time
import json
import urllib.request
import urllib.error
from typing import Dict, Any, List
from app.core.exceptions import AIParsingException
from app.core.logging_service import log_stage, log_error

class AIProviderManager:
    def __init__(self, db: Any = None):
        self.db = db
        # Configured priority order
        self.priority_order = [
            {"provider_name": "Gemini", "slug": "gemini", "env_key": "GEMINI_API_KEY", "default_model": "gemini-2.0-flash"},
            {"provider_name": "Groq", "slug": "groq", "env_key": "GROQ_API_KEY", "default_model": "llama-3.3-70b"},
            {"provider_name": "OpenRouter", "slug": "openrouter", "env_key": "OPENROUTER_API_KEY", "default_model": "deepseek/deepseek-chat"}
        ]

    def _validate_api_key(self, provider_info: Dict[str, Any]) -> str:
        env_key = provider_info["env_key"]
        api_key = os.getenv(env_key, "").strip()
        
        if not api_key:
            raise ValueError(f"API key for {provider_info['provider_name']} ({env_key}) is missing or empty.")
            
        if api_key.startswith("mock_") or "placeholder" in api_key.lower() or len(api_key) < 10:
            raise ValueError(f"API key for {provider_info['provider_name']} appears to be a placeholder or mock.")
            
        return api_key

    def call_llm(self, prompt: str, feature: str = "Parsing") -> str:
        last_error_msg = ""
        last_failed_provider = ""
        
        for provider in self.priority_order:
            provider_name = provider["provider_name"]
            slug = provider["slug"]
            model = provider["default_model"]
            
            print("\n========== STEP 3 ==========")
            print(f"{provider_name} Request")
            print(f"Prompt Length: {len(prompt)} characters")
            print(f"Model: {model}")
            print("=============================\n")
            
            try:
                # 1. API Key Validation
                api_key = self._validate_api_key(provider)
            except ValueError as e:
                log_error("AI_KEY_VALIDATION", f"API Key invalid for {provider_name}", e)
                last_error_msg = str(e)
                last_failed_provider = provider_name
                continue  # Try next provider
                
            # Retry Strategy: 3 total attempts per provider (original + 2 retries)
            attempts = 3
            backoff_delay = 1.0
            
            for attempt in range(attempts):
                try:
                    response_text = self._execute_call(slug, model, api_key, prompt)
                    
                    print("\n========== STEP 4 ==========")
                    print(f"{provider_name} Response")
                    print(response_text)
                    print("=============================\n")
                    
                    log_stage("AI", "SUCCESS", f"Parsed successfully using {provider_name}", model=model, attempt=attempt+1)
                    return response_text
                except urllib.error.HTTPError as he:
                    error_text = f"HTTP {he.code}: {he.reason}"
                    log_error("AI_HTTP_ERROR", f"Attempt {attempt+1} failed for {provider_name}", he, code=he.code)
                    last_error_msg = f"{provider_name} returned status {he.code}: {he.reason}"
                    last_failed_provider = provider_name
                    
                    # Do not retry on 401/403/400 (auth or request errors), switch provider immediately
                    if he.code in [400, 401, 403]:
                        break
                        
                except Exception as e:
                    log_error("AI_CALL_ERROR", f"Attempt {attempt+1} failed for {provider_name}", e)
                    last_error_msg = f"{provider_name} call failed: {str(e)}"
                    last_failed_provider = provider_name
                    
                # Backoff
                if attempt < attempts - 1:
                    log_stage("AI", "RETRY", f"Retrying {provider_name} in {backoff_delay}s...", attempt=attempt+2)
                    time.sleep(backoff_delay)
                    backoff_delay *= 2  # Exponential backoff
                    
            log_stage("AI", "FALLBACK", f"All attempts failed for {provider_name}. Switching to next provider...")
            
        # All providers failed
        log_error("AI_PIPELINE", "All configured AI providers failed to return a response", ValueError(last_error_msg))
        raise AIParsingException(last_failed_provider, last_error_msg)

    def _execute_call(self, slug: str, model: str, api_key: str, prompt: str) -> str:
        # Timeout configured to 15 seconds per call to avoid hanging
        timeout = 15
        
        if slug == "gemini":
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.2,
                    "maxOutputTokens": 4096
                }
            }
            headers = {"Content-Type": "application/json"}
            req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers, method="POST")
            
            with urllib.request.urlopen(req, timeout=timeout) as response:
                res_data = json.loads(response.read().decode('utf-8'))
                return res_data["candidates"][0]["content"]["parts"][0]["text"]
                
        else:
            # Groq & OpenRouter use standard OpenAI chat format
            if slug == "groq":
                url = "https://api.groq.com/openai/v1/chat/completions"
            else:
                url = "https://openrouter.ai/api/v1/chat/completions"
                
            payload = {
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.2,
                "max_tokens": 4096
            }
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}"
            }
            req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers, method="POST")
            
            with urllib.request.urlopen(req, timeout=timeout) as response:
                res_data = json.loads(response.read().decode('utf-8'))
                return res_data["choices"][0]["message"]["content"]
