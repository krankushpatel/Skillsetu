/**
 * SkillSetu - Industry Demand & Skill Gaps Diagnostic Page
 * Step 9: Institution Dashboard + Skill Intelligence
 */

import React, { useEffect, useState, useMemo } from 'react';
import { 
  GitCompare, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Filter, 
  AlertCircle,
  HelpCircle,
  BarChart3
} from 'lucide-react';
import { InstitutionHeader } from '../../components/institution/InstitutionHeader';
import { SupplyDemandComparisonChart } from '../../components/institution/SupplyDemandComparisonChart';
import { TopSkillGapsList } from '../../components/institution/TopSkillGapsList';
import { institutionService, DEFAULT_INSTITUTION_ID } from '../../services/institutionService';
import { SkillGapsResponse, SkillGapItem } from '../../types';

export const InstitutionGapsPage: React.FC = () => {
  const [data, setData] = useState<SkillGapsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    institutionService.getSkillGaps(DEFAULT_INSTITUTION_ID)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load skill gap analytics');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredGaps = useMemo(() => {
    if (!data) return [];
    return data.allSkillGaps.filter((g) => {
      const matchesSearch =
        g.skillName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || g.status === statusFilter;
      const matchesUrgency = urgencyFilter === 'ALL' || g.urgency === urgencyFilter;

      return matchesSearch && matchesStatus && matchesUrgency;
    });
  }, [data, searchTerm, statusFilter, urgencyFilter]);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      <InstitutionHeader institutionName={data?.institutionName} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Intro */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-teal-700" />
              <span>Curriculum Gap Intelligence & Industry Demand Diagnostic</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Deterministic comparison of AIIA student cohort proficiency against minimum industry benchmarks required across active opportunities.
              Formulated as: <code>Gap = IndustryRequired - StudentAverage</code>.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-lg text-center">
              <div className="text-[10px] font-bold text-rose-700 uppercase">Shortages</div>
              <div className="text-base font-bold font-mono text-rose-900">{data?.shortageCount || 0}</div>
            </div>
            <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
              <div className="text-[10px] font-bold text-emerald-700 uppercase">Balanced</div>
              <div className="text-base font-bold font-mono text-emerald-900">{data?.balancedCount || 0}</div>
            </div>
            <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <div className="text-[10px] font-bold text-blue-700 uppercase">Surplus</div>
              <div className="text-base font-bold font-mono text-blue-900">{data?.surplusCount || 0}</div>
            </div>
          </div>
        </div>

        {/* Visual Chart */}
        {data && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-teal-700" />
                  <span>Curriculum Supply vs. Live Market Demand</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Visual benchmark mapping cohort student capability against industry recruitment expectations
                </p>
              </div>
            </div>

            <SupplyDemandComparisonChart data={data.topSkillGaps} />
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search skill name or domain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-700"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="ALL">All Gap Classifications</option>
              <option value="Skill Shortage">Skill Shortage (Industry exceeds Cohort)</option>
              <option value="Balanced">Balanced (Aligned with Market)</option>
              <option value="Skill Surplus">Skill Surplus (Cohort exceeds Industry)</option>
            </select>

            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="ALL">All Urgencies</option>
              <option value="High">High Urgency</option>
              <option value="Medium">Moderate Urgency</option>
              <option value="Low">Low Urgency</option>
            </select>
          </div>
        </div>

        {/* Detailed Gaps List */}
        {loading && (
          <div className="py-20 text-center text-xs text-slate-500">
            <div className="w-6 h-6 border-2 border-teal-800 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Analyzing curriculum alignment and demand intensity...
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs">
            {error}
          </div>
        )}

        {!loading && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-900">
                Actionable Skill Gap Matrix ({filteredGaps.length} skills analyzed)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Each gap includes explainable mathematical metrics and targeted pedagogical interventions
              </p>
            </div>

            <TopSkillGapsList gaps={filteredGaps} limit={filteredGaps.length} showRecommendations={true} />
          </div>
        )}
      </main>
    </div>
  );
};
