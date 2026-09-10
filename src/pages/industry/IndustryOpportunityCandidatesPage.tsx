/**
 * SkillSetu - Opportunity Candidate Pipeline Page
 * Step 7: Industry Workspace
 * 
 * Renders the ranked candidate pipeline for an opportunity evaluated by the
 * authoritative Step 5 SkillMatchingEngine:
 * - Deterministic ranking (Match score desc, ELIGIBLE before CONDITIONAL, tie breakers)
 * - Candidate profile summary & academic affiliation (AIIA)
 * - Eligibility filtering & search
 * - Deep explainable match diagnostics modal
 */

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Briefcase, 
  Sliders, 
  Info,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { IndustryHeader } from '../../components/industry/IndustryHeader';
import { CandidateCard } from '../../components/industry/CandidateCard';
import { CandidateDetailModal } from '../../components/industry/CandidateDetailModal';
import { useIndustry } from '../../context/IndustryContext';
import { industryService } from '../../services/industryService';
import { OpportunityCandidatesResponse, CandidateRankItem } from '../../types';

export const IndustryOpportunityCandidatesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { selectedIndustryId } = useIndustry();

  const [response, setResponse] = useState<OpportunityCandidatesResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & State
  const [eligibilityFilter, setEligibilityFilter] = useState<'ALL' | 'ELIGIBLE' | 'CONDITIONAL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active diagnostics modal
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setLoading(true);
    setError(null);

    industryService.getOpportunityCandidates(id)
      .then((data) => {
        if (isMounted) {
          setResponse(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to evaluate candidate matching pipeline.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const candidates = response?.candidates || [];

  const filteredCandidates = candidates.filter((cand) => {
    const matchesEligibility = 
      eligibilityFilter === 'ALL' || cand.eligibility === eligibilityFilter;
    const matchesSearch = 
      cand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cand.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cand.institution.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesEligibility && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <IndustryHeader activeTab="opportunities" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/industry/opportunities" className="hover:text-slate-800 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Opportunities</span>
          </Link>
          <span>/</span>
          {id && (
            <Link to={`/industry/opportunities/${id}`} className="hover:text-slate-800">
              {response?.opportunityTitle || id}
            </Link>
          )}
          <span>/</span>
          <span className="text-slate-800 font-medium">Ranked Candidates</span>
        </div>

        {/* Opportunity Header & Ranking Overview */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                Talent Pipeline
              </span>
              <span className="text-xs text-slate-500">
                Authoritative Deterministic Ranking
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Ranked Candidates for {response?.opportunityTitle || 'Opportunity'}
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every candidate is evaluated strictly using the Step 5 SkillMatchingEngine formula.
              Ranked by Match Score, ELIGIBLE status before CONDITIONAL, and mandatory requirements met.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {id && (
              <Link
                to={`/industry/opportunities/${id}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
              >
                <Sliders className="w-4 h-4 text-teal-800" />
                <span>Inspect Competencies</span>
              </Link>
            )}
          </div>
        </div>

        {/* Loading / Error State */}
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-teal-800 border-t-transparent animate-spin" />
            <span>Computing candidate rankings and evaluating skill gaps...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        ) : response && (
          <>
            {/* Pipeline Summary Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Candidates Evaluated
                </span>
                <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
                  {response.totalCandidates}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  AIIA student records
                </span>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider block">
                  Eligible Candidates
                </span>
                <span className="text-2xl font-black text-emerald-800 font-mono mt-1 block">
                  {response.eligibleCount}
                </span>
                <span className="text-[10px] text-emerald-700 block mt-0.5">
                  100% mandatory satisfied
                </span>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <span className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider block">
                  Conditional Candidates
                </span>
                <span className="text-2xl font-black text-amber-800 font-mono mt-1 block">
                  {response.conditionalCount}
                </span>
                <span className="text-[10px] text-amber-700 block mt-0.5">
                  Have mandatory gap
                </span>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <span className="text-[10px] font-semibold text-teal-800 uppercase tracking-wider block">
                  Average Match Score
                </span>
                <span className="text-2xl font-black text-teal-900 font-mono mt-1 block">
                  {response.averageMatchScore}%
                </span>
                <span className="text-[10px] text-teal-700 block mt-0.5">
                  Top: {response.topMatchScore}%
                </span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search candidate name, program (BAMS, MD)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-teal-700 focus:outline-none"
                />
              </div>

              {/* Eligibility Filter */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  onClick={() => setEligibilityFilter('ALL')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                    eligibilityFilter === 'ALL'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({response.totalCandidates})
                </button>

                <button
                  onClick={() => setEligibilityFilter('ELIGIBLE')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                    eligibilityFilter === 'ELIGIBLE'
                      ? 'bg-emerald-50 text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Eligible ({response.eligibleCount})
                </button>

                <button
                  onClick={() => setEligibilityFilter('CONDITIONAL')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                    eligibilityFilter === 'CONDITIONAL'
                      ? 'bg-amber-50 text-amber-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Conditional ({response.conditionalCount})
                </button>
              </div>
            </div>

            {/* Candidates List */}
            {filteredCandidates.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
                <Users className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800">No candidates match current filters</h4>
                  <p className="text-xs text-slate-500">
                    Try switching eligibility filter to 'All' or clearing search text.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCandidates.map((candidate) => (
                  <CandidateCard
                    key={candidate.candidateId}
                    candidate={candidate}
                    onViewDiagnostics={(candidateId) => setSelectedCandidateId(candidateId)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Diagnostics Modal */}
        {selectedCandidateId && id && (
          <CandidateDetailModal
            opportunityId={id}
            candidateId={selectedCandidateId}
            isOpen={Boolean(selectedCandidateId)}
            onClose={() => setSelectedCandidateId(null)}
          />
        )}
      </main>
    </div>
  );
};
