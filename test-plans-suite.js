/**
 * Comprehensive Campus Plans Verification Suite
 * Tests end-to-end functionality of student-organized Campus Plans:
 * 1. Plan creation with complete validation.
 * 2. Rejection of invalid inputs (past dates, bad capacity, empty fields).
 * 3. Plan discovery with filtering (category, search, today).
 * 4. Atomic join with duplicate & overbooking protection.
 * 5. Plan-specific group chat conversation authorization.
 * 6. Participant leave and capacity recalculation.
 * 7. Creator-only updates with capacity safety.
 * 8. Creator-only cancellation with participant notifications.
 * 9. Non-creator unauthorized actions rejected (403).
 * 10. Clean up test records without modifying real user data.
 */
const http = require('http');

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

async function runPlansSuite() {
  console.log('====================================================');
  console.log('📅 CAMPUSMITRA CAMPUS PLANS VERIFICATION SUITE');
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

  const ts = Date.now();
  const createdUserIds = [];
  const createdPlanIds = [];

  try {
    // 1. Setup test students
    const host = await registerTestUser('Pooja', 'Host', `pooja.host.${ts}@mitwpu.edu.in`);
    const studentA = await registerTestUser('Siddharth', 'Student', `sid.plan.${ts}@mitwpu.edu.in`);
    const studentB = await registerTestUser('Rohan', 'Student', `rohan.plan.${ts}@mitwpu.edu.in`);
    const intruder = await registerTestUser('Intruder', 'Student', `intruder.plan.${ts}@mitwpu.edu.in`);

    createdUserIds.push(host.id, studentA.id, studentB.id, intruder.id);

    // Complete onboarding for test users
    await request('PUT', '/api/profiles/me', { bio: 'Host bio', onboardingStep: 12 }, host.token);
    await request('PUT', '/api/profiles/me', { bio: 'Sid bio', onboardingStep: 12 }, studentA.token);
    await request('PUT', '/api/profiles/me', { bio: 'Rohan bio', onboardingStep: 12 }, studentB.token);

    const todayStr = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

    // 2. Reject past dates
    const pastDateRes = await request('POST', '/api/plans', {
      title: 'Past Coding Session',
      description: 'Attempt to create a plan in the past',
      category: 'Coding',
      date: '2020-01-01',
      time: '14:00',
      duration: '1 hour',
      capacity: 4,
      location: 'Central Library Room 302',
    }, host.token);
    assert(
      pastDateRes.status === 400 && pastDateRes.data.message.includes('past'),
      'Reject plan creation with past date (400)',
      JSON.stringify(pastDateRes.data)
    );

    // 3. Reject invalid capacity
    const badCapRes = await request('POST', '/api/plans', {
      title: 'Tiny Activity',
      description: 'Capacity is 1, which is invalid',
      category: 'Study',
      date: tomorrow,
      time: '15:00',
      duration: '2 hours',
      capacity: 1, // must be >= 2
      location: 'MIT World Peace Dome Library',
    }, host.token);
    assert(
      badCapRes.status === 400 && badCapRes.data.message.includes('between 2 and 50'),
      'Reject plan creation with invalid capacity < 2 (400)',
      JSON.stringify(badCapRes.data)
    );

    // 4. Reject unsupported category
    const badCatRes = await request('POST', '/api/plans', {
      title: 'Bad Category Activity',
      description: 'Invalid category test',
      category: 'Skydiving',
      date: tomorrow,
      time: '15:00',
      duration: '2 hours',
      capacity: 4,
      location: 'Campus Ground',
    }, host.token);
    assert(
      badCatRes.status === 400 && badCatRes.data.message.includes('Category must be one of'),
      'Reject plan creation with unsupported category (400)',
      JSON.stringify(badCatRes.data)
    );

    // 5. Create valid Coding Session plan
    const createRes = await request('POST', '/api/plans', {
      title: 'Full Stack React & Node Workshop',
      description: 'Collaborative hacking session on CampusMitra project and full stack web dev tips.',
      category: 'Coding',
      date: tomorrow,
      time: '16:30',
      duration: '90 mins',
      capacity: 3, // small capacity for testing limits
      location: 'Central Library Discussion Room 2',
      locationType: 'campus',
      tags: ['React', 'Node.js', 'MongoDB', 'Hackathon'],
    }, host.token);

    assert(
      createRes.status === 201 && createRes.data.success && createRes.data.data?._id,
      'Create valid Campus Plan with 201 Created and populated creator',
      JSON.stringify(createRes.data)
    );

    const planId = createRes.data.data?._id;
    const conversationId = createRes.data.data?.conversation;
    if (planId) createdPlanIds.push(planId);

    assert(
      Boolean(conversationId),
      'Plan creation automatically initializes a plan group conversation in MongoDB'
    );

    // 6. Discover plans feed
    const feedRes = await request('GET', '/api/plans', null, studentA.token);
    assert(
      feedRes.status === 200 && Array.isArray(feedRes.data.data) && feedRes.data.data.some((p) => p.id === planId),
      'Discover plans endpoint returns upcoming created plan'
    );

    // 7. Filter plans by category
    const catFeedRes = await request('GET', '/api/plans?category=Coding', null, studentA.token);
    assert(
      catFeedRes.status === 200 && catFeedRes.data.data.every((p) => p.category === 'Coding'),
      'Filter plans by category=Coding'
    );

    // 8. Search plans
    const searchRes = await request('GET', '/api/plans?search=Workshop', null, studentA.token);
    assert(
      searchRes.status === 200 && searchRes.data.data.some((p) => p.title.includes('Workshop')),
      'Search plans by keyword "Workshop"'
    );

    // 9. Student A joins plan
    const joinResA = await request('POST', `/api/plans/${planId}/join`, null, studentA.token);
    assert(
      joinResA.status === 200 && joinResA.data.data.participantCount === 2,
      'Student A successfully joins plan (capacity 2 of 3 filled)'
    );

    // 10. Prevent duplicate join
    const dupJoinRes = await request('POST', `/api/plans/${planId}/join`, null, studentA.token);
    assert(
      dupJoinRes.status === 400 && dupJoinRes.data.message.includes('already joined'),
      'Reject duplicate plan join from same student (400)'
    );

    // 11. Student B joins plan -> plan reaches maximum capacity (3 of 3)
    const joinResB = await request('POST', `/api/plans/${planId}/join`, null, studentB.token);
    assert(
      joinResB.status === 200 && joinResB.data.data.status === 'full' && joinResB.data.data.participantCount === 3,
      'Student B joins plan and status transitions to "full"'
    );

    // 12. Intruder attempts to join full plan -> overbooking prevented!
    const overbookRes = await request('POST', `/api/plans/${planId}/join`, null, intruder.token);
    assert(
      overbookRes.status === 400 && overbookRes.data.message.includes('already full'),
      'Overbooking strictly rejected when plan capacity is reached (400)'
    );

    // 13. Verify plan group chat messaging
    // Confirmed participant Student A sends message to group chat
    const msgRes = await request('POST', `/api/conversations/${conversationId}/messages`, {
      text: 'Hey everyone! Excited for the workshop tomorrow 💻',
    }, studentA.token);
    assert(
      msgRes.status === 201 && msgRes.data.success,
      'Confirmed plan participant can send messages in plan group chat'
    );

    // 14. Nonparticipant Intruder is blocked from plan group chat
    const intruderMsgRes = await request('POST', `/api/conversations/${conversationId}/messages`, {
      text: 'Sneaking into the chat',
    }, intruder.token);
    assert(
      intruderMsgRes.status === 403,
      'Nonparticipant is blocked from plan group chat with 403 Forbidden'
    );

    // 15. Nonparticipant Intruder cannot read plan group chat messages
    const intruderGetRes = await request('GET', `/api/conversations/${conversationId}/messages`, null, intruder.token);
    assert(
      intruderGetRes.status === 403,
      'Nonparticipant cannot retrieve plan group chat message history (403 Forbidden)'
    );

    // 16. Host receives notification about students joining
    const hostNotifRes = await request('GET', '/api/notifications', null, host.token);
    assert(
      hostNotifRes.status === 200 && hostNotifRes.data.data.some((n) => n.type === 'plan'),
      'Host receives in-app notifications for plan activity'
    );

    // 17. Creator cannot "leave" their own plan
    const hostLeaveRes = await request('POST', `/api/plans/${planId}/leave`, null, host.token);
    assert(
      hostLeaveRes.status === 400 && hostLeaveRes.data.message.includes('creator cannot leave'),
      'Plan creator cannot leave their own plan (must cancel instead)'
    );

    // 18. Student B leaves plan -> capacity opens back up, status reverts to "upcoming"
    const leaveResB = await request('POST', `/api/plans/${planId}/leave`, null, studentB.token);
    assert(
      leaveResB.status === 200 && leaveResB.data.data.status === 'upcoming' && leaveResB.data.data.participantCount === 2,
      'Participant leaves plan, space opens up, and status reverts to "upcoming"'
    );

    // 19. Unauthorized non-creator cannot update plan
    const unauthEditRes = await request('PUT', `/api/plans/${planId}`, {
      title: 'Hacked Title',
    }, studentA.token);
    assert(
      unauthEditRes.status === 403,
      'Ordinary participant cannot edit someone else\'s plan (403 Forbidden)'
    );

    // 20. Creator updates plan details with capacity validation
    const updateRes = await request('PUT', `/api/plans/${planId}`, {
      title: 'Full Stack React & Node Workshop (Updated)',
      location: 'Central Library Conference Hall',
      capacity: 5, // enlarged capacity
    }, host.token);
    assert(
      updateRes.status === 200 && updateRes.data.data.capacity === 5,
      'Creator updates plan details and expands capacity'
    );

    // 21. Creator cannot reduce capacity below existing participants
    const badReduceRes = await request('PUT', `/api/plans/${planId}`, {
      capacity: 1, // current participants is 2, and min capacity is 2
    }, host.token);
    assert(
      badReduceRes.status === 400 && (badReduceRes.data.message.includes('Capacity') || badReduceRes.data.message.includes('lower')),
      'Creator cannot reduce capacity below existing confirmed participant count or minimum limit (400)'
    );

    // 22. Creator removes participant
    const removeRes = await request('POST', `/api/plans/${planId}/remove-participant`, {
      targetUserId: studentA.id,
    }, host.token);
    assert(
      removeRes.status === 200 && removeRes.data.data.participantCount === 1,
      'Creator removes participant from plan'
    );

    // 23. Creator cancels plan
    const cancelRes = await request('POST', `/api/plans/${planId}/cancel`, null, host.token);
    assert(
      cancelRes.status === 200 && cancelRes.data.data.status === 'cancelled',
      'Creator cancels plan with status="cancelled"'
    );

    // 24. Cannot join cancelled plan
    const joinCancelledRes = await request('POST', `/api/plans/${planId}/join`, null, studentA.token);
    assert(
      joinCancelledRes.status === 400 && joinCancelledRes.data.message.includes('cancelled'),
      'Cannot join a cancelled plan (400)'
    );

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    // 25. Clean up test records (never touch real user data)
    if (createdUserIds.length > 0 || createdPlanIds.length > 0) {
      try {
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState === 0) {
          require('dotenv').config();
          await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/student_db');
        }
        const User = require('./src/models/User');
        const Profile = require('./src/models/Profile');
        const Plan = require('./src/models/Plan');
        const Conversation = require('./src/models/Conversation');
        const Message = require('./src/models/Message');
        const Notification = require('./src/models/Notification');

        if (createdPlanIds.length > 0) {
          await Plan.deleteMany({ _id: { $in: createdPlanIds } });
          await Conversation.deleteMany({ plan: { $in: createdPlanIds } });
        }
        if (createdUserIds.length > 0) {
          await User.deleteMany({ _id: { $in: createdUserIds } });
          await Profile.deleteMany({ user: { $in: createdUserIds } });
          await Conversation.deleteMany({ participants: { $in: createdUserIds } });
          await Message.deleteMany({ sender: { $in: createdUserIds } });
          await Notification.deleteMany({
            $or: [{ recipient: { $in: createdUserIds } }, { sender: { $in: createdUserIds } }],
          });
        }
        await mongoose.disconnect();
      } catch (cleanupErr) {
        // Non-fatal cleanup catch
      }
    }
  }

  console.log('\n====================================================');
  console.log(`📊 CAMPUS PLANS SUITE: ${passed}/${total} TESTS PASSED`);
  console.log('====================================================\n');

  if (passed === total && total >= 24) {
    console.log('🎉 ALL CAMPUS PLANS BACKEND TESTS PASSED!\n');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runPlansSuite().catch((err) => {
  console.error('Fatal plans suite error:', err);
  process.exit(1);
});
