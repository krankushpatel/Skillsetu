/**
 * SkillSetu - Student Portal Placeholder
 * Step 1: Project Foundation (Features scheduled for Step 3, 4, 5, 6)
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowLeft, Clock, Target, SlidersHorizontal, Award } from 'lucide-react';

export const StudentPlaceholderPage: React.FC = () => {
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
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">Student Portal Foundation</h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                Scheduled for Step 3–6
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Personalized skill diagnostic hub, explainable opportunity matching, and upskilling simulations.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm mb-2">
              <Award className="w-4 h-4 text-teal-700" />
              <span>Assessed Skill Profile</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Standardized 0–100 scale across Technical, Domain (Ayush & Phyto-analytics), and Soft competencies with multi-axis radar visualization.
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm mb-2">
              <Target className="w-4 h-4 text-teal-700" />
              <span>Skill Assessment Engine</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Interactive aptitude & domain questionnaires to calibrate benchmark proficiency without subjective self-reporting.
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm mb-2">
              <SlidersHorizontal className="w-4 h-4 text-teal-700" />
              <span>Explainable Skill-Gap Matcher</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Deconstructed compatibility score showing exact required vs candidate scores, surplus strengths, and high-leverage improvement deltas.
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm mb-2">
              <Clock className="w-4 h-4 text-teal-700" />
              <span>Interactive What-If Simulation</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Reactive slider to model how improving specific deficient skills directly elevates overall opportunity match.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-100/70 border border-slate-200 text-xs text-slate-600">
          <span>Current Phase: <strong>Step 1 Foundation Complete</strong> (Routing and API connection verified)</span>
          <span className="font-mono text-slate-500">Route: /student</span>
        </div>
      </div>
    </div>
  );
};
