NITW Placement Cell Platform (CCPD)

A full-stack campus placement and recruitment portal built for National Institute of Technology Warangal (NITW).

Key Highlights

1. Branch-Targeted Company Feed (Exclusive Visibility):
   - Placement drives are only visible to students from allowed branches.
   - On a Mechanical (MECH) or Civil (CIVIL) student's feed, CSE/ECE-exclusive drives are completely excluded.
   - The Placement Coordinator maintains master visibility across all posted drives.

2. Upcoming Tests Roster & Round 2 Display:
   - Students have a dedicated Upcoming Tests tab right in their dashboard.
   - Chronological Date-Wise Agenda: Lists all scheduled assessments and online tests for applied companies.
   - Displays Assessment Round, Time Slot, Duration, Exam Centre/Venue, and Platform.

3. Application Details Modal (Location & Resume Upload):
   - When an eligible student clicks "Apply Now", a modal captures:
     - Preferred Work Location (e.g., Bangalore, Hyderabad, Pune, Any Location).
     - Resume Upload in PDFformat (defaults to `[RollNo]_Resume.pdf`).
     - Optional portfolio / LinkedIn URL and responses to custom company requirements.
     - Academic authenticity declaration.

4. Recruiter / Coordinator Portal & Round 2 Shortlisting:
   - Post company drives with allowed branches, minimum CGPA cutoff, and online test date/time/platform.
   - Round 2 Shortlisting: Coordinator can select individual or multiple candidates for Round 2 directly from the Applicant Roster, configure Round 2 date/time/venue, and export complete rosters to CSV.
   - Removed Highest CTC from coordinator dashboard metrics for a cleaner, focused view.
   - View the academic database of pre-loaded students.

5. Clean Design:
   - Single-tone institutional palette with sharp rectangular edges.
   - No emojis or decorative icons beside candidate names.
   - Eligible opportunities highlighted with a clean green outline and a `Eligible` tag.


How to Run the Application

```bash
npm run dev
```
- **Frontend Portal**: http://localhost:5173
- **Backend API**: http://localhost:5000


Login Accounts for Quick Testing

Student Accounts:

| Name | Roll No | Branch | CGPA | Pre-loaded Upcoming Tests |
| :--- | :--- | :--- | :--- | :--- |
| Hamsika Kanna | 21CS01 | CSE | 9.42 |
| Sneha Reddy | 21EC15 | ECE | 8.55 |
| Rahul Varma | 21EE32 | EEE | 7.80 |
| Priya Patel | 21ME48 | MECH | 8.12 |
| Karthik Rao | 21CE09 | CIVIL | 6.95 |

Coordinator Account:
- Email: `coordinator@nitw.ac.in`
- Role: Head, CCPD NIT Warangal
