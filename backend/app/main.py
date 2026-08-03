from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load env variables from .env
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

# Strict environment variable validation
required_env_vars = ["GEMINI_API_KEY", "GROQ_API_KEY", "OPENROUTER_API_KEY", "MONGODB_URI"]
for var in required_env_vars:
    val = os.getenv(var, "").strip()
    if not val:
        raise RuntimeError(f"Missing {var} in .env file. Please check configuration.")
    if val.startswith("mock_") or "placeholder" in val.lower():
        print(f"WARNING: {var} appears to be configured with placeholder content: {val}")

from app.core.config import settings
from app.api.v1.monitoring.monitoring_routes import router as health_router
from app.api.v1.auth.auth_routes import router as auth_router
from app.api.analytics import router as analytics_router
from app.api.v1.ai.ai_routes import router as ai_admin_router
from app.api.v1.users.users_routes import router as admin_portal_router
from app.api.v1.resumes.resumes_routes import router as resume_studio_router
from app.api.jobs import router as jobs_router, companies_router
from app.api.v1.files.files_routes import router as files_router, cloudinary_router
from app.api.v1.resumes.resume_extract import router as resume_extract_router
from app.api.v1.resumes.resume_builder import router as resume_builder_router
from app.api.v1.placement.placement_routes import router as placement_router
from app.database.init_db import init_db

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

@app.on_event("startup")
def on_startup():
    init_db()

from fastapi.middleware.gzip import GZipMiddleware

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Gzip compression setup
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Include Routers
app.include_router(health_router, prefix=settings.API_V1_STR)
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(ai_admin_router, prefix=settings.API_V1_STR)
app.include_router(admin_portal_router, prefix=settings.API_V1_STR)
app.include_router(resume_studio_router, prefix=settings.API_V1_STR)
app.include_router(jobs_router, prefix=settings.API_V1_STR)
app.include_router(companies_router, prefix=settings.API_V1_STR)
app.include_router(files_router, prefix=settings.API_V1_STR)
app.include_router(cloudinary_router, prefix=settings.API_V1_STR)
app.include_router(resume_extract_router, prefix=settings.API_V1_STR)
app.include_router(resume_builder_router, prefix=settings.API_V1_STR)
app.include_router(placement_router, prefix=settings.API_V1_STR)

# Expose health check at root-level "/health" - db refresh reload
app.include_router(health_router)

@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} Backend API foundation.",
        "docs": "/docs",
        "health": "/health"
    }
# Hot reload trigger comment

