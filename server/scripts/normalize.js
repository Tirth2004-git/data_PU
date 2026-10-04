const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Student = require('../models/Student');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/student_campus';

function cleanString(val) {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  if (!s || s.toLowerCase() === 'na' || s.toLowerCase() === 'n/a' || s.toLowerCase() === 'null') {
    return null;
  }
  return s;
}

function parseNumber(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') {
    return isNaN(val) ? null : val;
  }
  const s = String(val).trim();
  if (!s || s.toLowerCase() === 'na' || s.toLowerCase() === 'n/a' || s.toLowerCase() === 'null') return null;
  const n = Number(s);
  return isNaN(n) ? null : n;
}

/**
 * Parse date strings like 'YYYY-MM-DD HH:mm:ss' or 'YYYY-MM-DD' with Date.UTC
 * ensuring dates are stored at UTC midnight T00:00:00.000Z.
 */
function parseUtcDate(val) {
  if (val === null || val === undefined) return null;
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    return new Date(Date.UTC(val.getUTCFullYear(), val.getUTCMonth(), val.getUTCDate(), 0, 0, 0, 0));
  }
  const s = String(val).trim();
  if (!s || s.toLowerCase() === 'na' || s.toLowerCase() === 'null') return null;

  // Match ISO YYYY-MM-DD or YYYY/MM/DD
  const m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (m) {
    const y = parseInt(m[1], 10);
    const mon = parseInt(m[2], 10);
    const day = parseInt(m[3], 10);
    return new Date(Date.UTC(y, mon - 1, day, 0, 0, 0, 0));
  }

  // Fallback
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0));
  }
  return null;
}

function validateRecordDate(rawVal, rollNo) {
  const d = parseUtcDate(rawVal);
  if (!d) return null;
  const year = d.getUTCFullYear();
  const currentYear = new Date().getFullYear();
  if (year < 2000 || year > currentYear + 1) {
    console.warn(`[Invalid recordDate] Student ${rollNo}: raw '${rawVal}', parsed year ${year} -> set to null`);
    return null;
  }
  return d;
}

function validateDob(rawVal, rollNo) {
  const d = parseUtcDate(rawVal);
  if (!d) return null;
  const year = d.getUTCFullYear();
  if (year < 1980 || year > 2015) {
    console.warn(`[Invalid DOB] Student ${rollNo}: raw '${rawVal}', parsed year ${year} -> set to null`);
    return null;
  }
  return d;
}

function getOrdinal(sem) {
  if (sem === 1) return '1st';
  if (sem === 2) return '2nd';
  if (sem === 3) return '3rd';
  if (sem === 4) return '4th';
  if (sem === 5) return '5th';
  return `${sem}th`;
}

function cleanPhone(val) {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  if (!s || s.toLowerCase() === 'na' || s.toLowerCase() === 'null') return null;
  return s;
}

function parsePolicy(val) {
  if (val === null || val === undefined) return null;
  const s = String(val).trim().toUpperCase();
  if (!s || s === 'NA' || s === 'NULL') return null;
  if (['YES', 'Y', '1', 'TRUE'].includes(s)) return true;
  if (['NO', 'N', '0', 'FALSE'].includes(s)) return false;
  return null;
}

