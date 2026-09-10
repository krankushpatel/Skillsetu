"""
SkillSetu - Application System API Endpoints
Problem Statement ID: 26044 | Ministry of Ayush - AIIA
Step 8: Application System + Recruiter Shortlisting

Provides candidate application lifecycle endpoints:
- POST /applications - Submit application with deterministic snapshot
- GET /applications/student/{student_id} - List student applications with snapshot vs live comparison
- GET /applications/{application_id} - Get detailed application with live matching evaluation
- PATCH /applications/{application_id}/withdraw - Candidate application withdrawal
- GET /applications/check - Check student application status for an opportunity
"""

import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Query, status

from backend.app.core.database import (
    db_manager,
    COLLECTION_SKILLS,
    COLLECTION_STUDENT_PROFILES,
    COLLECTION_USERS,
    COLLECTION_INDUSTRIES,
    COLLECTION_INSTITUTIONS,
    COLLECTION_OPPORTUNITIES,
    COLLECTION_OPPORTUNITY_SKILLS,
    COLLECTION_APPLICATIONS,
    COLLECTION_STUDENT_SKILL_SCORES,
)
from backend.app.schemas.common import ApplicationStatus
from backend.app.services.matching import matching_engine

router = APIRouter()


# --------------------------------------------------------------------------
# Pydantic Schemas
# --------------------------------------------------------------------------

class CreateApplicationRequest(BaseModel):
    studentId: str = Field(..., description="Student profile ID (e.g. sp_01) or user ID")
    opportunityId: str = Field(..., description="Opportunity ID (e.g. opp_01)")
    coverNote: Optional[str] = Field(None, max_length=1000, description="Optional brief cover note or objective")


class WithdrawApplicationRequest(BaseModel):
    reason: Optional[str] = Field(None, max_length=500, description="Optional withdrawal reason")


# --------------------------------------------------------------------------
# Database Helpers
# --------------------------------------------------------------------------

def _check_db():
    if not db_manager.is_connected or db_manager.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service currently unavailable."
        )
    return db_manager.db


def _find_student_profile(db, student_id: str) -> Optional[Dict[str, Any]]:
    """Resolves student profile by either '_id' (sp_01) or 'userId' (usr_std_01)."""
    profile = db[COLLECTION_STUDENT_PROFILES].find_one({"_id": student_id})
    if not profile:
        profile = db[COLLECTION_STUDENT_PROFILES].find_one({"userId": student_id})
    return profile


