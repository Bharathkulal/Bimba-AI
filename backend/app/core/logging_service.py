import logging
import re
import traceback

class SecretMaskerFilter(logging.Filter):
    def __init__(self, patterns=None):
        super().__init__()
        self.patterns = patterns or [
            r"(?i)api[-_]?key\s*[:=]\s*['\"]?([a-zA-Z0-9_\-\.\:\@]{6,})['\"]?",
            r"(?i)bearer\s+([a-zA-Z0-9_\-\.\:\@]{10,})",
            r"(?i)password\s*[:=]\s*['\"]?([^'\"\s]{3,})['\"]?",
            r"(?i)mongodb\+srv://[^:]+:([^@]+)@",
            r"(?i)mongodb://[^:]+:([^@]+)@"
        ]

    def filter(self, record):
        if isinstance(record.msg, str):
            record.msg = self.mask(record.msg)
        return True

    def mask(self, text: str) -> str:
        for pattern in self.patterns:
            text = re.sub(pattern, lambda m: m.group(0).replace(m.group(1), "********"), text)
        return text

# Set up central logger
logger = logging.getLogger("bimba_ai_pipeline")
logger.setLevel(logging.INFO)

# Avoid adding multiple handlers if import happens repeatedly
if not logger.handlers:
    ch = logging.StreamHandler()
    formatter = logging.Formatter("[%(asctime)s] %(levelname)s [%(name)s]: %(message)s")
    ch.setFormatter(formatter)
    logger.addHandler(ch)
    logger.addFilter(SecretMaskerFilter())

def log_stage(stage: str, status: str, message: str, **kwargs):
    meta = " | ".join(f"{k}={v}" for k, v in kwargs.items()) if kwargs else ""
    log_line = f"[{stage}] {status} - {message}"
    if meta:
        log_line += f" ({meta})"
    logger.info(log_line)

def log_error(stage: str, message: str, error: Exception, **kwargs):
    tb = "".join(traceback.format_exception(type(error), error, error.__traceback__))
    meta = " | ".join(f"{k}={v}" for k, v in kwargs.items()) if kwargs else ""
    log_line = f"[{stage}] ERROR - {message} | Error: {str(error)}"
    if meta:
        log_line += f" ({meta})"
    logger.error(log_line)
    logger.error(f"Stack Trace:\n{tb}")
