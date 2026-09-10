"""
SkillSetu - Industry Module API Endpoints
Problem Statement ID: 26044 | Ministry of Ayush - AIIA
Step 7: Industry Workspace & Opportunity Management

Provides endpoints for:
- Industry profile & stats: GET /industry/{industry_id}
- Industry opportunities: GET /industry/{industry_id}/opportunities
- Opportunity creation: POST /industry/opportunities
- Opportunity inspection: GET /industry/opportunities/{opportunity_id}
- Opportunity update: PUT/PATCH /industry/opportunities/{opportunity_id}
- Opportunity closure: PATCH/POST /industry/opportunities/{opportunity_id}/close
- Opportunity matched candidates: GET /industry/opportunities/{opportunity_id}/candidates
- Candidate match detail: GET /industry/opportunities/{opportunity_id}/candidates/{student_id}
- Candidate skill supply analytics: GET /industry/skills-supply
"""

import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Query, Header, status

from backend.app.core.database import (
    db_manager,
    COLLECTION_SKILLS,
    COLLECTION_STUDENT_PROFILES,
    COLLECTION_USERS,
    COLLECTION_INDUSTRIES,
    COLLECTION_INSTITUTIONS,
    COLLECTION_OPPORTUNITIES,
    COLLECTION_OPPORTUNITY_SKILLS,
    COLLECTION_STUDENT_SKILL_SCORES,
    COLLECTION_APPLICATIONS,
)
from backend.app.schemas.common import ApplicationStatus
from backend.app.services.matching import matching_engine

router = APIRouter()


# --------------------------------------------------------------------------
# Pydantic Schemas for Industry Opportunity Management
# --------------------------------------------------------------------------

class SkillRequirementInput(BaseModel):
    skillId: str = Field(..., description="ID of the skill from taxonomy (e.g. sk_python)")
    requiredProficiency: Optional[float] = Field(None, ge=0.0, le=100.0, description="Required proficiency threshold (0-100)")
    minProficiency: Optional[float] = Field(None, ge=0.0, le=100.0, description="Alias for requiredProficiency")
    weight: float = Field(..., ge=0.0, description="Importance weight (non-negative)")
    mandatory: bool = Field(True, description="Whether requirement is mandatory")

    def get_proficiency(self) -> float:
        if self.requiredProficiency is not None:
            return float(self.requiredProficiency)
        if self.minProficiency is not None:
            return float(self.minProficiency)
        return 0.0


class CreateOpportunityRequest(BaseModel):
    industryId: str = Field(..., description="ID of the posting industry organization")
    title: str = Field(..., min_length=3, description="Opportunity title")
    description: str = Field(..., min_length=10, description="Detailed role description")
    type: str = Field("INTERNSHIP", description="Opportunity type (INTERNSHIP, PROJECT, FULL_TIME, APPRENTICESHIP)")
    location: str = Field(..., description="Location of work")
    workMode: Optional[str] = Field("HYBRID", description="Work mode (REMOTE, HYBRID, ON_SITE)")
    duration: Optional[str] = Field("6 months", description="Duration of opportunity")
    stipend: Optional[str] = Field("₹20,000 / month", description="Stipend or remuneration details")
    requiredSkills: List[SkillRequirementInput] = Field(..., min_items=1, description="List of required skills")


class UpdateOpportunityRequest(BaseModel):
    industryId: Optional[str] = Field(None, description="Industry ID for authorization verification")
    title: Optional[str] = Field(None, min_length=3)
    description: Optional[str] = Field(None, min_length=10)
    type: Optional[str] = None
    location: Optional[str] = None
    workMode: Optional[str] = None
    duration: Optional[str] = None
    stipend: Optional[str] = None
    status: Optional[str] = None
    requiredSkills: Optional[List[SkillRequirementInput]] = None


class UpdateApplicationStatusRequest(BaseModel):
    status: ApplicationStatus = Field(..., description="Target status (UNDER_REVIEW, SHORTLISTED, REJECTED)")
    recruiterNote: Optional[str] = Field(None, max_length=1000, description="Optional recruiter review feedback/note")
    industryId: Optional[str] = Field(None, description="Optional industry ID for authorization check")


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


