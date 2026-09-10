/**
 * SkillSetu - Candidate Skill Supply Analytics
 * Step 7: Industry Workspace
 * 
 * Visualizes candidate competency supply across assessed students at AIIA.
 * Displays average assessed student proficiency vs Industry Demand Score.
 */

import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Users, Info } from 'lucide-react';
import { industryService } from '../../services/industryService';
import { CandidateSkillSupplyItem } from '../../types';

export const SkillSupplyChart: React.FC = () => {
  const [supply, setSupply] = useState<CandidateSkillSupplyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    industryService.getCandidateSkillSupply()
      .then((data) => {
        if (isMounted) {
          setSupply(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-500">
        Loading candidate skill supply analytics...
      </div>
    );
  }

  if (supply.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-teal-800" />
            <span>AIIA Candidate Competency Supply & Industry Demand</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Average assessed student proficiency vs benchmark market demand score across standardized skills.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-teal-800" />
            <span>Avg Student Proficiency</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-slate-300" />
            <span>Industry Demand</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {supply.map((item) => (
          <div 
            key={item.skillId}
            className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-slate-800 truncate pr-2">
                {item.skillName}
              </span>
              <span className="text-[10px] uppercase font-semibold text-teal-800 px-1.5 py-0.5 bg-teal-50 rounded">
                {item.category}
              </span>
            </div>

            {/* Proficiency Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-600">
                <span className="text-slate-500">Student Average</span>
                <span className="font-mono font-bold text-teal-900">{item.averageProficiency}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-teal-800 rounded-full transition-all duration-300"
                  style={{ width: `${item.averageProficiency}%` }}
                />
              </div>

              {/* Demand Bar */}
              <div className="flex items-center justify-between text-[11px] text-slate-600 pt-0.5">
                <span className="text-slate-500">Industry Demand</span>
                <span className="font-mono text-slate-700">{item.industryDemandScore}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-slate-400 rounded-full transition-all duration-300"
                  style={{ width: `${item.industryDemandScore}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {item.assessedCandidateCount} evaluated candidates
              </span>
              <span>ID: {item.skillId}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
