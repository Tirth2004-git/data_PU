const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { app } = require('../server');
const PinAttempt = require('../models/PinAttempt');
const Admin = require('../models/Admin');

const runTests = async () => {
  let server;
  const simulatedIp = '198.51.100.42'; // RFC 5737 Test IP
  const port = 5099;

  try {
    console.log('====================================================');
    console.log('  CAMPUS COMPASS — PIN GATE & SECURITY SUITE TEST');
    console.log('====================================================\n');

    // Wait for DB connection if not connected
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // Clean up any test state for simulated IP
    await PinAttempt.deleteOne({ ip: simulatedIp });

    // Start ephemeral HTTP server
    server = await new Promise((resolve) => {
      const s = app.listen(port, () => resolve(s));
    });

    const baseUrl = `http://127.0.0.1:${port}`;

    const makeRequest = async (endpoint, options = {}) => {
      const headers = {
        'Content-Type': 'application/json',
        'x-test-ip': simulatedIp,
        ...(options.headers || {}),
      };

      const res = await fetch(`${baseUrl}${endpoint}`, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      let json = null;
      try {
        json = await res.json();
      } catch (e) {
        json = null;
      }

      return {
        status: res.status,
        headers: res.headers,
        data: json,
      };
    };

    console.log('🧪 TEST 1: Zod validation rejects non-8-digit PINs (e.g. letters, short length)...');
    const invalidFormatRes = await makeRequest('/api/site/verify-pin', {
      method: 'POST',
      body: { pin: '123' },
    });
    console.log(`   Status: ${invalidFormatRes.status} (Expected: 400)`);
    console.log(`   Message: ${invalidFormatRes.data?.message}`);
    if (invalidFormatRes.status !== 400) throw new Error('Test 1 failed: Should return 400 for invalid PIN format');
    console.log('   ✅ PASS\n');

    console.log('🧪 TEST 2: 3 wrong PIN submissions trigger 5-minute lockout (423 Locked)...');
    
    // Attempt 1
    console.log('   -> Submitting wrong PIN attempt 1/3...');
    const attempt1 = await makeRequest('/api/site/verify-pin', {
      method: 'POST',
      body: { pin: '00000001' },
    });
    console.log(`      Status: ${attempt1.status} | Attempts remaining: ${attempt1.data?.attemptsRemaining}`);
    if (attempt1.status !== 401 || attempt1.data?.attemptsRemaining !== 2) {
      throw new Error(`Attempt 1 failed. Status: ${attempt1.status}`);
    }

    // Attempt 2
    console.log('   -> Submitting wrong PIN attempt 2/3...');
    const attempt2 = await makeRequest('/api/site/verify-pin', {
      method: 'POST',
      body: { pin: '00000002' },
    });
    console.log(`      Status: ${attempt2.status} | Attempts remaining: ${attempt2.data?.attemptsRemaining}`);
    if (attempt2.status !== 401 || attempt2.data?.attemptsRemaining !== 1) {
      throw new Error(`Attempt 2 failed. Status: ${attempt2.status}`);
    }

    // Attempt 3 (Lockout trigger)
    console.log('   -> Submitting wrong PIN attempt 3/3 (Lockout trigger)...');
    const attempt3 = await makeRequest('/api/site/verify-pin', {
      method: 'POST',
      body: { pin: '00000003' },
    });
    console.log(`      Status: ${attempt3.status} (Expected: 423)`);
    console.log(`      Locked: ${attempt3.data?.locked} | Retry-After: ${attempt3.data?.retryAfterSeconds}s`);
    if (attempt3.status !== 423 || !attempt3.data?.locked || !attempt3.data?.retryAfterSeconds) {
      throw new Error(`Attempt 3 failed. Expected 423 lockout.`);
    }

    // Verify retryAfterSeconds is close to 300
    if (attempt3.data.retryAfterSeconds < 295 || attempt3.data.retryAfterSeconds > 305) {
      throw new Error(`Expected retryAfterSeconds ~300, got: ${attempt3.data.retryAfterSeconds}`);
    }
    console.log('   ✅ PASS\n');

    console.log('🧪 TEST 3: 4th submission while locked is immediately rejected without checking PIN...');
    const attempt4 = await makeRequest('/api/site/verify-pin', {
      method: 'POST',
      body: { pin: '00000004' },
    });
    console.log(`      Status: ${attempt4.status} (Expected: 423)`);
    console.log(`      Retry-After remaining: ${attempt4.data?.retryAfterSeconds}s`);
    if (attempt4.status !== 423 || !attempt4.data?.locked) {
      throw new Error(`Attempt 4 failed. Expected 423 lockout while locked.`);
    }
    console.log('   ✅ PASS\n');

    console.log('🧪 TEST 4: Direct API access to /api/students without site access token returns 401...');
    // Create a dummy valid admin token to prove admin JWT ALONE is not enough
    const dummyAdmin = await Admin.findOne({});
    if (!dummyAdmin) throw new Error('Admin not found in DB');
    const adminJwt = jwt.sign(
      { id: dummyAdmin._id, email: dummyAdmin.email, role: 'admin' },
      process.env.JWT_SECRET || 'campus_compass_default_secret_key',
      { expiresIn: '1h' }
    );

    const directApiNoSiteToken = await makeRequest('/api/students', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminJwt}`,
      },
    });
    console.log(`      Status: ${directApiNoSiteToken.status} (Expected: 401)`);
    console.log(`      Code: ${directApiNoSiteToken.data?.code} | Message: ${directApiNoSiteToken.data?.message}`);
    if (directApiNoSiteToken.status !== 401 || directApiNoSiteToken.data?.code !== 'SITE_ACCESS_REQUIRED') {
      throw new Error('Test 4 failed: Direct API call without site access token must return 401 SITE_ACCESS_REQUIRED');
    }
    console.log('   ✅ PASS (Server-side enforcement verified: Admin JWT alone cannot bypass PIN layer)\n');

    // Test correct PIN (pass via TEST_PIN env variable or CLI arg)
    const testPin = process.env.TEST_PIN || process.argv[2];
    const testPassword = process.env.TEST_ADMIN_PASSWORD || process.argv[3];

    if (testPin) {
      console.log('🧪 TEST 5: Verifying correct PIN unlocks site access token...');
      // Clear lockout for testing the correct PIN flow
      await PinAttempt.deleteOne({ ip: simulatedIp });

      const correctPinRes = await makeRequest('/api/site/verify-pin', {
        method: 'POST',
        body: { pin: testPin },
      });

      console.log(`      Status: ${correctPinRes.status} (Expected: 200)`);
      console.log(`      SiteAccessToken received: ${!!correctPinRes.data?.siteAccessToken}`);
      if (correctPinRes.status !== 200 || !correctPinRes.data?.siteAccessToken) {
        throw new Error('Test 5 failed: Correct PIN did not return 200 with siteAccessToken');
      }

      const siteToken = correctPinRes.data.siteAccessToken;

      // Verify session check endpoint
      console.log('   -> Verifying session check endpoint /api/site/check...');
      const sessionCheck = await makeRequest('/api/site/check', {
        headers: { 'x-site-access-token': siteToken },
      });
      console.log(`      Session Check Status: ${sessionCheck.status} (Expected: 200)`);
      if (sessionCheck.status !== 200 || !sessionCheck.data?.siteAccess) {
        throw new Error('Session check endpoint failed');
      }
      console.log('   ✅ PASS\n');

      if (testPassword) {
        console.log('🧪 TEST 6: Admin login with new credentials after PIN verification...');
        const loginRes = await makeRequest('/api/auth/login', {
          method: 'POST',
          headers: { 'x-site-access-token': siteToken },
          body: {
            email: dummyAdmin.email,
            password: testPassword,
          },
        });

        console.log(`      Login Status: ${loginRes.status} (Expected: 200)`);
        console.log(`      Admin Name: ${loginRes.data?.admin?.name} | Email: ${loginRes.data?.admin?.email}`);
        if (loginRes.status !== 200 || !loginRes.data?.token) {
          throw new Error('Test 6 failed: Admin login failed');
        }

        const authenticatedAdminToken = loginRes.data.token;

        console.log('   -> Calling /api/students WITH both site access token and admin JWT...');
        const studentsRes = await makeRequest('/api/students?limit=2', {
          headers: {
            'x-site-access-token': siteToken,
            Authorization: `Bearer ${authenticatedAdminToken}`,
          },
        });

        console.log(`      Students API Status: ${studentsRes.status} (Expected: 200)`);
        console.log(`      Students retrieved: ${studentsRes.data?.data?.students?.length || studentsRes.data?.students?.length || 'Success'}`);
        if (studentsRes.status !== 200) {
          throw new Error('Failed to fetch students with both tokens');
        }
        console.log('   ✅ PASS (Both layers work in concert end-to-end)\n');
      }
    }

    // Clean up simulated test IP
    await PinAttempt.deleteOne({ ip: simulatedIp });

    console.log('====================================================');
    console.log('  🎉 ALL AUTOMATED BACKEND SECURITY TESTS PASSED!');
    console.log('====================================================\n');
  } catch (error) {
    console.error('\n❌ Test Suite Failed:', error.message);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.connection.close();
  }
};

runTests();
