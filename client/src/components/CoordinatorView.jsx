import React, { useState } from 'react';
import OpportunityCard from './OpportunityCard';
import PostOpportunityModal from './PostOpportunityModal';
import ApplicantsModal from './ApplicantsModal';
import StudentDatabaseModal from './StudentDatabaseModal';

export default function CoordinatorView({
  coordinator,
  opportunities,
  students,
  loading,
  onCreateOpportunity,
  onDeleteOpportunity,
  onRefresh
}) {
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);
  const [selectedOpportunityForApplicants, setSelectedOpportunityForApplicants] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const totalApplications = opportunities.reduce(
    (acc, opp) => acc + (opp.applicantCount || 0),
    0
  );

  const filteredOpportunities = opportunities.filter((opp) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      opp.company.toLowerCase().includes(q) ||
      opp.role.toLowerCase().includes(q) ||
      opp.allowedBranches?.some((b) => b.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-xs text-slate-800">
      
      {/* Coordinator Header - Sharp & Monotone */}
      <div className="border border-slate-300 bg-white p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {coordinator?.name || 'Dr. K. Venkatesh'}
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Center for Career Planning and Development (CCPD) • NIT Warangal
            </p>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              {coordinator?.email || 'coordinator@nitw.ac.in'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsStudentsModalOpen(true)}
              className="px-3.5 py-1.5 font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 transition cursor-pointer"
            >
              Student Database ({students.length})
            </button>

            <button
              onClick={() => setIsPostModalOpen(true)}
              className="px-4 py-1.5 font-semibold bg-slate-900 hover:bg-black text-white transition cursor-pointer"
            >
              Post New Opportunity
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid - Sharp */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="border border-slate-300 bg-white p-3">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Active Drives
          </span>
          <span className="text-xl font-bold font-mono text-slate-900 block mt-1">
            {opportunities.length}
          </span>
          <span className="text-[10px] text-slate-500 block">Total companies</span>
        </div>

        <div className="border border-slate-300 bg-white p-3">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Applications
          </span>
          <span className="text-xl font-bold font-mono text-slate-900 block mt-1">
            {totalApplications}
          </span>
          <span className="text-[10px] text-slate-500 block">From eligible candidates</span>
        </div>

        <div className="border border-slate-300 bg-white p-3">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Enrolled Students
          </span>
          <span className="text-xl font-bold font-mono text-slate-900 block mt-1">
            {students.length}
          </span>
          <span className="text-[10px] text-slate-500 block">Academic database</span>
        </div>
      </div>

      {/* Toolbar - Sharp */}
      <div className="border border-slate-300 bg-white p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="font-bold text-slate-900 block">Manage Placement Opportunities</span>
          <span className="text-slate-500 text-[11px]">Configure branch eligibility and minimum CGPA</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search company or branch..."
            className="w-full sm:w-56 px-3 py-1.5 bg-slate-50 border border-slate-300 focus:outline-none focus:border-slate-800 text-xs"
          />

          <button
            onClick={() => setIsPostModalOpen(true)}
            className="px-3 py-1.5 font-semibold bg-slate-900 text-white hover:bg-black cursor-pointer shrink-0"
          >
            Post Drive
          </button>
        </div>
      </div>

      {/* Opportunities List */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 font-mono">
          Loading placement drives...
        </div>
      ) : filteredOpportunities.length === 0 ? (
        <div className="border border-slate-300 bg-white p-8 text-center text-slate-600">
          No placement drives posted yet.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOpportunities.map((opportunity) => (
            <OpportunityCard
              key={opportunity.id}
              opportunity={opportunity}
              student={null}
              isCoordinator={true}
              onViewApplicants={(opp) => setSelectedOpportunityForApplicants(opp)}
              onDelete={onDeleteOpportunity}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <PostOpportunityModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        onSubmit={onCreateOpportunity}
      />

      <ApplicantsModal
        isOpen={!!selectedOpportunityForApplicants}
        onClose={() => setSelectedOpportunityForApplicants(null)}
        opportunity={selectedOpportunityForApplicants}
        onUpdated={onRefresh}
      />

      <StudentDatabaseModal
        isOpen={isStudentsModalOpen}
        onClose={() => setIsStudentsModalOpen(false)}
        students={students}
      />

    </div>
  );
}
