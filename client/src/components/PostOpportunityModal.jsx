import React, { useState } from 'react';
import { NITW_BRANCHES, NITW_EXAM_CENTRES } from '../mockData';

export default function PostOpportunityModal({ isOpen, onClose, onSubmit }) {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [ctc, setCtc] = useState('');
  const [minCgpa, setMinCgpa] = useState('7.0');
  const [allowedBranches, setAllowedBranches] = useState(['CSE', 'ECE']);
  const [location, setLocation] = useState('Bangalore / Hyderabad');
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [category, setCategory] = useState('Tier 1 (Tech)');
  const [description, setDescription] = useState('');
  const [selectionProcess, setSelectionProcess] = useState(
    'Online Assessment -> Technical Interview -> HR Round'
  );
  // Online Test Schedule fields
  const [testDate, setTestDate] = useState(
    new Date(Date.now() + 18 * 86400000).toISOString().split('T')[0]
  );
  const [testTime, setTestTime] = useState('10:00 AM - 12:00 PM');
  const [testPlatform, setTestPlatform] = useState('HackerRank');
  const [testRound, setTestRound] = useState('Online Technical Assessment');
  const [examCentre, setExamCentre] = useState('CCPD Lab');
  // Other Requirements not already mentioned
  const [otherRequirements, setOtherRequirements] = useState('');
  const [customRequirementPrompt, setCustomRequirementPrompt] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const toggleBranch = (code) => {
    if (allowedBranches.includes(code)) {
      setAllowedBranches(allowedBranches.filter((b) => b !== code));
    } else {
      setAllowedBranches([...allowedBranches, code]);
    }
  };

  const selectAllBranches = () => {
    setAllowedBranches(NITW_BRANCHES.map((b) => b.code));
  };

  const clearAllBranches = () => {
    setAllowedBranches([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!company.trim()) {
      setError('Please provide company name');
      return;
    }
    if (!role.trim()) {
      setError('Please provide job role');
      return;
    }
    if (!minCgpa || Number(minCgpa) <= 0 || Number(minCgpa) > 10) {
      setError('Please enter a valid Minimum CGPA between 0 and 10.0');
      return;
    }
    if (!allowedBranches.length) {
      setError('Please select at least one allowed branch');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        company: company.trim(),
        role: role.trim(),
        ctc: Number(ctc) || 0,
        minCgpa: Number(minCgpa),
        allowedBranches,
        location: location.trim(),
        deadline,
        category,
        description: description.trim() || `Placement drive at ${company.trim()} for ${role.trim()}.`,
        selectionProcess: selectionProcess.trim(),
        testDate,
        testTime,
        testPlatform,
        testRound,
        testDuration: '120 Mins',
        examCentre,
        otherRequirements: otherRequirements.trim(),
        customRequirementPrompt: customRequirementPrompt.trim()
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to post opportunity');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white border border-slate-400 w-full max-w-2xl my-8 overflow-hidden shadow-xl text-xs text-slate-800">
        
        {/* Header - Sharp */}
        <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold tracking-tight">Post Placement Opportunity</h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Center for Career Planning & Development • NIT Warangal
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white font-mono cursor-pointer px-1"
          >
            [Close]
          </button>
        </div>

        {/* Form - Sharp */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-800">
              {error}
            </div>
          )}

          {/* Company & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold uppercase text-[11px] tracking-wider mb-1">
                Company Name *
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Amazon, Oracle, Intel"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 focus:outline-none focus:border-slate-800"
                required
              />
            </div>

            <div>
              <label className="block font-semibold uppercase text-[11px] tracking-wider mb-1">
                Role / Designation *
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Software Engineer"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 focus:outline-none focus:border-slate-800"
                required
              />
            </div>
          </div>

          {/* CTC & Min CGPA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold uppercase text-[11px] tracking-wider mb-1">
                CTC Package (₹ LPA) *
              </label>
              <input
                type="number"
                step="0.1"
                value={ctc}
                onChange={(e) => setCtc(e.target.value)}
                placeholder="e.g. 24.0"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 focus:outline-none focus:border-slate-800"
                required
              />
            </div>

            <div>
              <label className="block font-semibold uppercase text-[11px] tracking-wider mb-1">
                Minimum CGPA Required (Cutoff) *
              </label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="10"
                value={minCgpa}
                onChange={(e) => setMinCgpa(e.target.value)}
                placeholder="e.g. 7.50"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 focus:outline-none focus:border-slate-800 font-mono"
                required
              />
            </div>
          </div>

          {/* Allowed Branches Multi-Select - Sharp */}
          <div className="p-3 bg-slate-50 border border-slate-300">
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold uppercase text-[11px] tracking-wider">
                Allowed Branches ({allowedBranches.length} selected)
              </label>
              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={selectAllBranches}
                  className="font-semibold text-slate-800 underline cursor-pointer"
                >
                  Select All
                </button>
                <span>|</span>
                <button
                  type="button"
                  onClick={clearAllBranches}
                  className="text-slate-600 underline cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 mb-2">
              This drive will only be displayed to students enrolled in these selected departments:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {NITW_BRANCHES.map((b) => {
                const isSelected = allowedBranches.includes(b.code);
                return (
                  <button
                    key={b.code}
                    type="button"
                    onClick={() => toggleBranch(b.code)}
                    className={`p-2 text-left border transition text-xs cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span className="font-mono block">{b.code}</span>
                    <span className="text-[10px] block truncate text-slate-400">{b.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Other / Additional Requirements Section */}
          <div className="p-3 bg-slate-50 border border-slate-300 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold uppercase text-[11px] tracking-wider text-slate-800 block">
                Additional / Other Requirements (Not Mentioned Above)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Optional</span>
            </div>

            <div>
              <label className="block text-[10px] uppercase text-slate-600 font-bold mb-1">
                Other Eligibility Criteria & Conditions
              </label>
              <textarea
                rows={2}
                value={otherRequirements}
                onChange={(e) => setOtherRequirements(e.target.value)}
                placeholder="e.g. No active backlogs, minimum 75% in 10th & 12th, willingness to sign 1-year service bond, rotational shifts..."
                className="w-full px-3 py-1.5 bg-white border border-slate-300 focus:outline-none focus:border-slate-800 text-xs"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">
                Specify any academic, backlog, bond, or skill requirements not covered by CGPA and branch.
              </p>
            </div>

            <div>
              <label className="block text-[10px] uppercase text-slate-600 font-bold mb-1">
                Ask Candidates to Confirm or Answer a Custom Requirement
              </label>
              <input
                type="text"
                value={customRequirementPrompt}
                onChange={(e) => setCustomRequirementPrompt(e.target.value)}
                placeholder="e.g. Do you have any active backlogs? / Specify 10th & 12th aggregate %"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 focus:outline-none focus:border-slate-800 text-xs"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">
                If provided, applicants will be required to answer this requirement when submitting their application.
              </p>
            </div>
          </div>

          {/* Location & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold uppercase text-[11px] tracking-wider mb-1">
                Job Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Bangalore / Hyderabad"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 focus:outline-none focus:border-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase text-[11px] tracking-wider mb-1">
                Application Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 focus:outline-none focus:border-slate-800"
              />
            </div>
          </div>

          {/* Online Test Schedule Section */}
          <div className="p-3 bg-slate-50 border border-slate-300 space-y-3">
            <span className="font-semibold uppercase text-[11px] tracking-wider text-slate-800 block">
              Online Assessment Schedule (For Upcoming Tests)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">
                  Test Date *
                </label>
                <input
                  type="date"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 focus:outline-none focus:border-slate-800 text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">
                  Time Slot *
                </label>
                <input
                  type="text"
                  value={testTime}
                  onChange={(e) => setTestTime(e.target.value)}
                  placeholder="e.g. 10:00 AM - 12:00 PM"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 focus:outline-none focus:border-slate-800 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">
                  Test Platform *
                </label>
                <input
                  type="text"
                  value={testPlatform}
                  onChange={(e) => setTestPlatform(e.target.value)}
                  placeholder="e.g. HackerRank, Mettl"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 focus:outline-none focus:border-slate-800 text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">
                  Assessment Round Name
                </label>
                <input
                  type="text"
                  value={testRound}
                  onChange={(e) => setTestRound(e.target.value)}
                  placeholder="e.g. Online Coding Assessment"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 focus:outline-none focus:border-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">
                  On-Campus Exam Centre / Lab *
                </label>
                <select
                  value={examCentre}
                  onChange={(e) => setExamCentre(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 focus:outline-none focus:border-slate-800 text-xs font-semibold cursor-pointer"
                >
                  {NITW_EXAM_CENTRES.map((centre) => (
                    <option key={centre} value={centre}>
                      {centre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block font-semibold uppercase text-[11px] tracking-wider mb-1">
              Tier / Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 focus:outline-none focus:border-slate-800 cursor-pointer"
            >
              <option value="Tier 1 (&gt;20 LPA)">Tier 1 (&gt;20 LPA)</option>
              <option value="Tier 2 (10 - 20 LPA)">Tier 2 (10 - 20 LPA)</option>
              <option value="Core Engineering">Core Engineering</option>
              <option value="Quantitative Strategy">Quantitative Strategy</option>
              <option value="General Recruitment">General Recruitment</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold uppercase text-[11px] tracking-wider mb-1">
              Job Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Responsibilities, required technical skills..."
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 focus:outline-none focus:border-slate-800"
            />
          </div>

          {/* Selection Process */}
          <div>
            <label className="block font-semibold uppercase text-[11px] tracking-wider mb-1">
              Selection Rounds
            </label>
            <input
              type="text"
              value={selectionProcess}
              onChange={(e) => setSelectionProcess(e.target.value)}
              placeholder="e.g. Assessment -> Technical Interview -> HR Round"
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 focus:outline-none focus:border-slate-800"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-100 border border-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 font-semibold text-white bg-slate-900 hover:bg-black disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Publishing...' : 'Publish Opportunity'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
