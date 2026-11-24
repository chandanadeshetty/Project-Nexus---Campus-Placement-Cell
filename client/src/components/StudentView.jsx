import React, { useState, useMemo } from 'react';
import OpportunityCard from './OpportunityCard';
import StudentUpcomingTests from './StudentUpcomingTests';

export default function StudentView({
  student,
  opportunities,
  loading,
  onApply
}) {
  const [activeSection, setActiveSection] = useState('opportunities'); // 'opportunities' | 'upcoming-tests'
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'eligible', 'applied', 'ineligible'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'ctc_desc', 'cgpa_asc'

  // Feed strictly filtered for student's branch
  const branchOpportunities = useMemo(() => {
    return opportunities.filter(
      (opp) => opp.allowedBranches && opp.allowedBranches.includes(student.branchCode)
    );
  }, [opportunities, student.branchCode]);

  // Statistics
  const stats = useMemo(() => {
    let eligibleCount = 0;
    let ineligibleCount = 0;
    let appliedCount = 0;

    branchOpportunities.forEach((opp) => {
      const isEligible = opp.studentStatus?.isEligible;
      const isApplied = opp.studentStatus?.applied;
      if (isApplied) appliedCount++;
      if (isEligible) eligibleCount++;
      else ineligibleCount++;
    });

    return {
      total: branchOpportunities.length,
      eligible: eligibleCount,
      ineligible: ineligibleCount,
      applied: appliedCount
    };
  }, [branchOpportunities]);

  // Filter and sort opportunities
  const filteredOpportunities = useMemo(() => {
    return branchOpportunities
      .filter((opp) => {
        if (activeTab === 'eligible' && !opp.studentStatus?.isEligible) return false;
        if (activeTab === 'applied' && !opp.studentStatus?.applied) return false;
        if (activeTab === 'ineligible' && opp.studentStatus?.isEligible) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchCompany = opp.company.toLowerCase().includes(q);
          const matchRole = opp.role.toLowerCase().includes(q);
          const matchLocation = opp.location?.toLowerCase().includes(q);
          if (!matchCompany && !matchRole && !matchLocation) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'ctc_desc') return b.ctc - a.ctc;
        if (sortBy === 'cgpa_asc') return a.minCgpa - b.minCgpa;
        if (a.studentStatus?.isEligible !== b.studentStatus?.isEligible) {
          return a.studentStatus?.isEligible ? -1 : 1;
        }
        return new Date(b.postedAt || 0) - new Date(a.postedAt || 0);
      });
  }, [branchOpportunities, activeTab, searchQuery, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5 text-xs text-slate-800">
      
      {/* Student Profile Banner - Sharp & Single Tone */}
      <div className="border border-slate-300 bg-white p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {student.name}
            </h1>
            <div className="mt-1 text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
              <span>Roll Number: <strong className="text-slate-900 font-mono">{student.rollNo}</strong></span>
              <span>Department: <strong className="text-slate-900">{student.branch} ({student.branchCode})</strong></span>
              <span>Email: <strong className="text-slate-900 font-mono">{student.email}</strong></span>
            </div>
          </div>

          <div className="border border-slate-300 bg-slate-50 px-4 py-2 text-right shrink-0">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              Cumulative GPA
            </span>
            <span className="text-xl font-bold font-mono text-slate-900">
              {Number(student.cgpa).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-600">
          Showing placement drives open for <strong className="text-slate-900">{student.branchCode}</strong> candidates. Company opportunities not allowing {student.branchCode} are excluded.
        </div>
      </div>

      {/* Navigation Switcher: Opportunities Feed vs Upcoming Tests */}
      <div className="flex border-b border-slate-300 bg-white text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveSection('opportunities')}
          className={`px-4 py-2.5 transition cursor-pointer ${
            activeSection === 'opportunities'
              ? 'border-b-2 border-slate-900 font-bold text-slate-900 bg-slate-50'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Company Opportunities ({branchOpportunities.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('upcoming-tests')}
          className={`px-4 py-2.5 transition cursor-pointer flex items-center gap-1.5 ${
            activeSection === 'upcoming-tests'
              ? 'border-b-2 border-slate-900 font-bold text-slate-900 bg-slate-50'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Upcoming Tests</span>
          <span className="font-mono text-[10px] px-1.5 py-0.2 bg-slate-200 text-slate-800">
            {stats.applied}
          </span>
        </button>
      </div>

      {/* Conditional View Rendering */}
      {activeSection === 'upcoming-tests' ? (
        <StudentUpcomingTests student={student} opportunities={opportunities} />
      ) : (
        <>
          {/* KPI Stats Grid - Sharp Edges */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div
              onClick={() => setActiveTab('all')}
              className={`border p-3 cursor-pointer ${
                activeTab === 'all'
                  ? 'border-slate-900 bg-slate-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total {student.branchCode} Drives
              </span>
              <span className="text-xl font-bold font-mono text-slate-900 block mt-1">
                {stats.total}
              </span>
            </div>

            <div
              onClick={() => setActiveTab('eligible')}
              className={`border p-3 cursor-pointer ${
                activeTab === 'eligible'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
                  : 'border-slate-200 bg-white hover:border-emerald-500'
              }`}
            >
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                Eligible
              </span>
              <span className="text-xl font-bold font-mono text-emerald-900 block mt-1">
                {stats.eligible}
              </span>
            </div>

            <div
              onClick={() => setActiveTab('applied')}
              className={`border p-3 cursor-pointer ${
                activeTab === 'applied'
                  ? 'border-slate-900 bg-slate-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Applied
              </span>
              <span className="text-xl font-bold font-mono text-slate-900 block mt-1">
                {stats.applied}
              </span>
            </div>

            <div
              onClick={() => setActiveTab('ineligible')}
              className={`border p-3 cursor-pointer ${
                activeTab === 'ineligible'
                  ? 'border-slate-900 bg-slate-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Ineligible
              </span>
              <span className="text-xl font-bold font-mono text-slate-900 block mt-1">
                {stats.ineligible}
              </span>
            </div>
          </div>

          {/* Filter Tabs & Search Bar */}
          <div className="border border-slate-300 bg-white p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1 overflow-x-auto">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 font-semibold transition cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                }`}
              >
                All Openings ({stats.total})
              </button>
              <button
                onClick={() => setActiveTab('eligible')}
                className={`px-3 py-1.5 font-semibold transition cursor-pointer ${
                  activeTab === 'eligible'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-300'
                }`}
              >
                Eligible ({stats.eligible})
              </button>
              <button
                onClick={() => setActiveTab('applied')}
                className={`px-3 py-1.5 font-semibold transition cursor-pointer ${
                  activeTab === 'applied'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                }`}
              >
                Applied ({stats.applied})
              </button>
              <button
                onClick={() => setActiveTab('ineligible')}
                className={`px-3 py-1.5 font-semibold transition cursor-pointer ${
                  activeTab === 'ineligible'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                }`}
              >
                Ineligible ({stats.ineligible})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search company or role..."
                className="w-full sm:w-56 px-3 py-1.5 bg-slate-50 border border-slate-300 focus:outline-none focus:border-slate-800 text-xs"
              />

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-slate-800 cursor-pointer"
              >
                <option value="newest">Eligible First</option>
                <option value="ctc_desc">Highest CTC</option>
                <option value="cgpa_asc">Lowest CGPA Cutoff</option>
              </select>
            </div>
          </div>

          {/* Opportunities List */}
          {loading ? (
            <div className="text-center py-12 text-xs text-slate-500 font-mono">
              Loading placement opportunities...
            </div>
          ) : filteredOpportunities.length === 0 ? (
            <div className="border border-slate-300 bg-white p-8 text-center text-xs text-slate-600">
              <p className="font-semibold text-slate-900 text-sm">No opportunities match the selected criteria.</p>
              <button
                onClick={() => {
                  setActiveTab('all');
                  setSearchQuery('');
                }}
                className="mt-3 px-3 py-1.5 font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-300 cursor-pointer text-slate-800"
              >
                Show All {student.branchCode} Drives
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOpportunities.map((opportunity) => (
                <OpportunityCard
                  key={opportunity.id}
                  opportunity={opportunity}
                  student={student}
                  isCoordinator={false}
                  onApply={onApply}
                />
              ))}
            </div>
          )}
        </>
      )}

    </div>
  );
}
