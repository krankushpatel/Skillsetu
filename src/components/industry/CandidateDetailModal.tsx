/**
 * SkillSetu - Candidate Match Diagnostics Modal
 * Step 7: Industry Workspace
 * 
 * Displays deep explainable matching analytics evaluated by the Step 5 engine:
 * - Overall Match Score & Eligibility determination
 * - Skill-by-skill breakdown with target comparisons, weights, and contributions
 * - Mandatory requirement verification
 * - Deterministic explanation & "Why isn't match 100%?" diagnostic points
 */

import React, { useEffect, useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  GraduationCap, 
  Building, 
  Award, 
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  BarChart3
} from 'lucide-react';
import { industryService } from '../../services/industryService';
import { OpportunityCandidateMatchDetailResponse } from '../../types';

interface CandidateDetailModalProps {
  opportunityId: string;
  candidateId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({
  opportunityId,
  candidateId,
  isOpen,
  onClose
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [detail, setDetail] = useState<OpportunityCandidateMatchDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !opportunityId || !candidateId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    industryService.getCandidateMatchDetail(opportunityId, candidateId)
      .then((res) => {
        if (isMounted) {
          setDetail(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load candidate diagnostics.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, opportunityId, candidateId]);

  if (!isOpen) return null;

  const match = detail?.match;
  const candidate = detail?.candidate;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100 shrink-0">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
              {candidate?.name?.charAt(0) || 'C'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  {candidate?.name || 'Candidate Diagnostics'}
                </h2>
                {match && (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      match.eligibility === 'ELIGIBLE'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {match.eligibility === 'ELIGIBLE' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    )}
                    {match.eligibilityLabel}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-teal-800" />
                  {candidate?.course} • {candidate?.department}
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-slate-500" />
                  {candidate?.institutionShortName || candidate?.institution}
                </span>
                <span className="text-slate-300">•</span>
                <span className="font-semibold text-slate-700">
                  CGPA: {candidate?.cgpa}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-teal-800 border-t-transparent animate-spin" />
              <span>Evaluating candidate skill profile against opportunity benchmarks...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {error}
            </div>
          ) : match && (
            <>
              {/* Overall Match Score Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="sm:col-span-1 text-center sm:text-left sm:border-r border-slate-200 sm:pr-4">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Overall Match Score
                  </span>
                  <div className="flex items-baseline gap-1 mt-1 justify-center sm:justify-start">
                    <span className="text-3xl font-extrabold text-teal-900 font-mono">
                      {match.matchScore}%
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      ({match.rawMatchScore.toFixed(1)}%)
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Normalized weighted quotient
                  </span>
                </div>

                <div className="flex flex-col justify-center">
                  <span className="text-[11px] text-slate-500 font-medium">Skills Satisfied</span>
                  <span className="text-base font-bold text-slate-900 mt-0.5">
                    {match.summary.skillsMet} / {match.summary.requiredSkills}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {match.summary.skillsWithGap} skill{match.summary.skillsWithGap === 1 ? '' : 's'} with gap
                  </span>
                </div>

                <div className="flex flex-col justify-center">
                  <span className="text-[11px] text-slate-500 font-medium">Mandatory Thresholds</span>
                  <span className="text-base font-bold text-slate-900 mt-0.5">
                    {match.summary.mandatoryRequirementsMet} / {match.summary.mandatorySkills}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {match.summary.mandatorySkills - match.summary.mandatoryRequirementsMet === 0 
                      ? 'All mandatory met' 
                      : `${match.summary.mandatorySkills - match.summary.mandatoryRequirementsMet} mandatory gap`}
                  </span>
                </div>

                <div className="flex flex-col justify-center">
                  <span className="text-[11px] text-slate-500 font-medium">Earned Weight</span>
                  <span className="text-base font-bold text-slate-900 mt-0.5 font-mono">
                    {match.summary.earnedWeight.toFixed(1)} / {match.summary.totalWeight}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Contribution points
                  </span>
                </div>
              </div>

              {/* Deterministic Explanation */}
              <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-200/80 text-xs text-teal-950 leading-relaxed">
                <span className="font-semibold text-teal-900 block mb-1">
                  Algorithmic Evaluation Narrative:
                </span>
                <p>{match.explanation}</p>
              </div>

              {/* Skill Competency Breakdown Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-teal-800" />
                  <span>Competency Breakdown & Target Comparisons</span>
                </h4>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Skill</th>
                        <th className="py-2.5 px-3">Candidate Assessed</th>
                        <th className="py-2.5 px-3">Required Benchmark</th>
                        <th className="py-2.5 px-3">Importance Weight</th>
                        <th className="py-2.5 px-3">Gap / Surplus</th>
                        <th className="py-2.5 px-3">Mandatory</th>
                        <th className="py-2.5 px-3 text-right">Contribution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {match.skills.map((s) => (
                        <tr key={s.skillId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3">
                            <span className="font-semibold text-slate-900 block">{s.skillName}</span>
                            <span className="text-[10px] text-slate-500 uppercase">{s.category}</span>
                          </td>
                          <td className="py-3 px-3 font-mono font-medium text-slate-800">
                            {s.studentScore}%
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600">
                            {s.requiredScore}%
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600">
                            {s.weight} pts
                          </td>
                          <td className="py-3 px-3">
                            {s.status === 'MET' ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {s.surplus > 0 ? `+${s.surplus}% surplus` : 'Target met'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-700 font-medium">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                -{s.gap}% gap
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {s.mandatory ? (
                              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded ${
                                s.mandatorySatisfied 
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                  : 'bg-rose-50 text-rose-800 border border-rose-200'
                              }`}>
                                {s.mandatorySatisfied ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                                {s.mandatorySatisfied ? 'Satisfied' : 'Threshold Unmet'}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium">Optional</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-semibold text-teal-900">
                            +{s.contribution.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Why isn't match 100% Diagnostics */}
              {match.whyNot100 && match.whyNot100.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5 mb-2">
                    <HelpCircle className="w-4 h-4 text-teal-800" />
                    <span>Candidate Diagnostic Factors</span>
                  </h4>
                  <ul className="space-y-1.5 text-slate-600">
                    {match.whyNot100.map((reason, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-teal-700 font-bold">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            Assessed through SkillSetu Standardized Skill Engine (Step 4 & 5).
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