def _get_student_assessed_skills(db, profile_id: str, profile_skills: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    """
    Fetches the candidate's latest assessed skill scores.
    Prioritizes authoritative student_skill_scores collection, falling back to profile skills.
    """
    assessed_map: Dict[str, Dict[str, Any]] = {}
    db_scores = list(db[COLLECTION_STUDENT_SKILL_SCORES].find({"studentId": profile_id}))
    for s in db_scores:
        if s.get("assessed", True) and s.get("proficiency") is not None:
            assessed_map[s["skillId"]] = s

    for s in profile_skills:
        s_id = s.get("skillId")
        if s_id and s_id not in assessed_map:
            if s.get("assessed", True) and s.get("proficiency") is not None:
                assessed_map[s_id] = s

    return assessed_map


def _enrich_opportunity_skills(db, opp_id: str) -> List[Dict[str, Any]]:
    """Loads and enriches required skills for a given opportunity."""
    opp_skills = list(db[COLLECTION_OPPORTUNITY_SKILLS].find({"opportunityId": opp_id}))
    skills_map = {s["_id"]: s for s in db[COLLECTION_SKILLS].find({})}
    enriched = []
    for os in opp_skills:
        s_info = skills_map.get(os["skillId"], {})
        enriched.append({
            "skillId": os["skillId"],
            "skillName": s_info.get("name", os["skillId"]),
            "category": s_info.get("category", "TECHNICAL"),
            "minProficiency": os.get("minProficiency", 0),
            "requiredProficiency": os.get("minProficiency", 0),
            "weight": os.get("weight", 1),
            "mandatory": os.get("mandatory", True)
        })
    return enriched


# --------------------------------------------------------------------------
# Step 7 Endpoints
# --------------------------------------------------------------------------

@router.get(
    "/industry/skills-supply",
    summary="Candidate Skill Supply Analytics across all assessed students"
)
def get_candidate_skill_supply() -> Dict[str, Any]:
    """
    Computes average assessed proficiency across all students for skills in the taxonomy.
    Gives industry users visibility into student talent availability.
    """
    db = _check_db()
    skills = list(db[COLLECTION_SKILLS].find({}))
    student_scores = list(db[COLLECTION_STUDENT_SKILL_SCORES].find({"assessed": True}))
    profiles = list(db[COLLECTION_STUDENT_PROFILES].find({}))

    # Map scores by skillId
    scores_by_skill: Dict[str, List[float]] = {}
    for s in student_scores:
        prof = s.get("proficiency")
        if prof is not None:
            scores_by_skill.setdefault(s["skillId"], []).append(float(prof))

    # Also capture embedded profile skills if student_skill_scores had none
    for p in profiles:
        for s in p.get("skills", []):
            s_id = s.get("skillId")
            prof = s.get("proficiency")
            if s_id and prof is not None and s_id not in scores_by_skill:
                scores_by_skill.setdefault(s_id, []).append(float(prof))

    supply_data = []
    for sk in skills:
        s_id = sk["_id"]
        profs = scores_by_skill.get(s_id, [])
        avg_prof = round(sum(profs) / len(profs), 1) if profs else 0.0
        supply_data.append({
            "skillId": s_id,
            "skillName": sk.get("name", s_id),
            "category": sk.get("category", "TECHNICAL"),
            "industryDemandScore": sk.get("industryDemandScore", 50),
            "averageProficiency": avg_prof,
            "assessedCandidateCount": len(profs),
            "totalCandidates": len(profiles)
        })

    # Sort by average proficiency descending
    supply_data.sort(key=lambda s: s["averageProficiency"], reverse=True)

    return {
        "status": "success",
        "totalStudents": len(profiles),
        "totalSkills": len(skills),
        "data": supply_data
    }


@router.get(
    "/industry/{industry_id}",
    summary="Get industry profile, active opportunity count, and candidate match statistics"
)
def get_industry_profile(industry_id: str) -> Dict[str, Any]:
    """
    Retrieves profile and operational summary for a fictional demo industry organization.
    """
    db = _check_db()
    ind = db[COLLECTION_INDUSTRIES].find_one({"_id": industry_id})
    if not ind:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Industry organization '{industry_id}' not found."
        )

    # Fetch user details
    user = db[COLLECTION_USERS].find_one({"_id": ind.get("userId")}) or {}

    # Fetch opportunities for this industry
    opportunities = list(db[COLLECTION_OPPORTUNITIES].find({"industryId": industry_id}))
    active_opps = [o for o in opportunities if o.get("status") == "OPEN"]

    # Calculate candidate matching counts across active opportunities
    students = list(db[COLLECTION_STUDENT_PROFILES].find({}))
    total_candidates_assessed = len(students)

    # Evaluate matches for each opportunity to determine eligible counts
    total_eligible_pairings = 0
    total_conditional_pairings = 0
    opp_match_scores = []

    for opp in opportunities:
        req_skills = _enrich_opportunity_skills(db, opp["_id"])
        if not req_skills:
            continue

        for student in students:
            assessed_map = _get_student_assessed_skills(
                db, student["_id"], student.get("skills", [])
            )
            match_res = matching_engine.calculate_match(
                opportunity_id=opp["_id"],
                student_id=student["_id"],
                required_skills=req_skills,
                assessed_skills_map=assessed_map
            )
            opp_match_scores.append(match_res["matchScore"])
            if match_res["eligibility"] == "ELIGIBLE":
                total_eligible_pairings += 1
            else:
                total_conditional_pairings += 1

    avg_match_score = round(sum(opp_match_scores) / len(opp_match_scores), 1) if opp_match_scores else 0

    return {
        "status": "success",
        "data": {
            "id": ind["_id"],
            "_id": ind["_id"],
            "userId": ind.get("userId"),
            "organizationName": ind.get("organizationName"),
            "industryType": ind.get("industryType"),
            "description": ind.get("description"),
            "location": ind.get("location"),
            "website": ind.get("website"),
            "contactPerson": {
                "name": user.get("name", "Industry Representative"),
                "email": user.get("email", ""),
                "avatar": user.get("avatar", "")
            },
            "activeOpportunities": len(active_opps),
            "totalOpportunities": len(opportunities),
            "totalCandidatesAssessed": total_candidates_assessed,
            "totalEligibleCandidates": total_eligible_pairings,
            "totalConditionalCandidates": total_conditional_pairings,
            "averageMatchScore": avg_match_score,
            "createdAt": ind.get("createdAt"),
            "updatedAt": ind.get("updatedAt")
        }
    }


