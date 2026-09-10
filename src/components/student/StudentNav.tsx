/**
 * SkillSetu - Student Workspace Navigation & Demo Selector
 * Step 3: Student Module & Skill Profile
 */

import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Award, 
  User, 
  Briefcase, 
  FileText,
  UserCheck,
  ChevronDown,
  Check,
  FileCheck
} from 'lucide-react';
import { studentService } from '../../services/studentService';
import { StudentSummary } from '../../types';

interface StudentNavProps {
  currentStudentName?: string;
  onStudentChange?: (studentId: string) => void;
}

export const StudentNav: React.FC<StudentNavProps> = ({ currentStudentName, onStudentChange }) => {
  const location = useLocation();
  const [allStudents, setAllStudents] = useState<StudentSummary[]>([]);
  const [activeId, setActiveId] = useState<string>(studentService.getActiveStudentId());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    studentService.getAllStudents().then((students) => {
      setAllStudents(students);
    }).catch((err) => {
      console.warn('Could not load student list for switcher:', err);
    });
  }, []);

  const handleSelectStudent = (id: string) => {
    setActiveId(id);
    studentService.setActiveStudentId(id);
    setIsDropdownOpen(false);
    if (onStudentChange) {
      onStudentChange(id);
    }
  };

  interface NavTab {
    path: string;
    label: string;
    icon: any;
    exact?: boolean;
    badge?: string;
  }

  const navTabs: NavTab[] = [
    { path: '/student', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/student/skills', label: 'My Skills', icon: Award },
    { path: '/student/assessment', label: 'Skill Assessment', icon: FileCheck },
    { path: '/student/profile', label: 'My Profile', icon: User },
    { path: '/student/opportunities', label: 'Available Opportunities', icon: Briefcase },
    { path: '/student/applications', label: 'Applications', icon: FileText },
  ];

  const activeStudent = allStudents.find(s => s.id === activeId);

  return (
    <div className="bg-white border-b border-slate-200 mb-8 -mt-6 sm:-mt-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-4">
      {/* Student Banner & Demo Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200 mb-1">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Student Career & Skill Intelligence Workspace</span>
          </span>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900">
            {currentStudentName || activeStudent?.name || 'Aarav Sharma'}
          </h1>
          <p className="text-xs text-slate-500">
            {activeStudent ? `${activeStudent.course} • ${activeStudent.department}` : 'All India Institute of Ayurveda (AIIA)'}
          </p>
        </div>

        {/* Demo Switcher for Evaluation */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="inline-flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs text-slate-700 font-medium transition-colors w-full sm:w-auto"
            title="Switch demo student to test dynamic calculation across diverse cohorts"
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-600" />
              <span className="text-slate-500">Demo Candidate:</span>
              <span className="font-semibold text-slate-800">
                {activeStudent?.name || 'Aarav Sharma'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {isDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-20" 
                onClick={() => setIsDropdownOpen(false)} 
              />
              <div className="absolute right-0 mt-1.5 w-72 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-30 max-h-80 overflow-y-auto">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Switch Seeded Candidate
                </div>
                {allStudents.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectStudent(s.id)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      s.id === activeId ? 'bg-teal-50/70 text-teal-900 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-slate-900">{s.name}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                        CGPA {s.cgpa} • {s.department}
                      </div>
                    </div>
                    {s.id === activeId && (
                      <Check className="w-4 h-4 text-teal-700 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pt-2">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.exact 
            ? location.pathname === tab.path 
            : location.pathname.startsWith(tab.path);

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-teal-700 text-teal-900 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-teal-700' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-500 border border-slate-200">
                  {tab.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};
