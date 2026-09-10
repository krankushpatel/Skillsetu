/**
 * SkillSetu - Apply for Opportunity Modal
 * Step 8 & 10: One-Click Application Pipeline
 *
 * Captures student's application snapshot with authoritative Step 5 match score,
 * eligibility status, and optional cover note.
 */

import React, { useState } from 'react';
import { 
  X, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  MapPin, 
  Briefcase, 
  ShieldCheck, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { applicationService } from '../../services/applicationService';
import { OpportunityDetail, OpportunityMatchDetail } from '../../types';

interface ApplyOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: OpportunityDetail;
  matchDetail: OpportunityMatchDetail | null;
  studentId: string;
  studentName?: string;
  onSuccess: (applicationId: string) => void;
}

export const ApplyOpportunityModal: React.FC<ApplyOpportunityModalProps> = ({
  isOpen,
  onClose,
  opportunity,
  matchDetail,
  studentId,
  studentName,
  onSuccess
}) => {
  const [coverNote, setCoverNote] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await applicationService.submitApplication({
        studentId,
        opportunityId: opportunity.id,
        coverNote: coverNote.trim() || undefined
      });

      onSuccess(res.applicationId);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit application. Please verify your connection.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                Application Review
              </span>
              <span className="text-[10px] font-medium text-slate-500">
                Step 8 One-Click Dispatch
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Apply for Opportunity
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review your readiness snapshot before dispatching your application to the recruiter.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Opportunity Brief */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <h3 className="text-sm font-bold text-slate-900">
              {opportunity.title}
            </h3>
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-600 mt-1">
              <span className="flex items-center gap-1 font-semibold text-slate-800">
                <Building2 className="w-3.5 h-3.5 text-teal-700" />
                {opportunity.organizationName}
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1 text-slate-500">
                <MapPin className="w-3 h-3" />
                {opportunity.location}
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-medium text-teal-800">{opportunity.stipend}</span>
            </div>
          </div>

          {/* Live Readiness Snapshot Card */}
          {matchDetail && (
            <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-700" />
                  <span>Snapshot Score at Submission</span>
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  matchDetail.eligibility === 'ELIGIBLE'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}>
                  {matchDetail.eligibility === 'ELIGIBLE' ? 'Eligible' : 'Conditional'}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-teal-950 font-mono">
                  {matchDetail.matchScore}%
                </span>
                <span className="text-xs text-teal-700">
                  ({matchDetail.summary.skillsMet} of {matchDetail.summary.requiredSkills} required skills met)
                </span>
              </div>

              <div className="text-[11px] text-teal-800 leading-relaxed border-t border-teal-200/60 pt-2">
                {matchDetail.summary.mandatorySkills - matchDetail.summary.mandatoryRequirementsMet === 0 ? (
                  <span className="flex items-center gap-1 text-emerald-800 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>All mandatory skill benchmarks satisfied.</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-900 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>{matchDetail.summary.mandatorySkills - matchDetail.summary.mandatoryRequirementsMet} mandatory skill requirement is below threshold.</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Cover Note Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Cover Note for Recruiter <span className="font-normal text-slate-400">(Optional)</span>
            </label>
            <textarea
              rows={3}
              value={coverNote}
              onChange={(e) => setCoverNote(e.target.value)}
              placeholder="Highlight relevant projects, research publications, or why you are a strong fit for this role..."
              className="w-full text-xs rounded-xl border border-slate-300 p-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700 transition"
              disabled={submitting}
            />
            <p className="text-[11px] text-slate-400">
              Recruiters see this along with your verified AIIA institutional profile.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Application</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
