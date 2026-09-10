"""
SkillSetu - Institution & Academia Intelligence Service Layer
Step 9: Institution Dashboard + Skill Intelligence

Provides deterministic analytics and intelligence computation for academic institutions:
1. Student Skill Supply Intelligence (assessed skills distribution across cohort)
2. Industry Skill Demand Intelligence (demand across open opportunities)
3. Supply vs. Demand Matrix and Skill Gap Classification
4. Priority Skill Gaps with deterministic explanations and curriculum recommendations
5. Student Opportunity Readiness Intelligence and Cohort Distribution
6. Institutional Overview KPIs and Application Pipeline Analytics

STRICT RULES:
- Read-only derivation: Authoritative assessment scores and attempts are NEVER modified.
- No LLMs, embeddings, or black-box ML: All formulas, rankings, and explanations are 100% deterministic.
- Zero fake placement numbers: Uses honest Opportunity Readiness indices based on assessed data.
"""

from typing import Dict, Any, List, Optional
import logging
from backend.app.core.database import (
    COLLECTION_INSTITUTIONS,
    COLLECTION_STUDENT_PROFILES,
    COLLECTION_STUDENT_SKILL_SCORES,
    COLLECTION_SKILLS,
    COLLECTION_OPPORTUNITIES,
    COLLECTION_OPPORTUNITY_SKILLS,
    COLLECTION_APPLICATIONS,
    COLLECTION_USERS,
)

logger = logging.getLogger("skillsetu.institution")


