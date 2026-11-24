import React, { useState } from 'react';
import { INITIAL_STUDENTS, INITIAL_COORDINATOR } from '../mockData';

export default function LoginView({ onLogin, error, loading }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [localError, setLocalError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError('');
    if (!email.trim()) {
      setLocalError('Please enter your college email address');
      return;
    }
    if (!password) {
      setLocalError('Please enter your password');
      return;
    }
    onLogin(email.trim(), password, role);
  };

  const handleQuickLogin = (demoEmail, demoPassword, demoRole) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setRole(demoRole);
    setLocalError('');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          NATIONAL INSTITUTE OF TECHNOLOGY WARANGAL
        </h1>
        <p className="mt-1 text-xs text-slate-600 uppercase tracking-wider">
          Center for Career Planning and Development (CCPD)
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-3xl">
        <div className="bg-white border border-slate-300 shadow-sm grid md:grid-cols-12">
          
          {/* Main Login Form Column */}
          <div className="p-6 md:p-8 md:col-span-7 flex flex-col justify-between">
            <div>
              <div className="mb-5 border-b border-slate-200 pb-3">
                <h2 className="text-base font-bold text-slate-900">Sign In to Placement Portal</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter your registered NITW college email
                </p>
              </div>

              {/* Role Selector Tabs - Sharp */}
              <div className="flex border border-slate-300 mb-5 text-xs bg-slate-50">
                <button
                  type="button"
                  onClick={() => {
                    setRole('student');
                    if (email.includes('coordinator')) setEmail('');
                  }}
                  className={`flex-1 py-2 font-semibold transition cursor-pointer ${
                    role === 'student'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Student Portal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRole('coordinator');
                    if (!email) setEmail('coordinator@nitw.ac.in');
                  }}
                  className={`flex-1 py-2 font-semibold transition cursor-pointer ${
                    role === 'coordinator'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Placement Coordinator
                </button>
              </div>

              {(error || localError) && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs">
                  {error || localError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-800 uppercase text-[11px] tracking-wider mb-1">
                    College Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      role === 'student'
                        ? 'kh24csb0a32@student.nitw.ac.in'
                        : 'coordinator@nitw.ac.in'
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:outline-none focus:border-slate-800 text-xs text-slate-900"
                    required
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    {role === 'student'
                      ? 'Academic branch and CGPA are verified from the college database.'
                      : 'Authorized placement coordinator credentials.'}
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 uppercase text-[11px] tracking-wider mb-1" htmlFor="login-password">
                    Password
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:outline-none focus:border-slate-800 text-xs text-slate-900"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-black transition cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Authenticating...' : `Sign In as ${role === 'student' ? 'Student' : 'Coordinator'}`}
                </button>
              </form>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-200 text-[11px] text-slate-500 text-center">
              NIT Warangal • Placement Automation System
            </div>
          </div>

          {/* Sample Database Accounts Column - Sharp */}
          <div className="bg-slate-50 p-6 md:col-span-5 border-t md:border-t-0 md:border-l border-slate-300 flex flex-col justify-between text-xs">
            <div>
              <span className="font-bold uppercase tracking-wider text-slate-700 text-[11px] block mb-1">
                Sample Database Records
              </span>
              <p className="text-[11px] text-slate-500 mb-3">
                Click a student profile to test branch-based feed visibility:
              </p>

              {/* 5 Students List - Sharp & No Icons */}
              <div className="space-y-1.5 mb-4">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Students (Pre-Loaded)
                </span>
                {INITIAL_STUDENTS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleQuickLogin(s.email, s.password, 'student')}
                    className="w-full text-left p-2 bg-white hover:bg-slate-100 border border-slate-200 transition text-xs cursor-pointer block"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">
                        {s.name}
                      </span>
                      <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1 border border-slate-200">
                        {s.branchCode}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-0.5 font-mono">
                      <span>Roll: {s.rollNo}</span>
                      <span>CGPA: <strong className="text-slate-800">{s.cgpa}</strong></span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Coordinator Button */}
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Coordinator
                </span>
                <button
                  type="button"
                  onClick={() => handleQuickLogin(INITIAL_COORDINATOR.email, INITIAL_COORDINATOR.password, 'coordinator')}
                  className="w-full text-left p-2 bg-white hover:bg-slate-100 border border-slate-300 text-xs transition cursor-pointer"
                >
                  <span className="font-semibold text-slate-900 block">
                    {INITIAL_COORDINATOR.name}
                  </span>
                  <span className="text-[11px] text-slate-500 block font-mono">
                    {INITIAL_COORDINATOR.email}
                  </span>
                </button>
              </div>

            </div>

            <div className="mt-4 pt-2 border-t border-slate-200 text-[10px] text-slate-500 text-center">
              NITW Academic ERP
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
