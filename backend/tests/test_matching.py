"""
Unit Tests for Step 5: Skill Matching Engine
Problem Statement ID: 26044 | Ministry of Ayush - AIIA

Tests:
- Test A — Perfect Match (All scores meeting or exceeding targets -> 100)
- Test B — Partial Match (50/100 -> 50)
- Test C — Surplus Score (95/70 -> capped at 100%, final <= 100)
- Test D — Multiple Weighted Skills (Exact weighted formula verification)
- Test E — Mandatory Gap (Student below mandatory threshold -> CONDITIONAL)
- Test F — Missing Assessment (Unassessed skill -> 0 score, NOT_ASSESSED, gap)
- Test G — Zero Weight (Zero-weight does not break normalization)
- Test H — Invalid Data (Negative or malformed inputs handled safely)
- Test I — Determinism (Identical output across multiple executions)
"""

import unittest
from backend.app.services.matching import matching_engine, SkillMatchingEngine

class TestSkillMatchingEngine(unittest.TestCase):

    def test_a_perfect_match(self):
        """Test A — Perfect Match: Student satisfies all targets, score is 100, ELIGIBLE."""
        required_skills = [
            {"skillId": "sk_python", "minProficiency": 70, "weight": 40, "mandatory": True},
            {"skillId": "sk_sql", "minProficiency": 70, "weight": 60, "mandatory": True}
        ]
        assessed_skills = {
            "sk_python": {"proficiency": 90, "assessed": True},
            "sk_sql": {"proficiency": 80, "assessed": True}
        }
        res = matching_engine.calculate_match("opp_test", "sp_test", required_skills, assessed_skills)
        self.assertEqual(res["matchScore"], 100)
        self.assertEqual(res["eligibility"], "ELIGIBLE")
        self.assertEqual(res["summary"]["skillsMet"], 2)
        self.assertEqual(res["summary"]["skillsWithGap"], 0)
        self.assertTrue(all(s["gap"] == 0 for s in res["skills"]))

    def test_b_partial_match(self):
        """Test B — Partial Match: Python 50 required 100, weight 50 -> ratio 0.5 -> score 50."""
        required_skills = [
            {"skillId": "sk_python", "minProficiency": 100, "weight": 50, "mandatory": False}
        ]
        assessed_skills = {
            "sk_python": {"proficiency": 50, "assessed": True}
        }
        res = matching_engine.calculate_match("opp_test", "sp_test", required_skills, assessed_skills)
        self.assertEqual(res["matchScore"], 50)
        self.assertEqual(res["skills"][0]["gap"], 50.0)
        self.assertEqual(res["skills"][0]["status"], "GAP")

    def test_c_surplus_score(self):
        """Test C — Surplus Score: Python 95 vs 70 required -> Capped at 1.0, score <= 100."""
        required_skills = [
            {"skillId": "sk_python", "minProficiency": 70, "weight": 30, "mandatory": True}
        ]
        assessed_skills = {
            "sk_python": {"proficiency": 95, "assessed": True}
        }
        res = matching_engine.calculate_match("opp_test", "sp_test", required_skills, assessed_skills)
        self.assertEqual(res["matchScore"], 100)
        self.assertEqual(res["skills"][0]["surplus"], 25.0)
        self.assertEqual(res["skills"][0]["ratio"], 1.0)
        self.assertEqual(res["skills"][0]["contribution"], 30.0)

    def test_d_multiple_weighted_skills(self):
        """
        Test D — Multiple Weighted Skills:
        Python: 82/70 (cap 1.0) * 40 = 40.0
        SQL: 58/70 (ratio ~0.8286) * 35 = 29.0
        Biostat: 72/60 (cap 1.0) * 25 = 25.0
        Total weight = 100.
        Total contribution = 40 + 29 + 25 = 94.0
        Expected Match Score = 94
        """
        required_skills = [
            {"skillId": "sk_python", "minProficiency": 70, "weight": 40, "mandatory": True},
            {"skillId": "sk_sql", "minProficiency": 70, "weight": 35, "mandatory": True},
            {"skillId": "sk_biostat", "minProficiency": 60, "weight": 25, "mandatory": False}
        ]
        assessed_skills = {
            "sk_python": {"proficiency": 82, "assessed": True},
            "sk_sql": {"proficiency": 58, "assessed": True},
            "sk_biostat": {"proficiency": 72, "assessed": True}
        }
        res = matching_engine.calculate_match("opp_test", "sp_test", required_skills, assessed_skills)
        self.assertEqual(res["matchScore"], 94)
        self.assertEqual(res["summary"]["requiredSkills"], 3)
        self.assertEqual(res["summary"]["skillsMet"], 2)
        self.assertEqual(res["summary"]["skillsWithGap"], 1)

    def test_e_mandatory_gap(self):
        """Test E — Mandatory Gap: Student below mandatory threshold -> CONDITIONAL."""
        required_skills = [
            {"skillId": "sk_python", "minProficiency": 80, "weight": 50, "mandatory": True},
            {"skillId": "sk_sql", "minProficiency": 50, "weight": 50, "mandatory": False}
        ]
        assessed_skills = {
            "sk_python": {"proficiency": 70, "assessed": True},  # Below mandatory 80
            "sk_sql": {"proficiency": 60, "assessed": True}
        }
        res = matching_engine.calculate_match("opp_test", "sp_test", required_skills, assessed_skills)
        self.assertEqual(res["eligibility"], "CONDITIONAL")
        self.assertEqual(res["summary"]["mandatorySkills"], 1)
        self.assertEqual(res["summary"]["mandatoryRequirementsMet"], 0)
        self.assertFalse(res["skills"][0]["mandatorySatisfied"])

    def test_f_missing_assessment(self):
        """Test F — Missing Assessment: Student has no assessed score -> 0, NOT_ASSESSED, gap."""
        required_skills = [
            {"skillId": "sk_hl7", "minProficiency": 60, "weight": 30, "mandatory": True}
        ]
        assessed_skills = {}  # No assessed scores
        res = matching_engine.calculate_match("opp_test", "sp_test", required_skills, assessed_skills)
        skill = res["skills"][0]
        self.assertEqual(skill["studentScore"], 0.0)
        self.assertEqual(skill["assessmentStatus"], "NOT_ASSESSED")
        self.assertEqual(skill["status"], "GAP")
        self.assertEqual(skill["gap"], 60.0)
        self.assertEqual(res["matchScore"], 0)
        self.assertEqual(res["eligibility"], "CONDITIONAL")

    def test_g_zero_weight(self):
        """Test G — Zero Weight: Handled safely without ZeroDivisionError."""
        required_skills = [
            {"skillId": "sk_python", "minProficiency": 70, "weight": 0, "mandatory": False},
            {"skillId": "sk_sql", "minProficiency": 60, "weight": 20, "mandatory": False}
        ]
        assessed_skills = {
            "sk_python": {"proficiency": 80, "assessed": True},
            "sk_sql": {"proficiency": 60, "assessed": True}
        }
        res = matching_engine.calculate_match("opp_test", "sp_test", required_skills, assessed_skills)
        self.assertEqual(res["matchScore"], 100)

        # All zero weights
        zero_weights = [
            {"skillId": "sk_python", "minProficiency": 70, "weight": 0, "mandatory": False}
        ]
        res_zero = matching_engine.calculate_match("opp_test", "sp_test", zero_weights, assessed_skills)
        self.assertIn(res_zero["matchScore"], [0, 100])

    def test_h_invalid_data(self):
        """Test H — Invalid Data: Negative or malformed values are handled safely."""
        required_skills = [
            {"skillId": "sk_python", "minProficiency": -10, "weight": -5, "mandatory": "invalid_bool"},
            {"skillId": "sk_sql", "minProficiency": 0, "weight": 10, "mandatory": True}
        ]
        assessed_skills = {
            "sk_python": {"proficiency": -50, "assessed": True},
            "sk_sql": {"proficiency": 70, "assessed": True}
        }
        res = matching_engine.calculate_match("opp_test", "sp_test", required_skills, assessed_skills)
        self.assertTrue(0 <= res["matchScore"] <= 100)
        self.assertIsInstance(res["explanation"], str)

    def test_i_determinism(self):
        """Test I — Determinism: Multiple runs return exact same output."""
        required_skills = [
            {"skillId": "sk_python", "minProficiency": 75, "weight": 3, "mandatory": True},
            {"skillId": "sk_sql", "minProficiency": 70, "weight": 2, "mandatory": True},
            {"skillId": "sk_biostat", "minProficiency": 65, "weight": 1, "mandatory": False}
        ]
        assessed_skills = {
            "sk_python": {"proficiency": 82, "assessed": True},
            "sk_sql": {"proficiency": 65, "assessed": True},
            "sk_biostat": {"proficiency": 70, "assessed": True}
        }
        results = [
            matching_engine.calculate_match("opp_test", "sp_test", required_skills, assessed_skills)
            for _ in range(5)
        ]
        for r in results[1:]:
            self.assertEqual(r["matchScore"], results[0]["matchScore"])
            self.assertEqual(r["eligibility"], results[0]["eligibility"])
            self.assertEqual(r["explanation"], results[0]["explanation"])
            self.assertEqual(r["whyNot100"], results[0]["whyNot100"])


if __name__ == "__main__":
    unittest.main()
