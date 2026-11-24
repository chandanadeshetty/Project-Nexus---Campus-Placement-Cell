import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api';

export default function ApplicantsModal({ isOpen, onClose, opportunity, onUpdated }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'shortlisted' | 'pending'
  const [selectedAppIds, setSelectedAppIds] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // Round 2 schedule parameters for this opportunity
  const defaultR2Date = useMemo(() => {
    if (!opportunity?.testDate) return '2026-11-27';
    try {
      const d = new Date(opportunity.testDate + 'T00:00:00');
      d.setDate(d.getDate() + 5);
      return d.toISOString().split('T')[0];
    } catch (e) {
      return '2026-11-27';
    }
  }, [opportunity]);

  const [round2Date, setRound2Date] = useState(defaultR2Date);
  const [round2Time, setRound2Time] = useState('11:00 AM - 12:30 PM');
  const [round2Round, setRound2Round] = useState('Round 2: Technical Interview');
  const [round2Venue, setRound2Venue] = useState('CCPD Interview Cubicle 1 / Online Meet');

  useEffect(() => {
    if (defaultR2Date) {
      setRound2Date(defaultR2Date);
    }
  }, [defaultR2Date]);

  useEffect(() => {
    if (isOpen && opportunity) {
      loadApplicants();
      setSelectedAppIds([]);
    }
  }, [isOpen, opportunity]);

  const loadApplicants = async () => {
    setLoading(true);
    try {
      const res = await api.getApplicants(opportunity.id);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !opportunity) return null;

  const applicantsList = data?.applicants || [];
  const shortlistedCount = applicantsList.filter(a => a.round2Selected).length;
  const pendingCount = applicantsList.length - shortlistedCount;

  // Check if the OT (Round 1 Online Test) date has passed
  const isOTCompleted = (() => {
    if (!opportunity?.testDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const otDate = new Date(opportunity.testDate + 'T00:00:00');
    return today > otDate; // OT is completed only after the test date has passed
  })();

  const filteredApplicants = applicantsList.filter(item => {
    if (filterMode === 'shortlisted' && !item.round2Selected) return false;
    if (filterMode === 'pending' && item.round2Selected) return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const s = item.student;
    return (
      s?.name?.toLowerCase().includes(q) ||
      s?.rollNo?.toLowerCase().includes(q) ||
      s?.branchCode?.toLowerCase().includes(q) ||
      item.preferredLocation?.toLowerCase().includes(q)
    );
  });

  const allFilteredSelected =
    filteredApplicants.length > 0 &&
    filteredApplicants.every(a => selectedAppIds.includes(a.applicationId));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      const idsToRemove = new Set(filteredApplicants.map(a => a.applicationId));
      setSelectedAppIds(selectedAppIds.filter(id => !idsToRemove.has(id)));
    } else {
      const newIds = new Set([
        ...selectedAppIds,
        ...filteredApplicants.map(a => a.applicationId)
      ]);
      setSelectedAppIds(Array.from(newIds));
    }
  };

  const toggleSelectOne = (id) => {
    if (selectedAppIds.includes(id)) {
      setSelectedAppIds(selectedAppIds.filter(item => item !== id));
    } else {
      setSelectedAppIds([...selectedAppIds, id]);
    }
  };

  const buildRound2Details = () => ({
    roundName: round2Round.trim() || 'Round 2: Technical Interview',
    date: round2Date || defaultR2Date,
    time: round2Time.trim() || '11:00 AM - 12:30 PM',
    venue: round2Venue.trim() || 'CCPD Interview Room',
    duration: '60 Mins',
    instructions: `Congratulations on qualifying Round 1 (OT)! You have been shortlisted for Round 2 with ${opportunity.company}.\nSlot: ${round2Time}\nVenue: ${round2Venue}\n\nPlease report 15 minutes before your scheduled slot with your updated resume, transcripts, and NITW Student ID card.`
  });

  const handleToggleSingleRound2 = async (item, shouldShortlist) => {
    setActionLoading(true);
    try {
      const updates = shouldShortlist
        ? {
            status: 'Shortlisted for Round 2',
            round2Selected: true,
            round2Details: buildRound2Details()
          }
        : {
            status: 'Applied',
            round2Selected: false,
            round2Details: null
          };

      await api.updateApplication(item.applicationId, updates);
      await loadApplicants();
      onUpdated?.();
    } catch (err) {
      alert('Failed to update shortlist status: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkShortlist = async (shouldShortlist) => {
    if (!selectedAppIds.length) return;
    setActionLoading(true);
    try {
      const updates = shouldShortlist
        ? {
            status: 'Shortlisted for Round 2',
            round2Selected: true,
            round2Details: buildRound2Details()
          }
        : {
            status: 'Applied',
            round2Selected: false,
            round2Details: null
          };

      await api.bulkUpdateApplications(selectedAppIds, updates);
      setSelectedAppIds([]);
      await loadApplicants();
      onUpdated?.();
    } catch (err) {
      alert('Failed to update shortlist status: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const exportCSV = () => {
    if (!applicantsList.length) return;
    const headers = [
      'Roll No',
      'Name',
      'Branch',
      'CGPA',
      'Email',
      'Preferred Location',
      'Round 2 Shortlisted',
      'Candidate Req Response',
      'Resume File',
      'Applied Date'
    ];
    const rows = applicantsList.map(item => [
      item.student?.rollNo || '',
      item.student?.name || '',
      item.student?.branchCode || '',
      item.student?.cgpa || '',
      item.student?.email || '',
      item.preferredLocation || '',
      item.round2Selected ? 'YES' : 'NO',
      item.customRequirementAnswer || '',
      item.resumeFileName || '',
      item.appliedAt ? new Date(item.appliedAt).toLocaleDateString() : ''
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${opportunity.company}_Applicants_${opportunity.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white border border-slate-400 w-full max-w-5xl my-8 overflow-hidden shadow-xl text-xs text-slate-800">
        
        {/* Recruiter Header - Sharp */}
        <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold tracking-tight">Applicant Roster & Round 2 Shortlisting</h2>
              <span className="text-[10px] px-1.5 py-0.2 border border-slate-700 bg-slate-800 text-slate-300 font-mono">
                {applicantsList.length} Total Applicants
              </span>
              <span className="text-[10px] px-1.5 py-0.2 border border-indigo-700 bg-indigo-900 text-white font-mono font-bold">
                {shortlistedCount} Selected for Round 2
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {opportunity.company} • {opportunity.role} (CTC: ₹{opportunity.ctc} LPA) • OT Date: {opportunity.testDate}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white font-mono cursor-pointer px-1 text-sm"
          >
            [Close]
          </button>
        </div>

        {/* Round 2 Schedule Setup Bar */}
        <div className="bg-slate-100 border-b border-slate-300 p-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 uppercase text-[11px] tracking-wide">
                Round 2 Schedule Configuration:
              </span>
              {isOTCompleted ? (
                <>
                  <span className="text-slate-600 font-mono text-[11px]">
                    {round2Date} • {round2Time} • {round2Venue}
                  </span>
                  <span className="px-1.5 py-0.2 bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-bold">
                    OT Completed ✓
                  </span>
                </>
              ) : (
                <span className="px-1.5 py-0.2 bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-bold">
                  OT Scheduled: {opportunity?.testDate || 'TBD'} — Round 2 selection locked until OT is done
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className="text-slate-700 font-semibold underline hover:text-black cursor-pointer text-[11px]"
            >
              {showConfig ? 'Hide Settings ▲' : 'Edit Schedule Settings ▼'}
            </button>
          </div>

          {showConfig && (
            <div className="mt-3 pt-3 border-t border-slate-300 grid grid-cols-1 sm:grid-cols-4 gap-2.5 bg-white p-3 border border-slate-300">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                  Round 2 Name
                </label>
                <input
                  type="text"
                  value={round2Round}
                  onChange={(e) => setRound2Round(e.target.value)}
                  placeholder="e.g. Technical Interview"
                  className="w-full px-2 py-1 bg-slate-50 border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                  Round 2 Date
                </label>
                <input
                  type="date"
                  value={round2Date}
                  onChange={(e) => setRound2Date(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-50 border border-slate-300 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                  Time Slot
                </label>
                <input
                  type="text"
                  value={round2Time}
                  onChange={(e) => setRound2Time(e.target.value)}
                  placeholder="e.g. 11:00 AM - 12:30 PM"
                  className="w-full px-2 py-1 bg-slate-50 border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                  Venue / Interview Link
                </label>
                <input
                  type="text"
                  value={round2Venue}
                  onChange={(e) => setRound2Venue(e.target.value)}
                  placeholder="e.g. CCPD Cubicle 1"
                  className="w-full px-2 py-1 bg-slate-50 border border-slate-300 text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Toolbar & Filter Tabs */}
        <div className="p-3 border-b border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Filter Tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 font-semibold transition cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Applicants ({applicantsList.length})
            </button>
            <button
              onClick={() => setFilterMode('shortlisted')}
              className={`px-3 py-1 font-semibold transition cursor-pointer ${
                filterMode === 'shortlisted'
                  ? 'bg-indigo-900 text-white'
                  : 'bg-indigo-50 text-indigo-900 border border-indigo-300 hover:bg-indigo-100'
              }`}
            >
              Round 2 Shortlisted ({shortlistedCount})
            </button>
            <button
              onClick={() => setFilterMode('pending')}
              className={`px-3 py-1 font-semibold transition cursor-pointer ${
                filterMode === 'pending'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              OT Pending ({pendingCount})
            </button>
          </div>

          {/* Search & Export */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate or roll..."
              className="w-full sm:w-56 px-2.5 py-1 bg-slate-50 border border-slate-300 focus:outline-none focus:border-slate-800 text-xs"
            />

            <button
              onClick={exportCSV}
              disabled={!applicantsList.length}
              className="px-3 py-1 border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold cursor-pointer disabled:opacity-50 shrink-0"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Bulk Action Bar (when candidates are checked) */}
        {selectedAppIds.length > 0 && (
          <div className="p-2.5 bg-indigo-50 border-b border-indigo-200 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-indigo-950 font-mono">
                {selectedAppIds.length} candidate{selectedAppIds.length > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isOTCompleted ? (
                <>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleBulkShortlist(true)}
                    className="px-3 py-1 bg-indigo-900 hover:bg-black text-white font-bold cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading ? 'Updating...' : `Shortlist Selected for Round 2 (${selectedAppIds.length})`}
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleBulkShortlist(false)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-semibold cursor-pointer disabled:opacity-50"
                  >
                    Remove Shortlist
                  </button>
                </>
              ) : (
                <span className="px-3 py-1 text-amber-800 bg-amber-50 border border-amber-300 font-semibold">
                  Round 2 selection available after OT on {opportunity?.testDate || 'TBD'}
                </span>
              )}
              <button
                type="button"
                onClick={() => setSelectedAppIds([])}
                className="text-slate-600 hover:underline cursor-pointer px-1"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Content Table - Sharp */}
        <div className="p-4 overflow-x-auto max-h-[50vh]">
          {loading ? (
            <div className="text-center py-8 text-slate-500 font-mono">
              Loading applicant data...
            </div>
          ) : filteredApplicants.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 border border-slate-200 p-4 text-slate-600">
              No applicant records match the current filter.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-300 bg-slate-100 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  <th className="py-2 px-2.5 w-8 text-center">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleSelectAll}
                      className="cursor-pointer"
                      title="Select all"
                    />
                  </th>
                  <th className="py-2 px-3">Candidate</th>
                  <th className="py-2 px-3">Roll Number</th>
                  <th className="py-2 px-3">Branch</th>
                  <th className="py-2 px-3">CGPA</th>
                  <th className="py-2 px-3">Location</th>
                  <th className="py-2 px-3">Resume</th>
                  <th className="py-2 px-3">Round 2 Status</th>
                  <th className="py-2 px-3 text-right">Shortlist Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredApplicants.map((item) => {
                  const s = item.student;
                  if (!s) return null;
                  const isShortlisted = item.round2Selected;
                  const isChecked = selectedAppIds.includes(item.applicationId);

                  return (
                    <tr
                      key={item.applicationId}
                      className={`transition-colors ${
                        isShortlisted
                          ? 'bg-indigo-50/40 hover:bg-indigo-50/70'
                          : isChecked
                          ? 'bg-slate-100'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-2.5 px-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOne(item.applicationId)}
                          className="cursor-pointer"
                        />
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-900 block">{s.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono block">{s.email}</span>
                        {item.customRequirementAnswer && (
                          <div className="mt-1 text-[10px] bg-white border border-slate-300 px-1.5 py-0.5 text-slate-700">
                            <span className="font-semibold text-slate-500">Req Response: </span>
                            <span className="font-mono text-slate-900">{item.customRequirementAnswer}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-3 font-mono font-medium text-slate-800">
                        {s.rollNo}
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="font-mono text-[11px] text-slate-700 font-medium">
                          {s.branchCode}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {Number(s.cgpa).toFixed(2)}
                      </td>

                      <td className="py-2.5 px-3 text-slate-700">
                        {item.preferredLocation || 'Any'}
                      </td>

                      <td className="py-2.5 px-3">
                        <a
                          href={item.resumeUrl || '#'}
                          onClick={(e) => {
                            if (!item.resumeUrl || item.resumeUrl === '#') {
                              e.preventDefault();
                              alert(`Candidate: ${s.name} (${s.rollNo})\nBranch: ${s.branchCode} | CGPA: ${s.cgpa}\nResume: ${item.resumeFileName}`);
                            }
                          }}
                          className="text-slate-900 hover:underline font-mono text-[11px]"
                        >
                          {item.resumeFileName || 'Resume.pdf'}
                        </a>
                      </td>

                      {/* Status Column */}
                      <td className="py-2.5 px-3">
                        {isShortlisted ? (
                          <div>
                            <span className="px-2 py-0.5 border border-indigo-400 bg-indigo-100 text-indigo-950 font-bold text-[10px] inline-block font-mono">
                              ★ Round 2 Shortlisted
                            </span>
                            <span className="text-[10px] text-indigo-800 block mt-0.5 font-mono">
                              {item.round2Details?.date || round2Date}
                            </span>
                          </div>
                        ) : isOTCompleted ? (
                          <span className="px-2 py-0.5 border border-emerald-300 bg-emerald-50 font-semibold text-[10px] text-emerald-800 inline-block">
                            Round 1 OT Completed ✓
                          </span>
                        ) : (
                          <div>
                            <span className="px-2 py-0.5 border border-amber-300 bg-amber-50 font-semibold text-[10px] text-amber-800 inline-block">
                              OT Scheduled
                            </span>
                            <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
                              OT Date: {opportunity?.testDate || 'TBD'}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Actions Column */}
                      <td className="py-2.5 px-3 text-right">
                        {isShortlisted ? (
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleToggleSingleRound2(item, false)}
                            className="px-2 py-1 text-[11px] font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 cursor-pointer disabled:opacity-50"
                          >
                            Remove
                          </button>
                        ) : isOTCompleted ? (
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleToggleSingleRound2(item, true)}
                            className="px-2.5 py-1 text-[11px] font-bold text-white bg-indigo-900 hover:bg-black border border-indigo-900 cursor-pointer disabled:opacity-50"
                          >
                            + Select for Round 2
                          </button>
                        ) : (
                          <span
                            className="px-2.5 py-1 text-[11px] font-medium text-slate-400 bg-slate-100 border border-slate-200 inline-block cursor-not-allowed"
                            title={`OT is scheduled for ${opportunity?.testDate || 'TBD'}. Round 2 selection will be available after the OT is completed.`}
                          >
                            OT Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-300 flex items-center justify-between text-xs">
          <span className="text-slate-600">
            Selected candidates automatically receive their Round 2 schedule under <strong>Upcoming Tests</strong>.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 font-semibold text-slate-800 hover:bg-slate-200 border border-slate-300 cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
