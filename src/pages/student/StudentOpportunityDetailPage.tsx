/**
 * SkillSetu - Opportunity Detail & Explainable Match View
 * Step 5: Explainable Skill Matching Engine
 * 
 * Features:
 * - Full opportunity details and partner profile
 * - Prominent "Your Match" section with Overall Match Score (0-100%)
 * - Deterministic Eligibility determination (Eligible vs Conditional)
 * - Detailed skill-by-skill comparison table (Your Score, Required, Weight, Gap/Surplus, Status)
 * - Visual weighted contribution breakdown
 * - "Why isn't my match 100%?" diagnostic breakdown
 * - Strict Compliance: Zero LLM / generative AI, 100% deterministic mathematical evaluation
 */

import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  Clock, 
  Banknote, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink,
  ShieldCheck,
  Award,
  Layers,
  Sparkles,
  Info,
  Check,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  Send,
  FileText
} from 'lucide-react';
import { studentService } from '../../services/studentService';
import { matchingService } from '../../services/matchingService';
import { applicationService } from '../../services/applicationService';
import { StudentNav } from '../../components/student/StudentNav';
import { OpportunityDetail, OpportunityMatchDetail, CheckApplicationStatusResponse } from '../../types';
import { WhatIfSimulator } from '../../components/matching/WhatIfSimulator';
import { LearningRecommendations } from '../../components/matching/LearningRecommendations';
import { ApplyOpportunityModal } from '../../components/student/ApplyOpportunityModal';

