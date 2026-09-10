/**
 * SkillSetu - Industry Header & Demo Switcher
 * Step 7: Industry Workspace
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Building2, 
  LayoutDashboard, 
  Briefcase, 
  PlusCircle, 
  MapPin, 
  Info,
  ChevronDown
} from 'lucide-react';
import { useIndustry } from '../../context/IndustryContext';

interface IndustryHeaderProps {
  activeTab?: 'dashboard' | 'opportunities' | 'create';
}

export const IndustryHeader: React.FC<IndustryHeaderProps> = ({ activeTab }) => {
  const location = useLocation();
  const { selectedIndustryId, setSelectedIndustryId, currentOrg, demoOrganizations } = useIndustry();

  // Determine active tab from route if not explicitly passed
  const currentTab = activeTab || (
    location.pathname.includes('/opportunities/new') 
      ? 'create'
      : location.pathname.includes('/opportunities') 
      ? 'opportunities' 
      : 'dashboard'
  );

  return (
    <div className="bg-white border-b border-slate-200">
      {/* Disclaimer Banner */}
      <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-1.5 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-medium">
          <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span>Fictional Demo Organization | Non-Persistent Candidate Discovery Workspace</span>
        </div>
        <span className="text-[11px] text-amber-700 hidden sm:inline">
          Candidate ranking driven by deterministic Step 5 SkillMatchingEngine
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Organization Info & Demo Selector */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-800 text-teal-100 flex items-center justify-center shrink-0 shadow-sm">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  {currentOrg.name}
                </h1>
                
                {/* Organization Switcher Dropdown */}
                <div className="relative inline-block text-left">
                  <select
                    value={selectedIndustryId}
                    onChange={(e) => setSelectedIndustryId(e.target.value)}
                    aria-label="Switch Demo Organization"
                    className="appearance-none bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold py-1 pl-2.5 pr-7 rounded-lg cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-teal-700"
                  >
                    {demoOrganizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        Switch Demo: {org.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2 top-2 pointer-events-none" />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
                <span className="font-medium text-teal-800">{currentOrg.type}</span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1 text-slate-500">
                  <MapPin className="w-3 h-3" />
                  {currentOrg.location}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500">Academic Partner: AIIA</span>
              </div>
            </div>
          </div>

          {/* Quick Action */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/industry/opportunities/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-800 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post Opportunity</span>
            </Link>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 border-t border-slate-100 mt-5 pt-3">
          <Link
            to="/industry"
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              currentTab === 'dashboard'
                ? 'bg-teal-50 text-teal-800 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>

          <Link
            to="/industry/opportunities"
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              currentTab === 'opportunities'
                ? 'bg-teal-50 text-teal-800 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>My Opportunities</span>
          </Link>

          <Link
            to="/industry/opportunities/new"
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              currentTab === 'create'
                ? 'bg-teal-50 text-teal-800 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post Opportunity</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
