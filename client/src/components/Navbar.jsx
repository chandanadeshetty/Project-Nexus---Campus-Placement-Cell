import React from 'react';

export default function Navbar({ currentUser, role, onLogout, onResetData }) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          
          {/* Logo & Institute Name */}
          <div className="flex items-center gap-3">
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-sm">
                NIT WARANGAL
              </span>
              <span className="text-[11px] text-slate-500 block leading-tight">
                Training & Placement Cell (CCPD)
              </span>
            </div>
          </div>

          {/* User Controls */}
          <div className="flex items-center gap-3 text-xs">

            {/* Current Active User Info */}
            {currentUser && (
              <div className="text-slate-800">
                <span className="font-semibold">{currentUser.name}</span>
                <span className="text-slate-500 ml-1.5 font-mono">
                  {role === 'student' ? `(${currentUser.branchCode} • ${currentUser.cgpa})` : '(Coordinator)'}
                </span>
              </div>
            )}

            {/* Reset Data Button */}
            <button
              onClick={onResetData}
              title="Reset database to initial records"
              className="px-2 py-1 text-slate-600 hover:text-black border border-slate-300 bg-white hover:bg-slate-100 cursor-pointer"
            >
              Reset
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="px-2.5 py-1 font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 cursor-pointer"
            >
              Logout
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
