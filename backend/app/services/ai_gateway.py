import json
import urllib.request
import urllib.error
import time
from typing import List, Dict, Any, Optional
from datetime import datetime
from fastapi import HTTPException, status

from app.models.ai_admin import AIProvider, AIGatewayLog
from app.utils.crypto import decrypt_key
from app.core.mongodb import MongoModel, get_next_sequence

def log_gateway_event(
    db: Any,
    provider_name: str,
    feature: str,
    status: str,
    latency_ms: int,
    user_roll: str,
    prompt_len: int,
    tokens: int = 0,
    error: str = None,
    retries: int = 0
):
    try:
        db.ai_gateway_logs.insert_one({
            "id": get_next_sequence("ai_gateway_logs"),
            "provider": provider_name,
            "feature": feature,
            "status": status,
            "latency_ms": latency_ms,
            "user_roll": user_roll,
            "prompt_length": prompt_len,
            "tokens_used": tokens,
            "error_message": error,
            "retry_count": retries,
            "created_at": datetime.utcnow()
        })
    except Exception as e:
        print(f"[Gateway Logging Error] {e}")

def call_gemini(api_key: str, model: str, prompt: str, temperature: float, max_tokens: int, timeout: int) -> str:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": max_tokens
        }
    }
    headers = {"Content-Type": "application/json"}
    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as response:
        res_data = json.loads(response.read().decode('utf-8'))
        return res_data["candidates"][0]["content"]["parts"][0]["text"]

def call_openai_compatible(url: str, api_key: str, model: str, prompt: str, temperature: float, max_tokens: int, timeout: int) -> str:
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature,
        "max_tokens": max_tokens
    }
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as response:
        res_data = json.loads(response.read().decode('utf-8'))
        return res_data["choices"][0]["message"]["content"]

def call_claude(api_key: str, model: str, prompt: str, temperature: float, max_tokens: int, timeout: int) -> str:
    url = "https://api.anthropic.com/v1/messages"
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": max_tokens,
        "temperature": temperature
    }
    headers = {
        "Content-Type": "application/json",
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01"
    }
    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as response:
        res_data = json.loads(response.read().decode('utf-8'))
        return res_data["content"][0]["text"]

def execute_llm_call(provider: AIProvider, prompt: str) -> str:
    import os
    env_key = f"{provider.slug.upper()}_API_KEY"
    api_key = os.getenv(env_key, "").strip()
    if not api_key:
        raise ValueError(f"API key for {provider.slug} is missing in backend .env configuration")
        
    model = provider.model_name or "default"
    temp = provider.temperature if provider.temperature is not None else 0.7
    max_t = provider.max_tokens if provider.max_tokens is not None else 2048
    timeout = provider.timeout if provider.timeout is not None else 20
    
    slug = provider.slug
    
    if slug == "gemini":
        if model == "default":
            model = "gemini-2.5-flash"
        return call_gemini(api_key, model, prompt, temp, max_t, timeout)
    elif slug == "openai":
        if model == "default":
            model = "gpt-4o-mini"
        return call_openai_compatible("https://api.openai.com/v1/chat/completions", api_key, model, prompt, temp, max_t, timeout)
    elif slug == "groq":
        if model == "default":
            model = "llama-3.3-70b"
        return call_openai_compatible("https://api.groq.com/openai/v1/chat/completions", api_key, model, prompt, temp, max_t, timeout)
    elif slug == "openrouter":
        if model == "default":
            model = "deepseek/deepseek-chat"
        return call_openai_compatible("https://openrouter.ai/api/v1/chat/completions", api_key, model, prompt, temp, max_t, timeout)
    elif slug == "deepseek":
        if model == "default":
            model = "deepseek-chat"
        return call_openai_compatible("https://api.deepseek.com/chat/completions", api_key, model, prompt, temp, max_t, timeout)
    elif slug == "mistral":
        if model == "default":
            model = "mistral-large-latest"
        return call_openai_compatible("https://api.mistral.ai/v1/chat/completions", api_key, model, prompt, temp, max_t, timeout)
    elif slug == "claude":
        if model == "default":
            model = "claude-3-5-sonnet"
        return call_claude(api_key, model, prompt, temp, max_t, timeout)
    else:
        raise NotImplementedError(f"Provider {slug} not implemented")

def run_ai_gateway_request(
    db: Any,
    prompt: str,
    feature: str,
    user_roll: str
) -> str:
    # Fetch all active providers sorted by priority
    providers_cursor = db.ai_providers.find({"is_enabled": True}).sort("priority", 1)
    providers = [AIProvider(doc) for doc in providers_cursor]
    
    if not providers:
        print("[AI Gateway] No active providers found. Returning mock response.")
        return f"[Simulated Response for {feature}] Prompt: {prompt[:100]}..."

    last_error = None
    fallback_count = 0
    
    for idx, provider in enumerate(providers):
        start_time = time.time()
        retries = provider.retry_attempts if provider.retry_attempts is not None else 3
        
        for attempt in range(retries):
            try:
                import os
                env_key = f"{provider.slug.upper()}_API_KEY"
                decrypted_key = os.getenv(env_key, "").strip()
                if decrypted_key.startswith("mock_") or "mock" in decrypted_key.lower():
                    latency = int((time.time() - start_time) * 1000)
                    log_gateway_event(db, provider.provider_name, feature, "Success", latency, user_roll, len(prompt), 100, None, attempt)
                    return f"[Simulated response from {provider.provider_name}] Verified prompt request successfully executed."
                
                response_text = execute_llm_call(provider, prompt)
                latency = int((time.time() - start_time) * 1000)
                
                log_gateway_event(db, provider.provider_name, feature, "Success", latency, user_roll, len(prompt), len(response_text) // 4, None, attempt)
                return response_text
            except Exception as e:
                last_error = str(e)
                print(f"[AI Gateway] Attempt {attempt+1} failed for {provider.provider_name}: {e}")
                time.sleep(0.5)
                
        latency = int((time.time() - start_time) * 1000)
        log_gateway_event(db, provider.provider_name, feature, "Failed", latency, user_roll, len(prompt), 0, last_error, retries)
        
        if not provider.fallback_enabled:
            print(f"[AI Gateway] Fallback disabled for {provider.provider_name}. Aborting.")
            break
            
        print(f"[AI Gateway] Provider {provider.provider_name} failed. Falling back to next priority.")
        fallback_count += 1
        
    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail=f"All configured AI providers failed. Last error: {last_error}"
    )
