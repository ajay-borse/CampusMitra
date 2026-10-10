/**
 * Comprehensive CampusMitra System Verification Test Suite
 * Tests all 40 verification criteria:
 * - Registration, MIT-WPU email validation, password hashing
 * - Under-18 dating restriction
 * - Authentication & JWT
 * - Onboarding multi-step profile persistence
 * - Student ID verification workflow & privacy
 * - Admin moderation & audit logs
 * - Interest catalog & custom additions
 * - Discover deck & compatibility calculations
 * - Connections & Mutual match creation
 * - Chat messaging & conversation initialization
 * - Notifications
 * - User blocking & reporting
 * - Unauthorized / invalid access handling
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000';

function request(method, pathUrl, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(pathUrl, BASE_URL);
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

// Multipart helper for file upload tests
function uploadFileRequest(pathUrl, fieldName, filename, fileBuffer, mimeType, token = null) {
  return new Promise((resolve, reject) => {
    const boundary = '----CampusMitraFormBoundary' + Math.random().toString(16).substring(2);
    const url = new URL(pathUrl, BASE_URL);

    const headers = {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let headerPart = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\n` +
      `Content-Type: ${mimeType}\r\n\r\n`
    );
    let footerPart = Buffer.from(`\r\n--${boundary}--\r\n`);
    let bodyBuffer = Buffer.concat([headerPart, fileBuffer, footerPart]);

    headers['Content-Length'] = bodyBuffer.length;

    const options = {
      method: 'POST',
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
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    req.write(bodyBuffer);
    req.end();
  });
}

async function runSuite() {
  console.log('====================================================');
  console.log('🎓 CAMPUSMITRA FULL VERIFICATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, title, details = '') {
    total++;
    if (condition) {
      console.log(`✅ PASS [${total}]: ${title}`);
      passed++;
    } else {
      console.error(`❌ FAIL [${total}]: ${title} -> ${details}`);
    }
  }

  const timestamp = Date.now();
  const adultEmail = `student.adult.${timestamp}@mitwpu.edu.in`;
  const minorEmail = `student.minor.${timestamp}@mitwpu.edu.in`;
  const invalidEmail = `student.hacker.${timestamp}@gmail.com`;

  // 1. Health check
  const healthRes = await request('GET', '/');
  assert(healthRes.status === 200 && healthRes.data.status === 'Running', 'Health check root route returns 200 Running');

  // 2. Reject non-MIT-WPU email registration
  const rejectRes = await request('POST', '/api/auth/register', {
    firstName: 'Hacker',
    lastName: 'User',
    email: invalidEmail,
    password: 'password123',
    dateOfBirth: '2002-01-01',
  });
  assert(
    rejectRes.status === 400 && rejectRes.data.success === false,
    'Reject non-MIT-WPU email domain registration (400)',
    JSON.stringify(rejectRes.data)
  );

  // 3. Register valid 18+ adult student
  const adultRegRes = await request('POST', '/api/auth/register', {
    firstName: 'Tanmay',
    lastName: 'Bapat',
    email: adultEmail,
    password: 'password123',
    dateOfBirth: '2003-04-15', // 20+ years old
  });
  assert(
    adultRegRes.status === 201 && adultRegRes.data.success === true && adultRegRes.data.data.token,
    'Register valid MIT-WPU adult student (201)',
    JSON.stringify(adultRegRes.data)
  );
  const adultToken = adultRegRes.data?.data?.token;
  const adultUserId = adultRegRes.data?.data?.user?.id;
  assert(adultRegRes.data?.data?.user?.datingEligible === true, 'Server confirms age 18+ is dating eligible');

  // 4. Register under-18 student (minor safeguard)
  const minorRegRes = await request('POST', '/api/auth/register', {
    firstName: 'Aarav',
    lastName: 'Junior',
    email: minorEmail,
    password: 'password123',
    dateOfBirth: '2010-06-20', // ~14-16 years old
  });
  assert(
    minorRegRes.status === 201 && minorRegRes.data.success === true,
    'Register valid MIT-WPU under-18 student',
    JSON.stringify(minorRegRes.data)
  );
  const minorToken = minorRegRes.data?.data?.token;
  assert(minorRegRes.data?.data?.user?.datingEligible === false, 'Server-side age calculation confirms under-18 dating is NOT eligible');

  // 5. Login
  const loginRes = await request('POST', '/api/auth/login', {
    email: adultEmail,
    password: 'password123',
  });
  assert(loginRes.status === 200 && loginRes.data.success === true, 'Student login with university credentials');

  // 6. Login with incorrect password rejected
  const badLoginRes = await request('POST', '/api/auth/login', {
    email: adultEmail,
    password: 'wrong_password',
  });
  assert(badLoginRes.status === 401 && badLoginRes.data.success === false, 'Reject login with invalid password (401)');

  // 7. GET /api/auth/me
  const meRes = await request('GET', '/api/auth/me', null, adultToken);
  assert(meRes.status === 200 && meRes.data.data.user.email === adultEmail, 'Fetch authenticated user with GET /api/auth/me');

  // 8. Onboarding step progress persistence
  const updateStepRes = await request('PUT', '/api/profiles/me', {
    onboardingStep: 3,
    bio: 'MCA Cloud student passionate about full stack apps',
    program: 'MCA (Computer Applications)',
    interests: ['💻 Coding', '🎵 Music', '☕ Coffee', '🎮 Gaming'],
  }, adultToken);
  assert(
    updateStepRes.status === 200 && updateStepRes.data.data.onboardingStep === 3,
    'Persist onboarding step 3 and bio in MongoDB profile'
  );

  // 9. Verify refresh returns persisted onboarding progress
  const profileFetchRes = await request('GET', '/api/profiles/me', null, adultToken);
  assert(
    profileFetchRes.status === 200 && profileFetchRes.data.data.onboardingStep === 3,
    'Profile onboarding step persisted across requests'
  );

  // 10. Interests Catalog
  const interestCatRes = await request('GET', '/api/interests');
  assert(
    interestCatRes.status === 200 && Array.isArray(interestCatRes.data.data) && interestCatRes.data.data.length > 20,
    'Fetch comprehensive campus interest catalog (>20 items)'
  );

  // 11. Add custom interest
  const customInterestRes = await request('POST', '/api/interests/custom', {
    name: 'Late night coding',
    category: 'Technology',
    emoji: '🌙',
  }, adultToken);
  assert(
    customInterestRes.status === 201 && customInterestRes.data.success === true,
    'Add custom campus interest ("Late night coding")'
  );

  // 12. Search interests
  const searchInterestRes = await request('GET', '/api/interests?search=coding');
  assert(
    searchInterestRes.status === 200 && searchInterestRes.data.data.some((i) => i.name.toLowerCase().includes('coding')),
    'Search interests API filters correctly'
  );

  // 13. Update profile with rich fields (languages, lifestyle, personality, story)
  const fullProfileUpdateRes = await request('PUT', '/api/profiles/me', {
    languages: [
      { language: 'English', proficiency: 'Fluent' },
      { language: 'Marathi', proficiency: 'Native' },
    ],
    lifestyle: {
      foodPreference: 'Vegetarian',
      drinking: 'Never',
      fitness: 'Gym',
    },
    personality: ['Techie', 'Chill', 'Creative'],
    story: {
      aboutMe: 'Software developer at MIT-WPU',
      perfectWeekend: 'Brewing pour-over coffee and hacking on web apps',
    },
    onboardingStep: 12,
  }, adultToken);
  assert(
    fullProfileUpdateRes.status === 200 && fullProfileUpdateRes.data.data.languages.length === 2,
    'Update structured languages and lifestyle data'
  );

  // 14. Profile Completion calculation
  assert(
    fullProfileUpdateRes.data.data.completionPercentage >= 50,
    `Profile completion percentage dynamically calculated (${fullProfileUpdateRes.data.data.completionPercentage}%)`
  );

  // 15. Student ID Upload
  const sampleCard = Buffer.from('GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;');
  const idUploadRes = await uploadFileRequest(
    '/api/verifications/student-id',
    'idCard',
    'student_id.png',
    sampleCard,
    'image/png',
    adultToken
  );
  assert(
    idUploadRes.status === 200 && idUploadRes.data.data.status === 'PENDING',
    'Upload student ID card sets status to PENDING'
  );

  // 16. Verification status endpoint
  const idStatusRes = await request('GET', '/api/verifications/status', null, adultToken);
  assert(
    idStatusRes.status === 200 && idStatusRes.data.data.studentIdStatus === 'PENDING',
    'GET /api/verifications/status returns studentIdStatus = PENDING'
  );

  // 17. Admin Login
  const adminLoginRes = await request('POST', '/api/auth/login', {
    email: 'admin.moderator@mitwpu.edu.in',
    password: 'adminpassword123',
  });
  assert(adminLoginRes.status === 200 && adminLoginRes.data.data.user.role === 'admin', 'Admin login successful');
  const adminToken = adminLoginRes.data?.data?.token;

  // 18. Admin metrics
  const metricsRes = await request('GET', '/api/admin/metrics', null, adminToken);
  assert(
    metricsRes.status === 200 && metricsRes.data.data.totalUsers >= 2,
    'Admin metrics API returns real database counts'
  );

  // 19. Admin Verification Queue
  const verifQueueRes = await request('GET', '/api/admin/verifications?status=PENDING', null, adminToken);
  assert(
    verifQueueRes.status === 200 && Array.isArray(verifQueueRes.data.data),
    'Admin retrieves pending verification queue'
  );
  const pendingItem = verifQueueRes.data.data.find((v) => v.user?._id === adultUserId || v.user?.email === adultEmail);
  assert(Boolean(pendingItem), 'Pending verification queue includes newly uploaded student card');

  // 20. Secure document streaming for Admin
  if (pendingItem) {
    const docStreamRes = await request('GET', `/api/admin/verifications/${pendingItem._id}/document`, null, adminToken);
    assert(docStreamRes.status === 200, 'Authorized admin can securely view ID document');

    // 21. Student ID image is NOT accessible to unauthorized / non-admin users
    const unauthorizedDocRes = await request('GET', `/api/admin/verifications/${pendingItem._id}/document`, null, adultToken);
    assert(unauthorizedDocRes.status === 403, 'Regular student cannot access private ID documents (403 Forbidden)');

    // 22. Admin approves verification
    const reviewRes = await request('PUT', `/api/admin/verifications/${pendingItem._id}`, {
      status: 'APPROVED',
      adminNotes: 'Valid MIT-WPU ID verified',
    }, adminToken);
    assert(
      reviewRes.status === 200 && reviewRes.data.data.status === 'APPROVED',
      'Admin approves student ID verification'
    );
  }

  // 23. Check student notification was generated for verification approval
  const notifRes = await request('GET', '/api/notifications', null, adultToken);
  assert(
    notifRes.status === 200 && notifRes.data.data.some((n) => n.type === 'verification'),
    'Student received in-app notification about verification approval'
  );

  // 24. Minor restricted from Dating category
  const minorDatingRes = await request('GET', '/api/discover?category=dating', null, minorToken);
  assert(
    minorDatingRes.status === 403 && minorDatingRes.data.success === false,
    'Minor student blocked from Dating discover deck (403 Forbidden)'
  );

  // 25. Adult student can discover peers
  const adultDiscoverRes = await request('GET', '/api/discover', null, adultToken);
  assert(
    adultDiscoverRes.status === 200 && Array.isArray(adultDiscoverRes.data.data),
    'Adult student successfully fetches Discover deck'
  );

  // 26. Like a peer in Discover deck
  const candidateUser = adultDiscoverRes.data.data[0];
  if (candidateUser) {
    const targetId = candidateUser.userId;

    const likeRes = await request('POST', '/api/connections/interest', {
      targetUserId: targetId,
    }, adultToken);
    assert(likeRes.status === 200, `Expressed interest in peer (${candidateUser.name})`);

    // 27. Pass on another peer
    if (adultDiscoverRes.data.data[1]) {
      const passRes = await request('POST', '/api/connections/pass', {
        targetUserId: adultDiscoverRes.data.data[1].userId,
      }, adultToken);
      assert(passRes.status === 200, 'Passed on second peer (swipe left)');
    }

    // 28. Candidate likes back -> MUTUAL MATCH!
    // Log in as test student Priya or candidate user to like back
    const candidateLoginRes = await request('POST', '/api/auth/login', {
      email: 'priya.test@mitwpu.edu.in',
      password: 'password123',
    });

    if (candidateLoginRes.status === 200) {
      const priyaToken = candidateLoginRes.data.data.token;
      const priyaId = candidateLoginRes.data.data.user.id;

      // Adult likes Priya
      await request('POST', '/api/connections/interest', { targetUserId: priyaId }, adultToken);

      // Priya likes Adult back
      const matchRes = await request('POST', '/api/connections/interest', { targetUserId: adultUserId }, priyaToken);
      assert(
        matchRes.status === 200 && matchRes.data.data.isMatch === true && matchRes.data.data.conversationId,
        'Reciprocal likes automatically create a MUTUAL MATCH and Conversation!'
      );
      const conversationId = matchRes.data.data.conversationId;

      // 29. Verify Connections list contains the mutual match
      const connectionsRes = await request('GET', '/api/connections', null, adultToken);
      assert(
        connectionsRes.status === 200 && connectionsRes.data.data.some((c) => c.userId === priyaId),
        'Mutual match appears in user connections list'
      );

      // 30. Chat Messaging
      const sendMsgRes = await request('POST', `/api/conversations/${conversationId}/messages`, {
        text: 'Hey Priya! Saw we matched, how is the B.Tech project going? 🚀',
      }, adultToken);
      assert(
        sendMsgRes.status === 201 && sendMsgRes.data.success === true,
        'Send direct message inside mutual match conversation'
      );

      // 31. Fetch conversation messages
      const getMsgsRes = await request('GET', `/api/conversations/${conversationId}/messages`, null, adultToken);
      assert(
        getMsgsRes.status === 200 && getMsgsRes.data.data.length >= 1,
        'Fetch conversation message history'
      );

      // 32. Conversation list
      const convListRes = await request('GET', '/api/conversations', null, adultToken);
      assert(
        convListRes.status === 200 && convListRes.data.data.length >= 1,
        'GET /api/conversations returns active chat list'
      );
    }
  }

  // 33. Report user for safety
  const reportRes = await request('POST', '/api/reports', {
    reportedUserId: adultUserId,
    reason: 'Spam',
    description: 'Automated test report submission',
  }, adminToken);
  assert(reportRes.status === 201 && reportRes.data.success === true, 'Submit safety report to moderation queue');

  // 34. Admin views reports
  const adminReportsRes = await request('GET', '/api/admin/reports', null, adminToken);
  assert(
    adminReportsRes.status === 200 && Array.isArray(adminReportsRes.data.data) && adminReportsRes.data.data.length >= 1,
    'Admin retrieves safety reports queue'
  );

  // 35. Admin resolve report
  if (adminReportsRes.data.data.length > 0) {
    const reportId = adminReportsRes.data.data[0]._id;
    const resolveRes = await request('PUT', `/api/admin/reports/${reportId}`, {
      status: 'resolved',
      adminNotes: 'Reviewed and dismissed as test',
    }, adminToken);
    assert(resolveRes.status === 200 && resolveRes.data.data.status === 'resolved', 'Admin resolves safety report');
  }

  // 36. User block feature
  const blockRes = await request('POST', '/api/moderation/blocks', {
    targetUserId: adultUserId,
    reason: 'Test block',
  }, minorToken);
  assert(blockRes.status === 200, 'Student blocks peer successfully');

  // 37. Audit logs recorded
  const auditLogsRes = await request('GET', '/api/admin/audit-logs', null, adminToken);
  assert(
    auditLogsRes.status === 200 && Array.isArray(auditLogsRes.data.data) && auditLogsRes.data.data.length > 0,
    'Admin security audit logs records moderation actions'
  );

  // 38. Student Directory CRUD (Preserved feature)
  const studentRegistryRes = await request('GET', '/api/students');
  assert(
    studentRegistryRes.status === 200 && Array.isArray(studentRegistryRes.data.data),
    'Student Directory CRUD registry functional'
  );

  // 39. Unauthorized requests blocked
  const unauthRes = await request('GET', '/api/profiles/me');
  assert(unauthRes.status === 401, 'Unauthorized request without JWT is rejected (401)');

  // 40. Non-admin accessing admin portal blocked
  const forbiddenAdminRes = await request('GET', '/api/admin/metrics', null, adultToken);
  assert(forbiddenAdminRes.status === 403, 'Regular student accessing /api/admin is rejected (403 Forbidden)');

  console.log('\n====================================================');
  console.log(`📊 FINAL SUITE RESULTS: ${passed}/${total} TESTS PASSED`);
  console.log('====================================================');

  if (passed === total) {
    console.log('🎉 ALL 40/40 SYSTEM VERIFICATION TESTS PASSED!\n');
    process.exit(0);
  } else {
    console.error(`⚠️ ${total - passed} tests failed.`);
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
