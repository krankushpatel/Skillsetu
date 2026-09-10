/**
 * SkillSetu - Student Workspace Dashboard
 * Step 3: Student Module & Skill Profile
 * 
 * Features:
 * - Student Welcome & Academic Overview (Name, Program, Dept, Batch, CGPA)
 * - Deterministic Overall Skill Quotient (Average of assessed proficiencies)
 * - Assessed Skills Count & Profile Radar Preview
 * - Top Strengths (Top 3) & Skills Needing Improvement (Lowest 3)
 * - Available Opportunities Preview (3 cards without match scoring)
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Award, 
  ArrowRight, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Briefcase, 
  ExternalLink,
  RefreshCw,
  Building2,
  MapPin,
  Clock,
  Banknote,
  SlidersHorizontal,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { studentService } from '../../services/studentService';
import { matchingService } from '../../services/matchingService';
import { StudentNav } from '../../components/student/StudentNav';
import { SkillRadarChart } from '../../components/student/SkillRadarChart';
import { StudentFullProfile, Opportunity, EnrichedStudentSkill, OpportunityMatchSummary } from '../../types';

export const StudentDashboardPage: React.FC = () => {
  const [profile, setProfile] = useState<StudentFullProfile | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [matchesByOppId, setMatchesByOppId] = useState<Record<string, OpportunityMatchSummary>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const activeStudentId = localStorage.getItem('skillsetu_active_student_id') || 'sp_01';
      const [profileData, oppsData, matchesData] = await Promise.all([
        studentService.getStudentById(),
        studentService.getOpportunities(),
        matchingService.getAllOpportunityMatches(activeStudentId).catch(() => [])
      ]);
      setProfile(profileData);
      setOpportunities(oppsData);

      const map: Record<string, OpportunityMatchSummary> = {};
      for (const m of matchesData) {
        map[m.opportunityId] = m;
      }
      setMatchesByOppId(map);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to connect to SkillSetu API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Listen to demo student switcher event
    const handleStudentChange = () => {
      fetchDashboardData();
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
        <div className="h-44 bg-slate-200 rounded-2xl mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="h-40 bg-slate-200 rounded-xl" />
          <div className="h-40 bg-slate-200 rounded-xl" />
          <div className="h-40 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-rose-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-rose-900 mb-1">Student Profile Unavailable</h2>
          <p className="text-xs text-rose-700 mb-5 max-w-md mx-auto">
            {error || 'Could not fetch student record from the backend service.'}
          </p>
          <button
            onClick={fetchDashboardData}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  // Derive Deterministic Strengths & Improvement Areas from actual student assessed skills
  const assessedSkills = profile.assessedSkills || [];
  const sortedSkills = [...assessedSkills].sort((a, b) => b.proficiency - a.proficiency);
  const topStrengths = sortedSkills.slice(0, 3);
  const skillsToImprove = sortedSkills.length > 3 
    ? [...sortedSkills].reverse().slice(0, 3) 
    : [];

  // Skill Quotient category helper
  const getQuotientBadge = (score: number) => {
    if (score >= 80) {
      return { label: 'Strong', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' };
    } else if (score >= 60) {
      return { label: 'Developing', bg: 'bg-teal-50 text-teal-800 border-teal-200', dot: 'bg-teal-500' };
    } else {
      return { label: 'Needs Improvement', bg: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500' };
    }
  };

  const quotientBadge = getQuotientBadge(profile.skillQuotient);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Sub Navigation with Candidate Switcher */}
      <StudentNav 
        currentStudentName={profile.name} 
        onStudentChange={() => fetchDashboardData()} 
      />

      {/* Welcome & Academic Standing Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white rounded-2xl p-6 sm:p-8 mb-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <img 
              src={profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`} 
              alt={profile.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-800 border-2 border-teal-400/40 object-cover shadow-sm" 
            />
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {profile.institutionName}
                </span>
                <span className="text-slate-400 text-xs">Batch {profile.batch}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1">
                Welcome, {profile.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                {profile.course} • <strong>{profile.department}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/10 text-center min-w-[110px]">
              <div className="text-[11px] uppercase tracking-wider text-slate-300 font-medium">CGPA</div>
              <div className="text-2xl font-bold text-white mt-0.5">{profile.cgpa.toFixed(1)}</div>
              <div className="text-[10px] text-teal-300">Out of 10.0</div>
            </div>

            <Link
              to="/student/profile"
              className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition-colors shadow-sm"
            >
              <span>View Full Bio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Primary Career & Skill Telemetry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Overall Skill Quotient Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Overall Skill Quotient</h3>
                  <p className="text-[11px] text-slate-500">Standardized Assessed Average</p>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${quotientBadge.bg}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${quotientBadge.dot}`} />
                <span>{quotientBadge.label}</span>
              </span>
            </div>

            <div className="my-5 text-center">
              <div className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                {profile.skillQuotient}
                <span className="text-lg font-medium text-slate-400"> / 100</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 mt-4 overflow-hidden">
                <div 
                  className="bg-teal-700 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(profile.skillQuotient, 100)}%` }} 
                />
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200/80 mb-4">
              Deterministic average calculated across <strong>{assessedSkills.length}</strong> standardized assessed skills. 
              <span className="block mt-1 text-[11px] text-slate-500">
                (Note: This reflects current assessed skills; institutional Placement Readiness Index is calculated in later modules).
              </span>
            </p>
          </div>

          <Link
            to="/student/skills"
            className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
          >
            <span>Explore Skill Breakdown & Radar</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Top Strengths Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Top Strengths</h3>
                <p className="text-[11px] text-slate-500">Your highest assessed proficiencies</p>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              {topStrengths.map((skill) => (
                <div key={skill.skillId} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-900 mb-1">
                    <span>{skill.skillName}</span>
                    <span className="font-mono text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded text-[11px]">
                      {skill.proficiency}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="capitalize">{skill.category.toLowerCase().replace('_', ' ')}</span>
                    <span>Assessed Score</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-2 border-t border-slate-100">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Benchmark validated via standardized testing</span>
          </div>
        </div>

        {/* Skills Needing Improvement Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Skills to Improve</h3>
                <p className="text-[11px] text-slate-500">Target areas for highest career leverage</p>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              {skillsToImprove.map((skill) => (
                <div key={skill.skillId} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-900 mb-1">
                    <span>{skill.skillName}</span>
                    <span className="font-mono text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded text-[11px]">
                      {skill.proficiency}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="capitalize">{skill.category.toLowerCase().replace('_', ' ')}</span>
                    <span className="text-amber-800 font-medium">Growth Focus</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link
            to="/student/assessment"
            className="text-[11px] text-teal-800 hover:text-teal-900 font-medium flex items-center gap-1 pt-2 border-t border-slate-100"
          >
            <span>Take Standardized Skill Assessment</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Radar Chart & Summary Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Assessed Skill Radar</h3>
              <p className="text-xs text-slate-500">Multi-axis proficiency mapping across {assessedSkills.length} competencies</p>
            </div>
            <Link
              to="/student/skills"
              className="text-xs font-medium text-teal-700 hover:text-teal-900 flex items-center gap-1"
            >
              <span>Full Details</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <SkillRadarChart skills={assessedSkills} size={380} />
        </div>

        {/* Portfolio & Academic Snapshot */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-700" />
              <span>Academic Projects</span>
            </h3>
            <div className="space-y-2.5 text-xs">
              {profile.projects && profile.projects.length > 0 ? (
                profile.projects.slice(0, 3).map((p, i) => (
                  <div key={i} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50">
                    <div className="font-semibold text-slate-800">{p.title}</div>
                    <div className="text-[11px] text-slate-500 flex items-center justify-between mt-1">
                      <span>{p.domain || p.role || 'Scholar'}</span>
                      <span className="px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200 text-[10px]">
                        {p.status || 'Active'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 text-xs py-3 text-center">No projects recorded yet.</div>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-teal-700" />
              <span>Certifications</span>
            </h3>
            <div className="space-y-2 text-xs">
              {profile.certifications && profile.certifications.length > 0 ? (
                profile.certifications.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-teal-50/50 text-slate-800 border border-teal-100">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span className="font-medium">{c}</span>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 text-xs py-3 text-center">No certifications recorded yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Opportunities Section (Step 5) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                Recommended Opportunities
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                Live Match Engine
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Evaluated deterministically against your latest Assessed Skill Scores.
            </p>
          </div>

          <Link
            to="/student/opportunities"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900 transition-colors self-start sm:self-center"
          >
            <span>View All Opportunities</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...opportunities]
            .sort((a, b) => {
              const scoreA = matchesByOppId[a.id]?.matchScore ?? 0;
              const scoreB = matchesByOppId[b.id]?.matchScore ?? 0;
              return scoreB - scoreA;
            })
            .slice(0, 3)
            .map((opp) => {
              const match = matchesByOppId[opp.id];
              const score = match?.matchScore ?? 0;
              return (
                <div 
                  key={opp.id} 
                  className="border border-slate-200 rounded-xl p-5 hover:border-teal-400 hover:shadow-sm transition-all flex flex-col justify-between bg-slate-50/40"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200 uppercase tracking-wider">
                        {opp.type}
                      </span>
                      {match && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          match.eligibility === 'ELIGIBLE'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {match.eligibility === 'ELIGIBLE' ? 'Eligible' : 'Conditional'}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mb-1 line-clamp-1">
                      {opp.title}
                    </h4>

                    <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-3">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium truncate">{opp.organizationName}</span>
                    </div>

                    {/* Prominent Match Score */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 mb-3 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Match Score</span>
                        <span className="text-xl font-black text-slate-900">
                          {match ? `${score}%` : 'Calculating...'}
                        </span>
                      </div>
                      {match && (
                        <div className="text-right text-[11px] text-slate-500">
                          <div>{match.summary.skillsMet}/{match.summary.requiredSkills} skills met</div>
                          {match.summary.mandatorySkills - match.summary.mandatoryRequirementsMet > 0 ? (
                            <div className="text-rose-600 font-semibold text-[10px]">
                              {match.summary.mandatorySkills - match.summary.mandatoryRequirementsMet} mandatory gap
                            </div>
                          ) : (
                            <div className="text-emerald-600 font-semibold text-[10px]">Mandatory met</div>
                          )}
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                      {opp.description}
                    </p>

                    <div className="border-t border-slate-200/80 pt-2 mb-3 space-y-1 text-[11px] text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Stipend:</span>
                        <span className="font-semibold text-slate-900">{opp.stipend}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Duration:</span>
                        <span className="font-medium text-slate-800">{opp.duration}</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    to={`/student/opportunities/${opp.id}`}
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-teal-800 text-white text-xs font-semibold transition-colors mt-2"
                  >
                    <span>View Match Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