@router.get(
    "/industry/{industry_id}/opportunities",
    summary="List all opportunities belonging to a specific industry organization"
)
def list_industry_opportunities(industry_id: str) -> Dict[str, Any]:
    """
    Returns opportunities posted by this industry with candidate match counts.
    """
    db = _check_db()
    ind = db[COLLECTION_INDUSTRIES].find_one({"_id": industry_id})
    if not ind:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Industry organization '{industry_id}' not found."
        )

    opportunities = list(db[COLLECTION_OPPORTUNITIES].find({"industryId": industry_id}))
    students = list(db[COLLECTION_STUDENT_PROFILES].find({}))

    enriched_opps = []
    for opp in opportunities:
        opp_id = opp["_id"]
        req_skills = _enrich_opportunity_skills(db, opp_id)

        mandatory_count = sum(1 for s in req_skills if s.get("mandatory", True))
        total_weight = sum(s.get("weight", 0) for s in req_skills)

        # Run Step 5 matching against all assessed candidates
        scores = []
        eligible_count = 0
        conditional_count = 0

        for student in students:
            assessed_map = _get_student_assessed_skills(
                db, student["_id"], student.get("skills", [])
            )
            res = matching_engine.calculate_match(
                opportunity_id=opp_id,
                student_id=student["_id"],
                required_skills=req_skills,
                assessed_skills_map=assessed_map
            )
            scores.append(res["matchScore"])
            if res["eligibility"] == "ELIGIBLE":
                eligible_count += 1
            else:
                conditional_count += 1

        top_score = max(scores) if scores else 0
        avg_score = round(sum(scores) / len(scores), 1) if scores else 0

        enriched_opps.append({
            "id": opp_id,
            "_id": opp_id,
            "title": opp.get("title"),
            "industryId": industry_id,
            "organizationName": ind.get("organizationName"),
            "description": opp.get("description"),
            "type": opp.get("type"),
            "location": opp.get("location"),
            "workMode": opp.get("workMode"),
            "stipend": opp.get("stipend"),
            "duration": opp.get("duration"),
            "status": opp.get("status", "OPEN"),
            "createdAt": opp.get("createdAt"),
            "updatedAt": opp.get("updatedAt"),
            "requiredSkillsCount": len(req_skills),
            "mandatorySkillsCount": mandatory_count,
            "totalWeight": round(total_weight, 1),
            "requiredSkills": req_skills,
            "candidateStats": {
                "totalCandidatesAssessed": len(students),
                "eligibleCandidates": eligible_count,
                "conditionalCandidates": conditional_count,
                "averageMatchScore": avg_score,
                "topMatchScore": top_score
            }
        })

    # Sort by created date descending
    enriched_opps.sort(key=lambda o: o.get("createdAt", ""), reverse=True)

    return {
        "status": "success",
        "industryId": industry_id,
        "organizationName": ind.get("organizationName"),
        "count": len(enriched_opps),
        "data": enriched_opps
    }


@router.post(
    "/industry/opportunities",
    status_code=status.HTTP_201_CREATED,
    summary="Create a new opportunity with validated skill requirements and importance weights"
)
def create_opportunity(req: CreateOpportunityRequest) -> Dict[str, Any]:
    """
    Creates an opportunity and its associated opportunity_skills atomically.
    Validates industry existence, skill IDs, proficiency ranges, weights, and rejects duplicates.
    """
    db = _check_db()

    # 1. Validate industry exists
    ind = db[COLLECTION_INDUSTRIES].find_one({"_id": req.industryId})
    if not ind:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Industry organization '{req.industryId}' does not exist."
        )

    # 2. Validate required skills
    if not req.requiredSkills:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one required skill requirement must be provided."
        )

    # 3. Check skills taxonomy & detect duplicates
    all_taxonomy_skills = {s["_id"]: s for s in db[COLLECTION_SKILLS].find({})}
    seen_skill_ids = set()
    validated_skill_records = []

    for item in req.requiredSkills:
        s_id = item.skillId.strip()
        if not s_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Skill ID cannot be empty."
            )

        if s_id not in all_taxonomy_skills:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Skill '{s_id}' does not exist in the standardized skill taxonomy."
            )

        if s_id in seen_skill_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Duplicate skill requirement detected for '{s_id}'. Each skill can only be added once."
            )
        seen_skill_ids.add(s_id)

        prof = item.get_proficiency()
        if prof < 0.0 or prof > 100.0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Required proficiency for '{s_id}' must be between 0 and 100."
            )

        weight = float(item.weight)
        if weight < 0.0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Weight for '{s_id}' must be non-negative (>= 0)."
            )

        validated_skill_records.append({
            "skillId": s_id,
            "minProficiency": int(round(prof)),
            "weight": round(weight, 1),
            "mandatory": bool(item.mandatory)
        })

    # 4. Generate clean unique opportunity ID
    new_opp_id = f"opp_gen_{uuid.uuid4().hex[:8]}"
    now_iso = datetime.now(timezone.utc).isoformat()

    opp_doc = {
        "_id": new_opp_id,
        "industryId": req.industryId,
        "title": req.title.strip(),
        "description": req.description.strip(),
        "type": req.type.upper(),
        "location": req.location.strip(),
        "workMode": (req.workMode or "HYBRID").upper(),
        "stipend": req.stipend or "₹20,000 / month",
        "duration": req.duration or "6 months",
        "status": "OPEN",
        "createdAt": now_iso,
        "updatedAt": now_iso
    }

    # 5. Insert opportunity with rollback safety on opportunity_skills failure
    db[COLLECTION_OPPORTUNITIES].insert_one(opp_doc)

    opp_skills_docs = []
    for idx, v in enumerate(validated_skill_records):
        opp_skills_docs.append({
            "_id": f"os_{new_opp_id}_{idx + 1}",
            "opportunityId": new_opp_id,
            "skillId": v["skillId"],
            "minProficiency": v["minProficiency"],
            "weight": v["weight"],
            "mandatory": v["mandatory"]
        })

    try:
        if opp_skills_docs:
            db[COLLECTION_OPPORTUNITY_SKILLS].insert_many(opp_skills_docs)
    except Exception as err:
        # Rollback opportunity record to avoid orphaned data
        db[COLLECTION_OPPORTUNITIES].delete_one({"_id": new_opp_id})
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record opportunity skills: {str(err)}"
        )

    # 6. Return the newly created opportunity with enriched skill details
    enriched_skills = _enrich_opportunity_skills(db, new_opp_id)

    return {
        "status": "success",
        "message": "Opportunity created successfully.",
        "data": {
            "id": new_opp_id,
            "_id": new_opp_id,
            "title": opp_doc["title"],
            "industryId": opp_doc["industryId"],
            "organizationName": ind.get("organizationName"),
            "description": opp_doc["description"],
            "type": opp_doc["type"],
            "location": opp_doc["location"],
            "workMode": opp_doc["workMode"],
            "stipend": opp_doc["stipend"],
            "duration": opp_doc["duration"],
            "status": opp_doc["status"],
            "createdAt": opp_doc["createdAt"],
            "updatedAt": opp_doc["updatedAt"],
            "requiredSkills": enriched_skills
        }
    }


