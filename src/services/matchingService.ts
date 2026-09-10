/**
 * SkillSetu - Matching Service
 * Step 5: Explainable Skill Matching Engine
 * 
 * Communicates with backend endpoints:
 * - GET /api/opportunities/:id/match/:studentId (individual explainable match)
 * - GET /api/opportunities/match/:studentId (all opportunity matches for student)
 */

import { 
  OpportunityMatchDetail, 
  OpportunityMatchSummary,
  WhatIfResponse,
  SkillSimulationInput,
  OpportunityRecommendationsResponse
} from '../types';

const API_BASE = '/api';

export const matchingService = {
  /**
   * Retrieves complete explainable matching diagnostics for a single opportunity and candidate.
   */
  async getOpportunityMatch(opportunityId: string, studentId: string = 'sp_01'): Promise<OpportunityMatchDetail> {
    const res = await fetch(`${API_BASE}/opportunities/${opportunityId}/match/${studentId}`);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to fetch match diagnostics (${res.status})`);
    }
    const json = await res.json();
    return json.data;
  },

  /**
   * Batch retrieves calculated match scores for all open opportunities for a candidate.
   */
  async getAllOpportunityMatches(studentId: string = 'sp_01'): Promise<OpportunityMatchSummary[]> {
    const res = await fetch(`${API_BASE}/opportunities/match/${studentId}`);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to fetch opportunity matches (${res.status})`);
    }
    const json = await res.json();
    return json.data || [];
  },

  /**
   * Step 6: Runs in-memory What-If Skill Improvement Simulation.
   * Evaluates hypothetical proficiency targets without persisting to database.
   */
  async simulateWhatIf(
    opportunityId: string, 
    skillUpdates: SkillSimulationInput[], 
    studentId: string = 'sp_01'
  ): Promise<WhatIfResponse> {
    const res = await fetch(`${API_BASE}/opportunities/${opportunityId}/what-if/${studentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skill_updates: skillUpdates })
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to run skill simulation (${res.status})`);
    }
    const json = await res.json();
    return json.data;
  },

  /**
   * Step 6: Fetches deterministically ranked learning resources prioritized by actual skill gaps.
   */
  async getOpportunityRecommendations(
    opportunityId: string, 
    studentId: string = 'sp_01'
  ): Promise<OpportunityRecommendationsResponse> {
    const res = await fetch(`${API_BASE}/opportunities/${opportunityId}/recommendations/${studentId}`);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to fetch learning recommendations (${res.status})`);
    }
    const json = await res.json();
    return json.data;
  }
};

