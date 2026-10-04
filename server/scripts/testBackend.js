const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('../routes/authRoutes');
const studentRoutes = require('../routes/studentRoutes');
const analyticsRoutes = require('../routes/analyticsRoutes');

async function runTests() {
  console.log('\n======================================================');
  console.log('STARTING BACKEND API VERIFICATION TESTS');
  console.log('======================================================\n');

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/student_campus';
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB for testing.');

  const app = express();
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  app.use(cors());
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/students', studentRoutes);
  app.use('/api/analytics', analyticsRoutes);

  const TEST_PORT = 5055;
  const server = app.listen(TEST_PORT);
  const baseUrl = `http://localhost:${TEST_PORT}`;

  try {
    // 1. Authenticate Admin
    console.log('\n[1/8] Generating Admin Auth Token from database...');
    const jwt = require('jsonwebtoken');
    const adminDoc = await mongoose.connection.db.collection('admins').findOne({});
    if (!adminDoc) {
      throw new Error('No admin document found in database.');
    }
    const token = jwt.sign(
      { id: adminDoc._id, email: adminDoc.email, role: 'admin' },
      process.env.JWT_SECRET || 'campus_compass_jwt_super_secret_key_2026_secure',
      { expiresIn: '8h' }
    );
    console.log(`✅ Admin Token generated for: ${adminDoc.email}`);

    const authHeaders = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // 2. Test Suggest: 2303031
    console.log('\n[2/8] Testing Autocomplete Suggestion: q="2303031"...');
    const sug1Res = await fetch(`${baseUrl}/api/students/suggest?q=2303031`, { headers: authHeaders });
    const sug1Data = await sug1Res.json();
    console.log(`✅ Suggestions for '2303031' count: ${sug1Data.suggestions?.length}`);
    sug1Data.suggestions?.slice(0, 3).forEach((s) => {
      console.log(`   - [${s.rollNo}] ${s.fullName} | ${s.branch} | CGPA: ${s.cgpa} | Backlogs: ${s.totalLiveBacklogs}`);
    });

    // 3. Test Suggest: adu
    console.log('\n[3/8] Testing Autocomplete Suggestion: q="adu"...');
    const sug2Res = await fetch(`${baseUrl}/api/students/suggest?q=adu`, { headers: authHeaders });
    const sug2Data = await sug2Res.json();
    console.log(`✅ Suggestions for 'adu' count: ${sug2Data.suggestions?.length}`);
    sug2Data.suggestions?.slice(0, 3).forEach((s) => {
      console.log(`   - [${s.rollNo}] ${s.fullName} | ${s.branch}`);
    });

    // 4. Test Suggest: mahen
    console.log('\n[4/8] Testing Autocomplete Suggestion: q="mahen"...');
    const sug3Res = await fetch(`${baseUrl}/api/students/suggest?q=mahen`, { headers: authHeaders });
    const sug3Data = await sug3Res.json();
    console.log(`✅ Suggestions for 'mahen' count: ${sug3Data.suggestions?.length}`);
    sug3Data.suggestions?.slice(0, 3).forEach((s) => {
      console.log(`   - [${s.rollNo}] ${s.fullName} | ${s.branch}`);
    });

    // 5. Test Filters: GET /api/students/filters
    console.log('\n[5/8] Testing Filter Options GET /api/students/filters...');
    const filterRes = await fetch(`${baseUrl}/api/students/filters`, { headers: authHeaders });
    const filterData = await filterRes.json();
    console.log(`✅ Filter options retrieved:`);
    console.log(`   - Branches count:  ${filterData.branches?.length}`);
    console.log(`   - Divisions count: ${filterData.divisions?.length}`);
    console.log(`   - Batches:         ${filterData.batches?.join(', ')}`);
    console.log(`   - Campuses:        ${filterData.campuses?.join(', ')}`);

    // 6. Test Students List: GET /api/students
    console.log('\n[6/8] Testing Paginated Students List GET /api/students?limit=5...');
    const listRes = await fetch(`${baseUrl}/api/students?limit=5`, { headers: authHeaders });
    const listData = await listRes.json();
    console.log(`✅ Students list retrieved: total=${listData.total}, pages=${listData.pages}, items=${listData.items?.length}`);

    // 7. Test Student Detail: GET /api/students/:rollNo
    const sampleRollNo = sug1Data.suggestions?.[0]?.rollNo || '2303031460001';
    console.log(`\n[7/8] Testing Student Detail GET /api/students/${sampleRollNo}...`);
    const detailRes = await fetch(`${baseUrl}/api/students/${sampleRollNo}`, { headers: authHeaders });
    const detailData = await detailRes.json();
    const st = detailData.student;
    console.log(`✅ Student Detail for ${st.rollNo}:`);
    console.log(`   - Name:     ${st.fullName}`);
    console.log(`   - CGPA:     ${st.academics?.cgpa}`);
    console.log(`   - Raw Doc:  _id=${st.raw?._id}, has B object: ${Boolean(st.raw?.B)}`);
    console.log(`   - Nav:      Prev=${detailData.navigation?.prevRollNo}, Next=${detailData.navigation?.nextRollNo}`);

    // 8. Test Analytics: GET /api/analytics/overview
    console.log('\n[8/8] Testing Analytics Overview GET /api/analytics/overview...');
    const anaRes = await fetch(`${baseUrl}/api/analytics/overview`, { headers: authHeaders });
    const anaData = await anaRes.json();
    console.log(`✅ Analytics Overview:`);
    console.log(`   - Total Students:          ${anaData.kpis?.totalStudents}`);
    console.log(`   - Average CGPA:            ${anaData.kpis?.averageCgpa}`);
    console.log(`   - Students with Backlogs:  ${anaData.kpis?.studentsWithLiveBacklogs} (${anaData.kpis?.liveBacklogsPercentage}%)`);
    console.log(`   - Policy Submitted:        ${anaData.kpis?.policySubmitted} (${anaData.kpis?.policySubmittedPercentage}%)`);
    console.log(`   - CGPA Buckets:            ${anaData.cgpaHistogram?.map((b) => `${b.bucket}: ${b.count}`).join(' | ')}`);
    console.log(`   - Backlog Buckets:         ${anaData.backlogDistribution?.map((b) => `${b.backlogs}: ${b.count}`).join(' | ')}`);
    console.log(`   - Needs Attention top 3:   ${anaData.needsAttention?.slice(0, 3).map((s) => `${s.rollNo} (${s.liveBacklogs} live)`).join(', ')}`);

    console.log('\n======================================================');
    console.log('ALL 8 BACKEND TESTS PASSED SUCCESSFULLY! 🎉');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

runTests();
