/**
 * SkillSetu - Skill Requirement Builder
 * Step 7: Industry Workspace
 * 
 * Provides interactive, validated configuration of multi-attribute skill requirements:
 * - Skill selected strictly from standardized taxonomy
 * - Required Proficiency benchmark (0–100)
 * - Importance Weight (>= 0)
 * - Mandatory requirement flag (boolean)
 * - Informational total weight indicator
 * - Disallows duplicate skills and arbitrary insertions
 */

import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Sliders, 
  ShieldAlert,
  Scale
} from 'lucide-react';
import { Skill, SkillRequirementDraft } from '../../types';

interface SkillRequirementBuilderProps {
  skillsTaxonomy: Skill[];
  requirements: SkillRequirementDraft[];
  onChange: (requirements: SkillRequirementDraft[]) => void;
}

export const SkillRequirementBuilder: React.FC<SkillRequirementBuilderProps> = ({
  skillsTaxonomy,
  requirements,
  onChange
}) => {
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Available skills that have not yet been selected
  const selectedIds = new Set(requirements.map((r) => r.skillId));
  const availableSkills = skillsTaxonomy.filter((s) => !selectedIds.has(s._id));

  const totalWeight = requirements.reduce((acc, r) => acc + (Number(r.weight) || 0), 0);
  const mandatoryCount = requirements.filter((r) => r.mandatory).length;

  const handleAddRequirement = () => {
    setErrorNotice(null);
    if (availableSkills.length === 0) {
      setErrorNotice('All available standardized skills from the taxonomy are already configured.');
      return;
    }

    const firstAvailable = availableSkills[0];
    const newReq: SkillRequirementDraft = {
      skillId: firstAvailable._id,
      skillName: firstAvailable.name,
      category: firstAvailable.category,
      requiredProficiency: 70,
      weight: 30,
      mandatory: true
    };

    onChange([...requirements, newReq]);
  };

  const handleRemoveRequirement = (index: number) => {
    setErrorNotice(null);
    if (requirements.length <= 1) {
      setErrorNotice('An opportunity must specify at least one required skill benchmark.');
      return;
    }
    const updated = requirements.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleSkillChange = (index: number, newSkillId: string) => {
    setErrorNotice(null);
    // Duplicate check
    const isDuplicate = requirements.some((r, i) => i !== index && r.skillId === newSkillId);
    if (isDuplicate) {
      setErrorNotice(`Skill is already added to this opportunity. Duplicate skills are not permitted.`);
      return;
    }

    const skillInfo = skillsTaxonomy.find((s) => s._id === newSkillId);
    const updated = [...requirements];
    updated[index] = {
      ...updated[index],
      skillId: newSkillId,
      skillName: skillInfo?.name || newSkillId,
      category: skillInfo?.category || 'TECHNICAL'
    };
    onChange(updated);
  };

  const handleProficiencyChange = (index: number, val: number) => {
    setErrorNotice(null);
    const clamped = Math.max(0, Math.min(100, isNaN(val) ? 0 : val));
    const updated = [...requirements];
    updated[index] = { ...updated[index], requiredProficiency: clamped };
    onChange(updated);
  };

  const handleWeightChange = (index: number, val: number) => {
    setErrorNotice(null);
    const nonNegative = Math.max(0, isNaN(val) ? 0 : val);
    const updated = [...requirements];
    updated[index] = { ...updated[index], weight: nonNegative };
    onChange(updated);
  };

  const handleMandatoryToggle = (index: number) => {
    const updated = [...requirements];
    updated[index] = { ...updated[index], mandatory: !updated[index].mandatory };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Header with Informational Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-teal-800" />
            <span>Required Competencies & Importance Weights</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Select standardized skills, establish required proficiency benchmarks, assign relative weights, and define mandatory constraints.
          </p>
        </div>

        {/* Informational Weight & Mandatory Badges */}
        <div className="flex items-center gap-2 shrink-0">
          <div 
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold"
            title="Importance weights are relative and mathematically normalized by the Step 5 engine."
          >
            <Scale className="w-3.5 h-3.5 text-teal-700" />
            <span>Total Weight: {Math.round(totalWeight * 10) / 10}</span>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-xs font-medium">
            <ShieldAlert className="w-3 h-3 text-teal-700" />
            <span>{mandatoryCount} Mandatory</span>
          </div>
        </div>
      </div>

      {/* Inline Error Notice */}
      {errorNotice && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Requirements List */}
      <div className="space-y-3">
        {requirements.map((req, idx) => {
          const currentSkill = skillsTaxonomy.find((s) => s._id === req.skillId);
          return (
            <div
              key={`${req.skillId}_${idx}`}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                {/* Skill Selector (Dropdown from Taxonomy) */}
                <div className="md:col-span-4">
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Standardized Skill #{idx + 1}
                  </label>
                  <select
                    value={req.skillId}
                    onChange={(e) => handleSkillChange(idx, e.target.value)}
                    className="w-full bg-white border border-slate-300 text-slate-800 text-xs font-medium rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-teal-700 focus:outline-none cursor-pointer"
                  >
                    {skillsTaxonomy.map((sk) => {
                      const isAlreadyPickedElsewhere = requirements.some(
                        (other, otherIdx) => otherIdx !== idx && other.skillId === sk._id
                      );
                      return (
                        <option
                          key={sk._id}
                          value={sk._id}
                          disabled={isAlreadyPickedElsewhere}
                        >
                          {sk.name} ({sk.category}) {isAlreadyPickedElsewhere ? '— Added' : ''}
                        </option>
                      );
                    })}
                  </select>
                  {currentSkill && (
                    <span className="text-[10px] text-slate-500 block mt-1 truncate">
                      Demand score: {currentSkill.industryDemandScore}/100 • {currentSkill.description}
                    </span>
                  )}
                </div>

                {/* Required Proficiency (0 - 100) */}
                <div className="md:col-span-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                      Target Proficiency
                    </label>
                    <span className="text-xs font-bold text-teal-800 font-mono">
                      {req.requiredProficiency}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={5}
                      value={req.requiredProficiency}
                      onChange={(e) => handleProficiencyChange(idx, Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-800"
                    />
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={req.requiredProficiency}
                      onChange={(e) => handleProficiencyChange(idx, Number(e.target.value))}
                      className="w-14 bg-white border border-slate-300 text-slate-800 text-xs font-semibold rounded px-1.5 py-1 text-center focus:ring-1 focus:ring-teal-700 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Importance Weight (>= 0) */}
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Weight
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={5}
                      value={req.weight}
                      onChange={(e) => handleWeightChange(idx, Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-teal-700 focus:outline-none"
                    />
                    <span className="absolute right-2 top-1.5 text-[10px] text-slate-400 font-medium pointer-events-none">
                      pts
                    </span>
                  </div>
                </div>

                {/* Mandatory Requirement Flag */}
                <div className="md:col-span-2 flex items-center">
                  <label 
                    className="flex items-center gap-2 cursor-pointer mt-3 md:mt-0 select-none"
                    title="Mandatory requirements must be satisfied for the candidate to receive an ELIGIBLE classification."
                  >
                    <input
                      type="checkbox"
                      checked={req.mandatory}
                      onChange={() => handleMandatoryToggle(idx)}
                      className="w-4 h-4 text-teal-800 rounded border-slate-300 focus:ring-teal-700 cursor-pointer accent-teal-800"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">
                        Mandatory
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {req.mandatory ? 'Enforced' : 'Optional'}
                      </span>
                    </div>
                  </label>
                </div>

                {/* Remove Button */}
                <div className="md:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveRequirement(idx)}
                    disabled={requirements.length <= 1}
                    className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 disabled:hover:text-slate-400 rounded-lg transition-colors cursor-pointer"
                    title={requirements.length <= 1 ? 'At least one skill requirement is required' : 'Remove requirement'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Skill Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={handleAddRequirement}
          disabled={availableSkills.length === 0}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <Plus className="w-4 h-4 text-teal-800" />
          <span>Add Skill Requirement</span>
        </button>

        <p className="text-[11px] text-slate-500">
          All requirements are evaluated transparently using the authoritative Step 5 matching formula.
        </p>
      </div>
    </div>
  );
};
