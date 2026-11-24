import React, { useMemo } from 'react';

export default function StudentUpcomingTests({ student, opportunities }) {
  // Extract applied opportunities with both Round 1 (OT) and Round 2 (if shortlisted)
  const appliedTests = useMemo(() => {
    const list = [];

    opportunities
      .filter((opp) => opp.studentStatus?.applied)
      .forEach((opp) => {
        const isRound2Selected = !!opp.studentStatus?.round2Selected;

        // Determine if the OT (Round 1 Online Test) date has passed
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const otDate = opp.testDate ? new Date(opp.testDate + 'T00:00:00') : null;
        const isOTDone = otDate ? today > otDate : false;

        // Round 1 / OT Test entry
        if (opp.testDate) {
          list.push({
            id: `${opp.id}_r1`,
            opportunityId: opp.id,
            company: opp.company,
            role: opp.role,
            ctc: opp.ctc,
            testDate: opp.testDate,
            testTime: opp.testTime || '10:00 AM - 12:00 PM',
            testRound: opp.testRound || 'Online Assessment (Round 1 OT)',
            testPlatform: opp.testPlatform || 'Assessment Portal',
            testDuration: opp.testDuration || '120 Mins',
            examCentre: opp.examCentre || 'CCPD Lab',
            location: opp.location,
            isRound2: false,
            round2Selected: isRound2Selected,
            status: isRound2Selected ? 'Round 1 Cleared ✓' : isOTDone ? 'Round 1 OT Completed' : 'Scheduled (Round 1 OT)',
            instructions: `Assessment Instructions for ${opp.company} (Round 1 Online Test):\nDate: ${opp.testDate}\nSlot: ${opp.testTime || '10:00 AM - 12:00 PM'}\nExam Centre: ${opp.examCentre || 'CCPD Lab'}\nPlatform: ${opp.testPlatform || 'Assessment Portal'}\n\nPlease report to ${opp.examCentre || 'CCPD Lab'} 15 minutes before the scheduled time with your NITW Student ID Card.`
          });
        }

        // If student is shortlisted for Round 2, inject Round 2 entry!
        if (isRound2Selected) {
          const r2 = opp.studentStatus?.round2Details || {};
          let r2Date = r2.date;
          if (!r2Date) {
            const base = new Date((opp.testDate || '2026-11-22') + 'T00:00:00');
            base.setDate(base.getDate() + 5);
            r2Date = base.toISOString().split('T')[0];
          }

          list.push({
            id: `${opp.id}_r2`,
            opportunityId: opp.id,
            company: opp.company,
            role: opp.role,
            ctc: opp.ctc,
            testDate: r2Date,
            testTime: r2.time || '11:00 AM - 12:30 PM',
            testRound: r2.roundName || 'Round 2: Technical Interview',
            testPlatform: r2.venue || 'CCPD Interview Cubicle / Online',
            testDuration: r2.duration || '60 Mins',
            examCentre: r2.venue || 'CCPD Interview Room 1',
            location: opp.location,
            isRound2: true,
            round2Selected: true,
            status: 'Shortlisted for Round 2',
            instructions: r2.instructions || `Congratulations on qualifying Round 1 (OT)! You have been selected for Round 2 with ${opp.company}.\nDate: ${r2Date}\nSlot: ${r2.time || '11:00 AM - 12:30 PM'}\nVenue: ${r2.venue || 'CCPD Interview Cubicle'}\n\nPlease report 15 minutes prior to your scheduled time with your updated physical resume, academic transcripts, and NITW Student ID card.`
          });
        }
      });

    return list.sort((a, b) => new Date(a.testDate) - new Date(b.testDate));
  }, [opportunities]);

  const hasRound2 = appliedTests.some((t) => t.isRound2);

  return (
    <div className="space-y-5 text-xs text-slate-800">
      
      {/* Round 2 Congratulations Banner (if candidate is shortlisted) */}
      {hasRound2 && (
        <div className="border-2 border-indigo-600 bg-indigo-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-indigo-950">
          <div className="flex items-start gap-2.5">
            <span className="px-2 py-0.5 bg-indigo-900 text-white font-bold text-[10px] uppercase tracking-wider shrink-0 mt-0.5">
              ★ Round 2 Notice
            </span>
            <div>
              <p className="font-bold text-sm text-indigo-950 tracking-tight">
                Congratulations! You have been shortlisted for Round 2.
              </p>
              <p className="text-indigo-800 text-xs mt-0.5">
                Your upcoming Round 2 schedule is highlighted in purple below. Please review slot timings and instructions.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-indigo-900 text-white font-mono font-bold text-xs shrink-0 self-start sm:self-auto">
            Round 2 Qualified
          </span>
        </div>
      )}

      {/* Top Banner / Header */}
      <div className="border border-slate-300 bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Upcoming Tests & Assessment Schedule
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Date-wise roster of scheduled recruitment assessments, online tests, and assigned interview rounds
          </p>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <span className="px-3 py-1 font-semibold border border-slate-300 bg-slate-100 text-slate-800 text-xs">
            {appliedTests.length} Total Scheduled Round{appliedTests.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      {appliedTests.length === 0 ? (
        <div className="border border-slate-300 bg-white p-8 text-center text-xs text-slate-600">
          <p className="font-semibold text-slate-900 text-sm">No upcoming tests currently scheduled.</p>
          <p className="mt-1 text-slate-500">
            When you apply to eligible company drives from the Opportunities tab, their scheduled test dates and exam centres will automatically appear in your upcoming tests roster.
          </p>
        </div>
      ) : (
        /* Date-wise Chronological Agenda List View */
        <div className="space-y-4">
          <div className="border border-slate-300 bg-slate-100 px-4 py-2 text-[11px] font-bold text-slate-700 uppercase tracking-wider flex justify-between items-center">
            <span>Scheduled Assessment Dates ({appliedTests.length} Total)</span>
            <span className="font-mono text-slate-500 font-normal">Candidate: {student.rollNo}</span>
          </div>

          <div className="space-y-4">
            {appliedTests.map((test) => {
              const dateObj = new Date(test.testDate + 'T00:00:00');
              const formattedDate = dateObj.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });

              // ROUND 2 CARDS: Rendered in DISTINCT PURPLE / INDIGO COLOUR
              if (test.isRound2) {
                return (
                  <div
                    key={test.id}
                    className="border-2 border-indigo-600 bg-indigo-50/40 shadow-sm transition-colors overflow-hidden"
                  >
                    {/* Distinct Round 2 Header Strip */}
                    <div className="bg-indigo-900 text-white px-4 py-1.5 flex items-center justify-between text-xs font-bold tracking-tight">
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-400 text-slate-950 font-bold px-1.5 py-0.2 text-[10px] uppercase tracking-wider">
                          ★ Shortlisted
                        </span>
                        <span>ROUND 2: TECHNICAL INTERVIEW & ASSESSMENT</span>
                      </div>
                      <span className="text-[11px] font-mono text-indigo-200">
                        Stage 2 Selection
                      </span>
                    </div>

                    <div className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1">
                          {/* Date Badge in Indigo */}
                          <div className="inline-block px-2.5 py-0.5 border border-indigo-400 bg-indigo-100 text-[11px] font-mono font-bold text-indigo-950 mb-2">
                            {formattedDate}
                          </div>

                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-indigo-950">
                              {test.company}
                            </h3>
                            <span className="text-[11px] text-indigo-800 font-mono font-semibold">
                              ({test.role})
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 bg-indigo-200 text-indigo-900 font-mono font-bold">
                              ₹{test.ctc} LPA
                            </span>
                          </div>

                          <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs text-slate-800">
                            <div className="p-2.5 bg-white border border-indigo-200">
                              <span className="text-[10px] text-indigo-700 uppercase block font-bold">
                                Round 2 Stage
                              </span>
                              <span className="font-bold text-slate-900">
                                {test.testRound}
                              </span>
                            </div>

                            <div className="p-2.5 bg-white border border-indigo-200">
                              <span className="text-[10px] text-indigo-700 uppercase block font-bold">
                                Scheduled Time Slot
                              </span>
                              <span className="font-mono font-bold text-slate-900">
                                {test.testTime}
                              </span>
                            </div>

                            <div className="p-2.5 bg-white border border-indigo-200">
                              <span className="text-[10px] text-indigo-700 uppercase block font-bold">
                                Interview Room / Venue
                              </span>
                              <span className="font-bold text-indigo-950 bg-indigo-100 px-1 py-0.2 border border-indigo-300 inline-block font-mono">
                                {test.examCentre}
                              </span>
                            </div>

                            <div className="p-2.5 bg-white border border-indigo-200">
                              <span className="text-[10px] text-indigo-700 uppercase block font-bold">
                                Platform & Duration
                              </span>
                              <span className="font-semibold text-slate-900">
                                {test.testPlatform} ({test.testDuration})
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="sm:text-right shrink-0">
                          <span className="px-3 py-1 text-[11px] font-bold bg-indigo-900 text-white border border-indigo-900 block sm:inline-block shadow-xs">
                            ★ Shortlisted for Round 2
                          </span>
                          <button
                            type="button"
                            onClick={() => alert(test.instructions)}
                            className="mt-2 block sm:inline-block text-[11px] font-bold text-indigo-900 underline hover:text-black cursor-pointer"
                          >
                            View Round 2 Instructions
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              // ROUND 1 (OT) CARDS: Rendered in Standard Slate
              return (
                <div
                  key={test.id}
                  className="border border-slate-300 bg-white p-4 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1">
                      {/* Date Badge */}
                      <div className="inline-block px-2 py-0.5 border border-slate-300 bg-slate-50 text-[11px] font-mono font-bold text-slate-800 mb-2">
                        {formattedDate}
                      </div>

                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">
                          {test.company}
                        </h3>
                        <span className="text-[11px] text-slate-600 font-mono">
                          ({test.role})
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 border border-slate-300 text-slate-700 font-mono">
                          Round 1 (OT)
                        </span>
                      </div>

                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs text-slate-700">
                        <div className="p-2 bg-slate-50 border border-slate-200">
                          <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                            Assessment Round
                          </span>
                          <span className="font-semibold text-slate-900">
                            {test.testRound}
                          </span>
                        </div>

                        <div className="p-2 bg-slate-50 border border-slate-200">
                          <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                            Time Window
                          </span>
                          <span className="font-mono font-semibold text-slate-900">
                            {test.testTime}
                          </span>
                        </div>

                        <div className="p-2 bg-slate-50 border border-slate-200">
                          <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                            Exam Centre / Lab
                          </span>
                          <span className="font-bold text-slate-900 bg-slate-200 px-1 py-0.2 border border-slate-300 inline-block font-mono">
                            {test.examCentre}
                          </span>
                        </div>

                        <div className="p-2 bg-slate-50 border border-slate-200">
                          <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                            Platform & Duration
                          </span>
                          <span className="font-semibold text-slate-900">
                            {test.testPlatform} ({test.testDuration})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="sm:text-right shrink-0">
                      {test.round2Selected ? (
                        <span className="px-2.5 py-1 text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 block sm:inline-block">
                          Round 1 Cleared ✓
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-300 block sm:inline-block">
                          OT Scheduled
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => alert(test.instructions)}
                        className="mt-2 block sm:inline-block text-[11px] font-semibold text-slate-900 underline hover:text-black cursor-pointer"
                      >
                        View Test Instructions
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
