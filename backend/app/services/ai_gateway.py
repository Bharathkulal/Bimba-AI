import time
import logging
from datetime import datetime, timezone
from typing import Dict, Any
from app.services.ai_providers.gemini_provider import call_gemini
from app.services.ai_providers.groq_provider import call_groq
from app.services.ai_providers.openrouter_provider import call_openrouter

logger = logging.getLogger("ai_gateway")

def log_ai_usage(db: Any, task_type: str, status: str, response_time: float):
    """
    Logs metadata about the AI invocation to the 'ai_usage_logs' collection.
    """
    try:
        db.ai_usage_logs.insert_one({
            "task_type": task_type,
            "status": status,
            "provider": "internal",
            "response_time": response_time,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        logger.error(f"Failed to log AI usage to database: {str(e)}")

def generate_ai_response(db: Any, prompt: str, task_type: str) -> str:
    """
    Central AI Gateway with priority fallback handling:
    1. Gemini
    2. Groq
    3. OpenRouter
    
    If all providers fail, raises a RuntimeError: "AI_SERVICE_UNAVAILABLE".
    """
    start_time = time.time()
    logger.info(f"AI Gateway request received for task: {task_type}")

    # 1. Try Gemini
    logger.info("Attempting Gemini API request...")
    res = call_gemini(prompt)
    if res.get("success"):
        elapsed = time.time() - start_time
        logger.info(f"Gemini call succeeded in {elapsed:.2f}s")
        log_ai_usage(db, task_type, "success", elapsed)
        return res["content"]

    # 2. Try Groq (Fallback 1)
    logger.warning("Gemini failed. Attempting Groq API request...")
    res = call_groq(prompt)
    if res.get("success"):
        elapsed = time.time() - start_time
        logger.info(f"Groq call succeeded in {elapsed:.2f}s")
        log_ai_usage(db, task_type, "success", elapsed)
        return res["content"]

    # 3. Try OpenRouter (Fallback 2)
    logger.warning("Groq failed. Attempting OpenRouter API request...")
    res = call_openrouter(prompt)
    if res.get("success"):
        elapsed = time.time() - start_time
        logger.info(f"OpenRouter call succeeded in {elapsed:.2f}s")
        log_ai_usage(db, task_type, "success", elapsed)
        return res["content"]

    # All providers failed
    elapsed = time.time() - start_time
    logger.error("All AI providers failed to resolve response.")
    log_ai_usage(db, task_type, "failed", elapsed)
    raise RuntimeError("AI_SERVICE_UNAVAILABLE")
