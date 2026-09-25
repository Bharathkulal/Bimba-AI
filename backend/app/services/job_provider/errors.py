class ProviderError(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message

class ProviderNotConfiguredError(ProviderError):
    def __init__(self, message="Provider is not configured"):
        super().__init__("PROVIDER_NOT_CONFIGURED", message)

class ProviderAuthFailedError(ProviderError):
    def __init__(self, message="Provider authentication failed"):
        super().__init__("PROVIDER_AUTH_FAILED", message)

class ProviderRateLimitedError(ProviderError):
    def __init__(self, message="Provider rate limit exceeded"):
        super().__init__("PROVIDER_RATE_LIMITED", message)

class ProviderTimeoutError(ProviderError):
    def __init__(self, message="Provider request timed out"):
        super().__init__("PROVIDER_TIMEOUT", message)

class ProviderNetworkError(ProviderError):
    def __init__(self, message="Provider network error"):
        super().__init__("PROVIDER_NETWORK_ERROR", message)

class ProviderInvalidResponseError(ProviderError):
    def __init__(self, message="Provider returned invalid response"):
        super().__init__("PROVIDER_INVALID_RESPONSE", message)

class ProviderEmptyResultError(ProviderError):
    def __init__(self, message="Provider returned empty result"):
        super().__init__("PROVIDER_EMPTY_RESULT", message)