export const StudentOpportunityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [opportunity, setOpportunity] = useState<OpportunityDetail | null>(null);
  const [matchDetail, setMatchDetail] = useState<OpportunityMatchDetail | null>(null);
  const [appStatus, setAppStatus] = useState<CheckApplicationStatusResponse | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState<boolean>(false);
  const [appliedNotification, setAppliedNotification] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [matchingLoading, setMatchingLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [externalSkillUpdate, setExternalSkillUpdate] = useState<{ skillId: string; proficiency: number } | null>(null);

  const handleSimulateGain = (skillId: string, projectedScore: number) => {
    setExternalSkillUpdate({ skillId, proficiency: projectedScore });
    const el = document.getElementById('what-if-simulation-panel');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToSection = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const activeStudentId = localStorage.getItem('skillsetu_active_student_id') || 'sp_01';

  const loadData = async (oppId: string) => {
    setLoading(true);
    setMatchingLoading(true);
    setError(null);

    try {
      // 1. Fetch opportunity details
      const oppData = await studentService.getOpportunityById(oppId);
      setOpportunity(oppData);
      setLoading(false);

      // 2. Fetch deterministic match diagnostics
      try {
        const matchData = await matchingService.getOpportunityMatch(oppId, activeStudentId);
        setMatchDetail(matchData);
      } catch (matchErr) {
        console.warn('Matching engine error:', matchErr);
      } finally {
        setMatchingLoading(false);
      }

      // 3. Check application status for active candidate
      try {
        const statusRes = await applicationService.checkApplicationStatus(activeStudentId, oppId);
        setAppStatus(statusRes);
      } catch (statusErr) {
        console.warn('Could not check application status:', statusErr);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load opportunity details');
      setLoading(false);
      setMatchingLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    loadData(id);

    const handleStudentChange = () => {
      loadData(id);
    };

    window.addEventListener('skillsetu_active_student_changed', handleStudentChange);
    return () => {
      window.removeEventListener('skillsetu_active_student_changed', handleStudentChange);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 rounded mb-6" />
        <div className="h-48 bg-slate-200 rounded-2xl mb-8" />
        <div className="h-64 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-rose-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-rose-900 mb-1">Opportunity Not Found</h2>
          <p className="text-xs text-rose-700 mb-5">{error || 'The requested opportunity record does not exist.'}</p>
          <button
            onClick={() => navigate('/student/opportunities')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Opportunities</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <StudentNav />

      {/* Back Link */}
      <Link
        to="/student/opportunities"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Available Opportunities</span>
      </Link>

      {/* Hero Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200 uppercase tracking-wider">
              {opportunity.type}
            </span>
            <span className="px-2.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
              {opportunity.workMode}
            </span>
            <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              Status: {opportunity.status}
            </span>
          </div>

          <span className="text-[11px] text-slate-400 font-mono">
            ID: {opportunity.id}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
          {opportunity.title}
        </h1>

        <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-600 mb-6 flex-wrap">
          <span className="flex items-center gap-1 font-semibold text-slate-800">
            <Building2 className="w-4 h-4 text-teal-700" />
            <span>{opportunity.organizationName}</span>
          </span>
          <span>•</span>
          <span className="text-slate-500">{opportunity.industryType || 'HealthTech & Ayush Enterprise'}</span>
          <span>•</span>
          <span className="flex items-center gap-1 text-slate-500">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{opportunity.location}</span>
          </span>
        </div>

        {/* Quick Details Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Monthly Stipend</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">{opportunity.stipend}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Duration</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">{opportunity.duration}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Location</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">{opportunity.location}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Work Mode</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">{opportunity.workMode}</span>
          </div>
        </div>

        {/* Application Status / Action Banner */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {appStatus?.hasApplied ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full bg-teal-50/70 border border-teal-200 rounded-xl p-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-800 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-teal-950">
                      Application Submitted
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      appStatus.application?.status === 'SHORTLISTED'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : appStatus.application?.status === 'UNDER_REVIEW'
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : appStatus.application?.status === 'REJECTED'
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}>
                      Status: {appStatus.application?.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-teal-800 mt-0.5">
                    Applied on {appStatus.application?.appliedAt ? new Date(appStatus.application.appliedAt).toLocaleDateString() : 'recently'} • Snapshot Match: {appStatus.application?.matchScoreSnapshot}%
                  </p>
                </div>
              </div>

              <Link
                to="/student/applications"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-teal-800 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Track in Applications</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Ready to apply for this opportunity?
                </span>
                <span className="text-[11px] text-slate-500">
                  Your current readiness profile and live match score ({matchDetail ? `${matchDetail.matchScore}%` : 'calculated'}) will be submitted for recruiter review.
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsApplyModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-colors shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Apply for Opportunity</span>
              </button>
            </div>
          )}
        </div>

        {/* Application Success Toast */}
        {appliedNotification && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-2 animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{appliedNotification}</span>
            </div>
            <Link
              to="/student/applications"
              className="font-bold underline hover:text-emerald-950 shrink-0"
            >
              View Application →
            </Link>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 8, 9, 10, 11: YOUR MATCH (PROMINENT DETERMINISTIC MATCH ENGINE)   */}
      {/* ========================================================================= */}
      {matchDetail && (
        <section className="bg-white border-2 border-teal-700/30 rounded-2xl p-6 sm:p-8 shadow-sm mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Section Heading & Subtitle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200 mb-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Step 5 • Deterministic Matching Engine</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Your Match
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluated deterministically from your latest Assessed Skill Scores against organization requirements.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Overall Match Score</span>
                <span className="text-xs text-slate-400">{matchDetail.summary.skillsMet} of {matchDetail.summary.requiredSkills} skills met</span>
              </div>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl border shadow-inner ${
                matchDetail.matchScore >= 80 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                  : matchDetail.matchScore >= 60 
                    ? 'bg-teal-50 text-teal-900 border-teal-300' 
                    : 'bg-amber-50 text-amber-900 border-amber-300'
              }`}>
                {matchDetail.matchScore}%
              </div>
            </div>
          </div>

          {/* Eligibility Alert Banner */}
          <div className="mt-6 mb-6">
            {matchDetail.eligibility === 'ELIGIBLE' ? (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Eligibility: Eligible
                  </div>
                  <div className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                    All mandatory requirements are satisfied. Your assessed skills meet or surpass the organization's benchmark standards.
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-800">
                    Eligibility: Conditional / Skill Gap
                  </div>
                  <div className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                    {matchDetail.summary.mandatorySkills - matchDetail.summary.mandatoryRequirementsMet > 0
                      ? `${matchDetail.summary.mandatorySkills - matchDetail.summary.mandatoryRequirementsMet} mandatory requirement${matchDetail.summary.mandatorySkills - matchDetail.summary.mandatoryRequirementsMet > 1 ? 's are' : ' is'} not yet satisfied. Improve proficiency to qualify.`
                      : 'One or more required skill proficiencies are below the target benchmark.'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Explainability Narrative (Section 9) */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 sm:p-5 mb-8 text-xs text-slate-700 leading-relaxed">
            <span className="font-bold text-slate-900 block mb-1">Matching Explanation:</span>
            <p>{matchDetail.explanation}</p>
          </div>

          {/* Detailed Skill Comparison Table (Section 8) */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
              <span>Skill-by-Skill Requirement Comparison</span>
              <span className="text-[11px] font-normal text-slate-500">
                Total weight: {matchDetail.summary.totalWeight}x | Earned: {matchDetail.summary.earnedWeight}x
              </span>
            </h3>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Skill</th>
                    <th className="py-3 px-4 text-center">Your Score</th>
                    <th className="py-3 px-4 text-center">Required</th>
                    <th className="py-3 px-4 text-center">Weight</th>
                    <th className="py-3 px-4 text-center">Gap / Surplus</th>
                    <th className="py-3 px-4 text-center">Mandatory</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {matchDetail.skills.map((skill) => (
                    <tr key={skill.skillId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{skill.skillName}</div>
                        <div className="text-[10px] text-slate-400 capitalize">{skill.category.toLowerCase().replace('_', ' ')}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {skill.assessmentStatus === 'ASSESSED' ? (
                          <span className="font-mono font-bold text-slate-800">{skill.studentScore}%</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <span>Not Assessed (0%)</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-medium text-slate-600">
                        {skill.requiredScore}%
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600 font-medium">
                        {skill.weight}x
                      </td>
                      <td className="py-3 px-4 text-center">
                        {skill.surplus > 0 ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            +{skill.surplus}
                          </span>
                        ) : skill.gap > 0 ? (
                          <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            -{skill.gap}
                          </span>
                        ) : (
                          <span className="text-slate-500 font-medium">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {skill.mandatory ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                            Mandatory
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">
                            Optional
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {skill.status === 'MET' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <Check className="w-3 h-3" />
                            <span>Met</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            <AlertCircle className="w-3 h-3" />
                            <span>Gap</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Match Score Breakdown: Visual Contribution (Section 10) */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Weighted Match Contribution Breakdown
            </h3>
            <div className="space-y-3">
              {matchDetail.skills.map((skill) => {
                const contributionPct = Math.round(skill.ratio * 100);
                return (
                  <div key={skill.skillId} className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{skill.skillName}</span>
                        <span className="text-[11px] text-slate-500">
                          ({skill.studentScore}% / {skill.requiredScore}%)
                        </span>
                      </div>
                      <div className="text-right text-[11px]">
                        <span className="font-mono font-bold text-slate-800">
                          {skill.contribution.toFixed(1)} / {skill.weight.toFixed(1)} pts
                        </span>
                        <span className="text-slate-400 ml-1.5">({contributionPct}%)</span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          contributionPct >= 100 
                            ? 'bg-emerald-600' 
                            : contributionPct >= 60 
                              ? 'bg-teal-600' 
                              : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, contributionPct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* "Why isn't my match 100%?" Section (Section 11) */}
          <div className={`rounded-xl p-5 border ${
            matchDetail.matchScore >= 100 
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' 
              : 'bg-amber-50/70 border-amber-200 text-amber-950'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className={`w-4 h-4 ${matchDetail.matchScore >= 100 ? 'text-emerald-700' : 'text-amber-700'}`} />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                {matchDetail.matchScore >= 100 ? 'Match Diagnostics' : "Why isn't my match 100%?"}
              </h3>
            </div>

            <ul className="space-y-1.5 text-xs pl-5 list-disc">
              {matchDetail.whyNot100.map((bullet, idx) => (
                <li key={idx} className="leading-relaxed">
                  {bullet}
                </li>
              ))}
            </ul>

            {matchDetail.matchScore < 100 && (
              <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] text-amber-800 font-medium">
                    Improvement Tools:
                  </span>
                  <button
                    type="button"
                    onClick={() => scrollToSection('what-if-simulation-panel')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/90 border border-amber-300 text-amber-950 text-[11px] font-semibold hover:bg-amber-100 transition-colors cursor-pointer"
                  >
                    <span>Simulate Improvement</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToSection('learning-recommendations-panel')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/90 border border-amber-300 text-amber-950 text-[11px] font-semibold hover:bg-amber-100 transition-colors cursor-pointer"
                  >
                    <span>Recommended Learning</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <Link
                  to="/student/assessment"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-800 text-white text-xs font-semibold hover:bg-teal-900 transition-colors"
                >
                  <span>Take Assessment</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Step 6: What-If Skill Improvement Simulation */}
      {opportunity && matchDetail && (
        <section className="mb-8">
          <WhatIfSimulator
            opportunityId={opportunity.id}
            studentId={activeStudentId}
            matchDetail={matchDetail}
            externalSkillUpdate={externalSkillUpdate}
          />
        </section>
      )}

      {/* Step 6: Learning Resource Recommendation Engine */}
      {opportunity && matchDetail && (
        <section className="mb-8">
          <LearningRecommendations
            opportunityId={opportunity.id}
            studentId={activeStudentId}
            onSimulateGain={handleSimulateGain}
          />
        </section>
      )}

      {/* Main Content Grid: Description & Partner Information */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        {/* Left Column: Description & Skill Requirements */}
        <div className="lg:col-span-8 space-y-8">
          {/* Opportunity Description */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
              Role & Project Overview
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {opportunity.description}
            </p>
          </div>

          {/* Required Competencies Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Required Skills & Weightings</h2>
                <p className="text-xs text-slate-500">Benchmark proficiencies specified by the organization</p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                {opportunity.requiredSkills.length} Criteria
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {opportunity.requiredSkills.map((req, idx) => (
                <div key={idx} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{req.skillName}</span>
                      {req.mandatory ? (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Mandatory
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                          Preferred
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Category: {req.category || 'Domain Competency'} • Weight factor: {req.weight}x
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase">Min Required</span>
                      <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        ≥{req.minProficiency}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Organization Profile & Future Step Roadmaps */}
        <div className="lg:col-span-4 space-y-6">
          {/* Organization Profile Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-700" />
              <span>About the Organization</span>
            </h3>

            <div className="text-xs text-slate-600 space-y-3">
              <div className="font-semibold text-slate-800 text-sm">
                {opportunity.organizationName}
              </div>
              <p className="leading-relaxed">
                {opportunity.organizationDescription || 'Accredited partner in the SkillSetu Industry Consortium.'}
              </p>
              {opportunity.organizationWebsite && (
                <a
                  href={opportunity.organizationWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-semibold"
                >
                  <span>Visit website</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* Direct Application & Tracking Status Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 text-xs text-slate-600 shadow-xs">
            <div className="flex items-center gap-2 font-bold text-slate-800 mb-2">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>Application Pipeline (Step 8 Active)</span>
            </div>
            {appStatus?.hasApplied ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-900">
                  <div className="font-bold text-xs flex items-center justify-between">
                    <span>Applied to Role</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-teal-800 text-white">
                      {appStatus.application?.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-teal-800 mt-1">
                    Submitted on {appStatus.application?.appliedAt ? new Date(appStatus.application.appliedAt).toLocaleDateString() : 'Active'}
                  </div>
                </div>
                <Link
                  to="/student/applications"
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-teal-800 hover:bg-teal-700 text-white font-semibold transition-colors text-xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Open Applications Tracker</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="leading-relaxed text-[11px]">
                  Submit your verified skill portfolio and live match scores with one click.
                </p>
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-teal-800 hover:bg-teal-700 text-white font-bold transition-colors text-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Apply Now</span>
                </button>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-[11px]">
                  Preserves your match snapshot for recruiter review.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {opportunity && (
        <ApplyOpportunityModal
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          opportunity={opportunity}
          matchDetail={matchDetail}
          studentId={activeStudentId}
          onSuccess={(appId) => {
            setIsApplyModalOpen(false);
            setAppStatus({
              hasApplied: true,
              application: {
                id: appId,
                status: 'APPLIED',
                appliedAt: new Date().toISOString(),
                matchScoreSnapshot: matchDetail?.matchScore ?? 0,
                eligibilitySnapshot: matchDetail?.eligibility ?? 'ELIGIBLE'
              }
            });
            setAppliedNotification('Application submitted successfully! Your snapshot score has been recorded.');
          }}
        />
      )}
    </div>
  );
};
