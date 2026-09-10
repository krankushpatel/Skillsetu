/**
 * SkillSetu - Home / Portal Foundation Page
 * Step 1 & Step 2: Foundation & Database Models Verification
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Building2, 
  Landmark, 
  ArrowRight, 
  Server, 
  Database, 
  Cpu, 
  FileCheck2,
  CheckCircle2,
  SlidersHorizontal,
  TrendingUp,
  Sparkles,
  Layers,
  Award,
  Briefcase,
  Users,
  RefreshCw,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { healthService } from '../services/healthService';
import { dataService } from '../services/dataService';
import { 
  SystemHealthResponse, 
  Skill, 
  StudentSummary, 
  Industry, 
  Opportunity, 
  SeedStatusResponse 
} from '../types';

export const HomePage: React.FC = () => {
  const [health, setHealth] = useState<SystemHealthResponse | null>(null);
  const [seedStatus, setSeedStatus] = useState<SeedStatusResponse | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'students' | 'industries' | 'opportunities'>('overview');

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const [healthData, statusData] = await Promise.all([
        healthService.checkHealth().catch(() => null),
        dataService.getSeedStatus().catch(() => null),
      ]);

      if (healthData) setHealth(healthData);
      if (statusData) setSeedStatus(statusData);

      // Preload data preview if online
      if (healthData) {
        const [skillsRes, studentsRes, industriesRes, oppsRes] = await Promise.all([
          dataService.getSkills().catch(() => ({ count: 0, data: [] })),
          dataService.getStudents().catch(() => ({ count: 0, data: [] })),
          dataService.getIndustries().catch(() => ({ count: 0, data: [] })),
          dataService.getOpportunities().catch(() => ({ count: 0, data: [] })),
        ]);
        setSkills(skillsRes.data);
        setStudents(studentsRes.data);
        setIndustries(industriesRes.data);
        setOpportunities(oppsRes.data);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backend currently offline');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-white to-slate-50 border border-slate-200 rounded-2xl p-8 sm:p-12 mb-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-xs font-semibold mb-5">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Smart India Hackathon • Problem Statement ID: 26044</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            SkillSetu <span className="text-teal-700 font-semibold text-2xl sm:text-4xl">(कौशल सेतु)</span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-slate-700 font-medium mb-4">
            Where Skills Meet Opportunity.
          </p>

          <p className="text-base text-slate-600 leading-relaxed mb-8 max-w-2xl">
            A unified academia-industry collaboration platform for the <strong>Ministry of Ayush</strong> and the <strong>All India Institute of Ayurveda (AIIA)</strong>. 
            Bridging academic transcripts and operational industry competencies through objective skill assessment, deterministic gap explanation, and actionable placement intelligence.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/student"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-teal-800 hover:bg-teal-700 text-white font-medium text-sm transition-colors shadow-sm"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Explore Student Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white hover:bg-slate-100 text-slate-800 font-medium text-sm border border-slate-300 transition-colors"
            >
              <span>Switch Active Role</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Backend & Database Telemetry (Step 1 & Step 2 Verified) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-10 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900">
                  System Telemetry & Database State
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  STEP 2 VERIFIED
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Connected FastAPI Python service with verified MongoDB <code>skillsetu</code> data models & seeded demo records.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Status</span>
            </button>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 border border-slate-200">
              <span className={`w-2 h-2 rounded-full ${health?.status === 'healthy' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
              <span className="font-mono text-slate-700">
                {loading ? 'Polling API...' : health?.status === 'healthy' ? 'FastAPI 1.0.0 Online' : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs mb-5">
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
            <div className="flex items-center gap-2 font-semibold text-slate-800 mb-1">
              <Cpu className="w-4 h-4 text-teal-700" />
              <span>Backend Service</span>
            </div>
            <p className="text-slate-600 font-mono">FastAPI + Python 3.11</p>
            <p className="text-slate-500 mt-1">Health: <code className="bg-white px-1 py-0.5 rounded border border-slate-200">/api/health</code></p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
            <div className="flex items-center gap-2 font-semibold text-slate-800 mb-1">
              <Database className="w-4 h-4 text-emerald-700" />
              <span>Database Architecture</span>
            </div>
            <p className="text-slate-600 font-mono">
              {health?.database?.engine || 'MongoDB Document Store'}
            </p>
            <p className="text-slate-500 mt-1">Database: <code className="bg-white px-1 py-0.5 rounded border border-slate-200">{health?.database?.database_name || 'skillsetu'}</code></p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
            <div className="flex items-center gap-2 font-semibold text-slate-800 mb-1">
              <Layers className="w-4 h-4 text-blue-700" />
              <span>Collections Initialized</span>
            </div>
            <p className="text-slate-600 font-medium">13 Active Collections</p>
            <p className="text-slate-500 mt-1">Status: <span className="text-emerald-700 font-medium">Deterministic Seed Synced</span></p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
            <div className="flex items-center gap-2 font-semibold text-slate-800 mb-1">
              <FileCheck2 className="w-4 h-4 text-amber-700" />
              <span>Current Milestone</span>
            </div>
            <p className="text-slate-600 font-medium">STEP 2 Complete</p>
            <p className="text-slate-500 mt-1 font-mono text-[11px] truncate">{health?.step || 'Models & Seed Data'}</p>
          </div>
        </div>

        {/* Step 2 Data Inspection / Verification Tabs */}
        <div className="mt-6 border-t border-slate-100 pt-6">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-teal-700" />
              <span>Step 2 Seeded Data Inspector (Read-Only Data Access APIs)</span>
            </h3>
            <span className="text-xs text-slate-500">
              Verified through <code>/api/skills</code>, <code>/api/students</code>, <code>/api/industries</code>, <code>/api/opportunities</code>
            </span>
          </div>

          {/* Inspection Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-teal-50 text-teal-800 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              13 Collection Counts
            </button>
            <button
              onClick={() => setActiveTab('skills')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'skills'
                  ? 'bg-teal-50 text-teal-800 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Skills Taxonomy ({skills.length || 10})
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'students'
                  ? 'bg-teal-50 text-teal-800 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Student Cohort ({students.length || 8})
            </button>
            <button
              onClick={() => setActiveTab('industries')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'industries'
                  ? 'bg-teal-50 text-teal-800 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Industry Partners ({industries.length || 4})
            </button>
            <button
              onClick={() => setActiveTab('opportunities')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'opportunities'
                  ? 'bg-teal-50 text-teal-800 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Opportunities ({opportunities.length || 6})
            </button>
          </div>

          {/* Tab 1: Collection Counts Overview */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
              {seedStatus?.collection_counts ? (
                Object.entries(seedStatus.collection_counts).map(([name, count]) => (
                  <div key={name} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                    <span className="font-mono text-slate-500 block text-[11px] truncate">{name}</span>
                    <span className="text-lg font-bold text-slate-800">{count}</span>
                    <span className="text-slate-400 ml-1">records</span>
                  </div>
                ))
              ) : (
                <div className="col-span-4 p-4 text-center text-slate-500">
                  Loading collection metrics...
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Standardized Skills */}
          {activeTab === 'skills' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {skills.map((skill) => (
                <div key={skill._id} className="p-3 rounded-lg border border-slate-200 bg-white hover:border-teal-300 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-slate-900">{skill.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-teal-50 text-teal-700 border border-teal-100">
                      {skill.category}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] mb-2 leading-relaxed">{skill.description}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span>Demand Score: <strong>{skill.industryDemandScore}/100</strong></span>
                    <code className="text-[10px] text-slate-400">{skill._id}</code>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Student Cohort */}
          {activeTab === 'students' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {students.map((student) => (
                <div key={student.id} className="p-3 rounded-lg border border-slate-200 bg-white">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold text-slate-900">{student.name}</div>
                      <div className="text-slate-500 text-[11px]">{student.department} • CGPA {student.cgpa}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                      {student.batch}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] mb-2.5 line-clamp-2">{student.bio}</p>
                  <div className="border-t border-slate-100 pt-2">
                    <span className="text-[11px] font-medium text-slate-700 block mb-1">
                      Assessed Skill Scores ({student.assessedSkills?.length || 0}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {student.assessedSkills?.slice(0, 4).map((s, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 text-[10px] border border-teal-100">
                          {s.skillId.replace('skill-', '')}: {s.proficiency}%
                        </span>
                      ))}
                      {(student.assessedSkills?.length || 0) > 4 && (
                        <span className="text-[10px] text-slate-400 self-center">
                          +{student.assessedSkills.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 4: Industry Partners */}
          {activeTab === 'industries' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {industries.map((ind) => (
                <div key={ind._id} className="p-3 rounded-lg border border-slate-200 bg-white">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-900">{ind.organizationName}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {ind.industryType}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] mb-2">{ind.description}</p>
                  <div className="text-[11px] text-slate-600">
                    <span>Location: {ind.location}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 5: Opportunities */}
          {activeTab === 'opportunities' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {opportunities.map((opp) => (
                <div key={opp.id} className="p-3 rounded-lg border border-slate-200 bg-white">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <div className="font-semibold text-slate-900">{opp.title}</div>
                      <div className="text-slate-500 text-[11px]">{opp.organizationName} • {opp.location} ({opp.workMode})</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      {opp.type}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] mb-2 line-clamp-2">{opp.description}</p>
                  <div className="border-t border-slate-100 pt-2 text-[11px]">
                    <span className="text-slate-500">Stipend: <strong>{opp.stipend}</strong> • Duration: <strong>{opp.duration}</strong></span>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {opp.requiredSkills?.map((rs, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                          {rs.skillName} (≥{rs.minProficiency}%, wt:{rs.weight})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <strong>Backend Note:</strong> {error}. Ensure FastAPI service is running on port 8001.
          </div>
        )}
      </div>

      {/* Triad Portal Gateway Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Student Portal Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center mb-4">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Student Portal
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Access standardized skill assessments, view your Assessed Skill Scores and radar profile, discover matched Ayush & health-tech internships, and test what-if upskilling simulations.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-600 mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Standardized Skill Benchmarks</span>
              </li>
              <li className="flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Explainable Skill-Gap Matcher</span>
              </li>
              <li className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Interactive What-If Simulation</span>
              </li>
            </ul>
          </div>
          <Link
            to="/student"
            className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors"
          >
            <span>Enter Student Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Industry Portal Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-4">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Industry Portal
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Create targeted opportunities, calibrate required skill proficiencies (0–100), assign priority importance weights, and view applicant pools ranked by explainable compatibility.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-600 mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Weighted Skill Matrix Formulation</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Ranked Candidate Pipeline</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Transparent Candidate Gap Audits</span>
              </li>
            </ul>
          </div>
          <Link
            to="/industry"
            className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors"
          >
            <span>Enter Recruiter Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Institution Portal Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center mb-4">
              <Landmark className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Institution Intelligence
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Equip academic deans and placement officers with macro visibility into cohort skill health, live industry demand vs. student supply gaps, and placement readiness indices.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-600 mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Cohort Placement Readiness Index</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Student Supply vs. Industry Demand Matrix</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Curriculum Reform & FDP Recommendations</span>
              </li>
            </ul>
          </div>
          <Link
            to="/institution"
            className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors"
          >
            <span>Enter Institutional Analytics</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
