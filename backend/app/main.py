"""
SkillSetu - Main FastAPI Application Entry Point
Problem Statement ID: 26044 | Ministry of Ayush - AIIA
Step 1: Project Foundation
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.core.config import settings
from backend.app.core.database import db_manager
from backend.app.api.routes import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("skillsetu.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle event handler for application startup and shutdown."""
    logger.info("Initializing SkillSetu Backend Foundation (Step 2)...")
    # Attempt MongoDB connection (non-blocking fallback for development/demo safety)
    db_manager.connect()
    if db_manager.db is not None:
        try:
            from backend.app.services.seed_data import seed_database
            seed_database(db_manager.db, force=False)
        except Exception as seed_err:
            logger.warning(f"Auto-seed check notice: {str(seed_err)}")
    yield
    logger.info("Shutting down SkillSetu Backend...")
    db_manager.disconnect()

# Create FastAPI app instance
app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Configure CORS for local development and web clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local/demo flexibility
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler for uncaught errors to ensure clean JSON responses
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception at {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "detail": str(exc) if settings.DEBUG else "An unexpected error occurred. Please contact the administrator.",
            "path": request.url.path
        }
    )

# Root endpoint
@app.get("/", summary="Root Welcome Endpoint")
def read_root():
    return {
        "message": "Welcome to SkillSetu (कौशल सेतु) API",
        "tagline": "Where Skills Meet Opportunity.",
        "version": settings.VERSION,
        "organization": "Ministry of Ayush - All India Institute of Ayurveda",
        "problem_statement_id": "26044",
        "documentation": "/docs",
        "health_check": "/api/health",
        "status": "online"
    }

# Mount central API routes under prefix /api
app.include_router(api_router, prefix=settings.API_PREFIX)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
