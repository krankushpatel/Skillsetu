"""
SkillSetu - Student Module API Endpoints
Step 3: Student Module & Skill Profile

Provides student-specific data access endpoints for:
- Student Profile (Academic, Personal, Projects, Certifications)
- Student Assessed Skill Scores
- Student Summary and Cohort List
"""
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, status
from backend.app.core.database import (
    db_manager,
    COLLECTION_SKILLS,
    COLLECTION_STUDENT_PROFILES,
    COLLECTION_USERS,
    COLLECTION_INSTITUTIONS,
    COLLECTION_STUDENT_SKILL_SCORES,
    COLLECTION_PORTFOLIOS
)

router = APIRouter()

def _check_db():
    if not db_manager.is_connected or db_manager.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service currently unavailable."
        )
    return db_manager.db

def _find_student_profile(db, student_id: str) -> Optional[Dict[str, Any]]:
    """Helper to find profile by either profile '_id' (sp_01) or 'userId' (usr_std_01)."""
    profile = db[COLLECTION_STUDENT_PROFILES].find_one({"_id": student_id})
    if not profile:
        profile = db[COLLECTION_STUDENT_PROFILES].find_one({"userId": student_id})
    return profile

def _enrich_student(db, profile: Dict[str, Any]) -> Dict[str, Any]:
    """Joins profile with user identity and institution information."""
    user = db[COLLECTION_USERS].find_one({"_id": profile.get("userId")}) or {}
    institution = db[COLLECTION_INSTITUTIONS].find_one({"_id": profile.get("institutionId")}) or {}
    skills_map = {s["_id"]: s for s in db[COLLECTION_SKILLS].find({})}

    # Enrich assessed skills (harmonized with authoritative student_skill_scores)
    db_skill_scores = list(db[COLLECTION_STUDENT_SKILL_SCORES].find({"studentId": profile["_id"]}))
    skill_scores_by_id = {s["skillId"]: s for s in db_skill_scores}

    raw_skills = profile.get("skills", [])
    seen_skills = set()
    enriched_skills = []

    for sk in raw_skills:
        sk_id = sk.get("skillId")
        seen_skills.add(sk_id)
        authoritative = skill_scores_by_id.get(sk_id)
        proficiency = authoritative.get("proficiency") if authoritative else sk.get("proficiency", 0)
        assessed = authoritative.get("assessed") if authoritative else sk.get("assessed", True)
        last_assessed = authoritative.get("lastAssessed") if authoritative else sk.get("lastAssessed", "2026-02-15")

        skill_info = skills_map.get(sk_id, {})
        enriched_skills.append({
            "skillId": sk_id,
            "skillName": skill_info.get("name", sk_id),
            "category": skill_info.get("category", "TECHNICAL"),
            "description": skill_info.get("description", ""),
            "industryDemandScore": skill_info.get("industryDemandScore", 80),
            "proficiency": proficiency,
            "assessed": assessed,
            "lastAssessed": last_assessed
        })

    # Include any assessed skill scores present in collection but not yet in profile array
    for sk_id, auth_sk in skill_scores_by_id.items():
        if sk_id not in seen_skills:
            skill_info = skills_map.get(sk_id, {})
            enriched_skills.append({
                "skillId": sk_id,
                "skillName": skill_info.get("name", sk_id),
                "category": skill_info.get("category", "TECHNICAL"),
                "description": skill_info.get("description", ""),
                "industryDemandScore": skill_info.get("industryDemandScore", 80),
                "proficiency": auth_sk.get("proficiency", 0),
                "assessed": auth_sk.get("assessed", True),
                "lastAssessed": auth_sk.get("lastAssessed", "2026-02-15")
            })

    # Calculate Overall Skill Quotient (average of assessed proficiencies)
    if enriched_skills:
        total_score = sum(s["proficiency"] for s in enriched_skills)
        skill_quotient = round(total_score / len(enriched_skills), 1)
    else:
        skill_quotient = 0.0

    return {
        "id": profile["_id"],
        "userId": profile.get("userId"),
        "name": user.get("name", "Unknown Student"),
        "email": user.get("email", ""),
        "avatar": user.get("avatar", f"https://api.dicebear.com/7.x/avataaars/svg?seed={profile['_id']}"),
        "institutionId": profile.get("institutionId"),
        "institutionName": institution.get("name", "All India Institute of Ayurveda (AIIA)"),
        "institutionLocation": institution.get("location", "New Delhi, Delhi"),
        "department": profile.get("department", ""),
        "course": profile.get("course", ""),
        "batch": profile.get("batch", ""),
        "cgpa": profile.get("cgpa", 0.0),
        "bio": profile.get("bio", ""),
        "skillQuotient": skill_quotient,
        "assessedSkills": enriched_skills,
        "certifications": profile.get("certifications", []),
        "projects": profile.get("projects", []),
        "internships": profile.get("internships", []),
        "achievements": profile.get("achievements", []),
        "createdAt": profile.get("createdAt", ""),
        "updatedAt": profile.get("updatedAt", "")
    }

