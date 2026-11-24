import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LoginView from './components/LoginView';
import StudentView from './components/StudentView';
import CoordinatorView from './components/CoordinatorView';
import ApplyModal from './components/ApplyModal';
import { api, initStorage } from './api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState(null); // 'student' | 'coordinator' | null
  const [students, setStudents] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [toast, setToast] = useState(null);
  const [applyingOpportunity, setApplyingOpportunity] = useState(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    initStorage();
    checkSession();
  }, []);

  const checkSession = async () => {
    setLoading(true);
    try {
      const session = api.getCurrentSession();
      if (session && session.user && session.role) {
        setCurrentUser(session.user);
        setRole(session.role);
        await loadData(session.user, session.role);
      } else {
        const stds = await api.getStudents();
        setStudents(stds);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async (user = currentUser, currentRole = role) => {
    setLoading(true);
    try {
      const [stds, opps] = await Promise.all([
        api.getStudents(),
        api.getOpportunities(currentRole === 'student' ? user?.id : null)
      ]);
      setStudents(stds);
      setOpportunities(opps);
    } catch (err) {
      console.error(err);
      showToast('Error syncing placement records with server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email, password, selectedRole) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const session = await api.login(email, password, selectedRole);
      setCurrentUser(session.user);
      setRole(session.role);
      showToast(
        session.role === 'student'
          ? `Authenticated as ${session.user.name} (${session.user.branchCode})`
          : `Authenticated as Placement Coordinator`
      );
      await loadData(session.user, session.role);
    } catch (err) {
      setAuthError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setRole(null);
    showToast('Signed out of placement portal', 'info');
  };

  const handleSwitchUser = async (targetUser, targetRole) => {
    try {
      const session = await api.login(targetUser.email, targetUser.password, targetRole);
      setCurrentUser(session.user);
      setRole(session.role);
      showToast(
        targetRole === 'student'
          ? `Switched profile to ${targetUser.name} (${targetUser.branchCode})`
          : `Switched to Placement Coordinator view`
      );
      await loadData(session.user, session.role);
    } catch (err) {
      showToast(err.message || 'Failed to switch profile', 'error');
    }
  };

  // Called when student clicks "Apply Now" on card -> opens modal
  const handleOpenApplyModal = (opportunity) => {
    setApplyingOpportunity(opportunity);
  };

  // Called when student confirms application inside modal
  const handleConfirmApply = async (applicationDetails) => {
    if (!currentUser || role !== 'student') return;
    try {
      const res = await api.applyToOpportunity(
        currentUser.id,
        applicationDetails.opportunityId,
        applicationDetails
      );
      showToast(res.message || 'Application submitted successfully');
      setApplyingOpportunity(null);
      await loadData(currentUser, role);
    } catch (err) {
      showToast(err.message || 'Failed to submit application', 'error');
      throw err;
    }
  };

  const handleCreateOpportunity = async (oppData) => {
    try {
      await api.createOpportunity(oppData);
      showToast(`Recruitment drive for ${oppData.company} published`);
      await loadData(currentUser, role);
    } catch (err) {
      showToast(err.message || 'Failed to publish opportunity', 'error');
      throw err;
    }
  };

  const handleDeleteOpportunity = async (oppId) => {
    if (!window.confirm('Confirm removal of this recruitment drive?')) return;
    try {
      await api.deleteOpportunity(oppId);
      showToast('Recruitment drive removed');
      await loadData(currentUser, role);
    } catch (err) {
      showToast('Failed to delete opportunity', 'error');
    }
  };

  const handleResetData = async () => {
    if (window.confirm('Reset database to initial 5 students and sample drives?')) {
      api.resetDatabase();
      showToast('Database reset to initial demo state');
      await loadData(currentUser, role);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Toast Notification - Sharp & Monotone */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div
            className={`px-4 py-2.5 text-xs font-semibold border ${
              toast.type === 'error'
                ? 'bg-red-900 text-white border-red-800'
                : 'bg-slate-900 text-white border-slate-800'
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}

      {/* Main Flow */}
      {!currentUser || !role ? (
        <LoginView
          onLogin={handleLogin}
          error={authError}
          loading={authLoading}
        />
      ) : (
        <>
          <Navbar
            currentUser={currentUser}
            role={role}
            onLogout={handleLogout}
            onResetData={handleResetData}
          />

          <main className="flex-1 pb-16">
            {role === 'student' ? (
              <StudentView
                student={currentUser}
                opportunities={opportunities}
                loading={loading}
                onApply={handleOpenApplyModal}
              />
            ) : (
              <CoordinatorView
                coordinator={currentUser}
                opportunities={opportunities}
                students={students}
                loading={loading}
                onCreateOpportunity={handleCreateOpportunity}
                onDeleteOpportunity={handleDeleteOpportunity}
                onRefresh={() => loadData(currentUser, role)}
              />
            )}
          </main>

          {/* Institutional Footer */}
          <footer className="bg-white border-t border-slate-200 py-5 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p>
                © 2026 Center for Career Planning and Development (CCPD), National Institute of Technology Warangal.
              </p>
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span>Placement Cell Automation Portal</span>
              </div>
            </div>
          </footer>
        </>
      )}

      {/* Application Details Modal */}
      {applyingOpportunity && (
        <ApplyModal
          isOpen={!!applyingOpportunity}
          onClose={() => setApplyingOpportunity(null)}
          opportunity={applyingOpportunity}
          student={currentUser}
          onSubmit={handleConfirmApply}
        />
      )}

    </div>
  );
}
