/**
 * SkillSetu - Application & Applicant Service Layer
 * Step 8 & 10: End-to-End Applications Pipeline
 *
 * Integrates candidate one-click applications, live match comparison,
 * student application tracking, and recruiter applicant status management.
 */

import { apiClient } from './apiClient';
import {
  StudentApplicationsResponse,
  CheckApplicationStatusResponse,
  CreateApplicationPayload,
  OpportunityApplicantsResponse,
  UpdateApplicationStatusPayload,
  StudentApplicationItem,
  OpportunityApplicantItem
} from '../types';

export const applicationService = {
  /**
   * Submit candidate application with authoritative match & eligibility snapshots.
   */
  submitApplication: async (payload: CreateApplicationPayload): Promise<{
    status: string;
    message: string;
    applicationId: string;
    application: any;
  }> => {
    return await apiClient.post('/api/applications', payload);
  },

  /**
   * Fetch all applications for a student, with snapshot vs live match comparison.
   */
  getStudentApplications: async (studentId: string): Promise<StudentApplicationsResponse> => {
    return await apiClient.get<StudentApplicationsResponse>(`/api/applications/student/${encodeURIComponent(studentId)}`);
  },

  /**
   * Check whether a student has applied for an opportunity.
   */
  checkApplicationStatus: async (
    studentId: string,
    opportunityId: string
  ): Promise<CheckApplicationStatusResponse> => {
    return await apiClient.get<CheckApplicationStatusResponse>(
      `/api/applications/check?studentId=${encodeURIComponent(studentId)}&opportunityId=${encodeURIComponent(opportunityId)}`
    );
  },

  /**
   * Fetch full application details by ID.
   */
  getApplicationById: async (applicationId: string): Promise<{
    status: string;
    data: StudentApplicationItem;
  }> => {
    return await apiClient.get<{ status: string; data: StudentApplicationItem }>(
      `/api/applications/${encodeURIComponent(applicationId)}`
    );
  },

  /**
   * Withdraw an active application.
   */
  withdrawApplication: async (
    applicationId: string,
    reason?: string
  ): Promise<{ status: string; message: string; data: any }> => {
    return await apiClient.patch(
      `/api/applications/${encodeURIComponent(applicationId)}/withdraw`,
      { reason: reason || 'Withdrawn by candidate' }
    );
  },

  /**
   * Recruiter: Fetch all submitted applicants for an opportunity.
   */
  getOpportunityApplicants: async (
    opportunityId: string,
    eligibility?: string
  ): Promise<OpportunityApplicantsResponse> => {
    const query = eligibility ? `?eligibility=${encodeURIComponent(eligibility)}` : '';
    return await apiClient.get<OpportunityApplicantsResponse>(
      `/api/industry/opportunities/${encodeURIComponent(opportunityId)}/applicants${query}`
    );
  },

  /**
   * Recruiter: Get single applicant detail for review.
   */
  getApplicantDetail: async (
    applicationId: string
  ): Promise<{ status: string; data: OpportunityApplicantItem & { opportunity: any; student: any } }> => {
    return await apiClient.get(`/api/industry/applications/${encodeURIComponent(applicationId)}`);
  },

  /**
   * Recruiter: Update candidate application status (UNDER_REVIEW, SHORTLISTED, REJECTED).
   */
  updateApplicantStatus: async (
    applicationId: string,
    payload: UpdateApplicationStatusPayload
  ): Promise<{
    status: string;
    message: string;
    previousStatus: string;
    newStatus: string;
    applicationId: string;
  }> => {
    return await apiClient.patch(
      `/api/industry/applications/${encodeURIComponent(applicationId)}/status`,
      payload
    );
  }
};
