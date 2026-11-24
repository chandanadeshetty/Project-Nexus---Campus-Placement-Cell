import React, { useState } from 'react';

export default function ApplyModal({ isOpen, onClose, opportunity, student, onSubmit }) {
  const [preferredLocation, setPreferredLocation] = useState('');
  const [resumeFileName, setResumeFileName] = useState(`${student?.rollNo || 'Candidate'}_Resume.pdf`);
  const [resumeSize, setResumeSize] = useState('380 KB');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [customRequirementAnswer, setCustomRequirementAnswer] = useState('');
  const [agreement, setAgreement] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !opportunity || !student) return null;

  const availableLocations = opportunity.location
    ? opportunity.location.split('/').map(l => l.trim())
    : ['Bangalore', 'Hyderabad'];

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setError('Please select a valid PDF file for your resume');
        return;
      }
      setError('');
      setResumeFileName(file.name);
      setResumeSize(`${(file.size / 1024).toFixed(0)} KB`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (opportunity.customRequirementPrompt && !customRequirementAnswer.trim()) {
      setError(`Please provide a response for: "${opportunity.customRequirementPrompt}"`);
      return;
    }

    if (!agreement) {
      setError('Please acknowledge the declaration before submitting');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        opportunityId: opportunity.id,
        preferredLocation: preferredLocation || availableLocations[0] || 'Any Location',
        resumeFileName,
        resumeUrl: '#',
        linkedinUrl: linkedinUrl.trim(),
        customRequirementAnswer: customRequirementAnswer.trim()
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white border border-slate-400 w-full max-w-xl my-8 overflow-hidden shadow-lg">
        
        {/* Header - Sharp & Clean */}
        <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold tracking-tight">Application Submission</h2>
            <p className="text-xs text-slate-300 mt-0.5">
              {opportunity.company} — {opportunity.role}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white text-sm font-mono cursor-pointer px-1"
          >
            [Close]
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-slate-800">
          
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-800">
              {error}
            </div>
          )}

          {/* Candidate Profile Summary Box - Plain & Sharp */}
          <div className="bg-slate-50 border border-slate-300 p-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2 border-b border-slate-200 pb-1">
              Candidate Academic Record
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block">Name:</span>
                <span className="font-semibold text-slate-900">{student.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Roll Number:</span>
                <span className="font-mono font-semibold text-slate-900">{student.rollNo}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Branch:</span>
                <span className="font-semibold text-slate-900">{student.branchCode} ({student.branch})</span>
              </div>
              <div>
                <span className="text-slate-500 block">Cumulative GPA:</span>
                <span className="font-mono font-semibold text-slate-900">{Number(student.cgpa).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Other Requirements Notice */}
          {opportunity.otherRequirements && (
            <div className="bg-slate-50 border border-slate-300 p-3">
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Additional Company Requirements
              </span>
              <p className="text-xs text-slate-800 leading-relaxed">
                {opportunity.otherRequirements}
              </p>
            </div>
          )}

          {/* Preferred Location */}
          <div>
            <label className="block font-semibold text-slate-800 uppercase text-[11px] tracking-wider mb-1">
              Preferred Work Location
            </label>
            <select
              value={preferredLocation}
              onChange={(e) => setPreferredLocation(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 focus:outline-none focus:border-slate-800 cursor-pointer"
            >
              <option value="">Select location preference</option>
              {availableLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
              <option value="Any Location">Any Location / Open to Relocation</option>
            </select>
          </div>

          {/* Resume Upload (PDF) */}
          <div>
            <label className="block font-semibold text-slate-800 uppercase text-[11px] tracking-wider mb-1">
              Resume Attachment (PDF)
            </label>
            <div className="border border-slate-300 p-3 bg-slate-50 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900 text-xs font-mono">{resumeFileName}</p>
                <p className="text-[11px] text-slate-500">PDF Document • {resumeSize}</p>
              </div>
              <label className="px-3 py-1 border border-slate-400 bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs cursor-pointer">
                <span>Browse PDF</span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* LinkedIn / Portfolio URL */}
          <div>
            <label className="block font-semibold text-slate-800 uppercase text-[11px] tracking-wider mb-1">
              LinkedIn / Portfolio URL (Optional)
            </label>
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/username"
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 focus:outline-none focus:border-slate-800"
            />
          </div>

          {/* Custom Candidate Requirement Response */}
          {opportunity.customRequirementPrompt && (
            <div>
              <label className="block font-semibold text-slate-800 uppercase text-[11px] tracking-wider mb-1">
                {opportunity.customRequirementPrompt} *
              </label>
              <textarea
                rows={2}
                value={customRequirementAnswer}
                onChange={(e) => setCustomRequirementAnswer(e.target.value)}
                placeholder="Provide details / confirmation for this requirement..."
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 focus:outline-none focus:border-slate-800"
                required
              />
            </div>
          )}

          {/* Declaration Checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreement}
                onChange={(e) => setAgreement(e.target.checked)}
                className="mt-0.5 border-slate-400 text-slate-900 cursor-pointer"
              />
              <span className="text-[11px] text-slate-600 leading-relaxed">
                I declare that the academic credentials, CGPA, and resume attached are accurate and comply with NITW placement regulations.
              </span>
            </label>
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
              disabled={submitting || !agreement}
              className="px-4 py-1.5 font-semibold text-white bg-slate-900 hover:bg-black disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Submitting...' : 'Confirm Application'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
