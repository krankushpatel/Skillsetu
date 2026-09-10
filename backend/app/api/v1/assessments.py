"""
SkillSetu - Standardized Assessment Engine API Router
Step 4: Standardized Assessment Engine & Skill Scoring

Provides deterministic, server-authoritative skill assessment endpoints:
- GET /api/assessments: List active standardized benchmarks
- GET /api/assessments/{assessment_id}: Fetch assessment questions WITHOUT answer keys
- POST /api/assessments/{assessment_id}/submit: Evaluate answers deterministically and update student skill scores
- GET /api/assessments/{assessment_id}/results/{student_id}: Fetch latest evaluated attempt
"""
from datetime import datetime, timezone
import uuid
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, status

from backend.app.core.database import (
    db_manager,
    COLLECTION_ASSESSMENTS,
    COLLECTION_ASSESSMENT_QUESTIONS,
    COLLECTION_STUDENT_PROFILES,
    COLLECTION_STUDENT_SKILL_SCORES,
    COLLECTION_SKILLS,
    COLLECTION_USERS,
    COLLECTION_ASSESSMENT_ATTEMPTS
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
    """Helper to find profile by either profile '_id' (e.g. sp_01) or 'userId' (e.g. usr_std_01)."""
    profile = db[COLLECTION_STUDENT_PROFILES].find_one({"_id": student_id})
    if not profile:
        profile = db[COLLECTION_STUDENT_PROFILES].find_one({"userId": student_id})
    return profile

# --------------------------------------------------------------------------
# Request & Response Schemas
# --------------------------------------------------------------------------
class AnswerItem(BaseModel):
    question_id: str = Field(..., description="Target question ID (e.g. q_py_01)")
    selected_option: Optional[int] = Field(None, ge=0, le=4, description="0-based option index")
    selected_answer: Optional[str] = Field(None, description="Direct option text string")

class AssessmentSubmitRequest(BaseModel):
    student_id: str = Field(..., description="Student Profile ID or User ID (e.g. sp_01)")
    assessment_id: Optional[str] = Field(None, description="Optional assessment ID (defaults to route param)")
    answers: List[AnswerItem] = Field(default_factory=list, description="Array of student selected answers")

# --------------------------------------------------------------------------
# Endpoints
# --------------------------------------------------------------------------
@router.get("", summary="List available standardized assessments")
def get_assessments() -> Dict[str, Any]:
    """
    Returns all active standardized skill assessment benchmarks.
    Includes target skills and metadata needed for candidate discovery.
    """
    db = _check_db()
    assessments_cursor = db[COLLECTION_ASSESSMENTS].find({"active": True})
    assessments = list(assessments_cursor)

    skills_map = {s["_id"]: s for s in db[COLLECTION_SKILLS].find({})}

    enriched = []
    for asm in assessments:
        target_skills = []
        for sk_id in asm.get("targetSkillIds", []):
            sk_info = skills_map.get(sk_id, {})
            # Count questions for this skill in this assessment
            q_count = db[COLLECTION_ASSESSMENT_QUESTIONS].count_documents({
                "assessmentId": asm["_id"],
                "skillId": sk_id
            })
            target_skills.append({
                "id": sk_id,
                "name": sk_info.get("name", sk_id),
                "category": sk_info.get("category", "TECHNICAL"),
                "questionCount": q_count
            })

        enriched.append({
            "id": asm["_id"],
            "title": asm.get("title", ""),
            "description": asm.get("description", ""),
            "targetSkillIds": asm.get("targetSkillIds", []),
            "targetSkills": target_skills,
            "durationMinutes": asm.get("durationMinutes", 30),
            "totalQuestions": asm.get("totalQuestions", 25),
            "difficulty": asm.get("difficulty", "INTERMEDIATE"),
            "active": asm.get("active", True),
            "createdAt": asm.get("createdAt", "")
        })

    return {
        "status": "success",
        "count": len(enriched),
        "data": enriched
    }

@router.get("/{assessment_id}", summary="Get assessment details and questions")
def get_assessment_by_id(assessment_id: str) -> Dict[str, Any]:
    """
    Fetches assessment metadata and all associated questions for test administration.
    CRITICAL SECURITY RULE:
    Correct answers and explanations are stripped before transmission to prevent client-side answer sniffing.
    """
    db = _check_db()
    assessment = db[COLLECTION_ASSESSMENTS].find_one({"_id": assessment_id})
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assessment '{assessment_id}' not found."
        )

    # Fetch questions sorted predictably
    raw_questions = list(db[COLLECTION_ASSESSMENT_QUESTIONS].find({"assessmentId": assessment_id}))
    if not raw_questions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No questions found for assessment '{assessment_id}'."
        )

    skills_map = {s["_id"]: s for s in db[COLLECTION_SKILLS].find({})}

    client_questions = []
    for idx, q in enumerate(raw_questions, start=1):
        sk_info = skills_map.get(q.get("skillId"), {})
        client_questions.append({
            "id": q["_id"],
            "order": idx,
            "question": q.get("question", ""),
            "options": q.get("options", []),
            "skillId": q.get("skillId", ""),
            "skillName": sk_info.get("name", q.get("skillId", "")),
            "difficulty": q.get("difficulty", "MEDIUM"),
            "skillWeight": q.get("skillWeight", 1)
        })

    target_skills = []
    for sk_id in assessment.get("targetSkillIds", []):
        sk_info = skills_map.get(sk_id, {})
        q_count = sum(1 for q in client_questions if q["skillId"] == sk_id)
        target_skills.append({
            "id": sk_id,
            "name": sk_info.get("name", sk_id),
            "category": sk_info.get("category", "TECHNICAL"),
            "questionCount": q_count
        })

    return {
        "status": "success",
        "data": {
            "id": assessment["_id"],
            "title": assessment.get("title", ""),
            "description": assessment.get("description", ""),
            "durationMinutes": assessment.get("durationMinutes", 30),
            "totalQuestions": len(client_questions),
            "difficulty": assessment.get("difficulty", "INTERMEDIATE"),
            "targetSkills": target_skills,
            "questions": client_questions
        }
    }

