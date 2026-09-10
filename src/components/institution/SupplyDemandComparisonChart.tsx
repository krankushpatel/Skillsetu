/**
 * SkillSetu - Supply vs Demand Comparison Chart
 * Step 9: Institution Dashboard + Skill Intelligence
 */

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { SkillGapItem } from '../../types';

interface SupplyDemandComparisonChartProps {
  data: SkillGapItem[];
  height?: number;
}

export const SupplyDemandComparisonChart: React.FC<SupplyDemandComparisonChartProps> = ({
  data,
  height = 360,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
        No active skill comparison data available for the cohort.
      </div>
    );
  }

  // Format data for chart display
  const chartData = data.map((item) => ({
    name: item.skillName.length > 18 ? `${item.skillName.slice(0, 16)}...` : item.skillName,
    fullName: item.skillName,
    category: item.category,
    supply: item.studentAverageProficiency,
    demand: item.industryRequiredAverage,
    gap: item.gap,
    status: item.status,
    opportunityCount: item.opportunityCount,
    studentCount: item.studentCount,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      const isShortage = d.gap > 0;
      const isSurplus = d.gap < 0;

      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl text-xs max-w-xs border border-slate-800">
          <div className="font-bold text-sm text-slate-100 mb-1">{d.fullName}</div>
          <div className="text-[11px] text-slate-400 mb-2.5">Category: {d.category}</div>

          <div className="space-y-1.5 pt-1 border-t border-slate-800">
            <div className="flex justify-between items-center text-teal-300">
              <span>Student Cohort Average:</span>
              <span className="font-mono font-semibold">{d.supply}%</span>
            </div>
            <div className="flex justify-between items-center text-amber-300">
              <span>Industry Required Baseline:</span>
              <span className="font-mono font-semibold">{d.demand}%</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-800 font-semibold">
              <span>Proficiency Gap:</span>
              <span
                className={`font-mono ${
                  isShortage ? 'text-rose-400' : isSurplus ? 'text-emerald-400' : 'text-blue-400'
                }`}
              >
                {isShortage ? `+${d.gap} pts gap` : isSurplus ? `${d.gap} pts surplus` : '0 pts (balanced)'}
              </span>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-800 flex justify-between text-[10px] text-slate-400">
            <span>Demanded in {d.opportunityCount} roles</span>
            <span>{d.studentCount} assessed students</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <div className="h-[360px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 20, left: -10, bottom: 40 }}
            barGap={4}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#475569', fontSize: 11 }}
              angle={-25}
              textAnchor="end"
              interval={0}
              height={50}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: '#475569', fontSize: 11 }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: 12, fontSize: 12 }}
            />
            <ReferenceLine y={70} stroke="#94A3B8" strokeDasharray="3 3" label={{ value: 'Target 70%', fill: '#94A3B8', fontSize: 10, position: 'right' }} />
            <Bar
              dataKey="supply"
              name="Student Supply (Avg %)"
              fill="#0D9488"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
            <Bar
              dataKey="demand"
              name="Industry Demand (Req %)"
              fill="#F59E0B"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-100">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-teal-600"></span>
          Student Supply: Assessed proficiency from Step 4 assessments
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
          Industry Demand: Minimum required proficiency from active postings
        </span>
      </div>
    </div>
  );
};