def _get_student_assessed_skills(db, profile_id: str, profile_skills: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    """Fetches candidate's latest assessed skill scores."""
    authoritative_scores = list(db[COLLECTION_STUDENT_SKILL_SCORES].find({"studentId": profile_id}))
    assessed_map: Dict[str, Dict[str, Any]] = {}

    for s in authoritative_scores:
        assessed_map[s["skillId"]] = {
            "proficiency": float(s.get("proficiency", 0.0)),
            "assessed": s.get("assessed", True),
            "lastAssessed": s.get("lastAssessed", "2026-02-15")
        }

    for sk in profile_skills:
        sk_id = sk.get("skillId")
        if sk_id and sk_id not in assessed_map:
            assessed_map[sk_id] = {
                "proficiency": float(sk.get("proficiency", 0.0)),
                "assessed": sk.get("assessed", True),
                "lastAssessed": sk.get("lastAssessed", "2026-02-15")
            }

    return assessed_map


def _enrich_opportunity_skills(db, opp_id: str) -> List[Dict[str, Any]]:
    """Fetches skill requirements for an opportunity."""
    opp_skills = list(db[COLLECTION_OPPORTUNITY_SKILLS].find({"opportunityId": opp_id}))
    skills_map = {s["_id"]: s for s in db[COLLECTION_SKILLS].find({})}
    enriched = []

    for os in opp_skills:
        sk = skills_map.get(os["skillId"], {})
        min_prof = float(os.get("minProficiency", os.get("requiredProficiency", 0.0)))
        enriched.append({
            "skillId": os["skillId"],
            "skillName": sk.get("name", os["skillId"]),
            "category": sk.get("category", "TECHNICAL"),
            "requiredProficiency": min_prof,
            "minProficiency": min_prof,
            "weight": float(os.get("weight", 1.0)),
            "mandatory": bool(os.get("mandatory", True))
        })
    return enriched


# --------------------------------------------------------------------------
# Endpoints
# --------------------------------------------------------------------------

@router.post("/applications", status_code=status.HTTP_201_CREATED, summary="Submit opportunity application")
def submit_application(payload: CreateApplicationRequest) -> Dict[str, Any]:
    """
    Submits an application from a student to an open opportunity.
    Calculates the authoritative Step 5 match score and eligibility,
    and locks them as persistent historical snapshots (matchScoreSnapshot, eligibilitySnapshot).
    Guarantees duplicate prevention.
    """
    db = _check_db()

    # 1. Verify student exists
    student = _find_student_profile(db, payload.studentId)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student profile '{payload.studentId}' not found."
        )

    # 2. Verify opportunity exists
    opp = db[COLLECTION_OPPORTUNITIES].find_one({"_id": payload.opportunityId})
    if not opp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Opportunity '{payload.opportunityId}' not found."
        )

    # 3. Verify opportunity is OPEN
    if opp.get("status") != "OPEN":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Opportunity '{opp.get('title')}' is currently {opp.get('status')}. Applications are closed."
        )

    # 4. Check for duplicate application
    existing_app = db[COLLECTION_APPLICATIONS].find_one({
        "studentId": student["_id"],
        "opportunityId": opp["_id"]
    })
    if existing_app:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Application already submitted for this opportunity (Status: {existing_app.get('status')})."
        )

    # 5. Calculate authoritative Step 5 match snapshot
    req_skills = _enrich_opportunity_skills(db, opp["_id"])
    assessed_map = _get_student_assessed_skills(db, student["_id"], student.get("skills", []))
    user = db[COLLECTION_USERS].find_one({"_id": student.get("userId")}) or {}
    ind = db[COLLECTION_INDUSTRIES].find_one({"_id": opp.get("industryId")}) or {}

    match_result = matching_engine.calculate_match(
        opportunity_id=opp["_id"],
        student_id=student["_id"],
        required_skills=req_skills,
        assessed_skills_map=assessed_map,
        opportunity_title=opp.get("title", ""),
        organization_name=ind.get("organizationName", ""),
        student_name=user.get("name", "Student Candidate")
    )

    now_iso = datetime.now(timezone.utc).isoformat()
    app_id = f"app_{uuid.uuid4().hex[:8]}"

    match_score_snapshot = float(match_result.get("matchScore", 0.0))
    eligibility_snapshot = str(match_result.get("eligibility", "CONDITIONAL"))

    # Construct persistent application record
    new_application = {
        "_id": app_id,
        "opportunityId": opp["_id"],
        "studentId": student["_id"],
        "industryId": opp.get("industryId"),
        "status": ApplicationStatus.APPLIED.value,
        "appliedAt": now_iso,
        "updatedAt": now_iso,
        "matchScore": match_score_snapshot,  # Compatibility
        "matchScoreSnapshot": match_score_snapshot,
        "eligibilitySnapshot": eligibility_snapshot,
        "coverNote": payload.coverNote.strip() if payload.coverNote else None,
        "statusHistory": [
            {
                "status": ApplicationStatus.APPLIED.value,
                "timestamp": now_iso,
                "actor": "STUDENT",
                "note": f"Application submitted with snapshot match score {match_score_snapshot}% ({eligibility_snapshot})"
            }
        ]
    }

    try:
        db[COLLECTION_APPLICATIONS].insert_one(new_application)
    except Exception as exc:
        # Race-condition safeguard via compound unique index
        if "duplicate" in str(exc).lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Application already exists for this opportunity."
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record application: {str(exc)}"
        )

    return {
        "status": "success",
        "message": f"Successfully applied for '{opp.get('title')}'.",
        "data": {
            "id": app_id,
            "opportunityId": opp["_id"],
            "opportunityTitle": opp.get("title"),
            "organizationName": ind.get("organizationName", "Industry Partner"),
            "studentId": student["_id"],
            "studentName": user.get("name", "Student"),
            "status": ApplicationStatus.APPLIED.value,
            "appliedAt": now_iso,
            "matchScoreSnapshot": match_score_snapshot,
            "eligibilitySnapshot": eligibility_snapshot,
            "coverNote": new_application["coverNote"],
            "statusHistory": new_application["statusHistory"]
        }
    }


