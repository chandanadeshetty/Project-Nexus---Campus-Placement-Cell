import {
  INITIAL_STUDENTS,
  INITIAL_COORDINATOR,
  INITIAL_OPPORTUNITIES,
  INITIAL_APPLICATIONS
} from './mockData';

// Local storage keys for offline/fallback persistence
const LS_STUDENTS = 'nitw_students';
const LS_OPPORTUNITIES = 'nitw_opportunities';
const LS_APPLICATIONS = 'nitw_applications';
const LS_SESSION = 'nitw_session';

function getStored(key, fallback) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch (e) {
    return fallback;
  }
}

function setStored(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(e);
  }
}

// Initialize local storage if empty
export function initStorage() {
  if (!localStorage.getItem(LS_STUDENTS)) {
    setStored(LS_STUDENTS, INITIAL_STUDENTS);
  }
  if (!localStorage.getItem(LS_OPPORTUNITIES)) {
    setStored(LS_OPPORTUNITIES, INITIAL_OPPORTUNITIES);
  }
  if (!localStorage.getItem(LS_APPLICATIONS)) {
    setStored(LS_APPLICATIONS, INITIAL_APPLICATIONS);
  }
}

export function evaluateStudentEligibility(student, opportunity) {
  if (!student || !opportunity) {
    return {
      isEligible: false,
      branchEligible: false,
      cgpaEligible: false,
      reasons: ['Profile or company details unavailable']
    };
  }

  const branchEligible = opportunity.allowedBranches.includes(student.branchCode);
  const cgpaEligible = Number(student.cgpa) >= Number(opportunity.minCgpa);
  const isEligible = branchEligible && cgpaEligible;

  const reasons = [];
  if (!cgpaEligible) {
    reasons.push(
      `Minimum CGPA required is ${opportunity.minCgpa} (Candidate CGPA: ${student.cgpa})`
    );
  }
  if (!branchEligible) {
    reasons.push(
      `Branch restriction: Eligible branches are [${opportunity.allowedBranches.join(', ')}] (Candidate branch: ${student.branchCode})`
    );
  }
  if (isEligible) {
    reasons.push(`Branch criterion fulfilled (${student.branchCode})`);
    reasons.push(`CGPA criterion fulfilled (${student.cgpa} >= ${opportunity.minCgpa})`);
  }

  return {
    isEligible,
    branchEligible,
    cgpaEligible,
    reasons
  };
}

