from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load env variables from .env
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

from app.core.config import settings
from app.api.v1.monitoring.monitoring_routes import router as health_router
from app.api.v1.auth.auth_routes import router as auth_router
from app.api.analytics import router as analytics_router
from app.api.v1.ai.ai_routes import router as ai_admin_router
from app.api.v1.users.users_routes import router as admin_portal_router
from app.api.v1.resumes.resumes_routes import router as resume_studio_router
from app.database.init_db import init_db

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

@app.on_event("startup")
def on_startup():
    init_db()

# CORS setup
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Include Routers
app.include_router(health_router, prefix=settings.API_V1_STR)
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(ai_admin_router, prefix=settings.API_V1_STR)
app.include_router(admin_portal_router, prefix=settings.API_V1_STR)
app.include_router(resume_studio_router, prefix=settings.API_V1_STR)

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

