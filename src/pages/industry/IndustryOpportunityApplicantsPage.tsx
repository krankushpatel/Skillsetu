/**
 * SkillSetu - Opportunity Applicants Review Pipeline
 * Step 8 & 10: Recruiter Candidate Management & Status Transitions
 *
 * Route: `/industry/opportunities/:id/applicants`
 * Enables recruiters to:
 * - Review verified applicants from academic institutions (AIIA)
 * - Compare candidate match snapshot against live score
 * - Advance applicants through deterministic state machine:
 *   APPLIED -> UNDER_REVIEW -> SHORTLISTED / REJECTED
 * - Provide recruiter feedback / interview notes
 */

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Building2, 
  MapPin, 
  Briefcase, 
  ChevronRight, 
  Search, 
  Filter, 
  ShieldCheck, 
  Check, 
  X, 
  UserCheck, 
  UserX, 
  Eye, 
  MessageSquare,
  GraduationCap,
  Calendar,
  Layers,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { IndustryHeader } from '../../components/industry/IndustryHeader';
import { CandidateDetailModal } from '../../components/industry/CandidateDetailModal';
import { applicationService } from '../../services/applicationService';
import { industryService } from '../../services/industryService';
import { 
  OpportunityApplicantsResponse, 
  OpportunityApplicantItem, 
  ApplicationStatus 
} from '../../types';

export const IndustryOpportunityApplicantsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [response, setResponse] = useState<OpportunityApplicantsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [eligibilityFilter, setEligibilityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Status Action Modal State
  const [activeActionApplicant, setActiveActionApplicant] = useState<OpportunityApplicantItem | null>(null);
  const [targetStatus, setTargetStatus] = useState<'UNDER_REVIEW' | 'SHORTLISTED' | 'REJECTED' | null>(null);
  const [recruiterNote, setRecruiterNote] = useState<string>('');
  const [actionSubmitting, setActionSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Inspect Candidate Diagnostics Modal
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  const fetchApplicants = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await applicationService.getOpportunityApplicants(
        id,
        eligibilityFilter !== 'ALL' ? eligibilityFilter : undefined
      );
      setResponse(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load applicants for this opportunity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, [id, eligibilityFilter]);

  const handleStatusUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeActionApplicant || !targetStatus) return;

    setActionSubmitting(true);
    setActionError(null);
    try {
      await applicationService.updateApplicantStatus(activeActionApplicant.applicationId, {
        status: targetStatus,
        recruiterNote: recruiterNote.trim() || undefined
      });

      setActiveActionApplicant(null);
      setTargetStatus(null);
      setRecruiterNote('');
      await fetchApplicants();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to update application status.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const applicants = response?.applicants || [];
  const opportunity = response?.opportunity;
  const summary = response?.summary || {
    total: 0,
    applied: 0,
    underReview: 0,
    shortlisted: 0,
    rejected: 0,
    withdrawn: 0
  };

  const filteredApplicants = applicants.filter((applicant) => {
    const matchesStatus = statusFilter === 'ALL' || applicant.status === statusFilter;
    const matchesSearch = 
      applicant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      applicant.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
      applicant.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      applicant.institution.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

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
          label: 'Under Review',
          dot: 'bg-blue-500'
        };
      case 'APPLIED':
        return {
          bg: 'bg-amber-50 text-amber-900 border-amber-300',
          label: 'Newly Applied',
          dot: 'bg-amber-500'
        };
      case 'WITHDRAWN':
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
          label: 'Candidate Withdrawn',
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
      <IndustryHeader activeTab="opportunities" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/industry/opportunities" className="hover:text-slate-800 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Opportunities</span>
          </Link>
          <span>/</span>
          {id && (
            <Link to={`/industry/opportunities/${id}`} className="hover:text-slate-800">
              {opportunity?.title || 'Details'}
            </Link>
          )}
          <span>/</span>
          <span className="text-slate-800 font-medium">Applicant Pipeline</span>
        </div>

        {/* Opportunity & Recruiter Pipeline Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                {opportunity?.type || 'Internship'}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                {opportunity?.status || 'OPEN'}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500">
                AIIA Academic Placement Pipeline
              </span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {opportunity?.title || 'Opportunity'} — Applicants
            </h1>

            <p className="text-xs text-slate-500">
              Review candidates who actively dispatched their applications with verified match scores.
            </p>
          </div>

          {/* View Switcher: Ranked Matches vs Submitted Applicants */}
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl self-start md:self-auto shrink-0">
            <Link
              to={`/industry/opportunities/${id}/candidates`}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
            >
              Candidate Pool (All Matches)
            </Link>
            <span className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white text-teal-900 shadow-xs">
              Applicants ({summary.total})
            </span>
          </div>
        </div>

        {/* Pipeline Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Applicants
            </span>
            <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
              {summary.total}
            </span>
            <span className="text-[10px] text-slate-500">Submitted candidates</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs">
            <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">
              Newly Applied
            </span>
            <span className="text-2xl font-black text-amber-900 font-mono mt-1 block">
              {summary.applied}
            </span>
            <span className="text-[10px] text-amber-700">Awaiting screening</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs">
            <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">
              Under Review
            </span>
            <span className="text-2xl font-black text-blue-900 font-mono mt-1 block">
              {summary.underReview}
            </span>
            <span className="text-[10px] text-blue-600">Active evaluation</span>
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

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Withdrawn / Rejected
            </span>
            <span className="text-2xl font-black text-slate-700 font-mono mt-1 block">
              {summary.withdrawn + summary.rejected}
            </span>
            <span className="text-[10px] text-slate-500">
              {summary.withdrawn} withdrawn • {summary.rejected} rejected
            </span>
          </div>
        </div>

        {/* Toolbar: Filters & Search */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            {[
              { id: 'ALL', label: `All (${applicants.length})` },
              { id: 'APPLIED', label: `Applied (${summary.applied})` },
              { id: 'UNDER_REVIEW', label: `Under Review (${summary.underReview})` },
              { id: 'SHORTLISTED', label: `Shortlisted (${summary.shortlisted})` },
              { id: 'REJECTED', label: `Rejected (${summary.rejected})` },
              { id: 'WITHDRAWN', label: `Withdrawn (${summary.withdrawn})` }
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
              placeholder="Search candidate, course, batch..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-700"
            />
          </div>
        </div>

        {/* Applicants List */}
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-teal-800 border-t-transparent animate-spin" />
            <span>Evaluating applicant records...</span>
          </div>
        ) : error ? (
          <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchApplicants}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
            >
              Retry
            </button>
          </div>
        ) : filteredApplicants.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              No applicants match this criteria
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {statusFilter !== 'ALL' || searchQuery
                ? 'No submitted applications match your active filters. Try changing or clearing filters.'
                : 'No candidates have applied for this opportunity yet. You can inspect all eligible matches in the Candidate Pool.'}
            </p>
            <div className="pt-2">
              <Link
                to={`/industry/opportunities/${id}/candidates`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs"
              >
                <span>Browse Candidate Pool</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplicants.map((applicant) => {
              const statusBadge = getStatusBadge(applicant.status);

              return (
                <div
                  key={applicant.applicationId}
                  className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs hover:border-teal-200 transition-all space-y-4"
                >
                  {/* Top Bar: Candidate Profile & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-teal-900 text-teal-100 flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                        {applicant.name.split(' ').map((n) => n[0]).join('')}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-bold text-slate-900">
                            {applicant.name}
                          </h2>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            applicant.currentEligibility === 'ELIGIBLE'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {applicant.currentEligibility === 'ELIGIBLE' ? 'Eligible' : 'Conditional Match'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-600">
                          <span className="font-semibold text-slate-800">{applicant.course}</span>
                          <span className="text-slate-300">•</span>
                          <span>{applicant.department}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-500">Batch {applicant.batch}</span>
                          <span className="text-slate-300">•</span>
                          <span className="font-mono text-slate-700">CGPA: {applicant.cgpa}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-teal-800 font-medium">{applicant.institutionShortName}</span>
                        </div>
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

                  {/* Match Snapshot vs Live Evaluation Box */}
                  <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Snapshot at Application
                      </span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-2xl font-extrabold text-slate-900 font-mono">
                          {applicant.matchScoreSnapshot}%
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200/70 text-slate-700">
                          {applicant.eligibilitySnapshot}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        Recorded {new Date(applicant.appliedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="sm:border-l border-slate-200 sm:pl-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Current Live Score
                      </span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-2xl font-extrabold text-teal-900 font-mono">
                          {applicant.currentMatchScore}%
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                          {applicant.currentEligibility}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {applicant.matchingSkillsCount} of {applicant.totalRequiredSkills} requirements met
                      </span>
                    </div>

                    <div className="sm:border-l border-slate-200 sm:pl-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Skill Progression Delta
                      </span>
                      <div className="flex items-center gap-1.5 mt-1">
                        {applicant.scoreDelta > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            <TrendingUp className="w-3.5 h-3.5" />
                            +{applicant.scoreDelta}% Score Gain
                          </span>
                        ) : applicant.scoreDelta < 0 ? (
                          <span className="text-xs font-medium text-slate-600">
                            {applicant.scoreDelta}% Delta
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-slate-600">
                            Equally aligned (0%)
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Dynamic Step 5 matching engine
                      </span>
                    </div>

                    <div className="sm:border-l border-slate-200 sm:pl-4 flex items-center">
                      <button
                        type="button"
                        onClick={() => setSelectedCandidateId(applicant.studentId)}
                        className="w-full text-center py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                        <span>Inspect Match Breakdown</span>
                      </button>
                    </div>
                  </div>

                  {/* Candidate Cover Note */}
                  {applicant.coverNote && (
                    <div className="text-xs text-slate-700 bg-teal-50/40 border border-teal-100 rounded-lg p-3">
                      <span className="font-bold text-teal-950 block mb-0.5">Candidate Statement:</span>
                      <p className="italic">"{applicant.coverNote}"</p>
                    </div>
                  )}

                  {/* Status Progression History Log */}
                  {applicant.statusHistory && applicant.statusHistory.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Application Progression Log
                      </span>
                      <div className="space-y-1">
                        {applicant.statusHistory.map((h, i) => (
                          <div key={i} className="text-[11px] text-slate-600 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                              <span className="font-semibold text-slate-800">
                                {h.status.replace('_', ' ')}
                              </span>
                              {h.actor && (
                                <span className="text-slate-400">by {h.actor}</span>
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

                  {/* Recruiter State Machine Action Bar */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-[11px] text-slate-500">
                      Applied: {new Date(applicant.appliedAt).toLocaleDateString()}
                    </div>

                    {/* Actions based on deterministic status machine */}
                    <div className="flex flex-wrap items-center gap-2">
                      {applicant.status === 'APPLIED' && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveActionApplicant(applicant);
                              setTargetStatus('UNDER_REVIEW');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-semibold border border-blue-200 transition-colors"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Move to Under Review</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveActionApplicant(applicant);
                              setTargetStatus('SHORTLISTED');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Shortlist for Interview</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveActionApplicant(applicant);
                              setTargetStatus('REJECTED');
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-rose-50 text-rose-700 text-xs font-medium transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}

                      {applicant.status === 'UNDER_REVIEW' && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveActionApplicant(applicant);
                              setTargetStatus('SHORTLISTED');
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Shortlist Candidate</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveActionApplicant(applicant);
                              setTargetStatus('REJECTED');
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-rose-50 text-rose-700 text-xs font-medium transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}

                      {applicant.status === 'SHORTLISTED' && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Candidate Shortlisted</span>
                        </span>
                      )}

                      {applicant.status === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-800 bg-rose-50 border border-rose-200 px-3 py-1 rounded-lg">
                          <X className="w-3.5 h-3.5 text-rose-600" />
                          <span>Not Selected</span>
                        </span>
                      )}

                      {applicant.status === 'WITHDRAWN' && (
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg">
                          Withdrawn by Candidate
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Recruiter Action Modal */}
      {activeActionApplicant && targetStatus && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  targetStatus === 'SHORTLISTED'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : targetStatus === 'UNDER_REVIEW'
                    ? 'bg-blue-50 text-blue-800 border border-blue-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {targetStatus === 'SHORTLISTED' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : targetStatus === 'UNDER_REVIEW' ? (
                    <Clock className="w-5 h-5" />
                  ) : (
                    <X className="w-5 h-5" />
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveActionApplicant(null);
                    setTargetStatus(null);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {targetStatus === 'SHORTLISTED'
                    ? `Shortlist ${activeActionApplicant.name}?`
                    : targetStatus === 'UNDER_REVIEW'
                    ? `Move ${activeActionApplicant.name} Under Review?`
                    : `Reject Application for ${activeActionApplicant.name}?`}
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {targetStatus === 'SHORTLISTED'
                    ? 'This will notify the student and mark the candidate as shortlisted for interviews on both Student and Institution dashboards.'
                    : targetStatus === 'UNDER_REVIEW'
                    ? 'This signals to the candidate that their academic profile and competencies are currently being assessed by the hiring team.'
                    : 'This marks the application as not selected. The candidate will see their status updated.'}
                </p>
              </div>

              <form onSubmit={handleStatusUpdateSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Recruiter Feedback / Interview Note <span className="font-normal text-slate-400">(Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={recruiterNote}
                    onChange={(e) => setRecruiterNote(e.target.value)}
                    placeholder={
                      targetStatus === 'SHORTLISTED'
                        ? 'e.g., Round 1 technical interview scheduled for Thursday 2 PM...'
                        : 'e.g., Screening BAMS informatics project credentials...'
                    }
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                    disabled={actionSubmitting}
                  />
                </div>

                {actionError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                    {actionError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveActionApplicant(null);
                      setTargetStatus(null);
                    }}
                    disabled={actionSubmitting}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionSubmitting}
                    className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-colors disabled:opacity-50 ${
                      targetStatus === 'SHORTLISTED'
                        ? 'bg-emerald-800 hover:bg-emerald-700'
                        : targetStatus === 'UNDER_REVIEW'
                        ? 'bg-blue-700 hover:bg-blue-600'
                        : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    {actionSubmitting ? 'Updating...' : `Confirm ${targetStatus.replace('_', ' ')}`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Diagnostics Modal */}
      {selectedCandidateId && id && (
        <CandidateDetailModal
          opportunityId={id}
          candidateId={selectedCandidateId}
          isOpen={Boolean(selectedCandidateId)}
          onClose={() => setSelectedCandidateId(null)}
        />
      )}
    </div>
  );
};
