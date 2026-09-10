/**
 * SkillSetu - Institution Executive Dashboard
 * Step 9: Institution Dashboard + Skill Intelligence
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Award, 
  Briefcase, 
  TrendingUp, 
  AlertTriangle, 
  ArrowRight, 
  RefreshCw,
  Clock,
  CheckCircle2,
  Layers,
  FileCheck
} from 'lucide-react';
import { InstitutionHeader } from '../../components/institution/InstitutionHeader';
import { SupplyDemandComparisonChart } from '../../components/institution/SupplyDemandComparisonChart';
import { ReadinessDistributionChart } from '../../components/institution/ReadinessDistributionChart';
import { TopSkillGapsList } from '../../components/institution/TopSkillGapsList';
import { StudentDetailModal } from '../../components/institution/StudentDetailModal';
import { institutionService, DEFAULT_INSTITUTION_ID } from '../../services/institutionService';
import { InstitutionDashboardData } from '../../types';

export const InstitutionDashboardPage: React.FC = () => {
  const [data, setData] = useState<InstitutionDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await institutionService.getDashboard(DEFAULT_INSTITUTION_ID);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load institution intelligence');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      {/* Header & Tabs */}
      <InstitutionHeader
        institutionName={data?.institution?.name}
        location={data?.institution?.location}
        totalStudents={data?.kpis?.totalStudents}
        opportunityReadinessIndex={data?.kpis?.opportunityReadinessIndex}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Loading State */}
        {loading && (
          <div className="py-24 text-center text-slate-500 text-xs flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-teal-800 border-t-transparent rounded-full animate-spin"></div>
            <span className="font-medium text-slate-600">
              Aggregating verified cohort skill scores and industry demand...
            </span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadDashboard}
              className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded-md font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {data && !loading && (
          <>
            {/* Macro KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Enrolled & Assessed */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Cohort Enrolled</span>
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-slate-900">
                    {data.kpis.totalStudents}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Students</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5 pt-2 border-t border-slate-100">
                  <span className="font-semibold text-teal-800">{data.kpis.assessedStudentsCount}</span>
                  <span>standardized assessments verified</span>
                </div>
              </div>

              {/* Average Skill Quotient */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Average Skill Quotient</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-slate-900">
                    {data.kpis.averageSkillQuotient}%
                  </span>
                  <span className="text-xs text-emerald-600 font-semibold">Cohort Mean</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5 pt-2 border-t border-slate-100">
                  <span>Across clinical, lab & informatics skills</span>
                </div>
              </div>

              {/* Opportunity Readiness Index */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Readiness Index</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-emerald-700">
                    {data.kpis.opportunityReadinessIndex}%
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    ({data.readinessSummary.readyCount}/{data.kpis.totalStudents} ready)
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5 pt-2 border-t border-slate-100">
                  <span className="text-emerald-700 font-semibold">{data.readinessSummary.developingCount}</span>
                  <span>students within developing tier</span>
                </div>
              </div>

              {/* Placement & Applications */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Placement Pipeline</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                    <Briefcase className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-slate-900">
                    {data.kpis.totalApplications}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Applications</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5 pt-2 border-t border-slate-100">
                  <span className="font-semibold text-emerald-700">
                    {data.kpis.shortlistedApplications} Shortlisted
                  </span>
                  <span className="text-slate-300">•</span>
                  <span>{data.kpis.underReviewApplications} Under Review</span>
                </div>
              </div>
            </div>

            {/* Charts Section: Supply vs Demand & Cohort Readiness */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Supply vs Demand Comparison */}
              <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span>Curriculum Supply vs. Industry Demand</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Comparing AIIA student assessed proficiency against active industry minimums
                    </p>
                  </div>
                  <Link
                    to="/institution/gaps"
                    className="text-xs font-semibold text-teal-800 hover:text-teal-950 flex items-center gap-1"
                  >
                    <span>Full Matrix</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <SupplyDemandComparisonChart data={data.gapSummary.topSkillGaps} />
              </div>

              {/* Cohort Readiness Distribution */}
              <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Placement Readiness Tiers</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Categorization of student cohort for opportunity matching
                      </p>
                    </div>
                    <Link
                      to="/institution/students"
                      className="text-xs font-semibold text-teal-800 hover:text-teal-950 flex items-center gap-1"
                    >
                      <span>Roster</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <ReadinessDistributionChart
                    distribution={data.readinessSummary.distribution}
                    totalStudents={data.kpis.totalStudents}
                    readyCount={data.readinessSummary.readyCount}
                    developingCount={data.readinessSummary.developingCount}
                    needsImprovementCount={data.readinessSummary.needsImprovementCount}
                    pendingAssessmentCount={data.readinessSummary.pendingAssessmentCount}
                    opportunityReadinessIndex={data.kpis.opportunityReadinessIndex}
                  />
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl">
                  <span className="font-medium">Diagnostic Action:</span>
                  <span className="text-[11px] text-slate-500">
                    {data.readinessSummary.pendingAssessmentCount} students require initial benchmark assessment
                  </span>
                </div>
              </div>
            </div>

            {/* Top Skill Gaps & Curriculum Recommendations */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Priority Skill Shortages & Targeted Interventions</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Deterministic gaps sorted by market demand intensity, mandatory weighting, and magnitude
                  </p>
                </div>
                <Link
                  to="/institution/gaps"
                  className="text-xs font-semibold text-teal-800 hover:text-teal-950 flex items-center gap-1"
                >
                  <span>View All {data.gapSummary.topSkillGaps.length} Gaps</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <TopSkillGapsList gaps={data.gapSummary.topSkillGaps} limit={4} />
            </div>

            {/* Recent Application Snapshots */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-teal-700" />
                    <span>Recent Student Applications & Match Snapshots</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live tracking of AIIA candidates across industry postings
                  </p>
                </div>
                <Link
                  to="/institution/applications"
                  className="text-xs font-semibold text-teal-800 hover:text-teal-950 flex items-center gap-1"
                >
                  <span>View Pipeline</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {data.recentApplications.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
                  No active student applications recorded yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {data.recentApplications.map((app) => (
                    <div
                      key={app.applicationId}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <button
                            onClick={() => setSelectedStudentId(app.studentId)}
                            className="font-bold text-teal-800 hover:underline text-left truncate max-w-[160px]"
                          >
                            {app.studentName}
                          </button>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              app.status === 'SHORTLISTED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : app.status === 'UNDER_REVIEW'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : app.status === 'APPLIED'
                                ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {app.status}
                          </span>
                        </div>
                        <div className="text-xs font-medium text-slate-800 truncate" title={app.opportunityTitle}>
                          {app.opportunityTitle}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Applied: {new Date(app.appliedAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Match Score Snapshot:</span>
                        <span className="font-mono font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          {app.matchScoreSnapshot}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Student Academic Detail Modal */}
      <StudentDetailModal
        studentId={selectedStudentId}
        onClose={() => setSelectedStudentId(null)}
        institutionId={DEFAULT_INSTITUTION_ID}
      />
    </div>
  );
};
