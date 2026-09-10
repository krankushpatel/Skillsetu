/**
 * SkillSetu - Institution Skill Supply Matrix Page
 * Step 9: Institution Dashboard + Skill Intelligence
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Search, Layers, CheckCircle2, Award, ArrowUpDown, Filter } from 'lucide-react';
import { InstitutionHeader } from '../../components/institution/InstitutionHeader';
import { institutionService, DEFAULT_INSTITUTION_ID } from '../../services/institutionService';
import { SkillSupplyResponse, SkillSupplyItem } from '../../types';

export const InstitutionSkillsPage: React.FC = () => {
  const [data, setData] = useState<SkillSupplyResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState<'proficiency' | 'students' | 'name'>('proficiency');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    institutionService.getSkillSupply(DEFAULT_INSTITUTION_ID)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load skill supply data');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    if (!data) return [];
    const set = new Set<string>();
    data.skills.forEach((s) => {
      if (s.category) set.add(s.category);
    });
    return Array.from(set).sort();
  }, [data]);

  const filteredSkills = useMemo(() => {
    if (!data) return [];
    return data.skills
      .filter((s) => {
        const matchesSearch =
          s.skillName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCat = selectedCategory === 'ALL' || s.category === selectedCategory;
        return matchesSearch && matchesCat;
      })
      .sort((a, b) => {
        if (sortBy === 'proficiency') return b.averageProficiency - a.averageProficiency;
        if (sortBy === 'students') return b.assessedStudentCount - a.assessedStudentCount;
        return a.skillName.localeCompare(b.skillName);
      });
  }, [data, searchTerm, selectedCategory, sortBy]);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      <InstitutionHeader institutionName={data?.institutionName} totalStudents={data?.totalStudents} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Intro Banner */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-teal-700" />
              <span>Cohort Skill Supply Matrix</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Aggregated proficiency distributions across all standardized assessments taken by AIIA students.
              Data reflects verified institutional skill supply across Clinical, Research, and Digital domains.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-3 shrink-0">
            <div className="text-center px-2">
              <div className="text-[10px] uppercase font-bold text-slate-500">Cohort Average</div>
              <div className="text-xl font-bold font-mono text-teal-800">
                {data?.overallCohortAverageProficiency || 0}%
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="text-center px-2">
              <div className="text-[10px] uppercase font-bold text-slate-500">Assessed Students</div>
              <div className="text-xl font-bold font-mono text-slate-900">
                {data?.assessedStudentsCount || 0}/{data?.totalStudents || 0}
              </div>
            </div>
          </div>
        </div>

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
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="ALL">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="proficiency">Sort by: Avg Proficiency</option>
              <option value="students">Sort by: Students Assessed</option>
              <option value="name">Sort by: Skill Name</option>
            </select>
          </div>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="py-20 text-center text-xs text-slate-500">
            <div className="w-6 h-6 border-2 border-teal-800 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading cohort skill supply data...
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs">
            {error}
          </div>
        )}

        {/* Skills Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSkills.map((skill) => (
              <div
                key={skill.skillId}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{skill.skillName}</h3>
                      <span className="text-[11px] text-slate-500">{skill.category}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-lg font-bold text-teal-800">
                        {skill.averageProficiency}%
                      </div>
                      <div className="text-[10px] text-slate-400">Cohort Avg</div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                    {skill.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex justify-between items-center text-[11px] text-slate-500">
                    <span>
                      Assessed in <strong className="text-slate-800">{skill.assessedStudentCount}</strong> students
                    </span>
                    <span className="font-mono">
                      {skill.strongCount} Strong • {skill.developingCount} Dev • {skill.needsImprovementCount} Needs Imp
                    </span>
                  </div>

                  {/* Tri-color Stacked Distribution Bar */}
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full"
                      style={{ width: `${skill.strongPercentage}%` }}
                      title={`Strong: ${skill.strongCount} (${skill.strongPercentage}%)`}
                    />
                    <div
                      className="bg-sky-400 h-full"
                      style={{ width: `${skill.developingPercentage}%` }}
                      title={`Developing: ${skill.developingCount} (${skill.developingPercentage}%)`}
                    />
                    <div
                      className="bg-amber-400 h-full"
                      style={{ width: `${skill.needsImprovementPercentage}%` }}
                      title={`Needs Improvement: ${skill.needsImprovementCount} (${skill.needsImprovementPercentage}%)`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
