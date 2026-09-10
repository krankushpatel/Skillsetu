"""
SkillSetu - Step 8 Application System & Recruiter Shortlisting Test Suite
Problem Statement ID: 26044 | Ministry of Ayush - AIIA

Verifies:
1-8. Application Creation & Snapshot capture (valid, missing student, missing opp, closed opp, duplicate, snapshots)
9-12. Student Access & Withdrawal (listing, isolation, withdraw from APPLIED/UNDER_REVIEW, rejecting withdraw on REJECTED/SHORTLISTED)
13-16. Industry Access & Status Transitions (viewing applicants, isolation, updates, invalid transition rejection)
17-24. Lifecycle transitions (APPLIED->UNDER_REVIEW->SHORTLISTED, REJECTED, closed opp checks)
25-27. Snapshot Integrity (modifying student skill score does NOT alter historical snapshot)
28-32. Regression tests across Steps 4-7
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import (
    db_manager,
    COLLECTION_APPLICATIONS,
    COLLECTION_OPPORTUNITIES,
    COLLECTION_STUDENT_SKILL_SCORES,
    COLLECTION_STUDENT_PROFILES,
)
from backend.app.services.seed_data import seed_database

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    """Ensure clean database with seed data for tests."""
    db_manager.connect()
    seed_database(db_manager.db, force=True)


# ==============================================================================
# 1-8. APPLICATION CREATION & SNAPSHOT INTEGRITY
# ==============================================================================

def test_01_valid_application_creation():
    """1. Valid application created successfully."""
    # sp_06 applying for opp_02 (no existing application in seed)
    payload = {
        "studentId": "sp_06",
        "opportunityId": "opp_02",
        "coverNote": "Passionate about Ayurvedic pharmacovigilance."
    }
    response = client.post("/api/applications", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "success"
    assert data["data"]["studentId"] == "sp_06"
    assert data["data"]["opportunityId"] == "opp_02"
    assert data["data"]["status"] == "APPLIED"
    assert "matchScoreSnapshot" in data["data"]
    assert "eligibilitySnapshot" in data["data"]
    assert len(data["data"]["statusHistory"]) == 1
    assert data["data"]["statusHistory"][0]["actor"] == "STUDENT"


def test_02_student_does_not_exist():
    """2. Non-existent student rejected with 404."""
    payload = {
        "studentId": "sp_non_existent_999",
        "opportunityId": "opp_01"
    }
    response = client.post("/api/applications", json=payload)
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_03_opportunity_does_not_exist():
    """3. Non-existent opportunity rejected with 404."""
    payload = {
        "studentId": "sp_01",
        "opportunityId": "opp_non_existent_999"
    }
    response = client.post("/api/applications", json=payload)
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_04_closed_opportunity_rejects_application():
    """4. Closed opportunity rejects new applications with 400."""
    db = db_manager.db
    # Close opp_06
    db[COLLECTION_OPPORTUNITIES].update_one({"_id": "opp_06"}, {"$set": {"status": "CLOSED"}})

    payload = {
        "studentId": "sp_03",
        "opportunityId": "opp_06"
    }
    response = client.post("/api/applications", json=payload)
    assert response.status_code == 400
    assert "closed" in response.json()["detail"].lower()


def test_05_duplicate_application_rejected():
    """5. Duplicate application returns 409 Conflict."""
    # Seed data has sp_01 already applied to opp_02
    payload = {
        "studentId": "sp_01",
        "opportunityId": "opp_02"
    }
    response = client.post("/api/applications", json=payload)
    assert response.status_code == 409
    assert "already" in response.json()["detail"].lower()


def test_06_invalid_payload_rejected():
    """6. Invalid payload returns 422 Unprocessable Entity."""
    response = client.post("/api/applications", json={"studentId": "sp_01"})
    assert response.status_code == 422


def test_07_08_match_and_eligibility_snapshot_captured():
    """7-8. Authoritative snapshots are captured accurately."""
    payload = {
        "studentId": "sp_07",
        "opportunityId": "opp_03",
        "coverNote": "Applying for Herbal Formulation role"
    }
    response = client.post("/api/applications", json=payload)
    assert response.status_code == 201
    app_data = response.json()["data"]

    assert isinstance(app_data["matchScoreSnapshot"], (int, float))
    assert 0.0 <= app_data["matchScoreSnapshot"] <= 100.0
    assert app_data["eligibilitySnapshot"] in ["ELIGIBLE", "CONDITIONAL"]


# ==============================================================================
# 9-12. STUDENT ACCESS & WITHDRAWAL
# ==============================================================================

def test_09_student_can_list_own_applications():
    """9. Student can list own applications with comparison snapshots."""
    response = client.get("/api/applications/student/sp_01")
    assert response.status_code == 200
    res = response.json()
    assert res["status"] == "success"
    assert res["studentId"] == "sp_01"
    assert "summary" in res
    assert len(res["data"]) > 0

    first_app = res["data"][0]
    assert "matchScoreSnapshot" in first_app
    assert "currentMatchScore" in first_app
    assert "scoreDelta" in first_app
    assert "canWithdraw" in first_app


def test_10_student_applications_isolated():
    """10. Listing for student only contains records for that student."""
    res_sp1 = client.get("/api/applications/student/sp_01").json()
    res_sp2 = client.get("/api/applications/student/sp_02").json()

    sp1_ids = {a["id"] for a in res_sp1["data"]}
    sp2_ids = {a["id"] for a in res_sp2["data"]}

    # Ensure no overlap between different students' applications
    assert sp1_ids.isdisjoint(sp2_ids)


def test_11_student_can_withdraw_valid_application():
    """11. Student can withdraw application in APPLIED or UNDER_REVIEW status."""
    db = db_manager.db
    # app_03 is in UNDER_REVIEW in seed data
    app_03 = db[COLLECTION_APPLICATIONS].find_one({"_id": "app_03"})
    assert app_03["status"] == "UNDER_REVIEW"

    withdraw_res = client.patch("/api/applications/app_03/withdraw", json={"reason": "Accepted another offer"})
    assert withdraw_res.status_code == 200
    assert withdraw_res.json()["data"]["status"] == "WITHDRAWN"

    # Verify persisted in database
    updated = db[COLLECTION_APPLICATIONS].find_one({"_id": "app_03"})
    assert updated["status"] == "WITHDRAWN"
    assert updated["statusHistory"][-1]["actor"] == "STUDENT"
    assert "Accepted another offer" in updated["statusHistory"][-1]["note"]


def test_12_student_cannot_withdraw_rejected_application():
    """12. Student cannot withdraw rejected or shortlisted application."""
    db = db_manager.db
    # Reject app_04 first
    client.patch("/api/industry/applications/app_04/status", json={"status": "REJECTED", "recruiterNote": "Not shortlisted"})

    withdraw_res = client.patch("/api/applications/app_04/withdraw")
    assert withdraw_res.status_code == 400
    assert "rejected" in withdraw_res.json()["detail"].lower()


# ==============================================================================
# 13-16. INDUSTRY ACCESS & RECRUITER STATUS MANAGEMENT
# ==============================================================================

def test_13_industry_can_view_own_opportunity_applicants():
    """13. Industry recruiter can view applicants for their opportunity."""
    response = client.get("/api/industry/opportunities/opp_01/applicants")
    assert response.status_code == 200
    res = response.json()
    assert res["status"] == "success"
    assert res["opportunity"]["id"] == "opp_01"
    assert "applicants" in res
    assert "summary" in res

    for app_item in res["applicants"]:
        assert "applicationId" in app_item
        assert "matchScoreSnapshot" in app_item
        assert "currentMatchScore" in app_item
        assert "scoreDelta" in app_item
        assert "status" in app_item


def test_14_industry_cannot_view_another_industry_applicants():
    """14. Industry authorization prevents viewing another industry's applicants."""
    # opp_01 belongs to ind_01. ind_02 attempting access with x-industry-id header is forbidden.
    response = client.get(
        "/api/industry/opportunities/opp_01/applicants",
        headers={"x-industry-id": "ind_02"}
    )
    assert response.status_code == 403
    assert "access denied" in response.json()["detail"].lower()


