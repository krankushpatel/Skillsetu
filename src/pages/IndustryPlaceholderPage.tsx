/**
 * SkillSetu - Industry Portal Placeholder
 * Step 1: Project Foundation (Features scheduled for Step 7 & 8)
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowLeft, Briefcase, Users, CheckSquare, BarChart } from 'lucide-react';

export const IndustryPlaceholderPage: React.FC = () => {
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
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">Industry Recruiter Portal</h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Scheduled for Step 7–8
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Opportunity creation, multi-attribute skill weighting, and candidate discovery pipeline.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm mb-2">
              <Briefcase className="w-4 h-4 text-emerald-700" />
              <span>Weighted Opportunity Studio</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Post internships, apprenticeships, and live projects with explicit minimum proficiencies and priority importance weights.
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm mb-2">
              <Users className="w-4 h-4 text-emerald-700" />
              <span>Ranked Candidate Pipeline</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Instant algorithmic ranking of student applicants ordered by mathematical match quotient rather than keyword density.
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm mb-2">
              <BarChart className="w-4 h-4 text-emerald-700" />
              <span>Candidate Skill Diagnostics</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Inspect applicant verified competencies, identify manageable skill gaps, and view their project credentials.
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm mb-2">
              <CheckSquare className="w-4 h-4 text-emerald-700" />
              <span>1-Click Shortlisting</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Move top-fit candidates to shortlisted or interview stages with automated status progression.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-100/70 border border-slate-200 text-xs text-slate-600">
          <span>Current Phase: <strong>Step 1 Foundation Complete</strong> (Routing and API connection verified)</span>
          <span className="font-mono text-slate-500">Route: /industry</span>
        </div>
      </div>
    </div>
  );
};
