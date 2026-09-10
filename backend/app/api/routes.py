"""
SkillSetu Central API Router
Step 1: Project Foundation

Mounts all sub-routers (health, and future module routers in Steps 2+).
"""
from fastapi import APIRouter
from backend.app.api.v1.health import router as health_router
from backend.app.api.v1.matching import router as matching_router
from backend.app.api.v1.data import router as data_router
from backend.app.api.v1.students import router as student_router
from backend.app.api.v1.assessments import router as assessment_router
from backend.app.api.v1.industry import router as industry_router
from backend.app.api.v1.applications import router as applications_router
from backend.app.api.v1.institution import router as institution_router

api_router = APIRouter()

# Health router mapped under /health and /v1/health
api_router.include_router(health_router, prefix="", tags=["Health"])
api_router.include_router(health_router, prefix="/v1", tags=["Health-v1"])

# Step 8 Application System mapped under / and /v1
api_router.include_router(applications_router, prefix="", tags=["Applications"])
api_router.include_router(applications_router, prefix="/v1", tags=["Applications-v1"])

# Step 9 Institution & Academia Intelligence mapped under / and /v1
api_router.include_router(institution_router, prefix="", tags=["Institution"])
api_router.include_router(institution_router, prefix="/v1", tags=["Institution-v1"])

# Step 5 Skill Matching Engine mapped under / and /v1 (mounted before data_router for route precedence)
api_router.include_router(matching_router, prefix="", tags=["Matching"])
api_router.include_router(matching_router, prefix="/v1", tags=["Matching-v1"])

# Step 2 Data access & inspection routers mapped under / and /v1
api_router.include_router(data_router, prefix="", tags=["Data-Inspection"])
api_router.include_router(data_router, prefix="/v1", tags=["Data-Inspection-v1"])

# Step 3 Student module router mapped under /students and /v1/students
api_router.include_router(student_router, prefix="/students", tags=["Students"])
api_router.include_router(student_router, prefix="/v1/students", tags=["Students-v1"])

# Step 4 Standardized Assessment Engine mapped under /assessments and /v1/assessments
api_router.include_router(assessment_router, prefix="/assessments", tags=["Assessments"])
api_router.include_router(assessment_router, prefix="/v1/assessments", tags=["Assessments-v1"])

# Step 7 Industry Module mapped under / and /v1
api_router.include_router(industry_router, prefix="", tags=["Industry"])
api_router.include_router(industry_router, prefix="/v1", tags=["Industry-v1"])

# Future routers for subsequent steps:
# api_router.include_router(institution_router, prefix="/v1/institution", tags=["Institution"])
# api_router.include_router(matching_router, prefix="/v1/matching", tags=["Matching Engine"])
