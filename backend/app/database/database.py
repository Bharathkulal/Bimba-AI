import os
from sqlalchemy import create_engine
from app.core.config import settings

# Determine DB URL
db_url = settings.DATABASE_URL
if not db_url or "sqlite" in db_url:
    # Ensure correct local SQLite path
    db_url = "sqlite:///./database/sqlite/bimba_ai.db"
    settings.DATABASE_URL = db_url

try:
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
    )
    with engine.connect() as conn:
        pass
    print(f"Connected to database successfully using URL: {db_url}")
except Exception as e:
    print(f"Database connection failed: {e}")
    fallback_url = "sqlite:///./database/sqlite/bimba_ai.db"
    print(f"Falling back to local SQLite database ({fallback_url})...")
    settings.DATABASE_URL = fallback_url
    engine = create_engine(
        fallback_url,
        connect_args={"check_same_thread": False}
    )