@router.get(
    "/industry/opportunities/{opportunity_id}",
    summary="Get single opportunity details with competencies and candidate analytics"
)
def get_industry_opportunity(opportunity_id: str) -> Dict[str, Any]:
    """
    Returns full details of an opportunity for the Industry Workspace.
    """
    db = _check_db()
    opp = db[COLLECTION_OPPORTUNITIES].find_one({"_id": opportunity_id})
    if not opp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Opportunity '{opportunity_id}' not found."
        )

    ind = db[COLLECTION_INDUSTRIES].find_one({"_id": opp.get("industryId")}) or {}
    req_skills = _enrich_opportunity_skills(db, opportunity_id)
    students = list(db[COLLECTION_STUDENT_PROFILES].find({}))

    # Calculate matching metrics across all candidate profiles
    scores = []
    eligible_count = 0
    conditional_count = 0

    for student in students:
        assessed_map = _get_student_assessed_skills(
            db, student["_id"], student.get("skills", [])
        )
        res = matching_engine.calculate_match(
            opportunity_id=opportunity_id,
            student_id=student["_id"],
            required_skills=req_skills,
            assessed_skills_map=assessed_map
        )
        scores.append(res["matchScore"])
        if res["eligibility"] == "ELIGIBLE":
            eligible_count += 1
        else:
            conditional_count += 1

    top_score = max(scores) if scores else 0
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0

    return {
        "status": "success",
        "data": {
            "id": opp["_id"],
            "_id": opp["_id"],
            "title": opp.get("title"),
            "industryId": opp.get("industryId"),
            "organizationName": ind.get("organizationName", "Industry Organization"),
            "industryType": ind.get("industryType"),
            "organizationDescription": ind.get("description"),
            "organizationLocation": ind.get("location"),
            "organizationWebsite": ind.get("website"),
            "description": opp.get("description"),
            "type": opp.get("type"),
            "location": opp.get("location"),
            "workMode": opp.get("workMode"),
            "stipend": opp.get("stipend"),
            "duration": opp.get("duration"),
            "status": opp.get("status", "OPEN"),
            "createdAt": opp.get("createdAt"),
            "updatedAt": opp.get("updatedAt"),
            "requiredSkills": req_skills,
            "candidateStats": {
                "totalCandidatesAssessed": len(students),
                "eligibleCandidates": eligible_count,
                "conditionalCandidates": conditional_count,
                "averageMatchScore": avg_score,
                "topMatchScore": top_score
            }
        }
    }


@router.put(
    "/industry/opportunities/{opportunity_id}",
    summary="Update opportunity metadata and required skills"
)
@router.patch(
    "/industry/opportunities/{opportunity_id}",
    summary="Partially update opportunity metadata and required skills"
)
def update_opportunity(
    opportunity_id: str,
    req: UpdateOpportunityRequest,
    industry_id_param: Optional[str] = Query(None, alias="industryId"),
    x_industry_id: Optional[str] = Header(None, alias="X-Industry-Id")
) -> Dict[str, Any]:
    """
    Updates an existing opportunity. Enforces that Industry A cannot modify Industry B's opportunity.
    """
    db = _check_db()
    opp = db[COLLECTION_OPPORTUNITIES].find_one({"_id": opportunity_id})
    if not opp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Opportunity '{opportunity_id}' not found."
        )

    # Authorization Check
    expected_industry = req.industryId or industry_id_param or x_industry_id
    if expected_industry and opp.get("industryId") != expected_industry:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Industry '{expected_industry}' is not authorized to modify opportunity belonging to '{opp.get('industryId')}'."
        )

    now_iso = datetime.now(timezone.utc).isoformat()
    update_fields: Dict[str, Any] = {"updatedAt": now_iso}

    if req.title is not None:
        update_fields["title"] = req.title.strip()
    if req.description is not None:
        update_fields["description"] = req.description.strip()
    if req.type is not None:
        update_fields["type"] = req.type.upper()
    if req.location is not None:
        update_fields["location"] = req.location.strip()
    if req.workMode is not None:
        update_fields["workMode"] = req.workMode.upper()
    if req.duration is not None:
        update_fields["duration"] = req.duration.strip()
    if req.stipend is not None:
        update_fields["stipend"] = req.stipend.strip()
    if req.status is not None:
        update_fields["status"] = req.status.upper()

    # Update opportunity record
    db[COLLECTION_OPPORTUNITIES].update_one({"_id": opportunity_id}, {"$set": update_fields})

    # Update required skills if provided
    if req.requiredSkills is not None:
        if not req.requiredSkills:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one required skill requirement must be provided."
            )

        all_taxonomy = {s["_id"]: s for s in db[COLLECTION_SKILLS].find({})}
        seen_skills = set()
        new_skill_docs = []

        for idx, item in enumerate(req.requiredSkills):
            s_id = item.skillId.strip()
            if s_id not in all_taxonomy:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Skill '{s_id}' does not exist in skill taxonomy."
                )
            if s_id in seen_skills:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Duplicate skill requirement detected for '{s_id}'."
                )
            seen_skills.add(s_id)

            prof = item.get_proficiency()
            if prof < 0.0 or prof > 100.0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Required proficiency for '{s_id}' must be between 0 and 100."
                )

            weight = float(item.weight)
            if weight < 0.0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Weight for '{s_id}' must be >= 0."
                )

            new_skill_docs.append({
                "_id": f"os_{opportunity_id}_{idx + 1}_{uuid.uuid4().hex[:4]}",
                "opportunityId": opportunity_id,
                "skillId": s_id,
                "minProficiency": int(round(prof)),
                "weight": round(weight, 1),
                "mandatory": bool(item.mandatory)
            })

        # Replace existing requirements atomically
        db[COLLECTION_OPPORTUNITY_SKILLS].delete_many({"opportunityId": opportunity_id})
        if new_skill_docs:
            db[COLLECTION_OPPORTUNITY_SKILLS].insert_many(new_skill_docs)

    return get_industry_opportunity(opportunity_id)


