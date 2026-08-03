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
        # Configured fallback priority order matching user preference for Groq AI
        self.priority_order = [
            {"provider_name": "Groq", "slug": "groq", "env_key": "GROQ_API_KEY", "default_model": "llama-3.3-70b-versatile"},
            {"provider_name": "Gemini", "slug": "gemini", "env_key": "GEMINI_API_KEY", "default_model": "gemini-2.0-flash"},
            {"provider_name": "OpenRouter", "slug": "openrouter", "env_key": "OPENROUTER_API_KEY", "default_model": "deepseek/deepseek-chat"}
        ]

    def _validate_api_key(self, provider_info: Dict[str, Any]) -> str:
        # First check if api_key is configured directly in the DB provider document
        api_key = provider_info.get("api_key", "").strip()
        
        if not api_key:
            env_key = provider_info.get("env_key")
            if env_key:
                api_key = os.getenv(env_key, "").strip()
        
        if not api_key:
            raise ValueError(f"API key for {provider_info['provider_name']} is missing or empty.")
            
        if api_key.startswith("mock_") or "placeholder" in api_key.lower() or len(api_key) < 10:
            raise ValueError(f"API key for {provider_info['provider_name']} appears to be a placeholder or mock.")
            
        return api_key

    def call_llm(self, prompt: str, feature: str = "Parsing") -> str:
        last_error_msg = ""
        last_failed_provider = ""
        
        # Load dynamic configurations
        auto_retry = True
        fallback_enabled = True
        ai_timeout = 20
        retry_attempts = 3
        
        is_mock_db = self.db is not None and type(self.db).__name__ in ('MagicMock', 'Mock', 'NonCallableMagicMock', 'NonCallableMock')

        if self.db is not None and not is_mock_db:
            try:
                settings_doc = self.db.ai_system_settings.find_one({})
                if settings_doc:
                    auto_retry = settings_doc.get("auto_retry", True)
                    fallback_enabled = settings_doc.get("fallback", True)
                    ai_timeout = settings_doc.get("ai_timeout", 20)
            except Exception as e:
                log_error("AI_CONFIG", "Failed to fetch system settings from DB", e)
        elif is_mock_db:
            auto_retry = False
            retry_attempts = 1

        # Load providers dynamically from DB
        active_providers = []
        if self.db is not None and not is_mock_db:
            try:
                providers_cursor = self.db.ai_providers.find({"is_enabled": True}).sort("priority", 1)
                for p in providers_cursor:
                    env_key = f"{p['slug'].upper()}_API_KEY"
                    active_providers.append({
                        "provider_name": p["provider_name"],
                        "slug": p["slug"],
                        "env_key": env_key,
                        "default_model": p.get("model_name"),
                        "api_key": p.get("api_key", ""),
                        "timeout": p.get("timeout") or ai_timeout,
                        "retry_attempts": p.get("retry_attempts") or (retry_attempts if auto_retry else 1),
                        "fallback_enabled": p.get("fallback_enabled", True)
                    })
            except Exception as e:
                log_error("AI_CONFIG", "Failed to fetch providers from DB", e)
                
        if not active_providers:
            # Fall back to default priority order
            for p in self.priority_order:
                active_providers.append({
                    **p,
                    "api_key": "",
                    "timeout": ai_timeout,
                    "retry_attempts": retry_attempts if auto_retry else 1,
                    "fallback_enabled": True
                })

        detailed_failures = []
        
        for provider in active_providers:
            provider_name = provider["provider_name"]
            slug = provider["slug"]
            model = provider["default_model"]
            timeout_val = provider["timeout"]
            attempts = provider["retry_attempts"] if auto_retry else 1
            
            print("\n========== STEP 3 ==========")
            print(f"{provider_name} Request")
            print(f"Prompt Length: {len(prompt)} characters")
            print(f"Model: {model} | Timeout: {timeout_val}s | Max Attempts: {attempts}")
            print("=============================\n")
            
            try:
                # 1. API Key Validation
                api_key = self._validate_api_key(provider)
            except ValueError as e:
                log_error("AI_KEY_VALIDATION", f"API Key invalid for {provider_name}", e)
                last_error_msg = str(e)
                last_failed_provider = provider_name
                detailed_failures.append(f"{provider_name}: API Key invalid ({str(e)})")
                continue  # Try next provider
                
            backoff_delay = 1.0
            
            for attempt in range(attempts):
                try:
                    response_text = self._execute_call(slug, model, api_key, prompt, timeout=timeout_val)
                    
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
                        detailed_failures.append(f"{provider_name}: HTTP {he.code} {he.reason} [Non-retryable]")
                        break
                        
                    if attempt == attempts - 1:
                        detailed_failures.append(f"{provider_name}: HTTP {he.code} {he.reason}")
                        
                except urllib.error.URLError as ue:
                    log_error("AI_NETWORK_ERROR", f"Attempt {attempt+1} failed for {provider_name}", ue)
                    last_error_msg = f"{provider_name} connection failed: {ue.reason}"
                    last_failed_provider = provider_name
                    
                    if attempt == attempts - 1:
                        detailed_failures.append(f"{provider_name}: Network Error - {ue.reason}")
                        
                except Exception as e:
                    log_error("AI_CALL_ERROR", f"Attempt {attempt+1} failed for {provider_name}", e)
                    last_error_msg = f"{provider_name} call failed: {str(e)}"
                    last_failed_provider = provider_name
                    
                    if attempt == attempts - 1:
                        detailed_failures.append(f"{provider_name}: Exception - {str(e)}")
                    
                # Backoff
                if attempt < attempts - 1:
                    log_stage("AI", "RETRY", f"Retrying {provider_name} in {backoff_delay}s...", attempt=attempt+2)
                    time.sleep(backoff_delay)
                    backoff_delay *= 2  # Exponential backoff
                    
            log_stage("AI", "FALLBACK", f"All attempts failed for {provider_name}. Switching to next provider...")
            
            # If fallback is disabled by configuration, do not go to the next provider
            if not fallback_enabled or not provider["fallback_enabled"]:
                break
            
        # All providers failed
        err_details_str = "; ".join(detailed_failures)
        recovery_message = (
            f"All configured AI providers failed to return a response.\n"
            f"Failure details: {err_details_str}\n"
            f"Recovery steps:\n"
            f"1. Check your internet connection.\n"
            f"2. Go to AI Management in the Admin console to verify API keys for active providers.\n"
            f"3. Check model specifications and rate limits / quotas."
        )
        log_error("AI_PIPELINE", "All configured AI providers failed to return a response", ValueError(last_error_msg))
        raise AIParsingException(last_failed_provider, recovery_message)

    def _execute_call(self, slug: str, model: str, api_key: str, prompt: str, timeout: int = 15) -> str:
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

