"""
SkillSetu - Core Configuration Module
Step 1: Project Foundation
"""
import os
from typing import List
from dotenv import load_dotenv

# Load environment variables from root or local .env if present
load_dotenv()

class Settings:
    PROJECT_NAME: str = "SkillSetu API"
    PROJECT_DESCRIPTION: str = "Portal for Academia - Industry collaboration for Skill Mapping, Internships and Placement"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"

    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")

    # Host & Port config for backend service
    HOST: str = os.getenv("BACKEND_HOST", "127.0.0.1")
    PORT: int = int(os.getenv("BACKEND_PORT", "8001"))

    # MongoDB Configuration
    # Safe defaults for local development; override via MONGODB_URI & DATABASE_NAME
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "skillsetu")
    MONGODB_SERVER_TIMEOUT_MS: int = int(os.getenv("MONGODB_SERVER_TIMEOUT_MS", "2000"))

    # CORS configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "*"
    ]

settings = Settings()
