/**
 * Campus Compass — Deterministic Insight Engine
 * Computes pure mathematical and deterministic academic insights.
 * Zero AI hallucination — every statement is backed by explicit numbers.
 */

import { config } from '../config';

/**
 * Returns score band for CGPA or SGPA
 */
export function getScoreBand(score) {
  if (score === null || score === undefined || isNaN(score)) {
    return {
      band: 'Unknown',
      label: 'No Data',
      color: 'slate',
      bgClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      borderClass: 'border-slate-300 dark:border-slate-700',
    };
  }

  const num = Number(score);
  if (num >= 8.5) {
    return {
      band: '≥ 8.5',
      label: 'Outstanding',
      color: 'emerald',
      bgClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
      borderClass: 'border-emerald-300 dark:border-emerald-700',
    };
  }
  if (num >= 7.0) {
    return {
      band: '7.0–8.49',
      label: 'Very Good',
      color: 'teal',
      bgClass: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',
      borderClass: 'border-teal-300 dark:border-teal-700',
    };
  }
  if (num >= 6.0) {
    return {
      band: '6.0–6.99',
      label: 'Good',
      color: 'amber',
      bgClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
      borderClass: 'border-amber-300 dark:border-amber-700',
    };
  }
  if (num >= 5.0) {
    return {
      band: '5.0–5.99',
      label: 'Average',
      color: 'orange',
      bgClass: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
      borderClass: 'border-orange-300 dark:border-orange-700',
    };
  }
  return {
    band: '< 5.0',
    label: 'Needs Improvement',
    color: 'red',
    bgClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
    borderClass: 'border-rose-300 dark:border-rose-700',
  };
}

/**
 * Computes semester level analytics: best, worst, drops, rises, trend
 */
export function computeSemesterAnalytics(semesters = []) {
  const valid = semesters
    .filter((s) => s.sgpa !== null && s.sgpa !== undefined && !isNaN(s.sgpa))
    .sort((a, b) => a.sem - b.sem);

  if (valid.length === 0) {
    return {
      bestSemester: null,
      worstSemester: null,
      averageSgpa: null,
      largestDrop: null,
      largestRise: null,
      latestVsPrevious: null,
      lastThreeTrend: null,
    };
  }

  let best = valid[0];
  let worst = valid[0];
  let sum = 0;

  for (const s of valid) {
    sum += s.sgpa;
    if (s.sgpa > best.sgpa) best = s;
    if (s.sgpa < worst.sgpa) worst = s;
  }

  const averageSgpa = Number((sum / valid.length).toFixed(2));

  // Compute consecutive semester deltas
  let largestDrop = null; // most negative delta
  let largestRise = null; // most positive delta

  for (let i = 1; i < valid.length; i++) {
    const from = valid[i - 1];
    const to = valid[i];
    const diff = Number((to.sgpa - from.sgpa).toFixed(2));

    if (diff < 0) {
      if (!largestDrop || diff < largestDrop.diff) {
        largestDrop = {
          fromSem: from.sem,
          toSem: to.sem,
          fromSgpa: from.sgpa,
          toSgpa: to.sgpa,
          diff,
        };
      }
    } else if (diff > 0) {
      if (!largestRise || diff > largestRise.diff) {
        largestRise = {
          fromSem: from.sem,
          toSem: to.sem,
          fromSgpa: from.sgpa,
          toSgpa: to.sgpa,
          diff,
        };
      }
    }
  }

  // Latest vs previous semester
  let latestVsPrevious = null;
  if (valid.length >= 2) {
    const prev = valid[valid.length - 2];
    const curr = valid[valid.length - 1];
    const delta = Number((curr.sgpa - prev.sgpa).toFixed(2));
    const isZero = Math.abs(delta) < 0.005;
    latestVsPrevious = {
      currentSem: curr.sem,
      currentSgpa: curr.sgpa,
      prevSem: prev.sem,
      prevSgpa: prev.sgpa,
      delta,
      isZero,
      indicator: isZero ? '—' : delta > 0 ? '▲' : '▼',
      formattedDelta: isZero ? '— 0.00' : delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2),
    };
  } else if (valid.length === 1) {
    latestVsPrevious = {
      currentSem: valid[0].sem,
      currentSgpa: valid[0].sgpa,
      prevSem: null,
      prevSgpa: null,
      delta: 0,
      isZero: true,
      indicator: '—',
      formattedDelta: '— 0.00',
    };
  }

  // Last 3 semesters trend (with configurable TREND_TOLERANCE)
  let lastThreeTrend = null;
  if (valid.length >= 3) {
    const last3 = valid.slice(-3);
    const [s1, s2, s3] = last3;
    const tolerance = config.TREND_TOLERANCE ?? 0.3;
    const totalChange = Number((s3.sgpa - s1.sgpa).toFixed(2));

    let trend = 'stable';
    let color = 'neutral';
    let badgeClass = 'default';
    let label = 'Stable';

    if (totalChange > tolerance) {
      trend = 'improving';
      color = 'green';
      badgeClass = 'success';
      label = 'Improving';
    } else if (totalChange < -tolerance) {
      trend = 'declining';
      const isRed = s3.sgpa < 6.0;
      color = isRed ? 'red' : 'amber';
      badgeClass = isRed ? 'danger' : 'warning';
      label = 'Declining';
    }

    lastThreeTrend = {
      trend,
      color,
      badgeClass,
      label,
      totalChange,
      semesters: [s1, s2, s3],
      text: `${s1.sgpa.toFixed(2)} → ${s2.sgpa.toFixed(2)} → ${s3.sgpa.toFixed(2)}`,
    };
  }

  return {
    bestSemester: { sem: best.sem, sgpa: best.sgpa },
    worstSemester: { sem: worst.sem, sgpa: worst.sgpa },
    averageSgpa,
    largestDrop,
    largestRise,
    latestVsPrevious,
    lastThreeTrend,
  };
}

