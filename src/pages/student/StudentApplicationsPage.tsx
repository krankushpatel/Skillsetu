/**
 * SkillSetu - Student Applications Tracker
 * Step 8 & 10: End-to-End Application Management
 *
 * Displays candidate's active and historical applications with:
 * - Application Status (APPLIED, UNDER_REVIEW, SHORTLISTED, REJECTED, WITHDRAWN)
 * - Match Score Snapshot (at application time) vs Current Live Match Score
 * - Status History timeline and recruiter feedback
 * - Self-service application withdrawal
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Building2, 
  MapPin, 
  Briefcase, 
  ChevronRight, 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  X, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { StudentNav } from '../../components/student/StudentNav';
import { studentService } from '../../services/studentService';
import { applicationService } from '../../services/applicationService';
import { 
  StudentApplicationsResponse, 
  StudentApplicationItem, 
  ApplicationStatus 
} from '../../types';

export const StudentApplicationsPage: React.FC = () => {
  const [activeStudentId, setActiveStudentId] = useState<string>(studentService.getActiveStudentId());
  const [studentName, setStudentName] = useState<string>('Aarav Sharma');
  const [response, setResponse] = useState<StudentApplicationsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Withdrawal modal state
  const [withdrawingApp, setWithdrawingApp] = useState<StudentApplicationItem | null>(null);
  const [withdrawReason, setWithdrawReason] = useState<string>('');
  const [withdrawSubmitting, setWithdrawSubmitting] = useState<boolean>(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const studentProfile = await studentService.getStudentById(activeStudentId).catch(() => null);
      if (studentProfile?.name) {
        setStudentName(studentProfile.name);
      }

      const res = await applicationService.getStudentApplications(activeStudentId);
      setResponse(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load applications. Please verify backend service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();

    const handleStudentChange = () => {
      const newId = studentService.getActiveStudentId();
      setActiveStudentId(newId);
    };

    window.addEventListener('skillsetu_active_student_changed', handleStudentChange);
    return () => {
      window.removeEventListener('skillsetu_active_student_changed', handleStudentChange);
    };
  }, [activeStudentId]);

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawingApp) return;

    setWithdrawSubmitting(true);
    setWithdrawError(null);
    try {
      await applicationService.withdrawApplication(
        withdrawingApp.id,
        withdrawReason.trim() || undefined
      );
      setWithdrawingApp(null);
      setWithdrawReason('');
      await fetchApplications();
    } catch (err: any) {
      setWithdrawError(err?.message || 'Failed to withdraw application.');
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  const applications = response?.data || [];

  const filteredApplications = applications.filter((app) => {
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
    const matchesSearch = 
      app.opportunityTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const summary = response?.summary || {
    applied: 0,
    underReview: 0,
    shortlisted: 0,
    rejected: 0,
    withdrawn: 0
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'SHORTLISTED':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          label: 'Shortlisted for Interview',
          dot: 'bg-emerald-500'
        };
      case 'UNDER_REVIEW':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-300',
          label: 'Under Recruiter Review',
          dot: 'bg-blue-500'
        };
      case 'APPLIED':
        return {
          bg: 'bg-amber-50 text-amber-900 border-amber-300',
          label: 'Application Dispatched',
          dot: 'bg-amber-500'
        };
      case 'WITHDRAWN':
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
          label: 'Withdrawn by Candidate',
          dot: 'bg-slate-400'
        };
      case 'REJECTED':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-300',
          label: 'Not Selected',
          dot: 'bg-rose-500'
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          label: status,
          dot: 'bg-slate-400'
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 space-y-6">
        {/* Workspace Navigation */}
        <StudentNav 
          currentStudentName={studentName}
          onStudentChange={(id) => setActiveStudentId(id)}
        />

        {/* Header Breadcrumbs & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link to="/student" className="hover:text-slate-800 flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Student Dashboard</span>
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-medium">Applications</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              My Applications & Placement Progress
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Track recruiter review status and compare match snapshot scores against your live skill profile.
            </p>
          </div>

          <Link
            to="/student/opportunities"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-center"
          >
            <Briefcase className="w-4 h-4" />
            <span>Explore More Opportunities</span>
          </Link>
        </div>

        {/* Metric Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Applied
            </span>
            <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
              {response?.totalApplications ?? 0}
            </span>
            <span className="text-[10px] text-slate-500">Submitted submissions</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs">
            <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">
              Under Review
            </span>
            <span className="text-2xl font-black text-blue-900 font-mono mt-1 block">
              {summary.underReview}
            </span>
            <span className="text-[10px] text-blue-600">Screening in progress</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
              Shortlisted
            </span>
            <span className="text-2xl font-black text-emerald-800 font-mono mt-1 block">
              {summary.shortlisted}
            </span>
            <span className="text-[10px] text-emerald-600">Interview stage</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs">
            <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">
              Applied
            </span>
            <span className="text-2xl font-black text-amber-900 font-mono mt-1 block">
              {summary.applied}
            </span>
            <span className="text-[10px] text-amber-700">Awaiting review</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Withdrawn / Other
            </span>
            <span className="text-2xl font-black text-slate-700 font-mono mt-1 block">
              {summary.withdrawn + summary.rejected}
            </span>
            <span className="text-[10px] text-slate-500">
              {summary.withdrawn} withdrawn • {summary.rejected} rejected
            </span>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            {[
              { id: 'ALL', label: `All (${applications.length})` },
              { id: 'SHORTLISTED', label: `Shortlisted (${summary.shortlisted})` },
              { id: 'UNDER_REVIEW', label: `Under Review (${summary.underReview})` },
              { id: 'APPLIED', label: `Applied (${summary.applied})` },
              { id: 'WITHDRAWN', label: `Withdrawn (${summary.withdrawn})` },
              { id: 'REJECTED', label: `Rejected (${summary.rejected})` }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-teal-800 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by opportunity or organization..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-700"
            />
          </div>
        </div>

        {/* Application List */}
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-teal-800 border-t-transparent animate-spin" />
            <span>Loading application records...</span>
          </div>
        ) : error ? (
          <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchApplications}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
            >
              Retry
            </button>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              No applications found
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {statusFilter !== 'ALL' || searchQuery
                ? 'No applications match your active filter criteria. Try clearing filters.'
                : 'You have not submitted any applications yet. Browse matched opportunities to dispatch verified applications.'}
            </p>
            <div className="pt-2">
              <Link
                to="/student/opportunities"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs"
              >
                <span>Browse Opportunities</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((app) => {
              const statusBadge = getStatusBadge(app.status);
              const scoreDelta = app.scoreDelta ?? (app.currentMatchScore - app.matchScoreSnapshot);

              return (
                <div 
                  key={app.id} 
                  className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs hover:border-teal-200 transition-all space-y-4"
                >
                  {/* Top Bar: Role & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                          {app.type}
                        </span>
                        <span className="text-[10px] font-medium text-slate-500">
                          {app.workMode}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[11px] text-slate-500">
                          Applied {new Date(app.appliedAt).toLocaleDateString()} at {new Date(app.appliedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <h2 className="text-base sm:text-lg font-bold text-slate-900">
                        {app.opportunityTitle}
                      </h2>

                      <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-600">
                        <span className="flex items-center gap-1 font-semibold text-slate-800">
                          <Building2 className="w-3.5 h-3.5 text-teal-700" />
                          {app.organizationName}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <MapPin className="w-3 h-3" />
                          {app.location}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="font-medium text-slate-800">{app.stipend}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500">{app.duration}</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusBadge.bg}`}>
                        <span className={`w-2 h-2 rounded-full ${statusBadge.dot}`} />
                        <span>{statusBadge.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* Match Snapshot vs Live Score Comparison Box */}
                  <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Match Score at Submission
                      </span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-2xl font-extrabold text-slate-900 font-mono">
                          {app.matchScoreSnapshot}%
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200/70 text-slate-700">
                          {app.eligibilitySnapshot}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">Preserved snapshot for recruiter</span>
                    </div>

                    <div className="sm:border-l border-slate-200 sm:pl-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Current Live Match
                      </span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-2xl font-extrabold text-teal-900 font-mono">
                          {app.currentMatchScore}%
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                          {app.currentEligibility}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">Based on latest skill tests</span>
                    </div>

                    <div className="sm:border-l border-slate-200 sm:pl-4 flex flex-col justify-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Profile Dynamic
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {scoreDelta > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            <TrendingUp className="w-3.5 h-3.5" />
                            +{scoreDelta}% Skill Growth
                          </span>
                        ) : scoreDelta < 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                            <TrendingDown className="w-3.5 h-3.5" />
                            {scoreDelta}% Change
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-slate-600">
                            Equally aligned (0% delta)
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1">
                        Recruiters see both snapshot & live scores
                      </span>
                    </div>
                  </div>

                  {/* Cover Note & Status History */}
                  {app.coverNote && (
                    <div className="text-xs text-slate-600 bg-teal-50/40 border border-teal-100 rounded-lg p-3">
                      <span className="font-bold text-teal-950 block mb-0.5">Your Submitted Cover Note:</span>
                      <p className="italic">"{app.coverNote}"</p>
                    </div>
                  )}

                  {/* Status History Timeline */}
                  {app.statusHistory && app.statusHistory.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Application Progression Log
                      </span>
                      <div className="space-y-1">
                        {app.statusHistory.map((h, i) => (
                          <div key={i} className="text-[11px] text-slate-600 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                              <span className="font-semibold text-slate-800">
                                {h.status.replace('_', ' ')}
                              </span>
                              {h.actor && (
                                <span className="text-slate-400">({h.actor})</span>
                              )}
                              {h.note && (
                                <span className="text-slate-500 italic">— "{h.note}"</span>
                              )}
                            </div>
                            <span className="text-slate-400 font-mono text-[10px]">
                              {new Date(h.timestamp).toLocaleDateString()} {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer Actions */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <Link
                      to={`/student/opportunities/${app.opportunityId}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800 hover:text-teal-900 transition-colors"
                    >
                      <span>Inspect Opportunity Match Breakdown</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>

                    <div className="flex items-center gap-2">
                      {app.canWithdraw && (
                        <button
                          type="button"
                          onClick={() => setWithdrawingApp(app)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 text-slate-600 text-xs font-medium transition-colors"
                        >
                          Withdraw Application
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Application Withdrawal Confirmation Modal */}
      {withdrawingApp && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <button
                  type="button"
                  onClick={() => setWithdrawingApp(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Withdraw Application?
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  You are withdrawing your application for <strong>{withdrawingApp.opportunityTitle}</strong> with <strong>{withdrawingApp.organizationName}</strong>. This informs the recruiter and releases your application slot.
                </p>
              </div>

              <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Reason for Withdrawal <span className="font-normal text-slate-400">(Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={withdrawReason}
                    onChange={(e) => setWithdrawReason(e.target.value)}
                    placeholder="e.g., Accepted another opportunity, academic scheduling conflict..."
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    disabled={withdrawSubmitting}
                  />
                </div>

                {withdrawError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                    {withdrawError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setWithdrawingApp(null)}
                    disabled={withdrawSubmitting}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={withdrawSubmitting}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {withdrawSubmitting ? 'Withdrawing...' : 'Confirm Withdrawal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
