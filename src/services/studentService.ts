/**
 * SkillSetu - Student Service Layer
 * Step 3: Student Module & Skill Profile
 * 
 * Centralized API integration for student data, skill profiles, and opportunities.
 */

import { apiClient } from './apiClient';
import { 
  StudentFullProfile, 
  StudentSkillsResponse, 
  Opportunity, 
  OpportunityDetail,
  StudentSummary
} from '../types';

const ACTIVE_STUDENT_STORAGE_KEY = 'skillsetu_active_student_id';
export const DEFAULT_DEMO_STUDENT_ID = 'sp_01'; // Aarav Sharma (AIIA BAMS Health Informatics)

export const studentService = {
  // Demo Student Configuration
  getActiveStudentId: (): string => {
    try {
      const stored = localStorage.getItem(ACTIVE_STUDENT_STORAGE_KEY);
      return stored || DEFAULT_DEMO_STUDENT_ID;
    } catch {
      return DEFAULT_DEMO_STUDENT_ID;
    }
  },

  setActiveStudentId: (studentId: string): void => {
    try {
      localStorage.setItem(ACTIVE_STUDENT_STORAGE_KEY, studentId);
      window.dispatchEvent(new Event('skillsetu_active_student_changed'));
    } catch (e) {
      console.error('Failed to set active demo student:', e);
    }
  },

  // API Methods
  getAllStudents: async (): Promise<StudentSummary[]> => {
    const res = await apiClient.get<{ count: number; data: StudentSummary[] }>('/api/students');
    return res.data;
  },

  getStudentById: async (studentId?: string): Promise<StudentFullProfile> => {
    const id = studentId || studentService.getActiveStudentId();
    const res = await apiClient.get<{ status: string; data: StudentFullProfile }>(`/api/students/${id}`);
    return res.data;
  },

  getStudentProfile: async (studentId?: string): Promise<StudentFullProfile> => {
    const id = studentId || studentService.getActiveStudentId();
    const res = await apiClient.get<{ status: string; data: StudentFullProfile }>(`/api/students/${id}/profile`);
    return res.data;
  },

  getStudentSkills: async (studentId?: string): Promise<StudentSkillsResponse> => {
    const id = studentId || studentService.getActiveStudentId();
    const res = await apiClient.get<{ status: string; data: StudentSkillsResponse }>(`/api/students/${id}/skills`);
    return res.data;
  },

  getOpportunities: async (): Promise<Opportunity[]> => {
    const res = await apiClient.get<{ count: number; data: Opportunity[] }>('/api/opportunities');
    return res.data;
  },

  getOpportunityById: async (opportunityId: string): Promise<OpportunityDetail> => {
    const res = await apiClient.get<{ status: string; data: OpportunityDetail }>(`/api/opportunities/${opportunityId}`);
    return res.data;
  }
};
