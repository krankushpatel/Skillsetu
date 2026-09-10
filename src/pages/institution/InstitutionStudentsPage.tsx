/**
 * SkillSetu - Cohort Readiness & Student Roster Page
 * Step 9: Institution Dashboard + Skill Intelligence
 */

import React, { useEffect, useState } from 'react';
import { GraduationCap, Award, Clock, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';
import { InstitutionHeader } from '../../components/institution/InstitutionHeader';
import { StudentReadinessTable } from '../../components/institution/StudentReadinessTable';
import { ReadinessDistributionChart } from '../../components/institution/ReadinessDistributionChart';
import { StudentDetailModal } from '../../components/institution/StudentDetailModal';
import { institutionService, DEFAULT_INSTITUTION_ID } from '../../services/institutionService';
import { StudentReadinessResponse } from '../../types';

export const InstitutionStudentsPage: React.FC = () => {
  const [data, setData] = useState<StudentReadinessResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    institutionService.getStudentReadiness(DEFAULT_INSTITUTION_ID)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load cohort readiness data');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      <InstitutionHeader
        institutionName={data?.institutionName}
        totalStudents={data?.totalStudents}
        opportunityReadinessIndex={data?.opportunityReadinessIndex}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Intro Banner */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-teal-700" />
              <span>Student Cohort Opportunity Readiness</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Deterministic readiness categorization derived from verified assessment scores across AIIA scholars.
              Students with average skill quotient ≥70% are classified as Opportunity Ready.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
              <div className="text-[10px] font-bold text-emerald-700 uppercase">Ready</div>
              <div className="text-base font-bold font-mono text-emerald-900">{data?.readyCount || 0}</div>
            </div>
            <div className="px-3 py-1.5 bg-sky-50 border border-sky-200 rounded-lg text-center">
              <div className="text-[10px] font-bold text-sky-700 uppercase">Developing</div>
              <div className="text-base font-bold font-mono text-sky-900">{data?.developingCount || 0}</div>
            </div>
            <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-center">
              <div className="text-[10px] font-bold text-amber-700 uppercase">Needs Imp</div>
              <div className="text-base font-bold font-mono text-amber-900">{data?.needsImprovementCount || 0}</div>
            </div>
            <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-center">
              <div className="text-[10px] font-bold text-slate-600 uppercase">Pending</div>
              <div className="text-base font-bold font-mono text-slate-900">{data?.pendingAssessmentCount || 0}</div>
            </div>
          </div>
        </div>

        {/* Readiness Distribution Donut Card */}
        {data && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4">Cohort Distribution Breakdown</h3>
            <ReadinessDistributionChart
              distribution={data.distribution}
              totalStudents={data.totalStudents}
              readyCount={data.readyCount}
              developingCount={data.developingCount}
              needsImprovementCount={data.needsImprovementCount}
              pendingAssessmentCount={data.pendingAssessmentCount}
              opportunityReadinessIndex={data.opportunityReadinessIndex}
            />
          </div>
        )}

        {/* Loading / Error */}
        {loading && (
          <div className="py-20 text-center text-xs text-slate-500">
            <div className="w-6 h-6 border-2 border-teal-800 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading cohort student readiness records...
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs">
            {error}
          </div>
        )}

        {/* Student Roster Table */}
        {!loading && data && (
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-3">Enrolled Student Roster</h3>
            <StudentReadinessTable
              students={data.students}
              onSelectStudent={(id) => setSelectedStudentId(id)}
            />
          </div>
        )}
      </main>

      {/* Student Audit Detail Modal */}
      <StudentDetailModal
        studentId={selectedStudentId}
        onClose={() => setSelectedStudentId(null)}
        institutionId={DEFAULT_INSTITUTION_ID}
      />
    </div>
  );
};
