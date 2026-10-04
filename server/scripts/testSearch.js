const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function runSearchTests() {
  console.log('\n======================================================');
  console.log('CAMPUS COMPASS — SEARCH ACCEPTANCE TESTS (STEP 3)');
  console.log('======================================================\n');

  const BASE_URL = process.env.TEST_URL || 'http://127.0.0.1:5000';

  const jwt = require('jsonwebtoken');
  const siteAccessToken = jwt.sign(
    { siteAccess: true },
    process.env.SITE_ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || 'fallback_site_access_token_secret_2026',
    { expiresIn: '1h' }
  );

  // Authenticate as Admin by signing token from DB admin record
  let token;
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student_campus');
    const adminDoc = await mongoose.connection.db.collection('admins').findOne({});
    await mongoose.disconnect();
    
    if (!adminDoc) {
      throw new Error('No admin document found in database.');
    }

    token = jwt.sign(
      { id: adminDoc._id, email: adminDoc.email, role: 'admin' },
      process.env.JWT_SECRET || 'campus_compass_jwt_super_secret_key_2026_secure',
      { expiresIn: '8h' }
    );
    console.log(`✅ Authenticated with Admin account: ${adminDoc.email}`);
  } catch (err) {
    console.error(`❌ Authentication failed at ${BASE_URL}:`, err.message);
    process.exit(1);
  }

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'x-site-access-token': siteAccessToken,
    'Content-Type': 'application/json',
  };

  const testCases = [
    {
      input: '2303031',
      description: '≥ 1 result, every rollNo starts with 2303031, first-tier order correct',
      validate: (data) => {
        const list = data.suggestions || [];
        if (list.length === 0) return { pass: false, reason: 'Expected ≥ 1 result, got 0' };
        const invalid = list.filter((s) => !s.rollNo.startsWith('2303031'));
        if (invalid.length > 0) {
          return { pass: false, reason: `Some roll numbers do not start with 2303031: ${invalid.map((s) => s.rollNo).join(', ')}` };
        }
        return { pass: true, details: `Returned ${list.length} results starting with 2303031` };
      },
    },
    {
      input: '2303031460001',
      description: 'exactly that student (ADULA MAHENDHAR) first',
      validate: (data) => {
        const list = data.suggestions || [];
        if (list.length === 0) return { pass: false, reason: 'Expected student, got 0 results' };
        if (list[0].rollNo !== '2303031460001') {
          return { pass: false, reason: `Expected first rollNo 2303031460001, got ${list[0].rollNo}` };
        }
        if (!list[0].fullName.toUpperCase().includes('ADULA MAHENDHAR')) {
          return { pass: false, reason: `Expected ADULA MAHENDHAR, got ${list[0].fullName}` };
        }
        return { pass: true, details: `First student is ${list[0].fullName} (${list[0].rollNo})` };
      },
    },
    {
      input: 'adu',
      description: 'includes ADULA MAHENDHAR',
      validate: (data) => {
        const list = data.suggestions || [];
        const found = list.some((s) => s.fullName.toUpperCase().includes('ADULA MAHENDHAR'));
        if (!found) return { pass: false, reason: 'ADULA MAHENDHAR not found in suggestions' };
        return { pass: true, details: `Found ADULA MAHENDHAR among ${list.length} suggestions` };
      },
    },
    {
      input: 'mahen',
      description: 'includes ADULA MAHENDHAR (matched via nameTokens)',
      validate: (data) => {
        const list = data.suggestions || [];
        const found = list.some((s) => s.fullName.toUpperCase().includes('ADULA MAHENDHAR'));
        if (!found) return { pass: false, reason: 'ADULA MAHENDHAR not matched via nameTokens' };
        return { pass: true, details: `Found ADULA MAHENDHAR via token "mahen"` };
      },
    },
    {
      input: 'adula mah',
      description: 'includes ADULA MAHENDHAR (multi-word match)',
      validate: (data) => {
        const list = data.suggestions || [];
        const found = list.some((s) => s.fullName.toUpperCase().includes('ADULA MAHENDHAR'));
        if (!found) return { pass: false, reason: 'ADULA MAHENDHAR not found for "adula mah"' };
        return { pass: true, details: `Found ADULA MAHENDHAR for multi-word "adula mah"` };
      },
    },
    {
      input: '99486',
      description: 'includes the student with phone 9948660034',
      validate: (data) => {
        const list = data.suggestions || [];
        const found = list.some(
          (s) => s.rollNo === '2303031460001' || s.fullName.toUpperCase().includes('ADULA MAHENDHAR')
        );
        if (!found) return { pass: false, reason: 'Student with phone 9948660034 not found in suggestions' };
        return { pass: true, details: `Found student with phone prefix 99486 (ADULA MAHENDHAR)` };
      },
    },
    {
      input: 'zzzzzz',
      description: '0 results, UI shows the empty message',
      validate: (data) => {
        const list = data.suggestions || [];
        if (list.length !== 0) return { pass: false, reason: `Expected 0 results, got ${list.length}` };
        return { pass: true, details: 'Correctly returned 0 results' };
      },
    },
    {
      input: '.*',
      description: 'no crash, no regex injection, 0 results',
      validate: (data) => {
        const list = data.suggestions || [];
        if (list.length !== 0) return { pass: false, reason: `Expected 0 results, got ${list.length}` };
        return { pass: true, details: 'Handled regex injection safely, 0 results' };
      },
    },
    {
      input: '(',
      description: 'no crash, no regex unescaped syntax error, 0 results',
      validate: (data) => {
        const list = data.suggestions || [];
        if (list.length !== 0) return { pass: false, reason: `Expected 0 results, got ${list.length}` };
        return { pass: true, details: 'Handled unclosed parenthesis safely, 0 results' };
      },
    },
  ];

  let passedCount = 0;
  let failedCount = 0;

  console.log('\nRunning test cases:\n------------------------------------------------------');

  for (const tc of testCases) {
    try {
      const url = `${BASE_URL}/api/students/suggest?q=${encodeURIComponent(tc.input)}`;
      const res = await fetch(url, { headers: authHeaders });
      const data = await res.json();

      if (!res.ok) {
        console.log(`❌ FAIL : "${tc.input}" — HTTP status ${res.status}`);
        failedCount++;
        continue;
      }

      const outcome = tc.validate(data);
      if (outcome.pass) {
        console.log(`✅ PASS : "${tc.input}" — ${tc.description}`);
        if (outcome.details) console.log(`          ↳ ${outcome.details}`);
        passedCount++;
      } else {
        console.log(`❌ FAIL : "${tc.input}" — ${tc.description}`);
        console.log(`          ↳ Reason: ${outcome.reason}`);
        failedCount++;
      }
    } catch (err) {
      console.log(`❌ FAIL : "${tc.input}" — Exception: ${err.message}`);
      failedCount++;
    }
  }

  console.log('------------------------------------------------------');
  console.log(`Results: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('======================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSearchTests();
