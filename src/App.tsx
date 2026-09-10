/**
 * SkillSetu (कौशल सेतु) - Main Application Component
 * Problem Statement ID: 26044 | Ministry of Ayush - AIIA
 * Step 1, Step 2 & Step 3: Project Foundation, Seeded Database & Student Module
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';

// Student Workspace Pages (Step 3 & Step 4 & Step 8)
import { StudentDashboardPage } from './pages/student/StudentDashboardPage';
import { StudentProfilePage } from './pages/student/StudentProfilePage';
import { StudentSkillsPage } from './pages/student/StudentSkillsPage';
import { StudentOpportunitiesPage } from './pages/student/StudentOpportunitiesPage';
import { StudentOpportunityDetailPage } from './pages/student/StudentOpportunityDetailPage';
import { StudentAssessmentPage } from './pages/student/StudentAssessmentPage';
import { StudentAssessmentResultPage } from './pages/student/StudentAssessmentResultPage';
import { StudentApplicationsPage } from './pages/student/StudentApplicationsPage';

// Placeholder Pages for Subsequent Steps (Preserved)
import { NotFoundPage } from './pages/NotFoundPage';

// Step 9: Institution Workspace Pages
import { InstitutionDashboardPage } from './pages/institution/InstitutionDashboardPage';
import { InstitutionSkillsPage } from './pages/institution/InstitutionSkillsPage';
import { InstitutionGapsPage } from './pages/institution/InstitutionGapsPage';
import { InstitutionStudentsPage } from './pages/institution/InstitutionStudentsPage';
import { InstitutionApplicationsPage } from './pages/institution/InstitutionApplicationsPage';

// Step 7 & 8 Industry Workspace Pages & Provider
import { IndustryProvider } from './context/IndustryContext';
import { IndustryDashboardPage } from './pages/industry/IndustryDashboardPage';
import { IndustryOpportunitiesPage } from './pages/industry/IndustryOpportunitiesPage';
import { IndustryCreateOpportunityPage } from './pages/industry/IndustryCreateOpportunityPage';
import { IndustryEditOpportunityPage } from './pages/industry/IndustryEditOpportunityPage';
import { IndustryOpportunityDetailPage } from './pages/industry/IndustryOpportunityDetailPage';
import { IndustryOpportunityCandidatesPage } from './pages/industry/IndustryOpportunityCandidatesPage';
import { IndustryOpportunityApplicantsPage } from './pages/industry/IndustryOpportunityApplicantsPage';

export default function App() {
  return (
    <ErrorBoundary>
      <IndustryProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<HomePage />} />
              <Route path="login" element={<LoginPage />} />

              {/* Student Workspace Routes (Step 3 & Step 4) */}
              <Route path="student" element={<StudentDashboardPage />} />
              <Route path="student/profile" element={<StudentProfilePage />} />
              <Route path="student/skills" element={<StudentSkillsPage />} />
              <Route path="student/assessment" element={<StudentAssessmentPage />} />
              <Route path="student/assessment/result" element={<StudentAssessmentResultPage />} />
              <Route path="student/opportunities" element={<StudentOpportunitiesPage />} />
              <Route path="student/opportunities/:id" element={<StudentOpportunityDetailPage />} />
              <Route path="student/assessment-placeholder" element={<Navigate to="/student/assessment" replace />} />
              <Route path="student/applications" element={<StudentApplicationsPage />} />

              {/* Step 7 & 8 Industry Workspace Routes */}
              <Route path="industry" element={<IndustryDashboardPage />} />
              <Route path="industry/opportunities" element={<IndustryOpportunitiesPage />} />
              <Route path="industry/opportunities/new" element={<IndustryCreateOpportunityPage />} />
              <Route path="industry/opportunities/:id" element={<IndustryOpportunityDetailPage />} />
              <Route path="industry/opportunities/:id/edit" element={<IndustryEditOpportunityPage />} />
              <Route path="industry/opportunities/:id/candidates" element={<IndustryOpportunityCandidatesPage />} />
              <Route path="industry/opportunities/:id/applicants" element={<IndustryOpportunityApplicantsPage />} />

              {/* Step 9 Institution Workspace Routes */}
              <Route path="institution" element={<InstitutionDashboardPage />} />
              <Route path="institution/skills" element={<InstitutionSkillsPage />} />
              <Route path="institution/gaps" element={<InstitutionGapsPage />} />
              <Route path="institution/students" element={<InstitutionStudentsPage />} />
              <Route path="institution/applications" element={<InstitutionApplicationsPage />} />

              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </IndustryProvider>
    </ErrorBoundary>
  );
}
