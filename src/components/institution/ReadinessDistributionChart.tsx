/**
 * SkillSetu - Cohort Readiness Distribution Chart
 * Step 9: Institution Dashboard + Skill Intelligence
 */

import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { CheckCircle, Clock, AlertTriangle, HelpCircle } from 'lucide-react';
import { StudentReadinessResponse } from '../../types';

interface ReadinessDistributionChartProps {
  distribution?: StudentReadinessResponse['distribution'];
  totalStudents?: number;
  readyCount?: number;
  developingCount?: number;
  needsImprovementCount?: number;
  pendingAssessmentCount?: number;
  opportunityReadinessIndex?: number;
}

export const ReadinessDistributionChart: React.FC<ReadinessDistributionChartProps> = ({
  distribution,
  totalStudents = 8,
  readyCount = 2,
  developingCount = 3,
  needsImprovementCount = 1,
  pendingAssessmentCount = 2,
  opportunityReadinessIndex = 25.0,
}) => {
  const chartData = [
    {
      name: 'Opportunity Ready',
      key: 'ready',
      count: distribution ? distribution.ready.count : readyCount,
      percentage: distribution ? distribution.ready.percentage : 25,
      color: '#10B981', // emerald-500
      icon: CheckCircle,
      description: 'Skill quotient ≥ 70%, immediate placement suitability',
    },
    {
      name: 'Developing',
      key: 'developing',
      count: distribution ? distribution.developing.count : developingCount,
      percentage: distribution ? distribution.developing.percentage : 37.5,
      color: '#0EA5E9', // sky-500
      icon: Clock,
      description: 'Skill quotient 50–69%, minor upskilling required',
    },
    {
      name: 'Needs Improvement',
      key: 'needsImprovement',
      count: distribution ? distribution.needsImprovement.count : needsImprovementCount,
      percentage: distribution ? distribution.needsImprovement.percentage : 12.5,
      color: '#F59E0B', // amber-500
      icon: AlertTriangle,
      description: 'Skill quotient < 50%, structured intervention recommended',
    },
    {
      name: 'Pending Assessment',
      key: 'pendingAssessment',
      count: distribution ? distribution.pendingAssessment.count : pendingAssessmentCount,
      percentage: distribution ? distribution.pendingAssessment.percentage : 25,
      color: '#94A3B8', // slate-400
      icon: HelpCircle,
      description: 'No assessments completed yet; awaiting benchmark diagnostic',
    },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg text-xs border border-slate-800">
          <div className="font-semibold text-slate-100 flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }}></span>
            {data.name}
          </div>
          <div className="text-slate-300">
            <span className="font-mono font-bold text-sm text-white">{data.count}</span> students ({data.percentage}%)
          </div>
          <p className="text-[11px] text-slate-400 mt-1 max-w-[180px]">{data.description}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        {/* Donut Chart with Center Metric */}
        <div className="sm:col-span-6 relative h-[200px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="count"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Centered KPI */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {opportunityReadinessIndex}%
            </span>
            <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
              Ready Index
            </span>
          </div>
        </div>

        {/* Legend & Breakdown */}
        <div className="sm:col-span-6 space-y-2.5">
          {chartData.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <div>
                    <div className="font-medium text-slate-800">{item.name}</div>
                    <div className="text-[10px] text-slate-500">{item.percentage}% of cohort</div>
                  </div>
                </div>
                <div className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {item.count}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
