import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Sliders, 
  RotateCcw, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Check, 
  Target,
  Info
} from 'lucide-react';
import { OpportunityMatchDetail, WhatIfResponse } from '../../types';
import { matchingService } from '../../services/matchingService';

interface WhatIfSimulatorProps {
  opportunityId: string;
  studentId?: string;
  matchDetail: OpportunityMatchDetail;
  externalSkillUpdate?: { skillId: string; proficiency: number } | null;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  opportunityId,
  studentId = 'sp_01',
  matchDetail,
  externalSkillUpdate
}) => {
  // Initialize slider proficiencies from current student scores
  const [proficiencies, setProficiencies] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    matchDetail.skills.forEach(s => {
      initial[s.skillId] = Math.round(s.studentScore);
    });
    return initial;
  });

  const [simulationResult, setSimulationResult] = useState<WhatIfResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce ref to prevent excessive requests while sliding
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const runSimulation = useCallback(async (currentProficiencies: Record<string, number>) => {
    try {
      setLoading(true);
      setError(null);

      // Build payload: only pass skills that exist in requirements
      const updates = matchDetail.skills.map(s => ({
        skillId: s.skillId,
        proficiency: currentProficiencies[s.skillId] ?? Math.round(s.studentScore)
      }));

      const res = await matchingService.simulateWhatIf(opportunityId, updates, studentId);
      setSimulationResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to calculate simulated match score.');
    } finally {
      setLoading(false);
    }
  }, [opportunityId, studentId, matchDetail.skills]);

  // Initial simulation calculation
  useEffect(() => {
    runSimulation(proficiencies);
  }, []);

  // Handle external updates (e.g. user clicked "Simulate this gain" from learning recommendations)
  useEffect(() => {
    if (externalSkillUpdate) {
      setProficiencies(prev => {
        const next = {
          ...prev,
          [externalSkillUpdate.skillId]: Math.min(100, Math.max(0, Math.round(externalSkillUpdate.proficiency)))
        };
        // Debounce simulation update
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
          runSimulation(next);
        }, 150);
        return next;
      });
    }
  }, [externalSkillUpdate, runSimulation]);

  const handleSliderChange = (skillId: string, value: number) => {
    const nextVal = Math.min(100, Math.max(0, value));
    const nextProficiencies = {
      ...proficiencies,
      [skillId]: nextVal
    };
    setProficiencies(nextProficiencies);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      runSimulation(nextProficiencies);
    }, 180);
  };

  const handleSetTargetRequired = (skillId: string, requiredScore: number) => {
    handleSliderChange(skillId, Math.round(requiredScore));
  };

  const handleResetSkill = (skillId: string, originalScore: number) => {
    handleSliderChange(skillId, Math.round(originalScore));
  };

  const handleResetAll = () => {
    const original: Record<string, number> = {};
    matchDetail.skills.forEach(s => {
      original[s.skillId] = Math.round(s.studentScore);
    });
    setProficiencies(original);
    runSimulation(original);
  };

  const handleTargetAllRequired = () => {
    const targetAll: Record<string, number> = {};
    matchDetail.skills.forEach(s => {
      targetAll[s.skillId] = Math.max(Math.round(s.studentScore), Math.round(s.requiredScore));
    });
    setProficiencies(targetAll);
    runSimulation(targetAll);
  };

  const hasAnyUpdates = matchDetail.skills.some(
    s => proficiencies[s.skillId] !== Math.round(s.studentScore)
  );

  const currentScore = simulationResult?.currentMatchScore ?? matchDetail.matchScore;
  const projectedScore = simulationResult?.projectedMatchScore ?? matchDetail.matchScore;
  const scoreDiff = projectedScore - currentScore;

  const currentEligibility = simulationResult?.eligibility.current ?? matchDetail.eligibility;
  const projectedEligibility = simulationResult?.eligibility.projected ?? matchDetail.eligibility;
  const eligibilityChanged = currentEligibility !== projectedEligibility;

  return (
    <div id="what-if-simulation-panel" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-100">
              <Sliders className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              What If I Improve My Skills?
            </h2>
            <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
              Hypothetical Simulation
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Simulate hypothetical competency gains to project how targeted skill development improves your overall Match Score and Eligibility. Changes are evaluated in-memory and do not alter your official assessed scores.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={handleTargetAllRequired}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 text-xs font-semibold hover:bg-teal-100 border border-teal-200 transition-colors"
            title="Set all skill proficiencies to meet the minimum required benchmark"
          >
            <Target className="w-3.5 h-3.5" />
            <span>Meet All Benchmarks</span>
          </button>
          <button
            type="button"
            onClick={handleResetAll}
            disabled={!hasAnyUpdates}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border ${
              hasAnyUpdates 
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300' 
                : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
            }`}
            title="Reset all skills back to current assessed scores"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Projection Scoreboard */}
      <div className="my-6 grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Score Projection Card */}
        <div className="md:col-span-6 bg-gradient-to-br from-slate-50 to-teal-50/40 rounded-2xl p-5 border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Projected Match Score
            </span>
            {loading && (
              <span className="text-[11px] text-teal-700 animate-pulse font-medium">
                Computing projection...
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-4">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Current</span>
              <span className="text-2xl font-black text-slate-600 font-mono">
                {currentScore}%
              </span>
            </div>

            <div className="text-slate-300 text-xl font-light">→</div>

            <div>
              <span className="text-xs text-teal-900 block font-bold">Projected</span>
              <span className={`text-4xl font-black font-mono tracking-tight ${
                projectedScore >= 80 ? 'text-emerald-700' : projectedScore >= 60 ? 'text-teal-800' : 'text-amber-700'
              }`}>
                {projectedScore}%
              </span>
            </div>

            <div className="ml-auto">
              {scoreDiff > 0 ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-full border border-emerald-300">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+{scoreDiff}% Improvement</span>
                </span>
              ) : scoreDiff < 0 ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                  <span>{scoreDiff}% Reduction</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                  <span>0% Delta</span>
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar of Projected Score */}
          <div className="mt-4 pt-3 border-t border-slate-200/60">
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  projectedScore >= 80 ? 'bg-emerald-600' : projectedScore >= 60 ? 'bg-teal-600' : 'bg-amber-500'
                }`}
                style={{ width: `${projectedScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* Eligibility & Metrics Transition Card */}
        <div className="md:col-span-6 bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Eligibility Transition
            </span>

            <div className="flex items-center gap-3">
              <div className="text-xs">
                <span className="text-slate-400 block text-[11px]">Current Status</span>
                <span className={`inline-block font-semibold px-2 py-0.5 rounded text-xs mt-0.5 ${
                  currentEligibility === 'ELIGIBLE' 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}>
                  {simulationResult?.eligibility.currentLabel ?? matchDetail.eligibilityLabel}
                </span>
              </div>

              <div className="text-slate-300 text-lg">→</div>

              <div className="text-xs">
                <span className="text-teal-900 block text-[11px] font-bold">Projected Status</span>
                <span className={`inline-block font-bold px-2.5 py-0.5 rounded text-xs mt-0.5 ${
                  projectedEligibility === 'ELIGIBLE' 
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}>
                  {simulationResult?.eligibility.projectedLabel ?? matchDetail.eligibilityLabel}
                </span>
              </div>
            </div>

            {eligibilityChanged && projectedEligibility === 'ELIGIBLE' && (
              <div className="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                <span>Prerequisites Satisfied: Transitioning to fully eligible!</span>
              </div>
            )}
          </div>

          {/* Quick Metrics */}
          {simulationResult && (
            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <div>
                <span>Skills Met: </span>
                <strong className="text-slate-900 font-bold">
                  {simulationResult.summary.projectedSkillsMet} / {matchDetail.skills.length}
                </strong>
                {simulationResult.summary.projectedSkillsMet > simulationResult.summary.currentSkillsMet && (
                  <span className="text-emerald-700 ml-1 font-semibold">
                    (+{simulationResult.summary.projectedSkillsMet - simulationResult.summary.currentSkillsMet})
                  </span>
                )}
              </div>

              <div>
                <span>Mandatory Met: </span>
                <strong className="text-slate-900 font-bold">
                  {simulationResult.summary.projectedMandatoryMet} / {simulationResult.summary.mandatorySkills}
                </strong>
                {simulationResult.summary.projectedMandatoryMet > simulationResult.summary.currentMandatoryMet && (
                  <span className="text-emerald-700 ml-1 font-semibold">
                    (+{simulationResult.summary.projectedMandatoryMet - simulationResult.summary.currentMandatoryMet})
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Explanation Banner */}
      {simulationResult?.explanation && (
        <div className="mb-6 p-4 rounded-xl bg-teal-50/70 border border-teal-200/80 text-teal-950 text-xs flex items-start gap-2.5">
          <Info className="w-4 h-4 shrink-0 text-teal-700 mt-0.5" />
          <p className="leading-relaxed">
            {simulationResult.explanation}
          </p>
        </div>
      )}

      {/* Interactive Skill Sliders List */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          Adjust Skill Target Proficiencies
        </h3>

        {matchDetail.skills.map((skill) => {
          const simVal = proficiencies[skill.skillId] ?? Math.round(skill.studentScore);
          const origVal = Math.round(skill.studentScore);
          const reqVal = Math.round(skill.requiredScore);
          const isUpdated = simVal !== origVal;
          const meetsTarget = simVal >= reqVal;
          const projectedSkill = simulationResult?.skills.find(s => s.skillId === skill.skillId);
          const projectedContrib = projectedSkill?.projectedContribution ?? (Math.min(1.0, simVal / (reqVal || 1)) * skill.weight);

          return (
            <div 
              key={skill.skillId}
              className={`p-4 rounded-xl border transition-all ${
                isUpdated 
                  ? 'bg-teal-50/30 border-teal-300/80 shadow-xs' 
                  : 'bg-slate-50/60 border-slate-200'
              }`}
            >
              {/* Skill Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-slate-900">
                    {skill.skillName}
                  </span>
                  {skill.mandatory ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                      Mandatory ({skill.weight}x)
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                      Optional ({skill.weight}x)
                    </span>
                  )}
                  {isUpdated && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-200">
                      Simulated
                    </span>
                  )}
                </div>

                {/* Score Indicators */}
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-500 text-[11px]">
                    Assessed: <strong className="text-slate-700 font-mono">{origVal}%</strong>
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-500 text-[11px]">
                    Required: <strong className="text-slate-700 font-mono">{reqVal}%</strong>
                  </span>
                  <span className="text-slate-300">|</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-bold text-teal-900">Target:</span>
                    <span className={`font-mono font-bold text-sm px-1.5 py-0.2 rounded ${
                      meetsTarget ? 'text-emerald-800 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                    }`}>
                      {simVal}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Slider Control & Benchmarks */}
              <div className="space-y-2 my-2">
                <div className="relative pt-1">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={simVal}
                    onChange={(e) => handleSliderChange(skill.skillId, parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-700 focus:outline-none"
                  />
                  
                  {/* Visual Marker for Required Score on Slider */}
                  <div 
                    className="absolute top-0 flex flex-col items-center pointer-events-none"
                    style={{ left: `${reqVal}%`, transform: 'translateX(-50%)' }}
                    title={`Required Benchmark: ${reqVal}%`}
                  >
                    <div className="w-0.5 h-4 bg-slate-500" />
                    <span className="text-[9px] font-mono text-slate-500 bg-white/90 px-0.5 rounded -mt-0.5">
                      Req {reqVal}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>0%</span>
                  <div className="flex items-center gap-2">
                    {meetsTarget ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                        <Check className="w-3 h-3" />
                        <span>Requirement Met ({projectedContrib.toFixed(1)} / {skill.weight} pts earned)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                        <AlertCircle className="w-3 h-3" />
                        <span>Gap: -{reqVal - simVal}% ({projectedContrib.toFixed(1)} / {skill.weight} pts earned)</span>
                      </span>
                    )}
                  </div>
                  <span>100%</span>
                </div>
              </div>

              {/* Quick Action Buttons for this skill */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSetTargetRequired(skill.skillId, reqVal)}
                    disabled={simVal === reqVal}
                    className="text-[11px] font-medium text-teal-700 hover:text-teal-900 disabled:text-slate-400 hover:underline"
                  >
                    Set to Required ({reqVal}%)
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => handleSliderChange(skill.skillId, 100)}
                    disabled={simVal === 100}
                    className="text-[11px] font-medium text-teal-700 hover:text-teal-900 disabled:text-slate-400 hover:underline"
                  >
                    Set to 100%
                  </button>
                </div>

                {isUpdated && (
                  <button
                    type="button"
                    onClick={() => handleResetSkill(skill.skillId, origVal)}
                    className="text-[11px] font-medium text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 hover:underline"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset to Assessed ({origVal}%)</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
