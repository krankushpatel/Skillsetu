/**
 * SkillSetu - Read-Only Student Academic Intelligence Detail Modal
 * Step 9: Institution Dashboard + Skill Intelligence
 */

import React, { useEffect, useState } from 'react';
import { 
  X, 
  GraduationCap, 
  Award, 
  Briefcase, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Layers, 
  Calendar,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { institutionService, DEFAULT_INSTITUTION_ID } from '../../services/institutionService';
import { InstitutionStudentDetail } from '../../types';

interface StudentDetailModalProps {
  studentId: string | null;
  onClose: () => void;
  institutionId?: string;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  studentId,
  onClose,
  institutionId = DEFAULT_INSTITUTION_ID,
}) => {
  const [student, setStudent] = useState<InstitutionStudentDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    institutionService.getStudentDetail(studentId, institutionId)
      .then((data) => {
        if (isMounted) {
          setStudent(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load student details');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [studentId, institutionId]);

  if (!studentId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-800 text-teal-100 flex items-center justify-center font-bold font-mono">
              {student ? student.name.charAt(0) : <GraduationCap className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {loading ? 'Loading Student Intelligence...' : student?.name}
              </h2>
              <p className="text-xs text-slate-500">
                {student?.department} • {student?.course} ({student?.batch})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading && (
            <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-teal-800 border-t-transparent rounded-full animate-spin"></div>
              <span>Fetching student verified assessment credentials...</span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs">
              {error}
            </div>
          )}

          {student && !loading && (
            <>
              {/* Top Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <div className="text-[11px] text-slate-500 font-medium">Skill Quotient</div>
                  <div className="text-xl font-bold font-mono text-teal-700 mt-0.5">
                    {student.overallSkillQuotient}%
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <div className="text-[11px] text-slate-500 font-medium">Readiness Status</div>
                  <div className="mt-1">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                        student.readinessStatus === 'Ready'
                          ? 'bg-emerald-100 text-emerald-800'
                          : student.readinessStatus === 'Developing'
                          ? 'bg-sky-100 text-sky-800'
                          : student.readinessStatus === 'Needs Improvement'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {student.readinessStatus}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <div className="text-[11px] text-slate-500 font-medium">Assessed Skills</div>
                  <div className="text-xl font-bold font-mono text-slate-800 mt-0.5">
                    {student.assessedSkills.length}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <div className="text-[11px] text-slate-500 font-medium">CGPA Baseline</div>
                  <div className="text-xl font-bold font-mono text-slate-800 mt-0.5">
                    {student.cgpa.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Bio if available */}
              {student.bio && (
                <div className="p-3.5 bg-teal-50/50 border border-teal-100 rounded-xl text-xs text-teal-900 leading-relaxed">
                  <span className="font-semibold text-teal-950">Academic Focus: </span>
                  {student.bio}
                </div>
              )}

              {/* Assessed Skills Breakdown */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-teal-700" />
                  <span>Verified Assessed Skills ({student.assessedSkills.length})</span>
                </h3>

                {student.assessedSkills.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500">
                    No standardized assessments taken yet. Student is currently in Pending Assessment tier.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {student.assessedSkills.map((skill) => (
                      <div
                        key={skill.skillId}
                        className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-semibold text-slate-800">{skill.skillName}</div>
                          <div className="text-[10px] text-slate-500">{skill.category}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                              skill.proficiencyTier === 'Strong'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : skill.proficiencyTier === 'Developing'
                                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {skill.proficiency}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Applications Activity */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-teal-700" />
                  <span>Opportunity Applications ({student.applications.length})</span>
                </h3>

                {student.applications.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center text-xs text-slate-500">
                    No applications submitted yet by this student.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {student.applications.map((app) => (
                      <div
                        key={app.applicationId}
                        className="p-3 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{app.opportunityTitle}</div>
                          <div className="text-[11px] text-slate-500">
                            Applied: {new Date(app.appliedAt).toLocaleDateString()} • {app.location}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                            Score Snapshot: {app.matchScoreSnapshot}%
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              app.status === 'SHORTLISTED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : app.status === 'UNDER_REVIEW'
                                ? 'bg-blue-100 text-blue-800'
                                : app.status === 'APPLIED'
                                ? 'bg-slate-100 text-slate-700'
                                : app.status === 'REJECTED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {app.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs text-slate-500">
          <span>Read-only Academic Audit View</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium transition-colors"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
