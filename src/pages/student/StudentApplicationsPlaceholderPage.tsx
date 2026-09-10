/**
 * SkillSetu - Applications Placeholder
 * Step 3: Student Module & Skill Profile
 * 
 * Clean institutional placeholder for Step 8 (Application & Placement Tracker).
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft, Clock, CheckCircle2 } from 'lucide-react';
import { StudentNav } from '../../components/student/StudentNav';

export const StudentApplicationsPlaceholderPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <StudentNav />

      <Link
        to="/student"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Student Dashboard</span>
      </Link>

      <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 shadow-sm text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto mb-4 border border-slate-200">
          <FileText className="w-8 h-8" />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 mb-3">
          <Clock className="w-3.5 h-3.5" />
          <span>Scheduled for STEP 8</span>
        </span>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Candidate Application Tracking
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed mb-8">
          The application workflow, submission tracking, and interview shortlisting will be activated in Step 8 following the Matching Engine (Step 5).
        </p>

        <div className="max-w-md mx-auto text-left bg-slate-50 border border-slate-200 rounded-xl p-5 mb-8 text-xs text-slate-700 space-y-2.5">
          <div className="font-semibold text-slate-900 mb-1">Upcoming in Step 8:</div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-slate-500 shrink-0" />
            <span>One-click verified application dispatch</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Industry review status (Under Review, Shortlisted, Selected)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Application history & communication log</span>
          </div>
        </div>

        <Link
          to="/student/opportunities"
          className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-teal-800 text-white text-xs font-semibold transition-colors"
        >
          <span>Browse Available Opportunities</span>
        </Link>
      </div>
    </div>
  );
};
