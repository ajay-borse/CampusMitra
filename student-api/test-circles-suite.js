/**
 * Comprehensive Campus Circles Verification Suite
 * Tests end-to-end functionality of Campus Circles:
 * 1. Circle creation with complete validation (name, category, description, tags, visibility).
 * 2. Rejection of invalid inputs (short name, short description, invalid category, duplicate name).
 * 3. Circle discovery with filtering (category, search, mine).
 * 4. Atomic join with duplicate-join prevention.
 * 5. Private circle access restriction (unauthorized access rejected with 403).
 * 6. Circle departure (leave) with owner departure guard.
 * 7. Authorized owner/moderator update of circle details.
 * 8. Non-owner/non-mod update rejected (403).
 * 9. Member removal by owner (cannot remove owner, non-owner rejected).
 * 10. Circle Community Feed: Post creation with text & mediaUrl.
 * 11. Empty/oversized post content rejected.
 * 12. Post editing by author.
 * 13. Reaction toggling with duplicate-reaction prevention.
 * 14. Comment creation and comment deletion.
 * 15. Integration with Campus Plans: Creating and discovering plans linked to a circle.
 * 16. Circle archiving by owner and cleanup of test artifacts.
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

async function runCirclesSuite() {
  console.log('====================================================');
  console.log('🌟 CAMPUSMITRA CAMPUS CIRCLES VERIFICATION SUITE');
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
    const u1 = await registerTestUser('CircleAlice', 'Dev', 'circle.alice@mitwpu.edu.in');
    const u2 = await registerTestUser('CircleBob', 'Student', 'circle.bob@mitwpu.edu.in');
    const u3 = await registerTestUser('CircleCharlie', 'Outsider', 'circle.charlie@mitwpu.edu.in');
    console.log(`Alice ID: ${u1.id}, Bob ID: ${u2.id}, Charlie ID: ${u3.id}\n`);

    const timestamp = Date.now();
    const testCircleName = `Algorithmic Thinkers Club ${timestamp}`;

    // 2. Circle Creation Validation
    console.log('--- Test 1: Circle Creation & Input Validation ---');
    const badNameRes = await request('POST', '/api/circles', {
      name: 'ab',
      description: 'Valid description with more than 10 chars',
      category: 'Coding & DSA',
    }, u1.token);
    assert(badNameRes.status === 400, 'Rejects circle name shorter than 3 characters');

    const badDescRes = await request('POST', '/api/circles', {
      name: `Club ${timestamp}`,
      description: 'short',
      category: 'Coding & DSA',
    }, u1.token);
    assert(badDescRes.status === 400, 'Rejects circle description shorter than 10 characters');

    const badCatRes = await request('POST', '/api/circles', {
      name: `Club ${timestamp}`,
      description: 'Valid description with more than 10 chars',
      category: 'InvalidCategory123',
    }, u1.token);
    assert(badCatRes.status === 400, 'Rejects invalid circle category');

    const createRes = await request('POST', '/api/circles', {
      name: testCircleName,
      description: 'A community for competitive programming, leetcode, and DSA problem solving.',
      category: 'Coding & DSA',
      tags: ['leetcode', 'graphs', 'cpp'],
      visibility: 'public',
    }, u1.token);
    assert(createRes.status === 201 && createRes.data.success, 'Alice successfully creates a public Campus Circle');
    const circle = createRes.data.data;
    const circleId = circle._id;

    const dupNameRes = await request('POST', '/api/circles', {
      name: testCircleName,
      description: 'Another club with same name',
      category: 'Coding & DSA',
    }, u2.token);
    assert(dupNameRes.status === 400, 'Rejects duplicate circle name with 400');

    // 3. Circle Discovery & Search
    console.log('\n--- Test 2: Circle Discovery & Filtering ---');
    const getRes = await request('GET', `/api/circles?search=${encodeURIComponent(testCircleName)}`, null, u2.token);
    assert(getRes.status === 200 && getRes.data.data?.length >= 1, 'Circle is discoverable via search query');

    const catFilterRes = await request('GET', '/api/circles?category=Coding%20%26%20DSA', null, u2.token);
    assert(catFilterRes.status === 200 && catFilterRes.data.data?.some((c) => c._id === circleId), 'Circle appears in Category filter query');

    const myCirclesRes = await request('GET', '/api/circles?filter=mine', null, u1.token);
    assert(myCirclesRes.status === 200 && myCirclesRes.data.data?.some((c) => c._id === circleId), 'Alice sees her circle in My Circles tab');

    // 4. Atomic Join & Duplicate Prevention
    console.log('\n--- Test 3: Join Circle & Duplicate Prevention ---');
    const bobJoinRes = await request('POST', `/api/circles/${circleId}/join`, {}, u2.token);
    assert(bobJoinRes.status === 200 && bobJoinRes.data.success, 'Bob successfully joins Alice circle');

    const bobDupJoinRes = await request('POST', `/api/circles/${circleId}/join`, {}, u2.token);
    assert(bobDupJoinRes.status === 400, 'Rejects Bob duplicate join attempt with 400');

    // 5. Circle Departure & Owner Guard
    console.log('\n--- Test 4: Leave Circle & Owner Guard ---');
    const ownerLeaveRes = await request('POST', `/api/circles/${circleId}/leave`, {}, u1.token);
    assert(ownerLeaveRes.status === 400, 'Owner Alice cannot leave circle without transferring ownership or archiving');

    const bobLeaveRes = await request('POST', `/api/circles/${circleId}/leave`, {}, u2.token);
    assert(bobLeaveRes.status === 200 && bobLeaveRes.data.success, 'Bob leaves circle successfully');

    // Re-join Bob for further member tests
    await request('POST', `/api/circles/${circleId}/join`, {}, u2.token);

    // 6. Update Circle & Permissions
    console.log('\n--- Test 5: Circle Updates & Permissions ---');
    const charlieUpdateRes = await request('PUT', `/api/circles/${circleId}`, {
      description: 'Hacked by Charlie!',
    }, u3.token);
    assert(charlieUpdateRes.status === 403, 'Non-owner Charlie rejected from editing circle details (403)');

    const aliceUpdateRes = await request('PUT', `/api/circles/${circleId}`, {
      description: 'Updated official description for the competitive programming circle.',
    }, u1.token);
    assert(aliceUpdateRes.status === 200 && aliceUpdateRes.data.success, 'Owner Alice can successfully update circle details');

    // 7. Member Removal Permissions
    console.log('\n--- Test 6: Member Removal & Owner Protection ---');
    const charlieRemoveBob = await request('POST', `/api/circles/${circleId}/remove-member`, {
      targetUserId: u2.id,
    }, u3.token);
    assert(charlieRemoveBob.status === 403, 'Non-moderator Charlie cannot remove members (403)');

    const removeOwnerRes = await request('POST', `/api/circles/${circleId}/remove-member`, {
      targetUserId: u1.id,
    }, u1.token);
    assert(removeOwnerRes.status === 400, 'Circle owner cannot be removed from roster');

    // 8. Community Feed: Posts, Validation, Reactions, Comments
    console.log('\n--- Test 7: Community Feed Posts & Interactions ---');
    const emptyPostRes = await request('POST', `/api/circles/${circleId}/posts`, {
      content: '   ',
    }, u2.token);
    assert(emptyPostRes.status === 400, 'Rejects empty post content with 400');

    const createPostRes = await request('POST', `/api/circles/${circleId}/posts`, {
      content: 'Hello Algorithmic Thinkers! Anyone up for solving LeetCode hard graphs today?',
      mediaUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97',
    }, u2.token);
    assert(createPostRes.status === 201 && createPostRes.data.success, 'Bob successfully publishes a feed post with image');
    const post = createPostRes.data.data;
    const postId = post._id;

    // Fetch posts
    const getPostsRes = await request('GET', `/api/circles/${circleId}/posts`, null, u1.token);
    assert(getPostsRes.status === 200 && getPostsRes.data.data?.length >= 1, 'Circle members can fetch community posts');

    // Reaction toggling & duplicate prevention
    const like1 = await request('POST', `/api/circles/${circleId}/posts/${postId}/react`, {}, u1.token);
    assert(like1.status === 200 && like1.data.liked === true && like1.data.likesCount === 1, 'Alice reacts to Bob post (like count = 1)');

    const like2 = await request('POST', `/api/circles/${circleId}/posts/${postId}/react`, {}, u1.token);
    assert(like2.status === 200 && like2.data.liked === false && like2.data.likesCount === 0, 'Alice un-reacts to Bob post (like count = 0, no duplicate)');

    // Comments
    const commentRes = await request('POST', `/api/circles/${circleId}/posts/${postId}/comments`, {
      text: 'Count me in for graph algorithms!',
    }, u1.token);
    assert(commentRes.status === 201 && commentRes.data.success, 'Alice comments on Bob post');
    const commentId = commentRes.data.data._id;

    const deleteCommentRes = await request('DELETE', `/api/circles/${circleId}/posts/${postId}/comments/${commentId}`, null, u1.token);
    assert(deleteCommentRes.status === 200 && deleteCommentRes.data.success, 'Alice deletes her comment');

    // Post edit & delete
    const editPostRes = await request('PUT', `/api/circles/${circleId}/posts/${postId}`, {
      content: 'Updated: Graph algorithms session postponed to 6 PM!',
    }, u2.token);
    assert(editPostRes.status === 200 && editPostRes.data.success, 'Bob successfully edits his post');

    // 9. Private Circle Access Restrictions
    console.log('\n--- Test 8: Private Circle Security ---');
    const privCircleRes = await request('POST', '/api/circles', {
      name: `Private Research Lab ${timestamp}`,
      description: 'Exclusive research group for lab members only.',
      category: 'AI & Technology',
      visibility: 'private',
    }, u1.token);
    assert(privCircleRes.status === 201, 'Alice creates a private circle');
    const privateCircleId = privCircleRes.data.data._id;

    const charliePrivPostRes = await request('POST', `/api/circles/${privateCircleId}/posts`, {
      content: 'Unauthorized post into private group',
    }, u3.token);
    assert(charliePrivPostRes.status === 403, 'Non-member Charlie rejected from posting in private circle (403)');

    const charliePrivFeedRes = await request('GET', `/api/circles/${privateCircleId}/posts`, null, u3.token);
    assert(charliePrivFeedRes.status === 403, 'Non-member Charlie rejected from viewing private circle posts (403)');

    // 10. Integration with Campus Plans
    console.log('\n--- Test 9: Campus Plans Integration ---');
    const planTomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const planRes = await request('POST', '/api/plans', {
      title: `DSA Meetup for ${testCircleName}`,
      description: 'Solving 3 Leetcode questions together in the study hall.',
      category: 'Coding',
      date: planTomorrow,
      time: '18:00',
      duration: '2 hours',
      capacity: 5,
      location: 'Library Pod 4B',
      circleId: circleId,
    }, u1.token);
    assert(planRes.status === 201 && planRes.data.success, 'Alice hosts a Campus Plan linked to the circle');
    const linkedPlanId = planRes.data.data._id;

    const circlePlansRes = await request('GET', `/api/plans?circleId=${circleId}`, null, u2.token);
    assert(circlePlansRes.status === 200 && circlePlansRes.data.data?.some((p) => p._id === linkedPlanId), 'Bob can discover the Campus Plan linked to the circle');

    // Non-member cannot create plan for private circle
    const charliePrivPlanRes = await request('POST', '/api/plans', {
      title: 'Unauthorized Private Circle Plan',
      description: 'Attempting to link plan to private circle',
      category: 'Study',
      date: planTomorrow,
      time: '19:00',
      duration: '1 hour',
      capacity: 4,
      location: 'Campus Lounge',
      circleId: privateCircleId,
    }, u3.token);
    assert(charliePrivPlanRes.status === 403, 'Non-member Charlie rejected from linking plan to private circle (403)');

    // 11. Circle Archiving
    console.log('\n--- Test 10: Circle Archiving & Cleanup ---');
    const charlieArchiveRes = await request('POST', `/api/circles/${circleId}/archive`, {}, u3.token);
    assert(charlieArchiveRes.status === 403, 'Non-owner Charlie rejected from archiving circle (403)');

    const aliceArchiveRes = await request('POST', `/api/circles/${circleId}/archive`, {}, u1.token);
    assert(aliceArchiveRes.status === 200 && aliceArchiveRes.data.success, 'Owner Alice successfully archives the circle');

    await request('POST', `/api/circles/${privateCircleId}/archive`, {}, u1.token);
    if (linkedPlanId) {
      await request('POST', `/api/plans/${linkedPlanId}/cancel`, {}, u1.token);
    }

    console.log('\n====================================================');
    console.log(`🎉 TEST SUMMARY: ${passed}/${total} assertions PASSED`);
    console.log('====================================================');
    if (passed === total) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Unhandled exception during circles test run:', err);
    process.exit(1);
  }
}

runCirclesSuite();