/**
 * Checks backlog sum consistency
 */
export function computeBacklogConsistency(academics = {}) {
  const semesters = academics.semesters || [];
  const semesterCounts = semesters.map((s) => s.backlogCount ?? 0);
  const semesterSum = academics.semesterBacklogSum ?? semesterCounts.reduce((a, b) => a + b, 0);
  const live = academics.totalLiveBacklogs ?? 0;
  const closed = academics.totalClosedBacklogs ?? 0;
  const sumLiveClosed = live + closed;
  const isConsistent = semesterSum === sumLiveClosed;

  return {
    semesterCounts,
    semesterSum,
    live,
    closed,
    sumLiveClosed,
    isConsistent,
    difference: semesterSum - sumLiveClosed,
    badgeText: isConsistent
      ? `Semester counts (${semesterSum}) = live + closed (${sumLiveClosed}) ✓`
      : `⚠ mismatch: ${semesterSum} vs ${sumLiveClosed}`,
  };
}

/**
 * Evaluates attention level
 */
export function computeAttentionLevel(student, thresholds = {}) {
  const highLive = thresholds.highLiveBacklogs ?? 3;
  const highCgpa = thresholds.highMinCgpa ?? 5.0;
  const medCgpa = thresholds.mediumMinCgpa ?? 6.0;
  const dropLimit = thresholds.sgpaDropThreshold ?? 1.0;

  const live = student?.academics?.totalLiveBacklogs ?? 0;
  const cgpa = student?.academics?.cgpa ?? null;
  const semesters = student?.academics?.semesters || [];

  const semStats = computeSemesterAnalytics(semesters);
  const latestDrop = semStats.latestVsPrevious?.delta !== undefined && semStats.latestVsPrevious.delta < 0
    ? Math.abs(semStats.latestVsPrevious.delta)
    : 0;

  const highReasons = [];
  if (live >= highLive) {
    highReasons.push(`${live} live backlogs`);
  }
  if (cgpa !== null && cgpa < highCgpa) {
    highReasons.push(`CGPA is ${cgpa.toFixed(2)} (< ${highCgpa.toFixed(1)})`);
  }

  if (highReasons.length > 0) {
    return {
      level: 'High',
      badgeClass: 'danger',
      color: 'red',
      reasons: highReasons,
    };
  }

  const medReasons = [];
  if (live >= 1 && live < highLive) {
    medReasons.push(`${live} live backlog${live > 1 ? 's' : ''}`);
  }
  if (cgpa !== null && cgpa < medCgpa) {
    medReasons.push(`CGPA is ${cgpa.toFixed(2)} (< ${medCgpa.toFixed(1)})`);
  }
  if (latestDrop >= dropLimit) {
    medReasons.push(`Latest SGPA dropped by ${latestDrop.toFixed(2)} vs previous semester`);
  }

  if (medReasons.length > 0) {
    return {
      level: 'Medium',
      badgeClass: 'warning',
      color: 'amber',
      reasons: medReasons,
    };
  }

  return {
    level: 'Low',
    badgeClass: 'good',
    color: 'emerald',
    reasons: ['Good academic standing'],
  };
}

