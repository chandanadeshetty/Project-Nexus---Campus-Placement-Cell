import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
const STUDENTS_FILE = path.join(DATA_DIR, 'students.json');
const OPPORTUNITIES_FILE = path.join(DATA_DIR, 'opportunities.json');
const APPLICATIONS_FILE = path.join(DATA_DIR, 'applications.json');

function loadLocalEnv() {
  const envFile = path.join(__dirname, '.env');
  if (!fs.existsSync(envFile)) return;
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

loadLocalEnv();

async function sendPlacementEmail({ to, subject, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!apiKey || !from) return false;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ from, to: [to], subject, text })
    });
    if (!response.ok) {
      console.error(`Placement email failed (${response.status}): ${await response.text()}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Placement email could not be sent:', error.message);
    return false;
  }
}

function formatRound2Email(student, opportunity, details = {}) {
  return sendPlacementEmail({
    to: student.email,
    subject: `Round 2 selection: ${opportunity.company}`,
    text: [
      `Hello ${student.name},`,
      '',
      `You have been selected for Round 2 for ${opportunity.role} at ${opportunity.company}.`,
      `Round: ${details.roundName || 'Round 2'}`,
      `Date: ${details.date || 'To be announced'}`,
      `Time: ${details.time || 'To be announced'}`,
      `Venue: ${details.venue || 'To be announced'}`,
      '',
      details.instructions || 'Please check the placement portal for further instructions.'
    ].join('\n')
  });
}

// Helper to read JSON
function readJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return [];
  }
}

// Helper to write JSON
function writeJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

function publicStudent(student) {
  if (!student) return student;
  const { password, ...profile } = student;
  return profile;
}

// Check eligibility function
function evaluateEligibility(student, opportunity) {
  if (!student || !opportunity) {
    return {
      isEligible: false,
      branchEligible: false,
      cgpaEligible: false,
      reasons: ['Student or opportunity not found']
    };
  }

  const branchEligible = opportunity.allowedBranches.includes(student.branchCode);
  const cgpaEligible = Number(student.cgpa) >= Number(opportunity.minCgpa);
  const isEligible = branchEligible && cgpaEligible;

  const reasons = [];
  if (!cgpaEligible) {
    reasons.push(
      `CGPA requirement not met: Min ${opportunity.minCgpa} required (Your CGPA: ${student.cgpa})`
    );
  }
  if (!branchEligible) {
    reasons.push(
      `Branch restriction: Open for [${opportunity.allowedBranches.join(', ')}] (Your branch: ${student.branchCode})`
    );
  }
  if (isEligible) {
    reasons.push(`Meets branch criteria (${student.branchCode})`);
    reasons.push(`Meets CGPA criteria (${student.cgpa} >= ${opportunity.minCgpa})`);
  }

  return {
    isEligible,
    branchEligible,
    cgpaEligible,
    reasons
  };
}

// ------------------------------------------------------
// Auth Routes
// ------------------------------------------------------
app.post('/api/auth/login', (req, res) => {
  const { email, role, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const cleanEmail = email.trim().toLowerCase();

  if (role === 'coordinator') {
    // Placement coordinator authentication
    if ((cleanEmail === 'coordinator@nitw.ac.in' || cleanEmail === 'admin@nitw.ac.in') && password === 'admin@123') {
      return res.json({
        success: true,
        role: 'coordinator',
        user: {
          id: 'coord_1',
          name: 'Dr. K. Venkatesh',
          email: 'coordinator@nitw.ac.in',
          role: 'Placement Coordinator',
          department: 'CCPD (Center for Career Planning & Development)',
          college: 'National Institute of Technology Warangal'
        }
      });
    } else {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }
  }

  // Student authentication
  const students = readJson(STUDENTS_FILE);
  const student = students.find(s => s.email.toLowerCase() === cleanEmail);

  if (!student) {
    return res.status(404).json({
      error: 'Student not found with this college email. Please use a registered NITW email (e.g. kh24csb0a32@student.nitw.ac.in) or select one from demo students.'
    });
  }

  if (student.password !== password) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  return res.json({
    success: true,
    role: 'student',
    user: Object.fromEntries(Object.entries(student).filter(([key]) => key !== 'password'))
  });
});

// ------------------------------------------------------
// Student Routes
// ------------------------------------------------------
app.get('/api/students', (req, res) => {
  const students = readJson(STUDENTS_FILE);
  res.json(students.map(publicStudent));
});

app.get('/api/students/:id', (req, res) => {
  const students = readJson(STUDENTS_FILE);
  const student = students.find(s => s.id === req.params.id || s.email === req.params.id);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }
  res.json(publicStudent(student));
});

// ------------------------------------------------------
// Opportunities Routes
// ------------------------------------------------------
app.get('/api/opportunities', (req, res) => {
  const opportunities = readJson(OPPORTUNITIES_FILE);
  const applications = readJson(APPLICATIONS_FILE);
  const { studentId } = req.query;

  let student = null;
  if (studentId) {
    const students = readJson(STUDENTS_FILE);
    student = students.find(s => s.id === studentId || s.email === studentId);
  }

  // Branch filtering: If student is requesting, ONLY return opportunities allowed for their branch!
  const visibleOpportunities = student
    ? opportunities.filter(opp => opp.allowedBranches && opp.allowedBranches.includes(student.branchCode))
    : opportunities;

  const enriched = visibleOpportunities.map(opp => {
    // Count total applicants
    const oppApps = applications.filter(a => a.opportunityId === opp.id);
    const applicantCount = oppApps.length;

    let studentStatus = null;
    if (student) {
      const studentApp = oppApps.find(a => a.studentId === student.id);
      const applied = !!studentApp;
      const eligibility = evaluateEligibility(student, opp);
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

  res.json(enriched);
});

app.get('/api/opportunities/:id', (req, res) => {
  const opportunities = readJson(OPPORTUNITIES_FILE);
  const opp = opportunities.find(o => o.id === req.params.id);
  if (!opp) {
    return res.status(404).json({ error: 'Opportunity not found' });
  }
  res.json(opp);
});

// Coordinator posts new opportunity
app.post('/api/opportunities', async (req, res) => {
  const {
    company,
    role,
    ctc,
    minCgpa,
    allowedBranches,
    location,
    deadline,
    category,
    description,
    selectionProcess,
    logo,
    testDate,
    testTime,
    testRound,
    testPlatform,
    testDuration,
    examCentre,
    otherRequirements,
    customRequirementPrompt
  } = req.body;

  if (!company || !role || !minCgpa || !allowedBranches || !allowedBranches.length) {
    return res.status(400).json({
      error: 'Missing required fields: company, role, minCgpa, and allowedBranches'
    });
  }

  const opportunities = readJson(OPPORTUNITIES_FILE);

  const newOpp = {
    id: `opp_${Date.now()}`,
    company: company.trim(),
    role: role.trim(),
    ctc: Number(ctc) || 0,
    minCgpa: Number(minCgpa),
    allowedBranches: Array.isArray(allowedBranches) ? allowedBranches : [allowedBranches],
    location: location?.trim() || 'Pan India',
    deadline: deadline || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    category: category?.trim() || 'General Recruitment',
    description: description?.trim() || 'No description provided.',
    selectionProcess: selectionProcess?.trim() || 'Shortlisting -> Assessment -> Technical Interview -> HR Round',
    postedAt: new Date().toISOString(),
    logo: logo?.trim() || `https://ui-avatars.com/api/?name=${encodeURIComponent(company)}&background=0D8ABC&color=fff&bold=true`,
    testDate: testDate || new Date(Date.now() + 18 * 86400000).toISOString().split('T')[0],
    testTime: testTime || '10:00 AM - 12:00 PM',
    testRound: testRound || 'Online Technical Assessment',
    testPlatform: testPlatform || 'HackerRank',
    testDuration: testDuration || '120 Mins',
    examCentre: examCentre?.trim() || 'CCPD Lab',
    otherRequirements: otherRequirements?.trim() || '',
    customRequirementPrompt: customRequirementPrompt?.trim() || ''
  };

  opportunities.unshift(newOpp);
  writeJson(OPPORTUNITIES_FILE, opportunities);

  const eligibleStudents = readJson(STUDENTS_FILE).filter(student =>
    evaluateEligibility(student, newOpp).isEligible && student.email
  );
  await Promise.all(eligibleStudents.map(student => sendPlacementEmail({
    to: student.email,
    subject: `New eligible placement drive: ${newOpp.company}`,
    text: [
      `Hello ${student.name},`,
      '',
      `A new placement drive matching your branch and CGPA has been posted: ${newOpp.company} — ${newOpp.role}.`,
      `CTC: ₹${newOpp.ctc} LPA`,
      `Minimum CGPA: ${newOpp.minCgpa}`,
      `Application deadline: ${newOpp.deadline}`,
      `Online test: ${newOpp.testDate}, ${newOpp.testTime} (${newOpp.testPlatform})`,
      '',
      'Sign in to the placement portal to review the details and apply.'
    ].join('\n')
  })));

  res.status(201).json(newOpp);
});