// Unified API calls with fallback
export const api = {
  // Login
  async login(email, password, role) {
    initStorage();
    const cleanEmail = (email || '').trim().toLowerCase();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password, role })
      });
      if (res.ok) {
        const data = await res.json();
        setStored(LS_SESSION, data);
        return data;
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Login failed');
      }
    } catch (e) {
      if (e.message && (e.message.includes('not found') || e.message.includes('password') || e.message.includes('credentials'))) throw e;

      // Fallback in-memory/localStorage
      if (role === 'coordinator') {
        if ((cleanEmail === 'coordinator@nitw.ac.in' || cleanEmail === 'admin@nitw.ac.in') && password === INITIAL_COORDINATOR.password) {
          const session = {
            success: true,
            role: 'coordinator',
            user: (({ password: _password, ...user }) => user)(INITIAL_COORDINATOR)
          };
          setStored(LS_SESSION, session);
          return session;
        } else {
          throw new Error('Invalid email or password');
        }
      }

      const students = getStored(LS_STUDENTS, INITIAL_STUDENTS);
      const student = students.find(s => s.email.toLowerCase() === cleanEmail);
      if (!student) {
        throw new Error(
          'Student not found with this college email. Please use a registered NITW email (e.g. kh24csb0a32@student.nitw.ac.in) or select one from demo students.'
        );
      }

      if (student.password !== password) {
        throw new Error('Invalid email or password');
      }

      const session = {
        success: true,
        role: 'student',
        user: (({ password: _password, ...user }) => user)(student)
      };
      setStored(LS_SESSION, session);
      return session;
    }
  },

  getCurrentSession() {
    return getStored(LS_SESSION, null);
  },

  logout() {
    localStorage.removeItem(LS_SESSION);
  },

  // Get Students
  async getStudents() {
    try {
      const res = await fetch('/api/students');
      if (res.ok) return await res.json();
    } catch (e) {}
    return getStored(LS_STUDENTS, INITIAL_STUDENTS);
  },

  // Get Opportunities (optionally enriched with student's eligibility & applied status)
  async getOpportunities(studentId) {
    try {
      const url = studentId ? `/api/opportunities?studentId=${studentId}` : '/api/opportunities';
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch (e) {}

    // Fallback
    const rawOpps = getStored(LS_OPPORTUNITIES, INITIAL_OPPORTUNITIES);
    const apps = getStored(LS_APPLICATIONS, INITIAL_APPLICATIONS);
    const students = getStored(LS_STUDENTS, INITIAL_STUDENTS);
    const student = studentId ? students.find(s => s.id === studentId || s.email === studentId) : null;

    // Filter by allowed branches for student
    const opps = student
      ? rawOpps.filter(opp => opp.allowedBranches && opp.allowedBranches.includes(student.branchCode))
      : rawOpps;

    return opps.map(opp => {
      const oppApps = apps.filter(a => a.opportunityId === opp.id);
      const applicantCount = oppApps.length;
      let studentStatus = null;

      if (student) {
        const studentApp = oppApps.find(a => a.studentId === student.id);
        const applied = !!studentApp;
        const eligibility = evaluateStudentEligibility(student, opp);
        studentStatus = {
          applied,
          applicationId: studentApp?.id,
          status: studentApp?.status || (applied ? 'Applied' : null),
          round2Selected: !!(studentApp?.round2Selected || studentApp?.status === 'Shortlisted for Round 2'),
          round2Details: studentApp?.round2Details || opp.round2Details || null,
          ...eligibility
        };
      }

      return {
        ...opp,
        applicantCount,
        studentStatus
      };
    });
  },

  // Coordinator creates opportunity
  async createOpportunity(data) {
    try {
      const res = await fetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const opps = getStored(LS_OPPORTUNITIES, INITIAL_OPPORTUNITIES);
    const newOpp = {
      id: `opp_${Date.now()}`,
      company: data.company.trim(),
      role: data.role.trim(),
      ctc: Number(data.ctc) || 0,
      minCgpa: Number(data.minCgpa),
      allowedBranches: Array.isArray(data.allowedBranches) ? data.allowedBranches : [data.allowedBranches],
      location: data.location || 'Pan India',
      deadline: data.deadline || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      category: data.category || 'General Recruitment',
      description: data.description || 'No description provided.',
      selectionProcess: data.selectionProcess || 'Online Assessment -> Technical Interview -> HR Round',
      postedAt: new Date().toISOString(),
      logo: data.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.company)}&background=1e3a8a&color=fff&bold=true`,
      testDate: data.testDate || new Date(Date.now() + 18 * 86400000).toISOString().split('T')[0],
      testTime: data.testTime || '10:00 AM - 12:00 PM',
      testRound: data.testRound || 'Online Technical Assessment',
      testPlatform: data.testPlatform || 'HackerRank',
      testDuration: data.testDuration || '120 Mins',
      examCentre: data.examCentre || 'CCPD Lab',
      otherRequirements: data.otherRequirements?.trim() || '',
      customRequirementPrompt: data.customRequirementPrompt?.trim() || ''
    };
    opps.unshift(newOpp);
    setStored(LS_OPPORTUNITIES, opps);
    return newOpp;
  },

  // Coordinator deletes opportunity
  async deleteOpportunity(id) {
    try {
      const res = await fetch(`/api/opportunities/${id}`, { method: 'DELETE' });
      if (res.ok) return await res.json();
    } catch (e) {}

    let opps = getStored(LS_OPPORTUNITIES, INITIAL_OPPORTUNITIES);
    opps = opps.filter(o => o.id !== id);
    setStored(LS_OPPORTUNITIES, opps);

    let apps = getStored(LS_APPLICATIONS, INITIAL_APPLICATIONS);
    apps = apps.filter(a => a.opportunityId !== id);
    setStored(LS_APPLICATIONS, apps);

    return { success: true };
  },

  // Student applies to opportunity with location & resume details
  async applyToOpportunity(studentId, opportunityId, applicationDetails = {}) {
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          opportunityId,
          ...applicationDetails
        })
      });
      if (res.ok) return await res.json();
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit application');
    } catch (e) {
      if (e.message && (e.message.includes('eligibility') || e.message.includes('already applied'))) {
        throw e;
      }
    }

    // Local fallback
    const apps = getStored(LS_APPLICATIONS, INITIAL_APPLICATIONS);
    const opps = getStored(LS_OPPORTUNITIES, INITIAL_OPPORTUNITIES);
    const students = getStored(LS_STUDENTS, INITIAL_STUDENTS);

    const student = students.find(s => s.id === studentId);
    const opp = opps.find(o => o.id === opportunityId);

    if (!student || !opp) throw new Error('Student or opportunity not found');

    const already = apps.some(a => a.studentId === studentId && a.opportunityId === opportunityId);
    if (already) throw new Error('You have already applied for this opportunity');

    const eligibility = evaluateStudentEligibility(student, opp);
    if (!eligibility.isEligible) {
      throw new Error('You do not meet the minimum CGPA eligibility requirement.');
    }

    const newApp = {
      id: `app_${Date.now()}`,
      opportunityId,
      studentId,
      preferredLocation: applicationDetails.preferredLocation || opp.location || 'Any',
      resumeFileName: applicationDetails.resumeFileName || `${student.rollNo}_Resume.pdf`,
      resumeUrl: applicationDetails.resumeUrl || '#',
      linkedinUrl: applicationDetails.linkedinUrl || '',
      customRequirementAnswer: applicationDetails.customRequirementAnswer || '',
      appliedAt: new Date().toISOString(),
      status: 'Applied'
    };
    apps.push(newApp);
    setStored(LS_APPLICATIONS, apps);
    return {
      success: true,
      application: newApp,
      message: `Application submitted for ${opp.company}`
    };
  },

  // Coordinator views applicants for a drive
  async getApplicants(opportunityId) {
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}/applicants`);
      if (res.ok) return await res.json();
    } catch (e) {}

    const apps = getStored(LS_APPLICATIONS, INITIAL_APPLICATIONS);
    const students = getStored(LS_STUDENTS, INITIAL_STUDENTS);
    const opps = getStored(LS_OPPORTUNITIES, INITIAL_OPPORTUNITIES);

    const opp = opps.find(o => o.id === opportunityId);
    const oppApps = apps.filter(a => a.opportunityId === opportunityId);

    const applicants = oppApps.map(app => {
      const student = students.find(s => s.id === app.studentId);
      return {
        applicationId: app.id,
        appliedAt: app.appliedAt,
        status: app.status || 'Applied',
        round2Selected: !!(app.round2Selected || app.status === 'Shortlisted for Round 2'),
        round2Details: app.round2Details || null,
        preferredLocation: app.preferredLocation || 'Any Location',
        resumeFileName: app.resumeFileName || `${student?.rollNo || 'Candidate'}_Resume.pdf`,
        resumeUrl: app.resumeUrl || '#',
        linkedinUrl: app.linkedinUrl || '',
        customRequirementAnswer: app.customRequirementAnswer || '',
        student: student || null
      };
    });

    return {
      opportunity: opp,
      totalApplicants: applicants.length,
      applicants
    };
  },

  // Coordinator updates application status (e.g. shortlists for Round 2)
  async updateApplication(applicationId, updates) {
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    // Fallback to localStorage
    const apps = getStored(LS_APPLICATIONS, INITIAL_APPLICATIONS);
    const index = apps.findIndex(a => a.id === applicationId);
    if (index !== -1) {
      apps[index] = { ...apps[index], ...updates };
      setStored(LS_APPLICATIONS, apps);
      return { success: true, application: apps[index] };
    }
    return { success: false, error: 'Application not found' };
  },

  // Coordinator bulk updates applications
  async bulkUpdateApplications(applicationIds, updates) {
    try {
      const res = await fetch('/api/applications/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationIds, updates })
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    // Fallback to localStorage
    const apps = getStored(LS_APPLICATIONS, INITIAL_APPLICATIONS);
    apps.forEach((app, idx) => {
      if (applicationIds.includes(app.id)) {
        apps[idx] = { ...app, ...updates };
      }
    });
    setStored(LS_APPLICATIONS, apps);
    return { success: true, updatedCount: applicationIds.length };
  },

  // Reset to initial dummy database
  resetDatabase() {
    setStored(LS_STUDENTS, INITIAL_STUDENTS);
    setStored(LS_OPPORTUNITIES, INITIAL_OPPORTUNITIES);
    setStored(LS_APPLICATIONS, INITIAL_APPLICATIONS);
    return true;
  }
};
