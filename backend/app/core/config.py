import os
from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Bimba AI"
    API_V1_STR: str = "/api"
    
    # Database
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "bimba_ai")

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super_secret_placement_system_key")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ADMIN_USERNAME: str = os.getenv("ADMIN_USERNAME", "admin")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "admin")

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173",  # default Vite dev server
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    model_config = ConfigDict(case_sensitive=True)

settings = Settings()