// Coordinator updates an opportunity
app.put('/api/opportunities/:id', (req, res) => {
  const opportunities = readJson(OPPORTUNITIES_FILE);
  const index = opportunities.findIndex(o => o.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Opportunity not found' });
  }

  const current = opportunities[index];
  const updated = {
    ...current,
    ...req.body,
    id: current.id, // preserve id
    minCgpa: req.body.minCgpa !== undefined ? Number(req.body.minCgpa) : current.minCgpa,
    ctc: req.body.ctc !== undefined ? Number(req.body.ctc) : current.ctc,
    allowedBranches: req.body.allowedBranches || current.allowedBranches
  };

  opportunities[index] = updated;
  writeJson(OPPORTUNITIES_FILE, opportunities);

  res.json(updated);
});

// Coordinator deletes an opportunity
app.delete('/api/opportunities/:id', (req, res) => {
  let opportunities = readJson(OPPORTUNITIES_FILE);
  const exists = opportunities.some(o => o.id === req.params.id);

  if (!exists) {
    return res.status(404).json({ error: 'Opportunity not found' });
  }

  opportunities = opportunities.filter(o => o.id !== req.params.id);
  writeJson(OPPORTUNITIES_FILE, opportunities);

  // Also remove applications for this opportunity
  let applications = readJson(APPLICATIONS_FILE);
  applications = applications.filter(a => a.opportunityId !== req.params.id);
  writeJson(APPLICATIONS_FILE, applications);

  res.json({ success: true, message: 'Opportunity deleted successfully' });
});

