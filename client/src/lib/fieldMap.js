/**
 * Campus Compass — Canonical Field Mapping and Coverage System
 * Connects raw CSV/MongoDB columns to normalized fields, UI components, groups, and formatters.
 */

export function formatUtcDate(val) {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d.getTime())) return '—';
  const year = d.getUTCFullYear();
  if (year < 1950 || year > 2099) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}

export const formatDate = formatUtcDate;

export function shortBranch(branch) {
  if (!branch) return '—';
  const b = String(branch).trim();
  
  if (/CSE\s*-\s*Artificial\s*Intelligence\s*(&|and)\s*Machine\s*Learning/i.test(b)) return 'CSE-AIML';
  if (/CSE\s*-\s*AI\s*(&|and)\s*ML/i.test(b)) return 'CSE-AIML';
  if (/Computer\s*Science\s*(&|and)\s*Engineering/i.test(b)) return 'CSE';
  if (/Information\s*Technology/i.test(b)) return 'IT';
  if (/Mechanical\s*Engineering/i.test(b)) return 'MECH';
  if (/Civil\s*Engineering/i.test(b)) return 'CIVIL';
  if (/Electrical\s*Engineering/i.test(b)) return 'EE';
  if (/Electronics\s*(&|and)\s*Communication/i.test(b)) return 'ECE';
  if (/Chemical\s*Engineering/i.test(b)) return 'CHEM';
  if (/Aeronautical\s*Engineering/i.test(b)) return 'AERO';
  if (/Biomedical\s*Engineering/i.test(b)) return 'BIOMED';

  if (b.startsWith('CSE - ')) {
    const suffix = b.replace('CSE - ', '');
    const acronym = suffix.split(/\s+/).filter(w => !/^(and|&|of|in|the)$/i.test(w)).map(w => w[0]).join('').toUpperCase();
    return `CSE-${acronym}`;
  }

  if (b.length <= 10) return b;

  return b
    .replace(/\bEngineering\b/gi, 'Engg')
    .replace(/\bTechnology\b/gi, 'Tech')
    .replace(/\bManagement\b/gi, 'Mgmt');
}

export function formatPhone(val) {
  if (!val) return '—';
  const s = String(val).trim();
  if (s.length === 10) {
    return `${s.slice(0, 5)} ${s.slice(5)}`;
  }
  return s;
}

export function formatScore(val, suffix = '') {
  if (val === null || val === undefined || val === '') return '—';
  const n = Number(val);
  if (isNaN(n)) return String(val);
  return `${Number(n.toFixed(2))}${suffix}`;
}

