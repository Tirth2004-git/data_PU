import { describe, it, expect } from 'vitest';
import {
  getScoreBand,
  computeSemesterAnalytics,
  computeBacklogConsistency,
  computeAttentionLevel,
  computePlacementEligibility,
  getDataNotes,
  generateStudentInsights,
} from './insights';

// Sample student fixture
const sampleStudent = {
  rollNo: '2303031460001',
  fullName: 'DEMO STUDENT',
  officialPhone: '9876543210',
  whatsappNo: '9876543210',
  diploma: null,
  academics: {
    cgpa: 5.93,
    liveBacklogsText: null,
    closedBacklogsText: null,
    totalLiveBacklogs: 3,
    totalClosedBacklogs: 3,
    semesterBacklogSum: 6,
    avgSgpa: 5.4,
    latestSgpa: 5.9,
    semesters: [
      { sem: 1, sgpa: 5.13, backlogCount: 1, backlogText: '1', hasBacklog: true },
      { sem: 2, sgpa: 6.15, backlogCount: 0, backlogText: '0', hasBacklog: false },
      { sem: 3, sgpa: 4.18, backlogCount: 2, backlogText: '2', hasBacklog: true },
      { sem: 4, sgpa: 5.65, backlogCount: 3, backlogText: '3', hasBacklog: true },
      { sem: 5, sgpa: 5.9, backlogCount: 0, backlogText: '0', hasBacklog: false },
    ],
  },
  placementPolicySubmitted: true,
  remarks: 'DONE',
};