@router.post("/{assessment_id}/submit", summary="Submit and deterministically evaluate assessment")
def submit_assessment(assessment_id: str, payload: AssessmentSubmitRequest) -> Dict[str, Any]:
    """
    Evaluates candidate answers deterministically on the server side.
    - Compares answers strictly against authoritative database keys.
    - Calculates Skill Score: (earned_weights / total_weights) * 100 per skill.
    - Calculates Overall Assessment Score: average of skill scores.
    - Assigns performance tiers: Strong (80-100), Developing (60-79), Needs Improvement (<60).
    - Updates student_skill_scores and student profile skills.
    - Saves audit attempt record in assessment_attempts collection.
    """
    db = _check_db()

    # 1. Validate assessment exists
    assessment = db[COLLECTION_ASSESSMENTS].find_one({"_id": assessment_id})
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assessment '{assessment_id}' not found."
        )

    # 2. Validate student exists
    student_profile = _find_student_profile(db, payload.student_id)
    if not student_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student profile '{payload.student_id}' not found."
        )

    user_info = db[COLLECTION_USERS].find_one({"_id": student_profile.get("userId")}) or {}
    student_name = user_info.get("name", "Student")
    student_id = student_profile["_id"]

    # 3. Load authoritative questions
    authoritative_questions = list(db[COLLECTION_ASSESSMENT_QUESTIONS].find({"assessmentId": assessment_id}))
    if not authoritative_questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No questions seeded for assessment '{assessment_id}'."
        )

    q_map = {q["_id"]: q for q in authoritative_questions}
    skills_map = {s["_id"]: s for s in db[COLLECTION_SKILLS].find({})}

    # 4. Validate submitted answers
    seen_q_ids = set()
    answers_by_q_id: Dict[str, AnswerItem] = {}

    for ans in payload.answers:
        if ans.question_id in seen_q_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Duplicate answer entry detected for question '{ans.question_id}'."
            )
        seen_q_ids.add(ans.question_id)

        if ans.question_id not in q_map:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Question '{ans.question_id}' does not belong to assessment '{assessment_id}'."
            )

        # Validate selected option bounds if provided
        target_q = q_map[ans.question_id]
        if ans.selected_option is not None:
            if ans.selected_option < 0 or ans.selected_option >= len(target_q["options"]):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Option index {ans.selected_option} is out of bounds for question '{ans.question_id}'."
                )

        answers_by_q_id[ans.question_id] = ans

    # 5. Deterministic Evaluation Algorithm
    # Group questions by skillId
    skill_stats: Dict[str, Dict[str, Any]] = {}
    for sk_id in assessment.get("targetSkillIds", []):
        sk_info = skills_map.get(sk_id, {})
        skill_stats[sk_id] = {
            "skillId": sk_id,
            "skillName": sk_info.get("name", sk_id),
            "category": sk_info.get("category", "TECHNICAL"),
            "totalQuestions": 0,
            "correctCount": 0,
            "earnedWeight": 0,
            "totalWeight": 0
        }

    total_correct = 0
    total_incorrect = 0
    detailed_evaluations = []

    for q in authoritative_questions:
        sk_id = q.get("skillId")
        if sk_id not in skill_stats:
            sk_info = skills_map.get(sk_id, {})
            skill_stats[sk_id] = {
                "skillId": sk_id,
                "skillName": sk_info.get("name", sk_id),
                "category": sk_info.get("category", "TECHNICAL"),
                "totalQuestions": 0,
                "correctCount": 0,
                "earnedWeight": 0,
                "totalWeight": 0
            }

        weight = q.get("skillWeight", 1)
        skill_stats[sk_id]["totalQuestions"] += 1
        skill_stats[sk_id]["totalWeight"] += weight

        user_ans = answers_by_q_id.get(q["_id"])
        selected_text = None

        if user_ans:
            if user_ans.selected_option is not None and user_ans.selected_option < len(q["options"]):
                selected_text = q["options"][user_ans.selected_option]
            elif user_ans.selected_answer is not None:
                selected_text = user_ans.selected_answer.strip()

        is_correct = (selected_text is not None and selected_text == q.get("correctAnswer"))

        if is_correct:
            total_correct += 1
            skill_stats[sk_id]["correctCount"] += 1
            skill_stats[sk_id]["earnedWeight"] += weight
        else:
            total_incorrect += 1

        detailed_evaluations.append({
            "questionId": q["_id"],
            "skillId": sk_id,
            "isCorrect": is_correct,
            "weight": weight,
            "earnedWeight": weight if is_correct else 0,
            "selectedText": selected_text,
            "explanation": q.get("explanation", "")
        })

    # 6. Calculate Skill Scores and Tiers
    skill_scores: List[Dict[str, Any]] = []
    for sk_id, stats in skill_stats.items():
        tot_w = stats["totalWeight"]
        earned_w = stats["earnedWeight"]
        
        # Deterministic formula: (earned_weight / total_weight) * 100
        score = round((earned_w / tot_w) * 100.0, 1) if tot_w > 0 else 0.0
        score = max(0.0, min(100.0, score))

        if score >= 80.0:
            tier = "Strong"
        elif score >= 60.0:
            tier = "Developing"
        else:
            tier = "Needs Improvement"

        skill_scores.append({
            "skillId": sk_id,
            "skillName": stats["skillName"],
            "category": stats["category"],
            "score": score,
            "performanceTier": tier,
            "correctCount": stats["correctCount"],
            "totalQuestions": stats["totalQuestions"],
            "earnedWeight": earned_w,
            "totalWeight": tot_w
        })

    # 7. Calculate Overall Score
    if skill_scores:
        overall_score = round(sum(s["score"] for s in skill_scores) / len(skill_scores), 1)
    else:
        overall_score = 0.0

    if overall_score >= 80.0:
        overall_tier = "Strong"
    elif overall_score >= 60.0:
        overall_tier = "Developing"
    else:
        overall_tier = "Needs Improvement"

    now_iso = datetime.now(timezone.utc).isoformat()
    today_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    attempt_id = f"att_{uuid.uuid4().hex[:12]}"

    # 8. Update database: student_skill_scores (authoritative collection)
    for s_item in skill_scores:
        sk_id = s_item["skillId"]
        prof_val = int(round(s_item["score"]))
        score_doc = {
            "_id": f"sss_{student_id}_{sk_id}",
            "studentId": student_id,
            "skillId": sk_id,
            "proficiency": prof_val,
            "assessed": True,
            "assessmentId": assessment_id,
            "lastAssessed": today_date,
            "source": "ASSESSMENT"
        }
        db[COLLECTION_STUDENT_SKILL_SCORES].replace_one(
            {"_id": score_doc["_id"]},
            score_doc,
            upsert=True
        )

    # 9. Update student profile embedded skills for fast retrieval in profile & skills views
    profile_skills = student_profile.get("skills", [])
    skills_dict = {s["skillId"]: s for s in profile_skills}
    for s_item in skill_scores:
        sk_id = s_item["skillId"]
        prof_val = int(round(s_item["score"]))
        if sk_id in skills_dict:
            skills_dict[sk_id]["proficiency"] = prof_val
            skills_dict[sk_id]["assessed"] = True
            skills_dict[sk_id]["lastAssessed"] = today_date
        else:
            skills_dict[sk_id] = {
                "skillId": sk_id,
                "proficiency": prof_val,
                "assessed": True,
                "lastAssessed": today_date
            }

    db[COLLECTION_STUDENT_PROFILES].update_one(
        {"_id": student_profile["_id"]},
        {
            "$set": {
                "skills": list(skills_dict.values()),
                "updatedAt": now_iso
            }
        }
    )

    # 10. Record attempt audit log
    answered_count = len(payload.answers)
    attempt_record = {
        "_id": attempt_id,
        "studentId": student_id,
        "studentName": student_name,
        "assessmentId": assessment_id,
        "assessmentTitle": assessment.get("title", ""),
        "overallScore": overall_score,
        "performanceTier": overall_tier,
        "totalQuestions": len(authoritative_questions),
        "totalCorrect": total_correct,
        "totalIncorrect": total_incorrect,
        "answeredCount": answered_count,
        "unansweredCount": len(authoritative_questions) - answered_count,
        "skillScores": skill_scores,
        "submittedAt": now_iso,
        "evaluations": detailed_evaluations
    }
    db[COLLECTION_ASSESSMENT_ATTEMPTS].replace_one(
        {"_id": attempt_id},
        attempt_record,
        upsert=True
    )

    return {
        "status": "success",
        "data": {
            "attemptId": attempt_id,
            "assessmentId": assessment_id,
            "assessmentTitle": assessment.get("title", ""),
            "studentId": student_id,
            "studentName": student_name,
            "overallScore": overall_score,
            "performanceTier": overall_tier,
            "totalQuestions": len(authoritative_questions),
            "totalCorrect": total_correct,
            "totalIncorrect": total_incorrect,
            "answeredCount": answered_count,
            "unansweredCount": len(authoritative_questions) - answered_count,
            "submittedAt": now_iso,
            "skillScores": skill_scores,
            "scoringExplanation": (
                "Deterministic Scoring: Each skill score is mathematically evaluated as "
                "(Sum of Correct Question Weights / Sum of All Question Weights for that Skill) × 100. "
                "The Overall Assessment Score is the unweighted arithmetic mean of the 5 assessed skill scores. "
                "No generative AI, LLM, or probabilistic models are used in score calculation."
            )
        }
    }

