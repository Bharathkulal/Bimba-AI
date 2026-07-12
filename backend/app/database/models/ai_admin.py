from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float
from sqlalchemy.sql import func
from app.database.base import Base

class AIProvider(Base):
    __tablename__ = "ai_providers"

    id = Column(Integer, primary_key=True, index=True)
    provider_name = Column(String, unique=True, index=True, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)  # "gemini" | "openrouter" | "groq" etc.
    encrypted_api_key = Column(String, nullable=True)
    model_name = Column(String, nullable=True, default="gemini-2.5-flash")
    priority = Column(Integer, default=1)
    temperature = Column(Float, default=0.7)
    top_p = Column(Float, default=0.9)
    max_tokens = Column(Integer, default=4096)
    timeout = Column(Integer, default=30)
    retry_attempts = Column(Integer, default=3)
    rate_limit = Column(Integer, default=60)
    fallback_enabled = Column(Boolean, default=True)
    is_enabled = Column(Boolean, default=True)
    connection_status = Column(String, default="Not Configured")
    last_tested_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    updated_by = Column(String, nullable=True)

    # Legacy/compatibility properties
    @property
    def name(self):
        return self.provider_name
    @name.setter
    def name(self, val):
        self.provider_name = val

    @property
    def is_active(self):
        return self.is_enabled
    @is_active.setter
    def is_active(self, val):
        self.is_enabled = val

    @property
    def status(self):
        return self.connection_status
    @status.setter
    def status(self, val):
        self.connection_status = val

    # Compatibility attributes for statistics trackers
    today_requests = 0
    latency_ms = 0
    success_rate = 100

class AIGatewayLog(Base):
    __tablename__ = "ai_gateway_logs"

    id = Column(Integer, primary_key=True, index=True)
    provider = Column(String, nullable=False)
    feature = Column(String, nullable=False)  # e.g., "Resume Generator"
    status = Column(String, default="Success")  # "Success" | "Failed"
    latency_ms = Column(Integer, default=0)
    user_roll = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=func.now())
    
    # Extended log fields
    prompt_length = Column(Integer, default=0)
    tokens_used = Column(Integer, default=0)
    error_message = Column(String, nullable=True)
    retry_count = Column(Integer, default=0)

class AIModel(Base):
    __tablename__ = "ai_models"

    id = Column(Integer, primary_key=True, index=True)
    feature = Column(String, unique=True, index=True, nullable=False) # e.g. "Resume Builder"
    provider_slug = Column(String, nullable=False) # e.g. "gemini"
    model_name = Column(String, nullable=False)
    temperature = Column(Float, default=0.7)
    max_tokens = Column(Integer, default=4096)

class AIPrompt(Base):
    __tablename__ = "ai_prompts"

    id = Column(Integer, primary_key=True, index=True)
    feature = Column(String, unique=True, index=True, nullable=False)
    prompt_text = Column(String, nullable=False)
    version = Column(Integer, default=1)
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())

class AIUsage(Base):
    __tablename__ = "ai_usage"

    id = Column(Integer, primary_key=True, index=True)
    day = Column(String, unique=True, index=True, nullable=False) # "YYYY-MM-DD"
    requests = Column(Integer, default=0)
    tokens = Column(Integer, default=0)
    cost = Column(Float, default=0.0)

class AISystemSettings(Base):
    __tablename__ = "ai_system_settings"

    id = Column(Integer, primary_key=True, index=True)
    auto_retry = Column(Boolean, default=True)
    fallback = Column(Boolean, default=True)
    ai_timeout = Column(Integer, default=20)  # seconds
    request_limit = Column(Integer, default=50)  # requests/min
    log_retention = Column(Integer, default=90)  # days
    debug = Column(Boolean, default=False)
    
    # Global Strategy settings
    default_provider = Column(String, default="gemini")
    fallback_strategy = Column(String, default="Failover") # "Failover" | "Smart Routing" | "Round Robin"
    max_daily_requests = Column(Integer, default=5000)
    max_monthly_requests = Column(Integer, default=150000)
    logging_enabled = Column(Boolean, default=True)
    token_tracking_enabled = Column(Boolean, default=True)
    cost_tracking_enabled = Column(Boolean, default=True)
    
    # Security parameters
    jwt_enabled = Column(Boolean, default=True)
    https_enabled = Column(Boolean, default=True)
    rate_limit_enabled = Column(Boolean, default=True)
    firewall_enabled = Column(Boolean, default=True)
    validation_enabled = Column(Boolean, default=True)
    xss_protected = Column(Boolean, default=True)
    sql_injection_protected = Column(Boolean, default=True)
