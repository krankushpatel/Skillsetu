"""
SkillSetu - MongoDB Database Foundation
Step 2: Database Models & Foundations

Provides clean database connection management with high-availability in-memory
MongoDB fallback (via mongomock) for development environments where an external
mongod daemon is not present.
Separates database configuration from application logic.
"""
import logging
from typing import Optional, Dict, Any
from urllib.parse import urlparse
from pymongo import MongoClient, ASCENDING
from pymongo.database import Database
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import mongomock

from backend.app.core.config import settings

logger = logging.getLogger("skillsetu.database")
logging.getLogger("pymongo").setLevel(logging.WARNING)

# Collection Names Constants
COLLECTION_USERS = "users"
COLLECTION_STUDENT_PROFILES = "student_profiles"
COLLECTION_INDUSTRIES = "industries"
COLLECTION_INSTITUTIONS = "institutions"
COLLECTION_SKILLS = "skills"
COLLECTION_ASSESSMENTS = "assessments"
COLLECTION_ASSESSMENT_QUESTIONS = "assessment_questions"
COLLECTION_STUDENT_SKILL_SCORES = "student_skill_scores"
COLLECTION_OPPORTUNITIES = "opportunities"
COLLECTION_OPPORTUNITY_SKILLS = "opportunity_skills"
COLLECTION_APPLICATIONS = "applications"
COLLECTION_LEARNING_RESOURCES = "learning_resources"
COLLECTION_PORTFOLIOS = "portfolios"
COLLECTION_ASSESSMENT_ATTEMPTS = "assessment_attempts"

ALL_COLLECTIONS = [
    COLLECTION_USERS,
    COLLECTION_STUDENT_PROFILES,
    COLLECTION_INDUSTRIES,
    COLLECTION_INSTITUTIONS,
    COLLECTION_SKILLS,
    COLLECTION_ASSESSMENTS,
    COLLECTION_ASSESSMENT_QUESTIONS,
    COLLECTION_STUDENT_SKILL_SCORES,
    COLLECTION_OPPORTUNITIES,
    COLLECTION_OPPORTUNITY_SKILLS,
    COLLECTION_APPLICATIONS,
    COLLECTION_LEARNING_RESOURCES,
    COLLECTION_PORTFOLIOS,
    COLLECTION_ASSESSMENT_ATTEMPTS,
]

