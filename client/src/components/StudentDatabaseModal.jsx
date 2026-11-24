import React from 'react';

export default function StudentDatabaseModal({ isOpen, onClose, students = [] }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white border border-slate-400 w-full max-w-4xl my-8 overflow-hidden shadow-xl text-xs text-slate-800">
        
        {/* Header - Sharp */}
        <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight">Academic Student Database</h2>
              <span className="text-[10px] px-1.5 py-0.2 border border-slate-700 bg-slate-800 text-slate-300 font-mono">
                {students.length} Records
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Verified Academic ERP Records • National Institute of Technology Warangal
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white font-mono cursor-pointer px-1"
          >
            [Close]
          </button>
        </div>

        {/* Content Table - Sharp */}
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                <th className="py-2 px-3">Student Name</th>
                <th className="py-2 px-3">Roll Number</th>
                <th className="py-2 px-3">Department</th>
                <th className="py-2 px-3">CGPA</th>
                <th className="py-2 px-3">College Email</th>
                <th className="py-2 px-3 text-right">Academic Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    {s.name}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-medium text-slate-800">
                    {s.rollNo}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-700">
                    {s.branchCode}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                    {Number(s.cgpa).toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                    {s.email}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="px-2 py-0.5 border border-slate-300 bg-slate-50 text-[10px] font-semibold text-slate-800">
                      Enrolled
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-300 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 font-semibold text-slate-800 hover:bg-slate-200 border border-slate-300 cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
