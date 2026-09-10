"""
SkillSetu - Common Enums & Data Types
Step 2: Database Models & Foundations
"""
from enum import Enum

class UserRole(str, Enum):
    STUDENT = "STUDENT"
    INDUSTRY = "INDUSTRY"
    INSTITUTION = "INSTITUTION"

class SkillCategory(str, Enum):
    TECHNICAL = "TECHNICAL"
    DOMAIN = "DOMAIN"
    ANALYTICAL = "ANALYTICAL"
    SOFT_SKILL = "SOFT_SKILL"

class AssessmentDifficulty(str, Enum):
    FOUNDATIONAL = "FOUNDATIONAL"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"

class QuestionDifficulty(str, Enum):
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"

class SkillScoreSource(str, Enum):
    ASSESSMENT = "ASSESSMENT"
    PROFILE = "PROFILE"
    FUTURE_VERIFICATION = "FUTURE_VERIFICATION"

class OpportunityType(str, Enum):
    INTERNSHIP = "INTERNSHIP"
    PROJECT = "PROJECT"
    FULL_TIME = "FULL_TIME"

class WorkMode(str, Enum):
    REMOTE = "REMOTE"
    HYBRID = "HYBRID"
    ON_SITE = "ON_SITE"

class OpportunityStatus(str, Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"
    ARCHIVED = "ARCHIVED"

class ApplicationStatus(str, Enum):
    APPLIED = "APPLIED"
    UNDER_REVIEW = "UNDER_REVIEW"
    SHORTLISTED = "SHORTLISTED"
    SELECTED = "SELECTED"
    REJECTED = "REJECTED"
    WITHDRAWN = "WITHDRAWN"
