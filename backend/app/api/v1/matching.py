"""
SkillSetu - Skill Matching API Endpoints
Problem Statement ID: 26044 | Ministry of Ayush - AIIA
Step 5: Skill Matching Engine

Provides endpoints for:
- Detailed explainable opportunity match: GET /opportunities/{opportunity_id}/match/{student_id}
- Batch opportunity match evaluation: GET /opportunities/match/{student_id}
- Student opportunity matches: GET /students/{student_id}/opportunity-matches
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, status
from backend.app.core.database import (
    db_manager,
    COLLECTION_SKILLS,
    COLLECTION_STUDENT_PROFILES,
    COLLECTION_USERS,
    COLLECTION_INDUSTRIES,
    COLLECTION_OPPORTUNITIES,
    COLLECTION_OPPORTUNITY_SKILLS,
    COLLECTION_STUDENT_SKILL_SCORES,
    COLLECTION_LEARNING_RESOURCES
)
from backend.app.services.matching import matching_engine

router = APIRouter()

# --------------------------------------------------------------------------
# Step 6 Schemas: What-If Skill Improvement Simulation
# --------------------------------------------------------------------------
class SkillSimulationInput(BaseModel):
    skillId: str = Field(..., description="Standardized ID of the required skill (e.g. sk_sql)")
    proficiency: float = Field(..., ge=0.0, le=100.0, description="Hypothetical proficiency between 0 and 100")

class WhatIfRequest(BaseModel):
    skill_updates: Optional[List[SkillSimulationInput]] = Field(default=None, description="Array of simulated skill targets")
    skillUpdates: Optional[List[SkillSimulationInput]] = Field(default=None, description="CamelCase alias for skill_updates")

    def get_updates(self) -> List[SkillSimulationInput]:
        return self.skill_updates or self.skillUpdates or []

def _check_db():
    if not db_manager.is_connected or db_manager.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service currently unavailable."
        )
    return db_manager.db

def _find_student(db, student_id: str) -> Dict[str, Any]:
    """Finds student profile by either profile '_id' or 'userId'."""
    profile = db[COLLECTION_STUDENT_PROFILES].find_one({"_id": student_id})
    if not profile:
        profile = db[COLLECTION_STUDENT_PROFILES].find_one({"userId": student_id})
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student profile '{student_id}' not found."
        )
    return profile

def _get_student_name(db, user_id: Optional[str]) -> str:
    if not user_id:
        return "Student Candidate"
    user = db[COLLECTION_USERS].find_one({"_id": user_id}) or {}
    return user.get("name", "Student Candidate")

def _get_student_assessed_skills(db, profile_id: str, profile_skills: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    """
    Fetches the candidate's latest assessed skill scores.
    Prioritizes authoritative student_skill_scores collection.
    Falls back to embedded profile skills if assessed.
    """
    assessed_map: Dict[str, Dict[str, Any]] = {}

    # 1. Authoritative normalized scores
    db_scores = list(db[COLLECTION_STUDENT_SKILL_SCORES].find({"studentId": profile_id}))
    for s in db_scores:
        if s.get("assessed", True) and s.get("proficiency") is not None:
            assessed_map[s["skillId"]] = s

    # 2. Embedded skills in profile (only if not already recorded)
    for s in profile_skills:
        s_id = s.get("skillId")
        if s_id and s_id not in assessed_map:
            if s.get("assessed", True) and s.get("proficiency") is not None:
                assessed_map[s_id] = s

    return assessed_map


@router.get(
    "/opportunities/match/{student_id}",
    summary="Batch evaluate candidate match scores across all open opportunities"
)
def get_all_opportunity_matches(student_id: str) -> Dict[str, Any]:
    """
    Evaluates candidate's Assessed Skill Scores against all active opportunities.
    Returns ranked match summaries for opportunity discovery and student dashboard.
    """
    db = _check_db()
    student_profile = _find_student(db, student_id)
    student_name = _get_student_name(db, student_profile.get("userId"))
    assessed_skills_map = _get_student_assessed_skills(
        db, student_profile["_id"], student_profile.get("skills", [])
    )

    # Fetch opportunities & taxonomy
    opportunities = list(db[COLLECTION_OPPORTUNITIES].find({}))
    industries = {ind["_id"]: ind for ind in db[COLLECTION_INDUSTRIES].find({})}
    all_opp_skills = list(db[COLLECTION_OPPORTUNITY_SKILLS].find({}))
    skills_map = {s["_id"]: s for s in db[COLLECTION_SKILLS].find({})}

    matches = []
    for opp in opportunities:
        opp_id = opp["_id"]
        ind = industries.get(opp.get("industryId"), {})
        org_name = ind.get("organizationName", "Industry Partner")

        # Opportunity required skills
        req_skills = [
            {
                "skillId": os["skillId"],
                "skillName": skills_map.get(os["skillId"], {}).get("name", os["skillId"]),
                "category": skills_map.get(os["skillId"], {}).get("category", "TECHNICAL"),
                "minProficiency": os.get("minProficiency", 0),
                "weight": os.get("weight", 1),
                "mandatory": os.get("mandatory", True)
            }
            for os in all_opp_skills if os.get("opportunityId") == opp_id
        ]

        match_result = matching_engine.calculate_match(
            opportunity_id=opp_id,
            student_id=student_profile["_id"],
            required_skills=req_skills,
            assessed_skills_map=assessed_skills_map,
            opportunity_title=opp.get("title", ""),
            organization_name=org_name,
            student_name=student_name
        )

        matches.append({
            "opportunityId": opp_id,
            "title": opp.get("title"),
            "industryId": opp.get("industryId"),
            "organizationName": org_name,
            "type": opp.get("type"),
            "location": opp.get("location"),
            "workMode": opp.get("workMode"),
            "stipend": opp.get("stipend"),
            "duration": opp.get("duration"),
            "status": opp.get("status"),
            "matchScore": match_result["matchScore"],
            "rawMatchScore": match_result["rawMatchScore"],
            "eligibility": match_result["eligibility"],
            "eligibilityLabel": match_result["eligibilityLabel"],
            "summary": match_result["summary"],
            "explanation": match_result["explanation"],
            "skills": match_result["skills"],
            "whyNot100": match_result["whyNot100"]
        })

    # Sort descending by match score
    matches.sort(key=lambda m: m["matchScore"], reverse=True)

    return {
        "status": "success",
        "studentId": student_profile["_id"],
        "studentName": student_name,
        "count": len(matches),
        "data": matches
    }


@router.get(
    "/opportunities/{opportunity_id}/match/{student_id}",
    summary="Get complete explainable match diagnostics for a specific opportunity"
)
def get_opportunity_match_for_student(opportunity_id: str, student_id: str) -> Dict[str, Any]:
    """
    Evaluates candidate's latest Assessed Skill Scores against a specific opportunity's
    required skills, importance weights, and mandatory flags.
    Returns:
    - Overall Match Score (0 - 100)
    - Eligibility determination (ELIGIBLE vs. CONDITIONAL)
    - Skill-by-skill breakdown (contributions, ratios, gaps, surpluses)
    - Deterministic explanation narrative and 'Why isn't my match 100%?' diagnostics
    """
    db = _check_db()
    student_profile = _find_student(db, student_id)
    student_name = _get_student_name(db, student_profile.get("userId"))

    # Fetch opportunity
    opp = db[COLLECTION_OPPORTUNITIES].find_one({"_id": opportunity_id})
    if not opp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Opportunity '{opportunity_id}' not found."
        )

    # Industry details
    ind = db[COLLECTION_INDUSTRIES].find_one({"_id": opp.get("industryId")}) or {}
    org_name = ind.get("organizationName", "Industry Partner")

    # Opportunity requirements
    opp_skills = list(db[COLLECTION_OPPORTUNITY_SKILLS].find({"opportunityId": opportunity_id}))
    skills_map = {s["_id"]: s for s in db[COLLECTION_SKILLS].find({})}

    enriched_reqs = [
        {
            "skillId": os["skillId"],
            "skillName": skills_map.get(os["skillId"], {}).get("name", os["skillId"]),
            "category": skills_map.get(os["skillId"], {}).get("category", "TECHNICAL"),
            "minProficiency": os.get("minProficiency", 0),
            "weight": os.get("weight", 1),
            "mandatory": os.get("mandatory", True)
        }
        for os in opp_skills
    ]

    # Student assessed skills
    assessed_skills_map = _get_student_assessed_skills(
        db, student_profile["_id"], student_profile.get("skills", [])
    )

    # Run deterministic calculation
    result = matching_engine.calculate_match(
        opportunity_id=opportunity_id,
        student_id=student_profile["_id"],
        required_skills=enriched_reqs,
        assessed_skills_map=assessed_skills_map,
        opportunity_title=opp.get("title", ""),
        organization_name=org_name,
        student_name=student_name
    )

    return {
        "status": "success",
        "data": result
    }


@router.get(
    "/students/{student_id}/opportunity-matches",
    summary="Alias: List all opportunity matches for a student"
)
def get_student_opportunity_matches_alias(student_id: str) -> Dict[str, Any]:
    """Convenience alias for /opportunities/match/{student_id}."""
    return get_all_opportunity_matches(student_id)


# ==========================================================================
# STEP 6: WHAT-IF SKILL IMPROVEMENT SIMULATION
# ==========================================================================
@router.post(
    "/opportunities/{opportunity_id}/what-if/{student_id}",
    summary="Step 6: Run in-memory deterministic What-If skill improvement simulation"
)
def simulate_opportunity_what_if(
    opportunity_id: str,
    student_id: str,
    request: WhatIfRequest
) -> Dict[str, Any]:
    """
    Evaluates hypothetical skill score targets against the opportunity's required skills.
    Adheres strictly to the following guarantees:
    - 100% deterministic, reuses Step 5 SkillMatchingEngine authoritative algorithm.
    - Read-only simulation: NEVER mutates MongoDB or persistent student skill scores.
    - Validates student exists, opportunity exists, and skill is required by opportunity.
    - Returns current match score, projected match score, delta improvement, before/after breakdown,
      and eligibility transitions.
    """
    db = _check_db()

    # 1. Validate student exists
    student_profile = _find_student(db, student_id)
    student_name = _get_student_name(db, student_profile.get("userId"))

    # 2. Validate opportunity exists
    opp = db[COLLECTION_OPPORTUNITIES].find_one({"_id": opportunity_id})
    if not opp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Opportunity '{opportunity_id}' not found."
        )

    ind = db[COLLECTION_INDUSTRIES].find_one({"_id": opp.get("industryId")}) or {}
    org_name = ind.get("organizationName", "Industry Partner")

    # 3. Fetch opportunity requirements
    opp_skills = list(db[COLLECTION_OPPORTUNITY_SKILLS].find({"opportunityId": opportunity_id}))
    skills_map = {s["_id"]: s for s in db[COLLECTION_SKILLS].find({})}
    req_skill_ids = {os["skillId"] for os in opp_skills}

    # 4. Validate skill updates
    updates = request.get_updates()
    normalized_updates = []
    seen_update_skills = set()

    for item in updates:
        s_id = item.skillId

        # Check skill exists in taxonomy
        if s_id not in skills_map:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Skill '{s_id}' does not exist in the skill taxonomy."
            )

        # Check skill belongs to opportunity requirements (Rule 4)
        if s_id not in req_skill_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Skill '{s_id}' is not required by opportunity '{opportunity_id}'."
            )

        # Proficiency is already guaranteed between 0 and 100 by Pydantic validator
        if s_id in seen_update_skills:
            # Safely normalize duplicates: latest update overrides
            normalized_updates = [u for u in normalized_updates if u["skillId"] != s_id]

        seen_update_skills.add(s_id)
        normalized_updates.append({
            "skillId": s_id,
            "proficiency": float(item.proficiency)
        })

    enriched_reqs = [
        {
            "skillId": os["skillId"],
            "skillName": skills_map.get(os["skillId"], {}).get("name", os["skillId"]),
            "category": skills_map.get(os["skillId"], {}).get("category", "TECHNICAL"),
            "minProficiency": os.get("minProficiency", 0),
            "weight": os.get("weight", 1),
            "mandatory": os.get("mandatory", True)
        }
        for os in opp_skills
    ]

    # 5. Get student actual assessed scores (authoritative)
    assessed_skills_map = _get_student_assessed_skills(
        db, student_profile["_id"], student_profile.get("skills", [])
    )

    # 6. Execute in-memory what-if simulation
    sim_result = matching_engine.simulate_what_if(
        opportunity_id=opportunity_id,
        student_id=student_profile["_id"],
        required_skills=enriched_reqs,
        assessed_skills_map=assessed_skills_map,
        skill_updates=normalized_updates,
        opportunity_title=opp.get("title", ""),
        organization_name=org_name,
        student_name=student_name
    )

    return {
        "status": "success",
        "data": sim_result
    }


# ==========================================================================
# STEP 6: LEARNING RESOURCE RECOMMENDATION ENGINE
# ==========================================================================
@router.get(
    "/opportunities/{opportunity_id}/recommendations/{student_id}",
    summary="Step 6: Recommend curated learning resources prioritized by actual skill gaps"
)
def get_opportunity_learning_recommendations(
    opportunity_id: str,
    student_id: str
) -> Dict[str, Any]:
    """
    Ranks curated learning resources from MongoDB based on candidate's actual skill gaps
    for this specific opportunity:
    - Priority 1: Required skill with largest gap
    - Priority 2: Mandatory skill gaps (boosted ranking)
    - Priority 3: Larger weighted skill gaps (weight multiplier)
    - Priority 4: Associated skill relevance
    - Priority 5: Deterministic ordering without duplicates
    """
    db = _check_db()

    # 1. Validate student and opportunity
    student_profile = _find_student(db, student_id)
    student_name = _get_student_name(db, student_profile.get("userId"))

    opp = db[COLLECTION_OPPORTUNITIES].find_one({"_id": opportunity_id})
    if not opp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Opportunity '{opportunity_id}' not found."
        )

    ind = db[COLLECTION_INDUSTRIES].find_one({"_id": opp.get("industryId")}) or {}
    org_name = ind.get("organizationName", "Industry Partner")

    # 2. Get opportunity required skills
    opp_skills = list(db[COLLECTION_OPPORTUNITY_SKILLS].find({"opportunityId": opportunity_id}))
    skills_map = {s["_id"]: s for s in db[COLLECTION_SKILLS].find({})}

    enriched_reqs = [
        {
            "skillId": os["skillId"],
            "skillName": skills_map.get(os["skillId"], {}).get("name", os["skillId"]),
            "category": skills_map.get(os["skillId"], {}).get("category", "TECHNICAL"),
            "minProficiency": os.get("minProficiency", 0),
            "weight": os.get("weight", 1),
            "mandatory": os.get("mandatory", True)
        }
        for os in opp_skills
    ]

    # 3. Get candidate assessed skills & compute current match
    assessed_skills_map = _get_student_assessed_skills(
        db, student_profile["_id"], student_profile.get("skills", [])
    )

    current_match = matching_engine.calculate_match(
        opportunity_id=opportunity_id,
        student_id=student_profile["_id"],
        required_skills=enriched_reqs,
        assessed_skills_map=assessed_skills_map,
        opportunity_title=opp.get("title", ""),
        organization_name=org_name,
        student_name=student_name
    )

    # 4. Fetch curated learning resources from MongoDB
    resources = list(db[COLLECTION_LEARNING_RESOURCES].find({}))

    # 5. Deterministically rank recommendations
    recommendations_result = matching_engine.rank_learning_recommendations(
        match_result=current_match,
        learning_resources=resources,
        skills_taxonomy=skills_map
    )

    return {
        "status": "success",
        "data": recommendations_result
    }