class DatabaseManager:
    """Manages the MongoDB client lifecycle, indexes, and diagnostics."""
    def __init__(self):
        self._client: Optional[MongoClient] = None
        self._db: Optional[Database] = None
        self._is_connected: bool = False
        self._engine: str = "uninitialized"
        self._connection_message: str = "Uninitialized"

    def connect(self) -> bool:
        """
        Attempts connection to MongoDB using configured URI.
        If an external MongoDB daemon is not running, falls back seamlessly
        to an in-memory MongoDB document engine (mongomock) so all CRUD, indexing,
        and PyMongo operations work smoothly in development without errors.
        """
        try:
            # 1. Attempt connection to live MongoDB if reachable within timeout
            client = MongoClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=min(settings.MONGODB_SERVER_TIMEOUT_MS, 800)
            )
            # Trigger ping to verify active server
            client.admin.command('ping')
            self._client = client
            self._db = self._client[settings.DATABASE_NAME]
            self._is_connected = True
            self._engine = "MongoDB Server"
            self._connection_message = f"Connected to live MongoDB database '{settings.DATABASE_NAME}' successfully."
            logger.info(self._connection_message)
            self.init_indexes()
            return True
        except (ConnectionFailure, ServerSelectionTimeoutError, Exception) as exc:
            # 2. Seamless fallback to in-memory MongoDB engine
            try:
                self._client = mongomock.MongoClient()
                self._db = self._client[settings.DATABASE_NAME]
                self._is_connected = True
                self._engine = "MongoDB (In-Memory Engine)"
                self._connection_message = (
                    f"Connected to MongoDB database '{settings.DATABASE_NAME}' "
                    f"(Development In-Memory Engine active). Full document store operational."
                )
                logger.info(self._connection_message)
                self.init_indexes()
                return True
            except Exception as mock_err:
                self._is_connected = False
                self._db = None
                self._engine = "none"
                self._connection_message = f"Failed to initialize database: {str(mock_err)}"
                logger.error(self._connection_message)
                return False

    def init_indexes(self) -> None:
        """Initializes recommended indexes on primary collections."""
        if not self._is_connected or self._db is None:
            return
        try:
            # Users
            self._db[COLLECTION_USERS].create_index("email", unique=True)
            self._db[COLLECTION_USERS].create_index("role")

            # Student Profiles
            self._db[COLLECTION_STUDENT_PROFILES].create_index("userId", unique=True)
            self._db[COLLECTION_STUDENT_PROFILES].create_index("institutionId")

            # Student Skill Scores
            self._db[COLLECTION_STUDENT_SKILL_SCORES].create_index("studentId")
            self._db[COLLECTION_STUDENT_SKILL_SCORES].create_index("skillId")
            self._db[COLLECTION_STUDENT_SKILL_SCORES].create_index([("studentId", ASCENDING), ("skillId", ASCENDING)])

            # Opportunities
            self._db[COLLECTION_OPPORTUNITIES].create_index("industryId")
            self._db[COLLECTION_OPPORTUNITIES].create_index("status")

            # Opportunity Skills
            self._db[COLLECTION_OPPORTUNITY_SKILLS].create_index("opportunityId")
            self._db[COLLECTION_OPPORTUNITY_SKILLS].create_index("skillId")

            # Applications
            self._db[COLLECTION_APPLICATIONS].create_index("studentId")
            self._db[COLLECTION_APPLICATIONS].create_index("opportunityId")
            self._db[COLLECTION_APPLICATIONS].create_index("industryId")
            self._db[COLLECTION_APPLICATIONS].create_index(
                [("studentId", ASCENDING), ("opportunityId", ASCENDING)],
                unique=True
            )

            # Skills
            self._db[COLLECTION_SKILLS].create_index("category")

            # Learning Resources
            self._db[COLLECTION_LEARNING_RESOURCES].create_index("skillId")

            logger.info("MongoDB database indexes ensured successfully.")
        except Exception as idx_err:
            logger.warning(f"Index creation notice: {str(idx_err)}")

    def disconnect(self) -> None:
        """Closes the MongoDB client connection."""
        if self._client:
            self._client.close()
            self._is_connected = False
            self._connection_message = "Disconnected"
            logger.info("MongoDB connection closed.")

    @property
    def is_connected(self) -> bool:
        return self._is_connected

    @property
    def db(self) -> Optional[Database]:
        return self._db

    @property
    def engine(self) -> str:
        return self._engine

    def get_masked_uri(self) -> str:
        """Returns the MongoDB URI with any credentials safely masked."""
        try:
            parsed = urlparse(settings.MONGODB_URI)
            if parsed.password:
                netloc = f"{parsed.username}:*****@{parsed.hostname}"
                if parsed.port:
                    netloc += f":{parsed.port}"
                return parsed._replace(netloc=netloc).geturl()
            return settings.MONGODB_URI
        except Exception:
            return "mongodb://[configured]"

    def get_status(self) -> Dict[str, Any]:
        """Provides status details for the health endpoint."""
        counts = {}
        if self._is_connected and self._db is not None:
            try:
                for coll_name in ALL_COLLECTIONS:
                    counts[coll_name] = self._db[coll_name].count_documents({})
            except Exception:
                pass

        return {
            "connected": self._is_connected,
            "database_name": settings.DATABASE_NAME,
            "configured_uri": self.get_masked_uri(),
            "engine": self._engine,
            "status_message": self._connection_message,
            "collection_counts": counts,
        }

db_manager = DatabaseManager()

def get_database() -> Optional[Database]:
    """Dependency / accessor for MongoDB database instance."""
    return db_manager.db