export const FIELD_DEFINITIONS = [
  {
    rawKey: 'S no',
    normPath: 'sNo',
    label: 'Serial Number',
    group: 'Identification',
    where: 'header, all-fields',
    icon: 'Hash',
    format: (v) => (v !== null && v !== undefined ? `#${v}` : '—'),
  },
  {
    rawKey: 'Roll No',
    normPath: 'rollNo',
    label: 'Roll Number / Enrollment',
    group: 'Identification',
    where: 'header, table, search, all-fields',
    icon: 'CreditCard',
    format: (v) => (v ? String(v) : '—'),
  },
  {
    rawKey: 'Full Name',
    normPath: 'fullName',
    label: 'Full Name',
    group: 'Identification',
    where: 'header, table, search, all-fields',
    icon: 'User',
    format: (v) => (v ? String(v) : '—'),
  },
  {
    rawKey: 'Official Email',
    normPath: 'officialEmail',
    label: 'Official Email',
    group: 'Contact & Personal',
    where: 'contact, all-fields',
    icon: 'Mail',
    format: (v) => (v ? String(v) : '—'),
  },
  {
    rawKey: 'Personal Email',
    normPath: 'personalEmail',
    label: 'Personal Email',
    group: 'Contact & Personal',
    where: 'contact, all-fields',
    icon: 'Mail',
    format: (v) => (v ? String(v) : '—'),
  },
  {
    rawKey: 'Official Phone',
    normPath: 'officialPhone',
    label: 'Official Phone',
    group: 'Contact & Personal',
    where: 'contact, search, all-fields',
    icon: 'Phone',
    format: formatPhone,
  },
  {
    rawKey: 'Whatsapp No',
    normPath: 'whatsappNo',
    label: 'WhatsApp Phone',
    group: 'Contact & Personal',
    where: 'contact, search, all-fields',
    icon: 'MessageCircle',
    format: formatPhone,
  },
  {
    rawKey: 'Alternate Phone',
    normPath: 'alternatePhone',
    label: 'Alternate Phone',
    group: 'Contact & Personal',
    where: 'contact, all-fields',
    icon: 'PhoneCall',
    format: formatPhone,
  },
  {
    rawKey: 'Batch',
    normPath: 'batch',
    label: 'Graduation Batch',
    group: 'Academic Profile',
    where: 'header, table, filters, cohort, all-fields',
    icon: 'Calendar',
    format: (v) => (v ? `Batch ${v}` : '—'),
  },
  {
    rawKey: 'Campus',
    normPath: 'campus',
    label: 'Campus / Institute',
    group: 'Academic Profile',
    where: 'header, table, filters, all-fields',
    icon: 'Building2',
    format: (v) => (v ? String(v) : '—'),
  },
  {
    rawKey: 'Course',
    normPath: 'course',
    label: 'Course / Degree Program',
    group: 'Academic Profile',
    where: 'header, table, filters, all-fields',
    icon: 'BookOpen',
    format: (v) => (v ? String(v) : '—'),
  },
  {
    rawKey: 'Branch',
    normPath: 'branch',
    label: 'Engineering Branch',
    group: 'Academic Profile',
    where: 'header, table, filters, cohort, all-fields',
    icon: 'GitBranch',
    format: (v) => (v ? String(v) : '—'),
  },
  {
    rawKey: 'Division',
    normPath: 'division',
    label: 'Class Division / Section',
    group: 'Academic Profile',
    where: 'header, table, filters, cohort, all-fields',
    icon: 'Users',
    format: (v) => (v ? String(v) : '—'),
  },
  {
    rawKey: 'Nationality',
    normPath: 'nationality',
    label: 'Nationality',
    group: 'Contact & Personal',
    where: 'header, personal, all-fields',
    icon: 'Flag',
    format: (v) => (v ? String(v) : '—'),
  },
  {
    rawKey: 'DOB',
    normPath: 'dob',
    label: 'Date of Birth',
    group: 'Contact & Personal',
    where: 'personal, all-fields',
    icon: 'CalendarDays',
    format: formatUtcDate,
  },
  {
    rawKey: '10th - Aggregate Marks',
    normPath: 'tenth.marks',
    label: '10th Secondary Marks',
    group: 'Academic Journey',
    where: 'journey, radar, kpi, all-fields',
    icon: 'Award',
    format: (v) => (v !== null && v !== undefined ? formatScore(v) : '—'),
  },
  {
    rawKey: '10th - Board',
    normPath: 'tenth.board',
    label: '10th Examination Board',
    group: 'Academic Journey',
    where: 'journey, all-fields',
    icon: 'Bookmark',
    format: (v) => (v ? String(v) : '—'),
  },
  {
    rawKey: '10th - Passing Yr',
    normPath: 'tenth.passingYear',
    label: '10th Passing Year',
    group: 'Academic Journey',
    where: 'journey, all-fields',
    icon: 'Calendar',
    format: (v) => (v ? String(v) : '—'),
  },
  {
    rawKey: '12th - Aggregate Marks',
    normPath: 'twelfth.marks',
    label: '12th Higher Secondary Marks',
    group: 'Academic Journey',
    where: 'journey, radar, kpi, all-fields',
    icon: 'Award',
    format: (v) => (v !== null && v !== undefined ? formatScore(v) : '—'),
  },
  {
    rawKey: '12th - Board',
    normPath: 'twelfth.board',
    label: '12th Examination Board',
    group: 'Academic Journey',
    where: 'journey, all-fields',
    icon: 'Bookmark',
    format: (v) => (v ? String(v) : '—'),
  },
  {
    rawKey: '12th - Passing Yr',
    normPath: 'twelfth.passingYear',
    label: '12th Passing Year',
    group: 'Academic Journey',
    where: 'journey, all-fields',
    icon: 'Calendar',
    format: (v) => (v ? String(v) : '—'),
  },
  {
    rawKey: 'Diploma Degree Name',
    normPath: 'diploma.degreeName',
    label: 'Diploma Degree Name',
    group: 'Academic Journey',
    where: 'journey, all-fields',
    icon: 'GraduationCap',
    format: (v) => (v ? String(v) : 'Not applicable'),
  },
  {
    rawKey: 'Diploma - Aggregate Marks',
    normPath: 'diploma.marks',
    label: 'Diploma Aggregate Marks',
    group: 'Academic Journey',
    where: 'journey, radar, all-fields',
    icon: 'Award',
    format: (v) => (v !== null && v !== undefined ? formatScore(v) : 'Not applicable'),
  },
  {
    rawKey: 'Diploma Institute Name',
    normPath: 'diploma.instituteName',
    label: 'Diploma Institute',
    group: 'Academic Journey',
    where: 'journey, all-fields',
    icon: 'School',
    format: (v) => (v ? String(v) : 'Not applicable'),
  },
  {
    rawKey: 'Diploma - Passing Yr',
    normPath: 'diploma.passingYear',
    label: 'Diploma Passing Year',
    group: 'Academic Journey',
    where: 'journey, all-fields',
    icon: 'Calendar',
    format: (v) => (v ? String(v) : 'Not applicable'),
  },
  {
    rawKey: 'B.Tech Current CGPA',
    normPath: 'academics.cgpa',
    label: 'B.Tech Current CGPA',
    group: 'Current Academics',
    where: 'header, kpi, radar, cohort, table, all-fields',
    icon: 'Gauge',
    format: (v) => (v !== null && v !== undefined ? Number(v).toFixed(2) : '—'),
  },
  {
    rawKey: 'B.Tech Current CGPA_nested',
    normPath: 'academics.cgpa',
    label: 'B.Tech Current CGPA (Nested B)',
    group: 'Current Academics',
    where: 'header, all-fields',
    icon: 'Gauge',
    format: (v) => (v !== null && v !== undefined ? Number(v).toFixed(2) : '—'),
  },
  {
    rawKey: 'Total Live Backlog',
    normPath: 'academics.totalLiveBacklogs',
    label: 'Total Live Backlogs',
    group: 'Backlogs',
    where: 'header, kpi, backlogs, badges, donut, table, all-fields',
    icon: 'AlertCircle',
    format: (v) => String(v ?? 0),
  },
  {
    rawKey: 'Total Close Backlog Total',
    normPath: 'academics.totalClosedBacklogs',
    label: 'Total Closed Backlogs',
    group: 'Backlogs',
    where: 'header, kpi, backlogs, badges, donut, table, all-fields',
    icon: 'CheckCircle2',
    format: (v) => String(v ?? 0),
  },
  {
    rawKey: 'Live Backlogs',
    normPath: 'academics.liveBacklogsText',
    label: 'Live Backlogs (Subject Names)',
    group: 'Backlogs',
    where: 'backlogs, all-fields',
    icon: 'FileText',
    format: (v) => (v ? String(v) : 'Subject names not provided in dataset'),
  },
  {
    rawKey: 'Closed Backlogs',
    normPath: 'academics.closedBacklogsText',
    label: 'Closed Backlogs (Subject Names)',
    group: 'Backlogs',
    where: 'backlogs, all-fields',
    icon: 'FileCheck',
    format: (v) => (v ? String(v) : 'Subject names not provided in dataset'),
  },
  {
    rawKey: '1st SEM (SGPA)',
    normPath: 'academics.semesters.0.sgpa',
    label: '1st Semester SGPA',
    group: 'Current Academics',
    where: 'semesters, scorecards, charts, table, all-fields',
    icon: 'TrendingUp',
    format: (v) => (v !== null && v !== undefined ? Number(v).toFixed(2) : '—'),
  },
  {
    rawKey: '1st SEM backlog(if yes)',
    normPath: 'academics.semesters.0.backlogCount',
    label: '1st Semester Backlog Count',
    group: 'Backlogs',
    where: 'semesters, scorecards, charts, table, all-fields',
    icon: 'AlertTriangle',
    format: (v) => (v !== null && v !== undefined ? String(v) : '0'),
  },
  {
    rawKey: '2nd SEM (SGPA)',
    normPath: 'academics.semesters.1.sgpa',
    label: '2nd Semester SGPA',
    group: 'Current Academics',
    where: 'semesters, scorecards, charts, table, all-fields',
    icon: 'TrendingUp',
    format: (v) => (v !== null && v !== undefined ? Number(v).toFixed(2) : '—'),
  },
  {
    rawKey: '2nd SEM backlog(if yes)',
    normPath: 'academics.semesters.1.backlogCount',
    label: '2nd Semester Backlog Count',
    group: 'Backlogs',
    where: 'semesters, scorecards, charts, table, all-fields',
    icon: 'AlertTriangle',
    format: (v) => (v !== null && v !== undefined ? String(v) : '0'),
  },
  {
    rawKey: '3rd SEM (SGPA)',
    normPath: 'academics.semesters.2.sgpa',
    label: '3rd Semester SGPA',
    group: 'Current Academics',
    where: 'semesters, scorecards, charts, table, all-fields',
    icon: 'TrendingUp',
    format: (v) => (v !== null && v !== undefined ? Number(v).toFixed(2) : '—'),
  },
  {
    rawKey: '3rd SEM backlog(if yes)',
    normPath: 'academics.semesters.2.backlogCount',
    label: '3rd Semester Backlog Count',
    group: 'Backlogs',
    where: 'semesters, scorecards, charts, table, all-fields',
    icon: 'AlertTriangle',
    format: (v) => (v !== null && v !== undefined ? String(v) : '0'),
  },
  {
    rawKey: '4th SEM (SGPA)',
    normPath: 'academics.semesters.3.sgpa',
    label: '4th Semester SGPA',
    group: 'Current Academics',
    where: 'semesters, scorecards, charts, table, all-fields',
    icon: 'TrendingUp',
    format: (v) => (v !== null && v !== undefined ? Number(v).toFixed(2) : '—'),
  },
  {
    rawKey: '4th SEM backlog(if yes)',
    normPath: 'academics.semesters.3.backlogCount',
    label: '4th Semester Backlog Count',
    group: 'Backlogs',
    where: 'semesters, scorecards, charts, table, all-fields',
    icon: 'AlertTriangle',
    format: (v) => (v !== null && v !== undefined ? String(v) : '0'),
  },
  {
    rawKey: '5th SEM (SGPA)',
    normPath: 'academics.semesters.4.sgpa',
    label: '5th Semester SGPA',
    group: 'Current Academics',
    where: 'semesters, scorecards, charts, table, all-fields',
    icon: 'TrendingUp',
    format: (v) => (v !== null && v !== undefined ? Number(v).toFixed(2) : '—'),
  },
  {
    rawKey: '5th SEM backlog(if yes)',
    normPath: 'academics.semesters.4.backlogCount',
    label: '5th Semester Backlog Count',
    group: 'Backlogs',
    where: 'semesters, scorecards, charts, table, all-fields',
    icon: 'AlertTriangle',
    format: (v) => (v !== null && v !== undefined ? String(v) : '0'),
  },
  {
    rawKey: 'Current Course Passing Yr',
    normPath: 'academics.currentPassingYear',
    label: 'Current Course Expected Passing Year',
    group: 'Academic Profile',
    where: 'journey, timeline, all-fields',
    icon: 'CalendarCheck',
    format: (v) => (v ? `Expected graduation ${v}` : '—'),
  },
  {
    rawKey: 'Placement Policy Submitted',
    normPath: 'placementPolicySubmitted',
    label: 'Placement Policy Status',
    group: 'Placement',
    where: 'placement, badges, filter, all-fields',
    icon: 'ShieldCheck',
    format: (v, student) => {
      let val = v;
      if (student && student.placementPolicySubmitted !== undefined) {
        val = student.placementPolicySubmitted;
      } else if (typeof v === 'string') {
        const s = v.trim().toUpperCase();
        if (['YES', 'Y', '1', 'TRUE'].includes(s)) val = true;
        else if (['NO', 'N', '0', 'FALSE'].includes(s)) val = false;
        else val = null;
      }
      if (val === true) return 'Policy submitted';
      if (val === false) return 'Not submitted';
      return 'Not recorded';
    },
  },
  {
    rawKey: 'Remarks',
    normPath: 'remarks',
    label: 'Administrative Remarks',
    group: 'Placement',
    where: 'header, overview, placement, all-fields',
    icon: 'StickyNote',
    format: (v) => (v ? String(v) : '—'),
  },
  {
    rawKey: 'Date',
    normPath: 'recordDate',
    label: 'Record Snapshot Date',
    group: 'System & Metadata',
    where: 'header, footer, all-fields',
    icon: 'Clock',
    format: (v) => (v ? `Data as of ${formatUtcDate(v)}` : '—'),
  },
  {
    rawKey: '_id',
    normPath: '_id',
    label: 'System Document ID',
    group: 'System & Metadata',
    where: 'all-fields',
    icon: 'Database',
    format: (v) => (v ? String(v) : '—'),
  },
  {
    rawKey: 'Unnamed: 44',
    normPath: 'raw.Unnamed: 44',
    label: 'Supplemental Notes',
    group: 'System & Metadata',
    where: 'all-fields',
    icon: 'FileQuestion',
    format: (v) => (v ? String(v) : '—'),
  },
];

