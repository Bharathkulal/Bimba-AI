class PipelineException(Exception):
    """Base exception class for all upload pipeline steps."""
    def __init__(self, step: str, provider: str, message: str, details: str = None, status_code: int = 500):
        super().__init__(message)
        self.step = step
        self.provider = provider
        self.message = message
        self.details = details or message
        self.status_code = status_code

class FileTypeException(PipelineException):
    def __init__(self, message: str):
        super().__init__("File Ingestion", "File System", message, status_code=400)

class OCRException(PipelineException):
    def __init__(self, message: str):
        super().__init__("OCR Validation", "OCR Service", message, status_code=422)

class AIParsingException(PipelineException):
    def __init__(self, provider: str, message: str):
        super().__init__("AI Parsing", provider, message, status_code=502)

class JSONValidationException(PipelineException):
    def __init__(self, message: str):
        super().__init__("JSON Schema Validation", "Resume Parser", message, status_code=422)

class DatabaseException(PipelineException):
    def __init__(self, message: str):
        super().__init__("MongoDB Save", "MongoDB Database", message, status_code=500)
