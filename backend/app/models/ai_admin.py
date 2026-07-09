from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.database.session import Base

class AIProvider(Base):
    __tablename__ = "ai_providers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)  # "gemini" | "openrouter" | "groq" etc.
    encrypted_api_key = Column(String, nullable=False)
    priority = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    status = Column(String, default="Connected")  # "Connected" | "Healthy" | "Disabled" | "Degraded"
    today_requests = Column(Integer, default=0)
    latency_ms = Column(Integer, default=0)
    success_rate = Column(Integer, default=100)

class AIGatewayLog(Base):
    __tablename__ = "ai_gateway_logs"

    id = Column(Integer, primary_key=True, index=True)
    provider = Column(String, nullable=False)
    feature = Column(String, nullable=False)  # e.g., "Resume Generator"
    status = Column(String, default="Success")  # "Success" | "Failed"
    latency_ms = Column(Integer, default=0)
    user_roll = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=func.now())

class AISystemSettings(Base):
    __tablename__ = "ai_system_settings"

    id = Column(Integer, primary_key=True, index=True)
    auto_retry = Column(Boolean, default=True)
    fallback = Column(Boolean, default=True)
    ai_timeout = Column(Integer, default=20)  # seconds
    request_limit = Column(Integer, default=50)  # requests/min
    log_retention = Column(Integer, default=90)  # days
    debug = Column(Boolean, default=False)
    
    # Security parameters
    jwt_enabled = Column(Boolean, default=True)
    https_enabled = Column(Boolean, default=True)
    rate_limit_enabled = Column(Boolean, default=True)
    firewall_enabled = Column(Boolean, default=True)
    validation_enabled = Column(Boolean, default=True)
    xss_protected = Column(Boolean, default=True)
    sql_injection_protected = Column(Boolean, default=True)
