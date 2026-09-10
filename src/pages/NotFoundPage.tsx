/**
 * SkillSetu - 404 Not Found Page
 * Step 1: Project Foundation
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto mb-4">
        <HelpCircle className="w-7 h-7" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Page Not Found</h1>
      <p className="text-xs text-slate-600 mb-6 leading-relaxed">
        The requested path does not exist in the SkillSetu portal framework.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-800 hover:bg-teal-700 text-white text-xs font-medium transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Portal Overview</span>
      </Link>
    </div>
  );
};
