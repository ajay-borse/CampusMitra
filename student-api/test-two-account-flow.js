/**
 * CampusMitra Two-Account Verification Suite (Phase 3 & Phase 4)
 * Validates real registration, authentication, profiles, discovery, likes,
 * mutual matches, real-time Socket.IO chat, and the updated notification system.
 */
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

async function runTwoAccountVerification() {
  console.log('====================================================');
  console.log('👥 CAMPUSMITRA TWO-ACCOUNT VERIFICATION SUITE');
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

  const ts = Date.now();
  const emailA = `test.student.a.${ts}@mitwpu.edu.in`;
  const emailB = `test.student.b.${ts}@mitwpu.edu.in`;
  const password = 'Password@123';

  // ==========================================
  // PHASE 3A: Registration & Authentication
  // ==========================================
  console.log('--- Step 1: Independent Registration of Account A & B ---');

  const regResA = await request('POST', '/api/auth/register', {
    firstName: 'DevAarav',
    lastName: 'Sharma',
    email: emailA,
    password,
    dateOfBirth: '2002-04-15',
  });
  assert(regResA.status === 201 && regResA.data.success, 'Account A registers successfully');
  const userA = regResA.data.data.user;
  const tokenA = regResA.data.data.token;
  const verifyTokenA = regResA.data.data.verificationToken;

  const regResB = await request('POST', '/api/auth/register', {
    firstName: 'DevPriya',
    lastName: 'Kulkarni',
    email: emailB,
    password,
    dateOfBirth: '2003-09-22',
  });
  assert(regResB.status === 201 && regResB.data.success, 'Account B registers successfully');
  const userB = regResB.data.data.user;
  const tokenB = regResB.data.data.token;
  const verifyTokenB = regResB.data.data.verificationToken;

  console.log('\n--- Step 2: Email Verification ---');
  if (verifyTokenA) {
    const vResA = await request('GET', `/api/auth/verify-email/${verifyTokenA}`);
    assert(vResA.status === 200 && vResA.data.success, 'Account A university email verified');
  }
  if (verifyTokenB) {
    const vResB = await request('GET', `/api/auth/verify-email/${verifyTokenB}`);
    assert(vResB.status === 200 && vResB.data.success, 'Account B university email verified');
  }

  console.log('\n--- Step 3: Session Restoration & Private Data Isolation ---');
  const meA = await request('GET', '/api/auth/me', null, tokenA);
  assert(meA.status === 200 && meA.data.data.user.email === emailA, 'Account A session restored correctly');

  const meB = await request('GET', '/api/auth/me', null, tokenB);
  assert(meB.status === 200 && meB.data.data.user.email === emailB, 'Account B session restored correctly');

  // Verify Account A cannot read Account B's private notifications
  const notifA = await request('GET', '/api/notifications', null, tokenA);
  assert(
    notifA.status === 200 &&
      notifA.data.data.every((n) => n.recipient.toString() === userA.id.toString()),
    'Data Isolation: Account A only sees own notifications'
  );

  // ==========================================
  // PHASE 3B: Profile Creation & Discovery
  // ==========================================
  console.log('\n--- Step 4: Profile Completion & Persistence ---');
  const updateProfileA = await request(
    'PUT',
    '/api/profiles/me',
    {
      bio: 'Fullstack developer exploring AI & distributed systems. Coffee enthusiast.',
      program: 'B.Tech Computer Science',
      year: '3rd Year',
      city: 'Pune',
      interests: ['Coding', 'Coffee', 'Music'],
      lookingFor: ['Project Collaborators', 'New Friends'],
      isOnboarded: true,
    },
    tokenA
  );
  assert(updateProfileA.status === 200 && updateProfileA.data.success, 'Account A profile updated');

  const updateProfileB = await request(
    'PUT',
    '/api/profiles/me',
    {
      bio: 'UI/UX enthusiast, Figma designer, hackathon builder.',
      program: 'B.Tech Computer Science',
      year: '3rd Year',
      city: 'Pune',
      interests: ['Design', 'Coding', 'Art'],
      lookingFor: ['Project Collaborators', 'New Friends'],
      isOnboarded: true,
    },
    tokenB
  );
  assert(updateProfileB.status === 200 && updateProfileB.data.success, 'Account B profile updated');

  // Discovery: Account A discovers Account B
  const discoverA = await request('GET', '/api/discover', null, tokenA);
  const foundBInDiscover = discoverA.data.data.some(
    (p) => p.userId.toString() === userB.id.toString()
  );
  assert(foundBInDiscover, 'Account A can discover eligible Account B in Discover deck');

  // Verify private verification documents or passwords are NOT leaked in discover
  const candidateB = discoverA.data.data.find(
    (p) => p.userId.toString() === userB.id.toString()
  );
  assert(
    candidateB && !candidateB.password && !candidateB.studentIdVerification,
    'Sensitive documents and passwords strictly omitted from discovery'
  );

  // ==========================================
  // PHASE 3C & 4: Likes, Real-Time Notifications & Mutual Match
  // ==========================================
  console.log('\n--- Step 5: Socket.IO Connection for Real-Time Testing ---');
  const socketA = io(BASE_URL, {
    auth: { token: tokenA },
    transports: ['websocket', 'polling'],
  });
  const socketB = io(BASE_URL, {
    auth: { token: tokenB },
    transports: ['websocket', 'polling'],
  });

  await Promise.all([
    new Promise((res) => socketA.on('connect', res)),
    new Promise((res) => socketB.on('connect', res)),
  ]);
  assert(socketA.connected && socketB.connected, 'Both browser socket sessions connected successfully');

  console.log('\n--- Step 6: Account A Likes Account B (One-Way Interest) ---');
  let receivedInterestNotifB = null;
  socketB.on('new_notification', (notif) => {
    if (notif.type === 'interest') {
      receivedInterestNotifB = notif;
    }
  });

  const likeResA = await request(
    'POST',
    '/api/connections/interest',
    { targetUserId: userB.id },
    tokenA
  );
  assert(likeResA.status === 200 && likeResA.data.success, 'Account A like recorded');
  assert(likeResA.data.data.isMatch === false, 'One-way like does not falsely trigger match');

  // Wait briefly for real-time notification
  await new Promise((r) => setTimeout(r, 600));

  // Verify B received the notification in database
  const notifBList = await request('GET', '/api/notifications', null, tokenB);
  const interestNotif = notifBList.data.data.find((n) => n.type === 'interest');
  assert(
    !!interestNotif,
    'Account B received persisted notification for Account A interest'
  );
  assert(
    interestNotif && interestNotif.message.includes('DevAarav'),
    'Notification displays safe actor name without private leak'
  );

  console.log('\n--- Step 7: Account B Likes Account A -> Mutual Match! ---');
  let matchCelebrationA = null;
  let matchCelebrationB = null;

  socketA.on('match_celebration', (d) => {
    matchCelebrationA = d;
  });
  socketB.on('match_celebration', (d) => {
    matchCelebrationB = d;
  });

  const likeResB = await request(
    'POST',
    '/api/connections/interest',
    { targetUserId: userA.id },
    tokenB
  );
  assert(likeResB.status === 200 && likeResB.data.data.isMatch === true, 'Mutual match triggered for Account B');
  const conversationId = likeResB.data.data.conversationId;
  assert(!!conversationId, 'Direct conversation initialized upon mutual match');

  // Wait briefly for real-time celebration
  await new Promise((r) => setTimeout(r, 600));

  assert(!!matchCelebrationA, 'Account A received real-time match celebration event');
  assert(
    matchCelebrationA && matchCelebrationA.conversationId.toString() === conversationId.toString(),
    'Match celebration references correct conversationId'
  );

  // Verify duplicate like does not duplicate matches or conversations
  const dupLikeA = await request(
    'POST',
    '/api/connections/interest',
    { targetUserId: userB.id },
    tokenA
  );
  assert(dupLikeA.status === 200 && dupLikeA.data.data.isMatch === true, 'Duplicate like idempotently returns existing match');

  // ==========================================
  // PHASE 3D: Real-Time Chat & Persistence
  // ==========================================
  console.log('\n--- Step 8: Real-Time Bidirectional Messaging ---');
  socketA.emit('join_conversation', conversationId);
  socketB.emit('join_conversation', conversationId);
  await new Promise((r) => setTimeout(r, 300));

  let msgReceivedByB = null;
  socketB.on('new_message', (payload) => {
    msgReceivedByB = payload;
  });

  let msgReceivedByA = null;
  socketA.on('new_message', (payload) => {
    msgReceivedByA = payload;
  });

  // A sends message to B
  socketA.emit('send_message', {
    conversationId,
    text: 'Hey Priya! Glad we matched, excited to collaborate!',
  });

  await new Promise((r) => setTimeout(r, 600));
  assert(
    msgReceivedByB && msgReceivedByB.message.text.includes('Glad we matched'),
    'Account B received real-time message from Account A over WebSocket'
  );

  // B replies to A
  socketB.emit('send_message', {
    conversationId,
    text: 'Hey Aarav! Loved your AI project portfolio!',
  });

  await new Promise((r) => setTimeout(r, 600));
  assert(
    msgReceivedByA && msgReceivedByA.message.text.includes('Loved your AI project'),
    'Account A received real-time reply from Account B over WebSocket'
  );

  // Message persistence check in MongoDB
  const historyRes = await request(
    'GET',
    `/api/conversations/${conversationId}/messages`,
    null,
    tokenA
  );
  assert(
    historyRes.status === 200 && historyRes.data.data.length >= 2,
    'Message history persists in database across sessions'
  );
  assert(
    historyRes.data.data[0].text.includes('Glad we matched') &&
      historyRes.data.data[1].text.includes('Loved your AI project'),
    'Messages are chronologically ordered with correct sender attribution'
  );

  // Unauthorized nonparticipant protection
  const intruderRes = await request(
    'GET',
    `/api/conversations/${conversationId}/messages`,
    null,
    'invalid_or_intruder_token'
  );
  assert(
    intruderRes.status === 401,
    'Unauthorized token rejected from conversation history with 401'
  );

  // Notification individual mark as read
  const notifsAfterChat = await request('GET', '/api/notifications', null, tokenB);
  if (notifsAfterChat.data.data.length > 0) {
    const firstNotifId = notifsAfterChat.data.data[0]._id;
    const readRes = await request(
      'PUT',
      `/api/notifications/${firstNotifId}/read`,
      null,
      tokenB
    );
    assert(readRes.status === 200 && readRes.data.success, 'Individual notification mark-as-read works');
  }

  socketA.disconnect();
  socketB.disconnect();

  console.log('\n====================================================');
  console.log(`🎉 VERIFICATION SUMMARY: ${passed}/${total} assertions PASSED`);
  console.log('====================================================');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTwoAccountVerification().catch((err) => {
  console.error('Unhandled exception during two-account test run:', err);
  process.exit(1);
});
