"""
Unit & Integration Tests for Step 7: Industry Workspace & Opportunity Management
Problem Statement ID: 26044 | Ministry of Ayush - AIIA

Tests:
1. Industry Profile retrieval (GET /api/industry/ind_01)
2. Industry Profile 404 for unknown industry
3. Industry Opportunities list with candidate stats (GET /api/industry/ind_01/opportunities)
4. Valid Opportunity creation with skill requirements (POST /api/industry/opportunities)
5. Reject creation without required skills (422/400)
6. Reject creation with invalid/non-existent skill ID (400)
7. Reject creation with duplicate skill IDs (400)
8. Reject creation with invalid proficiency > 100 (422/400)
9. Reject creation with negative weight (422/400)
10. Reject creation for non-existent industry ID (404)
11. Opportunity detail retrieval (GET /api/industry/opportunities/{id})
12. Opportunity update metadata and skills (PUT /api/industry/opportunities/{id})
13. Authorization check: Industry A cannot modify Industry B's opportunity (403)
14. Opportunity closure (PATCH /api/industry/opportunities/{id}/close)
15. Authorization check on closure (403)
16. Candidate matching evaluation using Step 5 SkillMatchingEngine
17. Candidate ranking verification (Match score desc, ELIGIBLE before CONDITIONAL, tie-breaker)
18. Candidate match diagnostics detail (GET /api/industry/opportunities/{id}/candidates/{student_id})
19. Candidate privacy check (no test questions or passwords exposed)
20. Candidate skill supply analytics (GET /api/industry/skills-supply)
"""

import json
import unittest
import urllib.request
import urllib.error
from typing import Tuple, Dict, Any


