/**
 * SkillSetu - Assessment Engine Placeholder
 * Step 3: Student Module & Skill Profile
 * 
 * Provides an institutional, professional placeholder for Step 4.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { FileCheck2, ArrowLeft, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import { StudentNav } from '../../components/student/StudentNav';

export const StudentAssessmentPlaceholderPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <StudentNav />

      <Link
        to="/student/skills"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to My Skills</span>
      </Link>

      <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 shadow-sm text-center">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center mx-auto mb-4 border border-teal-200">
          <FileCheck2 className="w-8 h-8" />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200 mb-3">
          <Clock className="w-3.5 h-3.5" />
          <span>Scheduled for STEP 4</span>
        </span>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Standardized Skill Assessment Engine
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed mb-8">
          The upcoming Step 4 introduces the objective, timed testing framework across Python, HL7 FHIR interoperability, Ayurvedic clinical informatics, and biostatistics.
        </p>

        <div className="max-w-md mx-auto text-left bg-slate-50 border border-slate-200 rounded-xl p-5 mb-8 text-xs text-slate-700 space-y-2.5">
          <div className="font-semibold text-slate-900 mb-1">What will be included in Step 4:</div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
            <span>Standardized assessment question bank with difficulty tiers</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
            <span>Real-time objective scoring algorithms</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
            <span>Instant skill quotient recalculation upon assessment submission</span>
          </div>
        </div>

        <Link
          to="/student/skills"
          className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white text-xs font-semibold transition-colors"
        >
          <span>Return to Assessed Skill Profile</span>
        </Link>
      </div>
    </div>
  );
};