@router.get("/applications/student/{student_id}", summary="Get applications for a student")
def get_student_applications(student_id: str) -> Dict[str, Any]:
    """
    Returns all applications submitted by the student with:
    - Historical Match Score Snapshot (at time of application)
    - Historical Eligibility Snapshot
    - Current Live Match Score (Step 5 dynamic recalculation)
    - Opportunity and Organization details
    - Status history log
    - Can-withdraw flag
    """
    db = _check_db()

    student = _find_student_profile(db, student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student profile '{student_id}' not found."
        )

    applications = list(db[COLLECTION_APPLICATIONS].find({"studentId": student["_id"]}).sort("appliedAt", -1))
    opp_map = {o["_id"]: o for o in db[COLLECTION_OPPORTUNITIES].find({})}
    ind_map = {i["_id"]: i for i in db[COLLECTION_INDUSTRIES].find({})}
    user = db[COLLECTION_USERS].find_one({"_id": student.get("userId")}) or {}
    assessed_map = _get_student_assessed_skills(db, student["_id"], student.get("skills", []))

    enriched_applications = []
    for app in applications:
        opp = opp_map.get(app.get("opportunityId"), {})
        ind = ind_map.get(opp.get("industryId", app.get("industryId")), {})

        # Calculate current live match for comparison
        req_skills = _enrich_opportunity_skills(db, opp.get("_id", app.get("opportunityId")))
        live_match = matching_engine.calculate_match(
            opportunity_id=opp.get("_id", app.get("opportunityId")),
            student_id=student["_id"],
            required_skills=req_skills,
            assessed_skills_map=assessed_map,
            opportunity_title=opp.get("title", ""),
            organization_name=ind.get("organizationName", ""),
            student_name=user.get("name", "Student Candidate")
        )

        snapshot_score = app.get("matchScoreSnapshot")
        if snapshot_score is None:
            snapshot_score = app.get("matchScore", live_match.get("matchScore", 0.0))
        snapshot_score = float(snapshot_score)

        snapshot_eligibility = app.get("eligibilitySnapshot", live_match.get("eligibility", "CONDITIONAL"))

        current_score = float(live_match.get("matchScore", 0.0))
        current_eligibility = str(live_match.get("eligibility", "CONDITIONAL"))

        current_status = app.get("status", ApplicationStatus.APPLIED.value)
        can_withdraw = current_status in [ApplicationStatus.APPLIED.value, ApplicationStatus.UNDER_REVIEW.value]

        enriched_applications.append({
            "id": app["_id"],
            "opportunityId": opp.get("_id", app.get("opportunityId")),
            "opportunityTitle": opp.get("title", "Opportunity Role"),
            "organizationName": ind.get("organizationName", "Industry Partner"),
            "type": opp.get("type", "INTERNSHIP"),
            "location": opp.get("location", "Remote"),
            "workMode": opp.get("workMode", "HYBRID"),
            "stipend": opp.get("stipend", "Unspecified"),
            "duration": opp.get("duration", "6 months"),
            "opportunityStatus": opp.get("status", "OPEN"),
            "status": current_status,
            "appliedAt": app.get("appliedAt", ""),
            "updatedAt": app.get("updatedAt", ""),
            "matchScoreSnapshot": snapshot_score,
            "eligibilitySnapshot": snapshot_eligibility,
            "currentMatchScore": current_score,
            "currentEligibility": current_eligibility,
            "scoreDelta": round(current_score - snapshot_score, 1),
            "coverNote": app.get("coverNote"),
            "statusHistory": app.get("statusHistory", []),
            "canWithdraw": can_withdraw
        })

    # Summary counts
    total_count = len(enriched_applications)
    applied_count = sum(1 for a in enriched_applications if a["status"] == "APPLIED")
    under_review_count = sum(1 for a in enriched_applications if a["status"] == "UNDER_REVIEW")
    shortlisted_count = sum(1 for a in enriched_applications if a["status"] == "SHORTLISTED")
    rejected_count = sum(1 for a in enriched_applications if a["status"] == "REJECTED")
    withdrawn_count = sum(1 for a in enriched_applications if a["status"] == "WITHDRAWN")

    return {
        "status": "success",
        "studentId": student["_id"],
        "studentName": user.get("name", "Student"),
        "totalApplications": total_count,
        "summary": {
            "applied": applied_count,
            "underReview": under_review_count,
            "shortlisted": shortlisted_count,
            "rejected": rejected_count,
            "withdrawn": withdrawn_count
        },
        "data": enriched_applications
    }