@router.patch(
    "/industry/opportunities/{opportunity_id}/close",
    summary="Close an active opportunity"
)
@router.post(
    "/industry/opportunities/{opportunity_id}/close",
    summary="Close an active opportunity (POST alias)"
)
def close_opportunity(
    opportunity_id: str,
    industry_id: Optional[str] = Query(None, alias="industryId"),
    x_industry_id: Optional[str] = Header(None, alias="X-Industry-Id")
) -> Dict[str, Any]:
    """
    Marks opportunity status as CLOSED. Closed opportunities do not accept new matches.
    """
    db = _check_db()
    opp = db[COLLECTION_OPPORTUNITIES].find_one({"_id": opportunity_id})
    if not opp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Opportunity '{opportunity_id}' not found."
        )

    expected_industry = industry_id or x_industry_id
    if expected_industry and opp.get("industryId") != expected_industry:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Industry '{expected_industry}' is not authorized to modify opportunity belonging to '{opp.get('industryId')}'."
        )

    now_iso = datetime.now(timezone.utc).isoformat()
    db[COLLECTION_OPPORTUNITIES].update_one(
        {"_id": opportunity_id},
        {"$set": {"status": "CLOSED", "updatedAt": now_iso}}
    )

    return {
        "status": "success",
        "message": f"Opportunity '{opportunity_id}' has been closed.",
        "opportunityId": opportunity_id,
        "opportunityStatus": "CLOSED"
    }


@router.get(
    "/industry/opportunities/{opportunity_id}/candidates",
    summary="Get deterministically ranked candidates evaluated by Step 5 SkillMatchingEngine"
)
def get_opportunity_candidates(opportunity_id: str) -> Dict[str, Any]:
    """
    Evaluates all assessed candidates against this opportunity using the authoritative
    Step 5 SkillMatchingEngine.

    Ranking Order:
    1. Match Score descending
    2. Eligibility priority: ELIGIBLE before CONDITIONAL
    3. Mandatory requirements met descending
    4. Student ID deterministic final tie-breaker
    """
    db = _check_db()
    opp = db[COLLECTION_OPPORTUNITIES].find_one({"_id": opportunity_id})
    if not opp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Opportunity '{opportunity_id}' not found."
        )

    ind = db[COLLECTION_INDUSTRIES].find_one({"_id": opp.get("industryId")}) or {}
    req_skills = _enrich_opportunity_skills(db, opportunity_id)
    students = list(db[COLLECTION_STUDENT_PROFILES].find({}))
    users = {u["_id"]: u for u in db[COLLECTION_USERS].find({"role": "STUDENT"})}
    institutions = {i["_id"]: i for i in db[COLLECTION_INSTITUTIONS].find({})}

    evaluated_candidates = []

    for profile in students:
        u_info = users.get(profile.get("userId"), {})
        inst_info = institutions.get(profile.get("institutionId"), {})

        candidate_name = u_info.get("name", "Student Candidate")
        inst_name = inst_info.get("shortName") or inst_info.get("name", "AIIA")

        assessed_map = _get_student_assessed_skills(
            db, profile["_id"], profile.get("skills", [])
        )

        # Authoritative Step 5 calculation call
        match_result = matching_engine.calculate_match(
            opportunity_id=opportunity_id,
            student_id=profile["_id"],
            required_skills=req_skills,
            assessed_skills_map=assessed_map,
            opportunity_title=opp.get("title", ""),
            organization_name=ind.get("organizationName", ""),
            student_name=candidate_name
        )

        mandatory_skills = match_result["summary"]["mandatorySkills"]
        mandatory_met = match_result["summary"]["mandatoryRequirementsMet"]
        mandatory_gaps = max(0, mandatory_skills - mandatory_met)

        evaluated_candidates.append({
            "candidateId": profile["_id"],
            "studentId": profile["_id"],
            "name": candidate_name,
            "course": profile.get("course", "BAMS"),
            "department": profile.get("department", "Ayurvedic Medicine"),
            "institution": inst_name,
            "cgpa": profile.get("cgpa", 0.0),
            "matchScore": match_result["matchScore"],
            "rawMatchScore": match_result["rawMatchScore"],
            "eligibility": match_result["eligibility"],
            "eligibilityLabel": match_result["eligibilityLabel"],
            "skillsMet": match_result["summary"]["skillsMet"],
            "totalSkills": match_result["summary"]["requiredSkills"],
            "skillsWithGap": match_result["summary"]["skillsWithGap"],
            "mandatorySkills": mandatory_skills,
            "mandatoryRequirementsMet": mandatory_met,
            "mandatoryGaps": mandatory_gaps,
            "explanation": match_result["explanation"],
            "skills": match_result["skills"]
        })

    # Deterministic candidate ranking:
    # 1. Match Score descending
    # 2. ELIGIBLE before CONDITIONAL (0 for ELIGIBLE, 1 for CONDITIONAL)
    # 3. Mandatory requirements met descending
    # 4. Candidate ID alphabetical ascending as deterministic tie-breaker
    evaluated_candidates.sort(
        key=lambda c: (
            -c["matchScore"],
            0 if c["eligibility"] == "ELIGIBLE" else 1,
            -c["mandatoryRequirementsMet"],
            c["candidateId"]
        )
    )

    # Assign rank numbers 1, 2, ...
    for idx, c in enumerate(evaluated_candidates):
        c["rank"] = idx + 1

    eligible_count = sum(1 for c in evaluated_candidates if c["eligibility"] == "ELIGIBLE")
    conditional_count = len(evaluated_candidates) - eligible_count
    avg_score = round(sum(c["matchScore"] for c in evaluated_candidates) / len(evaluated_candidates), 1) if evaluated_candidates else 0
    top_score = evaluated_candidates[0]["matchScore"] if evaluated_candidates else 0

    return {
        "status": "success",
        "opportunityId": opportunity_id,
        "opportunityTitle": opp.get("title"),
        "organizationName": ind.get("organizationName"),
        "totalCandidates": len(evaluated_candidates),
        "eligibleCount": eligible_count,
        "conditionalCount": conditional_count,
        "averageMatchScore": avg_score,
        "topMatchScore": top_score,
        "candidates": evaluated_candidates
    }


