/**
 * SkillSetu - Institution & Academia Service Layer
 * Step 9: Institution Dashboard + Skill Intelligence
 * 
 * Centralized API integration for:
 * - Macro institutional KPIs & application metrics
 * - Student skill supply analytics
 * - Industry skill demand intelligence
 * - Deterministic Supply vs. Demand matrix & skill gaps
 * - Student readiness distribution
 * - Read-only student profile analytical view
 */

import { apiClient } from './apiClient';
import {
  InstitutionDashboardData,
  SkillSupplyResponse,
  SkillDemandResponse,
  SkillGapsResponse,
  StudentReadinessResponse,
  InstitutionStudentDetail,
  InstitutionApplicationsResponse,
} from '../types';

export const DEFAULT_INSTITUTION_ID = 'inst_aiia'; // All India Institute of Ayurveda (AIIA)

export const institutionService = {
  /**
   * Fetches macro dashboard KPIs, readiness summary, top priority gaps, and recent applications.
   */
  getDashboard: async (institutionId: string = DEFAULT_INSTITUTION_ID): Promise<InstitutionDashboardData> => {
    const res = await apiClient.get<{ status: string; data: InstitutionDashboardData }>(
      `/api/institution/${institutionId}/dashboard`
    );
    return res.data;
  },

  /**
   * Fetches student skill supply distribution (assessed count, average proficiency, strong/developing/needs improvement).
   */
  getSkillSupply: async (institutionId: string = DEFAULT_INSTITUTION_ID): Promise<SkillSupplyResponse> => {
    const res = await apiClient.get<{ status: string; data: SkillSupplyResponse }>(
      `/api/institution/${institutionId}/skill-supply`
    );
    return res.data;
  },

  /**
   * Fetches industry skill demand across open opportunities.
   */
  getSkillDemand: async (institutionId: string = DEFAULT_INSTITUTION_ID): Promise<SkillDemandResponse> => {
    const res = await apiClient.get<{ status: string; data: SkillDemandResponse }>(
      `/api/institution/${institutionId}/skill-demand`
    );
    return res.data;
  },

  /**
   * Fetches deterministic supply-vs-demand comparison, skill gap classifications, and priority rankings.
   */
  getSkillGaps: async (institutionId: string = DEFAULT_INSTITUTION_ID): Promise<SkillGapsResponse> => {
    const res = await apiClient.get<{ status: string; data: SkillGapsResponse }>(
      `/api/institution/${institutionId}/skill-gaps`
    );
    return res.data;
  },

  /**
   * Fetches student opportunity readiness intelligence and cohort distribution.
   */
  getStudentReadiness: async (institutionId: string = DEFAULT_INSTITUTION_ID): Promise<StudentReadinessResponse> => {
    const res = await apiClient.get<{ status: string; data: StudentReadinessResponse }>(
      `/api/institution/${institutionId}/student-readiness`
    );
    return res.data;
  },

  /**
   * Fetches read-only detailed analytical student view for an institution.
   */
  getStudentDetail: async (
    studentId: string,
    institutionId: string = DEFAULT_INSTITUTION_ID
  ): Promise<InstitutionStudentDetail> => {
    const res = await apiClient.get<{ status: string; data: InstitutionStudentDetail }>(
      `/api/institution/${institutionId}/students/${studentId}`
    );
    return res.data;
  },

  /**
   * Fetches all applications submitted by students belonging to the institution.
   */
  getApplications: async (institutionId: string = DEFAULT_INSTITUTION_ID): Promise<InstitutionApplicationsResponse> => {
    const res = await apiClient.get<{ status: string; data: InstitutionApplicationsResponse }>(
      `/api/institution/${institutionId}/applications`
    );
    return res.data;
  },
};