@router.get("/{assessment_id}/results/{student_id}", summary="Get latest assessment result for candidate")
def get_latest_assessment_result(assessment_id: str, student_id: str) -> Dict[str, Any]:
    """
    Retrieves the most recent assessment attempt and performance breakdown for the candidate.
    """
    db = _check_db()
    profile = _find_student_profile(db, student_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student profile '{student_id}' not found."
        )

    resolved_id = profile["_id"]
    latest_attempt = db[COLLECTION_ASSESSMENT_ATTEMPTS].find_one(
        {"assessmentId": assessment_id, "studentId": resolved_id},
        sort=[("submittedAt", -1)]
    )

    if not latest_attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No completed attempt found for student '{student_id}' in assessment '{assessment_id}'."
        )

    return {
        "status": "success",
        "data": {
            "attemptId": latest_attempt["_id"],
            "assessmentId": latest_attempt["assessmentId"],
            "assessmentTitle": latest_attempt.get("assessmentTitle", ""),
            "studentId": latest_attempt["studentId"],
            "studentName": latest_attempt.get("studentName", ""),
            "overallScore": latest_attempt.get("overallScore", 0.0),
            "performanceTier": latest_attempt.get("performanceTier", "Developing"),
            "totalQuestions": latest_attempt.get("totalQuestions", 25),
            "totalCorrect": latest_attempt.get("totalCorrect", 0),
            "totalIncorrect": latest_attempt.get("totalIncorrect", 0),
            "answeredCount": latest_attempt.get("answeredCount", 0),
            "unansweredCount": latest_attempt.get("unansweredCount", 0),
            "submittedAt": latest_attempt.get("submittedAt", ""),
            "skillScores": latest_attempt.get("skillScores", []),
            "scoringExplanation": (
                "Deterministic Scoring: Each skill score is mathematically evaluated as "
                "(Sum of Correct Question Weights / Sum of All Question Weights for that Skill) × 100. "
                "The Overall Assessment Score is the unweighted arithmetic mean of the 5 assessed skill scores. "
                "No generative AI, LLM, or probabilistic models are used in score calculation."
            )
        }
    }
