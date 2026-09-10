/**
 * SkillSetu - Health Service
 * Step 1: Project Foundation
 */

import { apiClient } from './apiClient';
import { SystemHealthResponse } from '../types';

export const healthService = {
  /**
   * Fetches backend health and diagnostic info from /api/health
   */
  checkHealth: async (): Promise<SystemHealthResponse> => {
    return apiClient.get<SystemHealthResponse>('/api/health');
  },
};
