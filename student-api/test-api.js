// Automated test script to verify all REST API endpoints
const http = require('http');

const BASE_URL = 'http://localhost:5000';

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting API Verification Tests...\n');
  let passed = 0;
  let total = 0;

  function assert(condition, testName, details = '') {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} ${details}`);
    }
  }

  // 1. Root / Welcome Route
  const rootRes = await request('GET', '/');
  assert(rootRes.status === 200 && rootRes.data.status === 'Running', 'GET / - Welcome & Health Check');

  // 2. GET /api/students
  const getStudentsRes = await request('GET', '/api/students');
  assert(
    getStudentsRes.status === 200 && Array.isArray(getStudentsRes.data.data),
    'GET /api/students - Fetch all students'
  );

  // 3. POST /api/students (Validation Error: Missing course)
  const invalidPostRes = await request('POST', '/api/students', {
    name: 'Incomplete Student',
    email: 'incomplete@example.com',
  });
  assert(
    invalidPostRes.status === 400 && invalidPostRes.data.success === false,
    'POST /api/students - Validation error on missing field (400)'
  );

  // 4. POST /api/students (Validation Error: Invalid email)
  const invalidEmailRes = await request('POST', '/api/students', {
    name: 'Invalid Email',
    email: 'not-an-email',
    course: 'MCA',
  });
  assert(
    invalidEmailRes.status === 400 && invalidEmailRes.data.success === false,
    'POST /api/students - Validation error on invalid email (400)'
  );

  // 5. POST /api/students (Valid Creation)
  const createRes = await request('POST', '/api/students', {
    name: 'Ankit Kumar',
    email: 'ankit.kumar@example.com',
    course: 'MCA',
  });
  assert(
    createRes.status === 201 && createRes.data.success === true && createRes.data.data.name === 'Ankit Kumar',
    'POST /api/students - Create new student (201)'
  );

  const createdId = createRes.data.data._id || createRes.data.data.id;

  // 6. GET /api/students/:id (Valid ID)
  const getByIdRes = await request('GET', `/api/students/${createdId}`);
  assert(
    getByIdRes.status === 200 && getByIdRes.data.data.name === 'Ankit Kumar',
    `GET /api/students/:id - Fetch student by ID (${createdId})`
  );

  // 7. GET /api/students/:id (Not Found)
  const getNotFoundRes = await request('GET', '/api/students/99999');
  assert(
    getNotFoundRes.status === 404 && getNotFoundRes.data.success === false,
    'GET /api/students/:id - Return 404 for non-existent ID'
  );

  // 8. PUT /api/students/:id (Valid Update)
  const updateRes = await request('PUT', `/api/students/${createdId}`, {
    course: 'MCA (Cloud Computing Specialization)',
  });
  assert(
    updateRes.status === 200 &&
      updateRes.data.success === true &&
      updateRes.data.data.course === 'MCA (Cloud Computing Specialization)',
    `PUT /api/students/:id - Update student course by ID (${createdId})`
  );

  // 9. PUT /api/students/:id (Not Found)
  const updateNotFoundRes = await request('PUT', '/api/students/99999', {
    course: 'MCA',
  });
  assert(
    updateNotFoundRes.status === 404 && updateNotFoundRes.data.success === false,
    'PUT /api/students/:id - Return 404 for updating non-existent student'
  );

  // 10. DELETE /api/students/:id (Valid Deletion)
  const deleteRes = await request('DELETE', `/api/students/${createdId}`);
  assert(
    deleteRes.status === 200 && deleteRes.data.success === true,
    `DELETE /api/students/:id - Delete student by ID (${createdId})`
  );

  // 11. Verify Student is Deleted
  const verifyDeleteRes = await request('GET', `/api/students/${createdId}`);
  assert(
    verifyDeleteRes.status === 404 && verifyDeleteRes.data.success === false,
    'Verify deleted student returns 404'
  );

  // 12. 404 Unknown Route
  const unknownRouteRes = await request('GET', '/api/unknown');
  assert(
    unknownRouteRes.status === 404 && unknownRouteRes.data.success === false,
    '404 handler for non-existent route'
  );

  console.log(`\n📊 Test Results: ${passed}/${total} tests passed!`);
  if (passed === total) {
    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  } else {
    console.error('❌ Some tests failed.');
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
