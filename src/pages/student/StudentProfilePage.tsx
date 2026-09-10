/**
 * SkillSetu - Student Academic & Personal Profile
 * Step 3: Student Module & Skill Profile
 * 
 * Features:
 * - Read-only student profile view
 * - Personal Information (Name, email, avatar, bio)
 * - Academic Credentials (Institution, Course, Department, Batch, CGPA)
 * - Certifications (from seeded student profile)
 * - Academic & Research Projects
 * - Internships & Achievements (with elegant empty states)
 */

import React, { useEffect, useState } from 'react';
import { 
  User, 
  GraduationCap, 
  Award, 
  Briefcase, 
  Trophy, 
  Mail, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  BookOpen,
  FileBadge,
  Sparkles
} from 'lucide-react';
import { studentService } from '../../services/studentService';
import { StudentNav } from '../../components/student/StudentNav';
import { StudentFullProfile } from '../../types';

export const StudentProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<StudentFullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await studentService.getStudentProfile();
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch student profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();

    const handleStudentChange = () => {
      fetchProfile();
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
        <div className="h-48 bg-slate-200 rounded-2xl mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-200 rounded-2xl" />
          <div className="h-64 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-rose-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-rose-900 mb-1">Student Profile Not Found</h2>
          <p className="text-xs text-rose-700 mb-5 max-w-md mx-auto">{error}</p>
          <button
            onClick={fetchProfile}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <StudentNav 
        currentStudentName={profile.name} 
        onStudentChange={() => fetchProfile()} 
      />

      {/* Profile Header & Personal Information */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-5">
            <img 
              src={profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`} 
              alt={profile.name} 
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-100 border border-slate-200 object-cover shadow-sm"
            />
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200 mb-1.5">
                <span>Verified Scholar Record</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {profile.name}
              </h1>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{profile.email}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{profile.institutionName}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center min-w-[140px] self-stretch md:self-auto">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
              Cumulative GPA
            </span>
            <div className="text-3xl font-black text-slate-900 mt-0.5">
              {profile.cgpa.toFixed(1)}
              <span className="text-sm font-normal text-slate-400"> / 10.0</span>
            </div>
            <span className="inline-block mt-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Good Academic Standing
            </span>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="mt-6">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Scholar Bio
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed max-w-3xl bg-slate-50/60 p-4 rounded-xl border border-slate-200">
              {profile.bio}
            </p>
          </div>
        )}
      </div>

      {/* Grid: Academic Info & Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        {/* Left Column: Academic Credentials & Certifications */}
        <div className="lg:col-span-6 space-y-8">
          {/* Academic Information */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <GraduationCap className="w-5 h-5 text-teal-700" />
              <h2 className="text-base font-bold text-slate-900">Academic Standing & Affiliation</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Academic Institution</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">{profile.institutionName}</span>
                <span className="text-[10px] text-slate-500">{profile.institutionLocation}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Course of Study</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">{profile.course}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Academic Department</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">{profile.department}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Graduation Batch</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">{profile.batch}</span>
              </div>
            </div>
          </div>

          {/* Certifications */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <FileBadge className="w-5 h-5 text-teal-700" />
              <h2 className="text-base font-bold text-slate-900">Certifications & Credentials</h2>
            </div>

            {profile.certifications && profile.certifications.length > 0 ? (
              <div className="space-y-3">
                {profile.certifications.map((cert, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                        <CheckCircle2 className="w-4 h-4 text-teal-600" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{cert}</div>
                        <div className="text-[10px] text-slate-500">Documented Academic Credential</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Verified
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
                No external certifications recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Projects, Internships & Achievements */}
        <div className="lg:col-span-6 space-y-8">
          {/* Projects */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <BookOpen className="w-5 h-5 text-teal-700" />
              <h2 className="text-base font-bold text-slate-900">Academic & Research Projects</h2>
            </div>

            {profile.projects && profile.projects.length > 0 ? (
              <div className="space-y-3">
                {profile.projects.map((proj, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h4 className="text-xs font-bold text-slate-900">{proj.title}</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-800 border border-teal-200 shrink-0">
                        {proj.status || 'Completed'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Domain: <strong className="text-slate-800">{proj.domain || proj.role || 'Informatics'}</strong>
                    </p>
                    {proj.description && (
                      <p className="text-[11px] text-slate-500 mt-1">{proj.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
                No projects recorded yet.
              </div>
            )}
          </div>

          {/* Internships & Work Experience */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Briefcase className="w-5 h-5 text-teal-700" />
              <h2 className="text-base font-bold text-slate-900">Internship & Practical Experience</h2>
            </div>

            {profile.internships && profile.internships.length > 0 ? (
              <div className="space-y-3">
                {profile.internships.map((intern, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{intern.role}</h4>
                      <p className="text-[11px] text-slate-600 mt-0.5">{intern.organization}</p>
                    </div>
                    <span className="text-[10px] text-slate-500 bg-white px-2 py-1 rounded border border-slate-200 font-medium">
                      {intern.duration}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
                No internship history recorded yet.
              </div>
            )}
          </div>

          {/* Achievements */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Trophy className="w-5 h-5 text-teal-700" />
              <h2 className="text-base font-bold text-slate-900">Honors & Achievements</h2>
            </div>

            {profile.achievements && profile.achievements.length > 0 ? (
              <div className="space-y-2">
                {profile.achievements.map((ach, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50/40 text-amber-950 border border-amber-200 text-xs font-medium">
                    <Trophy className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{ach}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
                No honors or achievements recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