class TestIndustryWorkspaceEndpoints(unittest.TestCase):

    BASE_URL = "http://127.0.0.1:8001"
    created_opp_id = None

    def _request(self, method: str, path: str, data: Any = None, headers: Dict[str, str] = None) -> Tuple[int, Dict[str, Any]]:
        url = f"{self.BASE_URL}{path}"
        req_headers = {"Content-Type": "application/json"}
        if headers:
            req_headers.update(headers)

        body_bytes = json.dumps(data).encode("utf-8") if data is not None else None
        req = urllib.request.Request(url, data=body_bytes, headers=req_headers, method=method)

        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                resp_body = response.read().decode("utf-8")
                return response.status, json.loads(resp_body) if resp_body else {}
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8")
            try:
                parsed = json.loads(err_body)
            except Exception:
                parsed = {"detail": err_body}
            return e.code, parsed

    def test_01_get_industry_profile(self):
        """Test retrieving profile and stats for demo industry ind_01."""
        status_code, body = self._request("GET", "/api/industry/ind_01")
        self.assertEqual(status_code, 200)
        data = body["data"]
        self.assertEqual(data["id"], "ind_01")
        self.assertEqual(data["organizationName"], "AyurTech Innovations")
        self.assertIn("activeOpportunities", data)
        self.assertIn("totalOpportunities", data)
        self.assertIn("totalCandidatesAssessed", data)
        self.assertGreaterEqual(data["totalOpportunities"], 1)
        self.assertGreater(data["totalCandidatesAssessed"], 0)

    def test_02_get_unknown_industry_404(self):
        """Test 404 error when requesting an invalid industry ID."""
        status_code, body = self._request("GET", "/api/industry/ind_nonexistent_99")
        self.assertEqual(status_code, 404)
        self.assertIn("not found", body.get("detail", "").lower())

    def test_03_list_industry_opportunities(self):
        """Test listing opportunities for ind_01 with candidate match stats."""
        status_code, body = self._request("GET", "/api/industry/ind_01/opportunities")
        self.assertEqual(status_code, 200)
        self.assertEqual(body["status"], "success")
        self.assertGreater(body["count"], 0)
        first_opp = body["data"][0]
        self.assertIn("candidateStats", first_opp)
        self.assertIn("eligibleCandidates", first_opp["candidateStats"])
        self.assertIn("averageMatchScore", first_opp["candidateStats"])
        self.assertIn("requiredSkills", first_opp)

    def test_04_create_opportunity_valid(self):
        """Test creating a new opportunity with valid weighted skill requirements."""
        payload = {
            "industryId": "ind_01",
            "title": "Clinical Trial Associate",
            "description": "Evaluate Ayurvedic clinical trials and assist with clinical telemetry data processing.",
            "type": "INTERNSHIP",
            "location": "Bengaluru, Karnataka",
            "workMode": "HYBRID",
            "duration": "6 months",
            "stipend": "₹26,000 / month",
            "requiredSkills": [
                {"skillId": "sk_ayur_clin", "requiredProficiency": 70, "weight": 40, "mandatory": True},
                {"skillId": "sk_python", "requiredProficiency": 60, "weight": 30, "mandatory": False},
                {"skillId": "sk_biostat", "requiredProficiency": 65, "weight": 30, "mandatory": True}
            ]
        }
        status_code, body = self._request("POST", "/api/industry/opportunities", data=payload)
        self.assertEqual(status_code, 201)
        opp_data = body["data"]
        self.assertEqual(opp_data["title"], "Clinical Trial Associate")
        self.assertEqual(len(opp_data["requiredSkills"]), 3)
        TestIndustryWorkspaceEndpoints.created_opp_id = opp_data["id"]

    def test_05_create_opportunity_empty_skills_400(self):
        """Test that opportunity creation requires at least one required skill."""
        payload = {
            "industryId": "ind_01",
            "title": "Invalid Role No Skills",
            "description": "This role has no competencies attached.",
            "location": "Remote",
            "requiredSkills": []
        }
        status_code, _ = self._request("POST", "/api/industry/opportunities", data=payload)
        self.assertIn(status_code, [400, 422])

    def test_06_create_opportunity_invalid_skill_id_400(self):
        """Test rejection when specifying a skill ID that is not in the taxonomy."""
        payload = {
            "industryId": "ind_01",
            "title": "Bogus Skill Role",
            "description": "Specifying non-existent skill from nowhere.",
            "location": "Remote",
            "requiredSkills": [
                {"skillId": "sk_completely_fake", "requiredProficiency": 60, "weight": 50, "mandatory": True}
            ]
        }
        status_code, body = self._request("POST", "/api/industry/opportunities", data=payload)
        self.assertEqual(status_code, 400)
        self.assertIn("does not exist", body.get("detail", ""))

    def test_07_create_opportunity_duplicate_skills_400(self):
        """Test rejection when duplicate skill requirements are provided."""
        payload = {
            "industryId": "ind_01",
            "title": "Duplicate Skills Role",
            "description": "Specifying the same skill twice in requirements.",
            "location": "Remote",
            "requiredSkills": [
                {"skillId": "sk_sql", "requiredProficiency": 60, "weight": 50, "mandatory": True},
                {"skillId": "sk_sql", "requiredProficiency": 70, "weight": 50, "mandatory": False}
            ]
        }
        status_code, body = self._request("POST", "/api/industry/opportunities", data=payload)
        self.assertEqual(status_code, 400)
        self.assertIn("duplicate", body.get("detail", "").lower())

    def test_08_create_opportunity_invalid_proficiency_range_400(self):
        """Test rejection when proficiency is out of bounds (> 100 or < 0)."""
        payload = {
            "industryId": "ind_01",
            "title": "Out of Range Skill Role",
            "description": "Specifying proficiency beyond maximum limit.",
            "location": "Remote",
            "requiredSkills": [
                {"skillId": "sk_python", "requiredProficiency": 150, "weight": 50, "mandatory": True}
            ]
        }
        status_code, _ = self._request("POST", "/api/industry/opportunities", data=payload)
        self.assertIn(status_code, [400, 422])

    def test_09_create_opportunity_negative_weight_400(self):
        """Test rejection when skill weight is negative."""
        payload = {
            "industryId": "ind_01",
            "title": "Negative Weight Role",
            "description": "Specifying negative importance weight.",
            "location": "Remote",
            "requiredSkills": [
                {"skillId": "sk_python", "requiredProficiency": 60, "weight": -5, "mandatory": True}
            ]
        }
        status_code, _ = self._request("POST", "/api/industry/opportunities", data=payload)
        self.assertIn(status_code, [400, 422])

    def test_10_create_opportunity_unknown_industry_404(self):
        """Test rejection when industry ID does not exist."""
        payload = {
            "industryId": "ind_ghost_99",
            "title": "Ghost Role",
            "description": "Posting under a non-existent organization.",
            "location": "Remote",
            "requiredSkills": [
                {"skillId": "sk_python", "requiredProficiency": 60, "weight": 50, "mandatory": True}
            ]
        }
        status_code, body = self._request("POST", "/api/industry/opportunities", data=payload)
        self.assertEqual(status_code, 404)
        self.assertIn("does not exist", body.get("detail", ""))

    def test_11_get_opportunity_detail(self):
        """Test inspecting an opportunity with requirements and candidate metrics."""
        opp_id = TestIndustryWorkspaceEndpoints.created_opp_id or "opp_01"
        status_code, body = self._request("GET", f"/api/industry/opportunities/{opp_id}")
        self.assertEqual(status_code, 200)
        data = body["data"]
        self.assertEqual(data["id"], opp_id)
        self.assertIn("candidateStats", data)
        self.assertGreater(data["candidateStats"]["totalCandidatesAssessed"], 0)

    def test_12_update_opportunity_and_skills(self):
        """Test updating opportunity details and modifying skill requirements."""
        opp_id = TestIndustryWorkspaceEndpoints.created_opp_id or "opp_01"
        update_payload = {
            "industryId": "ind_01",
            "title": "Senior Clinical Trial Associate",
            "stipend": "₹28,000 / month",
            "requiredSkills": [
                {"skillId": "sk_ayur_clin", "requiredProficiency": 75, "weight": 50, "mandatory": True},
                {"skillId": "sk_tech_comm", "requiredProficiency": 70, "weight": 50, "mandatory": False}
            ]
        }
        status_code, body = self._request("PUT", f"/api/industry/opportunities/{opp_id}", data=update_payload)
        self.assertEqual(status_code, 200)
        data = body["data"]
        self.assertEqual(data["title"], "Senior Clinical Trial Associate")
        self.assertEqual(data["stipend"], "₹28,000 / month")
        self.assertEqual(len(data["requiredSkills"]), 2)

    def test_13_update_opportunity_authorization_403(self):
        """Test that Industry B (ind_02) cannot modify Industry A's (ind_01) opportunity."""
        opp_id = TestIndustryWorkspaceEndpoints.created_opp_id or "opp_01"
        unauthorized_payload = {
            "industryId": "ind_02",  # HealthData Labs trying to modify AyurTech's opp
            "title": "Hostile Takeover Title"
        }
        status_code, body = self._request("PUT", f"/api/industry/opportunities/{opp_id}", data=unauthorized_payload)
        self.assertEqual(status_code, 403)
        self.assertIn("not authorized", body.get("detail", "").lower())

    def test_14_close_opportunity(self):
        """Test closing an opportunity transitions status to CLOSED."""
        opp_id = TestIndustryWorkspaceEndpoints.created_opp_id or "opp_01"
        status_code, body = self._request("PATCH", f"/api/industry/opportunities/{opp_id}/close?industryId=ind_01")
        self.assertEqual(status_code, 200)
        self.assertEqual(body["opportunityStatus"], "CLOSED")

        # Verify through read endpoint
        _, read_body = self._request("GET", f"/api/industry/opportunities/{opp_id}")
        self.assertEqual(read_body["data"]["status"], "CLOSED")

    def test_15_close_opportunity_authorization_403(self):
        """Test that Industry A (ind_01) cannot close Industry B's (ind_03) opportunity."""
        status_code, body = self._request("PATCH", "/api/industry/opportunities/opp_03/close?industryId=ind_01")
        self.assertEqual(status_code, 403)
        self.assertIn("not authorized", body.get("detail", "").lower())

    def test_16_get_opportunity_candidates(self):
        """Test candidate matching evaluates all candidates using Step 5 matching engine."""
        status_code, body = self._request("GET", "/api/industry/opportunities/opp_01/candidates")
        self.assertEqual(status_code, 200)
        self.assertEqual(body["status"], "success")
        self.assertEqual(body["opportunityId"], "opp_01")
        self.assertGreater(body["totalCandidates"], 0)
        self.assertIn("candidates", body)

        top_cand = body["candidates"][0]
        self.assertIn("candidateId", top_cand)
        self.assertIn("name", top_cand)
        self.assertIn("course", top_cand)
        self.assertIn("institution", top_cand)
        self.assertIn("cgpa", top_cand)
        self.assertIn("matchScore", top_cand)
        self.assertIn("eligibility", top_cand)
        self.assertIn("skillsMet", top_cand)
        self.assertIn("mandatorySkills", top_cand)
        self.assertIn("mandatoryRequirementsMet", top_cand)

    def test_17_candidate_ranking_order(self):
        """
        Verify candidates are deterministically ranked:
        1. Match Score descending
        2. ELIGIBLE before CONDITIONAL
        3. Mandatory requirements met descending
        """
        status_code, body = self._request("GET", "/api/industry/opportunities/opp_01/candidates")
        self.assertEqual(status_code, 200)
        candidates = body["candidates"]

        for i in range(len(candidates) - 1):
            curr = candidates[i]
            nxt = candidates[i + 1]

            # Primary: Match Score descending
            if curr["matchScore"] != nxt["matchScore"]:
                self.assertGreater(curr["matchScore"], nxt["matchScore"])
            else:
                # Secondary: ELIGIBLE before CONDITIONAL
                if curr["eligibility"] != nxt["eligibility"]:
                    self.assertEqual(curr["eligibility"], "ELIGIBLE")
                    self.assertEqual(nxt["eligibility"], "CONDITIONAL")
                else:
                    # Tertiary: Mandatory met descending
                    self.assertGreaterEqual(curr["mandatoryRequirementsMet"], nxt["mandatoryRequirementsMet"])

    def test_18_get_candidate_match_detail(self):
        """Test inspecting candidate diagnostic details from industry perspective."""
        status_code, body = self._request("GET", "/api/industry/opportunities/opp_01/candidates/sp_01")
        self.assertEqual(status_code, 200)
        self.assertEqual(body["status"], "success")
        self.assertEqual(body["candidate"]["candidateId"], "sp_01")
        self.assertIn("match", body)
        match_data = body["match"]
        self.assertIn("matchScore", match_data)
        self.assertIn("skills", match_data)
        self.assertIn("explanation", match_data)
        self.assertIn("whyNot100", match_data)

    def test_19_candidate_privacy_guarantee(self):
        """Confirm candidate endpoints do not leak test questions or user credentials."""
        status_code, body = self._request("GET", "/api/industry/opportunities/opp_01/candidates/sp_01")
        self.assertEqual(status_code, 200)
        raw_text = json.dumps(body)
        self.assertNotIn("password", raw_text.lower())
        self.assertNotIn("correct_option", raw_text.lower())
        self.assertNotIn("question_text", raw_text.lower())

    def test_20_candidate_skill_supply_analytics(self):
        """Test candidate skill supply distribution endpoint."""
        status_code, body = self._request("GET", "/api/industry/skills-supply")
        self.assertEqual(status_code, 200)
        self.assertEqual(body["status"], "success")
        self.assertGreater(len(body["data"]), 0)
        first_skill = body["data"][0]
        self.assertIn("skillId", first_skill)
        self.assertIn("skillName", first_skill)
        self.assertIn("averageProficiency", first_skill)
        self.assertIn("assessedCandidateCount", first_skill)


if __name__ == "__main__":
    unittest.main()
