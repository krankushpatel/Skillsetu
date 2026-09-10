/**
 * SkillSetu - Student Assessed Skill Profile
 * Step 3: Student Module & Skill Profile
 * 
 * Features:
 * - Overall Skill Quotient display with category benchmark
 * - Dual Visualizations: Multi-axis Radar Chart + Quantitative Progress Bars (0-100)
 * - Strict Terminology: "Assessed Skill Score" / "Skill Proficiency" (Never "Verified Skills")
 * - Status Categories:
 *     80-100: "Strong"
 *     60-79:  "Developing"
 *     <60:    "Needs Improvement"
 * - Top Strengths (Top 3) & Skills to Improve (Lowest 3)
 * - Assessment metadata (last assessed date, standardized assessment status)
 * - Actionable CTA: "Take Skill Assessment" -> /student/assessment-placeholder
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Award, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle, 
  ArrowRight, 
  RefreshCw, 
  FileCheck2, 
  Layers, 
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';
import { studentService } from '../../services/studentService';
import { StudentNav } from '../../components/student/StudentNav';
import { SkillRadarChart } from '../../components/student/SkillRadarChart';
import { StudentFullProfile, EnrichedStudentSkill } from '../../types';

export const StudentSkillsPage: React.FC = () => {
  const [profile, setProfile] = useState<StudentFullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');

  const fetchSkillsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await studentService.getStudentById();
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch student skill profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkillsData();

    const handleStudentChange = () => {
      fetchSkillsData();
    };
    window.addEventListener('skillsetu_active_student_changed', handleStudentChange);
    return () => {
      window.removeEventListener('skillsetu_active_student_changed', handleStudentChange);
    };
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        <div className="h-14 bg-slate-200 rounded-xl mb-6" />
        <div className="h-40 bg-slate-200 rounded-2xl mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-96 bg-slate-200 rounded-2xl" />
          <div className="h-96 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-rose-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-rose-900 mb-1">Unable to Load Assessed Skills</h2>
          <p className="text-xs text-rose-700 mb-5 max-w-md mx-auto">{error}</p>
          <button
            onClick={fetchSkillsData}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  const allSkills = profile.assessedSkills || [];
  const sortedSkills = [...allSkills].sort((a, b) => b.proficiency - a.proficiency);
  const strengths = sortedSkills.slice(0, 3);
  const toImprove = sortedSkills.length > 3 
    ? [...sortedSkills].reverse().slice(0, 3) 
    : [];

  const filteredSkills = activeCategoryFilter === 'ALL'
    ? allSkills
    : allSkills.filter(s => s.category === activeCategoryFilter);

  // Status Category Helper
  const getProficiencyCategory = (score: number) => {
    if (score >= 80) {
      return {
        label: 'Strong',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        barColor: 'bg-emerald-600',
        description: 'Demonstrates deep mastery in standardized evaluations'
      };
    } else if (score >= 60) {
      return {
        label: 'Developing',
        badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
        barColor: 'bg-teal-600',
        description: 'Solid functional grasp; ready for practical project immersion'
      };
    } else {
      return {
        label: 'Needs Improvement',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        barColor: 'bg-amber-500',
        description: 'Foundational gaps identified; recommended for targeted coursework'
      };
    }
  };

  const quotientCategory = getProficiencyCategory(profile.skillQuotient);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <StudentNav 
        currentStudentName={profile.name} 
        onStudentChange={() => fetchSkillsData()} 
      />

      {/* Header Metric & Terminology Context Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                Objective Skills Analytics
              </span>
              <span className="text-xs text-slate-500">
                {allSkills.length} Assessed Competencies
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Assessed Skill Profile
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mt-1 leading-relaxed">
              Every score shown below is an <strong>Assessed Skill Score</strong> derived from standardized objective evaluations, eliminating self-reported inflation.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 min-w-[200px]">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs text-slate-500 font-medium">Overall Skill Quotient</span>
                <span className={`px-2 py-0.2 rounded text-[10px] font-bold border ${quotientCategory.badgeClass}`}>
                  {quotientCategory.label}
                </span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900">
                {profile.skillQuotient} <span className="text-sm font-normal text-slate-400">/ 100</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 mt-2 overflow-hidden">
                <div 
                  className={`h-2 rounded-full ${quotientCategory.barColor}`} 
                  style={{ width: `${profile.skillQuotient}%` }}
                />
              </div>
            </div>

            <Link
              to="/student/assessment"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-teal-800 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Take Skill Assessment</span>
            </Link>
          </div>
        </div>

        {/* Institutional Benchmark Explainer */}
        <div className="mt-4 flex items-start gap-2.5 text-xs text-slate-600 bg-teal-50/50 p-3.5 rounded-xl border border-teal-100">
          <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed text-[11px] sm:text-xs">
            <strong>Skill Classification Guide:</strong> Scores <strong>80–100</strong> indicate <span className="text-emerald-700 font-semibold">Strong</span> proficiency; 
            <strong> 60–79</strong> denote <span className="text-teal-700 font-semibold">Developing</span> competencies; 
            scores <strong>below 60</strong> indicate <span className="text-amber-700 font-semibold">Needs Improvement</span>. 
            <span className="text-slate-500 block mt-0.5">
              (Note: These categories serve as diagnostic guidance and are not official industry certifications).
            </span>
          </div>
        </div>
      </div>

      {/* Top Strengths and Skills to Improve Comparative Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Your Strengths (Top 3) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Your Top Strengths</h3>
              <p className="text-[11px] text-slate-500">Highest scores among your assessed competencies</p>
            </div>
          </div>

          <div className="space-y-3">
            {strengths.map((skill, idx) => (
              <div key={skill.skillId} className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/40">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{skill.skillName}</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    {skill.proficiency}% Assessed
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${skill.proficiency}%` }} />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5">
                  <span className="capitalize">{skill.category.toLowerCase().replace('_', ' ')}</span>
                  <span>Industry Demand: {skill.industryDemandScore || 80}/100</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Skills to Improve (Lowest 3) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Skills to Improve</h3>
              <p className="text-[11px] text-slate-500">Target areas offering the greatest growth leverage</p>
            </div>
          </div>

          <div className="space-y-3">
            {toImprove.map((skill, idx) => (
              <div key={skill.skillId} className="p-3 rounded-xl border border-amber-100 bg-amber-50/40">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center">
                      !
                    </span>
                    <span className="text-xs font-bold text-slate-900">{skill.skillName}</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                    {skill.proficiency}% Assessed
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${skill.proficiency}%` }} />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5">
                  <span className="capitalize">{skill.category.toLowerCase().replace('_', ' ')}</span>
                  <span className="text-amber-800 font-medium">Growth Target</span>
                </div>
              </div>
            ))}
          </div>

          {toImprove.length > 0 && (
            <div className="pt-3 mt-3 border-t border-slate-100 flex justify-end">
              <Link
                to="/student/opportunities"
                className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800 hover:text-teal-950"
              >
                <span>Simulate skill gains on open opportunities</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Primary Visualizations Grid: Multi-Axis Radar & Detailed Progress Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        {/* Visual 1: Multi-Axis Radar Chart */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Multi-Competency Radar</h3>
                <p className="text-xs text-slate-500">Visual mapping of assessed proficiency balances</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                SVG Vector
              </span>
            </div>

            <SkillRadarChart skills={allSkills} size={400} />
          </div>

          <div className="mt-6 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-600">
            Hover over any node on the chart to inspect individual assessed score percentages.
          </div>
        </div>

        {/* Visual 2: Detailed Progress List with Exact Scores (0-100) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Individual Skill Proficiencies</h3>
                <p className="text-xs text-slate-500">Quantitative scores verified through assessment protocols</p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto">
                {['ALL', 'TECHNICAL', 'DOMAIN', 'ANALYTICAL'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                      activeCategoryFilter === cat
                        ? 'bg-teal-800 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {filteredSkills.map((skill) => {
                const cat = getProficiencyCategory(skill.proficiency);
                return (
                  <div key={skill.skillId} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div>
                        <span className="font-bold text-slate-900">{skill.skillName}</span>
                        <span className="ml-2 text-[10px] px-1.5 py-0.2 rounded bg-white border border-slate-200 text-slate-600">
                          {skill.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.2 rounded text-[10px] font-bold border ${cat.badgeClass}`}>
                          {cat.label}
                        </span>
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {skill.proficiency}%
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-2">
                      <div 
                        className={`h-2 rounded-full ${cat.barColor} transition-all duration-300`} 
                        style={{ width: `${skill.proficiency}%` }} 
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-teal-600" />
                        <span>Assessed via Standardized Assessment</span>
                      </span>
                      <span className="flex items-center gap-1 font-mono text-[10px]">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Last assessed: {skill.lastAssessed || '2026-02-15'}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Looking to improve your proficiency?
            </span>
            <Link
              to="/student/assessment"
              className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900"
            >
              <span>Take standardized test</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
