/**
 * SkillSetu - Navigation Header
 * Step 1: Project Foundation
 */

import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Sparkles, 
  GraduationCap, 
  Building2, 
  Landmark, 
  Activity, 
  LogIn
} from 'lucide-react';
import { healthService } from '../../services/healthService';
import { SystemHealthResponse } from '../../types';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [health, setHealth] = useState<SystemHealthResponse | null>(null);
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      try {
        const res = await healthService.checkHealth();
        if (isMounted) {
          setHealth(res);
          setIsBackendHealthy(res.status === 'healthy');
        }
      } catch {
        if (isMounted) {
          setIsBackendHealthy(false);
        }
      }
    };

    checkStatus();
    // Re-check periodically
    const interval = setInterval(checkStatus, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const navLinks = [
    { path: '/', label: 'Overview', icon: Sparkles },
    { path: '/student', label: 'Student Portal', icon: GraduationCap },
    { path: '/industry', label: 'Industry Portal', icon: Building2 },
    { path: '/institution', label: 'Institution Portal', icon: Landmark },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Top Ministry Banner */}
      <div className="bg-slate-900 text-slate-300 text-xs px-4 py-1.5 flex flex-wrap items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
          <span className="font-medium text-slate-200">Ministry of Ayush</span>
          <span className="text-slate-500">|</span>
          <span>All India Institute of Ayurveda (AIIA)</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] font-mono text-emerald-400">
            SIH Problem Statement: 26044
          </span>
          <div className="flex items-center gap-1.5" title={health?.database?.status_message || 'Backend Status'}>
            <span
              className={`w-2 h-2 rounded-full ${
                isBackendHealthy === true
                  ? 'bg-emerald-400 animate-pulse'
                  : isBackendHealthy === false
                  ? 'bg-rose-400'
                  : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span className="text-[11px] text-slate-400">
              {isBackendHealthy === true ? 'FastAPI Active' : isBackendHealthy === false ? 'API Offline' : 'Connecting API'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Identity */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-teal-800 flex items-center justify-center text-white shadow-sm group-hover:bg-teal-700 transition-colors">
              <Activity className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-slate-900">
                  SkillSetu
                </span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                  कौशल सेतु
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Where Skills Meet Opportunity.
              </p>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = link.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-100 text-teal-800 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-700' : 'text-slate-400'}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Action / Gateway Button */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg text-white bg-teal-800 hover:bg-teal-700 transition-colors shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              <span>Role Gateway</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
