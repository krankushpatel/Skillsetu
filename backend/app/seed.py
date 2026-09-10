"""
SkillSetu - Database Seeding CLI Script
Step 2: Database Models & Seed Data

Run with: python3 -m backend.app.seed [--force]
"""
import sys
import logging
from backend.app.core.database import db_manager
from backend.app.services.seed_data import seed_database

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("skillsetu.seed.cli")

def main():
    force = "--force" in sys.argv or "-f" in sys.argv
    logger.info(f"Connecting to database to execute seed (force={force})...")
    connected = db_manager.connect()
    if not connected or db_manager.db is None:
        logger.error("Could not establish connection to database.")
        sys.exit(1)

    try:
        result = seed_database(db_manager.db, force=force)
        logger.info(f"Seed Result: {result['action']} - {result['message']}")
        for coll, count in result["counts"].items():
            logger.info(f"  • {coll}: {count} records")
    finally:
        db_manager.disconnect()

if __name__ == "__main__":
    main()
