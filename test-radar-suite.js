const http = require('http');

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

async function runRadarSuite() {
  console.log('====================================================');
  console.log('⚡ CAMPUSMITRA CAMPUS RADAR VERIFICATION SUITE');
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
    console.log('--- Setting up test users & profiles ---');
    const u1 = await registerTestUser('RadarAlice', 'Hacker', `radar.alice.${ts}@mitwpu.edu.in`);
    const u2 = await registerTestUser('RadarBob', 'Scholar', `radar.bob.${ts}@mitwpu.edu.in`);
    const u3 = await registerTestUser('RadarCharlie', 'Athlete', `radar.charlie.${ts}@mitwpu.edu.in`);
    console.log(`Alice ID: ${u1.id}, Bob ID: ${u2.id}, Charlie ID: ${u3.id}\n`);

    // Setup initial profiles
    await request('PUT', '/api/profiles/me', {
      program: 'MCA (Computer Applications)',
      interests: ['Coding', 'AI', 'Chai'],
      lookingFor: ['📚 Study Partners'],
    }, u1.token);

    await request('PUT', '/api/profiles/me', {
      program: 'MCA (Computer Applications)',
      interests: ['Coding', 'Sports', 'Gaming'],
      lookingFor: ['📚 Study Partners'],
    }, u2.token);

    await request('PUT', '/api/profiles/me', {
      program: 'B.Tech Mechanical',
      interests: ['Sports', 'Cricket'],
      lookingFor: ['🤝 New Friends'],
    }, u3.token);

    // ----------------------------------------------------
    // TEST 1: Availability Management
    // ----------------------------------------------------
    console.log('--- Test 1: Availability Controls & State ---');
    const initAvailRes = await request('GET', '/api/radar/availability/me', null, u1.token);
    assert(initAvailRes.status === 200, 'Alice fetches personal availability status');
    assert(initAvailRes.data.data.isActive === false, 'Availability is initially off by default');

    // Turn on availability
    const setAvailRes = await request('PUT', '/api/radar/availability/me', {
      isActive: true,
      intentions: ['Coding', 'Study'],
      note: 'Library floor 3 - DSA grind',
      audience: 'everyone',
      durationHours: 2,
    }, u1.token);

    assert(setAvailRes.status === 200 && setAvailRes.data.success, 'Alice enables availability for Coding & Study');
    assert(setAvailRes.data.data.isActive === true, 'Availability status persisted as active');
    assert(setAvailRes.data.data.intentions.includes('Coding'), 'Intentions accurately stored');
    assert(new Date(setAvailRes.data.data.expiresAt) > new Date(), 'Server assigns future expiration timestamp');

    // Bob views Radar feed and discovers Alice in Available Now
    const feedRes1 = await request('GET', '/api/radar/feed', null, u2.token);
    assert(feedRes1.status === 200 && feedRes1.data.success, 'Bob retrieves Campus Radar feed');
    const foundAlice = feedRes1.data.data.availableStudents.find((s) => s.id.toString() === u1.id.toString());
    assert(!!foundAlice, 'Alice appears in "Available Now" section for peer Bob');
    assert(foundAlice.intentions.includes('Coding'), 'Alice intentions displayed on card');
    assert(foundAlice.note === 'Library floor 3 - DSA grind', 'Alice campus note displayed');

    // ----------------------------------------------------
    // TEST 2: Expiration and Disable Logic
    // ----------------------------------------------------
    console.log('\n--- Test 2: Disable & Expiration Guard ---');
    // Alice explicitly disables availability
    const disableRes = await request('POST', '/api/radar/availability/disable', {}, u1.token);
    assert(disableRes.status === 200, 'Alice disables availability status');

    const feedRes2 = await request('GET', '/api/radar/feed', null, u2.token);
    const foundAliceAfterDisable = feedRes2.data.data.availableStudents.find((s) => s.id.toString() === u1.id.toString());
    assert(!foundAliceAfterDisable, 'Alice no longer appears in Available Now after turning it off');

    // ----------------------------------------------------
    // TEST 3: Audience & Privacy Controls (Connections Only)
    // ----------------------------------------------------
    console.log('\n--- Test 3: Audience Privacy Controls ---');
    // Charlie enables availability set to "connections_only"
    await request('PUT', '/api/radar/availability/me', {
      isActive: true,
      intentions: ['Sports'],
      audience: 'connections_only',
      durationHours: 3,
    }, u3.token);

    // Alice is NOT connected with Charlie -> should NOT see Charlie
    const feedRes3 = await request('GET', '/api/radar/feed', null, u1.token);
    const charlieBeforeConnect = feedRes3.data.data.availableStudents.find((s) => s.id.toString() === u3.id.toString());
    assert(!charlieBeforeConnect, 'Non-connected student cannot view "connections_only" availability');

    // Establish mutual connection between Alice and Charlie
    await request('POST', '/api/connections/interest', { targetUserId: u3.id }, u1.token);
    await request('POST', '/api/connections/interest', { targetUserId: u1.id }, u3.token);

    // Now Alice checks again -> Charlie should appear!
    const feedRes4 = await request('GET', '/api/radar/feed', null, u1.token);
    const charlieAfterConnect = feedRes4.data.data.availableStudents.find((s) => s.id.toString() === u3.id.toString());
    assert(!!charlieAfterConnect, 'Connected student can now view "connections_only" availability');

    // ----------------------------------------------------
    // TEST 4: Campus Plans Integration & Filters
    // ----------------------------------------------------
    console.log('\n--- Test 4: Campus Plans Discovery & Filters ---');
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const planRes = await request('POST', '/api/plans', {
      title: 'Python Radar Hackathon Prep',
      description: 'Prepping algorithm problems together before the weekend.',
      category: 'Coding',
      date: tomorrow,
      time: '18:00',
      duration: '2 hours',
      capacity: 3,
      location: 'Central Library Floor 2',
      locationType: 'campus',
      tags: ['Python', 'Hackathon'],
    }, u1.token);

    assert(planRes.status === 201 && planRes.data.success, 'Alice creates a real Campus Plan');
    const createdPlanId = (planRes.data.data._id || planRes.data.data.id).toString();

    // Bob checks Radar feed
    const planFeedRes = await request('GET', '/api/radar/feed', null, u2.token);
    assert(planFeedRes.status === 200, 'Bob fetches Radar feed with newly created plan');
    assert(planFeedRes.data.data.plans.all.some((p) => p._id.toString() === createdPlanId.toString()), 'Plan appears in Radar "Happening Soon"');
    assert(planFeedRes.data.data.plans.studyAndCoding.some((p) => p._id.toString() === createdPlanId.toString()), 'Plan categorized in Study & Coding Hub');
    assert(!!planFeedRes.data.data.featuredPlan, 'Plan is surfaced as Featured Hero Activity');

    // Category filter: Coding matches, Coffee does not
    const codingFilterRes = await request('GET', '/api/radar/feed?category=Coding', null, u2.token);
    assert(codingFilterRes.data.data.plans.all.some((p) => p._id.toString() === createdPlanId.toString()), 'Category filter "Coding" returns plan');

    const coffeeFilterRes = await request('GET', '/api/radar/feed?category=Coffee', null, u2.token);
    assert(!coffeeFilterRes.data.data.plans.all.some((p) => p._id.toString() === createdPlanId.toString()), 'Category filter "Coffee" excludes coding plan');

    // Keyword search filter
    const searchRes = await request('GET', '/api/radar/feed?search=Hackathon', null, u2.token);
    assert(searchRes.data.data.plans.all.some((p) => p._id.toString() === createdPlanId.toString()), 'Search query "Hackathon" matches plan');

    // Open seats filter
    const seatsRes = await request('GET', '/api/radar/feed?availableSeatsOnly=true', null, u2.token);
    assert(seatsRes.data.data.plans.all.some((p) => p._id.toString() === createdPlanId.toString()), 'Open seats filter retains plan with free capacity');

    // Bob joins plan through existing Plan API
    const joinRes = await request('POST', `/api/plans/${createdPlanId}/join`, {}, u2.token);
    assert(joinRes.status === 200, 'Bob successfully joins plan from Radar');

    // ----------------------------------------------------
    // TEST 5: People Discovery & Shared Interests
    // ----------------------------------------------------
    console.log('\n--- Test 5: People Discovery with Shared Vibe ---');
    const peopleFeedRes = await request('GET', '/api/radar/feed', null, u1.token);
    const recPeople = peopleFeedRes.data.data.recommendedPeople;
    assert(Array.isArray(recPeople) && recPeople.length > 0, 'Returns recommended students list');

    const bobInRec = recPeople.find((p) => p.id.toString() === u2.id.toString());
    assert(!!bobInRec, 'Bob appears in recommended students for Alice');
    assert(!!bobInRec, 'Bob appears in recommended students for Alice');
    assert(bobInRec.sharedVibe?.hasSharedVibe === true, 'Accurately calculates shared vibe for peers');
    assert(bobInRec.sharedVibe.sharedInterests.includes('Coding'), 'Factual shared interests detected');

    // ----------------------------------------------------
    // TEST 6: Moderation & Block Protection
    // ----------------------------------------------------
    console.log('\n--- Test 6: Moderation & Block Protection ---');
    await request('POST', '/api/blocks', { targetUserId: u2.id, reason: 'Test block' }, u1.token);

    const blockedFeedRes = await request('GET', '/api/radar/feed', null, u1.token);
    const bobAfterBlock = blockedFeedRes.data.data.recommendedPeople.find((p) => p.id.toString() === u2.id.toString());
    assert(!bobAfterBlock, 'Blocked user Bob is completely excluded from Alice Radar recommendations');

    const bobViewsAliceFeed = await request('GET', '/api/radar/feed', null, u2.token);
    const aliceInBobFeed = bobViewsAliceFeed.data.data.plans.all.find((p) => p.creator?._id?.toString() === u1.id.toString());
    assert(!aliceInBobFeed, 'Blocked user cannot discover blocker activities on Radar');

    console.log('\n====================================================');
    console.log(`🎉 TEST SUMMARY: ${passed}/${total} assertions PASSED`);
    console.log('====================================================');
    if (passed === total) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Unhandled exception during radar test run:', err);
    process.exit(1);
  }
}

runRadarSuite();
