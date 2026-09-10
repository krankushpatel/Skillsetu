"""
Unit and Integration Tests for Step 6:
- What-If Skill Improvement Simulation
- Learning Recommendation Engine
Problem Statement ID: 26044 | Ministry of Ayush - AIIA
"""

import json
import unittest
import urllib.request
import urllib.error
from backend.app.services.matching import matching_engine


class TestStep6MatchingEngineSimulation(unittest.TestCase):

    def setUp(self):
        self.opportunity_id = "opp_test_6"
        self.student_id = "sp_test_6"
        self.required_skills = [
            {"skillId": "sk_sql", "skillName": "SQL Databases", "minProficiency": 75.0, "weight": 40.0, "mandatory": True},
            {"skillId": "sk_stats", "skillName": "Biostatistics", "minProficiency": 80.0, "weight": 60.0, "mandatory": False}
        ]
        # Current assessed scores: SQL=50 (gap=25, mandatory), Stats=40 (gap=40, non-mandatory)
        self.current_assessed = {
            "sk_sql": {"skillId": "sk_sql", "proficiency": 50.0, "assessed": True},
            "sk_stats": {"skillId": "sk_stats", "proficiency": 40.0, "assessed": True}
        }

    def test_what_if_identical_score_zero_improvement(self):
        """Case A: Simulated score equals current score -> improvement = 0."""
        updates = [{"skillId": "sk_sql", "proficiency": 50.0}]
        res = matching_engine.simulate_what_if(
            self.opportunity_id, self.student_id, self.required_skills,
            self.current_assessed, updates
        )
        self.assertEqual(res["improvement"], 0)
        self.assertEqual(res["currentMatchScore"], res["projectedMatchScore"])

    def test_what_if_higher_score_improves_match(self):
        """Case B: Higher simulated score increases projected score."""
        # Initial: SQL (50/75 * 40 = 26.67), Stats (40/80 * 60 = 30.0) -> Raw: 56.67, Rounded: 57
        # Simulating SQL=75 (75/75 * 40 = 40.0), Stats=40 (30.0) -> Raw: 70.0, Rounded: 70
        updates = [{"skillId": "sk_sql", "proficiency": 75.0}]
        res = matching_engine.simulate_what_if(
            self.opportunity_id, self.student_id, self.required_skills,
            self.current_assessed, updates
        )
        self.assertGreater(res["projectedMatchScore"], res["currentMatchScore"])
        self.assertEqual(res["projectedMatchScore"], 70)
        self.assertEqual(res["improvement"], 70 - res["currentMatchScore"])

    def test_what_if_surplus_capping(self):
        """Case C: Simulated score exceeds target proficiency -> capped at 1.0 ratio, score <= 100."""
        # SQL required is 75, simulate 100
        # Stats required is 80, simulate 100
        updates = [
            {"skillId": "sk_sql", "proficiency": 100.0},
            {"skillId": "sk_stats", "proficiency": 100.0}
        ]
        res = matching_engine.simulate_what_if(
            self.opportunity_id, self.student_id, self.required_skills,
            self.current_assessed, updates
        )
        self.assertEqual(res["projectedMatchScore"], 100)
        self.assertLessEqual(res["projectedMatchScore"], 100)
        for s in res["skills"]:
            self.assertEqual(s["projectedGap"], 0.0)
            self.assertEqual(s["projectedStatus"], "MET")

    def test_what_if_mandatory_eligibility_transition(self):
        """Case K: Resolving mandatory skill gap transitions eligibility from CONDITIONAL to ELIGIBLE."""
        # Initially SQL is at 50/75 (mandatory gap), so eligibility is CONDITIONAL
        updates = [{"skillId": "sk_sql", "proficiency": 75.0}]
        res = matching_engine.simulate_what_if(
            self.opportunity_id, self.student_id, self.required_skills,
            self.current_assessed, updates
        )
        self.assertEqual(res["eligibility"]["current"], "CONDITIONAL")
        self.assertEqual(res["eligibility"]["projected"], "ELIGIBLE")

    def test_what_if_zero_score(self):
        """Case E: Simulated score = 0 is valid and drops contribution to 0."""
        updates = [{"skillId": "sk_sql", "proficiency": 0.0}]
        res = matching_engine.simulate_what_if(
            self.opportunity_id, self.student_id, self.required_skills,
            self.current_assessed, updates
        )
        self.assertLess(res["projectedMatchScore"], res["currentMatchScore"])
        sql_skill = next(s for s in res["skills"] if s["skillId"] == "sk_sql")
        self.assertEqual(sql_skill["simulatedScore"], 0.0)
        self.assertEqual(sql_skill["projectedContribution"], 0.0)

    def test_what_if_immutability(self):
        """Ensures that the input assessed skills dictionary is NOT mutated by simulation."""
        original_sql = self.current_assessed["sk_sql"]["proficiency"]
        updates = [{"skillId": "sk_sql", "proficiency": 99.0}]
        matching_engine.simulate_what_if(
            self.opportunity_id, self.student_id, self.required_skills,
            self.current_assessed, updates
        )
        self.assertEqual(self.current_assessed["sk_sql"]["proficiency"], original_sql)


