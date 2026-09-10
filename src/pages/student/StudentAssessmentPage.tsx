/**
 * SkillSetu - Standardized Student Skill Assessment Engine
 * Step 4: Standardized Assessment Engine & Skill Scoring
 * 
 * Delivers an end-to-end, deterministic, non-AI skill assessment interface:
 * 1. Intro Screen: Assessment metadata, guidelines, candidate info, skills breakdown
 * 2. Active Assessment: Question card, countdown timer, question palette, progress indicator
 * 3. Review Dialog: Pre-submission review, unanswered questions check, confirmation
 * 4. Deterministic Results: Overall score, performance tiers, skill breakdown, scoring explanation
 * 5. Dynamic Integration: Automatically updates student_skill_scores and Student Skill Profile
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft, 
  RotateCcw, 
  Award, 
  HelpCircle, 
  FileText, 
  ChevronRight, 
  Check, 
  ShieldCheck, 
  BarChart3, 
  Sparkles,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { StudentNav } from '../../components/student/StudentNav';
import { assessmentService } from '../../services/assessmentService';
import { studentService } from '../../services/studentService';
import { 
  AssessmentDetail, 
  AssessmentSummary, 
  AssessmentSubmissionResult, 
  ClientAssessmentQuestion 
} from '../../types';

type AssessmentStage = 'intro' | 'in_progress' | 'submitting' | 'result';

export const StudentAssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Active Student State
  const [activeStudentId, setActiveStudentId] = useState<string>(studentService.getActiveStudentId());
  const [studentName, setStudentName] = useState<string>('Aarav Sharma');

  // Assessment Data State
  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Assessment Execution State
  const [stage, setStage] = useState<AssessmentStage>('intro');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(30 * 60); // in seconds
  const [isReviewOpen, setIsReviewOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionResult, setSubmissionResult] = useState<AssessmentSubmissionResult | null>(null);
  const [previousResult, setPreviousResult] = useState<AssessmentSubmissionResult | null>(null);

  // Sync candidate info on load
  const loadCandidateInfo = useCallback(async (id: string) => {
    try {
      const profile = await studentService.getStudentById(id);
      if (profile && profile.name) {
        setStudentName(profile.name);
      }
    } catch {
      // Keep default
    }
  }, []);

  // Fetch assessment benchmark data
  const loadAssessment = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const summaries = await assessmentService.getAssessments();
      const defaultAsmId = summaries.length > 0 ? summaries[0].id : 'asm_01';
      const detail = await assessmentService.getAssessmentById(defaultAsmId);
      setAssessment(detail);
      setTimeRemaining(detail.durationMinutes * 60);

      // Check if candidate already has a completed attempt
      const prev = await assessmentService.getLatestAssessmentResult(defaultAsmId, id);
      setPreviousResult(prev);
    } catch (err: any) {
      console.error('Failed to load assessment:', err);
      setError(err?.response?.data?.detail || err?.message || 'Failed to load assessment benchmark.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCandidateInfo(activeStudentId);
    loadAssessment(activeStudentId);
  }, [activeStudentId, loadCandidateInfo, loadAssessment]);

  // Handle student change from demo switcher
  const handleStudentChange = (newStudentId: string) => {
    setActiveStudentId(newStudentId);
    // Reset assessment state to intro when switching demo candidate
    setStage('intro');
    setSelectedAnswers({});
    setCurrentQuestionIdx(0);
    loadCandidateInfo(newStudentId);
    loadAssessment(newStudentId);
  };

  // Submit assessment handler
  const handleFinalSubmit = useCallback(async () => {
    if (!assessment) return;
    setIsReviewOpen(false);
    setStage('submitting');
    setIsSubmitting(true);
    setError(null);

    try {
      // Format answers payload
      const answersPayload = Object.entries(selectedAnswers).map(([qId, optionIdx]) => ({
        question_id: qId,
        selected_option: optionIdx
      }));

      const result = await assessmentService.submitAssessment(
        assessment.id,
        activeStudentId,
        answersPayload
      );

      setSubmissionResult(result);
      setPreviousResult(result);
      setStage('result');
    } catch (err: any) {
      console.error('Submission failed:', err);
      setError(err?.response?.data?.detail || err?.message || 'Assessment submission failed. Please try again.');
      setStage('in_progress');
    } finally {
      setIsSubmitting(false);
    }
  }, [assessment, activeStudentId, selectedAnswers]);

  // Countdown timer effect
  useEffect(() => {
    if (stage !== 'in_progress') return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-submit when time expires
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stage, handleFinalSubmit]);

  // Format MM:SS for timer
  const formattedTime = useMemo(() => {
    const mins = Math.floor(timeRemaining / 60);
    const secs = timeRemaining % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [timeRemaining]);

  const timerWarningClass = useMemo(() => {
    if (timeRemaining < 120) return 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse';
    if (timeRemaining < 300) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-teal-50 text-teal-800 border-teal-200';
  }, [timeRemaining]);

  // Questions stats
  const totalQuestions = assessment?.questions?.length || 25;
  const answeredCount = Object.keys(selectedAnswers).length;
  const unansweredCount = totalQuestions - answeredCount;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  const currentQuestion: ClientAssessmentQuestion | undefined = assessment?.questions?.[currentQuestionIdx];

  const handleSelectOption = (optionIndex: number) => {
    if (!currentQuestion) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionIndex
    }));
  };

  const handleClearSelection = () => {
    if (!currentQuestion) return;
    setSelectedAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentQuestion.id];
      return copy;
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIdx < totalQuestions - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
    } else {
      setIsReviewOpen(true);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx((prev) => prev - 1);
    }
  };

  const handleJumpToQuestion = (idx: number) => {
    setCurrentQuestionIdx(idx);
    setIsReviewOpen(false);
  };

  const handleStartAssessment = () => {
    if (!assessment) return;
    setTimeRemaining(assessment.durationMinutes * 60);
    setSelectedAnswers({});
    setCurrentQuestionIdx(0);
    setStage('in_progress');
  };

  const handleRetakeAssessment = () => {
    setSubmissionResult(null);
    setStage('intro');
    setSelectedAnswers({});
    setCurrentQuestionIdx(0);
    if (assessment) {
      setTimeRemaining(assessment.durationMinutes * 60);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <StudentNav 
          currentStudentName={studentName}
          onStudentChange={handleStudentChange}
        />

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm font-medium">{error}</div>
            <button 
              onClick={() => setError(null)}
              className="text-xs text-rose-700 hover:text-rose-900 underline font-medium"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* -------------------------------------------------------------
            STAGE 1: INTRODUCTION SCREEN
            ------------------------------------------------------------- */}
        {stage === 'intro' && (
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                      Standardized Skill Benchmark • Step 4
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Deterministic Evaluation (Zero AI/LLM)
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    {assessment?.title || 'Ayush Health Informatics Diagnostic Benchmark'}
                  </h1>
                  <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
                    {assessment?.description || 'Standardized diagnostic assessment evaluating foundational competencies across Python, SQL, Ayurvedic Clinical Data, Biostatistics, and Research Methodology.'}
                  </p>
                  <div className="pt-2 flex items-center gap-2 text-xs text-slate-500">
                    <span>Enrolled Candidate:</span>
                    <span className="font-semibold text-slate-800">{studentName} ({activeStudentId})</span>
                    <span>•</span>
                    <span>Authority: SkillSetu Standardized Assessment Engine</span>
                  </div>
                </div>

                {/* Start Action Box */}
                <div className="lg:text-right shrink-0">
                  <button
                    id="btn-start-assessment"
                    onClick={handleStartAssessment}
                    disabled={loading || !assessment}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-semibold text-base shadow-sm hover:shadow transition-all w-full sm:w-auto cursor-pointer"
                  >
                    <span>Start Standardized Assessment</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Timer starts immediately upon clicking Start
                  </p>
                </div>
              </div>

              {/* Benchmark Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
                    <HelpCircle className="w-4 h-4 text-teal-600" />
                    Total Questions
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {assessment?.totalQuestions || 25}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">5 questions per skill</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
                    <Clock className="w-4 h-4 text-amber-600" />
                    Allocated Duration
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {assessment?.durationMinutes || 30} Mins
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Countdown with warning</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
                    <Award className="w-4 h-4 text-blue-600" />
                    Core Skills Covered
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {assessment?.targetSkills?.length || 5}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Informatics & clinical</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
                    <BarChart3 className="w-4 h-4 text-emerald-600" />
                    Scoring Engine
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    Deterministic
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Server-side authoritative</div>
                </div>
              </div>
            </div>

            {/* Target Skills Covered Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
                Target Competency Domains & Weight Matrix
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                The assessment evaluates 5 fundamental disciplines required for health data science, Ayush informatics, and clinical registry development.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assessment?.targetSkills?.map((skill, index) => (
                  <div 
                    key={skill.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        Skill #{index + 1}
                      </span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-teal-50 text-teal-700">
                        {skill.category}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">
                      {skill.name}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-2 border-t border-slate-100">
                      <span>{skill.questionCount || 5} Questions</span>
                      <span className="text-teal-700 font-medium">Scored 0–100%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rules & Examination Guidelines */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  Examination Instructions
                </h3>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span>Each question contains 4 objective options with exactly 1 correct answer.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span>You can navigate freely back and forth across all 25 questions using the numbered palette.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span>You can clear or change your answer selections at any time before final submission.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span>Unanswered questions will be scored as 0. A review summary is provided prior to submission.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span>If the 30-minute timer expires, the exam automatically submits all currently chosen answers.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  SIH & Academic Scoring Policy
                </h3>
                <div className="space-y-3 text-xs sm:text-sm text-slate-600">
                  <p className="leading-relaxed">
                    <strong>Authoritative Backend Evaluation:</strong> The frontend does not calculate scores. Final scores are deterministically evaluated by the backend comparing answers strictly against authoritative database keys.
                  </p>
                  <p className="leading-relaxed">
                    <strong>Zero AI / LLM Grading:</strong> Scoring is 100% deterministic and reproducible. Question weights (1x–3x) are summed for correct answers and divided by total skill weights.
                  </p>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700">
                    Skill Score = (Earned Skill Weights / Total Skill Weights) × 100
                  </div>
                  <p className="text-xs text-slate-500">
                    Post submission, your evaluated scores update your <strong>Assessed Skill Scores</strong> and automatically synchronize with your student skill profile.
                  </p>
                </div>
              </div>
            </div>

            {/* Previous Result Banner if Candidate already took it */}
            {previousResult && (
              <div className="bg-white rounded-2xl border border-teal-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 mb-1">
                    <Award className="w-4 h-4 text-teal-600" />
                    Previous Attempt on Record
                  </div>
                  <h4 className="text-base font-bold text-slate-900">
                    Score: {previousResult.overallScore}% ({previousResult.performanceTier}) • {previousResult.totalCorrect} / {previousResult.totalQuestions} Correct
                  </h4>
                  <p className="text-xs text-slate-500">
                    Completed on {new Date(previousResult.submittedAt).toLocaleDateString()} at {new Date(previousResult.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setSubmissionResult(previousResult);
                      setStage('result');
                    }}
                    className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
                  >
                    View Recorded Result
                  </button>
                  <button
                    onClick={handleStartAssessment}
                    className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-xs font-semibold text-white transition-colors"
                  >
                    Retake Assessment
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------
            STAGE 2: ACTIVE ASSESSMENT SCREEN
            ------------------------------------------------------------- */}
        {stage === 'in_progress' && currentQuestion && (
          <div className="space-y-6">
            {/* Sticky Assessment Header Bar */}
            <div className="sticky top-2 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Title & Counter */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                      Question {currentQuestionIdx + 1} of {totalQuestions}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500">
                      Answered: <strong className="text-slate-800">{answeredCount}</strong> / {totalQuestions} ({progressPercent}%)
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate max-w-xl">
                    {assessment?.title || 'Skill Assessment'}
                  </h2>
                </div>

                {/* Timer & Review Action */}
                <div className="flex items-center gap-3">
                  {/* Countdown Timer */}
                  <div 
                    id="timer-display"
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-sm font-mono font-bold transition-all ${timerWarningClass}`}
                    title="Time remaining until automatic submission"
                  >
                    <Clock className="w-4 h-4" />
                    <span>{formattedTime}</span>
                  </div>

                  {/* Review Button */}
                  <button
                    id="btn-open-review"
                    onClick={() => setIsReviewOpen(true)}
                    className="px-4 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
                  >
                    Review & Submit
                  </button>
                </div>
              </div>

              {/* Progress Line */}
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
                <div 
                  className="bg-teal-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Main Question + Palette Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Question Card (2 Cols) */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                  {/* Question Meta Tags */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                        {currentQuestion.skillName}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
                        Difficulty: {currentQuestion.difficulty}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      Weight: {currentQuestion.skillWeight}x
                    </span>
                  </div>

                  {/* Question Prompt */}
                  <div className="mb-6">
                    <p className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed">
                      {currentQuestion.question}
                    </p>
                  </div>

                  {/* Option List */}
                  <div className="space-y-3">
                    {currentQuestion.options.map((optionText, optIdx) => {
                      const isSelected = selectedAnswers[currentQuestion.id] === optIdx;
                      const optionLetter = String.fromCharCode(65 + optIdx); // A, B, C, D

                      return (
                        <div
                          key={optIdx}
                          id={`option-${currentQuestion.id}-${optIdx}`}
                          onClick={() => handleSelectOption(optIdx)}
                          className={`flex items-start gap-3.5 p-4 rounded-xl border transition-all cursor-pointer select-none ${
                            isSelected
                              ? 'bg-teal-50/70 border-teal-500 shadow-sm ring-1 ring-teal-500'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                          }`}
                        >
                          {/* Radio Circle */}
                          <div className="shrink-0 mt-0.5">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                              isSelected
                                ? 'bg-teal-600 text-white'
                                : 'bg-slate-100 text-slate-600 border border-slate-300'
                            }`}>
                              {isSelected ? <Check className="w-3.5 h-3.5" /> : optionLetter}
                            </div>
                          </div>

                          {/* Option Text */}
                          <div className="flex-1 text-sm font-medium text-slate-800 leading-relaxed pt-0.5">
                            {optionText}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Question Bottom Action Bar */}
                  <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-100">
                    <button
                      id="btn-prev-question"
                      onClick={handlePrevQuestion}
                      disabled={currentQuestionIdx === 0}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none text-xs font-semibold text-slate-700 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>

                    <div className="flex items-center gap-3">
                      {selectedAnswers[currentQuestion.id] !== undefined && (
                        <button
                          onClick={handleClearSelection}
                          className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
                        >
                          Clear Selection
                        </button>
                      )}

                      {currentQuestionIdx < totalQuestions - 1 ? (
                        <button
                          id="btn-next-question"
                          onClick={handleNextQuestion}
                          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-xs font-semibold text-white shadow-sm transition-colors"
                        >
                          <span>Next</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          id="btn-review-from-last"
                          onClick={() => setIsReviewOpen(true)}
                          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white shadow-sm transition-colors"
                        >
                          <span>Review & Submit</span>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Question Navigation Palette (1 Col) */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Question Palette
                    </h3>
                    <span className="text-xs font-medium text-slate-500">
                      {answeredCount} / {totalQuestions} Answered
                    </span>
                  </div>

                  {/* Palette Grid (5 x 5) */}
                  <div className="grid grid-cols-5 gap-2 mb-4">
                    {assessment?.questions.map((q, idx) => {
                      const isAnswered = selectedAnswers[q.id] !== undefined;
                      const isCurrent = idx === currentQuestionIdx;

                      let btnStyle = 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';
                      if (isAnswered) {
                        btnStyle = 'bg-teal-600 text-white border-teal-600 font-semibold';
                      }
                      if (isCurrent) {
                        btnStyle += ' ring-2 ring-slate-900 ring-offset-2';
                      }

                      return (
                        <button
                          key={q.id}
                          id={`palette-btn-${idx + 1}`}
                          onClick={() => handleJumpToQuestion(idx)}
                          className={`h-9 rounded-lg border text-xs font-medium flex items-center justify-center transition-all ${btnStyle}`}
                          title={`Question ${idx + 1}: ${q.skillName} (${isAnswered ? 'Answered' : 'Unanswered'})`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>

                  {/* Palette Legend */}
                  <div className="pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-teal-600 shrink-0" />
                      <span>Answered ({answeredCount})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-slate-100 border border-slate-300 shrink-0" />
                      <span>Unanswered ({unansweredCount})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded border-2 border-slate-900 shrink-0" />
                      <span>Current Active Question</span>
                    </div>
                  </div>

                  {/* Review & Submit Action */}
                  <button
                    onClick={() => setIsReviewOpen(true)}
                    className="w-full mt-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-800 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-teal-600" />
                    <span>Review All Questions</span>
                  </button>
                </div>

                {/* Target Skills Reference */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Competencies in this Benchmark
                  </h4>
                  <div className="space-y-2">
                    {assessment?.targetSkills.map((sk) => {
                      // Count answered questions in this skill
                      const questionsInSkill = assessment.questions.filter(q => q.skillId === sk.id);
                      const answeredInSkill = questionsInSkill.filter(q => selectedAnswers[q.id] !== undefined).length;

                      return (
                        <div key={sk.id} className="text-xs">
                          <div className="flex items-center justify-between text-slate-700 mb-0.5">
                            <span className="font-medium truncate max-w-[180px]">{sk.name}</span>
                            <span className="text-[11px] text-slate-500">{answeredInSkill} / {questionsInSkill.length}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                            <div 
                              className="bg-teal-600 h-1 rounded-full transition-all"
                              style={{ width: `${questionsInSkill.length ? (answeredInSkill / questionsInSkill.length) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* ---------------------------------------------------------
                REVIEW MODAL / DRAWER
                --------------------------------------------------------- */}
            {isReviewOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                  {/* Modal Header */}
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Review Assessment Answers
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Verify your answers before final submission for deterministic evaluation.
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900">
                        {answeredCount} / {totalQuestions}
                      </div>
                      <div className="text-[11px] text-slate-500">Completed</div>
                    </div>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 overflow-y-auto space-y-4">
                    {/* Unanswered Warning if any */}
                    {unansweredCount > 0 ? (
                      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-xs space-y-1">
                          <p className="font-bold">
                            You have {unansweredCount} unanswered question{unansweredCount > 1 ? 's' : ''}.
                          </p>
                          <p className="text-amber-800">
                            Unanswered questions will be scored as 0. You can click on any question number below to review or answer it now.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div className="text-xs">
                          <p className="font-bold">All 25 questions answered!</p>
                          <p className="text-emerald-800">Ready for deterministic grading and student skill profile update.</p>
                        </div>
                      </div>
                    )}

                    {/* Question Summary Grid */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Question Index Status
                      </h4>
                      <div className="grid grid-cols-5 gap-2">
                        {assessment?.questions.map((q, idx) => {
                          const isAnswered = selectedAnswers[q.id] !== undefined;
                          return (
                            <button
                              key={q.id}
                              onClick={() => handleJumpToQuestion(idx)}
                              className={`p-2.5 rounded-lg border text-left text-xs transition-colors flex items-center justify-between ${
                                isAnswered 
                                  ? 'bg-teal-50 border-teal-300 text-teal-900' 
                                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                              }`}
                            >
                              <span className="font-bold">Q{idx + 1}</span>
                              <span className="text-[10px]">
                                {isAnswered ? '✓ Done' : 'Empty'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                      onClick={() => setIsReviewOpen(false)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-white text-xs font-semibold text-slate-700 transition-colors"
                    >
                      Back to Answering
                    </button>

                    <button
                      id="btn-confirm-final-submit"
                      onClick={handleFinalSubmit}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-xs font-semibold text-white shadow-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <span>Confirm & Submit Assessment</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------
            STAGE 3: SUBMISSION IN PROGRESS SPINNER
            ------------------------------------------------------------- */}
        {stage === 'submitting' && (
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-md w-full shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-full border-3 border-teal-600 border-t-transparent animate-spin mx-auto" />
              <h3 className="text-lg font-bold text-slate-900">
                Evaluating Assessment Answers
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Applying deterministic grading formula against authoritative database keys... Updating candidate skill proficiencies and audit records.
              </p>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            STAGE 4: DETERMINISTIC ASSESSMENT RESULT
            ------------------------------------------------------------- */}
        {stage === 'result' && submissionResult && (
          <div className="space-y-6">
            {/* Completion Banner */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Assessment Completed & Evaluated
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                      Deterministic Server-Side Evaluation • No AI / LLM
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    Standardized Assessment Results
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600">
                    Candidate: <strong className="text-slate-900">{submissionResult.studentName}</strong> ({submissionResult.studentId}) • Completed on {new Date(submissionResult.submittedAt).toLocaleDateString()} at {new Date(submissionResult.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    id="btn-view-skills-profile"
                    onClick={() => navigate('/student/skills')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-sm transition-colors"
                  >
                    <span>View Updated Skill Profile</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => navigate('/student')}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
                  >
                    Student Dashboard
                  </button>
                  <button
                    onClick={handleRetakeAssessment}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Retake</span>
                  </button>
                </div>
              </div>

              {/* Overall Performance Card */}
              <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-teal-50/50 border border-teal-200">
                  <div className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-1">
                    Overall Assessed Score
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-extrabold text-teal-900">
                      {submissionResult.overallScore}%
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      submissionResult.performanceTier === 'Strong'
                        ? 'bg-emerald-100 text-emerald-800'
                        : submissionResult.performanceTier === 'Developing'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {submissionResult.performanceTier}
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
                    {submissionResult.totalCorrect} <span className="text-base font-normal text-slate-400">/ {submissionResult.totalQuestions}</span>
                  </div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-1">
                    {Math.round((submissionResult.totalCorrect / submissionResult.totalQuestions) * 100)}% accuracy rate
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Incorrect / Skipped
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                    {submissionResult.totalIncorrect} <span className="text-base font-normal text-slate-400">/ {submissionResult.totalQuestions}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {submissionResult.unansweredCount} questions unanswered
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Audit Reference
                  </div>
                  <div className="text-sm font-mono font-bold text-slate-800 truncate">
                    {submissionResult.attemptId}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Recorded in MongoDB student_skill_scores
                  </div>
                </div>
              </div>
            </div>

            {/* Skill-wise Proficiency Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Skill-wise Evaluated Proficiency Breakdown
                  </h2>
                  <p className="text-xs text-slate-500">
                    Calculated deterministically using question weight ratios. Updated live in candidate's Assessed Skill Profile.
                  </p>
                </div>
                <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200 shrink-0">
                  5 Skills Evaluated
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {submissionResult.skillScores.map((skill) => {
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
                      className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between"
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

                        {/* Large Score Indicator */}
                        <div className="mt-3 flex items-baseline justify-between">
                          <span className="text-2xl font-black text-slate-900">
                            {skill.score}%
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            {skill.correctCount} / {skill.totalQuestions} correct
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
                            style={{ width: `${skill.score}%` }}
                          />
                        </div>
                      </div>

                      {/* Weight Breakdown */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Earned Weight:</span>
                        <span className="font-semibold text-slate-700">
                          {skill.earnedWeight} / {skill.totalWeight} pts
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Deterministic Scoring Explanation & SIH Compliance */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-teal-700" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Transparent Deterministic Evaluation Model
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {submissionResult.scoringExplanation}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <strong className="text-slate-800 block mb-0.5">Strong Tier (80–100%)</strong>
                      <span className="text-slate-500">Industry benchmark ready; qualified for direct project matching.</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <strong className="text-slate-800 block mb-0.5">Developing Tier (60–79%)</strong>
                      <span className="text-slate-500">Functional competency; targeted bridge modules recommended.</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <strong className="text-slate-800 block mb-0.5">Needs Improvement (&lt;60%)</strong>
                      <span className="text-slate-500">Foundational gap; foundational coursework required.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps Card */}
            <div className="bg-gradient-to-r from-teal-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-teal-800/80 text-teal-200 border border-teal-700 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-teal-300" />
                  Database Synchronized
                </span>
                <h3 className="text-lg sm:text-xl font-bold">
                  Your Student Skill Profile is Updated
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-1">
                  Navigate to <strong>My Skills</strong> to view your updated Skill Radar, Overall Skill Quotient, and opportunities matched against your freshly assessed competencies.
                </p>
              </div>

              <button
                id="btn-navigate-skills-footer"
                onClick={() => navigate('/student/skills')}
                className="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow transition-colors shrink-0 flex items-center gap-2"
              >
                <span>Open Skill Profile</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAssessmentPage;
