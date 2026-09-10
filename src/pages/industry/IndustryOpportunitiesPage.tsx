/**
 * SkillSetu - Industry Opportunities Management Page
 * Step 7: Industry Workspace
 * 
 * Lists and manages all opportunities posted by the selected demo organization.
 * Provides controls to filter, view requirements, inspect ranked candidates,
 * edit details, and close roles.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Briefcase, 
  PlusCircle, 
  Search, 
  MapPin, 
  Users, 
  Edit3, 
  XCircle, 
  Eye, 
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Lock,
  FileText
} from 'lucide-react';
import { IndustryHeader } from '../../components/industry/IndustryHeader';
import { useIndustry } from '../../context/IndustryContext';
import { industryService } from '../../services/industryService';
import { EnrichedIndustryOpportunity } from '../../types';

export const IndustryOpportunitiesPage: React.FC = () => {
  const { selectedIndustryId, currentOrg } = useIndustry();
  const [opportunities, setOpportunities] = useState<EnrichedIndustryOpportunity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL');
  const [closingId, setClosingId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchOpportunities = () => {
    setLoading(true);
    setError(null);
    industryService.listIndustryOpportunities(selectedIndustryId)
      .then((data) => {
        setOpportunities(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load opportunities.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOpportunities();
  }, [selectedIndustryId]);

  const handleCloseOpportunity = async (oppId: string) => {
    if (!window.confirm('Are you sure you want to close this opportunity? Candidates will no longer match against it.')) {
      return;
    }

    try {
      setClosingId(oppId);
      await industryService.closeOpportunity(oppId, selectedIndustryId);
      setActionNotice('Opportunity status updated to CLOSED.');
      fetchOpportunities();
    } catch (err: any) {
      setError(err.message || 'Failed to close opportunity.');
    } finally {
      setClosingId(null);
    }
  };

  const filteredOpportunities = opportunities.filter((opp) => {
    const matchesSearch = 
      opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.requiredSkills.some((s) => s.skillName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || opp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <IndustryHeader activeTab="opportunities" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Page Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Opportunities & Candidate Matching
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage roles posted by {currentOrg.name} and review ranked candidates.
            </p>
          </div>

          <Link
            to="/industry/opportunities/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-800 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post New Opportunity</span>
          </Link>
        </div>

        {/* Action Notice */}
        {actionNotice && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionNotice}</span>
            </div>
            <button 
              onClick={() => setActionNotice(null)} 
              className="text-emerald-700 font-bold hover:text-emerald-900 text-xs cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search roles or competencies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-teal-700 focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {(['ALL', 'OPEN', 'CLOSED'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                  statusFilter === status
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status === 'ALL' ? 'All Roles' : status}
              </button>
            ))}
          </div>
        </div>

        {/* Opportunities List */}
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-teal-800 border-t-transparent animate-spin" />
            <span>Loading opportunities...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
            <Briefcase className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800">No opportunities match the criteria</h4>
              <p className="text-xs text-slate-500">
                {searchQuery ? 'Try clearing the search query or adjusting your filters.' : 'Post your first opportunity to begin discovering qualified candidates.'}
              </p>
            </div>
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }}
                className="text-xs text-teal-800 font-semibold hover:underline cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOpportunities.map((opp) => {
              const isOpen = opp.status === 'OPEN';
              return (
                <div
                  key={opp.id}
                  className={`bg-white rounded-xl border ${
                    isOpen ? 'border-slate-200' : 'border-slate-200/60 opacity-85'
                  } p-5 hover:border-teal-700/40 hover:shadow-xs transition-all space-y-4`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                          {opp.type}
                        </span>
                        <span className="text-[10px] font-medium text-slate-500">
                          {opp.workMode}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {opp.location}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[11px] text-slate-500">
                          {opp.stipend}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 mt-1">
                        {opp.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                          isOpen
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {opp.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed max-w-4xl">
                    {opp.description}
                  </p>

                  {/* Competency Benchmarks */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Required Competencies ({opp.requiredSkillsCount}) • Total Weight: {opp.totalWeight} pts
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {opp.requiredSkills.map((req) => (
                        <span
                          key={req.skillId}
                          className={`text-[11px] px-2 py-0.5 rounded flex items-center gap-1 ${
                            req.mandatory
                              ? 'bg-teal-50 text-teal-900 border border-teal-200 font-semibold'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          <span>{req.skillName}</span>
                          <span className="font-mono text-slate-500 font-normal">≥{req.requiredProficiency ?? req.minProficiency}%</span>
                          {req.mandatory && <span className="text-teal-700 text-[10px]">★</span>}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Row: Candidate Match Stats & Action Buttons */}
                  <div className="border-t border-slate-100 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Eligible Matches</span>
                        <span className="font-bold text-emerald-800 font-mono">
                          {opp.candidateStats.eligibleCandidates} candidates
                        </span>
                      </div>

                      <div className="border-l border-slate-200 pl-4">
                        <span className="text-slate-400 block text-[10px]">Average Fit</span>
                        <span className="font-bold text-teal-900 font-mono">
                          {opp.candidateStats.averageMatchScore}%
                        </span>
                      </div>

                      <div className="border-l border-slate-200 pl-4 hidden md:block">
                        <span className="text-slate-400 block text-[10px]">Top Candidate</span>
                        <span className="font-bold text-slate-800 font-mono">
                          {opp.candidateStats.topMatchScore}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/industry/opportunities/${opp.id}`}
                        className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors"
                        title="View Opportunity Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      {isOpen && (
                        <Link
                          to={`/industry/opportunities/${opp.id}/edit`}
                          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors"
                          title="Edit Opportunity Requirements"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>
                      )}

                      {isOpen && (
                        <button
                          type="button"
                          onClick={() => handleCloseOpportunity(opp.id)}
                          disabled={closingId === opp.id}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                          title="Close Opportunity"
                        >
                          <Lock className="w-4 h-4" />
                        </button>
                      )}

                      <Link
                        to={`/industry/opportunities/${opp.id}/applicants`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 text-xs font-semibold transition-colors shrink-0"
                        title="Review Submitted Applications"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Applicants</span>
                      </Link>

                      <Link
                        to={`/industry/opportunities/${opp.id}/candidates`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-700 text-white text-xs font-semibold transition-colors shrink-0"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Ranked Candidates</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
