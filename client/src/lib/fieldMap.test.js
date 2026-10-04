import { describe, it, expect } from 'vitest';
import { FIELD_DEFINITIONS, getAllFields } from './fieldMap';

// Sample student fixture
const sampleStudent = {
  sNo: 1,
  rollNo: '2303031460001',
  fullName: 'DEMO STUDENT',
  officialEmail: 'student@campuscompass.edu',
  personalEmail: 'student.demo@example.com',
  officialPhone: '9876543210',
  whatsappNo: '9876543210',
  alternatePhone: '9876543211',
  batch: 2027,
  campus: 'PIET',
  course: 'B.Tech',
  branch: 'CSE - Artificial Intelligence & Machine Learning',
  division: '6AIML4',
  nationality: 'Indian',
  dob: '2004-12-04T00:00:00.000Z',
  tenth: { marks: 100, board: 'BSET', passingYear: 2021 },
  twelfth: { marks: 94.9, board: 'TSBIE', passingYear: 2023 },
  diploma: null,
  academics: {
    cgpa: 5.93,
    liveBacklogsText: null,
    closedBacklogsText: null,
    totalLiveBacklogs: 3,
    totalClosedBacklogs: 3,
    currentPassingYear: 2027,
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
  recordDate: '2026-02-25T00:00:00.000Z',
  raw: {
    _id: '6ab9e3d28843a9eb360c49f5',
    'S no': 1,
    'Roll No': 2303031460001,
    'Full Name': 'DEMO STUDENT',
    'Official Email': 'student@campuscompass.edu',
    'Personal Email': 'student.demo@example.com',
    'Official Phone': 9876543210,
    'Whatsapp No': 9876543210,
    'Alternate Phone': 9876543211,
    'Batch': 2027,
    'Campus': 'PIET',
    'Course': 'B.Tech',
    'Branch': 'CSE - Artificial Intelligence & Machine Learning',
    'Division': '6AIML4',
    'Nationality': 'Indian',
    'DOB': '2004-12-04 00:00:00',
    '10th - Aggregate Marks': 100,
    '10th - Board': 'BSET',
    '10th - Passing Yr': 2021,
    '12th - Aggregate Marks': 94.9,
    '12th - Board': 'TSBIE',
    '12th - Passing Yr': 2023,
    'Diploma Degree Name': null,
    'Diploma - Aggregate Marks': null,
    'Diploma Institute Name': null,
    'Diploma - Passing Yr': null,
    'B': {
      'Tech Current CGPA': 5.93,
    },
    'Total Live Backlog': 3,
    'Total Close Backlog Total': 3,
    'Live Backlogs': null,
    'Closed Backlogs': null,
    '1st SEM (SGPA)': 5.13,
    '1st SEM backlog(if yes)': 1,
    '2nd SEM (SGPA)': 6.15,
    '2nd SEM backlog(if yes)': 0,
    '3rd SEM (SGPA)': 4.18,
    '3rd SEM backlog(if yes)': 2,
    '4th SEM (SGPA)': 5.65,
    '4th SEM backlog(if yes)': 3,
    '5th SEM (SGPA)': 5.9,
    '5th SEM backlog(if yes)': 0,
    'Current Course Passing Yr': 2027,
    'Placement Policy Submitted': 'YES',
    'Remarks': 'DONE',
    'Date': '2026-02-25 00:00:00',
  },
};

const requiredCoverageColumns = [
  'S no',
  'Roll No',
  'Full Name',
  'Official Email',
  'Batch',
  'Campus',
  'Course',
  'Branch',
  'Division',
  'DOB',
  'Official Phone',
  'Whatsapp No',
  'Alternate Phone',
  'Personal Email',
  'Nationality',
  '10th - Aggregate Marks',
  '10th - Board',
  '10th - Passing Yr',
  '12th - Aggregate Marks',
  '12th - Board',
  '12th - Passing Yr',
  'Diploma Degree Name',
  'Diploma - Aggregate Marks',
  'Diploma Institute Name',
  'Diploma - Passing Yr',
  'B',
  'Total Live Backlog',
  'Total Close Backlog Total',
  'Live Backlogs',
  'Closed Backlogs',
  '1st SEM (SGPA)',
  '1st SEM backlog(if yes)',
  '2nd SEM (SGPA)',
  '2nd SEM backlog(if yes)',
  '3rd SEM (SGPA)',
  '3rd SEM backlog(if yes)',
  '4th SEM (SGPA)',
  '4th SEM backlog(if yes)',
  '5th SEM (SGPA)',
  '5th SEM backlog(if yes)',
  'Current Course Passing Yr',
  'Placement Policy Submitted',
  'Remarks',
  'Date',
];

describe('Field Coverage & Canonical Field Mapping', () => {
  it('FIELD_DEFINITIONS must have complete definitions with label, group, where, icon, format', () => {
    expect(FIELD_DEFINITIONS.length).toBeGreaterThanOrEqual(40);
    FIELD_DEFINITIONS.forEach((def) => {
      expect(def.rawKey).toBeDefined();
      expect(def.label).toBeDefined();
      expect(def.group).toBeDefined();
      expect(def.where).toBeDefined();
      expect(def.icon).toBeDefined();
      expect(typeof def.format).toBe('function');
    });
  });

  it('getAllFields must flatten raw (including nested B) and produce a row for every key in sample student', () => {
    const allFields = getAllFields(sampleStudent);
    expect(allFields.length).toBeGreaterThanOrEqual(Object.keys(sampleStudent.raw).length);

    const mappedKeySet = new Set(allFields.map((f) => f.rawKey));

    // Every key in raw except B itself (which was expanded to B.Tech Current CGPA) must exist
    Object.keys(sampleStudent.raw).forEach((k) => {
      if (k === 'B') {
        expect(mappedKeySet.has('B.Tech Current CGPA')).toBe(true);
      } else {
        expect(mappedKeySet.has(k)).toBe(true);
      }
    });
  });

  it('asserts that every key in requiredCoverageColumns produces a mapped row with valid formatted value', () => {
    const allFields = getAllFields(sampleStudent);
    const fieldMap = new Map(allFields.map((f) => [f.rawKey, f]));

    requiredCoverageColumns.forEach((colKey) => {
      let keyToLookup = colKey;
      if (colKey === 'B') keyToLookup = 'B.Tech Current CGPA';

      const field = fieldMap.get(keyToLookup);
      expect(field, `Column "${colKey}" must produce a row in All Fields`).toBeDefined();
      expect(field.label).toBeTruthy();
      expect(field.where).toBeTruthy();
      expect(field.formatted).toBeDefined();
    });
  });

  it('ensures every key is designated to at least one profile component location', () => {
    const allFields = getAllFields(sampleStudent);
    allFields.forEach((field) => {
      expect(field.where.length).toBeGreaterThan(0);
      expect(field.where).not.toBe('unmapped');
    });
  });
});
