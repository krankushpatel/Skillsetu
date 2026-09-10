/**
 * SkillSetu - Data Inspection Service
 * Step 2: Database Models & Seed Data Access Layer
 */

import { apiClient } from './apiClient';
import {
  Skill,
  StudentSummary,
  Industry,
  Institution,
  Opportunity,
  LearningResource,
  SeedStatusResponse,
} from '../types';

export const dataService = {
  getSkills: async (): Promise<{ count: number; data: Skill[] }> => {
    return apiClient.get<{ count: number; data: Skill[] }>('/api/skills');
  },

  getStudents: async (): Promise<{ count: number; data: StudentSummary[] }> => {
    return apiClient.get<{ count: number; data: StudentSummary[] }>('/api/students');
  },

  getIndustries: async (): Promise<{ count: number; data: Industry[] }> => {
    return apiClient.get<{ count: number; data: Industry[] }>('/api/industries');
  },

  getInstitutions: async (): Promise<{ count: number; data: Institution[] }> => {
    return apiClient.get<{ count: number; data: Institution[] }>('/api/institutions');
  },

  getOpportunities: async (): Promise<{ count: number; data: Opportunity[] }> => {
    return apiClient.get<{ count: number; data: Opportunity[] }>('/api/opportunities');
  },

  getOpportunityById: async (opportunityId: string): Promise<Opportunity> => {
    const res = await apiClient.get<{ status: string; data: Opportunity }>(`/api/opportunities/${opportunityId}`);
    return res.data;
  },

  getLearningResources: async (): Promise<{ count: number; data: LearningResource[] }> => {
    return apiClient.get<{ count: number; data: LearningResource[] }>('/api/learning-resources');
  },

  getSeedStatus: async (): Promise<SeedStatusResponse> => {
    return apiClient.get<SeedStatusResponse>('/api/seed/status');
  },
};
