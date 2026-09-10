"""
SkillSetu - Data Inspection API Endpoints
Step 2: Database Models & Seed Data Access Layer

Provides clean, read-only data access endpoints to inspect and verify the
MongoDB data foundation without complex filtering, CRUD, or matching algorithms.
"""
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, status
from backend.app.core.database import (
    db_manager,
    COLLECTION_SKILLS,
    COLLECTION_STUDENT_PROFILES,
    COLLECTION_USERS,
    COLLECTION_INDUSTRIES,
    COLLECTION_INSTITUTIONS,
    COLLECTION_OPPORTUNITIES,
    COLLECTION_OPPORTUNITY_SKILLS,
    COLLECTION_LEARNING_RESOURCES,
    COLLECTION_ASSESSMENTS,
    COLLECTION_ASSESSMENT_QUESTIONS,
    COLLECTION_APPLICATIONS,
    COLLECTION_STUDENT_SKILL_SCORES,
    ALL_COLLECTIONS,
)
from backend.app.services.seed_data import seed_database

router = APIRouter()

def _check_db():
    if not db_manager.is_connected or db_manager.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service currently unavailable."
        )
    return db_manager.db

@router.get("/skills", summary="List standardized skill taxonomy")
def list_skills() -> Dict[str, Any]:
    """Returns the central standardized skill taxonomy (10 skills)."""
    db = _check_db()
    skills = list(db[COLLECTION_SKILLS].find({}, {"_id": 1, "name": 1, "category": 1, "description": 1, "industryDemandScore": 1, "createdAt": 1}))
    return {
        "count": len(skills),
        "data": skills
    }

@router.get("/students", summary="List student profiles")
def list_students() -> Dict[str, Any]:
    """
    Returns student profiles with user identity details and assessed skill scores.
    Adheres strictly to 'Assessed Skill Score' terminology (never 'Verified').
    """
    db = _check_db()
    profiles = list(db[COLLECTION_STUDENT_PROFILES].find({}))
    users = {u["_id"]: u for u in db[COLLECTION_USERS].find({"role": "STUDENT"})}
    
    enriched_students = []
    for profile in profiles:
        user_info = users.get(profile.get("userId"), {})
        enriched_students.append({
            "id": profile["_id"],
            "userId": profile.get("userId"),
            "name": user_info.get("name", "Unknown Student"),
            "email": user_info.get("email"),
            "avatar": user_info.get("avatar"),
            "institutionId": profile.get("institutionId"),
            "department": profile.get("department"),
            "course": profile.get("course"),
            "batch": profile.get("batch"),
            "cgpa": profile.get("cgpa"),
            "bio": profile.get("bio"),
            "assessedSkills": profile.get("skills", []),
            "certifications": profile.get("certifications", []),
            "projects": profile.get("projects", []),
            "internships": profile.get("internships", []),
            "achievements": profile.get("achievements", [])
        })

    return {
        "count": len(enriched_students),
        "data": enriched_students
    }

@router.get("/industries", summary="List industry partner organizations")
def list_industries() -> Dict[str, Any]:
    """Returns fictional demo industry organizations."""
    db = _check_db()
    industries = list(db[COLLECTION_INDUSTRIES].find({}))
    return {
        "count": len(industries),
        "data": industries
    }

@router.get("/institutions", summary="List academic institutions")
def list_institutions() -> Dict[str, Any]:
    """Returns academic institutions (featuring AIIA)."""
    db = _check_db()
    institutions = list(db[COLLECTION_INSTITUTIONS].find({}))
    return {
        "count": len(institutions),
        "data": institutions
    }

