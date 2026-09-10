/**
 * SkillSetu - Skill Radar Chart Component
 * Step 3: Student Module & Skill Profile
 * 
 * Crisp, responsive SVG radar visualization mapping student assessed skill proficiencies.
 * Zero external charting library crash risk; fully responsive and accessible.
 */

import React, { useState } from 'react';
import { EnrichedStudentSkill } from '../../types';

interface SkillRadarChartProps {
  skills: EnrichedStudentSkill[];
  size?: number;
}

export const SkillRadarChart: React.FC<SkillRadarChartProps> = ({ skills, size = 420 }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!skills || skills.length < 3) {
    return (
      <div className="flex items-center justify-center h-64 text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
        Requires at least 3 assessed skills for radar visualization.
      </div>
    );
  }

  const center = size / 2;
  const radius = (size / 2) - 55; // Leave margin for labels
  const total = skills.length;
  const levels = [20, 40, 60, 80, 100];

  // Helper to compute (x, y) coordinates from index and value (0-100)
  const getCoordinates = (index: number, value: number) => {
    const angle = (Math.PI * 2 / total) * index - Math.PI / 2;
    const distance = (value / 100) * radius;
    const x = center + distance * Math.cos(angle);
    const y = center + distance * Math.sin(angle);
    return { x, y, angle };
  };

  // Polygon points for the student's assessed skill scores
  const polygonPoints = skills
    .map((skill, i) => {
      const { x, y } = getCoordinates(i, skill.proficiency);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="relative flex flex-col items-center">
      <div className="w-full max-w-[420px] aspect-square">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full select-none overflow-visible"
        >
          {/* Concentric Grid Rings */}
          {levels.map((lvl) => {
            const ringPoints = skills
              .map((_, i) => {
                const { x, y } = getCoordinates(i, lvl);
                return `${x},${y}`;
              })
              .join(' ');
            return (
              <g key={lvl}>
                <polygon
                  points={ringPoints}
                  fill={lvl === 100 ? 'rgba(248, 250, 252, 0.6)' : 'none'}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray={lvl < 100 ? '2,2' : undefined}
                />
                <text
                  x={center + 4}
                  y={center - ((lvl / 100) * radius) + 3}
                  fontSize="9"
                  fill="#94a3b8"
                  className="font-mono font-medium"
                >
                  {lvl}%
                </text>
              </g>
            );
          })}

          {/* Spokes from Center */}
          {skills.map((_, i) => {
            const { x, y } = getCoordinates(i, 100);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
            );
          })}

          {/* Student Proficiency Filled Polygon */}
          <polygon
            points={polygonPoints}
            fill="rgba(13, 148, 136, 0.18)"
            stroke="#0f766e"
            strokeWidth="2.5"
            strokeLinejoin="round"
            className="transition-all duration-300"
          />

          {/* Data Vertices and Interactive Points */}
          {skills.map((skill, i) => {
            const { x, y } = getCoordinates(i, skill.proficiency);
            const isHovered = hoveredIndex === i;
            return (
              <g key={skill.skillId} className="cursor-pointer">
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 6 : 4}
                  fill={isHovered ? '#042f2e' : '#0f766e'}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-all duration-150"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
                {/* Tooltip on hover */}
                {isHovered && (
                  <g>
                    <rect
                      x={x - 45}
                      y={y - 30}
                      width="90"
                      height="22"
                      rx="4"
                      fill="#0f172a"
                      opacity="0.9"
                    />
                    <text
                      x={x}
                      y={y - 15}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      {skill.proficiency}% Assessed
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Axis Labels with Skill Names */}
          {skills.map((skill, i) => {
            const { x, y, angle } = getCoordinates(i, 118);
            // Determine text anchor based on horizontal angle
            let anchor: 'start' | 'middle' | 'end' = 'middle';
            if (Math.cos(angle) > 0.3) anchor = 'start';
            else if (Math.cos(angle) < -0.3) anchor = 'end';

            const isHovered = hoveredIndex === i;

            return (
              <text
                key={skill.skillId}
                x={x}
                y={y + 4}
                textAnchor={anchor}
                fontSize="10"
                fill={isHovered ? '#0f766e' : '#334155'}
                fontWeight={isHovered ? 'bold' : '500'}
                className="cursor-pointer transition-colors duration-150"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {skill.skillName.length > 22 ? `${skill.skillName.slice(0, 20)}…` : skill.skillName}
              </text>
            );
          })}
        </svg>
      </div>

      <div className="flex items-center gap-6 mt-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-teal-600/30 border border-teal-700" />
          <span>Assessed Proficiency (0–100)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-1 border-t border-slate-300 border-dashed" />
          <span>Benchmark Scales (20–100%)</span>
        </div>
      </div>
    </div>
  );
};
