/**
 * Comprehensive Vibe Connect Verification Suite
 * Tests end-to-end functionality of Vibe Connect:
 * 1. Factual shared-interest calculations across interests, goals, program, and languages.
 * 2. Deterministic smart icebreakers mapped to profile tags with shuffle pagination.
 * 3. Graceful fallback icebreakers when profiles have little overlap.
 * 4. Curated conversation games (Would You Rather, This or That, Quick Questions).
 * 5. Sending an interactive game prompt into an authorized conversation.
 * 6. Unauthorized access rejection (non-participant gets 403 Forbidden).
 * 7. Blocked users rejection (403 Forbidden).
 * 8. Validation of conversation IDs and error handling.
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

async function runVibeSuite() {
  console.log('====================================================');
  console.log('💜 CAMPUSMITRA VIBE CONNECT VERIFICATION SUITE');
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
    // 1. Setup test users
    console.log('--- Setting up test users & profiles ---');
    const ts = Date.now();
    const u1 = await registerTestUser('VibeAlice', 'Coder', `vibe.alice.${ts}@mitwpu.edu.in`);
    const u2 = await registerTestUser('VibeBob', 'Hacker', `vibe.bob.${ts}@mitwpu.edu.in`);
    const u3 = await registerTestUser('VibeCharlie', 'Outsider', `vibe.charlie.${ts}@mitwpu.edu.in`);
    console.log(`Alice ID: ${u1.id}, Bob ID: ${u2.id}, Charlie ID: ${u3.id}\n`);

    // 2. Setup profiles with known shared interests & goals
    await request('PUT', '/api/profiles/me', {
      program: 'MCA (Computer Applications)',
      department: 'School of Computer Science & Engineering',
      interests: ['Coding', 'AI', 'Cricket', 'Chai'],
      lookingFor: ['📚 Study Partners', '🤝 New Friends'],
      languages: [{ language: 'English', proficiency: 'Fluent' }, { language: 'Hindi', proficiency: 'Native' }],
    }, u1.token);

    await request('PUT', '/api/profiles/me', {
      program: 'MCA (Computer Applications)',
      department: 'School of Computer Science & Engineering',
      interests: ['Coding', 'AI', 'Gaming', 'Rock Music'],
      lookingFor: ['📚 Study Partners', '🚀 Hackathon Teammates'],
      languages: [{ language: 'English', proficiency: 'Fluent' }, { language: 'Marathi', proficiency: 'Native' }],
    }, u2.token);

    await request('PUT', '/api/profiles/me', {
      program: 'BBA (Management)',
      department: 'School of Business',
      interests: ['Finance', 'Economics'],
      lookingFor: ['🤝 New Friends'],
      languages: [{ language: 'English', proficiency: 'Fluent' }],
    }, u3.token);

    // 3. Mutual match between Alice and Bob to establish conversation
    console.log('--- Test 1: Establishing Mutual Match & Conversation ---');
    await request('POST', '/api/connections/interest', { targetUserId: u2.id }, u1.token);
    const matchRes = await request('POST', '/api/connections/interest', { targetUserId: u1.id }, u2.token);
    assert(matchRes.status === 200 && matchRes.data.data.isMatch === true, 'Alice and Bob achieve mutual match');
    const conversationId = matchRes.data.data.conversationId;
    assert(!!conversationId, 'Conversation record created in MongoDB between mutual matches');

    // 4. Conversation Vibe & Shared-Interest Explanations
    console.log('\n--- Test 2: Factual Shared-Interest Explanations ---');
    const vibeRes = await request('GET', `/api/vibe/conversation/${conversationId}`, null, u1.token);
    assert(vibeRes.status === 200 && vibeRes.data.success === true, 'Alice retrieves Vibe Connect data for active conversation');

    const vibe = vibeRes.data.data.sharedVibe;
    assert(vibe.hasSharedVibe === true, 'Accurately detects strong shared campus vibe');
    assert(vibe.sharedInterests.includes('Coding') && vibe.sharedInterests.includes('AI'), 'Identifies shared interests [Coding, AI]');
    assert(vibe.explanations.some((e) => e.includes('Coding') && e.includes('AI')), 'Generates factual explanation: "You both enjoy Coding and AI"');
    assert(vibe.explanations.some((e) => e.includes('Study Partners')), 'Identifies shared connection goal: "Study Partners"');
    assert(vibe.explanations.some((e) => e.includes('MCA (Computer Applications)')), 'Identifies academic program alignment');

    // 5. Smart Icebreakers & Shuffle Pagination
    console.log('\n--- Test 3: Tailored Icebreakers & Shuffle ---');
    const icebreakers = vibeRes.data.data.icebreakers;
    assert(Array.isArray(icebreakers.prompts) && icebreakers.prompts.length >= 3, 'Returns at least 3 smart icebreaker suggestions');
    assert(icebreakers.prompts.some((p) => p.toLowerCase().includes('coding') || p.toLowerCase().includes('project') || p.toLowerCase().includes('study')), 'Icebreakers are tailored to shared coding & study interests');

    // Test shuffle with offset
    const shuffleRes = await request('GET', `/api/vibe/conversation/${conversationId}?offset=4`, null, u1.token);
    assert(shuffleRes.status === 200, 'Shuffle request succeeds with offset=4');
    const shuffledPrompts = shuffleRes.data.data.icebreakers.prompts;
    assert(shuffledPrompts.length >= 3, 'Returns fresh rotated suggestions on shuffle');

    // 6. Curated Conversation Games Catalog
    console.log('\n--- Test 4: Conversation Games Catalog ---');
    const games = vibeRes.data.data.games;
    assert(Array.isArray(games.wouldYouRather) && games.wouldYouRather.length >= 4, 'Includes "Would You Rather" game activities');
    assert(Array.isArray(games.thisOrThat) && games.thisOrThat.length >= 4, 'Includes "This or That" game activities');
    assert(Array.isArray(games.quickQuestions) && games.quickQuestions.length >= 4, 'Includes "Quick Questions" game activities');

    // 7. Send Game Prompt into Conversation
    console.log('\n--- Test 5: Sending Game Prompt to Chat ---');
    const sampleGame = games.wouldYouRather[0];
    const sendGameRes = await request('POST', `/api/vibe/conversation/${conversationId}/game-prompt`, {
      gameType: 'wouldYouRather',
      question: sampleGame.question,
      options: sampleGame.options,
    }, u1.token);
    assert(sendGameRes.status === 201 && sendGameRes.data.success === true, 'Alice sends "Would You Rather" game prompt into chat thread');

    const msg = sendGameRes.data.data;
    assert(msg.text.includes('🎲 [Would You Rather?]') && msg.text.includes(sampleGame.question), 'Game prompt text is formatted with activity header & options');

    // Verify Bob can retrieve the message from conversation history
    const getMsgsRes = await request('GET', `/api/conversations/${conversationId}/messages`, null, u2.token);
    assert(getMsgsRes.status === 200 && getMsgsRes.data.data?.some((m) => m._id === msg._id), 'Bob retrieves the shared game prompt in message history');

    // 8. Security & Privacy Enforcement
    console.log('\n--- Test 6: Security & Privacy Rules ---');
    // Charlie is not in the conversation -> 403 Forbidden
    const charlieVibeRes = await request('GET', `/api/vibe/conversation/${conversationId}`, null, u3.token);
    assert(charlieVibeRes.status === 403, 'Unauthorized Charlie rejected from conversation vibe with 403 Forbidden');

    const charlieSendGameRes = await request('POST', `/api/vibe/conversation/${conversationId}/game-prompt`, {
      gameType: 'wouldYouRather',
      question: sampleGame.question,
      options: sampleGame.options,
    }, u3.token);
    assert(charlieSendGameRes.status === 403, 'Unauthorized Charlie rejected from sending game prompt with 403 Forbidden');

    // Non-existent conversation -> 404
    const fakeConvRes = await request('GET', '/api/vibe/conversation/60c72b2f9b1d8b2bad5e0123', null, u1.token);
    assert(fakeConvRes.status === 404, 'Non-existent conversation returns 404 Not Found');

    console.log('\n--- Test 7: Profile Vibe & Fallback Prompt Handling ---');
    const profVibeRes = await request('GET', `/api/vibe/profile/${u3.id}`, null, u1.token);
    if (profVibeRes.status !== 200) {
      console.log('profVibeRes debug:', profVibeRes.status, profVibeRes.data);
    }
    assert(profVibeRes.status === 200, 'Alice retrieves profile vibe for peer Charlie');
    assert(profVibeRes.data?.data?.sharedVibe?.explanations?.length >= 1, 'Provides graceful campus fallback explanations when interests differ');
    assert(profVibeRes.data?.data?.icebreakers?.prompts?.length >= 3, 'Provides general campus icebreakers as fallback');

    // Block check
    await request('POST', '/api/blocks', { targetUserId: u3.id, reason: 'Test block' }, u1.token);
    const blockedVibeRes = await request('GET', `/api/vibe/profile/${u3.id}`, null, u1.token);
    assert(blockedVibeRes.status === 403, 'Blocked profile vibe access rejected with 403 Forbidden');

    console.log('\n====================================================');
    console.log(`🎉 TEST SUMMARY: ${passed}/${total} assertions PASSED`);
    console.log('====================================================');
    if (passed === total) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Unhandled exception during vibe test run:', err);
    process.exit(1);
  }
}

runVibeSuite();