// ------------------------------------------------------
// Applications Routes
// ------------------------------------------------------
app.post('/api/applications', async (req, res) => {
  const {
    studentId,
    opportunityId,
    preferredLocation,
    resumeFileName,
    resumeUrl,
    linkedinUrl,
    customRequirementAnswer
  } = req.body;

  if (!studentId || !opportunityId) {
    return res.status(400).json({ error: 'studentId and opportunityId are required' });
  }

  const students = readJson(STUDENTS_FILE);
  const opportunities = readJson(OPPORTUNITIES_FILE);
  const applications = readJson(APPLICATIONS_FILE);

  const student = students.find(s => s.id === studentId);
  const opportunity = opportunities.find(o => o.id === opportunityId);

  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }
  if (!opportunity) {
    return res.status(404).json({ error: 'Opportunity not found' });
  }

  // Check if already applied
  const alreadyApplied = applications.some(
    a => a.studentId === studentId && a.opportunityId === opportunityId
  );
  if (alreadyApplied) {
    return res.status(400).json({ error: 'You have already applied for this opportunity' });
  }

  // Enforce eligibility
  const eligibility = evaluateEligibility(student, opportunity);
  if (!eligibility.isEligible) {
    return res.status(403).json({
      error: 'You do not meet the eligibility requirements for this drive.',
      reasons: eligibility.reasons
    });
  }

  const newApp = {
    id: `app_${Date.now()}`,
    opportunityId,
    studentId,
    preferredLocation: preferredLocation?.trim() || opportunity.location || 'Any',
    resumeFileName: resumeFileName || `${student.rollNo}_Resume.pdf`,
    resumeUrl: resumeUrl || '#',
    linkedinUrl: linkedinUrl?.trim() || '',
    customRequirementAnswer: customRequirementAnswer?.trim() || '',
    appliedAt: new Date().toISOString(),
    status: 'Applied'
  };

  applications.push(newApp);
  writeJson(APPLICATIONS_FILE, applications);

  await sendPlacementEmail({
    to: student.email,
    subject: `Application received: ${opportunity.company} OT details`,
    text: [
      `Hello ${student.name},`,
      '',
      `Your application for ${opportunity.role} at ${opportunity.company} has been received.`,
      `Online test: ${opportunity.testDate || 'To be announced'}`,
      `Time: ${opportunity.testTime || 'To be announced'}`,
      `Platform: ${opportunity.testPlatform || 'To be announced'}`,
      `Duration: ${opportunity.testDuration || 'To be announced'}`,
      `Exam centre: ${opportunity.examCentre || 'To be announced'}`,
      '',
      'Sign in to the placement portal for your application status and test instructions.'
    ].join('\n')
  });

  res.status(201).json({
    success: true,
    message: `Application successfully submitted for ${opportunity.company}`,
    application: newApp
  });
});