async function normalize() {
  console.log(`\n======================================================`);
  console.log(`Starting Data Normalization v2 on ${uri}`);
  console.log(`======================================================\n`);

  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const rawCol = db.collection('data');
  const studentsCol = db.collection('students');

  const totalRaw = await rawCol.countDocuments();
  console.log(`Found ${totalRaw} documents in raw 'data' collection.`);

  const cursor = rawCol.find({});
  let readCount = 0;
  let missingRollNoCount = 0;
  let missingNameCount = 0;
  let upsertedCount = 0;

  let batch = [];
  const BATCH_SIZE = 500;
  const sampleCleanDocs = [];

  while (await cursor.hasNext()) {
    const rawDoc = await cursor.next();
    readCount++;

    const rawRoll = rawDoc['Roll No'];
    const rollNo = rawRoll !== null && rawRoll !== undefined ? String(rawRoll).trim() : '';
    const rawFullName = rawDoc['Full Name'];
    const fullName = rawFullName !== null && rawFullName !== undefined ? String(rawFullName).trim() : '';

    if (!rollNo) {
      missingRollNoCount++;
      console.warn(`[WARN] Doc _id: ${rawDoc._id} is missing 'Roll No'. Skipping normalization for this doc.`);
      continue;
    }

    if (!fullName) {
      missingNameCount++;
      console.warn(`[WARN] Roll No: ${rollNo} has missing 'Full Name'.`);
    }

    const nameLower = fullName.toLowerCase().replace(/\s+/g, ' ');
    const nameTokens = Array.from(
      new Set(
        nameLower
          .split(/[^a-z0-9]+/)
          .map((t) => t.trim())
          .filter((t) => t.length > 0)
      )
    );

    // Dates parsed at UTC midnight with strict year sanity checks
    const dob = validateDob(rawDoc['DOB'], rollNo);
    const recordDate = validateRecordDate(rawDoc['Date'], rollNo);

    const tenth = {
      marks: parseNumber(rawDoc['10th - Aggregate Marks']),
      board: cleanString(rawDoc['10th - Board']),
      passingYear: parseNumber(rawDoc['10th - Passing Yr']),
    };

    const twelfth = {
      marks: parseNumber(rawDoc['12th - Aggregate Marks']),
      board: cleanString(rawDoc['12th - Board']),
      passingYear: parseNumber(rawDoc['12th - Passing Yr']),
    };

    // Diploma: null if all four fields empty/null
    const diplomaDegree = cleanString(rawDoc['Diploma Degree Name']);
    const diplomaMarks = parseNumber(rawDoc['Diploma - Aggregate Marks']);
    const diplomaInstitute = cleanString(rawDoc['Diploma Institute Name']);
    const diplomaYear = parseNumber(rawDoc['Diploma - Passing Yr']);

    let diploma = null;
    if (diplomaDegree !== null || diplomaMarks !== null || diplomaInstitute !== null || diplomaYear !== null) {
      diploma = {
        degreeName: diplomaDegree,
        marks: diplomaMarks,
        instituteName: diplomaInstitute,
        passingYear: diplomaYear,
      };
    }

    // CGPA resolution: rawDoc.B["Tech Current CGPA"] or rawDoc["B.Tech Current CGPA"]
    let cgpa = null;
    if (rawDoc.B && rawDoc.B['Tech Current CGPA'] !== undefined && rawDoc.B['Tech Current CGPA'] !== null) {
      cgpa = parseNumber(rawDoc.B['Tech Current CGPA']);
    } else if (rawDoc['B.Tech Current CGPA'] !== undefined && rawDoc['B.Tech Current CGPA'] !== null) {
      cgpa = parseNumber(rawDoc['B.Tech Current CGPA']);
    }

    // Semesters 1 to 5
    const semesters = [];
    let semesterBacklogSum = 0;
    const validSgpas = [];
    let latestSgpa = null;

    for (let sem = 1; sem <= 5; sem++) {
      const ord = getOrdinal(sem);
      const sgpaKey = `${ord} SEM (SGPA)`;
      const backlogKey = `${ord} SEM backlog(if yes)`;

      const rawSgpa = rawDoc[sgpaKey];
      const rawBacklog = rawDoc[backlogKey];

      const sgpa = parseNumber(rawSgpa);
      const backlogStr = cleanString(rawBacklog);

      let backlogCount = null;
      let hasBacklog = false;

      if (backlogStr !== null) {
        const num = Number(backlogStr);
        if (!isNaN(num)) {
          backlogCount = num;
          hasBacklog = num > 0;
        } else {
          const l = backlogStr.toLowerCase();
          if (['no', 'nil', 'none'].includes(l)) {
            backlogCount = 0;
            hasBacklog = false;
          } else if (l === 'yes') {
            backlogCount = 1;
            hasBacklog = true;
          } else {
            backlogCount = null;
            hasBacklog = false;
          }
        }
      }

      if (backlogCount !== null) {
        semesterBacklogSum += backlogCount;
      }

      if (sgpa !== null) {
        validSgpas.push(sgpa);
        latestSgpa = sgpa;
      }

      semesters.push({
        sem,
        sgpa,
        backlogCount,
        backlogText: backlogStr, // retained for backward compatibility
        hasBacklog,
      });
    }

    const avgSgpa = validSgpas.length > 0
      ? Number((validSgpas.reduce((a, b) => a + b, 0) / validSgpas.length).toFixed(2))
      : null;

    const totalLiveBacklogs = parseNumber(rawDoc['Total Live Backlog']) ?? 0;
    const totalClosedBacklogs = parseNumber(rawDoc['Total Close Backlog Total']) ?? 0;

    const academics = {
      cgpa,
      liveBacklogsText: cleanString(rawDoc['Live Backlogs']),
      closedBacklogsText: cleanString(rawDoc['Closed Backlogs']),
      totalLiveBacklogs,
      totalClosedBacklogs,
      currentPassingYear: parseNumber(rawDoc['Current Course Passing Yr']),
      semesterBacklogSum,
      avgSgpa,
      latestSgpa,
      semesters,
    };

    const placementPolicySubmitted = parsePolicy(rawDoc['Placement Policy Submitted']);

    const cleanDoc = {
      sNo: parseNumber(rawDoc['S no']),
      rollNo,
      fullName,
      nameLower,
      nameTokens,
      officialEmail: cleanString(rawDoc['Official Email']),
      personalEmail: cleanString(rawDoc['Personal Email']),
      officialPhone: cleanPhone(rawDoc['Official Phone']),
      whatsappNo: cleanPhone(rawDoc['Whatsapp No']),
      alternatePhone: cleanPhone(rawDoc['Alternate Phone']),
      batch: parseNumber(rawDoc['Batch']),
      campus: cleanString(rawDoc['Campus']),
      course: cleanString(rawDoc['Course']),
      branch: cleanString(rawDoc['Branch']),
      division: cleanString(rawDoc['Division']),
      nationality: cleanString(rawDoc['Nationality']),
      dob,
      tenth,
      twelfth,
      diploma,
      academics,
      placementPolicySubmitted,
      remarks: cleanString(rawDoc['Remarks']),
      recordDate,
      raw: rawDoc,
    };

    if (sampleCleanDocs.length < 3) {
      const sampleCopy = { ...cleanDoc };
      delete sampleCopy.raw;
      sampleCleanDocs.push(sampleCopy);
    }

    batch.push({
      updateOne: {
        filter: { rollNo: cleanDoc.rollNo },
        update: {
          $set: cleanDoc,
          $unset: { age: '' }, // remove stored age
        },
        upsert: true,
      },
    });

    if (batch.length >= BATCH_SIZE) {
      const res = await studentsCol.bulkWrite(batch, { ordered: false });
      upsertedCount += (res.upsertedCount || 0) + (res.modifiedCount || 0) + (res.matchedCount || 0);
      process.stdout.write(`  Processed ${readCount} / ${totalRaw} docs...\r`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    const res = await studentsCol.bulkWrite(batch, { ordered: false });
    upsertedCount += (res.upsertedCount || 0) + (res.modifiedCount || 0) + (res.matchedCount || 0);
    batch = [];
  }

  console.log(`\n\nCreating / verifying indexes on 'students' collection...`);
  await Student.init();
  await studentsCol.createIndex({ rollNo: 1 }, { unique: true });
  await studentsCol.createIndex({ nameLower: 1 });
  await studentsCol.createIndex({ nameTokens: 1 });
  await studentsCol.createIndex({ officialPhone: 1 });
  await studentsCol.createIndex({ whatsappNo: 1 });
  await studentsCol.createIndex({ branch: 1 });
  await studentsCol.createIndex({ division: 1 });
  await studentsCol.createIndex({ batch: 1 });
  await studentsCol.createIndex({ campus: 1 });
  await studentsCol.createIndex({ 'academics.cgpa': 1 });
  await studentsCol.createIndex({ 'academics.totalLiveBacklogs': 1 });
  await studentsCol.createIndex({ placementPolicySubmitted: 1 });
  await studentsCol.createIndex({ branch: 1, division: 1 });

  const finalStudentsCount = await studentsCol.countDocuments();

  console.log(`\n======================================================`);
  console.log(`NORMALIZATION V2 SUMMARY`);
  console.log(`======================================================`);
  console.log(`Total raw docs read:        ${readCount}`);
  console.log(`Total students upserted:    ${finalStudentsCount}`);
  console.log(`Missing Roll No docs:       ${missingRollNoCount}`);
  console.log(`Missing Full Name docs:     ${missingNameCount}`);
  console.log(`Active indexes:             ${(await studentsCol.indexes()).map((idx) => idx.name).join(', ')}`);
  console.log(`======================================================\n`);

  console.log(`--- 3 SAMPLE CLEANED DOCUMENTS (omitting raw) ---`);
  console.log(JSON.stringify(sampleCleanDocs, null, 2));

  await mongoose.disconnect();
  console.log(`\nNormalization v2 complete.`);
}

normalize().catch((err) => {
  console.error('Normalization error:', err);
  process.exit(1);
});
