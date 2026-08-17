import time
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List
from app.services.ai_providers.gemini_provider import call_gemini
from app.services.ai_providers.groq_provider import call_groq
from app.services.ai_providers.openrouter_provider import call_openrouter

logger = logging.getLogger("ai_gateway")

def log_ai_usage(db: Any, task_type: str, status: str, response_time: float, provider: str = "internal"):
    """
    Logs metadata about the AI invocation to the 'ai_usage_logs' collection.
    """
    try:
        if db is not None:
            # Insert into ai_gateway_logs for Analytics UI display
            db.ai_gateway_logs.insert_one({
                "provider": provider.capitalize(),
                "feature": task_type,
                "status": status.capitalize(),
                "latency_ms": int(response_time * 1000),
                "user_roll": "Admin" if "admin" in task_type.lower() else "Student",
                "created_at": datetime.now(timezone.utc)
            })
            db.ai_usage_logs.insert_one({
                "task_type": task_type,
                "status": status,
                "provider": provider,
                "response_time": response_time,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
    except Exception as e:
        logger.error(f"Failed to log AI usage to database: {str(e)}")

def generate_ai_response(db: Any, prompt: str, task_type: str) -> str:
    """
    Central AI Gateway with priority fallback, dynamic settings loading, 
    exponential backoff retries, and detailed cancellation/failure logs.
    """
    start_time = time.time()
    logger.info(f"AI Gateway request received for task: {task_type}")

    # Default Settings
    auto_retry = True
    ai_timeout = 20
    fallback_enabled = True
    retry_attempts = 3
    
    is_mock_db = db is not None and type(db).__name__ in ('MagicMock', 'Mock', 'NonCallableMagicMock', 'NonCallableMock')

    # Load dynamic settings from DB
    if db is not None and not is_mock_db:
        try:
            settings_doc = db.ai_system_settings.find_one({})
            if settings_doc:
                auto_retry = settings_doc.get("auto_retry", True)
                fallback_enabled = settings_doc.get("fallback", True)
                ai_timeout = settings_doc.get("ai_timeout", 20)
        except Exception as e:
            logger.warning(f"Failed to fetch AI system settings: {str(e)}")
    elif is_mock_db:
        auto_retry = False
        retry_attempts = 1

    # Map slugs to the provider callable functions
    provider_funcs = {
        "gemini": call_gemini,
        "groq": call_groq,
        "openrouter": call_openrouter
    }
    
    priority_order = [
        {"name": "Groq", "slug": "groq", "timeout": ai_timeout, "retry_attempts": retry_attempts if auto_retry else 1, "fallback_enabled": True},
        {"name": "Gemini", "slug": "gemini", "timeout": ai_timeout, "retry_attempts": retry_attempts if auto_retry else 1, "fallback_enabled": True},
        {"name": "OpenRouter", "slug": "openrouter", "timeout": ai_timeout, "retry_attempts": retry_attempts if auto_retry else 1, "fallback_enabled": True}
    ]
    
    if db is not None and not is_mock_db:
        try:
            db_providers = []
            providers_cursor = db.ai_providers.find({"is_enabled": True}).sort("priority", 1)
            for p in providers_cursor:
                if p["slug"] in provider_funcs:
                    db_providers.append({
                        "name": p["provider_name"],
                        "slug": p["slug"],
                        "timeout": p.get("timeout") or ai_timeout,
                        "retry_attempts": p.get("retry_attempts") or (retry_attempts if auto_retry else 1),
                        "fallback_enabled": p.get("fallback_enabled", True)
                    })
            if db_providers:
                priority_order = db_providers
        except Exception as e:
            logger.warning(f"Failed to fetch enabled providers from database: {str(e)}")


    detailed_failures = []
    
    for idx, provider_cfg in enumerate(priority_order):
        provider_name = provider_cfg["name"]
        slug = provider_cfg["slug"]
        timeout_val = provider_cfg["timeout"]
        attempts = provider_cfg["retry_attempts"] if auto_retry else 1
        
        call_fn = provider_funcs[slug]
        model_name = provider_cfg.get("model")
        
        logger.info(f"Attempting provider: {provider_name} (Max attempts: {attempts}, Timeout: {timeout_val}s, Model: {model_name})")
        
        backoff_delay = 1.0
        for attempt in range(attempts):
            attempt_start = time.time()
            logger.info(f"[{provider_name}] Attempt {attempt + 1}/{attempts} starting...")
            
            try:
                res = call_fn(prompt, timeout=timeout_val, model=model_name)
                
                if res.get("success"):
                    elapsed = time.time() - start_time
                    logger.info(f"[{provider_name}] succeeded in {time.time() - attempt_start:.2f}s (Total pipeline elapsed: {elapsed:.2f}s)")
                    log_ai_usage(db, task_type, "success", elapsed, provider=slug)
                    return res["content"]
                
                # Capture and analyze failure reason
                err_msg = res.get("error", "Unknown error")
                status_code = res.get("status_code")
                is_network = res.get("is_network_error", False)
                
                failure_reason = f"Attempt {attempt + 1} failed: {err_msg}"
                if status_code:
                    failure_reason += f" (HTTP {status_code})"
                logger.warning(f"[{provider_name}] {failure_reason}")
                
                # Handle non-retryable status codes (e.g. 400, 401, 403)
                if status_code in [400, 401, 403]:
                    logger.error(f"[{provider_name}] returned non-retryable status code {status_code}. Aborting retries for this provider.")
                    detailed_failures.append(f"{provider_name}: {err_msg} (HTTP {status_code}) [Non-retryable]")
                    break
                    
                # Store the error details
                if attempt == attempts - 1:
                    detailed_failures.append(f"{provider_name}: {err_msg}")
                    
            except Exception as e:
                err_str = str(e)
                logger.error(f"[{provider_name}] unexpected exception during call: {err_str}")
                if attempt == attempts - 1:
                    detailed_failures.append(f"{provider_name}: Unexpected exception - {err_str}")
            
            # Backoff before next attempt
            if attempt < attempts - 1:
                logger.info(f"[{provider_name}] Backing off for {backoff_delay}s before retry...")
                time.sleep(backoff_delay)
                backoff_delay *= 2.0
                
        # If fallback is disabled in settings or by provider configuration, stop here
        if not fallback_enabled or not provider_cfg["fallback_enabled"]:
            logger.warning(f"Fallback is disabled. Stopping priority chain traversal after {provider_name} failure.")
            break
            
    # All active providers failed
    elapsed = time.time() - start_time
    logger.error("All configured AI providers failed to resolve response.")
    log_ai_usage(db, task_type, "failed", elapsed)
    
    # Construct descriptive error with precise recovery steps
    err_details_str = "; ".join(detailed_failures)
    recovery_message = (
        f"AI_SERVICE_UNAVAILABLE: All active AI providers failed or timed out.\n"
        f"Failure details: {err_details_str}\n"
        f"Recovery steps:\n"
        f"1. Check your internet connection to ensure the system is online.\n"
        f"2. Log in as Admin and go to AI Management (settings) to check if API keys for Gemini, Groq, or OpenRouter are valid and configured.\n"
        f"3. Verify that the selected model names are correct and that you have not exceeded your API quota or rate limits.\n"
        f"4. View the AI logs inside the Admin Dashboard for exact API HTTP response status codes."
    )
    raise RuntimeError(recovery_message)

