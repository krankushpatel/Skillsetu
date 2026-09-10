/**
 * SkillSetu - Role Selection Gateway (Placeholder for Step 1)
 * Step 1: Project Foundation
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Building2, Landmark, ArrowRight, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-xs font-semibold mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Role-Based Workspace Gateway</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          Select Your SkillSetu Portal
        </h1>
        <p className="text-sm text-slate-600 max-w-lg mx-auto">
          Choose a role perspective to enter the respective workspace. Real authentication and seeded demo accounts will be integrated in subsequent steps.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Student Role Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-center hover:border-teal-500 hover:shadow-md transition-all">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-1">Student</h2>
          <p className="text-xs text-slate-500 mb-5">
            Ayush & Health-Tech Undergraduate / Post-Graduate Scholar
          </p>
          <div className="text-left text-xs bg-slate-50 p-3 rounded mb-5 text-slate-600 space-y-1">
            <p>• Assessed Skill Score tracking</p>
            <p>• Explainable Skill Matching</p>
            <p>• What-If Upskilling Simulation</p>
          </div>
          <Link
            to="/student"
            className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-4 rounded-lg bg-teal-800 hover:bg-teal-700 text-white text-xs font-medium transition-colors"
          >
            <span>Enter as Student</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Industry Role Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-center hover:border-emerald-500 hover:shadow-md transition-all">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-1">Industry Partner</h2>
          <p className="text-xs text-slate-500 mb-5">
            Recruiter / R&D Director at Ayush & Health Tech Enterprises
          </p>
          <div className="text-left text-xs bg-slate-50 p-3 rounded mb-5 text-slate-600 space-y-1">
            <p>• Post weighted opportunities</p>
            <p>• Ranked candidate pipeline</p>
            <p>• Direct shortlisting</p>
          </div>
          <Link
            to="/industry"
            className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-4 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-medium transition-colors"
          >
            <span>Enter as Recruiter</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Institution Role Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-center hover:border-amber-500 hover:shadow-md transition-all">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center mx-auto mb-4">
            <Landmark className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-1">Institution</h2>
          <p className="text-xs text-slate-500 mb-5">
            Academic Dean / Training & Placement Officer (AIIA)
          </p>
          <div className="text-left text-xs bg-slate-50 p-3 rounded mb-5 text-slate-600 space-y-1">
            <p>• Cohort Skill Health index</p>
            <p>• Supply vs Demand analysis</p>
            <p>• Placement readiness metrics</p>
          </div>
          <Link
            to="/institution"
            className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-4 rounded-lg bg-amber-800 hover:bg-amber-700 text-white text-xs font-medium transition-colors"
          >
            <span>Enter as Administrator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