/**
 * Returns a complete, flattened list of all fields present in student or student.raw
 */
export function getAllFields(student) {
  if (!student) return [];

  const raw = student.raw || {};
  const flattenedRaw = {};

  // Flatten raw including nested B
  Object.keys(raw).forEach((k) => {
    if (k === 'B' && typeof raw.B === 'object' && raw.B !== null) {
      Object.keys(raw.B).forEach((bKey) => {
        flattenedRaw[`B.${bKey}`] = raw.B[bKey];
      });
    } else {
      flattenedRaw[k] = raw[k];
    }
  });

  // Make sure standard fields from raw are represented
  const fieldMapByRawKey = new Map();
  FIELD_DEFINITIONS.forEach((def) => {
    fieldMapByRawKey.set(def.rawKey, def);
    if (def.rawKey === 'B.Tech Current CGPA') {
      fieldMapByRawKey.set('B.Tech Current CGPA', def);
      fieldMapByRawKey.set('B.Tech Current CGPA_nested', def);
      fieldMapByRawKey.set('B.Tech Current CGPA', def);
    }
  });

  const resultRows = [];
  const processedKeys = new Set();

  // Process all keys in flattenedRaw
  Object.keys(flattenedRaw).forEach((key) => {
    let lookupKey = key;
    if (key === 'B.Tech Current CGPA' || key === 'Tech Current CGPA') {
      lookupKey = 'B.Tech Current CGPA';
    }

    const def = fieldMapByRawKey.get(lookupKey) || fieldMapByRawKey.get(key);
    const rawVal = flattenedRaw[key];
    const valType = rawVal === null ? 'null' : Array.isArray(rawVal) ? 'array' : typeof rawVal;

    let formatted = '—';
    if (def && typeof def.format === 'function') {
      formatted = def.format(rawVal, student);
    } else if (rawVal !== null && rawVal !== undefined && rawVal !== '') {
      formatted = String(rawVal);
    }

    resultRows.push({
      key,
      rawKey: key,
      label: def?.label || key,
      group: def?.group || 'Other Fields',
      where: def?.where || 'all-fields',
      icon: def?.icon || 'HelpCircle',
      rawValue: rawVal,
      type: valType,
      formatted,
    });
    processedKeys.add(key);
  });

  // Also ensure any field definitions that map to normalized fields not in raw are included
  FIELD_DEFINITIONS.forEach((def) => {
    if (def.rawKey !== '_id' && !processedKeys.has(def.rawKey) && !def.rawKey.startsWith('B.')) {
      if (!flattenedRaw.hasOwnProperty(def.rawKey)) {
        resultRows.push({
          key: def.rawKey,
          rawKey: def.rawKey,
          label: def.label,
          group: def.group,
          where: def.where,
          icon: def.icon,
          rawValue: null,
          type: 'null',
          formatted: def.format ? def.format(null, student) : '—',
        });
      }
    }
  });

  return resultRows;
}