def get_institution_by_id(db, institution_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves institution entity by ID, or None if not found."""
    return db[COLLECTION_INSTITUTIONS].find_one({"_id": institution_id})


def get_student_skill_supply(db, institution_id: str) -> Dict[str, Any]:
    """
    Calculates student skill supply for an institution based on authoritative assessed scores.
    
    Proficiency Tiers:
    - Strong: 80 - 100
    - Developing: 60 - 79
    - Needs Improvement: < 60
    """
    institution = get_institution_by_id(db, institution_id)
    if not institution:
        return None

    # Fetch students enrolled in this institution
    students = list(db[COLLECTION_STUDENT_PROFILES].find({"institutionId": institution_id}))
    student_ids = [s["_id"] for s in students]
    total_students = len(students)

    # Fetch all skills taxonomy
    skills = list(db[COLLECTION_SKILLS].find({}))
    skills_map = {s["_id"]: s for s in skills}

    # Fetch all assessed scores for these students
    scores = list(db[COLLECTION_STUDENT_SKILL_SCORES].find({
        "studentId": {"$in": student_ids},
        "assessed": True
    }))

    # Also check embedded skills in profiles to ensure complete cohort capture if scores collection is being synchronized
    scores_by_skill: Dict[str, List[float]] = {s["_id"]: [] for s in skills}
    students_with_assessment = set()

    for sc in scores:
        sk_id = sc.get("skillId")
        if sk_id in scores_by_skill:
            prof = float(sc.get("proficiency", 0.0))
            scores_by_skill[sk_id].append(prof)
            students_with_assessment.add(sc.get("studentId"))

    # Fallback/merge for student embedded profiles if score was only in embedded profile
    for st in students:
        s_id = st["_id"]
        for sk in st.get("skills", []):
            if sk.get("assessed") and sk.get("skillId") in scores_by_skill:
                # If student not in collection scores for this skill
                sk_id = sk["skillId"]
                if s_id not in [sc.get("studentId") for sc in scores if sc.get("skillId") == sk_id]:
                    scores_by_skill[sk_id].append(float(sk.get("proficiency", 0.0)))
                    students_with_assessment.add(s_id)

    skill_supply_items = []
    total_prof_sum = 0.0
    total_assessed_data_points = 0

    for sk_id, s_info in skills_map.items():
        prof_list = scores_by_skill.get(sk_id, [])
        count = len(prof_list)
        if count > 0:
            avg_prof = round(sum(prof_list) / count, 1)
            strong = sum(1 for p in prof_list if p >= 80.0)
            developing = sum(1 for p in prof_list if 60.0 <= p < 80.0)
            needs_improvement = sum(1 for p in prof_list if p < 60.0)
            total_prof_sum += sum(prof_list)
            total_assessed_data_points += count
        else:
            avg_prof = 0.0
            strong = 0
            developing = 0
            needs_improvement = 0

        skill_supply_items.append({
            "skillId": sk_id,
            "skillName": s_info.get("name", sk_id),
            "category": s_info.get("category", "TECHNICAL"),
            "description": s_info.get("description", ""),
            "assessedStudentCount": count,
            "averageProficiency": avg_prof,
            "strongCount": strong,
            "developingCount": developing,
            "needsImprovementCount": needs_improvement,
            "strongPercentage": round((strong / count) * 100, 1) if count > 0 else 0.0,
            "developingPercentage": round((developing / count) * 100, 1) if count > 0 else 0.0,
            "needsImprovementPercentage": round((needs_improvement / count) * 100, 1) if count > 0 else 0.0,
        })

    # Sort by assessed student count descending, then average proficiency descending
    skill_supply_items.sort(key=lambda x: (x["assessedStudentCount"], x["averageProficiency"]), reverse=True)

    overall_cohort_avg = (
        round(total_prof_sum / total_assessed_data_points, 1)
        if total_assessed_data_points > 0
        else 0.0
    )

    return {
        "institutionId": institution_id,
        "institutionName": institution.get("name"),
        "totalStudents": total_students,
        "assessedStudentsCount": len(students_with_assessment),
        "unassessedStudentsCount": total_students - len(students_with_assessment),
        "overallCohortAverageProficiency": overall_cohort_avg,
        "skills": skill_supply_items,
    }


def get_industry_skill_demand(db) -> Dict[str, Any]:
    """
    Calculates industry skill demand across currently OPEN opportunities.
    
    Demand Metrics:
    - Opportunity Count (distinct open roles requiring the skill)
    - Total Requirement Count
    - Average Required Proficiency (minProficiency baseline)
    - Mandatory Requirement Count
    - Optional Requirement Count
    - Deterministic Demand Intensity Score:
      demandIntensity = (opportunityCount * 25) + (mandatoryCount * 15) + (averageRequiredProficiency * 0.2)
    """
    # Fetch all OPEN opportunities
    open_opps = list(db[COLLECTION_OPPORTUNITIES].find({"status": "OPEN"}))
    open_opp_ids = [o["_id"] for o in open_opps]
    total_open_opportunities = len(open_opps)

    # Fetch all skills taxonomy
    skills = list(db[COLLECTION_SKILLS].find({}))
    skills_map = {s["_id"]: s for s in skills}

    # Fetch opportunity skills for open opportunities
    opp_skills = list(db[COLLECTION_OPPORTUNITY_SKILLS].find({
        "opportunityId": {"$in": open_opp_ids}
    }))

    # Group requirements by skill
    demand_by_skill: Dict[str, List[Dict[str, Any]]] = {s["_id"]: [] for s in skills}
    opps_by_skill: Dict[str, set] = {s["_id"]: set() for s in skills}

    for os_item in opp_skills:
        sk_id = os_item.get("skillId")
        if sk_id in demand_by_skill:
            demand_by_skill[sk_id].append(os_item)
            opps_by_skill[sk_id].add(os_item.get("opportunityId"))

    skill_demand_items = []

    for sk_id, s_info in skills_map.items():
        reqs = demand_by_skill.get(sk_id, [])
        opp_set = opps_by_skill.get(sk_id, set())
        opp_count = len(opp_set)
        req_count = len(reqs)

        if req_count > 0:
            min_profs = [float(r.get("minProficiency", 0)) for r in reqs]
            avg_req_prof = round(sum(min_profs) / req_count, 1)
            mand_count = sum(1 for r in reqs if r.get("mandatory", True) is True)
            opt_count = req_count - mand_count
            avg_weight = round(sum(r.get("weight", 2) for r in reqs) / req_count, 1)
            # Deterministic demand intensity formula
            intensity_score = round(
                (opp_count * 25.0) + (mand_count * 15.0) + (avg_req_prof * 0.2),
                1
            )
        else:
            avg_req_prof = 0.0
            mand_count = 0
            opt_count = 0
            avg_weight = 0.0
            intensity_score = 0.0

        skill_demand_items.append({
            "skillId": sk_id,
            "skillName": s_info.get("name", sk_id),
            "category": s_info.get("category", "TECHNICAL"),
            "description": s_info.get("description", ""),
            "taxonomyDemandScore": s_info.get("industryDemandScore", 80),
            "openOpportunityCount": opp_count,
            "requirementCount": req_count,
            "averageRequiredProficiency": avg_req_prof,
            "mandatoryCount": mand_count,
            "optionalCount": opt_count,
            "averageWeight": avg_weight,
            "demandIntensityScore": intensity_score,
        })

    # Sort descending by demand intensity score, then open opportunity count
    skill_demand_items.sort(key=lambda x: (x["demandIntensityScore"], x["openOpportunityCount"]), reverse=True)

    # Assign deterministic ranks
    for rank_idx, item in enumerate(skill_demand_items, start=1):
        item["demandRank"] = rank_idx

    return {
        "totalOpenOpportunities": total_open_opportunities,
        "totalRequirements": len(opp_skills),
        "skills": skill_demand_items,
    }


def get_skill_gaps_intelligence(db, institution_id: str) -> Dict[str, Any]:
    """
    Computes deterministic Supply vs. Demand Matrix and Skill Gap Classifications.
    
    Formula:
    - gap = averageRequiredProficiency - studentAverageProficiency
    
    Deterministic Classification Thresholds:
    1. Skill Shortage:
       When open industry demand exists (opportunityCount > 0) and gap > 5.0
    2. Balanced:
       When open industry demand exists (opportunityCount > 0) and -5.0 <= gap <= 5.0
    3. Skill Surplus:
       When gap < -5.0 (student capability comfortably exceeds industry requirement),
       OR when students possess active assessed supply (studentCount > 0) but open industry demand is 0.
    4. No Active Data:
       When both student supply and industry demand are 0.
       
    Deterministic Priority Ranking:
    - Priority Score = (gap * 2.0) + (opportunityCount * 12.0) + (mandatoryCount * 8.0) [for shortages]
    - Ranks shortages first, ordered by highest priority score and deficit.
    """
    institution = get_institution_by_id(db, institution_id)
    if not institution:
        return None

    supply_data = get_student_skill_supply(db, institution_id)
    demand_data = get_industry_skill_demand(db)

    supply_map = {s["skillId"]: s for s in supply_data["skills"]}
    demand_map = {s["skillId"]: s for s in demand_data["skills"]}

    skills = list(db[COLLECTION_SKILLS].find({}))
    comparison_items = []

    for sk in skills:
        sk_id = sk["_id"]
        sup = supply_map.get(sk_id, {})
        dem = demand_map.get(sk_id, {})

        std_avg = sup.get("averageProficiency", 0.0)
        std_count = sup.get("assessedStudentCount", 0)
        strong_count = sup.get("strongCount", 0)
        dev_count = sup.get("developingCount", 0)
        ni_count = sup.get("needsImprovementCount", 0)

        req_avg = dem.get("averageRequiredProficiency", 0.0)
        opp_count = dem.get("openOpportunityCount", 0)
        mand_count = dem.get("mandatoryCount", 0)
        opt_count = dem.get("optionalCount", 0)
        intensity_score = dem.get("demandIntensityScore", 0.0)

        # Gap calculation: positive means industry expects more than students currently possess
        if opp_count > 0:
            gap = round(req_avg - std_avg, 1)
            if gap > 5.0:
                classification = "Skill Shortage"
                urgency = "High" if (mand_count > 0 or gap >= 15.0) else "Medium"
                priority_score = round((gap * 2.0) + (opp_count * 12.0) + (mand_count * 8.0), 1)
            elif gap >= -5.0:
                classification = "Balanced"
                urgency = "Low"
                priority_score = round(15.0 + (opp_count * 3.0), 1)
            else:
                classification = "Skill Surplus"
                urgency = "None"
                priority_score = 5.0
        else:
            gap = round(0.0 - std_avg, 1)
            if std_count > 0:
                classification = "Skill Surplus"
                urgency = "None"
                priority_score = 1.0
            else:
                classification = "No Active Data"
                urgency = "None"
                priority_score = 0.0

        # Deterministic explanation templates
        if classification == "Skill Shortage":
            if mand_count > 0 and gap >= 15.0:
                explanation = (
                    f"High-urgency mandatory industry requirement across {opp_count} opportunities with critical student proficiency deficit (+{gap:.1f} pts)."
                )
                recommendation = (
                    f"Mandate intensive practical workshops and industry-partnered bootcamps in {sk.get('name')} to bridge the +{gap:.1f} pt gap."
                )
            elif mand_count > 0:
                explanation = (
                    f"Mandatory prerequisite across {opp_count} open opportunities exceeds student cohort average by {gap:.1f} pts."
                )
                recommendation = (
                    f"Integrate applied problem-solving modules for {sk.get('name')} into core semester coursework."
                )
            else:
                explanation = (
                    f"Industry required baseline ({req_avg:.1f}) outpaces student average proficiency ({std_avg:.1f}) by {gap:.1f} pts across {opp_count} roles."
                )
                recommendation = (
                    f"Offer targeted elective upskilling and faculty-led clinical tutorials in {sk.get('name')}."
                )
        elif classification == "Balanced":
            explanation = (
                f"Student cohort average ({std_avg:.1f}) is well-aligned with industry requirements ({req_avg:.1f}) across {opp_count} opportunities (delta: {gap:+.1f} pts)."
            )
            recommendation = (
                f"Maintain current curriculum standards while encouraging advanced capstone projects in {sk.get('name')}."
            )
        elif classification == "Skill Surplus":
            if opp_count > 0:
                explanation = (
                    f"Student cohort proficiency ({std_avg:.1f}) exceeds industry baseline ({req_avg:.1f}) by {abs(gap):.1f} pts across {opp_count} opportunities."
                )
                recommendation = (
                    f"Position students as competitive candidates for high-complexity research roles and cross-disciplinary collaborations."
                )
            else:
                explanation = (
                    f"Strong internal student proficiency ({std_avg:.1f} across {std_count} students) with no active local vacancy postings."
                )
                recommendation = (
                    f"Engage proactive industry outreach to discover specialized projects matching this strong cohort competency."
                )
        else:
            explanation = "No active student assessments or open industry requirements recorded."
            recommendation = "Establish benchmark assessments and monitor emerging industry hiring trends."

        comparison_items.append({
            "skillId": sk_id,
            "skillName": sk.get("name", sk_id),
            "category": sk.get("category", "TECHNICAL"),
            "studentAverageProficiency": std_avg,
            "industryRequiredAverage": req_avg,
            "studentCount": std_count,
            "strongCount": strong_count,
            "developingCount": dev_count,
            "needsImprovementCount": ni_count,
            "opportunityCount": opp_count,
            "mandatoryCount": mand_count,
            "optionalCount": opt_count,
            "demandIntensityScore": intensity_score,
            "gap": gap,
            "status": classification,
            "urgency": urgency,
            "priorityScore": priority_score,
            "explanation": explanation,
            "recommendation": recommendation,
        })

    # Sort priorities: Shortages first, then by priority score descending, then gap descending
    status_order = {"Skill Shortage": 0, "Balanced": 1, "Skill Surplus": 2, "No Active Data": 3}
    comparison_items.sort(
        key=lambda x: (
            status_order.get(x["status"], 99),
            -x["priorityScore"],
            -x["gap"]
        )
    )

    # Top Priority Gaps (Shortages only)
    top_gaps = [item for item in comparison_items if item["status"] == "Skill Shortage"]

    shortage_count = sum(1 for i in comparison_items if i["status"] == "Skill Shortage")
    balanced_count = sum(1 for i in comparison_items if i["status"] == "Skill Balanced" or i["status"] == "Balanced")
    surplus_count = sum(1 for i in comparison_items if i["status"] == "Skill Surplus")

    return {
        "institutionId": institution_id,
        "institutionName": institution.get("name"),
        "totalSkillsAnalyzed": len(comparison_items),
        "shortageCount": shortage_count,
        "balancedCount": balanced_count,
        "surplusCount": surplus_count,
        "topSkillGaps": top_gaps[:5],
        "allSkillGaps": comparison_items,
    }


def get_student_readiness_intelligence(db, institution_id: str) -> Dict[str, Any]:
    """
    Computes student opportunity readiness for all students in an academic institution.
    
    Deterministic Readiness Classification:
    - Ready:
      overallSkillQuotient >= 75.0 AND strongCount >= 2
      (Demonstrates solid multi-domain capability and established proficiencies)
    - Developing:
      overallSkillQuotient >= 60.0 AND not meeting 'Ready' threshold
      (Demonstrates foundational competency with actionable headroom for growth)
    - Needs Improvement:
      overallSkillQuotient < 60.0 AND assessedSkillsCount > 0
      (Demonstrates elementary scores requiring targeted instructional intervention)
    - Pending Assessment:
      assessedSkillsCount == 0
      (Student has enrolled profile but no benchmark assessments completed)
    """
    institution = get_institution_by_id(db, institution_id)
    if not institution:
        return None

    students = list(db[COLLECTION_STUDENT_PROFILES].find({"institutionId": institution_id}))
    user_ids = [s.get("userId") for s in students if s.get("userId")]
    users_map = {u["_id"]: u for u in db[COLLECTION_USERS].find({"_id": {"$in": user_ids}})}

    # Fetch all assessed skill scores
    student_ids = [s["_id"] for s in students]
    scores = list(db[COLLECTION_STUDENT_SKILL_SCORES].find({
        "studentId": {"$in": student_ids},
        "assessed": True
    }))

    scores_by_student: Dict[str, List[Dict[str, Any]]] = {s["_id"]: [] for s in students}
    for sc in scores:
        s_id = sc.get("studentId")
        if s_id in scores_by_student:
            scores_by_student[s_id].append(sc)

    # Fallback to embedded skills in profile if needed
    for st in students:
        s_id = st["_id"]
        existing_skill_ids = {sc.get("skillId") for sc in scores_by_student[s_id]}
        for sk in st.get("skills", []):
            if sk.get("assessed") and sk.get("skillId") not in existing_skill_ids:
                scores_by_student[s_id].append({
                    "skillId": sk.get("skillId"),
                    "proficiency": sk.get("proficiency", 0.0),
                    "assessed": True,
                    "lastAssessed": sk.get("lastAssessed", "2026-02-15")
                })

    student_readiness_list = []
    ready_count = 0
    developing_count = 0
    needs_improvement_count = 0
    pending_count = 0

    for st in students:
        s_id = st["_id"]
        user = users_map.get(st.get("userId"), {})
        student_scores = scores_by_student.get(s_id, [])
        assessed_count = len(student_scores)

        if assessed_count > 0:
            profs = [float(s.get("proficiency", 0.0)) for s in student_scores]
            overall_quotient = round(sum(profs) / assessed_count, 1)
            strong_c = sum(1 for p in profs if p >= 80.0)
            dev_c = sum(1 for p in profs if 60.0 <= p < 80.0)
            ni_c = sum(1 for p in profs if p < 60.0)

            if overall_quotient >= 75.0 and strong_c >= 2:
                readiness_status = "Ready"
                readiness_tier = "OPPORTUNITY_READY"
                ready_count += 1
                explanation = f"High overall skill quotient ({overall_quotient:.1f}) with {strong_c} strong competencies (>= 80)."
            elif overall_quotient >= 60.0:
                readiness_status = "Developing"
                readiness_tier = "DEVELOPING"
                developing_count += 1
                explanation = f"Solid foundational quotient ({overall_quotient:.1f}) with {dev_c} developing and {strong_c} strong skills."
            else:
                readiness_status = "Needs Improvement"
                readiness_tier = "NEEDS_IMPROVEMENT"
                needs_improvement_count += 1
                explanation = f"Foundational skill quotient ({overall_quotient:.1f}); requires targeted support in {ni_c} skills."
        else:
            overall_quotient = 0.0
            strong_c = 0
            dev_c = 0
            ni_c = 0
            readiness_status = "Pending Assessment"
            readiness_tier = "PENDING"
            pending_count += 1
            explanation = "No diagnostic assessments completed yet."

        student_readiness_list.append({
            "studentId": s_id,
            "userId": st.get("userId"),
            "name": user.get("name", "Unknown Scholar"),
            "email": user.get("email", ""),
            "avatar": user.get("avatar", f"https://api.dicebear.com/7.x/avataaars/svg?seed={s_id}"),
            "department": st.get("department", "General Studies"),
            "course": st.get("course", "Ayurvedic Medical Sciences"),
            "batch": st.get("batch", "2023-2026"),
            "cgpa": st.get("cgpa", 0.0),
            "overallSkillQuotient": overall_quotient,
            "assessedSkillsCount": assessed_count,
            "strongCount": strong_c,
            "developingCount": dev_c,
            "needsImprovementCount": ni_c,
            "readinessStatus": readiness_status,
            "readinessTier": readiness_tier,
            "readinessExplanation": explanation,
        })

    # Sort students by overallSkillQuotient descending, then cgpa descending
    student_readiness_list.sort(key=lambda x: (x["overallSkillQuotient"], x["cgpa"]), reverse=True)

    total_students = len(students)
    total_assessed = total_students - pending_count
    opportunity_readiness_index = (
        round((ready_count / total_assessed) * 100, 1)
        if total_assessed > 0
        else 0.0
    )

    return {
        "institutionId": institution_id,
        "institutionName": institution.get("name"),
        "totalStudents": total_students,
        "assessedStudentsCount": total_assessed,
        "pendingAssessmentCount": pending_count,
        "readyCount": ready_count,
        "developingCount": developing_count,
        "needsImprovementCount": needs_improvement_count,
        "opportunityReadinessIndex": opportunity_readiness_index,
        "distribution": {
            "ready": {
                "count": ready_count,
                "percentage": round((ready_count / total_students) * 100, 1) if total_students > 0 else 0.0,
                "assessedPercentage": round((ready_count / total_assessed) * 100, 1) if total_assessed > 0 else 0.0,
            },
            "developing": {
                "count": developing_count,
                "percentage": round((developing_count / total_students) * 100, 1) if total_students > 0 else 0.0,
                "assessedPercentage": round((developing_count / total_assessed) * 100, 1) if total_assessed > 0 else 0.0,
            },
            "needsImprovement": {
                "count": needs_improvement_count,
                "percentage": round((needs_improvement_count / total_students) * 100, 1) if total_students > 0 else 0.0,
                "assessedPercentage": round((needs_improvement_count / total_assessed) * 100, 1) if total_assessed > 0 else 0.0,
            },
            "pendingAssessment": {
                "count": pending_count,
                "percentage": round((pending_count / total_students) * 100, 1) if total_students > 0 else 0.0,
                "assessedPercentage": 0.0,
            }
        },
        "students": student_readiness_list,
    }


def get_institution_dashboard(db, institution_id: str) -> Dict[str, Any]:
    """
    Consolidates macro KPIs and analytical summaries for the Institution Portal.
    """
    institution = get_institution_by_id(db, institution_id)
    if not institution:
        return None

    # Student profiles for this institution
    students = list(db[COLLECTION_STUDENT_PROFILES].find({"institutionId": institution_id}))
    student_ids = [s["_id"] for s in students]
    total_students = len(students)

    # Supply & Readiness
    readiness_data = get_student_readiness_intelligence(db, institution_id)
    gaps_data = get_skill_gaps_intelligence(db, institution_id)

    # Calculate average cohort skill quotient from assessed students
    assessed_quotients = [
        s["overallSkillQuotient"]
        for s in readiness_data["students"]
        if s["assessedSkillsCount"] > 0
    ]
    avg_skill_quotient = (
        round(sum(assessed_quotients) / len(assessed_quotients), 1)
        if assessed_quotients
        else 0.0
    )

    # Industry open opportunities
    open_opps_count = db[COLLECTION_OPPORTUNITIES].count_documents({"status": "OPEN"})

    # Applications from this institution's students
    applications = list(db[COLLECTION_APPLICATIONS].find({"studentId": {"$in": student_ids}}))
    total_applications = len(applications)

    applied_count = sum(1 for a in applications if a.get("status") == "APPLIED")
    under_review_count = sum(1 for a in applications if a.get("status") == "UNDER_REVIEW")
    shortlisted_count = sum(1 for a in applications if a.get("status") == "SHORTLISTED")
    rejected_count = sum(1 for a in applications if a.get("status") == "REJECTED")
    withdrawn_count = sum(1 for a in applications if a.get("status") == "WITHDRAWN")

    # Fetch opportunity titles for application preview
    opp_ids = list({a.get("opportunityId") for a in applications})
    opps_map = {o["_id"]: o for o in db[COLLECTION_OPPORTUNITIES].find({"_id": {"$in": opp_ids}})}
    users_by_std_id = {s["_id"]: s.get("userId") for s in students}
    users_map = {u["_id"]: u for u in db[COLLECTION_USERS].find({"_id": {"$in": list(users_by_std_id.values())}})}

    enriched_recent_apps = []
    for app_item in sorted(applications, key=lambda a: a.get("appliedAt", ""), reverse=True)[:5]:
        s_id = app_item.get("studentId")
        u_id = users_by_std_id.get(s_id)
        user_info = users_map.get(u_id, {})
        opp_info = opps_map.get(app_item.get("opportunityId"), {})
        enriched_recent_apps.append({
            "applicationId": app_item["_id"],
            "studentId": s_id,
            "studentName": user_info.get("name", "Student Scholar"),
            "opportunityId": app_item.get("opportunityId"),
            "opportunityTitle": opp_info.get("title", "Industry Opportunity"),
            "status": app_item.get("status"),
            "matchScoreSnapshot": app_item.get("matchScoreSnapshot") or app_item.get("matchScore", 0.0),
            "appliedAt": app_item.get("appliedAt", ""),
        })

    return {
        "institution": {
            "id": institution["_id"],
            "name": institution.get("name"),
            "type": institution.get("type"),
            "location": institution.get("location"),
            "departments": institution.get("departments", []),
        },
        "kpis": {
            "totalStudents": total_students,
            "assessedStudentsCount": readiness_data["assessedStudentsCount"],
            "averageSkillQuotient": avg_skill_quotient,
            "openOpportunities": open_opps_count,
            "totalApplications": total_applications,
            "shortlistedApplications": shortlisted_count,
            "underReviewApplications": under_review_count,
            "appliedApplications": applied_count,
            "rejectedApplications": rejected_count,
            "withdrawnApplications": withdrawn_count,
            "opportunityReadinessIndex": readiness_data["opportunityReadinessIndex"],
            "topSkillGapsCount": gaps_data["shortageCount"],
        },
        "readinessSummary": {
            "readyCount": readiness_data["readyCount"],
            "developingCount": readiness_data["developingCount"],
            "needsImprovementCount": readiness_data["needsImprovementCount"],
            "pendingAssessmentCount": readiness_data["pendingAssessmentCount"],
            "opportunityReadinessIndex": readiness_data["opportunityReadinessIndex"],
            "distribution": readiness_data["distribution"],
        },
        "gapSummary": {
            "shortageCount": gaps_data["shortageCount"],
            "balancedCount": gaps_data["balancedCount"],
            "surplusCount": gaps_data["surplusCount"],
            "topSkillGaps": gaps_data["topSkillGaps"],
        },
        "recentApplications": enriched_recent_apps,
    }


def get_institution_student_detail(db, institution_id: str, student_id: str) -> Optional[Dict[str, Any]]:
    """
    Returns a read-only detailed analytical record of a student for institution mentors/admins.
    Guarantees tenant isolation: verifies student belongs to the specified institution.
    """
    institution = get_institution_by_id(db, institution_id)
    if not institution:
        return None

    profile = db[COLLECTION_STUDENT_PROFILES].find_one({"_id": student_id, "institutionId": institution_id})
    if not profile:
        return None

    user = db[COLLECTION_USERS].find_one({"_id": profile.get("userId")}) or {}
    skills_map = {s["_id"]: s for s in db[COLLECTION_SKILLS].find({})}

    # Assessed scores
    scores = list(db[COLLECTION_STUDENT_SKILL_SCORES].find({
        "studentId": student_id,
        "assessed": True
    }))
    scores_by_skill = {sc["skillId"]: sc for sc in scores}

    # Harmonize with profile skills
    assessed_skills = []
    seen_skills = set()

    for sk_item in profile.get("skills", []):
        sk_id = sk_item.get("skillId")
        seen_skills.add(sk_id)
        sk_def = skills_map.get(sk_id, {})
        auth = scores_by_skill.get(sk_id)
        prof = float(auth["proficiency"] if auth else sk_item.get("proficiency", 0.0))

        if prof >= 80.0:
            tier = "Strong"
        elif prof >= 60.0:
            tier = "Developing"
        else:
            tier = "Needs Improvement"

        assessed_skills.append({
            "skillId": sk_id,
            "skillName": sk_def.get("name", sk_id),
            "category": sk_def.get("category", "TECHNICAL"),
            "proficiency": prof,
            "proficiencyTier": tier,
            "lastAssessed": auth.get("lastAssessed") if auth else sk_item.get("lastAssessed", "2026-02-15"),
        })

    for sk_id, auth in scores_by_skill.items():
        if sk_id not in seen_skills:
            sk_def = skills_map.get(sk_id, {})
            prof = float(auth.get("proficiency", 0.0))
            if prof >= 80.0:
                tier = "Strong"
            elif prof >= 60.0:
                tier = "Developing"
            else:
                tier = "Needs Improvement"

            assessed_skills.append({
                "skillId": sk_id,
                "skillName": sk_def.get("name", sk_id),
                "category": sk_def.get("category", "TECHNICAL"),
                "proficiency": prof,
                "proficiencyTier": tier,
                "lastAssessed": auth.get("lastAssessed", "2026-02-15"),
            })

    # Sort skills by proficiency descending
    assessed_skills.sort(key=lambda s: s["proficiency"], reverse=True)

    assessed_count = len(assessed_skills)
    if assessed_count > 0:
        profs = [s["proficiency"] for s in assessed_skills]
        overall_quotient = round(sum(profs) / assessed_count, 1)
        strong_c = sum(1 for s in assessed_skills if s["proficiencyTier"] == "Strong")
        dev_c = sum(1 for s in assessed_skills if s["proficiencyTier"] == "Developing")
        ni_c = sum(1 for s in assessed_skills if s["proficiencyTier"] == "Needs Improvement")

        if overall_quotient >= 75.0 and strong_c >= 2:
            readiness_status = "Ready"
        elif overall_quotient >= 60.0:
            readiness_status = "Developing"
        else:
            readiness_status = "Needs Improvement"
    else:
        overall_quotient = 0.0
        strong_c = 0
        dev_c = 0
        ni_c = 0
        readiness_status = "Pending Assessment"

    # Applications submitted by this student
    applications = list(db[COLLECTION_APPLICATIONS].find({"studentId": student_id}))
    opp_ids = [a["opportunityId"] for a in applications]
    opps_map = {o["_id"]: o for o in db[COLLECTION_OPPORTUNITIES].find({"_id": {"$in": opp_ids}})}

    enriched_applications = []
    for a in applications:
        opp = opps_map.get(a.get("opportunityId"), {})
        enriched_applications.append({
            "applicationId": a["_id"],
            "opportunityId": a.get("opportunityId"),
            "opportunityTitle": opp.get("title", "Industry Role"),
            "location": opp.get("location", ""),
            "status": a.get("status"),
            "matchScoreSnapshot": a.get("matchScoreSnapshot") or a.get("matchScore"),
            "eligibilitySnapshot": a.get("eligibilitySnapshot"),
            "appliedAt": a.get("appliedAt"),
        })

    return {
        "studentId": student_id,
        "userId": profile.get("userId"),
        "name": user.get("name", "Student Scholar"),
        "email": user.get("email", ""),
        "avatar": user.get("avatar"),
        "institutionId": institution_id,
        "institutionName": institution.get("name"),
        "department": profile.get("department"),
        "course": profile.get("course"),
        "batch": profile.get("batch"),
        "cgpa": profile.get("cgpa", 0.0),
        "bio": profile.get("bio", ""),
        "overallSkillQuotient": overall_quotient,
        "readinessStatus": readiness_status,
        "strongCount": strong_c,
        "developingCount": dev_c,
        "needsImprovementCount": ni_c,
        "assessedSkills": assessed_skills,
        "certifications": profile.get("certifications", []),
        "projects": profile.get("projects", []),
        "internships": profile.get("internships", []),
        "achievements": profile.get("achievements", []),
        "applications": enriched_applications,
    }
