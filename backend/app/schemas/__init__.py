"""
SkillSetu Schemas Module
"""
from backend.app.schemas.common import (
    UserRole,
    SkillCategory,
    AssessmentDifficulty,
    QuestionDifficulty,
    SkillScoreSource,
    OpportunityType,
    WorkMode,
    OpportunityStatus,
    ApplicationStatus,
)
from backend.app.schemas.entities import (
    User, UserBase,
    Institution, InstitutionBase,
    Industry, IndustryBase,
    Skill, SkillBase,
    StudentProfile, StudentProfileBase, StudentSkillItem,
    StudentSkillScore, StudentSkillScoreBase,
    Assessment, AssessmentBase,
    AssessmentQuestion, AssessmentQuestionBase,
    Opportunity, OpportunityBase,
    OpportunitySkill, OpportunitySkillBase,
    Application, ApplicationBase,
    LearningResource, LearningResourceBase,
    Portfolio, PortfolioBase,
)

__all__ = [
    "UserRole",
    "SkillCategory",
    "AssessmentDifficulty",
    "QuestionDifficulty",
    "SkillScoreSource",
    "OpportunityType",
    "WorkMode",
    "OpportunityStatus",
    "ApplicationStatus",
    "User", "UserBase",
    "Institution", "InstitutionBase",
    "Industry", "IndustryBase",
    "Skill", "SkillBase",
    "StudentProfile", "StudentProfileBase", "StudentSkillItem",
    "StudentSkillScore", "StudentSkillScoreBase",
    "Assessment", "AssessmentBase",
    "AssessmentQuestion", "AssessmentQuestionBase",
    "Opportunity", "OpportunityBase",
    "OpportunitySkill", "OpportunitySkillBase",
    "Application", "ApplicationBase",
    "LearningResource", "LearningResourceBase",
    "Portfolio", "PortfolioBase",
]
