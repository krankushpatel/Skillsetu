/**
 * SkillSetu - Institution Header & Navigation
 * Step 9: Institution Dashboard + Skill Intelligence
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Landmark, 
  LayoutDashboard, 
  Layers, 
  GitCompare, 
  GraduationCap, 
  Briefcase, 
  MapPin, 
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface InstitutionHeaderProps {
  institutionName?: string;
  location?: string;
  totalStudents?: number;
  opportunityReadinessIndex?: number;
}

export const InstitutionHeader: React.FC<InstitutionHeaderProps> = ({
  institutionName = 'All India Institute of Ayurveda (AIIA)',
  location = 'New Delhi, Delhi',
  totalStudents = 8,
  opportunityReadinessIndex = 25.0
}) => {
  const currentPath = useLocation().pathname;

  const tabs = [
    {
      id: 'overview',
      label: 'Executive Overview',
      path: '/institution',
      exact: true,
      icon: LayoutDashboard,
    },
    {
      id: 'skills',
      label: 'Skill Supply Matrix',
      path: '/institution/skills',
      icon: Layers,
    },
    {
      id: 'gaps',
      label: 'Industry Demand & Gaps',
      path: '/institution/gaps',
      icon: GitCompare,
    },
    {
      id: 'students',
      label: 'Cohort Readiness',
      path: '/institution/students',
      icon: GraduationCap,
    },
    {
      id: 'applications',
      label: 'Applications Pipeline',
      path: '/institution/applications',
      icon: Briefcase,
    },
  ];

  return (
    <div className="bg-white border-b border-slate-200">
      {/* Official Ayush & AIIA Academic Portal Banner */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="font-semibold text-slate-100">Ministry of Ayush</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300 font-medium">Apex Autonomous Institute for Post-Graduate Education & Research</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1 text-emerald-400 font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            Deterministic Assessment Derived
          </span>
          <span className="hidden sm:inline text-slate-500">|</span>
          <span className="hidden sm:inline">SIH Problem Statement: 26044</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Institution Identity */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-900 text-teal-100 flex items-center justify-center shrink-0 shadow-sm border border-teal-800">
              <Landmark className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {institutionName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                  Apex Academic Partner
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-600">
                <span className="flex items-center gap-1 text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {location}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-600 font-medium">
                  {totalStudents} Enrolled Scholars
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-600">
                  Autonomous Institute, Ministry of Ayush
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex items-center gap-3 self-start md:self-auto bg-slate-50 border border-slate-200/90 rounded-xl p-3">
            <div className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-center">
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Cohort Size</div>
              <div className="text-lg font-bold text-slate-900 font-mono">{totalStudents}</div>
            </div>
            <div className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-center">
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Opportunity Readiness</div>
              <div className="text-lg font-bold text-emerald-700 font-mono flex items-center justify-center gap-1">
                {opportunityReadinessIndex}%
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-2 border-t border-slate-100 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.exact 
              ? currentPath === tab.path 
              : currentPath.startsWith(tab.path);

            return (
              <Link
                key={tab.id}
                to={tab.path}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-teal-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