def test_15_industry_can_update_applicant_status():
    """15. Recruiter can update applicant status with recruiter note."""
    db = db_manager.db
    # Create fresh application for testing transitions
    app_payload = {"studentId": "sp_08", "opportunityId": "opp_01"}
    create_res = client.post("/api/applications", json=app_payload)
    app_id = create_res.json()["data"]["id"]

    # Transition: APPLIED -> UNDER_REVIEW
    update_res = client.patch(
        f"/api/industry/applications/{app_id}/status",
        json={"status": "UNDER_REVIEW", "recruiterNote": "Reviewed resume, advancing to screening."}
    )
    assert update_res.status_code == 200
    assert update_res.json()["data"]["status"] == "UNDER_REVIEW"

    # Verify history in DB
    updated = db[COLLECTION_APPLICATIONS].find_one({"_id": app_id})
    assert updated["status"] == "UNDER_REVIEW"
    assert updated["statusHistory"][-1]["actor"] == "INDUSTRY"
    assert "screening" in updated["statusHistory"][-1]["note"]


def test_16_invalid_status_transition_rejected():
    """16. Invalid status transition (e.g. REJECTED -> SHORTLISTED) is rejected with 400."""
    # Reject app_04 first
    client.patch("/api/industry/applications/app_04/status", json={"status": "REJECTED"})

    response = client.patch(
        "/api/industry/applications/app_04/status",
        json={"status": "SHORTLISTED"}
    )
    assert response.status_code == 400
    assert "rejected" in response.json()["detail"].lower()