@router.get(
    "/industry/opportunities/{opportunity_id}/candidates/{student_id}",
    summary="Get complete explainable match diagnostics for a candidate from industry perspective"
)
def get_opportunity_candidate_match_detail(opportunity_id: str, student_id: str) -> Dict[str, Any]:
    """
    Returns complete explainable diagnostic metrics for a specific candidate against an opportunity.
    Directly reuses Step 5 matching engine.
    Respects candidate privacy: only academic profile and assessed skill analytics are exposed.
    """
    db = _check_db()
    opp = db[COLLECTION_OPPORTUNITIES].find_one({"_id": opportunity_id})
    if not opp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Opportunity '{opportunity_id}' not found."
        )

    # Find student profile
    student = db[COLLECTION_STUDENT_PROFILES].find_one({"_id": student_id})
    if not student:
        student = db[COLLECTION_STUDENT_PROFILES].find_one({"userId": student_id})
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate profile '{student_id}' not found."
        )

    user = db[COLLECTION_USERS].find_one({"_id": student.get("userId")}) or {}
    institution = db[COLLECTION_INSTITUTIONS].find_one({"_id": student.get("institutionId")}) or {}
    ind = db[COLLECTION_INDUSTRIES].find_one({"_id": opp.get("industryId")}) or {}

    req_skills = _enrich_opportunity_skills(db, opportunity_id)
    assessed_map = _get_student_assessed_skills(
        db, student["_id"], student.get("skills", [])
    )

    # Authoritative Step 5 calculation call
    match_result = matching_engine.calculate_match(
        opportunity_id=opportunity_id,
        student_id=student["_id"],
        required_skills=req_skills,
        assessed_skills_map=assessed_map,
        opportunity_title=opp.get("title", ""),
        organization_name=ind.get("organizationName", ""),
        student_name=user.get("name", "Student Candidate")
    )

    candidate_profile = {
        "candidateId": student["_id"],
        "studentId": student["_id"],
        "name": user.get("name", "Student Candidate"),
        "course": student.get("course", "BAMS"),
        "department": student.get("department", "Ayurvedic Medicine"),
        "batch": student.get("batch", "2022-2027"),
        "cgpa": student.get("cgpa", 0.0),
        "institution": institution.get("name", "All India Institute of Ayurveda (AIIA)"),
        "institutionShortName": institution.get("shortName", "AIIA"),
        "bio": student.get("bio", "")
    }

    return {
        "status": "success",
        "opportunity": {
            "id": opp["_id"],
            "title": opp.get("title"),
            "organizationName": ind.get("organizationName"),
            "type": opp.get("type"),
            "location": opp.get("location"),
            "workMode": opp.get("workMode"),
            "status": opp.get("status")
        },
        "candidate": candidate_profile,
        "match": match_result
    }


# ==========================================================================
# STEP 8: RECRUITER APPLICANT PIPELINE & STATUS MANAGEMENT
# ==========================================================================

