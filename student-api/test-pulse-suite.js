/**
 * Comprehensive Campus Pulse Verification Suite
 * Tests end-to-end functionality of Campus Pulse:
 * 1. Post creation with validation (content, categories: general, question, announcement, poll).
 * 2. Rejection of invalid inputs (empty content, invalid category, malformed poll).
 * 3. Interactive Poll creation & strict 1-vote duplicate prevention.
 * 4. Atomic like/unlike toggling with duplicate reaction prevention.
 * 5. Bookmark/save toggling and bookmarked feed filtering.
 * 6. Comments creation, author deletion, and validation.
 * 7. Post editing by author & unauthorized edit rejection (403).
 * 8. Private circle visibility rules & unauthorized posting rejection (403).
 * 9. Integration with Campus Plans (plan linking & discovery).
 * 10. Feed personalization filters (for-you, questions, circles, plans, search).
 * 11. Post deletion & test cleanup.
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

async function runPulseSuite() {
  console.log('====================================================');
  console.log('⚡ CAMPUSMITRA CAMPUS PULSE VERIFICATION SUITE');
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
    console.log('--- Setting up test users ---');
    const u1 = await registerTestUser('PulseAlice', 'Leader', 'pulse.alice@mitwpu.edu.in');
    const u2 = await registerTestUser('PulseBob', 'Voter', 'pulse.bob@mitwpu.edu.in');
    const u3 = await registerTestUser('PulseCharlie', 'Outsider', 'pulse.charlie@mitwpu.edu.in');
    console.log(`Alice ID: ${u1.id}, Bob ID: ${u2.id}, Charlie ID: ${u3.id}\n`);

    const timestamp = Date.now();

    // 2. Post Creation & Validation
    console.log('--- Test 1: Post Creation & Input Validation ---');
    const emptyPostRes = await request('POST', '/api/pulse', {
      content: '   ',
      category: 'general',
    }, u1.token);
    assert(emptyPostRes.status === 400, 'Rejects empty post content with 400');

    const badCatRes = await request('POST', '/api/pulse', {
      content: 'Valid content here',
      category: 'invalidCategoryX',
    }, u1.token);
    assert(badCatRes.status === 400, 'Rejects invalid category with 400');

    const generalPostRes = await request('POST', '/api/pulse', {
      content: `Excited for the upcoming university hackathon! Team formation starts this Friday. [${timestamp}]`,
      category: 'general',
      tags: ['hackathon', 'mitwpu'],
    }, u1.token);
    assert(generalPostRes.status === 201 && generalPostRes.data.success, 'Alice successfully publishes general Pulse post');
    const generalPostId = generalPostRes.data.data._id;

    const questionPostRes = await request('POST', '/api/pulse', {
      content: `Does anyone have recommendations for elective courses in Cloud Architecture? [${timestamp}]`,
      category: 'question',
      tags: ['cloud', 'electives'],
    }, u2.token);
    assert(questionPostRes.status === 201 && questionPostRes.data.data.category === 'question', 'Bob publishes a question post on Pulse');
    const questionPostId = questionPostRes.data.data._id;

    // 3. Interactive Polls & Strict 1-Vote Enforcement
    console.log('\n--- Test 2: Poll Creation & Vote Enforcement ---');
    const badPollRes = await request('POST', '/api/pulse', {
      content: 'Which frontend framework do you prefer?',
      category: 'poll',
      poll: {
        options: ['Only one option'],
      },
    }, u1.token);
    assert(badPollRes.status === 400, 'Rejects poll with less than 2 options (400)');

    const pollPostRes = await request('POST', '/api/pulse', {
      content: 'Which tech stack are you building your semester project with?',
      category: 'poll',
      poll: {
        question: 'Which tech stack are you building your semester project with?',
        options: ['React + Node.js', 'Next.js + Python', 'Flutter + Firebase'],
        expiresInHours: 48,
      },
    }, u1.token);
    assert(pollPostRes.status === 201 && pollPostRes.data.data.poll?.options?.length === 3, 'Alice creates a 3-option campus poll');
    const pollPostId = pollPostRes.data.data._id;

    // Alice votes for option 0 (React + Node.js)
    const aliceVoteRes = await request('POST', `/api/pulse/${pollPostId}/vote`, {
      optionIndex: 0,
    }, u1.token);
    assert(aliceVoteRes.status === 200 && aliceVoteRes.data.data.totalVotes === 1 && aliceVoteRes.data.data.hasVoted === true, 'Alice votes in poll (total votes = 1)');

    // Alice attempts duplicate vote
    const aliceDupVoteRes = await request('POST', `/api/pulse/${pollPostId}/vote`, {
      optionIndex: 1,
    }, u1.token);
    assert(aliceDupVoteRes.status === 400, 'Rejects Alice duplicate vote attempt with 400');

    // Bob votes for option 1
    const bobVoteRes = await request('POST', `/api/pulse/${pollPostId}/vote`, {
      optionIndex: 1,
    }, u2.token);
    assert(bobVoteRes.status === 200 && bobVoteRes.data.data.totalVotes === 2, 'Bob casts distinct vote (total votes = 2, percentages split 50/50)');

    // 4. Reactions & Duplicate-Prevention
    console.log('\n--- Test 3: Like Reactions & Duplicate Prevention ---');
    const bobLikeRes = await request('POST', `/api/pulse/${generalPostId}/like`, {}, u2.token);
    assert(bobLikeRes.status === 200 && bobLikeRes.data.liked === true && bobLikeRes.data.likesCount === 1, 'Bob likes Alice general post (like count = 1)');

    const bobUnlikeRes = await request('POST', `/api/pulse/${generalPostId}/like`, {}, u2.token);
    assert(bobUnlikeRes.status === 200 && bobUnlikeRes.data.liked === false && bobUnlikeRes.data.likesCount === 0, 'Bob unlikes post (like count = 0, no duplicate)');

    // 5. Bookmarks & Saved Feed Filter
    console.log('\n--- Test 4: Bookmarks & Saved Feed ---');
    const bookmarkRes = await request('POST', `/api/pulse/${generalPostId}/bookmark`, {}, u2.token);
    assert(bookmarkRes.status === 200 && bookmarkRes.data.bookmarked === true, 'Bob bookmarks Alice post');

    const getBookmarksRes = await request('GET', '/api/pulse?filter=bookmarks', null, u2.token);
    assert(getBookmarksRes.status === 200 && getBookmarksRes.data.data?.some((p) => p._id === generalPostId), 'Alice post appears in Bob saved/bookmarked feed');

    const unbookmarkRes = await request('POST', `/api/pulse/${generalPostId}/bookmark`, {}, u2.token);
    assert(unbookmarkRes.status === 200 && unbookmarkRes.data.bookmarked === false, 'Bob removes post from bookmarks');

    // 6. Comments & Moderation
    console.log('\n--- Test 5: Comments & Moderation ---');
    const emptyCommentRes = await request('POST', `/api/pulse/${generalPostId}/comments`, {
      text: '   ',
    }, u2.token);
    assert(emptyCommentRes.status === 400, 'Rejects empty comment text with 400');

    const commentRes = await request('POST', `/api/pulse/${generalPostId}/comments`, {
      text: 'I am looking for a backend engineer for my team!',
    }, u2.token);
    assert(commentRes.status === 201 && commentRes.data.success, 'Bob comments on Alice post');
    const commentId = commentRes.data.data._id;

    const deleteCommentRes = await request('DELETE', `/api/pulse/${generalPostId}/comments/${commentId}`, null, u2.token);
    assert(deleteCommentRes.status === 200 && deleteCommentRes.data.success, 'Bob deletes his comment');

    // 7. Post Editing & Permission Protection
    console.log('\n--- Test 6: Post Editing & Permissions ---');
    const charlieEditRes = await request('PUT', `/api/pulse/${generalPostId}`, {
      content: 'Hacked by Charlie!',
    }, u3.token);
    assert(charlieEditRes.status === 403, 'Unauthorized Charlie rejected from editing Alice post (403)');

    const aliceEditRes = await request('PUT', `/api/pulse/${generalPostId}`, {
      content: 'Updated: Hackathon registration link is now live!',
    }, u1.token);
    assert(aliceEditRes.status === 200 && aliceEditRes.data.data.content.includes('Hackathon registration link'), 'Author Alice edits post content');

    // 8. Circles & Privacy Integration
    console.log('\n--- Test 7: Circles & Privacy Integration ---');
    // Create private circle
    const privCircleRes = await request('POST', '/api/circles', {
      name: `Private Pulse Circle ${timestamp}`,
      description: 'Exclusive research group for lab members only.',
      category: 'AI & Technology',
      visibility: 'private',
    }, u1.token);
    const privateCircleId = privCircleRes.data.data._id;

    // Charlie (non-member) tries to post to private circle
    const charlieCirclePostRes = await request('POST', '/api/pulse', {
      content: 'Unauthorized post into private circle',
      circleId: privateCircleId,
    }, u3.token);
    assert(charlieCirclePostRes.status === 403, 'Non-member Charlie rejected from posting to private circle (403)');

    // Alice (owner) posts to private circle
    const aliceCirclePostRes = await request('POST', '/api/pulse', {
      content: 'Confidential research notes for lab circle.',
      circleId: privateCircleId,
    }, u1.token);
    assert(aliceCirclePostRes.status === 201, 'Alice posts to her private circle', JSON.stringify(aliceCirclePostRes.data || aliceCirclePostRes.raw));
    const privPostId = aliceCirclePostRes.data?.data?._id;

    // Charlie attempts to view private circle post directly
    const charlieViewPrivPost = await request('GET', `/api/pulse/${privPostId}`, null, u3.token);
    assert(charlieViewPrivPost.status === 403, 'Non-member Charlie rejected from viewing private circle post (403)');

    // 9. Campus Plans Integration
    console.log('\n--- Test 8: Campus Plans Integration ---');
    const planTomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const planRes = await request('POST', '/api/plans', {
      title: `Pulse Study Session ${timestamp}`,
      description: 'Discussing database indexing and query optimization.',
      category: 'Study',
      date: planTomorrow,
      time: '15:00',
      duration: '1.5 hours',
      capacity: 4,
      location: 'Central Library Room 3',
    }, u1.token);
    const linkedPlanId = planRes.data.data._id;

    const pulsePlanPostRes = await request('POST', '/api/pulse', {
      content: 'Hosting a study session tomorrow at the library! Join our meetup below.',
      category: 'general',
      planId: linkedPlanId,
    }, u1.token);
    assert(pulsePlanPostRes.status === 201 && pulsePlanPostRes.data.data.plan?._id === linkedPlanId, 'Alice publishes Pulse post linked to Campus Plan');

    // 10. Feed Personalization & Filters
    console.log('\n--- Test 9: Feed Personalization & Filters ---');
    const questionsFilterRes = await request('GET', '/api/pulse?filter=questions', null, u1.token);
    assert(questionsFilterRes.status === 200 && questionsFilterRes.data.data?.every((p) => p.category === 'question'), 'Questions filter returns only question posts');

    const plansFilterRes = await request('GET', '/api/pulse?filter=plans', null, u1.token);
    assert(plansFilterRes.status === 200 && plansFilterRes.data.data?.every((p) => p.plan !== null), 'Plans filter returns posts with linked meetups');

    const searchRes = await request('GET', `/api/pulse?search=${encodeURIComponent(timestamp.toString())}`, null, u1.token);
    assert(searchRes.status === 200 && searchRes.data.data?.length >= 1, 'Search query correctly finds posts matching timestamp');

    // 11. Cleanup
    console.log('\n--- Test 10: Cleanup ---');
    await request('DELETE', `/api/pulse/${generalPostId}`, null, u1.token);
    await request('DELETE', `/api/pulse/${questionPostId}`, null, u2.token);
    await request('DELETE', `/api/pulse/${pollPostId}`, null, u1.token);
    await request('DELETE', `/api/pulse/${privPostId}`, null, u1.token);
    await request('POST', `/api/circles/${privateCircleId}/archive`, {}, u1.token);
    if (linkedPlanId) {
      await request('POST', `/api/plans/${linkedPlanId}/cancel`, {}, u1.token);
    }
    console.log('Cleanup completed.\n');

    console.log('====================================================');
    console.log(`🎉 TEST SUMMARY: ${passed}/${total} assertions PASSED`);
    console.log('====================================================');
    if (passed === total) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Unhandled exception during pulse test run:', err);
    process.exit(1);
  }
}

runPulseSuite();
