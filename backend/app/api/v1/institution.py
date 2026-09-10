"""
SkillSetu - Institution & Academia Intelligence Endpoints
Step 9: Institution Dashboard + Skill Intelligence

Endpoints:
- GET /api/institution/{institution_id}/dashboard
- GET /api/institution/{institution_id}/skill-supply
- GET /api/institution/{institution_id}/skill-demand
- GET /api/institution/{institution_id}/skill-gaps
- GET /api/institution/{institution_id}/student-readiness
- GET /api/institution/{institution_id}/students/{student_id}
- GET /api/institution/{institution_id}/applications
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status
from backend.app.core.database import db_manager, COLLECTION_APPLICATIONS, COLLECTION_OPPORTUNITIES, COLLECTION_STUDENT_PROFILES, COLLECTION_USERS
from backend.app.services.institution import (
    get_institution_by_id,
    get_institution_dashboard,
    get_student_skill_supply,
    get_industry_skill_demand,
    get_skill_gaps_intelligence,
    get_student_readiness_intelligence,
    get_institution_student_detail,
)

router = APIRouter(prefix="/institution", tags=["Institution"])


def _check_db():
    if not db_manager.is_connected or db_manager.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service currently unavailable."
        )
    return db_manager.db


@router.get(
    "/{institution_id}/dashboard",
    summary="Institution macro dashboard KPIs and analytics"
)
def get_dashboard(institution_id: str) -> Dict[str, Any]:
    """Returns macro dashboard KPIs, cohort readiness, priority skill gaps, and recent application activity."""
    db = _check_db()
    data = get_institution_dashboard(db, institution_id)
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Institution '{institution_id}' not found."
        )
    return {
        "status": "success",
        "data": data
    }


@router.get(
    "/{institution_id}/skill-supply",
    summary="Student skill supply distribution across cohort"
)
def get_skill_supply(institution_id: str) -> Dict[str, Any]:
    """
    Returns student skill supply calculated from authoritative assessed scores.
    Categorized into Strong (80-100), Developing (60-79), and Needs Improvement (<60).
    """
    db = _check_db()
    data = get_student_skill_supply(db, institution_id)
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Institution '{institution_id}' not found."
        )
    return {
        "status": "success",
        "data": data
    }


@router.get(
    "/{institution_id}/skill-demand",
    summary="Industry skill demand across open opportunities"
)
def get_skill_demand(institution_id: str) -> Dict[str, Any]:
    """Returns industry skill demand analysis derived from current OPEN opportunities."""
    db = _check_db()
    inst = get_institution_by_id(db, institution_id)
    if not inst:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Institution '{institution_id}' not found."
        )
    data = get_industry_skill_demand(db)
    data["institutionId"] = institution_id
    data["institutionName"] = inst.get("name")
    return {
        "status": "success",
        "data": data
    }


@router.get(
    "/skill-demand",
    summary="Industry skill demand across open opportunities (global)"
)
def get_global_skill_demand() -> Dict[str, Any]:
    """Returns industry skill demand analysis across all open opportunities."""
    db = _check_db()
    data = get_industry_skill_demand(db)
    return {
        "status": "success",
        "data": data
    }


@router.get(
    "/{institution_id}/skill-gaps",
    summary="Deterministic Supply vs. Demand Matrix and Skill Gaps"
)
def get_skill_gaps(institution_id: str) -> Dict[str, Any]:
    """
    Returns deterministic comparison between student skill supply and open industry demand.
    Classified into Skill Shortage, Balanced, and Skill Surplus with deterministic explanations and recommendations.
    """
    db = _check_db()
    data = get_skill_gaps_intelligence(db, institution_id)
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Institution '{institution_id}' not found."
        )
    return {
        "status": "success",
        "data": data
    }


@router.get(
    "/{institution_id}/student-readiness",
    summary="Student opportunity readiness classification and distribution"
)
def get_student_readiness(institution_id: str) -> Dict[str, Any]:
    """
    Returns deterministic opportunity readiness for all students in the institution.
    Classified into Ready, Developing, Needs Improvement, and Pending Assessment.
    """
    db = _check_db()
    data = get_student_readiness_intelligence(db, institution_id)
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Institution '{institution_id}' not found."
        )
    return {
        "status": "success",
        "data": data
    }


@router.get(
    "/{institution_id}/students/{student_id}",
    summary="Read-only student analytical record for institution"
)
def get_student_detail(institution_id: str, student_id: str) -> Dict[str, Any]:
    """Returns read-only student academic profile, assessed skills, and application history for an authorized institution."""
    db = _check_db()
    data = get_institution_student_detail(db, institution_id, student_id)
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student '{student_id}' not found in institution '{institution_id}'."
        )
    return {
        "status": "success",
        "data": data
    }


@router.get(
    "/{institution_id}/applications",
    summary="Application metrics for students of this institution"
)
def get_institution_applications(institution_id: str) -> Dict[str, Any]:
    """Returns all applications submitted by students belonging to the institution, with status and snapshot metrics."""
    db = _check_db()
    inst = get_institution_by_id(db, institution_id)
    if not inst:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Institution '{institution_id}' not found."
        )

    students = list(db[COLLECTION_STUDENT_PROFILES].find({"institutionId": institution_id}))
    student_ids = [s["_id"] for s in students]
    users_by_std_id = {s["_id"]: s.get("userId") for s in students}
    users_map = {u["_id"]: u for u in db[COLLECTION_USERS].find({"_id": {"$in": list(users_by_std_id.values())}})}

    applications = list(db[COLLECTION_APPLICATIONS].find({"studentId": {"$in": student_ids}}))
    opp_ids = list({a["opportunityId"] for a in applications})
    opps_map = {o["_id"]: o for o in db[COLLECTION_OPPORTUNITIES].find({"_id": {"$in": opp_ids}})}

    enriched = []
    for app in sorted(applications, key=lambda a: a.get("appliedAt", ""), reverse=True):
        s_id = app.get("studentId")
        u_id = users_by_std_id.get(s_id)
        user_info = users_map.get(u_id, {})
        opp_info = opps_map.get(app.get("opportunityId"), {})
        enriched.append({
            "applicationId": app["_id"],
            "studentId": s_id,
            "studentName": user_info.get("name", "Student Scholar"),
            "opportunityId": app.get("opportunityId"),
            "opportunityTitle": opp_info.get("title", "Industry Opportunity"),
            "organizationName": opp_info.get("location", ""),
            "status": app.get("status"),
            "matchScoreSnapshot": app.get("matchScoreSnapshot") or app.get("matchScore", 0.0),
            "eligibilitySnapshot": app.get("eligibilitySnapshot", "ELIGIBLE"),
            "appliedAt": app.get("appliedAt", ""),
            "updatedAt": app.get("updatedAt", ""),
        })

    status_counts = {
        "APPLIED": sum(1 for a in applications if a.get("status") == "APPLIED"),
        "UNDER_REVIEW": sum(1 for a in applications if a.get("status") == "UNDER_REVIEW"),
        "SHORTLISTED": sum(1 for a in applications if a.get("status") == "SHORTLISTED"),
        "REJECTED": sum(1 for a in applications if a.get("status") == "REJECTED"),
        "WITHDRAWN": sum(1 for a in applications if a.get("status") == "WITHDRAWN"),
    }

    return {
        "status": "success",
        "data": {
            "institutionId": institution_id,
            "institutionName": inst.get("name"),
            "totalApplications": len(applications),
            "statusCounts": status_counts,
            "applications": enriched,
        }
    }