@router.get("/opportunities", summary="List internship and project opportunities")
def list_opportunities() -> Dict[str, Any]:
    """Returns opportunities with required skills and importance weights."""
    db = _check_db()
    opportunities = list(db[COLLECTION_OPPORTUNITIES].find({}))
    industries = {ind["_id"]: ind for ind in db[COLLECTION_INDUSTRIES].find({})}
    all_opp_skills = list(db[COLLECTION_OPPORTUNITY_SKILLS].find({}))
    skills_map = {s["_id"]: s for s in db[COLLECTION_SKILLS].find({})}

    enriched_opportunities = []
    for opp in opportunities:
        ind = industries.get(opp.get("industryId"), {})
        req_skills = [
            {
                "skillId": os["skillId"],
                "skillName": skills_map.get(os["skillId"], {}).get("name", os["skillId"]),
                "minProficiency": os["minProficiency"],
                "weight": os["weight"],
                "mandatory": os["mandatory"]
            }
            for os in all_opp_skills if os.get("opportunityId") == opp["_id"]
        ]

        enriched_opportunities.append({
            "id": opp["_id"],
            "title": opp.get("title"),
            "industryId": opp.get("industryId"),
            "organizationName": ind.get("organizationName", "Industry Partner"),
            "description": opp.get("description"),
            "type": opp.get("type"),
            "location": opp.get("location"),
            "workMode": opp.get("workMode"),
            "stipend": opp.get("stipend"),
            "duration": opp.get("duration"),
            "status": opp.get("status"),
            "requiredSkills": req_skills,
            "createdAt": opp.get("createdAt")
        })

    return {
        "count": len(enriched_opportunities),
        "data": enriched_opportunities
    }

@router.get("/opportunities/{opportunity_id}", summary="Get opportunity details by ID")
def get_opportunity_by_id(opportunity_id: str) -> Dict[str, Any]:
    """Returns single opportunity with required skills, weights, and partner profile."""
    db = _check_db()
    opp = db[COLLECTION_OPPORTUNITIES].find_one({"_id": opportunity_id})
    if not opp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Opportunity '{opportunity_id}' not found."
        )
    ind = db[COLLECTION_INDUSTRIES].find_one({"_id": opp.get("industryId")}) or {}
    all_opp_skills = list(db[COLLECTION_OPPORTUNITY_SKILLS].find({"opportunityId": opportunity_id}))
    skills_map = {s["_id"]: s for s in db[COLLECTION_SKILLS].find({})}

    req_skills = [
        {
            "skillId": os["skillId"],
            "skillName": skills_map.get(os["skillId"], {}).get("name", os["skillId"]),
            "category": skills_map.get(os["skillId"], {}).get("category", "TECHNICAL"),
            "minProficiency": os["minProficiency"],
            "weight": os["weight"],
            "mandatory": os["mandatory"]
        }
        for os in all_opp_skills
    ]

    return {
        "status": "success",
        "data": {
            "id": opp["_id"],
            "title": opp.get("title"),
            "industryId": opp.get("industryId"),
            "organizationName": ind.get("organizationName", "Industry Partner"),
            "industryType": ind.get("industryType", ""),
            "organizationDescription": ind.get("description", ""),
            "organizationLocation": ind.get("location", ""),
            "organizationWebsite": ind.get("website", ""),
            "description": opp.get("description"),
            "type": opp.get("type"),
            "location": opp.get("location"),
            "workMode": opp.get("workMode"),
            "stipend": opp.get("stipend"),
            "duration": opp.get("duration"),
            "status": opp.get("status"),
            "requiredSkills": req_skills,
            "createdAt": opp.get("createdAt")
        }
    }

@router.get("/learning-resources", summary="List learning resources")
def list_learning_resources() -> Dict[str, Any]:
    """Returns curated learning resources mapped to skills."""
    db = _check_db()
    resources = list(db[COLLECTION_LEARNING_RESOURCES].find({}))
    skills_map = {s["_id"]: s for s in db[COLLECTION_SKILLS].find({})}

    enriched = []
    for res in resources:
        enriched.append({
            **res,
            "skillName": skills_map.get(res.get("skillId"), {}).get("name", res.get("skillId"))
        })

    return {
        "count": len(enriched),
        "data": enriched
    }

@router.get("/seed/status", summary="Seed database status & record counts")
def get_seed_status() -> Dict[str, Any]:
    """Provides collection-by-collection counts to verify the database foundation."""
    db = _check_db()
    counts = {}
    for coll in ALL_COLLECTIONS:
        counts[coll] = db[coll].count_documents({})

    return {
        "status": "ready",
        "database": db_manager.get_status(),
        "collection_counts": counts,
        "is_seeded": counts.get(COLLECTION_USERS, 0) > 0
    }

@router.post("/seed/reset", summary="Reset and re-seed demo data (Development Only)")
def reset_seed() -> Dict[str, Any]:
    """Explicit development-only endpoint to re-seed demo data deterministically."""
    db = _check_db()
    res = seed_database(db, force=True)
    return {
        "status": "success",
        "result": res
    }