describe('Deterministic Insight Engine (Section 7 Acceptance Tests)', () => {
  it('correctly calculates best, worst, average SGPA, deltas, and trend', () => {
    const analytics = computeSemesterAnalytics(sampleStudent.academics.semesters);

    // Best semester: Sem 2 (6.15). Worst: Sem 3 (4.18). Average SGPA 5.40.
    expect(analytics.bestSemester.sem).toBe(2);
    expect(analytics.bestSemester.sgpa).toBe(6.15);
    expect(analytics.worstSemester.sem).toBe(3);
    expect(analytics.worstSemester.sgpa).toBe(4.18);
    expect(analytics.averageSgpa).toBe(5.4);

    // Largest drop: Sem 2 -> 3 (-1.97). Largest rise: Sem 3 -> 4 (+1.47).
    expect(analytics.largestDrop).toEqual({
      fromSem: 2,
      toSem: 3,
      fromSgpa: 6.15,
      toSgpa: 4.18,
      diff: -1.97,
    });

    expect(analytics.largestRise).toEqual({
      fromSem: 3,
      toSem: 4,
      fromSgpa: 4.18,
      toSgpa: 5.65,
      diff: 1.47,
    });

    // Latest SGPA 5.90 (▲ +0.25)
    expect(analytics.latestVsPrevious.currentSgpa).toBe(5.9);
    expect(analytics.latestVsPrevious.prevSgpa).toBe(5.65);
    expect(analytics.latestVsPrevious.delta).toBe(0.25);
    expect(analytics.latestVsPrevious.indicator).toBe('▲');
    expect(analytics.latestVsPrevious.formattedDelta).toBe('+0.25');

    // Last 3 semesters: improving (4.18 -> 5.65 -> 5.90)
    expect(analytics.lastThreeTrend.trend).toBe('improving');
    expect(analytics.lastThreeTrend.text).toBe('4.18 → 5.65 → 5.90');
  });

  it('correctly verifies backlog consistency for sample student', () => {
    const consistency = computeBacklogConsistency(sampleStudent.academics);

    // Live backlogs 3, closed 3, semester counts [1, 0, 2, 3, 0] sum 6 = 3 + 3 (consistent)
    expect(consistency.live).toBe(3);
    expect(consistency.closed).toBe(3);
    expect(consistency.sumLiveClosed).toBe(6);
    expect(consistency.semesterSum).toBe(6);
    expect(consistency.isConsistent).toBe(true);
    expect(consistency.badgeText).toBe('Semester counts (6) = live + closed (6) ✓');
  });

  it('evaluates attention level as High (3 live backlogs)', () => {
    const attention = computeAttentionLevel(sampleStudent);
    expect(attention.level).toBe('High');
    expect(attention.reasons).toContain('3 live backlogs');
  });

  it('evaluates placement eligibility as Not eligible with explicit failure reasons', () => {
    const eligibility = computePlacementEligibility(sampleStudent);

    // Eligibility with default rule: Not eligible (CGPA 5.93 < 6.0, live backlogs 3)
    expect(eligibility.isEligible).toBe(false);
    expect(eligibility.statusText).toBe('Not eligible');

    const cgpaCheck = eligibility.checks.find((c) => c.label.includes('CGPA'));
    const backlogCheck = eligibility.checks.find((c) => c.label.includes('Live Backlogs'));
    const policyCheck = eligibility.checks.find((c) => c.label.includes('Policy'));

    expect(cgpaCheck.passed).toBe(false);
    expect(backlogCheck.passed).toBe(false);
    expect(policyCheck.passed).toBe(true);
  });

  it('generates accurate observational notes for sample student', () => {
    const notes = getDataNotes(sampleStudent);
    const keys = notes.map((n) => n.key);

    expect(keys).toContain('diploma');
    const diplomaNote = notes.find((n) => n.key === 'diploma');
    expect(diplomaNote.message).toBe('Diploma: not applicable (no diploma data in records)');
    expect(keys).toContain('backlogSubjects');
    expect(keys).toContain('whatsapp');
  });

  it('correctly handles zero change delta with neutral indicator and formatted string', () => {
    const sems = [
      { sem: 1, sgpa: 8.5 },
      { sem: 2, sgpa: 8.5 },
    ];
    const analytics = computeSemesterAnalytics(sems);
    expect(analytics.latestVsPrevious.delta).toBe(0);
    expect(analytics.latestVsPrevious.isZero).toBe(true);
    expect(analytics.latestVsPrevious.indicator).toBe('—');
    expect(analytics.latestVsPrevious.formattedDelta).toBe('— 0.00');
  });

  it('evaluates stable trajectory when total change over 3 semesters is within tolerance', () => {
    // E.g. student 2303031080006: 8.50 -> 8.35 -> 8.23 (drop of 0.27 <= 0.3)
    const sems = [
      { sem: 1, sgpa: 8.75 },
      { sem: 2, sgpa: 8.5 },
      { sem: 3, sgpa: 8.5 },
      { sem: 4, sgpa: 8.35 },
      { sem: 5, sgpa: 8.23 },
    ];
    const analytics = computeSemesterAnalytics(sems);
    expect(analytics.lastThreeTrend.trend).toBe('stable');
    expect(analytics.lastThreeTrend.label).toBe('Stable');
    expect(analytics.lastThreeTrend.color).toBe('neutral');
  });

  it('evaluates score bands accurately', () => {
    expect(getScoreBand(8.6).label).toBe('Outstanding');
    expect(getScoreBand(7.5).label).toBe('Very Good');
    expect(getScoreBand(6.5).label).toBe('Good');
    expect(getScoreBand(5.93).label).toBe('Average');
    expect(getScoreBand(4.2).label).toBe('Needs Improvement');
  });

  it('generates complete composite insights structure', () => {
    const composite = generateStudentInsights(sampleStudent);
    expect(composite).toBeDefined();
    expect(composite.semesterAnalytics.bestSemester.sgpa).toBe(6.15);
    expect(composite.backlogConsistency.isConsistent).toBe(true);
    expect(composite.attention.level).toBe('High');
    expect(composite.eligibility.isEligible).toBe(false);
    expect(composite.scoreBand.label).toBe('Average');
  });
});
