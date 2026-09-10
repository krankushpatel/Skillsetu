/**
 * SkillSetu - Institution Portal Placeholder
 * Step 1: Project Foundation (Features scheduled for Step 9)
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Landmark, ArrowLeft, TrendingUp, BarChart3, LineChart, BookOpenCheck } from 'lucide-react';

export const InstitutionPlaceholderPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Portal Overview</span>
      </Link>

      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">Institution & Academia Intelligence</h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                Scheduled for Step 9
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Macro cohort analytics, curriculum gap diagnostics, and placement readiness tracking for AIIA leadership.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm mb-2">
              <TrendingUp className="w-4 h-4 text-amber-700" />
              <span>Placement Readiness Index (PRI)</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Cohort-wide distribution categorization across Ready, Upskilling Needed, and Foundational stages to forecast placement outcomes.
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm mb-2">
              <BarChart3 className="w-4 h-4 text-amber-700" />
              <span>Supply vs. Demand Matrix</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Comparative visualization mapping average student skill proficiency (Supply) against live industry requirement baselines (Demand).
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm mb-2">
              <LineChart className="w-4 h-4 text-amber-700" />
              <span>Curriculum Reform Diagnostics</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pinpoints high-urgency subject deficiencies where industry demand outpaces student mastery before placement drives commence.
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm mb-2">
              <BookOpenCheck className="w-4 h-4 text-amber-700" />
              <span>Actionable Interventions</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Targeted recommendations for Faculty Development Programs (FDPs), industry bootcamps, and curriculum module adjustments.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-100/70 border border-slate-200 text-xs text-slate-600">
          <span>Current Phase: <strong>Step 1 Foundation Complete</strong> (Routing and API connection verified)</span>
          <span className="font-mono text-slate-500">Route: /institution</span>
        </div>
      </div>
    </div>
  );
};
