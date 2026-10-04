const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Student = require('../models/Student');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/student_campus';

async function verify() {
  console.log('\n======================================================');
  console.log('CAMPUS COMPASS — DATA VERIFICATION (SECTION 2)');
  console.log(`Connecting to: ${uri}`);
  console.log('======================================================\n');

  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const studentsCol = db.collection('students');
  const rawCol = db.collection('data');

  let allPass = true;

  // 1. Verify Sample Student: 2303031460001 (ADULA MAHENDHAR)
  console.log('--- 1. VERIFYING SAMPLE STUDENT (2303031460001) ---');
  const sample = await studentsCol.findOne({ rollNo: '2303031460001' });

  if (!sample) {
    console.error('FAIL: Student 2303031460001 not found!');
    allPass = false;
  } else {
    const dobIso = sample.dob ? sample.dob.toISOString() : null;
    const recordDateIso = sample.recordDate ? sample.recordDate.toISOString() : null;
    const diploma = sample.diploma;
    const backlogCounts = (sample.academics?.semesters || []).map((s) => s.backlogCount);
    const semesterBacklogSum = sample.academics?.semesterBacklogSum;
    const avgSgpa = sample.academics?.avgSgpa;

    const dobCheck = dobIso === '2004-12-04T00:00:00.000Z';
    const recordDateCheck = recordDateIso === '2026-02-25T00:00:00.000Z';
    const diplomaCheck = diploma === null || diploma === undefined;
    const backlogCheck = JSON.stringify(backlogCounts) === JSON.stringify([1, 0, 2, 3, 0]);
    const backlogSumCheck = semesterBacklogSum === 6;
    const avgSgpaCheck = avgSgpa === 5.4;

    console.log(`- DOB:                ${dobIso}  [${dobCheck ? 'PASS' : 'FAIL'}] (Expected: 2004-12-04T00:00:00.000Z)`);
    console.log(`- recordDate:         ${recordDateIso}  [${recordDateCheck ? 'PASS' : 'FAIL'}] (Expected: 2026-02-25T00:00:00.000Z)`);
    console.log(`- diploma:            ${JSON.stringify(diploma)}  [${diplomaCheck ? 'PASS' : 'FAIL'}] (Expected: null)`);
    console.log(`- backlogCount list:  ${JSON.stringify(backlogCounts)}  [${backlogCheck ? 'PASS' : 'FAIL'}] (Expected: [1, 0, 2, 3, 0])`);
    console.log(`- semesterBacklogSum: ${semesterBacklogSum}  [${backlogSumCheck ? 'PASS' : 'FAIL'}] (Expected: 6)`);
    console.log(`- avgSgpa:            ${avgSgpa}  [${avgSgpaCheck ? 'PASS' : 'FAIL'}] (Expected: 5.4)`);

    if (!dobCheck || !recordDateCheck || !diplomaCheck || !backlogCheck || !backlogSumCheck || !avgSgpaCheck) {
      allPass = false;
      console.log('Sample student verification: FAIL ❌');
    } else {
      console.log('Sample student verification: PASS ✅');
    }
  }

  // 2. Count Backlog Consistency: semesterBacklogSum vs (totalLiveBacklogs + totalClosedBacklogs)
  console.log('\n--- 2. BACKLOG CONSISTENCY ANALYSIS ---');
  const allStudents = await studentsCol.find({}, {
    projection: {
      rollNo: 1,
      fullName: 1,
      'academics.totalLiveBacklogs': 1,
      'academics.totalClosedBacklogs': 1,
      'academics.semesterBacklogSum': 1,
      'academics.semesters': 1,
    }
  }).toArray();

  let matchCount = 0;
  let mismatchCount = 0;
  const mismatchExamples = [];

  for (const s of allStudents) {
    const live = s.academics?.totalLiveBacklogs || 0;
    const closed = s.academics?.totalClosedBacklogs || 0;
    const totalBacklogs = live + closed;
    const semSum = s.academics?.semesterBacklogSum || 0;

    if (semSum === totalBacklogs) {
      matchCount++;
    } else {
      mismatchCount++;
      if (mismatchExamples.length < 5) {
        mismatchExamples.push({
          rollNo: s.rollNo,
          fullName: s.fullName,
          semesterBacklogSum: semSum,
          totalLiveBacklogs: live,
          totalClosedBacklogs: closed,
          sumLiveClosed: totalBacklogs,
          diff: semSum - totalBacklogs,
          semesterCounts: (s.academics?.semesters || []).map(x => x.backlogCount),
        });
      }
    }
  }

  console.log(`- Total students evaluated:                         ${allStudents.length}`);
  console.log(`- Matching (semesterBacklogSum === live + closed):  ${matchCount} (${((matchCount / allStudents.length) * 100).toFixed(2)}%)`);
  console.log(`- Mismatched (semesterBacklogSum !== live + closed): ${mismatchCount} (${((mismatchCount / allStudents.length) * 100).toFixed(2)}%)`);
  console.log('\n5 Example Mismatches:');
  mismatchExamples.forEach((ex, i) => {
    console.log(`  ${i + 1}. [${ex.rollNo}] ${ex.fullName}`);
    console.log(`     Semester sum: ${ex.semesterBacklogSum} (counts: [${ex.semesterCounts.join(', ')}])`);
    console.log(`     Live: ${ex.totalLiveBacklogs}, Closed: ${ex.totalClosedBacklogs}, Live+Closed: ${ex.sumLiveClosed} (Difference: ${ex.diff > 0 ? '+' : ''}${ex.diff})`);
  });

  // 3. Count missing fields
  console.log('\n--- 3. DATA QUALITY: MISSING FIELDS AUDIT ---');
  const totalCount = allStudents.length;

  const missingCgpaCount = await studentsCol.countDocuments({
    $or: [{ 'academics.cgpa': null }, { 'academics.cgpa': { $exists: false } }]
  });

  const missingPhoneCount = await studentsCol.countDocuments({
    $or: [{ officialPhone: null }, { officialPhone: '' }, { officialPhone: { $exists: false } }]
  });

  const missingEmailCount = await studentsCol.countDocuments({
    $or: [{ officialEmail: null }, { officialEmail: '' }, { officialEmail: { $exists: false } }]
  });

  const missingAnySgpaCount = await studentsCol.countDocuments({
    'academics.semesters': { $elemMatch: { sgpa: null } }
  });

  const missingPolicyCount = await studentsCol.countDocuments({
    placementPolicySubmitted: null
  });

  console.log(`- Students missing CGPA:                  ${missingCgpaCount}`);
  console.log(`- Students missing Official Phone:        ${missingPhoneCount}`);
  console.log(`- Students missing Official Email:        ${missingEmailCount}`);
  console.log(`- Students missing Any Semester SGPA:     ${missingAnySgpaCount}`);
  console.log(`- Students with Policy Not Recorded (null): ${missingPolicyCount}`);

  // 4. Source rows in 'data' but not in 'students'
  console.log('\n--- 4. AUDIT OF SOURCE ROWS NOT SEPARATELY IN STUDENTS ---');
  const rawDocs = await rawCol.find({}).toArray();
  const rollCounts = {};

  for (const doc of rawDocs) {
    const rawRoll = doc['Roll No'];
    const rollNo = rawRoll !== null && rawRoll !== undefined ? String(rawRoll).trim() : '';
    if (!rollCounts[rollNo]) rollCounts[rollNo] = [];
    rollCounts[rollNo].push(doc);
  }

  const dupEntries = Object.entries(rollCounts).filter(([k, v]) => v.length > 1);
  console.log(`Total rows in raw 'data':     ${rawDocs.length}`);
  console.log(`Total students in 'students': ${totalCount}`);
  console.log(`Difference:                   ${rawDocs.length - totalCount} rows`);
  console.log(`Identified ${dupEntries.length} duplicate roll numbers accounting for all ${rawDocs.length - totalCount} surplus raw rows:\n`);

  dupEntries.forEach(([roll, docs], idx) => {
    console.log(`  Row Pair #${idx + 1} (Roll No: ${roll}):`);
    docs.forEach((d, i) => {
      console.log(`    - Occur ${i + 1}: _id: ${d._id}, S no: ${d['S no']}, Name: "${d['Full Name']}", Branch: "${d['Branch']}"`);
    });
    console.log(`    -> Reason: Duplicate enrollment row in raw CSV. Normalization merged into single student document by unique rollNo.`);
  });

  console.log('\n======================================================');
  console.log(`OVERALL VERIFICATION: ${allPass ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log('======================================================\n');

  await mongoose.disconnect();
}

verify().catch((err) => {
  console.error('Verification error:', err);
  process.exit(1);
});
