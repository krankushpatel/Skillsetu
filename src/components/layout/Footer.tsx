/**
 * SkillSetu - Footer Component
 * Step 1: Project Foundation
 */

import React from 'react';
import { ShieldCheck, HeartHandshake } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-200 font-semibold mb-1">
              <span>SkillSetu (कौशल सेतु)</span>
              <span className="text-slate-500 font-normal">|</span>
              <span className="text-emerald-400 font-normal">Step 1: Project Foundation</span>
            </div>
            <p className="text-slate-500 text-[11px] max-w-xl leading-relaxed">
              Developed for Smart India Hackathon (SIH Problem Statement 26044) — Ministry of Ayush & All India Institute of Ayurveda (AIIA).
              Connecting academia and industry through explainable skill mapping, transparent gap analysis, and placement readiness.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded border border-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>FastAPI + MongoDB Architecture</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded border border-slate-700">
              <HeartHandshake className="w-3.5 h-3.5 text-amber-400" />
              <span>Ayush & Health-Tech Focus</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800/80 mt-6 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <p>© 2026 SkillSetu Project Team. All rights reserved.</p>
          <p className="font-mono text-slate-600">v1.0.0-foundation (FastAPI Backend + React Frontend)</p>
        </div>
      </div>
    </footer>
  );
};