class TestStep6LearningRecommendationEngine(unittest.TestCase):

    def test_recommendations_ranking_largest_gap_and_mandatory(self):
        """
        Tests deterministic ranking:
        - Priority: (gap * weight) + (100 if mandatory else 0)
        Skill A: Gap 20, Weight 2.0, Mandatory=True -> Priority = (20*2.0)+100 = 140
        Skill B: Gap 40, Weight 1.0, Mandatory=False -> Priority = (40*1.0)+0 = 40
        Skill A resource MUST be ranked higher than Skill B resource.
        """
        match_result = {
            "opportunityId": "opp_rec_test",
            "skills": [
                {"skillId": "sk_a", "skillName": "Ayush Informatics", "gap": 20.0, "weight": 2.0, "mandatory": True, "status": "GAP", "studentScore": 50, "requiredScore": 70},
                {"skillId": "sk_b", "skillName": "Python Scripting", "gap": 40.0, "weight": 1.0, "mandatory": False, "status": "GAP", "studentScore": 30, "requiredScore": 70}
            ]
        }
        resources = [
            {"_id": "lr_b1", "skillId": "sk_b", "title": "Intro Python", "provider": "Coursera", "potentialSkillGain": 25},
            {"_id": "lr_a1", "skillId": "sk_a", "title": "Ayush Data Standards", "provider": "AIIA", "potentialSkillGain": 20}
        ]

        result = matching_engine.rank_learning_recommendations(match_result, resources)
        self.assertTrue(result["hasGaps"])
        self.assertEqual(result["skillGapCount"], 2)
        self.assertEqual(len(result["recommendations"]), 2)
        # First recommendation must be lr_a1 due to mandatory priority
        self.assertEqual(result["recommendations"][0]["resourceId"], "lr_a1")
        self.assertEqual(result["recommendations"][1]["resourceId"], "lr_b1")

    def test_recommendations_no_gaps(self):
        """When candidate satisfies all requirements, hasGaps is False and recommendations is empty."""
        match_result = {
            "opportunityId": "opp_rec_test",
            "skills": [
                {"skillId": "sk_a", "gap": 0.0, "weight": 2.0, "mandatory": True, "status": "MET"}
            ]
        }
        resources = [{"_id": "lr_a1", "skillId": "sk_a", "title": "Data Standards"}]
        result = matching_engine.rank_learning_recommendations(match_result, resources)
        self.assertFalse(result["hasGaps"])
        self.assertEqual(result["skillGapCount"], 0)
        self.assertEqual(len(result["recommendations"]), 0)

    def test_recommendations_deduplication(self):
        """Duplicate resource objects in database are safely deduplicated."""
        match_result = {
            "opportunityId": "opp_rec_test",
            "skills": [
                {"skillId": "sk_a", "skillName": "Ayush Data", "gap": 30.0, "weight": 1.0, "mandatory": True, "status": "GAP"}
            ]
        }
        resources = [
            {"_id": "lr_dup", "skillId": "sk_a", "title": "Ayush Data Course"},
            {"_id": "lr_dup", "skillId": "sk_a", "title": "Ayush Data Course"}
        ]
        result = matching_engine.rank_learning_recommendations(match_result, resources)
        self.assertEqual(len(result["recommendations"]), 1)


class TestStep6FastAPIEndpoints(unittest.TestCase):

    BASE_URL = "http://127.0.0.1:8001"

    def _post(self, path: str, data: dict):
        url = f"{self.BASE_URL}{path}"
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        try:
            with urllib.request.urlopen(req) as response:
                return response.status, json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read().decode("utf-8"))

    def _get(self, path: str):
        url = f"{self.BASE_URL}{path}"
        req = urllib.request.Request(url)
        try:
            with urllib.request.urlopen(req) as response:
                return response.status, json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read().decode("utf-8"))

    def test_what_if_api_success(self):
        """Test POST /api/opportunities/{opp_id}/what-if/{student_id} with valid payload."""
        payload = {
            "skill_updates": [
                {"skillId": "sk_sql", "proficiency": 85.0}
            ]
        }
        status_code, body = self._post("/api/opportunities/opp_02/what-if/sp_01", payload)
        self.assertEqual(status_code, 200)
        data = body["data"]
        self.assertEqual(data["opportunityId"], "opp_02")
        self.assertIn("projectedMatchScore", data)
        self.assertIn("currentMatchScore", data)
        self.assertIn("improvement", data)

    def test_what_if_api_rejects_unrelated_skill(self):
        """Test POST /api/opportunities/{opp_id}/what-if/{student_id} rejects skill not required by opportunity (Rule 4)."""
        # sk_phyto_chem exists in skill taxonomy but is not required by opp_02
        payload = {
            "skill_updates": [
                {"skillId": "sk_phyto_chem", "proficiency": 90.0}
            ]
        }
        status_code, body = self._post("/api/opportunities/opp_02/what-if/sp_01", payload)
        self.assertEqual(status_code, 400)
        self.assertIn("not required by opportunity", body["detail"])

    def test_what_if_api_rejects_invalid_proficiency(self):
        """Test POST /api/opportunities/{opp_id}/what-if/{student_id} rejects negative or > 100 proficiency."""
        payload_neg = {"skill_updates": [{"skillId": "sk_sql", "proficiency": -5.0}]}
        status_neg, body_neg = self._post("/api/opportunities/opp_02/what-if/sp_01", payload_neg)
        self.assertEqual(status_neg, 422)

        payload_high = {"skill_updates": [{"skillId": "sk_sql", "proficiency": 150.0}]}
        status_high, body_high = self._post("/api/opportunities/opp_02/what-if/sp_01", payload_high)
        self.assertEqual(status_high, 422)

    def test_learning_recommendations_api(self):
        """Test GET /api/opportunities/{opp_id}/recommendations/{student_id}."""
        status_code, body = self._get("/api/opportunities/opp_02/recommendations/sp_01")
        self.assertEqual(status_code, 200)
        data = body["data"]
        self.assertEqual(data["opportunityId"], "opp_02")
        self.assertIn("recommendations", data)
        self.assertIn("hasGaps", data)



if __name__ == "__main__":
    unittest.main()