// Coordinator updates an application (e.g. shortlists for Round 2)
app.patch('/api/applications/:id', async (req, res) => {
  const applications = readJson(APPLICATIONS_FILE);
  const index = applications.findIndex(a => a.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Application not found' });
  }

  const current = applications[index];

  // Prevent Round 2 shortlisting if OT (Round 1 test) hasn't been completed yet
  if (req.body.round2Selected === true || req.body.status === 'Shortlisted for Round 2') {
    const opportunities = readJson(OPPORTUNITIES_FILE);
    const opp = opportunities.find(o => o.id === current.opportunityId);
    if (opp && opp.testDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const otDate = new Date(opp.testDate + 'T00:00:00');
      if (today <= otDate) {
        return res.status(400).json({
          error: `Cannot shortlist for Round 2 yet. The Online Test (OT) is scheduled for ${opp.testDate} and has not been completed. Round 2 selection will be available after the OT date.`
        });
      }
    }
  }

  const updated = {
    ...current,
    ...req.body,
    id: current.id,
    opportunityId: current.opportunityId,
    studentId: current.studentId
  };

  applications[index] = updated;
  writeJson(APPLICATIONS_FILE, applications);
  const wasShortlisted = !!(current.round2Selected || current.status === 'Shortlisted for Round 2');
  const isShortlisted = !!(updated.round2Selected || updated.status === 'Shortlisted for Round 2');
  if (!wasShortlisted && isShortlisted) {
    const students = readJson(STUDENTS_FILE);
    const opportunities = readJson(OPPORTUNITIES_FILE);
    const student = students.find(item => item.id === current.studentId);
    const opportunity = opportunities.find(item => item.id === current.opportunityId);
    if (student && opportunity) {
      await formatRound2Email(student, opportunity, updated.round2Details);
    }
  }
  res.json({ success: true, application: updated });
});

