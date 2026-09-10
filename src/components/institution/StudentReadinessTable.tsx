/**
 * SkillSetu - Student Readiness Roster Table
 * Step 9: Institution Dashboard + Skill Intelligence
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ChevronRight, 
  GraduationCap, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  HelpCircle,
  Eye
} from 'lucide-react';
import { StudentReadinessItem, ReadinessStatus } from '../../types';

interface StudentReadinessTableProps {
  students: StudentReadinessItem[];
  onSelectStudent: (studentId: string) => void;
}

export const StudentReadinessTable: React.FC<StudentReadinessTableProps> = ({
  students,
  onSelectStudent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Extract unique departments
  const departments = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.department) set.add(s.department);
    });
    return Array.from(set).sort();
  }, [students]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.department.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDept = selectedDept === 'ALL' || s.department === selectedDept;
      const matchesStatus = selectedStatus === 'ALL' || s.readinessStatus === selectedStatus;

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [students, searchTerm, selectedDept, selectedStatus]);

  const getStatusBadge = (status: ReadinessStatus) => {
    switch (status) {
      case 'Ready':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Ready (≥70%)
          </span>
        );
      case 'Developing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <Clock className="w-3.5 h-3.5 text-sky-600" />
            Developing
          </span>
        );
      case 'Needs Improvement':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Needs Improvement
          </span>
        );
      case 'Pending Assessment':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            Pending Assessment
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Table Filters & Search */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student, course, dept..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-700"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-700"
          >
            <option value="ALL">All Departments ({departments.length})</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-700"
          >
            <option value="ALL">All Readiness Tiers</option>
            <option value="Ready">Ready</option>
            <option value="Developing">Developing</option>
            <option value="Needs Improvement">Needs Improvement</option>
            <option value="Pending Assessment">Pending Assessment</option>
          </select>
        </div>
      </div>

      {/* Roster Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Student Profile</th>
              <th className="py-3 px-4">Department & Course</th>
              <th className="py-3 px-4">CGPA</th>
              <th className="py-3 px-4 text-center">Skill Quotient</th>
              <th className="py-3 px-4">Assessed Skills Breakdown</th>
              <th className="py-3 px-4">Readiness Tier</th>
              <th className="py-3 px-4 text-right">Audit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                  No student records matched the selected criteria.
                </td>
              </tr>
            ) : (
              filteredStudents.map((s) => (
                <tr
                  key={s.studentId}
                  onClick={() => onSelectStudent(s.studentId)}
                  className="hover:bg-teal-50/40 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-800 text-teal-100 flex items-center justify-center font-bold font-mono text-xs shrink-0">
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-xs">{s.name}</div>
                        <div className="text-[11px] text-slate-400">{s.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-800">{s.department}</div>
                    <div className="text-[11px] text-slate-500">
                      {s.course} • {s.batch}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                    {s.cgpa ? s.cgpa.toFixed(2) : '—'}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-block font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-900">
                      {s.overallSkillQuotient}%
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-slate-700 font-semibold mr-1">
                        {s.assessedSkillsCount} skills:
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
                        title="Strong Skills"
                      >
                        {s.strongCount}S
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200"
                        title="Developing Skills"
                      >
                        {s.developingCount}D
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200"
                        title="Needs Improvement Skills"
                      >
                        {s.needsImprovementCount}N
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    {getStatusBadge(s.readinessStatus)}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectStudent(s.studentId);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-teal-800 hover:bg-teal-100/60 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Audit</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Roster Footer */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500">
        <span>
          Showing <strong>{filteredStudents.length}</strong> of <strong>{students.length}</strong> students enrolled at AIIA
        </span>
        <span className="text-[11px] text-slate-400">
          Scores updated dynamically from standardized Step 4 assessments
        </span>
      </div>
    </div>
  );
};
