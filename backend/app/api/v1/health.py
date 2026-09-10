"""
SkillSetu Health & Diagnostics API Router
Step 1: Project Foundation
"""
from datetime import datetime, timezone
from fastapi import APIRouter
from backend.app.core.config import settings
from backend.app.core.database import db_manager

router = APIRouter(tags=["Health"])

@router.get("/health", summary="System Health & Diagnostic Status")
def get_health_status():
    """
    Returns service health status, runtime metadata, and MongoDB connectivity state.
    Used for monitoring and verification.
    """
    db_status = db_manager.get_status()
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "environment": settings.ENVIRONMENT,
        "database": db_status,
        "step": "STEP 4 - STANDARDIZED ASSESSMENT ENGINE & SKILL SCORING"
    }
