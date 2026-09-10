/**
 * SkillSetu - Standardized Assessment Service
 * Step 4: Standardized Assessment Engine & Skill Scoring
 * 
 * Provides typed client integrations for:
 * - Listing standardized benchmarks
 * - Fetching assessment questions (with client-side security guarantees)
 * - Submitting candidate answers for deterministic server-authoritative scoring
 * - Retrieving evaluation results and attempt history
 */

import { apiClient } from './apiClient';
import {
  AssessmentSummary,
  AssessmentDetail,
  AssessmentAnswerSubmission,
  AssessmentSubmissionResult
} from '../types';

export const assessmentService = {
  /**
   * Retrieves all active standardized skill assessments.
   */
  getAssessments: async (): Promise<AssessmentSummary[]> => {
    const res = await apiClient.get<{ count: number; data: AssessmentSummary[] }>('/api/assessments');
    return res.data;
  },

  /**
   * Retrieves full assessment details and questions for test administration.
   * Note: The backend strictly withholds answer keys and explanations.
   */
  getAssessmentById: async (assessmentId: string): Promise<AssessmentDetail> => {
    const res = await apiClient.get<{ status: string; data: AssessmentDetail }>(`/api/assessments/${assessmentId}`);
    return res.data;
  },

  /**
   * Submits candidate answers to the backend for deterministic scoring.
   * Performs server-side scoring, updates student_skill_scores and student profile,
   * and returns full score breakdown.
   */
  submitAssessment: async (
    assessmentId: string,
    studentId: string,
    answers: AssessmentAnswerSubmission[]
  ): Promise<AssessmentSubmissionResult> => {
    const res = await apiClient.post<{ status: string; data: AssessmentSubmissionResult }>(
      `/api/assessments/${assessmentId}/submit`,
      {
        student_id: studentId,
        answers: answers
      }
    );
    return res.data;
  },

  /**
   * Retrieves the candidate's latest evaluated assessment attempt.
   */
  getLatestAssessmentResult: async (
    assessmentId: string,
    studentId: string
  ): Promise<AssessmentSubmissionResult | null> => {
    try {
      const res = await apiClient.get<{ status: string; data: AssessmentSubmissionResult }>(
        `/api/assessments/${assessmentId}/results/${studentId}`
      );
      return res.data;
    } catch {
      return null;
    }
  }
};