@router.get("/applications/check", summary="Check if student applied for an opportunity")
def check_application_status(
    studentId: str = Query(..., description="Student profile ID or user ID"),
    opportunityId: str = Query(..., description="Opportunity ID")
) -> Dict[str, Any]:
    """Returns application status if student has applied, or null if not yet applied."""
    db = _check_db()
    student = _find_student_profile(db, studentId)
    if not student:
        return {"hasApplied": False, "application": None}

    app = db[COLLECTION_APPLICATIONS].find_one({
        "studentId": student["_id"],
        "opportunityId": opportunityId
    })

    if not app:
        return {"hasApplied": False, "application": None}

    return {
        "hasApplied": True,
        "application": {
            "id": app["_id"],
            "status": app.get("status"),
            "appliedAt": app.get("appliedAt"),
            "matchScoreSnapshot": app.get("matchScoreSnapshot") or app.get("matchScore"),
            "eligibilitySnapshot": app.get("eligibilitySnapshot", "CONDITIONAL"),
            "coverNote": app.get("coverNote")
        }
    }


@router.get("/applications/{application_id}", summary="Get full application details")
def get_application_by_id(application_id: str) -> Dict[str, Any]:
    """
    Returns full application detail with:
    - Historical Application Snapshot
    - Live Match Evaluation and Comparison Breakdown
    - Complete Candidate Profile and Opportunity details
    - Status history timeline
    """
    db = _check_db()

    app = db[COLLECTION_APPLICATIONS].find_one({"_id": application_id})
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application '{application_id}' not found."
        )

    student = db[COLLECTION_STUDENT_PROFILES].find_one({"_id": app.get("studentId")})
    user = db[COLLECTION_USERS].find_one({"_id": student.get("userId")}) if student else {}
    institution = db[COLLECTION_INSTITUTIONS].find_one({"_id": student.get("institutionId")}) if student else {}
    opp = db[COLLECTION_OPPORTUNITIES].find_one({"_id": app.get("opportunityId")}) or {}
    ind = db[COLLECTION_INDUSTRIES].find_one({"_id": opp.get("industryId", app.get("industryId"))}) or {}

    req_skills = _enrich_opportunity_skills(db, opp.get("_id", ""))
    assessed_map = _get_student_assessed_skills(db, student["_id"], student.get("skills", [])) if student else {}

    # Calculate live match
    live_match = matching_engine.calculate_match(
        opportunity_id=opp.get("_id", ""),
        student_id=student["_id"] if student else "",
        required_skills=req_skills,
        assessed_skills_map=assessed_map,
        opportunity_title=opp.get("title", ""),
        organization_name=ind.get("organizationName", ""),
        student_name=user.get("name", "Student Candidate")
    )

    snapshot_score = app.get("matchScoreSnapshot")
    if snapshot_score is None:
        snapshot_score = app.get("matchScore", live_match.get("matchScore", 0.0))
    snapshot_score = float(snapshot_score)
    snapshot_eligibility = app.get("eligibilitySnapshot", live_match.get("eligibility", "CONDITIONAL"))

    current_score = float(live_match.get("matchScore", 0.0))
    current_eligibility = str(live_match.get("eligibility", "CONDITIONAL"))

    current_status = app.get("status", ApplicationStatus.APPLIED.value)
    can_withdraw = current_status in [ApplicationStatus.APPLIED.value, ApplicationStatus.UNDER_REVIEW.value]

    return {
        "status": "success",
        "data": {
            "id": app["_id"],
            "status": current_status,
            "appliedAt": app.get("appliedAt"),
            "updatedAt": app.get("updatedAt"),
            "coverNote": app.get("coverNote"),
            "statusHistory": app.get("statusHistory", []),
            "canWithdraw": can_withdraw,
            "snapshot": {
                "matchScore": snapshot_score,
                "eligibility": snapshot_eligibility,
                "recordedAt": app.get("appliedAt")
            },
            "liveMatch": {
                "matchScore": current_score,
                "eligibility": current_eligibility,
                "evaluatedAt": datetime.now(timezone.utc).isoformat(),
                "scoreDelta": round(current_score - snapshot_score, 1),
                "details": live_match
            },
            "opportunity": {
                "id": opp.get("_id"),
                "title": opp.get("title"),
                "organizationName": ind.get("organizationName", "Industry Partner"),
                "industryType": ind.get("industryType", ""),
                "type": opp.get("type"),
                "location": opp.get("location"),
                "workMode": opp.get("workMode"),
                "stipend": opp.get("stipend"),
                "duration": opp.get("duration"),
                "status": opp.get("status"),
                "description": opp.get("description"),
                "requiredSkills": req_skills
            },
            "student": {
                "id": student["_id"] if student else "",
                "name": user.get("name", "Student Candidate"),
                "email": user.get("email", ""),
                "course": student.get("course", "") if student else "",
                "department": student.get("department", "") if student else "",
                "batch": student.get("batch", "") if student else "",
                "cgpa": student.get("cgpa", 0.0) if student else 0.0,
                "institutionName": institution.get("name", "All India Institute of Ayurveda (AIIA)") if institution else "",
                "bio": student.get("bio", "") if student else ""
            }
        }
    }


