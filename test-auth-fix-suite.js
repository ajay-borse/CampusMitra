const http = require('http');
const ioClient = require('./frontend/node_modules/socket.io-client');
const io = ioClient.io || ioClient;

const BASE_URL = 'http://localhost:5000';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const headers = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let payload = null;
    if (body) {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }

    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, raw: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function registerTestUser(firstName, lastName, email, password = 'password123', dob = '2002-05-10') {
  const res = await request('POST', '/api/auth/register', {
    firstName,
    lastName,
    email,
    password,
    dateOfBirth: dob,
  });
  if (res.status === 201 && res.data.success) {
    return {
      id: res.data.data.user.id,
      token: res.data.data.token,
      email,
      firstName,
      lastName,
    };
  }
  const loginRes = await request('POST', '/api/auth/login', { email, password });
  if (loginRes.status === 200 && loginRes.data.success) {
    return {
      id: loginRes.data.data.user.id,
      token: loginRes.data.data.token,
      email,
      firstName,
      lastName,
    };
  }
  throw new Error(`Failed to register/login test user ${email}: ${JSON.stringify(res.data || res.raw)}`);
}

async function runAuthFixSuite() {
  console.log('====================================================');
  console.log('🔒 CAMPUSMITRA AUTH & SOCKET.IO VERIFICATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, title, details = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`  ✅ [PASS] ${title}`);
    } else {
      console.error(`  ❌ [FAIL] ${title} - ${details}`);
    }
  }

  try {
    const ts = Date.now();
    console.log('--- Step 1: User Registration & Login ---');
    const user = await registerTestUser('AuthAlice', 'Tester', `auth.alice.${ts}@mitwpu.edu.in`);
    assert(!!user.token, '1. Login/registration succeeds with valid university credentials');

    console.log('\n--- Step 2: Session Restoration (/api/auth/me) ---');
    const sessionRes = await request('GET', '/api/auth/me', null, user.token);
    assert(sessionRes.status === 200 && sessionRes.data.success, '2. Session restoration works with valid token');

    console.log('\n--- Step 3: Rejection of Invalid/Expired Credentials ---');
    const invalidTokenRes = await request('GET', '/api/auth/me', null, 'invalid_expired_token_signature');
    assert(invalidTokenRes.status === 401, '3. Invalid/expired credentials rejected with HTTP 401');

    console.log('\n--- Step 4: Campus Radar Feed & Availability with Auth ---');
    const radarFeedRes = await request('GET', '/api/radar/feed', null, user.token);
    assert(radarFeedRes.status === 200 && radarFeedRes.data.success, '4. Radar feed loads without 401 for authenticated student');

    const availGetRes = await request('GET', '/api/radar/availability/me', null, user.token);
    assert(availGetRes.status === 200 && availGetRes.data.success, '5a. Availability status can be read by owner');

    const availPutRes = await request('PUT', '/api/radar/availability/me', {
      isActive: true,
      intentions: ['Coding'],
      note: 'Lab 4',
      audience: 'everyone',
    }, user.token);
    assert(availPutRes.status === 200 && availPutRes.data.success, '5b. Availability can be updated by owner');

    console.log('\n--- Step 5: Campus Plans, Circles & Pulse Load with Auth ---');
    const plansRes = await request('GET', '/api/plans', null, user.token);
    assert(plansRes.status === 200 && plansRes.data.success, '6a. Campus Plans loads without 401 for authenticated student');

    const circlesRes = await request('GET', '/api/circles', null, user.token);
    assert(circlesRes.status === 200 && circlesRes.data.success, '6b. Campus Circles loads without 401 for authenticated student');

    const pulseRes = await request('GET', '/api/pulse', null, user.token);
    assert(pulseRes.status === 200 && pulseRes.data.success, '6c. Campus Pulse loads without 401 for authenticated student');

    console.log('\n--- Step 6: Unauthenticated Requests Strictly Protected ---');
    const noAuthRadar = await request('GET', '/api/radar/feed', null, null);
    assert(noAuthRadar.status === 401, '7a. GET /api/radar/feed rejected with 401 without token');

    const noAuthAvail = await request('GET', '/api/radar/availability/me', null, null);
    assert(noAuthAvail.status === 401, '7b. GET /api/radar/availability/me rejected with 401 without token');

    const noAuthPlans = await request('GET', '/api/plans', null, null);
    assert(noAuthPlans.status === 401, '7c. GET /api/plans rejected with 401 without token');

    const noAuthCircles = await request('GET', '/api/circles', null, null);
    assert(noAuthCircles.status === 401, '7d. GET /api/circles rejected with 401 without token');

    const noAuthPulse = await request('GET', '/api/pulse', null, null);
    assert(noAuthPulse.status === 401, '7e. GET /api/pulse rejected with 401 without token');

    console.log('\n--- Step 7: Socket.IO Authentication & Connection Verification ---');
    // Test 1: Socket.IO connection with VALID token
    const socketAuthSuccess = await new Promise((resolve) => {
      const client = io(BASE_URL, {
        auth: { token: user.token },
        transports: ['websocket', 'polling'],
        timeout: 5000,
      });

      client.on('connect', () => {
        client.disconnect();
        resolve(true);
      });

      client.on('connect_error', (err) => {
        client.disconnect();
        resolve(false);
      });
    });
    assert(socketAuthSuccess === true, '8. Socket.IO WebSocket connects successfully with valid token');

    // Test 2: Socket.IO connection WITHOUT token (must be rejected)
    const socketRejectSuccess = await new Promise((resolve) => {
      const client = io(BASE_URL, {
        auth: {},
        transports: ['websocket', 'polling'],
        timeout: 5000,
      });

      client.on('connect', () => {
        client.disconnect();
        resolve(false); // Should not connect!
      });

      client.on('connect_error', (err) => {
        client.disconnect();
        resolve(err.message.includes('token') || err.message.includes('Authentication'));
      });
    });
    assert(socketRejectSuccess === true, '9. Socket.IO connection rejected when authentication token is missing');

    console.log('\n====================================================');
    console.log(`🎉 TEST SUMMARY: ${passed}/${total} assertions PASSED`);
    console.log('====================================================');
    if (passed === total) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Unhandled exception during auth test run:', err);
    process.exit(1);
  }
}

runAuthFixSuite();
