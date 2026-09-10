/**
 * SkillSetu - Top Skill Gaps & Curriculum Interventions
 * Step 9: Institution Dashboard + Skill Intelligence
 */

import React from 'react';
import { AlertCircle, AlertTriangle, ArrowUpRight, BookOpen, CheckCircle2 } from 'lucide-react';
import { SkillGapItem } from '../../types';

interface TopSkillGapsListProps {
  gaps: SkillGapItem[];
  limit?: number;
  showRecommendations?: boolean;
}

export const TopSkillGapsList: React.FC<TopSkillGapsListProps> = ({
  gaps,
  limit = 5,
  showRecommendations = true,
}) => {
  const displayGaps = limit ? gaps.slice(0, limit) : gaps;

  if (!displayGaps || displayGaps.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
        <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-2" />
        <span>No critical skill shortages detected across current industry postings.</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayGaps.map((gap, index) => {
        const isShortage = gap.status === 'Skill Shortage';
        const isBalanced = gap.status === 'Balanced';

        return (
          <div
            key={gap.skillId}
            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                  {index + 1}
                </span>
                <span className="font-bold text-slate-900 text-sm">{gap.skillName}</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
                  {gap.category}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {gap.urgency === 'High' && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-rose-600" />
                    High Priority Shortage
                  </span>
                )}
                {gap.urgency === 'Medium' && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    Moderate Gap
                  </span>
                )}
                {isBalanced && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Market Balanced
                  </span>
                )}

                <div className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-800">
                  {isShortage ? `+${gap.gap} pts gap` : `${gap.gap} pts`}
                </div>
              </div>
            </div>

            {/* Proficiency Comparison Bar */}
            <div className="mt-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
              <div className="flex justify-between items-center text-slate-600 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                  Student Supply: <strong className="font-mono text-slate-900">{gap.studentAverageProficiency}%</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Industry Demand: <strong className="font-mono text-slate-900">{gap.industryRequiredAverage}%</strong>
                </span>
              </div>
              
              {/* Dual progress bar representation */}
              <div className="relative h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 bottom-0 left-0 bg-teal-600 rounded-full"
                  style={{ width: `${Math.min(100, gap.studentAverageProficiency)}%` }}
                />
                <div
                  className="absolute top-0 bottom-0 w-1 bg-amber-500 z-10"
                  style={{ left: `calc(${Math.min(100, gap.industryRequiredAverage)}% - 2px)` }}
                  title={`Required benchmark: ${gap.industryRequiredAverage}%`}
                />
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-500 mt-2">
                <span>Required in <strong>{gap.opportunityCount}</strong> active opportunities ({gap.mandatoryCount} mandatory)</span>
                <span>Assessed in <strong>{gap.studentCount}</strong> students</span>
              </div>
            </div>

            {/* Explanatory note */}
            <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
              {gap.explanation}
            </p>

            {/* Actionable curriculum recommendation */}
            {showRecommendations && gap.recommendation && (
              <div className="mt-2.5 p-2.5 rounded-lg bg-teal-50/70 border border-teal-100/90 text-xs text-teal-900 flex items-start gap-2">
                <BookOpen className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-teal-950">Curriculum Intervention: </span>
                  <span className="text-teal-800">{gap.recommendation}</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
