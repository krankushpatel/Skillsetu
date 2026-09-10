/**
 * SkillSetu - Institution Applications Pipeline Page
 * Step 9: Institution Dashboard + Skill Intelligence
 */

import React, { useEffect, useState, useMemo } from 'react';
import { 
  Briefcase, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Eye, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { InstitutionHeader } from '../../components/institution/InstitutionHeader';
import { StudentDetailModal } from '../../components/institution/StudentDetailModal';
import { institutionService, DEFAULT_INSTITUTION_ID } from '../../services/institutionService';
import { InstitutionApplicationsResponse } from '../../types';

export const InstitutionApplicationsPage: React.FC = () => {
  const [data, setData] = useState<InstitutionApplicationsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    institutionService.getApplications(DEFAULT_INSTITUTION_ID)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load applications pipeline');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredApplications = useMemo(() => {
    if (!data) return [];
    return data.applications.filter((a) => {
      const matchesSearch =
        a.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.opportunityTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.organizationName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = selectedStatus === 'ALL' || a.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [data, searchTerm, selectedStatus]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SHORTLISTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Shortlisted
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            Under Review
          </span>
        );
      case 'APPLIED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            Applied
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Rejected
          </span>
        );
      case 'WITHDRAWN':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            Withdrawn
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      <InstitutionHeader institutionName={data?.institutionName} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Intro & Status KPI Cards */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-teal-700" />
              <span>Cohort Placement & Internship Applications</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Track student applications across industry partners with immutable Step 8 historical match snapshots.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Total</div>
              <div className="text-base font-bold font-mono text-slate-900">{data?.totalApplications || 0}</div>
            </div>
            <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
              <div className="text-[10px] font-bold text-emerald-700 uppercase">Shortlisted</div>
              <div className="text-base font-bold font-mono text-emerald-900">{data?.statusCounts?.SHORTLISTED || 0}</div>
            </div>
            <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <div className="text-[10px] font-bold text-blue-700 uppercase">Reviewing</div>
              <div className="text-base font-bold font-mono text-blue-900">{data?.statusCounts?.UNDER_REVIEW || 0}</div>
            </div>
            <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-center">
              <div className="text-[10px] font-bold text-slate-600 uppercase">Applied</div>
              <div className="text-base font-bold font-mono text-slate-800">{data?.statusCounts?.APPLIED || 0}</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student, opportunity, org..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-700"
            />
          </div>

          <div className="w-full sm:w-auto">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="ALL">All Application Statuses</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPLIED">Applied</option>
              <option value="REJECTED">Rejected</option>
              <option value="WITHDRAWN">Withdrawn</option>
            </select>
          </div>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="py-20 text-center text-xs text-slate-500">
            <div className="w-6 h-6 border-2 border-teal-800 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading cohort applications pipeline...
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs">
            {error}
          </div>
        )}

        {/* Applications Table */}
        {!loading && data && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Opportunity & Partner</th>
                    <th className="py-3 px-4 text-center">Score Snapshot</th>
                    <th className="py-3 px-4">Eligibility</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Applied Date</th>
                    <th className="py-3 px-4 text-right">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredApplications.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                        No applications matched the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredApplications.map((app) => (
                      <tr
                        key={app.applicationId}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => setSelectedStudentId(app.studentId)}
                            className="font-semibold text-slate-900 hover:text-teal-800 hover:underline text-left block"
                          >
                            {app.studentName}
                          </button>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{app.opportunityTitle}</div>
                          <div className="text-[11px] text-slate-500">{app.organizationName}</div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {app.matchScoreSnapshot}%
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="text-[11px] font-medium text-slate-700">
                            {app.eligibilitySnapshot || 'ELIGIBLE'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          {getStatusBadge(app.status)}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                          {new Date(app.appliedAt).toLocaleDateString()}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedStudentId(app.studentId)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-teal-800 hover:bg-teal-50 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Audit</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
              Showing <strong>{filteredApplications.length}</strong> of <strong>{data.totalApplications}</strong> cohort applications
            </div>
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
