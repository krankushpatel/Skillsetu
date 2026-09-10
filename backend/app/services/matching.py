"""
SkillSetu - Explainable Skill Matching Engine
Problem Statement ID: 26044 | Ministry of Ayush - AIIA
Step 5: Skill Matching Engine

Deterministic, non-AI calculation engine comparing candidate's Assessed Skill Scores
against Opportunity Requirements (min proficiency + weight + mandatory flags).
Produces:
- Overall Match Score (0 - 100)
- Skill-by-skill contribution and ratios
- Skill gaps and skill surpluses
- Eligibility determination (ELIGIBLE vs. CONDITIONAL)
- Fully explainable deterministic summaries and "Why isn't my match 100%?" diagnostics.
"""

from typing import List, Dict, Any, Optional, Tuple
import math

class SkillMatchingEngine:
    """
    Deterministic skill matching engine adhering to strict mathematical normalization
    and explainable diagnostics. No LLM, probabilistic, or semantic AI models used.
    """

    @staticmethod
    def calculate_single_skill_match(
        student_score: Optional[float],
        required_score: float,
        weight: float,
        mandatory: bool = True,
        skill_id: str = "",
        skill_name: str = "",
        category: str = "TECHNICAL"
    ) -> Dict[str, Any]:
        """
        Calculates metrics for a single required skill requirement.
        Safely handles unassessed skills, negative inputs, and zero denominators.
        """
        # 1. Sanitize & clamp input scores
        is_assessed = student_score is not None
        safe_student_score = max(0.0, float(student_score)) if is_assessed else 0.0
        safe_required_score = max(0.0, float(required_score)) if required_score is not None else 0.0
        safe_weight = max(0.0, float(weight)) if weight is not None else 1.0

        # 2. Ratio Calculation (Avoid division by zero)
        if safe_required_score == 0.0:
            # If 0 proficiency is required, any student satisfies this requirement fully
            ratio = 1.0
        else:
            ratio = safe_student_score / safe_required_score

        # 3. Cap ratio at 1.0 (Surplus does not inflate beyond 100% of the weight)
        capped_ratio = min(max(ratio, 0.0), 1.0)
        contribution = capped_ratio * safe_weight

        # 4. Gap and Surplus calculation (Always non-negative)
        if safe_student_score < safe_required_score:
            gap = safe_required_score - safe_student_score
            surplus = 0.0
            status = "GAP"
            status_label = "Requirement Not Met"
        else:
            gap = 0.0
            surplus = safe_student_score - safe_required_score
            status = "MET"
            status_label = "Requirement Met"

        # 5. Mandatory fulfillment check
        mandatory_satisfied = True
        if mandatory:
            mandatory_satisfied = (safe_student_score >= safe_required_score)

        return {
            "skillId": skill_id,
            "skillName": skill_name or skill_id,
            "category": category,
            "studentScore": round(safe_student_score, 1),
            "requiredScore": round(safe_required_score, 1),
            "weight": round(safe_weight, 1),
            "ratio": round(capped_ratio, 4),
            "contribution": round(contribution, 2),
            "gap": round(gap, 1),
            "surplus": round(surplus, 1),
            "mandatory": bool(mandatory),
            "mandatorySatisfied": mandatory_satisfied,
            "status": status,
            "statusLabel": status_label,
            "assessmentStatus": "ASSESSED" if is_assessed else "NOT_ASSESSED"
        }

    @classmethod
    def calculate_match(
        cls,
        opportunity_id: str,
        student_id: str,
        required_skills: List[Dict[str, Any]],
        assessed_skills_map: Dict[str, Dict[str, Any]],
        opportunity_title: str = "",
        organization_name: str = "",
        student_name: str = ""
    ) -> Dict[str, Any]:
        """
        Calculates the complete explainable matching result for an opportunity and candidate.
        """
        # Edge Case: Opportunity has no required skills
        if not required_skills:
            return {
                "opportunityId": opportunity_id,
                "opportunityTitle": opportunity_title,
                "organizationName": organization_name,
                "studentId": student_id,
                "studentName": student_name,
                "matchScore": 100,
                "rawMatchScore": 100.0,
                "eligibility": "ELIGIBLE",
                "eligibilityLabel": "Eligible",
                "skills": [],
                "summary": {
                    "requiredSkills": 0,
                    "skillsMet": 0,
                    "skillsWithGap": 0,
                    "mandatorySkills": 0,
                    "mandatoryRequirementsMet": 0,
                    "totalWeight": 0.0,
                    "earnedWeight": 0.0
                },
                "explanation": "This opportunity has no specific skill prerequisites. Candidate is fully eligible.",
                "whyNot100": []
            }

        skill_results: List[Dict[str, Any]] = []
        total_weight = 0.0
        total_contribution = 0.0
        skills_met = 0
        skills_with_gap = 0
        mandatory_skills = 0
        mandatory_met = 0

        # Process each required skill (prevent duplicate skill IDs by grouping or picking latest)
        seen_skill_ids = set()
        for req in required_skills:
            s_id = req.get("skillId")
            if not s_id or s_id in seen_skill_ids:
                continue
            seen_skill_ids.add(s_id)

            req_prof = req.get("minProficiency", req.get("requiredProficiency", 0))
            weight = req.get("weight", 1)
            mandatory = req.get("mandatory", True)
            skill_name = req.get("skillName", s_id)
            category = req.get("category", "TECHNICAL")

            # Look up candidate assessed score
            student_skill_entry = assessed_skills_map.get(s_id)
            student_score = None
            if student_skill_entry is not None:
                # Can be integer proficiency or dict
                if isinstance(student_skill_entry, dict):
                    # Check if assessed
                    student_score = student_skill_entry.get("proficiency")
                elif isinstance(student_skill_entry, (int, float)):
                    student_score = float(student_skill_entry)

            single_match = cls.calculate_single_skill_match(
                student_score=student_score,
                required_score=req_prof,
                weight=weight,
                mandatory=mandatory,
                skill_id=s_id,
                skill_name=skill_name,
                category=category
            )

            skill_results.append(single_match)

            total_weight += single_match["weight"]
            total_contribution += single_match["contribution"]

            if single_match["status"] == "MET":
                skills_met += 1
            else:
                skills_with_gap += 1

            if single_match["mandatory"]:
                mandatory_skills += 1
                if single_match["mandatorySatisfied"]:
                    mandatory_met += 1

        # Match Score Calculation
        if total_weight > 0:
            raw_score = (total_contribution / total_weight) * 100.0
        else:
            # If all weights were 0, score is 100 if all met, else 0
            raw_score = 100.0 if skills_with_gap == 0 else 0.0

        # Clamp between 0 and 100, and round to nearest whole number for UI display
        clamped_score = min(max(raw_score, 0.0), 100.0)
        final_score = int(round(clamped_score))

        # Eligibility Determination
        # ELIGIBLE: All mandatory requirements satisfied (mandatory_met == mandatory_skills)
        # CONDITIONAL: One or more mandatory requirements not met
        is_eligible = (mandatory_met == mandatory_skills)
        eligibility = "ELIGIBLE" if is_eligible else "CONDITIONAL"
        eligibility_label = "Eligible" if is_eligible else "Conditional / Skill Gap"

        # Deterministic Explanations & "Why isn't my match 100%?"
        explanation, why_not_100 = cls._generate_explanation(
            final_score=final_score,
            is_eligible=is_eligible,
            skill_results=skill_results,
            skills_met=skills_met,
            total_skills=len(skill_results),
            mandatory_skills=mandatory_skills,
            mandatory_met=mandatory_met
        )

        return {
            "opportunityId": opportunity_id,
            "opportunityTitle": opportunity_title,
            "organizationName": organization_name,
            "studentId": student_id,
            "studentName": student_name,
            "matchScore": final_score,
            "rawMatchScore": round(clamped_score, 2),
            "eligibility": eligibility,
            "eligibilityLabel": eligibility_label,
            "skills": skill_results,
            "summary": {
                "requiredSkills": len(skill_results),
                "skillsMet": skills_met,
                "skillsWithGap": skills_with_gap,
                "mandatorySkills": mandatory_skills,
                "mandatoryRequirementsMet": mandatory_met,
                "totalWeight": round(total_weight, 1),
                "earnedWeight": round(total_contribution, 2)
            },
            "explanation": explanation,
            "whyNot100": why_not_100
        }

    @classmethod
    def _generate_explanation(
        cls,
        final_score: int,
        is_eligible: bool,
        skill_results: List[Dict[str, Any]],
        skills_met: int,
        total_skills: int,
        mandatory_skills: int,
        mandatory_met: int
    ) -> Tuple[str, List[str]]:
        """
        Constructs deterministic, explainable diagnostic text without any generative AI.
        """
        why_not_100: List[str] = []

        # Find strongest met skill (highest surplus or highest ratio)
        met_skills = [s for s in skill_results if s["status"] == "MET"]
        gap_skills = [s for s in skill_results if s["status"] == "GAP"]

        # Sort gaps by impact (unearned weight * gap)
        def gap_impact(s):
            unearned = s["weight"] - s["contribution"]
            return unearned

        sorted_gaps = sorted(gap_skills, key=gap_impact, reverse=True)
        sorted_met = sorted(met_skills, key=lambda s: s["surplus"], reverse=True)

        # Build Why Not 100% list
        if final_score >= 100:
            why_not_100 = ["All required skills meet or exceed their target proficiency."]
        else:
            for s in sorted_gaps:
                if s["assessmentStatus"] == "NOT_ASSESSED":
                    bullet = f"{s['skillName']} has not yet been assessed (0% score). Taking the assessment can unlock up to {int(s['weight'])} weighted points."
                else:
                    mandatory_note = " [Mandatory]" if s["mandatory"] else ""
                    bullet = f"{s['skillName']} is {int(round(s['gap']))} points below the required proficiency ({int(round(s['studentScore']))}% / {int(round(s['requiredScore']))}%){mandatory_note}."
                why_not_100.append(bullet)
            why_not_100.append("These gaps reduce your overall weighted match score.")

        # Build comprehensive narrative explanation
        sentences: List[str] = []

        # Overview sentence
        mandatory_gap_count = mandatory_skills - mandatory_met
        if total_skills == 0:
            sentences.append("No specific skill criteria specified.")
        elif skills_met == total_skills:
            sentences.append(f"You meet 100% of required competencies ({skills_met}/{total_skills} skills) for this opportunity.")
        else:
            sentences.append(
                f"You meet {skills_met} of {total_skills} required competencies with a {final_score}% overall match."
            )
            if mandatory_gap_count > 0:
                sentences.append(
                    f"{mandatory_gap_count} mandatory requirement{' has' if mandatory_gap_count == 1 else 's have'} a proficiency gap, resulting in Conditional eligibility."
                )

        # Highlight strongest alignment
        if sorted_met:
            strongest = sorted_met[0]
            if strongest["surplus"] > 0:
                sentences.append(
                    f"Your strongest alignment is in {strongest['skillName']}, where your assessed score of {int(round(strongest['studentScore']))}% exceeds the required {int(round(strongest['requiredScore']))}% (+{int(round(strongest['surplus']))}% surplus)."
                )
            else:
                sentences.append(
                    f"Your assessed proficiency in {strongest['skillName']} ({int(round(strongest['studentScore']))}%) fully satisfies the requirement."
                )

        # Highlight primary gap
        if sorted_gaps:
            primary_gap = sorted_gaps[0]
            if primary_gap["assessmentStatus"] == "NOT_ASSESSED":
                sentences.append(
                    f"{primary_gap['skillName']} is currently unassessed, which contributes 0 towards its {primary_gap['weight']}x weighted requirement."
                )
            else:
                sentences.append(
                    f"{primary_gap['skillName']} is {int(round(primary_gap['gap']))} points below the required proficiency ({int(round(primary_gap['studentScore']))}% vs. {int(round(primary_gap['requiredScore']))}% target), representing the largest opportunity for score improvement."
                )

        full_explanation = " ".join(sentences)
        return full_explanation, why_not_100

    @classmethod
    def simulate_what_if(
        cls,
        opportunity_id: str,
        student_id: str,
        required_skills: List[Dict[str, Any]],
        assessed_skills_map: Dict[str, Dict[str, Any]],
        skill_updates: List[Dict[str, Any]],
        opportunity_title: str = "",
        organization_name: str = "",
        student_name: str = ""
    ) -> Dict[str, Any]:
        """
        Step 6: What-If Skill Improvement Simulation.
        Calculates projected match score by applying in-memory hypothetical overrides
        to the candidate's actual assessed scores.
        Reuses calculate_match() directly. Does NOT modify MongoDB or persistent records.
        """
        # 1. Calculate authoritative current match
        current_match = cls.calculate_match(
            opportunity_id=opportunity_id,
            student_id=student_id,
            required_skills=required_skills,
            assessed_skills_map=assessed_skills_map,
            opportunity_title=opportunity_title,
            organization_name=organization_name,
            student_name=student_name
        )

        # 2. Normalize and group updates (latest update for a skill takes precedence)
        normalized_updates: Dict[str, float] = {}
        for update in skill_updates:
            s_id = update.get("skillId")
            if s_id:
                prof = float(update.get("proficiency", 0.0))
                # Safe sanitization to 0 - 100
                prof = min(max(prof, 0.0), 100.0)
                normalized_updates[s_id] = prof

        # 3. Create hypothetical in-memory assessed skills map
        simulated_skills_map: Dict[str, Dict[str, Any]] = {}
        for k, v in assessed_skills_map.items():
            if isinstance(v, dict):
                simulated_skills_map[k] = dict(v)
            else:
                simulated_skills_map[k] = {"skillId": k, "proficiency": float(v)}

        for s_id, prof in normalized_updates.items():
            simulated_skills_map[s_id] = {
                "skillId": s_id,
                "proficiency": prof,
                "assessed": True,
                "simulated": True
            }

        # 4. Calculate projected match using the EXACT same matching engine
        projected_match = cls.calculate_match(
            opportunity_id=opportunity_id,
            student_id=student_id,
            required_skills=required_skills,
            assessed_skills_map=simulated_skills_map,
            opportunity_title=opportunity_title,
            organization_name=organization_name,
            student_name=student_name
        )

        # 5. Build before/after comparison breakdown for each required skill
        cur_skills_by_id = {s["skillId"]: s for s in current_match["skills"]}
        proj_skills_by_id = {s["skillId"]: s for s in projected_match["skills"]}

        skills_comparison = []
        for req in required_skills:
            s_id = req["skillId"]
            cur_s = cur_skills_by_id.get(s_id, {})
            proj_s = proj_skills_by_id.get(s_id, {})
            is_updated = s_id in normalized_updates

            skills_comparison.append({
                "skillId": s_id,
                "skillName": req.get("skillName", s_id),
                "category": req.get("category", "TECHNICAL"),
                "currentScore": cur_s.get("studentScore", 0.0),
                "simulatedScore": proj_s.get("studentScore", 0.0),
                "requiredScore": req.get("minProficiency", 0.0),
                "weight": req.get("weight", 1.0),
                "mandatory": req.get("mandatory", True),
                "currentGap": cur_s.get("gap", 0.0),
                "projectedGap": proj_s.get("gap", 0.0),
                "currentStatus": cur_s.get("status", "GAP"),
                "projectedStatus": proj_s.get("status", "GAP"),
                "currentContribution": cur_s.get("contribution", 0.0),
                "projectedContribution": proj_s.get("contribution", 0.0),
                "isUpdated": is_updated
            })

        improvement = projected_match["matchScore"] - current_match["matchScore"]
        raw_improvement = round(projected_match["rawMatchScore"] - current_match["rawMatchScore"], 2)

        # 6. Deterministic explanation of simulation outcome
        sentences = []
        if improvement > 0:
            sentences.append(
                f"Projected Match Score increases from {current_match['matchScore']}% to {projected_match['matchScore']}% (+{improvement} points)."
            )
            if current_match["eligibility"] == "CONDITIONAL" and projected_match["eligibility"] == "ELIGIBLE":
                sentences.append(
                    "Eligibility transitions from Conditional to Eligible as all mandatory benchmark requirements are satisfied."
                )
            else:
                sentences.append(
                    f"Proficiency gains reduce your aggregate skill gaps across {len(normalized_updates)} simulated competency target{'s' if len(normalized_updates) > 1 else ''}."
                )
        elif improvement == 0:
            if not normalized_updates:
                sentences.append(
                    f"No hypothetical skill targets specified. Current match score remains {current_match['matchScore']}%."
                )
            else:
                sentences.append(
                    f"Projected Match Score remains unchanged at {current_match['matchScore']}%. Simulated scores either match your existing competencies or additional surplus points are capped at the required threshold."
                )
        else:
            sentences.append(
                f"Simulating a lower proficiency target decreases your projected Match Score from {current_match['matchScore']}% to {projected_match['matchScore']}% ({improvement} points)."
            )

        sim_explanation = " ".join(sentences)

        return {
            "opportunityId": opportunity_id,
            "opportunityTitle": opportunity_title,
            "organizationName": organization_name,
            "studentId": student_id,
            "studentName": student_name,
            "currentMatchScore": current_match["matchScore"],
            "projectedMatchScore": projected_match["matchScore"],
            "currentRawMatchScore": current_match["rawMatchScore"],
            "projectedRawMatchScore": projected_match["rawMatchScore"],
            "improvement": improvement,
            "rawImprovement": raw_improvement,
            "skills": skills_comparison,
            "eligibility": {
                "current": current_match["eligibility"],
                "projected": projected_match["eligibility"],
                "currentLabel": current_match["eligibilityLabel"],
                "projectedLabel": projected_match["eligibilityLabel"]
            },
            "summary": {
                "currentSkillsMet": current_match["summary"]["skillsMet"],
                "projectedSkillsMet": projected_match["summary"]["skillsMet"],
                "currentSkillsWithGap": current_match["summary"]["skillsWithGap"],
                "projectedSkillsWithGap": projected_match["summary"]["skillsWithGap"],
                "currentMandatoryMet": current_match["summary"]["mandatoryRequirementsMet"],
                "projectedMandatoryMet": projected_match["summary"]["mandatoryRequirementsMet"],
                "mandatorySkills": current_match["summary"]["mandatorySkills"],
                "totalWeight": current_match["summary"]["totalWeight"],
                "currentEarnedWeight": current_match["summary"]["earnedWeight"],
                "projectedEarnedWeight": projected_match["summary"]["earnedWeight"]
            },
            "explanation": sim_explanation
        }

    @classmethod
    def rank_learning_recommendations(
        cls,
        match_result: Dict[str, Any],
        learning_resources: List[Dict[str, Any]],
        skills_taxonomy: Optional[Dict[str, Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Step 6: Learning Recommendation Engine.
        Prioritizes curated learning resources from the existing learning_resources
        collection based on candidate's actual skill gaps for this opportunity:
        - Priority 1: Required skill with largest gap
        - Priority 2: Mandatory skill gaps (boosted ranking)
        - Priority 3: Larger weighted skill gaps (weight multiplier)
        - Priority 4: Associated skill relevance
        - Priority 5: Deterministic ordering without duplicates
        """
        skills = match_result.get("skills", [])
        gap_skills = [s for s in skills if s.get("status") == "GAP" or s.get("gap", 0) > 0]

        if not gap_skills:
            return {
                "opportunityId": match_result.get("opportunityId", ""),
                "opportunityTitle": match_result.get("opportunityTitle", ""),
                "studentId": match_result.get("studentId", ""),
                "studentName": match_result.get("studentName", ""),
                "hasGaps": False,
                "skillGapCount": 0,
                "recommendations": [],
                "skillsWithNoResources": [],
                "message": "Candidate meets all required skill benchmarks. No skill gap remediation required."
            }

        max_gap = max(s.get("gap", 0) for s in gap_skills) if gap_skills else 0.0

        # Group resources by skillId
        resources_by_skill: Dict[str, List[Dict[str, Any]]] = {}
        for r in learning_resources:
            s_id = r.get("skillId")
            if s_id:
                resources_by_skill.setdefault(s_id, []).append(r)

        recommendations: List[Dict[str, Any]] = []
        seen_resource_ids = set()
        skills_with_no_resources = []

        for s in gap_skills:
            s_id = s["skillId"]
            s_name = s.get("skillName", s_id)
            gap = float(s.get("gap", 0.0))
            weight = float(s.get("weight", 1.0))
            mandatory = bool(s.get("mandatory", True))
            student_score = float(s.get("studentScore", 0.0))
            required_score = float(s.get("requiredScore", 0.0))

            matching_res = resources_by_skill.get(s_id, [])
            if not matching_res:
                skills_with_no_resources.append(s_name)
                continue

            # Deterministic Priority Scoring
            # Priority = (gap * weight) + (100 if mandatory else 0)
            base_score = gap * weight
            mandatory_bonus = 100.0 if mandatory else 0.0
            priority_score = round(base_score + mandatory_bonus, 2)

            # Deterministic reason template
            is_max = (gap == max_gap)
            if mandatory and is_max:
                reason = f"{s_name} has the largest proficiency gap ({int(round(gap))} points) and is a mandatory requirement."
            elif mandatory:
                reason = f"{s_name} has a {int(round(gap))}-point gap and is a mandatory requirement with {weight}x weighting."
            elif is_max:
                reason = f"{s_name} has the largest proficiency gap ({int(round(gap))} points) among required skills."
            else:
                reason = f"{s_name} has a {int(round(gap))}-point gap with {weight}x weighting."

            for res in matching_res:
                r_id = res.get("_id", res.get("id"))
                if not r_id or r_id in seen_resource_ids:
                    continue
                seen_resource_ids.add(r_id)

                recommendations.append({
                    "resourceId": r_id,
                    "title": res.get("title", "Learning Resource"),
                    "skillId": s_id,
                    "skillName": s_name,
                    "provider": res.get("provider", "Curated Ayush Learning"),
                    "description": res.get("description", ""),
                    "duration": res.get("duration", "Self-paced"),
                    "difficulty": res.get("difficulty", "FOUNDATIONAL"),
                    "url": res.get("url", ""),
                    "potentialSkillGain": res.get("potentialSkillGain", 15),
                    "currentScore": round(student_score, 1),
                    "requiredScore": round(required_score, 1),
                    "gap": round(gap, 1),
                    "weight": round(weight, 1),
                    "mandatory": mandatory,
                    "priority": priority_score,
                    "reason": reason
                })

        # Deterministic sort: priority descending, gap descending, potentialSkillGain descending, resourceId ascending
        recommendations.sort(
            key=lambda r: (
                -r["priority"],
                -r["gap"],
                -r.get("potentialSkillGain", 0),
                r["resourceId"]
            )
        )

        return {
            "opportunityId": match_result.get("opportunityId", ""),
            "opportunityTitle": match_result.get("opportunityTitle", ""),
            "studentId": match_result.get("studentId", ""),
            "studentName": match_result.get("studentName", ""),
            "hasGaps": len(gap_skills) > 0,
            "skillGapCount": len(gap_skills),
            "recommendations": recommendations,
            "skillsWithNoResources": skills_with_no_resources,
            "message": f"Found {len(recommendations)} recommended learning resource{'s' if len(recommendations) != 1 else ''} for {len(gap_skills)} skill gap{'s' if len(gap_skills) != 1 else ''}."
        }


# Convenience singleton
matching_engine = SkillMatchingEngine()
