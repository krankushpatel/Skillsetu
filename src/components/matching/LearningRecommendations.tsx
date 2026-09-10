import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  ExternalLink, 
  Clock, 
  Award, 
  AlertCircle, 
  CheckCircle2, 
  Sliders, 
  ArrowUpRight,
  Sparkles,
  Layers
} from 'lucide-react';
import { OpportunityRecommendationsResponse, LearningRecommendation } from '../../types';
import { matchingService } from '../../services/matchingService';

interface LearningRecommendationsProps {
  opportunityId: string;
  studentId?: string;
  onSimulateGain?: (skillId: string, projectedScore: number) => void;
}

export const LearningRecommendations: React.FC<LearningRecommendationsProps> = ({
  opportunityId,
  studentId = 'sp_01',
  onSimulateGain
}) => {
  const [data, setData] = useState<OpportunityRecommendationsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await matchingService.getOpportunityRecommendations(opportunityId, studentId);
        if (isMounted) {
          setData(res);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load learning recommendations.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadRecommendations();
    return () => {
      isMounted = false;
    };
  }, [opportunityId, studentId]);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 animate-pulse">
          <div className="w-8 h-8 bg-slate-200 rounded-lg" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-slate-200 rounded w-1/4" />
            <div className="h-3 bg-slate-100 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-rose-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div id="learning-recommendations-panel" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-100">
              <BookOpen className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              How Can I Improve My Match?
            </h2>
            {data.hasGaps ? (
              <span className="text-[11px] font-semibold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                {data.skillGapCount} Skill Gap{data.skillGapCount !== 1 ? 's' : ''} Identified
              </span>
            ) : (
              <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                All Met
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Curated learning modules prioritized deterministically by your largest competency gaps, mandatory requirements, and weighted contribution to this opportunity.
          </p>
        </div>

        {data.hasGaps && (
          <div className="text-right text-xs">
            <span className="text-slate-400 block text-[11px]">Ranked Modules</span>
            <span className="font-bold text-teal-900 font-mono text-sm">
              {data.recommendations.length} Available
            </span>
          </div>
        )}
      </div>

      {/* Case 1: No Gaps (Perfect Alignment) */}
      {!data.hasGaps && (
        <div className="mt-6 p-6 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-start gap-4">
          <div className="p-2 rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-emerald-950 mb-1">
              Outstanding Alignment!
            </h3>
            <p className="text-xs text-emerald-800 leading-relaxed">
              You meet or exceed all required competency benchmarks for this opportunity with 0 proficiency gaps. You are already positioned as a strong candidate.
            </p>
          </div>
        </div>
      )}

      {/* Case 2: Recommendations Available */}
      {data.hasGaps && data.recommendations.length > 0 && (
        <div className="mt-6 space-y-4">
          {data.recommendations.map((rec: LearningRecommendation, index: number) => {
            const projectedAfterCourse = Math.min(100, rec.currentScore + rec.potentialSkillGain);

            return (
              <div 
                key={rec.resourceId}
                className="group p-5 rounded-xl border border-slate-200 hover:border-teal-300 bg-slate-50/50 hover:bg-teal-50/15 transition-all shadow-2xs"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left: Content */}
                  <div className="space-y-2 flex-1">
                    {/* Badges Bar */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-800 text-white">
                        #{index + 1} Priority
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {rec.skillName}
                      </span>
                      {rec.mandatory ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                          Mandatory
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          Optional
                        </span>
                      )}
                      <span className="text-[10px] font-semibold text-rose-700 bg-rose-50/80 px-2 py-0.5 rounded border border-rose-200">
                        Gap: -{rec.gap} pts
                      </span>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        +{rec.potentialSkillGain} pts potential gain
                      </span>
                    </div>

                    {/* Title & Provider */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-900 transition-colors">
                        {rec.title}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        Provided by: <span className="text-slate-700">{rec.provider}</span>
                      </p>
                    </div>

                    {/* Description */}
                    {rec.description && (
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {rec.description}
                      </p>
                    )}

                    {/* Deterministic Reason / Why Recommended */}
                    <div className="pt-2 flex items-start gap-1.5 text-xs text-teal-900 bg-teal-50/80 p-2.5 rounded-lg border border-teal-200/60">
                      <Sparkles className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                      <span className="leading-snug">{rec.reason}</span>
                    </div>
                  </div>

                  {/* Right: Meta & Actions */}
                  <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-3 shrink-0">
                    <div className="text-left md:text-right space-y-1 text-xs text-slate-500">
                      <div className="flex items-center md:justify-end gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{rec.duration}</span>
                      </div>
                      <div className="flex items-center md:justify-end gap-1">
                        <Layers className="w-3 h-3 text-slate-400" />
                        <span className="capitalize">{rec.difficulty.toLowerCase()}</span>
                      </div>
                    </div>

                    {/* Interactive CTAs */}
                    <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
                      {onSimulateGain && (
                        <button
                          type="button"
                          onClick={() => onSimulateGain(rec.skillId, projectedAfterCourse)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 hover:bg-teal-100 text-xs font-semibold border border-teal-200 transition-colors"
                          title={`Simulate boosting ${rec.skillName} from ${rec.currentScore}% to ${projectedAfterCourse}% in the What-If Simulator`}
                        >
                          <Sliders className="w-3 h-3" />
                          <span>Simulate Gain</span>
                        </button>
                      )}

                      {rec.url && (
                        <a
                          href={rec.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-800 text-white hover:bg-teal-900 text-xs font-semibold transition-colors"
                        >
                          <span>Open Resource</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Notice for Skills with No External Course Cataloged */}
      {data.skillsWithNoResources && data.skillsWithNoResources.length > 0 && (
        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p>
            No external digital course currently cataloged for: <strong className="text-slate-800">{data.skillsWithNoResources.join(', ')}</strong>. Consider institutional clinical mentorship or AYUSH research center internal workshops.
          </p>
        </div>
      )}
    </div>
  );
};
