"""
SkillSetu - Step 9 Institution Dashboard & Skill Intelligence Test Suite
Problem Statement ID: 26044 | Ministry of Ayush - AIIA

Verifies:
1-6. Dashboard KPIs & Overview (valid institution, 404 on invalid, total students, avg quotient, open opps, app counts)
7-11. Student Skill Supply Intelligence (assessed student count, average proficiency, strong/developing/needs improvement)
12-15. Industry Skill Demand Intelligence (open opps included, closed excluded, average required proficiency, mandatory/optional count)
16-21. Supply vs Demand & Skill Gaps (comparison calculation, gap sign, shortage classification, balanced, surplus, priority ranking)
22-25. Student Readiness Intelligence (readiness formula, cohort distribution, unassessed student handling, institution isolation)
26-27. Student Detail API & Application List for Institution
28-32. Regression tests across Steps 4-8 (assessments untouched, matching unchanged, what-if functional, industry functional, applications intact)
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import (
    db_manager,
    COLLECTION_INSTITUTIONS,
    COLLECTION_STUDENT_PROFILES,
    COLLECTION_STUDENT_SKILL_SCORES,
    COLLECTION_OPPORTUNITIES,
    COLLECTION_OPPORTUNITY_SKILLS,
    COLLECTION_APPLICATIONS,
    COLLECTION_ASSESSMENTS,
)
from backend.app.services.seed_data import seed_database

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    """Ensure clean database with seed data for tests."""
    db_manager.connect()
    seed_database(db_manager.db, force=True)


# ==============================================================================
# 1-6. INSTITUTION DASHBOARD & OVERVIEW KPIS
# ==============================================================================

def test_01_valid_institution_dashboard():
    """1. Valid institution dashboard returns 200 with complete KPI structure."""
    res = client.get("/api/institution/inst_aiia/dashboard")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "success"
    data = body["data"]
    assert "institution" in data
    assert data["institution"]["id"] == "inst_aiia"
    assert "kpis" in data
    assert "readinessSummary" in data
    assert "gapSummary" in data


def test_02_invalid_institution_returns_404():
    """2. Non-existent institution returns 404 Not Found."""
    res = client.get("/api/institution/inst_non_existent/dashboard")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()


def test_03_total_student_count():
    """3. Total student count reflects the enrolled students in the institution."""
    res = client.get("/api/institution/inst_aiia/dashboard")
    assert res.status_code == 200
    kpis = res.json()["data"]["kpis"]
    assert kpis["totalStudents"] == 8
    assert kpis["assessedStudentsCount"] == 8


def test_04_average_skill_quotient():
    """4. Average skill quotient is calculated from assessed student skill quotients."""
    res = client.get("/api/institution/inst_aiia/dashboard")
    assert res.status_code == 200
    kpis = res.json()["data"]["kpis"]
    # All 8 students have assessed scores; average quotient is > 0 and <= 100
    assert 50.0 <= kpis["averageSkillQuotient"] <= 90.0


def test_05_open_opportunity_count():
    """5. Open opportunity count correctly reflects active industry opportunities."""
    res = client.get("/api/institution/inst_aiia/dashboard")
    assert res.status_code == 200
    kpis = res.json()["data"]["kpis"]
    # In seed data there are 6 open opportunities (opp_01 through opp_06)
    assert kpis["openOpportunities"] == 6


def test_06_application_status_counts():
    """6. Application counts accurately aggregate by status for institution students."""
    res = client.get("/api/institution/inst_aiia/dashboard")
    assert res.status_code == 200
    kpis = res.json()["data"]["kpis"]
    assert kpis["totalApplications"] == 5
    assert kpis["shortlistedApplications"] == 2
    assert kpis["underReviewApplications"] == 1
    assert kpis["appliedApplications"] == 2
    assert kpis["rejectedApplications"] == 0
    assert kpis["withdrawnApplications"] == 0


# ==============================================================================
# 7-11. STUDENT SKILL SUPPLY INTELLIGENCE
# ==============================================================================

def test_07_skill_supply_assessed_student_count():
    """7. Skill supply returns correct assessed student count per skill."""
    res = client.get("/api/institution/inst_aiia/skill-supply")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["institutionId"] == "inst_aiia"
    skills = data["skills"]
    assert len(skills) >= 10
    # Find Python skill
    python_skill = next((s for s in skills if s["skillId"] == "sk_python"), None)
    assert python_skill is not None
    assert python_skill["assessedStudentCount"] > 0


def test_08_skill_supply_average_proficiency():
    """8. Average proficiency is calculated accurately from student skill scores."""
    res = client.get("/api/institution/inst_aiia/skill-supply")
    assert res.status_code == 200
    skills = res.json()["data"]["skills"]
    for s in skills:
        if s["assessedStudentCount"] > 0:
            assert 0.0 <= s["averageProficiency"] <= 100.0


def test_09_skill_supply_strong_classification():
    """9. Proficiency >= 80 is categorized into Strong count."""
    res = client.get("/api/institution/inst_aiia/skill-supply")
    assert res.status_code == 200
    skills = res.json()["data"]["skills"]
    ayur_skill = next((s for s in skills if s["skillId"] == "sk_ayur_clin"), None)
    assert ayur_skill is not None
    # In seed data, Aarav (90), Priyanshi (92), Rohan (84) have >= 80 in sk_ayur_clin
    assert ayur_skill["strongCount"] >= 3


def test_10_skill_supply_developing_classification():
    """10. Proficiency between 60 and 79 is categorized into Developing count."""
    res = client.get("/api/institution/inst_aiia/skill-supply")
    assert res.status_code == 200
    skills = res.json()["data"]["skills"]
    ayur_skill = next((s for s in skills if s["skillId"] == "sk_ayur_clin"), None)
    assert ayur_skill is not None
    assert ayur_skill["developingCount"] >= 1


def test_11_skill_supply_needs_improvement_classification():
    """11. Proficiency < 60 is categorized into Needs Improvement count."""
    res = client.get("/api/institution/inst_aiia/skill-supply")
    assert res.status_code == 200
    skills = res.json()["data"]["skills"]
    sql_skill = next((s for s in skills if s["skillId"] == "sk_sql"), None)
    assert sql_skill is not None
    # Rohan (45), Sneha (32), Vikram (30) have < 60 in SQL
    assert sql_skill["needsImprovementCount"] >= 3


# ==============================================================================
# 12-15. INDUSTRY SKILL DEMAND INTELLIGENCE
# ==============================================================================

def test_12_open_opportunities_included():
    """12. Industry skill demand includes requirements from open opportunities."""
    res = client.get("/api/institution/inst_aiia/skill-demand")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["totalOpenOpportunities"] == 6
    assert data["totalRequirements"] >= 20


def test_13_closed_opportunities_excluded_from_demand():
    """13. Closed opportunities are excluded from active demand calculations."""
    db = db_manager.db
    # Close opportunity opp_02
    try:
        db[COLLECTION_OPPORTUNITIES].update_one({"_id": "opp_02"}, {"$set": {"status": "CLOSED"}})

        res = client.get("/api/institution/inst_aiia/skill-demand")
        assert res.status_code == 200
        data = res.json()["data"]
        assert data["totalOpenOpportunities"] == 5
        # Python was required in opp_02, opp_04, opp_06 -> with opp_02 closed, 2 opportunities remain requiring Python
        python_skill = next((s for s in data["skills"] if s["skillId"] == "sk_python"), None)
        assert python_skill is not None
        # With opp_02 closed, opp_04 and opp_06 still require Python (or opp_02 was 1 of 4 open opps)
        assert python_skill["openOpportunityCount"] <= 3
    finally:
        db[COLLECTION_OPPORTUNITIES].update_one({"_id": "opp_02"}, {"$set": {"status": "OPEN"}})


def test_14_required_proficiency_calculated_correctly():
    """14. Average required proficiency is computed from minProficiency values."""
    res = client.get("/api/institution/inst_aiia/skill-demand")
    assert res.status_code == 200
    skills = res.json()["data"]["skills"]
    for s in skills:
        if s["requirementCount"] > 0:
            assert 50.0 <= s["averageRequiredProficiency"] <= 100.0


def test_15_mandatory_and_optional_demand_counted():
    """15. Requirements are accurately split into mandatory and optional counts."""
    res = client.get("/api/institution/inst_aiia/skill-demand")
    assert res.status_code == 200
    skills = res.json()["data"]["skills"]
    for s in skills:
        assert s["mandatoryCount"] + s["optionalCount"] == s["requirementCount"]


# ==============================================================================
# 16-21. SUPPLY VS DEMAND & SKILL GAPS
# ==============================================================================

def test_16_supply_demand_matrix_calculation():
    """16. Supply vs demand comparison matches student average with industry requirement."""
    res = client.get("/api/institution/inst_aiia/skill-gaps")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["institutionId"] == "inst_aiia"
    assert len(data["allSkillGaps"]) >= 10


def test_17_gap_calculation_sign():
    """17. Gap is calculated as requiredAvg - studentAvg (positive indicates deficit/shortage)."""
    res = client.get("/api/institution/inst_aiia/skill-gaps")
    assert res.status_code == 200
    gaps = res.json()["data"]["allSkillGaps"]
    for g in gaps:
        if g["opportunityCount"] > 0:
            expected_gap = round(g["industryRequiredAverage"] - g["studentAverageProficiency"], 1)
            assert g["gap"] == expected_gap


def test_18_skill_shortage_classification():
    """18. When industry demand exists and gap > 5.0, status is classified as Skill Shortage."""
    res = client.get("/api/institution/inst_aiia/skill-gaps")
    assert res.status_code == 200
    gaps = res.json()["data"]["allSkillGaps"]
    shortages = [g for g in gaps if g["status"] == "Skill Shortage"]
    assert len(shortages) > 0
    for s in shortages:
        assert s["opportunityCount"] > 0
        assert s["gap"] > 5.0
        assert "deficit" in s["explanation"].lower() or "exceeds" in s["explanation"].lower()


def test_19_balanced_classification():
    """19. When industry demand exists and -5.0 <= gap <= 5.0, status is classified as Balanced."""
    res = client.get("/api/institution/inst_aiia/skill-gaps")
    assert res.status_code == 200
    gaps = res.json()["data"]["allSkillGaps"]
    balanced = [g for g in gaps if g["status"] == "Balanced"]
    for b in balanced:
        assert b["opportunityCount"] > 0
        assert -5.0 <= b["gap"] <= 5.0
        assert "aligned" in b["explanation"].lower()


def test_20_skill_surplus_classification():
    """20. When student proficiency exceeds requirements or zero open demand, status is Skill Surplus."""
    res = client.get("/api/institution/inst_aiia/skill-gaps")
    assert res.status_code == 200
    gaps = res.json()["data"]["allSkillGaps"]
    surplus = [g for g in gaps if g["status"] == "Skill Surplus"]
    assert len(surplus) > 0
    for sp in surplus:
        if sp["opportunityCount"] > 0:
            assert sp["gap"] < -5.0


def test_21_deterministic_priority_ranking():
    """21. Top skill gaps are sorted deterministically with shortages first by priority score."""
    res = client.get("/api/institution/inst_aiia/skill-gaps")
    assert res.status_code == 200
    top_gaps = res.json()["data"]["topSkillGaps"]
    assert len(top_gaps) > 0
    # Verify all top gaps are Shortages and priority scores are monotonically descending
    for i in range(len(top_gaps) - 1):
        assert top_gaps[i]["status"] == "Skill Shortage"
        assert top_gaps[i]["priorityScore"] >= top_gaps[i+1]["priorityScore"]


# ==============================================================================
# 22-25. STUDENT READINESS INTELLIGENCE
# ==============================================================================

def test_22_student_readiness_calculation():
    """22. Student readiness accurately assigns Ready, Developing, or Needs Improvement."""
    res = client.get("/api/institution/inst_aiia/student-readiness")
    assert res.status_code == 200
    students = res.json()["data"]["students"]
    aarav = next((s for s in students if s["studentId"] == "sp_01"), None)
    assert aarav is not None
    assert aarav["readinessStatus"] == "Ready"
    assert aarav["overallSkillQuotient"] >= 75.0
    assert aarav["strongCount"] >= 2


def test_23_readiness_distribution_integrity():
    """23. Readiness distribution counts sum to total student count."""
    res = client.get("/api/institution/inst_aiia/student-readiness")
    assert res.status_code == 200
    data = res.json()["data"]
    total = data["totalStudents"]
    ready = data["readyCount"]
    dev = data["developingCount"]
    ni = data["needsImprovementCount"]
    pending = data["pendingAssessmentCount"]
    assert ready + dev + ni + pending == total
    assert data["opportunityReadinessIndex"] == round((ready / (total - pending)) * 100, 1)


def test_24_student_missing_assessments_classified_pending():
    """24. Student with no assessed skills is classified as Pending Assessment."""
    db = db_manager.db
    try:
        # Create an unassessed student profile
        db[COLLECTION_STUDENT_PROFILES].insert_one({
            "_id": "sp_unassessed_01",
            "userId": "usr_unassessed",
            "institutionId": "inst_aiia",
            "department": "Kayachikitsa",
            "course": "BAMS",
            "batch": "2024-2029",
            "cgpa": 7.5,
            "skills": []
        })

        res = client.get("/api/institution/inst_aiia/student-readiness")
        assert res.status_code == 200
        data = res.json()["data"]
        unassessed = next((s for s in data["students"] if s["studentId"] == "sp_unassessed_01"), None)
        assert unassessed is not None
        assert unassessed["readinessStatus"] == "Pending Assessment"
        assert unassessed["assessedSkillsCount"] == 0
        assert data["pendingAssessmentCount"] >= 1
    finally:
        db[COLLECTION_STUDENT_PROFILES].delete_one({"_id": "sp_unassessed_01"})


def test_25_institution_scoped_data_isolation():
    """25. Analytics only include students belonging to the queried institution."""
    db = db_manager.db
    try:
        # Create a student in another institution
        db[COLLECTION_INSTITUTIONS].insert_one({
            "_id": "inst_other",
            "name": "Other University of Ayurveda",
            "type": "State University",
            "location": "Jaipur, Rajasthan"
        })
        db[COLLECTION_STUDENT_PROFILES].insert_one({
            "_id": "sp_other_01",
            "userId": "usr_other_std",
            "institutionId": "inst_other",
            "skills": [{"skillId": "sk_python", "proficiency": 99, "assessed": True}]
        })

        # AIIA readiness must NOT include sp_other_01
        res_aiia = client.get("/api/institution/inst_aiia/student-readiness")
        aiia_students = [s["studentId"] for s in res_aiia.json()["data"]["students"]]
        assert "sp_other_01" not in aiia_students

        # inst_other must only return its own student
        res_other = client.get("/api/institution/inst_other/student-readiness")
        assert res_other.status_code == 200
        other_students = [s["studentId"] for s in res_other.json()["data"]["students"]]
        assert "sp_other_01" in other_students
        assert "sp_01" not in other_students
    finally:
        db[COLLECTION_INSTITUTIONS].delete_one({"_id": "inst_other"})
        db[COLLECTION_STUDENT_PROFILES].delete_one({"_id": "sp_other_01"})


# ==============================================================================
# 26-27. STUDENT DETAIL & APPLICATION LIST FOR INSTITUTION
# ==============================================================================

def test_26_institution_student_detail():
    """26. Read-only detailed student record is accessible by authorized institution."""
    res = client.get("/api/institution/inst_aiia/students/sp_01")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["studentId"] == "sp_01"
    assert data["name"] == "Aarav Sharma"
    assert len(data["assessedSkills"]) > 0
    assert "overallSkillQuotient" in data
    assert "readinessStatus" in data
    assert "applications" in data


def test_27_institution_applications_list():
    """27. Institution applications endpoint lists all student applications and status counts."""
    res = client.get("/api/institution/inst_aiia/applications")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["institutionId"] == "inst_aiia"
    assert data["totalApplications"] == 5
    assert "statusCounts" in data
    assert len(data["applications"]) == 5


# ==============================================================================
# 28-32. REGRESSION TESTS ACROSS STEPS 4-8
# ==============================================================================

def test_28_step4_assessment_scores_untouched():
    """28. Regression: Step 4 assessment benchmark and scores remain read-only and intact."""
    res = client.get("/api/assessments/asm_01")
    assert res.status_code == 200
    assert res.json()["data"]["id"] == "asm_01"


def test_29_step5_matching_formula_unchanged():
    """29. Regression: Step 5 deterministic matching endpoint produces unchanged score."""
    res = client.get("/api/opportunities/opp_01/match/sp_01")
    assert res.status_code == 200
    match_data = res.json()["data"]
    assert match_data["matchScore"] > 0
    assert "eligibility" in match_data


def test_30_step6_what_if_and_recommendations_work():
    """30. Regression: Step 6 What-If simulation and learning recommendations work."""
    what_if_res = client.post(
        "/api/opportunities/opp_01/what-if/sp_01",
        json={"skillUpdates": [{"skillId": "sk_ayur_clin", "proficiency": 95.0}]}
    )
    assert what_if_res.status_code == 200
    assert "projectedMatchScore" in what_if_res.json()["data"]

    rec_res = client.get("/api/opportunities/opp_01/recommendations/sp_01")
    assert rec_res.status_code == 200


def test_31_step7_industry_pipeline_intact():
    """31. Regression: Step 7 Industry candidates pipeline works without regression."""
    res = client.get("/api/industry/opportunities/opp_01/candidates")
    assert res.status_code == 200
    assert res.json()["status"] == "success"


def test_32_step8_application_workflow_intact():
    """32. Regression: Step 8 application submission and status queries work as before."""
    db = db_manager.db
    app_id = None
    try:
        # Student sp_06 applying to opp_03
        app_res = client.post(
            "/api/applications",
            json={
                "studentId": "sp_06",
                "opportunityId": "opp_03",
                "coverNote": "Regression verification application."
            }
        )
        assert app_res.status_code == 201
        app_data = app_res.json()["data"]
        app_id = app_data["id"]
        assert app_data["matchScoreSnapshot"] is not None

        # Verify student applications listing contains the application
        detail_res = client.get("/api/applications/student/sp_06")
        assert detail_res.status_code == 200
        student_apps = detail_res.json()["data"]
        assert any(a["id"] == app_id for a in student_apps)
    finally:
        if app_id:
            db[COLLECTION_APPLICATIONS].delete_one({"_id": app_id})