/**
 * Placement Eligibility Checker
 */
export function computePlacementEligibility(student, customRules = {}) {
  const rules = {
    minCgpa: customRules.minCgpa ?? config.placementEligibility?.minCgpa ?? 6.0,
    maxLiveBacklogs: customRules.maxLiveBacklogs ?? config.placementEligibility?.maxLiveBacklogs ?? 0,
    requiresPolicySubmission: customRules.requiresPolicySubmission ?? true,
  };

  const cgpa = student?.academics?.cgpa ?? null;
  const live = student?.academics?.totalLiveBacklogs ?? 0;
  const policy = student?.placementPolicySubmitted ?? false;

  const checks = [
    {
      label: `CGPA ≥ ${rules.minCgpa.toFixed(1)}`,
      actual: cgpa !== null ? cgpa.toFixed(2) : 'No CGPA',
      passed: cgpa !== null && cgpa >= rules.minCgpa,
      reason:
        cgpa === null
          ? 'Missing CGPA in academic records'
          : cgpa >= rules.minCgpa
          ? `CGPA ${cgpa.toFixed(2)} meets minimum requirement`
          : `CGPA ${cgpa.toFixed(2)} is below required ${rules.minCgpa.toFixed(1)}`,
    },
    {
      label: `Live Backlogs ≤ ${rules.maxLiveBacklogs}`,
      actual: String(live),
      passed: live <= rules.maxLiveBacklogs,
      reason:
        live <= rules.maxLiveBacklogs
          ? `Zero live backlogs`
          : `${live} live backlog${live > 1 ? 's' : ''} (max allowed: ${rules.maxLiveBacklogs})`,
    },
    {
      label: 'Placement Policy Submitted',
      actual: policy === true ? 'Submitted' : policy === false ? 'Pending' : 'Not recorded',
      passed: rules.requiresPolicySubmission ? policy === true : true,
      reason:
        policy === true
          ? 'Placement undertaking submitted'
          : 'Placement undertaking pending / not submitted',
    },
  ];

  const isEligible = checks.every((c) => c.passed);

  return {
    isEligible,
    statusText: isEligible ? 'Eligible' : 'Not eligible',
    checks,
    rules,
  };
}

/**
 * Returns data-quality observational notes for the student profile
 */
export function getDataNotes(student) {
  const notes = [];

  // Diploma check
  const diploma = student?.diploma;
  if (!diploma || (!diploma.degreeName && !diploma.marks && !diploma.instituteName && !diploma.passingYear)) {
    notes.push({
      key: 'diploma',
      type: 'info',
      title: 'Diploma',
      message: 'Diploma: not applicable (no diploma data in records)',
    });
  }

  // Backlog subject names
  const liveNames = student?.academics?.liveBacklogsText;
  const closedNames = student?.academics?.closedBacklogsText;
  if (!liveNames && !closedNames) {
    notes.push({
      key: 'backlogSubjects',
      type: 'neutral',
      title: 'Backlog Subjects',
      message: 'Subject names not provided in dataset (numeric counts only)',
    });
  }

  // Phone duplication note
  if (student?.whatsappNo && student?.officialPhone && student.whatsappNo === student.officialPhone) {
    notes.push({
      key: 'whatsapp',
      type: 'neutral',
      title: 'WhatsApp Contact',
      message: 'WhatsApp number is same as official mobile contact',
    });
  }

  return notes;
}

/**
 * Combined insights generator
 */
export function generateStudentInsights(student) {
  if (!student) return null;

  const semesterAnalytics = computeSemesterAnalytics(student.academics?.semesters);
  const backlogConsistency = computeBacklogConsistency(student.academics);
  const attention = computeAttentionLevel(student);
  const eligibility = computePlacementEligibility(student);
  const dataNotes = getDataNotes(student);
  const scoreBand = getScoreBand(student.academics?.cgpa);

  return {
    semesterAnalytics,
    backlogConsistency,
    attention,
    eligibility,
    dataNotes,
    scoreBand,
  };
}
