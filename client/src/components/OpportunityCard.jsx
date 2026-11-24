import React, { useState } from 'react';

export default function OpportunityCard({
  opportunity,
  student,
  isCoordinator = false,
  onApply,
  onViewApplicants,
  onDelete
}) {
  const [expanded, setExpanded] = useState(false);

  const status = opportunity.studentStatus;
  const isEligible = status?.isEligible;
  const isApplied = status?.applied;
  const isRound2Selected = status?.round2Selected;

  return (
    <div
      className={`border bg-white transition-colors ${
        !isCoordinator && isEligible
          ? 'border-2 border-emerald-600'
          : 'border-slate-300'
      }`}
    >
      {/* Top Status Header */}
      {!isCoordinator && (
        <div
          className={`px-4 py-2 text-xs font-semibold flex items-center justify-between border-b ${
            isEligible
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}
        >
          <div>
            {isEligible ? (
              <span className="text-emerald-700 font-bold uppercase tracking-wider text-[11px]">
                Eligible
              </span>
            ) : (
              <span className="text-slate-600 uppercase tracking-wider text-[11px]">
                Ineligible
              </span>
            )}
          </div>

          <div>
            {isRound2Selected ? (
              <span className="px-2 py-0.5 text-[11px] font-bold bg-indigo-900 text-white font-mono">
                ★ Round 2 Shortlisted
              </span>
            ) : isApplied ? (
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-900 text-white">
                Applied (OT Scheduled)
              </span>
            ) : isEligible ? (
              <span className="text-[11px] text-emerald-800 font-medium">
                Applications Open
              </span>
            ) : (
              <span className="text-[11px] text-slate-500 font-medium">
                Below Cutoff
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-4 sm:p-5">
        
        {/* Company & Role */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                {opportunity.company}
              </h3>
              {opportunity.category && (
                <span className="text-[11px] font-medium px-1.5 py-0.5 border border-slate-300 text-slate-700 bg-slate-50">
                  {opportunity.category}
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-slate-800 mt-0.5">
              {opportunity.role}
            </p>
            
            <div className="flex items-center gap-4 text-xs text-slate-600 mt-2 flex-wrap font-mono text-[11px]">
              <span>Location: {opportunity.location}</span>
              <span>Deadline: {opportunity.deadline}</span>
              {opportunity.examCentre && (
                <span>OT Centre: <strong className="text-slate-800 font-bold">{opportunity.examCentre}</strong></span>
              )}
              {isCoordinator && (
                <span>Applicants: {opportunity.applicantCount || 0}</span>
              )}
            </div>

            {/* Round 2 Shortlist Alert Banner */}
            {!isCoordinator && isRound2Selected && (
              <div className="mt-3 p-2 bg-indigo-50 border border-indigo-200 text-indigo-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.2 bg-indigo-900 text-white text-[10px] uppercase font-bold tracking-wider">
                    ★ Round 2
                  </span>
                  <span className="font-semibold text-indigo-950">
                    Qualified Round 1 (OT)! You have been shortlisted for Round 2.
                  </span>
                </div>
                <span className="text-[11px] font-mono text-indigo-800 font-bold shrink-0">
                  See Upcoming Tests →
                </span>
              </div>
            )}
          </div>

          {/* Package CTC */}
          <div className="sm:text-right shrink-0">
            <div className="border border-slate-300 px-3 py-1 bg-slate-50 inline-block text-left sm:text-right">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                CTC Package
              </span>
              <span className="text-sm font-bold text-slate-900 font-mono">
                ₹{opportunity.ctc} LPA
              </span>
            </div>
          </div>
        </div>

        {/* Requirements Box */}
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 text-xs text-slate-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center justify-between border-b sm:border-b-0 sm:border-r border-slate-200 pb-2 sm:pb-0 sm:pr-3">
              <span className="text-slate-500">Minimum CGPA Required:</span>
              <span className="font-bold font-mono text-slate-900">
                {opportunity.minCgpa.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Allowed Branches:</span>
              <div className="flex flex-wrap gap-1">
                {opportunity.allowedBranches.map((branch) => (
                  <span
                    key={branch}
                    className="px-1.5 py-0.5 text-[10px] font-mono border border-slate-300 bg-white text-slate-800 font-semibold"
                  >
                    {branch}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {(opportunity.otherRequirements || opportunity.customRequirementPrompt) && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-200 space-y-1.5">
              {opportunity.otherRequirements && (
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1">
                  <span className="text-slate-500 font-semibold shrink-0">Other Requirements:</span>
                  <span className="text-slate-900 font-medium">{opportunity.otherRequirements}</span>
                </div>
              )}
              {opportunity.customRequirementPrompt && (
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 text-[11px]">
                  <span className="text-slate-500 font-semibold shrink-0">Candidate Prompt:</span>
                  <span className="font-mono text-slate-800 bg-white px-1.5 py-0.5 border border-slate-300">
                    {opportunity.customRequirementPrompt}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Expandable Details */}
        {expanded && (
          <div className="mt-4 pt-3 border-t border-slate-200 space-y-3 text-xs text-slate-700">
            <div>
              <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wider block mb-1">
                Job Description
              </span>
              <p className="leading-relaxed bg-slate-50 p-2.5 border border-slate-200">
                {opportunity.description}
              </p>
            </div>

            <div>
              <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wider block mb-1">
                Selection Process
              </span>
              <p className="bg-slate-50 p-2.5 border border-slate-200">
                {opportunity.selectionProcess}
              </p>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-4 pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-slate-700 hover:text-black font-semibold underline text-left cursor-pointer"
          >
            {expanded ? 'Hide Details' : 'View Job Description & Selection Process'}
          </button>

          <div className="flex items-center gap-2">
            {isCoordinator ? (
              <>
                <button
                  type="button"
                  onClick={() => onViewApplicants(opportunity)}
                  className="px-3 py-1.5 font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 cursor-pointer"
                >
                  View Applicants ({opportunity.applicantCount || 0})
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(opportunity.id)}
                  className="px-3 py-1.5 font-semibold text-red-700 hover:bg-red-50 border border-red-200 cursor-pointer"
                >
                  Delete
                </button>
              </>
            ) : (
              isRound2Selected ? (
                <span className="px-3 py-1.5 bg-indigo-900 text-white border border-indigo-900 font-bold text-xs shadow-xs">
                  ★ Round 2 Selected
                </span>
              ) : isApplied ? (
                <span className="px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-xs">
                  Applied (OT Scheduled)
                </span>
              ) : isEligible ? (
                <button
                  type="button"
                  onClick={() => onApply(opportunity)}
                  className="px-4 py-1.5 font-semibold text-white bg-slate-900 hover:bg-black cursor-pointer"
                >
                  Apply Now
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="px-4 py-1.5 font-medium text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed"
                >
                  Ineligible
                </button>
              )
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
