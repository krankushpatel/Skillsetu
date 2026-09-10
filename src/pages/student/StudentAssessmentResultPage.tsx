/**
 * SkillSetu - Assessment Result Dedicated Route View
 * Step 4: Standardized Assessment Engine & Skill Scoring
 * 
 * Accessible at `/student/assessment/result`
 * Displays candidate's latest evaluated assessment attempt, performance tiers,
 * and skill-wise breakdown.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  RotateCcw, 
  BookOpen, 
  Sparkles, 
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { StudentNav } from '../../components/student/StudentNav';
import { assessmentService } from '../../services/assessmentService';
import { studentService } from '../../services/studentService';
import { AssessmentSubmissionResult } from '../../types';

export const StudentAssessmentResultPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeStudentId, setActiveStudentId] = useState<string>(studentService.getActiveStudentId());
  const [studentName, setStudentName] = useState<string>('Aarav Sharma');
  const [result, setResult] = useState<AssessmentSubmissionResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    studentService.getStudentById(activeStudentId).then(p => {
      if (p?.name) setStudentName(p.name);
    }).catch(() => {});

    setLoading(true);
    assessmentService.getLatestAssessmentResult('asm_01', activeStudentId)
      .then(res => {
        setResult(res);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load result:', err);
        setError('No completed assessment found for this candidate.');
        setLoading(false);
      });
  }, [activeStudentId]);

  const handleStudentChange = (id: string) => {
    setActiveStudentId(id);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <StudentNav 
          currentStudentName={studentName}
          onStudentChange={handleStudentChange}
        />

        {loading ? (
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="w-10 h-10 rounded-full border-3 border-teal-600 border-t-transparent animate-spin" />
          </div>
        ) : !result ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center mx-auto text-teal-600">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              No Assessment Attempt on Record
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Candidate {studentName} has not yet completed the Ayush Health Informatics Diagnostic Benchmark.
            </p>
            <button
              onClick={() => navigate('/student/assessment')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow transition-colors"
            >
              <span>Take Skill Assessment Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Evaluated Attempt on Record
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                      Deterministic Evaluation • Step 4
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    Assessment Evaluation Report
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600">
                    Candidate: <strong className="text-slate-900">{result.studentName}</strong> ({result.studentId}) • Completed on {new Date(result.submittedAt).toLocaleDateString()} at {new Date(result.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => navigate('/student/skills')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-sm transition-colors"
                  >
                    <span>View Student Skill Profile</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => navigate('/student/assessment')}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Retake Assessment</span>
                  </button>
                </div>
              </div>

              {/* Overall Score Row */}
              <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-teal-50/50 border border-teal-200">
                  <div className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-1">
                    Overall Assessed Score
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-extrabold text-teal-900">
                      {result.overallScore}%
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      result.performanceTier === 'Strong'
                        ? 'bg-emerald-100 text-emerald-800'
                        : result.performanceTier === 'Developing'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {result.performanceTier}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Average of 5 assessed core skills
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Correct Answers
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                    {result.totalCorrect} <span className="text-base font-normal text-slate-400">/ {result.totalQuestions}</span>
                  </div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-1">
                    {Math.round((result.totalCorrect / result.totalQuestions) * 100)}% accuracy rate
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Incorrect / Skipped
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                    {result.totalIncorrect} <span className="text-base font-normal text-slate-400">/ {result.totalQuestions}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {result.unansweredCount} questions unanswered
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Attempt Reference
                  </div>
                  <div className="text-sm font-mono font-bold text-slate-800 truncate">
                    {result.attemptId}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Synchronized in MongoDB
                  </div>
                </div>
              </div>
            </div>

            {/* Skill Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
                Skill-wise Proficiency Breakdown
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                Scores evaluated based on weighted question scoring for each foundational competency.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.skillScores.map((skill) => {
                  const isStrong = skill.performanceTier === 'Strong';
                  const isDeveloping = skill.performanceTier === 'Developing';

                  let barColor = 'bg-rose-500';
                  let badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
                  if (isStrong) {
                    barColor = 'bg-emerald-600';
                    badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                  } else if (isDeveloping) {
                    barColor = 'bg-amber-500';
                    badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
                  }

                  return (
                    <div 
                      key={skill.skillId}
                      className="p-5 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {skill.category}
                          </span>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${badgeColor}`}>
                            {skill.performanceTier}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 mb-1 line-clamp-1">
                          {skill.skillName}
                        </h3>

                        <div className="mt-3 flex items-baseline justify-between">
                          <span className="text-2xl font-black text-slate-900">
                            {skill.score}%
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            {skill.correctCount} / {skill.totalQuestions} correct
                          </span>
                        </div>

                        <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
                          <div 
                            className={`h-2 rounded-full ${barColor}`}
                            style={{ width: `${skill.score}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Weight Earned:</span>
                        <span className="font-semibold text-slate-700">
                          {skill.earnedWeight} / {skill.totalWeight} pts
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Explanation Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-teal-700" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Deterministic Scoring Verification
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {result.scoringExplanation}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAssessmentResultPage;
