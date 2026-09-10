/**
 * SkillSetu - Opportunity Detail Inspection Page
 * Step 7: Industry Workspace
 * 
 * Displays full specifications for an opportunity:
 * - Role metadata and organization info
 * - Complete competency requirements table with weights & benchmarks
 * - Live candidate match summary
 * - Quick transition to ranked candidate pipeline
 */

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Briefcase, 
  MapPin, 
  Calendar, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Edit3, 
  Sliders, 
  ChevronRight,
  Building2,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  FileText
} from 'lucide-react';
import { IndustryHeader } from '../../components/industry/IndustryHeader';
import { useIndustry } from '../../context/IndustryContext';
import { industryService } from '../../services/industryService';
import { EnrichedIndustryOpportunity } from '../../types';

export const IndustryOpportunityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { selectedIndustryId } = useIndustry();
  const [opportunity, setOpportunity] = useState<EnrichedIndustryOpportunity | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setLoading(true);

    industryService.getOpportunity(id)
      .then((data) => {
        if (isMounted) {
          setOpportunity(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load opportunity.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <IndustryHeader activeTab="opportunities" />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/industry/opportunities" className="hover:text-slate-800 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Opportunities</span>
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-medium">{opportunity?.title || 'Details'}</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-teal-800 border-t-transparent animate-spin" />
            <span>Loading opportunity specifications...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        ) : opportunity && (
          <>
            {/* Header Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                    {opportunity.type}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500">
                    {opportunity.workMode}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    opportunity.status === 'OPEN' 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {opportunity.status}
                  </span>
                </div>

                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {opportunity.title}
                </h1>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                  <span className="flex items-center gap-1 font-semibold text-slate-800">
                    <Building2 className="w-3.5 h-3.5 text-teal-800" />
                    {opportunity.organizationName}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <MapPin className="w-3.5 h-3.5" />
                    {opportunity.location}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span>{opportunity.stipend}</span>
                  <span className="text-slate-300">•</span>
                  <span>{opportunity.duration}</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Link
                  to={`/industry/opportunities/${opportunity.id}/applicants`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>Review Applicants</span>
                </Link>

                <Link
                  to={`/industry/opportunities/${opportunity.id}/candidates`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
                >
                  <Users className="w-4 h-4" />
                  <span>Candidate Pool</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>

                {opportunity.status === 'OPEN' && (
                  <Link
                    to={`/industry/opportunities/${opportunity.id}/edit`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Candidate Matching Summary Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-teal-900 text-white p-5 rounded-2xl shadow-xs">
              <div>
                <span className="text-[10px] text-teal-300 font-semibold uppercase tracking-wider block">
                  Eligible Matches
                </span>
                <span className="text-2xl font-black font-mono mt-0.5 block">
                  {opportunity.candidateStats.eligibleCandidates}
                </span>
                <span className="text-[11px] text-teal-200">
                  Satisfy mandatory criteria
                </span>
              </div>

              <div className="sm:border-l border-teal-800 sm:pl-4">
                <span className="text-[10px] text-teal-300 font-semibold uppercase tracking-wider block">
                  Average Match Score
                </span>
                <span className="text-2xl font-black font-mono mt-0.5 block">
                  {opportunity.candidateStats.averageMatchScore}%
                </span>
                <span className="text-[11px] text-teal-200">
                  Student talent alignment
                </span>
              </div>

              <div className="sm:border-l border-teal-800 sm:pl-4">
                <span className="text-[10px] text-teal-300 font-semibold uppercase tracking-wider block">
                  Top Match Score
                </span>
                <span className="text-2xl font-black font-mono mt-0.5 block">
                  {opportunity.candidateStats.topMatchScore}%
                </span>
                <span className="text-[11px] text-teal-200">
                  Highest scored candidate
                </span>
              </div>

              <div className="sm:border-l border-teal-800 sm:pl-4 flex items-center">
                <Link
                  to={`/industry/opportunities/${opportunity.id}/candidates`}
                  className="w-full text-center py-2 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors border border-white/20"
                >
                  Inspect Candidates →
                </Link>
              </div>
            </div>

            {/* Role Description */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-2">
              <h3 className="text-sm font-bold text-slate-900">
                Opportunity Description & Scope
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {opportunity.description}
              </p>
            </div>

            {/* Required Competencies Table */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-teal-800" />
                    <span>Configured Skill Benchmarks ({opportunity.requiredSkillsCount})</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Total Normalized Weight: {opportunity.totalWeight} pts • {opportunity.mandatorySkillsCount} Mandatory Requirements
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Standardized Skill</th>
                      <th className="py-2.5 px-4">Category</th>
                      <th className="py-2.5 px-4">Required Proficiency</th>
                      <th className="py-2.5 px-4">Weight</th>
                      <th className="py-2.5 px-4">Enforcement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {opportunity.requiredSkills.map((req) => (
                      <tr key={req.skillId} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {req.skillName}
                        </td>
                        <td className="py-3 px-4 text-slate-500 uppercase text-[10px]">
                          {req.category}
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-800">
                          ≥ {req.requiredProficiency ?? req.minProficiency}%
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {req.weight} pts
                        </td>
                        <td className="py-3 px-4">
                          {req.mandatory ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                              <ShieldCheck className="w-3 h-3 text-teal-700" />
                              Mandatory
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">
                              Optional
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
