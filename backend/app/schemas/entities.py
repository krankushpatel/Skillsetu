"""
SkillSetu - Pydantic Schemas & Data Models
Step 2: Database Models & Validation
"""
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, EmailStr
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

# -------------------------------------------------------------
# 1. USER
# -------------------------------------------------------------
class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    role: UserRole
    avatar: Optional[str] = None
    institutionId: Optional[str] = None
    industryId: Optional[str] = None

class User(UserBase):
    id: str = Field(..., alias="_id")
    createdAt: str
    updatedAt: str

    class Config:
        populate_by_name = True

# -------------------------------------------------------------
# 2. INSTITUTION
# -------------------------------------------------------------
class InstitutionBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    type: str
    location: str
    departments: List[str] = []

class Institution(InstitutionBase):
    id: str = Field(..., alias="_id")
    createdAt: str
    updatedAt: str

    class Config:
        populate_by_name = True

# -------------------------------------------------------------
# 3. INDUSTRY
# -------------------------------------------------------------
class IndustryBase(BaseModel):
    userId: str
    organizationName: str = Field(..., min_length=2, max_length=200)
    industryType: str
    description: str
    location: str
    website: Optional[str] = None

class Industry(IndustryBase):
    id: str = Field(..., alias="_id")
    createdAt: str
    updatedAt: str

    class Config:
        populate_by_name = True

# -------------------------------------------------------------
# 4. SKILL TAXONOMY
# -------------------------------------------------------------
class SkillBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    category: SkillCategory
    description: str
    industryDemandScore: int = Field(default=50, ge=0, le=100)

class Skill(SkillBase):
    id: str = Field(..., alias="_id")
    createdAt: str

    class Config:
        populate_by_name = True

# -------------------------------------------------------------
# 5. STUDENT PROFILE & SKILLS
# -------------------------------------------------------------
class StudentSkillItem(BaseModel):
    skillId: str
    proficiency: int = Field(..., ge=0, le=100, description="Assessed Skill Score: 0-100")
    assessed: bool = False
    lastAssessed: Optional[str] = None

class StudentProfileBase(BaseModel):
    userId: str
    institutionId: str
    department: str
    course: str
    batch: str
    cgpa: float = Field(..., ge=0.0, le=10.0)
    bio: str
    skills: List[StudentSkillItem] = []
    certifications: List[str] = []
    projects: List[Dict[str, Any]] = []
    internships: List[Dict[str, Any]] = []
    achievements: List[str] = []

class StudentProfile(StudentProfileBase):
    id: str = Field(..., alias="_id")
    createdAt: str
    updatedAt: str

    class Config:
        populate_by_name = True

# -------------------------------------------------------------
# 6. STUDENT SKILL SCORE (Normalized Assessment Record)
# -------------------------------------------------------------
class StudentSkillScoreBase(BaseModel):
    studentId: str
    skillId: str
    proficiency: int = Field(..., ge=0, le=100, description="Assessed Skill Score: 0-100")
    assessed: bool = True
    assessmentId: Optional[str] = None
    lastAssessed: str
    source: SkillScoreSource = SkillScoreSource.ASSESSMENT

class StudentSkillScore(StudentSkillScoreBase):
    id: str = Field(..., alias="_id")

    class Config:
        populate_by_name = True

# -------------------------------------------------------------
# 7. ASSESSMENT & QUESTIONS
# -------------------------------------------------------------
class AssessmentBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str
    targetSkillIds: List[str]
    durationMinutes: int = Field(default=30, ge=5, le=180)
    totalQuestions: int = Field(default=25, ge=1, le=100)
    difficulty: AssessmentDifficulty = AssessmentDifficulty.INTERMEDIATE
    active: bool = True

class Assessment(AssessmentBase):
    id: str = Field(..., alias="_id")
    createdAt: str

    class Config:
        populate_by_name = True

class AssessmentQuestionBase(BaseModel):
    assessmentId: str
    question: str
    options: List[str] = Field(..., min_length=2, max_length=5)
    correctAnswer: str
    difficulty: QuestionDifficulty = QuestionDifficulty.MEDIUM
    skillId: str
    skillWeight: int = Field(default=2, ge=1, le=3)
    explanation: Optional[str] = None

class AssessmentQuestion(AssessmentQuestionBase):
    id: str = Field(..., alias="_id")

    class Config:
        populate_by_name = True

# -------------------------------------------------------------
# 8. OPPORTUNITY & OPPORTUNITY SKILLS
# -------------------------------------------------------------
class OpportunityBase(BaseModel):
    industryId: str
    title: str = Field(..., min_length=3, max_length=200)
    description: str
    type: OpportunityType
    location: str
    workMode: WorkMode
    stipend: str
    duration: str
    status: OpportunityStatus = OpportunityStatus.OPEN

class Opportunity(OpportunityBase):
    id: str = Field(..., alias="_id")
    createdAt: str
    updatedAt: str

    class Config:
        populate_by_name = True

class OpportunitySkillBase(BaseModel):
    opportunityId: str
    skillId: str
    minProficiency: int = Field(..., ge=0, le=100)
    weight: int = Field(default=2, ge=1, le=3, description="1=Low, 2=Medium, 3=High")
    mandatory: bool = True

class OpportunitySkill(OpportunitySkillBase):
    id: str = Field(..., alias="_id")

    class Config:
        populate_by_name = True

# -------------------------------------------------------------
# 9. APPLICATION
# -------------------------------------------------------------
class ApplicationBase(BaseModel):
    opportunityId: str
    studentId: str
    industryId: Optional[str] = None
    status: ApplicationStatus = ApplicationStatus.APPLIED
    matchScore: Optional[float] = None
    matchScoreSnapshot: Optional[float] = None
    eligibilitySnapshot: Optional[str] = None
    coverNote: Optional[str] = None
    statusHistory: Optional[List[Dict[str, Any]]] = None

class Application(ApplicationBase):
    id: str = Field(..., alias="_id")
    appliedAt: str
    updatedAt: str

    class Config:
        populate_by_name = True

# -------------------------------------------------------------
# 10. LEARNING RESOURCE
# -------------------------------------------------------------
class LearningResourceBase(BaseModel):
    skillId: str
    title: str
    provider: str
    description: str
    duration: str
    difficulty: AssessmentDifficulty
    url: Optional[str] = None
    potentialSkillGain: int = Field(default=15, ge=1, le=50)

class LearningResource(LearningResourceBase):
    id: str = Field(..., alias="_id")

    class Config:
        populate_by_name = True

# -------------------------------------------------------------
# 11. PORTFOLIO
# -------------------------------------------------------------
class PortfolioBase(BaseModel):
    studentId: str
    projects: List[Dict[str, Any]] = []
    certifications: List[Dict[str, Any]] = []
    achievements: List[str] = []
    internships: List[Dict[str, Any]] = []

class Portfolio(PortfolioBase):
    id: str = Field(..., alias="_id")
    createdAt: str
    updatedAt: str

    class Config:
        populate_by_name = True