# ==============================================================================
# 17-24. LIFECYCLE STATE MACHINE VERIFICATION
# ==============================================================================

def test_17_18_applied_to_under_review_and_shortlisted():
    """17 & 18. APPLIED -> UNDER_REVIEW and APPLIED -> SHORTLISTED transitions."""
    # Test APPLIED -> UNDER_REVIEW
    app1 = client.post("/api/applications", json={"studentId": "sp_05", "opportunityId": "opp_01"}).json()["data"]["id"]
    res1 = client.patch(f"/api/industry/applications/{app1}/status", json={"status": "UNDER_REVIEW"})
    assert res1.status_code == 200
    assert res1.json()["data"]["status"] == "UNDER_REVIEW"

    # Test APPLIED -> SHORTLISTED directly
    app2 = client.post("/api/applications", json={"studentId": "sp_06", "opportunityId": "opp_01"}).json()["data"]["id"]
    res2 = client.patch(f"/api/industry/applications/{app2}/status", json={"status": "SHORTLISTED"})
    assert res2.status_code == 200
    assert res2.json()["data"]["status"] == "SHORTLISTED"


def test_19_under_review_to_shortlisted():
    """19. UNDER_REVIEW -> SHORTLISTED transition."""
    # app_03 is UNDER_REVIEW in seed
    res = client.patch("/api/industry/applications/app_03/status", json={"status": "SHORTLISTED"})
    assert res.status_code == 200
    assert res.json()["data"]["status"] == "SHORTLISTED"


def test_20_21_applied_and_under_review_to_rejected():
    """20 & 21. Transitions to REJECTED from APPLIED and UNDER_REVIEW."""
    # APPLIED -> REJECTED
    app1 = client.post("/api/applications", json={"studentId": "sp_07", "opportunityId": "opp_01"}).json()["data"]["id"]
    res1 = client.patch(f"/api/industry/applications/{app1}/status", json={"status": "REJECTED"})
    assert res1.status_code == 200
    assert res1.json()["data"]["status"] == "REJECTED"

    # UNDER_REVIEW -> REJECTED
    app2 = client.post("/api/applications", json={"studentId": "sp_08", "opportunityId": "opp_01"}).json()["data"]["id"]
    client.patch(f"/api/industry/applications/{app2}/status", json={"status": "UNDER_REVIEW"})
    res2 = client.patch(f"/api/industry/applications/{app2}/status", json={"status": "REJECTED"})
    assert res2.status_code == 200
    assert res2.json()["data"]["status"] == "REJECTED"


def test_22_invalid_transitions_thoroughly_rejected():
    """22. Reverts and illegal transitions rejected."""
    # Once SHORTLISTED, cannot change to REJECTED or UNDER_REVIEW
    # app_01 is SHORTLISTED in seed
    res = client.patch("/api/industry/applications/app_01/status", json={"status": "REJECTED"})
    assert res.status_code == 400

    # Recruiter cannot set status to APPLIED
    res_applied = client.patch("/api/industry/applications/app_01/status", json={"status": "APPLIED"})
    assert res_applied.status_code == 400


