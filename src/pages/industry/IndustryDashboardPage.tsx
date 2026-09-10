/**
 * SkillSetu - Industry Dashboard Page
 * Step 7: Industry Workspace
 * 
 * Provides an operational dashboard for the selected demo organization:
 * - Real-time candidate evaluation KPIs
 * - Candidate skill supply analytics across AIIA students
 * - Live opportunities with matched candidate metrics
 * - Quick actions to post and manage roles
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Briefcase, 
  Users, 
  CheckCircle2, 
  TrendingUp, 
  PlusCircle, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Sparkles,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { IndustryHeader } from '../../components/industry/IndustryHeader';
import { SkillSupplyChart } from '../../components/industry/SkillSupplyChart';
import { useIndustry } from '../../context/IndustryContext';
import { industryService } from '../../services/industryService';
import { IndustryProfileStats, EnrichedIndustryOpportunity } from '../../types';

export const IndustryDashboardPage: React.FC = () => {
  const { selectedIndustryId, currentOrg } = useIndustry();
  const [profile, setProfile] = useState<IndustryProfileStats | null>(null);
  const [opportunities, setOpportunities] = useState<EnrichedIndustryOpportunity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      industryService.getIndustryProfile(selectedIndustryId),
      industryService.listIndustryOpportunities(selectedIndustryId)
    ])
      .then(([profData, oppsData]) => {
        if (isMounted) {
          setProfile(profData);
          setOpportunities(oppsData);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load industry dashboard data.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedIndustryId]);

  const activeOpps = opportunities.filter((o) => o.status === 'OPEN');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <IndustryHeader activeTab="dashboard" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome & Organization Mission Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">
              Candidate Discovery & Competency Alignment
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Welcome to the {currentOrg.name} Portal
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              {currentOrg.description}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/industry/opportunities/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Define Skill Requirements</span>
            </Link>
          </div>
        </div>

        {/* Loading / Error State */}
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-teal-800 border-t-transparent animate-spin" />
            <span>Aggregating candidate evaluation metrics and opportunities...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <>
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Active Opportunities */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Active Roles
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center">
                    <Briefcase className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 font-mono">
                    {profile?.activeOpportunities ?? 0}
                  </span>
                  <span className="text-xs text-slate-500">
                    of {profile?.totalOpportunities ?? 0} total
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Open for student matching
                </span>
              </div>

              {/* Total Candidates Assessed */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    AIIA Candidates
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 font-mono">
                    {profile?.totalCandidatesAssessed ?? 0}
                  </span>
                  <span className="text-xs text-slate-500">
                    students assessed
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Standardized skill pool
                </span>
              </div>

              {/* Eligible Candidates */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Eligible Candidates
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-800 font-mono">
                    {profile?.totalEligibleCandidates ?? 0}
                  </span>
                  <span className="text-xs text-slate-500">
                    matches found
                  </span>
                </div>
                <span className="text-[11px] text-emerald-700 block mt-1">
                  Satisfy all mandatory skills
                </span>
              </div>

              {/* Average Match Score */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Avg Match Score
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-teal-900 font-mono">
                    {profile?.averageMatchScore ?? 0}%
                  </span>
                  <span className="text-xs text-slate-500">
                    overall fit
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Weighted competency alignment
                </span>
              </div>
            </div>

            {/* Active Opportunities Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Live Opportunities & Candidate Pipeline
                  </h3>
                  <p className="text-xs text-slate-500">
                    Opportunities posted by {currentOrg.name} with live candidate evaluation stats.
                  </p>
                </div>

                <Link
                  to="/industry/opportunities"
                  className="text-xs font-semibold text-teal-800 hover:text-teal-900 flex items-center gap-1"
                >
                  <span>View All Opportunities</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {activeOpps.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
                  <Briefcase className="w-8 h-8 text-slate-400 mx-auto" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-800">No active opportunities posted yet</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Define required competencies and weights to discover candidates from the AIIA talent pool.
                    </p>
                  </div>
                  <Link
                    to="/industry/opportunities/new"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-800 hover:bg-teal-700 text-white text-xs font-semibold"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Post First Opportunity</span>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeOpps.map((opp) => (
                    <div
                      key={opp.id}
                      className="bg-white rounded-xl border border-slate-200 p-5 hover:border-teal-700/50 hover:shadow-xs transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                                {opp.type}
                              </span>
                              <span className="text-[10px] font-medium text-slate-500">
                                {opp.workMode}
                              </span>
                            </div>
                            <h4 className="text-base font-bold text-slate-900 mt-1">
                              {opp.title}
                            </h4>
                          </div>

                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            OPEN
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {opp.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {opp.location}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span>{opp.stipend}</span>
                          <span className="text-slate-300">•</span>
                          <span>{opp.duration}</span>
                        </div>

                        {/* Competencies Badges */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {opp.requiredSkills.map((req) => (
                            <span
                              key={req.skillId}
                              className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                                req.mandatory
                                  ? 'bg-amber-50 text-amber-900 border border-amber-200 font-semibold'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                              title={`${req.skillName}: min ${req.requiredProficiency ?? req.minProficiency}%, weight ${req.weight} pts`}
                            >
                              {req.skillName} ({req.requiredProficiency ?? req.minProficiency}%) {req.mandatory ? '★' : ''}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Candidate Matching Footer */}
                      <div className="border-t border-slate-100 mt-4 pt-3 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Eligible Matches</span>
                            <span className="font-bold text-emerald-800 font-mono">
                              {opp.candidateStats.eligibleCandidates} candidates
                            </span>
                          </div>
                          <div className="border-l border-slate-200 pl-3">
                            <span className="text-slate-400 block text-[10px]">Avg Match</span>
                            <span className="font-bold text-teal-900 font-mono">
                              {opp.candidateStats.averageMatchScore}%
                            </span>
                          </div>
                        </div>

                        <Link
                          to={`/industry/opportunities/${opp.id}/candidates`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-700 text-white text-xs font-semibold transition-colors"
                        >
                          <span>Ranked Candidates</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Candidate Competency Supply Visualization */}
            <SkillSupplyChart />
          </>
        )}
      </main>
    </div>
  );
};