@router.get("", summary="List all students")
def get_all_students() -> Dict[str, Any]:
    """Returns list of all student profiles with summarized academic and skill info."""
    db = _check_db()
    profiles = list(db[COLLECTION_STUDENT_PROFILES].find({}))
    data = [_enrich_student(db, p) for p in profiles]
    return {
        "count": len(data),
        "data": data
    }

@router.get("/{student_id}", summary="Get student full details")
def get_student_by_id(student_id: str) -> Dict[str, Any]:
    """
    Returns full student details by profile ID (e.g., 'sp_01') or user ID ('usr_std_01').
    Includes personal info, academic details, assessed skill scores, projects, and certifications.
    """
    db = _check_db()
    profile = _find_student_profile(db, student_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student profile '{student_id}' not found."
        )
    return {
        "status": "success",
        "data": _enrich_student(db, profile)
    }

@router.get("/{student_id}/profile", summary="Get student academic profile")
def get_student_academic_profile(student_id: str) -> Dict[str, Any]:
    """Returns academic and portfolio data (projects, certifications, internships, achievements)."""
    db = _check_db()
    profile = _find_student_profile(db, student_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student profile '{student_id}' not found."
        )
    enriched = _enrich_student(db, profile)
    return {
        "status": "success",
        "data": {
            "id": enriched["id"],
            "userId": enriched["userId"],
            "name": enriched["name"],
            "email": enriched["email"],
            "avatar": enriched["avatar"],
            "institutionName": enriched["institutionName"],
            "institutionLocation": enriched["institutionLocation"],
            "department": enriched["department"],
            "course": enriched["course"],
            "batch": enriched["batch"],
            "cgpa": enriched["cgpa"],
            "bio": enriched["bio"],
            "certifications": enriched["certifications"],
            "projects": enriched["projects"],
            "internships": enriched["internships"],
            "achievements": enriched["achievements"]
        }
    }

@router.get("/{student_id}/skills", summary="Get student assessed skill scores")
def get_student_skills(student_id: str) -> Dict[str, Any]:
    """
    Returns student's assessed skill scores with taxonomy metadata and calculated skill quotient.
    Adheres strictly to 'Assessed Skill Score' terminology (never 'Verified').
    """
    db = _check_db()
    profile = _find_student_profile(db, student_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student profile '{student_id}' not found."
        )
    enriched = _enrich_student(db, profile)
    skills = enriched["assessedSkills"]

    # Sort descending by proficiency for analytical convenience
    sorted_skills = sorted(skills, key=lambda x: x["proficiency"], reverse=True)
    strengths = sorted_skills[:3]
    to_improve = sorted_skills[-3:] if len(sorted_skills) >= 3 else sorted_skills

    return {
        "status": "success",
        "data": {
            "studentId": enriched["id"],
            "studentName": enriched["name"],
            "skillQuotient": enriched["skillQuotient"],
            "totalAssessed": len(skills),
            "assessedSkills": skills,
            "strengths": strengths,
            "toImprove": to_improve
        }
    }