@router.get(
    "/industry/opportunities/{opportunity_id}/applicants",
    summary="Get all applicants who applied for an opportunity"
)
def get_opportunity_applicants(
    opportunity_id: str,
    status_filter: Optional[str] = Query(None, description="Optional status filter (e.g. APPLIED, UNDER_REVIEW, SHORTLISTED, REJECTED, WITHDRAWN)"),
    eligibility_filter: Optional[str] = Query(None, description="Optional eligibility filter (ELIGIBLE or CONDITIONAL)"),
    industry_id: Optional[str] = Query(None, description="Optional industry ID for authorization"),
    x_industry_id: Optional[str] = Header(None, description="Optional industry ID header for authorization")
) -> Dict[str, Any]:
    """
    Returns all candidates who have applied for this specific opportunity.
    Includes:
    - Candidate summary profile (Name, Institution, Course, CGPA)
    - Historical Snapshot: Match Score & Eligibility recorded at application time
    - Current Live Evaluation: Deterministic Step 5 recalculation with current candidate scores
    - Score Delta (Live - Snapshot)
    - Current Application Status & Timeline
    - Recruiter review controls
    """
    db = _check_db()

    # 1. Verify opportunity exists
    opp = db[COLLECTION_OPPORTUNITIES].find_one({"_id": opportunity_id})
    if not opp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Opportunity '{opportunity_id}' not found."
        )

    # 2. Authorization check if industry identity provided
    effective_ind_id = industry_id or x_industry_id
    if effective_ind_id and opp.get("industryId") != effective_ind_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You do not own this opportunity."
        )

    ind = db[COLLECTION_INDUSTRIES].find_one({"_id": opp.get("industryId")}) or {}
    req_skills = _enrich_opportunity_skills(db, opp["_id"])

    # 3. Retrieve all applications for this opportunity
    query: Dict[str, Any] = {"opportunityId": opp["_id"]}
    if status_filter and status_filter.upper() != "ALL":
        query["status"] = status_filter.upper()

    applications = list(db[COLLECTION_APPLICATIONS].find(query).sort("appliedAt", -1))

    # Preload student profiles and users for bulk resolution
    student_ids = [a.get("studentId") for a in applications if a.get("studentId")]
    student_profiles = {p["_id"]: p for p in db[COLLECTION_STUDENT_PROFILES].find({"_id": {"$in": student_ids}})}
    user_ids = [p.get("userId") for p in student_profiles.values() if p.get("userId")]
    users = {u["_id"]: u for u in db[COLLECTION_USERS].find({"_id": {"$in": user_ids}})}
    institutions = {i["_id"]: i for i in db[COLLECTION_INSTITUTIONS].find({})}

    enriched_applicants = []

    for app in applications:
        st_id = app.get("studentId")
        student = student_profiles.get(st_id)
        if not student:
            # Fallback search
            student = db[COLLECTION_STUDENT_PROFILES].find_one({"_id": st_id}) or {}

        user = users.get(student.get("userId"), {})
        if not user and student.get("userId"):
            user = db[COLLECTION_USERS].find_one({"_id": student.get("userId")}) or {}

        inst = institutions.get(student.get("institutionId"), {})

        # Live calculation for dynamic comparison
        assessed_map = _get_student_assessed_skills(
            db, student.get("_id", st_id), student.get("skills", [])
        )
        live_match = matching_engine.calculate_match(
            opportunity_id=opp["_id"],
            student_id=student.get("_id", st_id),
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

        # Optional eligibility filter check
        if eligibility_filter and eligibility_filter.upper() != "ALL":
            if current_eligibility != eligibility_filter.upper() and snapshot_eligibility != eligibility_filter.upper():
                continue

        app_status = app.get("status", ApplicationStatus.APPLIED.value)
        can_action = app_status in [ApplicationStatus.APPLIED.value, ApplicationStatus.UNDER_REVIEW.value]

        applicant_item = {
            "applicationId": app["_id"],
            "studentId": student.get("_id", st_id),
            "name": user.get("name", "Student Candidate"),
            "email": user.get("email", ""),
            "course": student.get("course", "BAMS"),
            "department": student.get("department", "Ayurvedic Medicine"),
            "batch": student.get("batch", "2022-2027"),
            "cgpa": student.get("cgpa", 0.0),
            "institution": inst.get("name", "All India Institute of Ayurveda (AIIA)"),
            "institutionShortName": inst.get("shortName", "AIIA"),
            "bio": student.get("bio", ""),
            "status": app_status,
            "appliedAt": app.get("appliedAt", ""),
            "updatedAt": app.get("updatedAt", ""),
            "coverNote": app.get("coverNote"),
            "statusHistory": app.get("statusHistory", []),
            "canAction": can_action,
            "matchScoreSnapshot": snapshot_score,
            "eligibilitySnapshot": snapshot_eligibility,
            "currentMatchScore": current_score,
            "currentEligibility": current_eligibility,
            "scoreDelta": round(current_score - snapshot_score, 1),
            "matchingSkillsCount": sum(1 for s in live_match.get("skillsComparison", []) if s.get("status") == "MET"),
            "totalRequiredSkills": len(req_skills)
        }
        enriched_applicants.append(applicant_item)

    # Sort applicants: Prioritize active statuses (SHORTLISTED, UNDER_REVIEW, APPLIED), then highest match
    status_priority = {
        ApplicationStatus.SHORTLISTED.value: 1,
        ApplicationStatus.UNDER_REVIEW.value: 2,
        ApplicationStatus.APPLIED.value: 3,
        ApplicationStatus.REJECTED.value: 4,
        ApplicationStatus.WITHDRAWN.value: 5
    }
    enriched_applicants.sort(
        key=lambda a: (status_priority.get(a["status"], 99), -a["currentMatchScore"], a["appliedAt"])
    )

    # Calculate summary metrics
    all_apps_for_opp = list(db[COLLECTION_APPLICATIONS].find({"opportunityId": opp["_id"]}))
    total_count = len(all_apps_for_opp)
    applied_count = sum(1 for a in all_apps_for_opp if a.get("status") == ApplicationStatus.APPLIED.value)
    under_review_count = sum(1 for a in all_apps_for_opp if a.get("status") == ApplicationStatus.UNDER_REVIEW.value)
    shortlisted_count = sum(1 for a in all_apps_for_opp if a.get("status") == ApplicationStatus.SHORTLISTED.value)
    rejected_count = sum(1 for a in all_apps_for_opp if a.get("status") == ApplicationStatus.REJECTED.value)
    withdrawn_count = sum(1 for a in all_apps_for_opp if a.get("status") == ApplicationStatus.WITHDRAWN.value)

    return {
        "status": "success",
        "opportunity": {
            "id": opp["_id"],
            "title": opp.get("title"),
            "type": opp.get("type"),
            "status": opp.get("status"),
            "organizationName": ind.get("organizationName"),
            "industryId": opp.get("industryId")
        },
        "summary": {
            "total": total_count,
            "applied": applied_count,
            "underReview": under_review_count,
            "shortlisted": shortlisted_count,
            "rejected": rejected_count,
            "withdrawn": withdrawn_count
        },
        "applicants": enriched_applicants
    }


@router.get(
    "/industry/applications/{application_id}",
    summary="Get full application details for recruiter review"
)
def get_industry_application_detail(
    application_id: str,
    industry_id: Optional[str] = Query(None, description="Optional industry ID for authorization"),
    x_industry_id: Optional[str] = Header(None, description="Optional industry ID header for authorization")
) -> Dict[str, Any]:
    """
    Returns full recruiter-oriented application details including candidate profile,
    opportunity requirements, snapshot vs live comparison, and status update history.
    """
    db = _check_db()

    app = db[COLLECTION_APPLICATIONS].find_one({"_id": application_id})
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application '{application_id}' not found."
        )

    opp = db[COLLECTION_OPPORTUNITIES].find_one({"_id": app.get("opportunityId")}) or {}
    ind = db[COLLECTION_INDUSTRIES].find_one({"_id": opp.get("industryId", app.get("industryId"))}) or {}

    effective_ind_id = industry_id or x_industry_id
    if effective_ind_id and app.get("industryId") and app.get("industryId") != effective_ind_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You do not own this application's opportunity."
        )

    student = db[COLLECTION_STUDENT_PROFILES].find_one({"_id": app.get("studentId")}) or {}
    user = db[COLLECTION_USERS].find_one({"_id": student.get("userId")}) or {}
    institution = db[COLLECTION_INSTITUTIONS].find_one({"_id": student.get("institutionId")}) or {}

    req_skills = _enrich_opportunity_skills(db, opp.get("_id", ""))
    assessed_map = _get_student_assessed_skills(db, student.get("_id", ""), student.get("skills", []))

    live_match = matching_engine.calculate_match(
        opportunity_id=opp.get("_id", ""),
        student_id=student.get("_id", ""),
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
    can_action = current_status in [ApplicationStatus.APPLIED.value, ApplicationStatus.UNDER_REVIEW.value]

    return {
        "status": "success",
        "data": {
            "id": app["_id"],
            "status": current_status,
            "appliedAt": app.get("appliedAt"),
            "updatedAt": app.get("updatedAt"),
            "coverNote": app.get("coverNote"),
            "statusHistory": app.get("statusHistory", []),
            "canAction": can_action,
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
            "candidate": {
                "id": student.get("_id"),
                "name": user.get("name", "Student Candidate"),
                "email": user.get("email", ""),
                "course": student.get("course", "BAMS"),
                "department": student.get("department", "Ayurvedic Medicine"),
                "batch": student.get("batch", "2022-2027"),
                "cgpa": student.get("cgpa", 0.0),
                "institution": institution.get("name", "All India Institute of Ayurveda (AIIA)"),
                "institutionShortName": institution.get("shortName", "AIIA"),
                "bio": student.get("bio", "")
            },
            "opportunity": {
                "id": opp.get("_id"),
                "title": opp.get("title"),
                "organizationName": ind.get("organizationName", "Industry Partner"),
                "type": opp.get("type"),
                "location": opp.get("location"),
                "workMode": opp.get("workMode"),
                "stipend": opp.get("stipend"),
                "duration": opp.get("duration"),
                "status": opp.get("status"),
                "requiredSkills": req_skills
            }
        }
    }


@router.patch(
    "/industry/applications/{application_id}/status",
    summary="Update candidate application status (UNDER_REVIEW, SHORTLISTED, REJECTED)"
)
@router.post(
    "/industry/applications/{application_id}/status",
    summary="Update candidate application status (POST alternative)"
)
def update_application_status(
    application_id: str,
    payload: UpdateApplicationStatusRequest,
    x_industry_id: Optional[str] = Header(None, description="Optional industry ID header for authorization")
) -> Dict[str, Any]:
    """
    Recruiter updates the status of an application.
    Enforces deterministic state machine transitions:
    - APPLIED -> UNDER_REVIEW
    - APPLIED -> SHORTLISTED
    - UNDER_REVIEW -> SHORTLISTED
    - APPLIED -> REJECTED
    - UNDER_REVIEW -> REJECTED

    Invalid transitions rejected with 400 Bad Request:
    - REJECTED -> any
    - WITHDRAWN -> any
    - SHORTLISTED -> any
    - Any transition to APPLIED or WITHDRAWN
    """
    db = _check_db()

    # 1. Validate application exists
    app = db[COLLECTION_APPLICATIONS].find_one({"_id": application_id})
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application '{application_id}' not found."
        )

    # 2. Validate industry ownership
    effective_ind_id = payload.industryId or x_industry_id
    if effective_ind_id and app.get("industryId") and app.get("industryId") != effective_ind_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You do not own the opportunity associated with this application."
        )

    current_status = app.get("status", ApplicationStatus.APPLIED.value)
    target_status = payload.status.value if hasattr(payload.status, "value") else str(payload.status)

    # 3. Validate state transitions
    if current_status == target_status:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Application is already in status '{current_status}'."
        )

    if current_status == ApplicationStatus.REJECTED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify a rejected application. Final decision is immutable."
        )

    if current_status == ApplicationStatus.WITHDRAWN.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify an application that was withdrawn by the candidate."
        )

    if current_status == ApplicationStatus.SHORTLISTED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify an already shortlisted candidate status."
        )

    if target_status in [ApplicationStatus.APPLIED.value, ApplicationStatus.WITHDRAWN.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Recruiter cannot transition application to '{target_status}'."
        )

    allowed_target_statuses = [
        ApplicationStatus.UNDER_REVIEW.value,
        ApplicationStatus.SHORTLISTED.value,
        ApplicationStatus.REJECTED.value
    ]
    if target_status not in allowed_target_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid target status '{target_status}'. Must be one of: {allowed_target_statuses}."
        )

    # Valid transitions from APPLIED: UNDER_REVIEW, SHORTLISTED, REJECTED
    # Valid transitions from UNDER_REVIEW: SHORTLISTED, REJECTED
    if current_status == ApplicationStatus.UNDER_REVIEW.value and target_status == ApplicationStatus.UNDER_REVIEW.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Application is already under review."
        )

    now_iso = datetime.now(timezone.utc).isoformat()
    note_text = payload.recruiterNote.strip() if payload.recruiterNote else f"Recruiter transitioned status to {target_status}."

    status_history = app.get("statusHistory", [])
    status_history.append({
        "status": target_status,
        "timestamp": now_iso,
        "actor": "INDUSTRY",
        "note": note_text
    })

    db[COLLECTION_APPLICATIONS].update_one(
        {"_id": application_id},
        {
            "$set": {
                "status": target_status,
                "updatedAt": now_iso,
                "statusHistory": status_history
            }
        }
    )

    return {
        "status": "success",
        "message": f"Candidate status successfully updated to {target_status}.",
        "data": {
            "id": application_id,
            "status": target_status,
            "updatedAt": now_iso,
            "statusHistory": status_history
        }
    }