@router.patch("/applications/{application_id}/withdraw", summary="Withdraw an active application")
@router.post("/applications/{application_id}/withdraw", summary="Withdraw an active application (POST alternate)")
def withdraw_application(application_id: str, payload: Optional[WithdrawApplicationRequest] = None) -> Dict[str, Any]:
    """
    Candidate withdraws their application.
    Allowed only from 'APPLIED' or 'UNDER_REVIEW' status.
    Transitions from 'SHORTLISTED', 'REJECTED', or 'WITHDRAWN' are rejected with 400 Bad Request.
    """
    db = _check_db()

    app = db[COLLECTION_APPLICATIONS].find_one({"_id": application_id})
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application '{application_id}' not found."
        )

    current_status = app.get("status")

    if current_status == ApplicationStatus.WITHDRAWN.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Application has already been withdrawn."
        )

    if current_status == ApplicationStatus.SHORTLISTED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot withdraw an application that has already been shortlisted. Please contact the recruiter."
        )

    if current_status == ApplicationStatus.REJECTED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot withdraw a rejected application."
        )

    if current_status not in [ApplicationStatus.APPLIED.value, ApplicationStatus.UNDER_REVIEW.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot withdraw application in status '{current_status}'."
        )

    now_iso = datetime.now(timezone.utc).isoformat()
    note = "Application withdrawn by candidate"
    if payload and payload.reason:
        note += f": {payload.reason.strip()}"

    status_history = app.get("statusHistory", [])
    status_history.append({
        "status": ApplicationStatus.WITHDRAWN.value,
        "timestamp": now_iso,
        "actor": "STUDENT",
        "note": note
    })

    db[COLLECTION_APPLICATIONS].update_one(
        {"_id": application_id},
        {
            "$set": {
                "status": ApplicationStatus.WITHDRAWN.value,
                "updatedAt": now_iso,
                "statusHistory": status_history
            }
        }
    )

    return {
        "status": "success",
        "message": "Application has been successfully withdrawn.",
        "data": {
            "id": application_id,
            "status": ApplicationStatus.WITHDRAWN.value,
            "updatedAt": now_iso,
            "statusHistory": status_history
        }
    }