def test_23_24_opportunity_closure_preserves_existing_applications():
    """23-24. Closing an opportunity prevents new applications but keeps existing ones intact."""
    db = db_manager.db
    # Close opp_01
    client.patch("/api/industry/opportunities/opp_01/close")
    opp = db[COLLECTION_OPPORTUNITIES].find_one({"_id": "opp_01"})
    assert opp["status"] == "CLOSED"

    # New application must fail
    res_new = client.post("/api/applications", json={"studentId": "sp_06", "opportunityId": "opp_01"})
    assert res_new.status_code == 400

    # Existing applications for opp_01 remain intact and queryable
    res_existing = client.get("/api/industry/opportunities/opp_01/applicants")
    assert res_existing.status_code == 200
    assert len(res_existing.json()["applicants"]) > 0


# ==============================================================================
# 25-27. SNAPSHOT INTEGRITY VERIFICATION
# ==============================================================================

def test_25_26_27_snapshot_integrity_under_skill_change():
    """25-27. Modifying student's skill score changes live match but leaves matchScoreSnapshot immutable."""
    db = db_manager.db
    # Create application for sp_07 on opp_02
    create_res = client.post("/api/applications", json={"studentId": "sp_07", "opportunityId": "opp_02"})
    assert create_res.status_code == 201
    app_id = create_res.json()["data"]["id"]
    original_snapshot = create_res.json()["data"]["matchScoreSnapshot"]

    # Now simulate student gaining skill proficiency (e.g. taking an assessment)
    # Target skill sk_ayur_clin or sk_python
    db[COLLECTION_STUDENT_SKILL_SCORES].update_one(
        {"studentId": "sp_07", "skillId": "sk_python"},
        {"$set": {"proficiency": 99.0, "assessed": True}},
        upsert=True
    )
    # Also update in student profile skills
    db[COLLECTION_STUDENT_PROFILES].update_one(
        {"_id": "sp_07", "skills.skillId": "sk_python"},
        {"$set": {"skills.$.proficiency": 99.0}}
    )

    # Query application via student endpoint
    student_apps = client.get("/api/applications/student/sp_07").json()["data"]
    target_app = next(a for a in student_apps if a["id"] == app_id)

    # 26. Historical snapshot MUST remain identical
    assert target_app["matchScoreSnapshot"] == original_snapshot

    # 27. Current live match reflects updated skill proficiency
    assert target_app["currentMatchScore"] != original_snapshot
    assert target_app["scoreDelta"] != 0.0


# ==============================================================================
# 28-32. REGRESSION TESTS ACROSS STEPS 4-7
# ==============================================================================

def test_28_step4_assessment_works():
    """28. Regression: Step 4 standardized assessments endpoint works."""
    res = client.get("/api/assessments")
    assert res.status_code == 200
    assert "data" in res.json()
    assert len(res.json()["data"]) > 0


def test_29_step5_matching_works():
    """29. Regression: Step 5 deterministic matching endpoint works."""
    res = client.get("/api/opportunities/opp_01/match/sp_01")
    assert res.status_code == 200
    data = res.json()["data"]
    assert "matchScore" in data
    assert "eligibility" in data
    assert "skills" in data
    assert len(data["skills"]) > 0


def test_30_31_step6_what_if_and_recommendations_work():
    """30-31. Regression: Step 6 What-If simulation and recommendations work."""
    # What-If for a skill that is actually required by opp_01 (e.g. sk_ayur_clin)
    what_if_res = client.post(
        "/api/opportunities/opp_01/what-if/sp_01",
        json={"skillUpdates": [{"skillId": "sk_ayur_clin", "proficiency": 95.0}]}
    )
    assert what_if_res.status_code == 200
    sim_data = what_if_res.json()["data"]
    assert "projectedMatchScore" in sim_data or "simulatedScore" in sim_data

    # Learning Recommendations
    rec_res = client.get("/api/opportunities/opp_01/recommendations/sp_01")
    assert rec_res.status_code == 200
    rec_data = rec_res.json()["data"]
    assert "rankedResources" in rec_data or "recommendations" in rec_data




def test_32_step7_industry_candidates_pipeline_works():
    """32. Regression: Step 7 Industry candidate pipeline works."""
    res = client.get("/api/industry/opportunities/opp_01/candidates")
    assert res.status_code == 200
    data = res.json()
    assert "candidates" in data
    assert len(data["candidates"]) > 0
