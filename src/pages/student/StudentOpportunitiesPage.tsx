/**
 * SkillSetu - Available Opportunities Explorer
 * Step 5: Explainable Skill Matching Engine
 * 
 * Features:
 * - Live opportunities fetched from MongoDB /api/opportunities
 * - Server-authoritative deterministic Match Scores from /api/opportunities/match/:studentId
 * - Card display showing: Match Score (%), Eligibility status, Skills met, Mandatory gaps
 * - Filtering by Opportunity Type, Work Mode, and Search Query
 * - Direct navigation to dedicated Opportunity Detail & Match Diagnostics view
 * - Strict Compliance: Zero client-side score calculation; backend is 100% authoritative
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Briefcase, 
  Building2, 
  MapPin, 
  Clock, 
  Banknote, 
  Search, 
  SlidersHorizontal, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Info,
  TrendingUp,
  AlertTriangle,
  Check
} from 'lucide-react';
import { studentService } from '../../services/studentService';
import { matchingService } from '../../services/matchingService';
import { StudentNav } from '../../components/student/StudentNav';
import { Opportunity, OpportunityMatchSummary } from '../../types';

export const StudentOpportunitiesPage: React.FC = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [matchesByOppId, setMatchesByOppId] = useState<Record<string, OpportunityMatchSummary>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedWorkMode, setSelectedWorkMode] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'MATCH' | 'TITLE'>('MATCH');

  const activeStudentId = localStorage.getItem('skillsetu_active_student_id') || 'sp_01';

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch base opportunities
      const opps = await studentService.getOpportunities();
      setOpportunities(opps);

      // 2. Fetch authoritative match scores for the active student
      try {
        const matches = await matchingService.getAllOpportunityMatches(activeStudentId);
        const map: Record<string, OpportunityMatchSummary> = {};
        for (const m of matches) {
          map[m.opportunityId] = m;
        }
        setMatchesByOppId(map);
      } catch (matchErr) {
        console.warn('Batch match fetch error:', matchErr);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch opportunities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleStudentChange = () => {
      fetchData();
    };

    window.addEventListener('skillsetu_active_student_changed', handleStudentChange);
    return () => {
      window.removeEventListener('skillsetu_active_student_changed', handleStudentChange);
    };
  }, []);

  const filteredOpportunities = opportunities.filter((opp) => {
    const matchesSearch = 
      opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === 'ALL' || opp.type === selectedType;
    const matchesWorkMode = selectedWorkMode === 'ALL' || opp.workMode === selectedWorkMode;

    return matchesSearch && matchesType && matchesWorkMode;
  });

  // Sort by Match Score descending or Title
  const sortedOpportunities = [...filteredOpportunities].sort((a, b) => {
    if (sortBy === 'MATCH') {
      const scoreA = matchesByOppId[a.id]?.matchScore ?? 0;
      const scoreB = matchesByOppId[b.id]?.matchScore ?? 0;
      return scoreB - scoreA;
    }
    return a.title.localeCompare(b.title);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <StudentNav />

      {/* Header Banner & Step 5 Active Notice */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200 mb-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Step 5 • Live Deterministic Match Scoring Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Opportunity Match Explorer
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mt-1 leading-relaxed">
              Real-time match scores calculated server-side from your latest Assessed Skill Scores against opportunity requirements and weights.
            </p>
          </div>

          <div className="text-left md:text-right">
            <span className="text-2xl font-black text-slate-900">{opportunities.length}</span>
            <span className="text-xs text-slate-500 block">Total Database Listings</span>
          </div>
        </div>

        {/* Explainable Matching Methodology Note */}
        <div className="mt-4 flex items-start gap-2.5 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed text-[11px] sm:text-xs">
            <strong>Deterministic Matching:</strong> Match Scores represent weighted proficiency fulfillment: 
            <span className="font-mono bg-white px-1 py-0.2 rounded border border-slate-200 ml-1">
              (Σ cappedRatio × weight / Σ weights) × 100
            </span>. 
            Candidate eligibility requires meeting all mandatory competencies. No LLMs or generative AI are involved in evaluation.
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, partner, or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700 bg-slate-50"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Type:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 px-2 py-1.5 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-teal-700"
            >
              <option value="ALL">All Types</option>
              <option value="INTERNSHIP">Internship</option>
              <option value="PROJECT">Project</option>
              <option value="FULL_TIME">Full Time</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Mode:</span>
            <select
              value={selectedWorkMode}
              onChange={(e) => setSelectedWorkMode(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 px-2 py-1.5 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-teal-700"
            >
              <option value="ALL">All Modes</option>
              <option value="REMOTE">Remote</option>
              <option value="HYBRID">Hybrid</option>
              <option value="ON_SITE">On-Site</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'MATCH' | 'TITLE')}
              className="text-xs rounded-lg border border-slate-200 px-2 py-1.5 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-teal-700 font-medium text-slate-800"
            >
              <option value="MATCH">Highest Match First</option>
              <option value="TITLE">Title Alphabetical</option>
            </select>
          </div>

          {(searchQuery || selectedType !== 'ALL' || selectedWorkMode !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedType('ALL');
                setSelectedWorkMode('ALL');
              }}
              className="text-xs text-teal-700 hover:text-teal-900 font-medium px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Opportunities Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-72 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-rose-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-rose-900">Failed to Load Opportunities</h3>
          <p className="text-xs text-rose-700 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      ) : sortedOpportunities.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 mb-1">No Opportunities Match Your Criteria</h3>
          <p className="text-xs text-slate-500 mb-4">Try clearing your filters or searching with different keywords.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedType('ALL');
              setSelectedWorkMode('ALL');
            }}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedOpportunities.map((opp) => {
            const match = matchesByOppId[opp.id];
            const matchScore = match?.matchScore ?? 0;
            const mandatoryGaps = match 
              ? (match.summary.mandatorySkills - match.summary.mandatoryRequirementsMet) 
              : 0;

            return (
              <div
                key={opp.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-teal-500 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Type & Mode Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200 uppercase tracking-wider">
                      {opp.type}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {opp.workMode}
                    </span>
                  </div>

                  {/* Title & Organization */}
                  <h3 className="text-base font-bold text-slate-900 mb-1 line-clamp-1">
                    {opp.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-3">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-800">{opp.organizationName}</span>
                  </div>

                  {/* ========================================================== */}
                  {/* STEP 7 SPEC: PROMINENT MATCH SCORE BOX                     */}
                  {/* ========================================================== */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Match Score
                        </span>
                        <div className="text-2xl font-black text-slate-900 mt-0.5">
                          {match ? `${matchScore}%` : 'Calculating...'}
                        </div>
                      </div>

                      {match && (
                        <div className="text-right">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                            match.eligibility === 'ELIGIBLE'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {match.eligibility === 'ELIGIBLE' ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Eligible</span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-3 h-3" />
                                <span>Conditional</span>
                              </>
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Skills Met & Mandatory Gaps Status */}
                    {match && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-600">
                        <span>{match.summary.skillsMet}/{match.summary.requiredSkills} skills met</span>
                        <span>
                          {mandatoryGaps > 0 ? (
                            <span className="text-rose-700 font-semibold">{mandatoryGaps} mandatory gap</span>
                          ) : (
                            <span className="text-emerald-700 font-semibold">Mandatory met</span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                    {opp.description}
                  </p>

                  {/* Logistics */}
                  <div className="bg-slate-50/70 rounded-xl p-2.5 border border-slate-100 mb-4 space-y-1 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Stipend:</span>
                      <span className="font-semibold text-slate-800">{opp.stipend}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Duration:</span>
                      <span className="font-medium text-slate-700">{opp.duration}</span>
                    </div>
                  </div>
                </div>

                {/* View Match Details CTA */}
                <Link
                  to={`/student/opportunities/${opp.id}`}
                  className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-teal-800 text-white text-xs font-semibold transition-colors mt-2"
                >
                  <span>View Match Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
