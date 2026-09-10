/**
 * SkillSetu - Industry Service
 * Step 7: Industry Workspace & Opportunity Management
 * 
 * Provides typed, clean access to industry endpoints:
 * - Profile and organizational summary
 * - Opportunities posted by an industry organization
 * - Creating, reading, updating, and closing opportunities
 * - Evaluating candidates using Step 5 SkillMatchingEngine
 * - Fetching candidate match diagnostics
 * - Candidate skill supply analytics
 */

import { apiClient } from './apiClient';
import {
  IndustryProfileStats,
  EnrichedIndustryOpportunity,
  OpportunityCandidatesResponse,
  OpportunityCandidateMatchDetailResponse,
  CandidateSkillSupplyItem,
  CreateOpportunityPayload
} from '../types';

export const industryService = {
  /**
   * Retrieves profile, operational stats, and candidate match counts for an industry.
   */
  async getIndustryProfile(industryId: string): Promise<IndustryProfileStats> {
    const res = await apiClient.get<{ status: string; data: IndustryProfileStats }>(
      `/api/industry/${industryId}`
    );
    return res.data;
  },

  /**
   * Lists all opportunities posted by an industry with enriched candidate metrics.
   */
  async listIndustryOpportunities(industryId: string): Promise<EnrichedIndustryOpportunity[]> {
    const res = await apiClient.get<{ status: string; data: EnrichedIndustryOpportunity[] }>(
      `/api/industry/${industryId}/opportunities`
    );
    return res.data || [];
  },

  /**
   * Fetches full opportunity details, requirements, and candidate matching stats.
   */
  async getOpportunity(opportunityId: string): Promise<EnrichedIndustryOpportunity> {
    const res = await apiClient.get<{ status: string; data: EnrichedIndustryOpportunity }>(
      `/api/industry/opportunities/${opportunityId}`
    );
    return res.data;
  },

  /**
   * Creates a new opportunity with validated multi-attribute skill requirements.
   */
  async createOpportunity(payload: CreateOpportunityPayload): Promise<EnrichedIndustryOpportunity> {
    const res = await apiClient.post<{ status: string; data: EnrichedIndustryOpportunity }>(
      '/api/industry/opportunities',
      payload
    );
    return res.data;
  },

  /**
   * Updates opportunity metadata and/or replaces skill requirements.
   */
  async updateOpportunity(
    opportunityId: string,
    payload: Partial<CreateOpportunityPayload>
  ): Promise<EnrichedIndustryOpportunity> {
    const res = await apiClient.put<{ status: string; data: EnrichedIndustryOpportunity }>(
      `/api/industry/opportunities/${opportunityId}`,
      payload
    );
    return res.data;
  },

  /**
   * Closes an opportunity.
   */
  async closeOpportunity(opportunityId: string, industryId: string): Promise<void> {
    await apiClient.patch(`/api/industry/opportunities/${opportunityId}/close?industryId=${industryId}`);
  },

  /**
   * Retrieves candidates evaluated and ranked by the authoritative Step 5 SkillMatchingEngine.
   */
  async getOpportunityCandidates(opportunityId: string): Promise<OpportunityCandidatesResponse> {
    return apiClient.get<OpportunityCandidatesResponse>(
      `/api/industry/opportunities/${opportunityId}/candidates`
    );
  },

  /**
   * Retrieves deep explainable match diagnostics for a single candidate.
   */
  async getCandidateMatchDetail(
    opportunityId: string,
    studentId: string
  ): Promise<OpportunityCandidateMatchDetailResponse> {
    return apiClient.get<OpportunityCandidateMatchDetailResponse>(
      `/api/industry/opportunities/${opportunityId}/candidates/${studentId}`
    );
  },

  /**
   * Retrieves candidate skill supply analytics across all assessed students.
   */
  async getCandidateSkillSupply(): Promise<CandidateSkillSupplyItem[]> {
    const res = await apiClient.get<{ status: string; data: CandidateSkillSupplyItem[] }>(
      '/api/industry/skills-supply'
    );
    return res.data || [];
  }
};
