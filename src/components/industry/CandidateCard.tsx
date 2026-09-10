/**
 * SkillSetu - Candidate Card
 * Step 7: Industry Workspace
 * 
 * Displays ranked candidate match evaluation:
 * - Deterministic Rank
 * - Candidate profile & AIIA affiliation
 * - Match score & eligibility status
 * - Skills met and mandatory gap badges
 * - View diagnostic breakdown action
 */

import React from 'react';
import { 
  GraduationCap, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  Award,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { CandidateRankItem } from '../../types';

interface CandidateCardProps {
  candidate: CandidateRankItem;
  onViewDiagnostics: (candidateId: string) => void;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  onViewDiagnostics
}) => {
  const isEligible = candidate.eligibility === 'ELIGIBLE';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-teal-700/40 hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Left: Rank + Profile Information */}
      <div className="flex items-start gap-3.5">
        {/* Rank Badge */}
        <div 
          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
            candidate.rank === 1
              ? 'bg-amber-100 text-amber-900 border border-amber-300'
              : candidate.rank === 2
              ? 'bg-slate-200 text-slate-800 border border-slate-300'
              : candidate.rank === 3
              ? 'bg-amber-50 text-amber-800 border border-amber-200'
              : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}
          title={`Rank #${candidate.rank} based on authoritative Step 5 matching formula`}
        >
          #{candidate.rank}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">
              {candidate.name}
            </h3>

            {/* Eligibility Badge */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isEligible
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              {isEligible ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              )}
              {candidate.eligibilityLabel}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-1">
            <span className="flex items-center gap-1 font-medium text-slate-700">
              <GraduationCap className="w-3.5 h-3.5 text-teal-800" />
              {candidate.course}
            </span>
            <span className="text-slate-300">•</span>
            <span>{candidate.institution}</span>
            <span className="text-slate-300">•</span>
            <span className="font-semibold text-slate-700">CGPA: {candidate.cgpa}</span>
          </div>

          {/* Quick Skill Status Badges */}
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              {candidate.skillsMet} / {candidate.totalSkills} skills met
            </span>

            {candidate.mandatoryGaps === 0 ? (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                All mandatory met
              </span>
            ) : (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-rose-600" />
                {candidate.mandatoryGaps} mandatory gap
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Match Score + Diagnostics Button */}
      <div className="flex items-center justify-between md:justify-end gap-5 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
        <div className="text-right">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Match Score
          </span>
          <div className="flex items-baseline gap-1 justify-end mt-0.5">
            <span className="text-2xl font-black text-teal-900 font-mono">
              {candidate.matchScore}%
            </span>
            <span className="text-xs text-slate-500 font-mono">
              ({candidate.rawMatchScore.toFixed(1)}%)
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onViewDiagnostics(candidate.candidateId)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-800 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <span>Skill Diagnostics</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