// Coordinator bulk updates applications (e.g. bulk shortlist for Round 2)
app.post('/api/applications/bulk-update', async (req, res) => {
  const { applicationIds, updates } = req.body;
  if (!Array.isArray(applicationIds) || !updates) {
    return res.status(400).json({ error: 'applicationIds array and updates object required' });
  }

  const applications = readJson(APPLICATIONS_FILE);
  const newlyShortlistedIds = (updates.round2Selected === true || updates.status === 'Shortlisted for Round 2')
    ? applications
      .filter(app => applicationIds.includes(app.id) && !app.round2Selected && app.status !== 'Shortlisted for Round 2')
      .map(app => app.id)
    : [];

  // If trying to shortlist for Round 2, validate that OT is completed for each opportunity
  if (updates.round2Selected === true || updates.status === 'Shortlisted for Round 2') {
    const opportunities = readJson(OPPORTUNITIES_FILE);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const app of applications) {
      if (applicationIds.includes(app.id)) {
        const opp = opportunities.find(o => o.id === app.opportunityId);
        if (opp && opp.testDate) {
          const otDate = new Date(opp.testDate + 'T00:00:00');
          if (today <= otDate) {
            return res.status(400).json({
              error: `Cannot shortlist for Round 2 yet. The Online Test (OT) for ${opp.company} is scheduled for ${opp.testDate} and has not been completed. Round 2 selection will be available after the OT date.`
            });
          }
        }
      }
    }
  }

  let updatedCount = 0;

  applications.forEach((app, idx) => {
    if (applicationIds.includes(app.id)) {
      applications[idx] = {
        ...app,
        ...updates,
        id: app.id,
        opportunityId: app.opportunityId,
        studentId: app.studentId
      };
      updatedCount++;
    }
  });

  writeJson(APPLICATIONS_FILE, applications);

  if (updates.round2Selected === true || updates.status === 'Shortlisted for Round 2') {
    const opportunities = readJson(OPPORTUNITIES_FILE);
    const students = readJson(STUDENTS_FILE);
    const newlyShortlisted = applications.filter(app => newlyShortlistedIds.includes(app.id));
    await Promise.all(newlyShortlisted.map(app => {
      const student = students.find(item => item.id === app.studentId);
      const opportunity = opportunities.find(item => item.id === app.opportunityId);
      return student && opportunity
        ? formatRound2Email(student, opportunity, app.round2Details)
        : Promise.resolve(false);
    }));
  }
  res.json({ success: true, updatedCount });
});

app.get('/api/applications/student/:studentId', (req, res) => {
  const applications = readJson(APPLICATIONS_FILE);
  const opportunities = readJson(OPPORTUNITIES_FILE);

  const studentApps = applications.filter(a => a.studentId === req.params.studentId);
  const enriched = studentApps.map(app => {
    const opp = opportunities.find(o => o.id === app.opportunityId);
    return {
      ...app,
      opportunity: opp || null
    };
  });

  res.json(enriched);
});

// Coordinator views applicants for a specific opportunity
app.get('/api/opportunities/:id/applicants', (req, res) => {
  const applications = readJson(APPLICATIONS_FILE);
  const students = readJson(STUDENTS_FILE);
  const opportunities = readJson(OPPORTUNITIES_FILE);

  const opp = opportunities.find(o => o.id === req.params.id);
  if (!opp) {
    return res.status(404).json({ error: 'Opportunity not found' });
  }

  const oppApps = applications.filter(a => a.opportunityId === req.params.id);

  // Check if OT date has passed
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const otDate = opp.testDate ? new Date(opp.testDate + 'T00:00:00') : null;
  const otCompleted = otDate ? today > otDate : false;

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
      student: publicStudent(student) || null
    };
  });

  res.json({
    opportunity: opp,
    totalApplicants: applicants.length,
    otCompleted,
    applicants
  });
});

// Stats overview
app.get('/api/stats', (req, res) => {
  const students = readJson(STUDENTS_FILE);
  const opportunities = readJson(OPPORTUNITIES_FILE);
  const applications = readJson(APPLICATIONS_FILE);

  res.json({
    totalStudents: students.length,
    totalOpportunities: opportunities.length,
    totalApplications: applications.length
  });
});

app.listen(PORT, () => {
  console.log(`NITW Placement Cell Server running on http://localhost:${PORT}`);
});
