/**
 * SkillSetu - Create Opportunity Page
 * Step 7: Industry Workspace
 * 
 * Provides an opportunity posting workflow with the SkillRequirementBuilder:
 * - Basic metadata (title, type, location, workMode, stipend, duration, description)
 * - Standardized competency selection, required proficiencies, weights, and mandatory flags
 * - Submits atomically to POST /api/industry/opportunities
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Briefcase, 
  Save, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  Sliders
} from 'lucide-react';
import { IndustryHeader } from '../../components/industry/IndustryHeader';
import { SkillRequirementBuilder } from '../../components/industry/SkillRequirementBuilder';
import { useIndustry } from '../../context/IndustryContext';
import { dataService } from '../../services/dataService';
import { industryService } from '../../services/industryService';
import { Skill, SkillRequirementDraft, OpportunityType, WorkMode } from '../../types';

export const IndustryCreateOpportunityPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedIndustryId, currentOrg } = useIndustry();

  const [skillsTaxonomy, setSkillsTaxonomy] = useState<Skill[]>([]);
  const [loadingTaxonomy, setLoadingTaxonomy] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState<string>('');
  const [type, setType] = useState<OpportunityType>('INTERNSHIP');
  const [workMode, setWorkMode] = useState<WorkMode>('HYBRID');
  const [location, setLocation] = useState<string>(currentOrg.location);
  const [duration, setDuration] = useState<string>('6 months');
  const [stipend, setStipend] = useState<string>('₹25,000 / month');
  const [description, setDescription] = useState<string>('');

  // Skill Requirements Draft
  const [requirements, setRequirements] = useState<SkillRequirementDraft[]>([]);

  useEffect(() => {
    let isMounted = true;
    dataService.getSkills()
      .then((res) => {
        if (isMounted) {
          setSkillsTaxonomy(res.data || []);
          setLoadingTaxonomy(false);

          // Seed default requirements if available
          if (res.data && res.data.length >= 2) {
            setRequirements([
              {
                skillId: res.data[0]._id,
                skillName: res.data[0].name,
                category: res.data[0].category,
                requiredProficiency: 70,
                weight: 40,
                mandatory: true
              },
              {
                skillId: res.data[1]._id,
                skillName: res.data[1].name,
                category: res.data[1].category,
                requiredProficiency: 60,
                weight: 30,
                mandatory: false
              }
            ]);
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          setErrorMessage('Failed to load standardized skills taxonomy.');
          setLoadingTaxonomy(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Opportunity title is required.');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Opportunity description is required.');
      return;
    }
    if (requirements.length === 0) {
      setErrorMessage('At least one standardized skill requirement is required.');
      return;
    }

    // Check for duplicate skill IDs
    const skillIds = requirements.map((r) => r.skillId);
    if (new Set(skillIds).size !== skillIds.length) {
      setErrorMessage('Duplicate skills detected in requirements list.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        industryId: selectedIndustryId,
        title: title.trim(),
        description: description.trim(),
        type,
        location: location.trim(),
        workMode,
        duration: duration.trim(),
        stipend: stipend.trim(),
        requiredSkills: requirements.map((r) => ({
          skillId: r.skillId,
          requiredProficiency: Number(r.requiredProficiency),
          weight: Number(r.weight),
          mandatory: Boolean(r.mandatory)
        }))
      };

      const created = await industryService.createOpportunity(payload);
      navigate(`/industry/opportunities/${created.id}/candidates`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create opportunity. Please verify all fields.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <IndustryHeader activeTab="create" />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/industry/opportunities" className="hover:text-slate-800 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Opportunities</span>
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-medium">Post Opportunity</span>
        </div>

        {/* Page Title */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Post Opportunity & Define Skill Benchmarks
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configuring opportunity for <span className="font-semibold text-slate-700">{currentOrg.name}</span>.
            Matched candidates are computed deterministically against the student competency database.
          </p>
        </div>

        {/* Error Notice */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Create Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          {/* Basic Role Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-teal-800" />
              <span>Role Specifications</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Opportunity Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Clinical Research Associate, Health Informatics Intern"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-700 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Opportunity Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as OpportunityType)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-700 focus:outline-none cursor-pointer"
                >
                  <option value="INTERNSHIP">Internship</option>
                  <option value="FELLOWSHIP">Fellowship</option>
                  <option value="FULL_TIME">Full-time Role</option>
                  <option value="PROJECT">Project Engagement</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Mode
                </label>
                <select
                  value={workMode}
                  onChange={(e) => setWorkMode(e.target.value as WorkMode)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-700 focus:outline-none cursor-pointer"
                >
                  <option value="HYBRID">Hybrid</option>
                  <option value="ON_SITE">On-Site</option>
                  <option value="REMOTE">Remote</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-700 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Duration
                </label>
                <input
                  type="text"
                  placeholder="e.g. 6 months"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Stipend / Remuneration
                </label>
                <input
                  type="text"
                  placeholder="e.g. ₹25,000 / month"
                  value={stipend}
                  onChange={(e) => setStipend(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-700 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Opportunity Description *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Describe role responsibilities, project scope, and integration with Ayush clinical or technical initiatives..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-700 focus:outline-none leading-relaxed"
              />
            </div>
          </div>

          {/* Skill Requirement Builder Component */}
          {loadingTaxonomy ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Loading standardized skills taxonomy...
            </div>
          ) : (
            <SkillRequirementBuilder
              skillsTaxonomy={skillsTaxonomy}
              requirements={requirements}
              onChange={setRequirements}
            />
          )}

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-[11px] text-slate-500">
              All candidates will be ranked based on the authoritative Step 5 matching formula.
            </span>

            <div className="flex items-center gap-2">
              <Link
                to="/industry/opportunities"
                className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold transition-colors"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={submitting || loadingTaxonomy}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-800 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{submitting ? 'Creating & Matching...' : 'Publish Role & Compute Matches'}</span>
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};
