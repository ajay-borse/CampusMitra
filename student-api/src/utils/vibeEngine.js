/**
 * Vibe Connect Engine
 * Computes factual shared-interest explanations, smart deterministic icebreakers,
 * and lightweight conversation activities from real student profiles.
 */

// Curated Category & Keyword Prompt Mappings
const PROMPT_CATALOG = {
  coding: [
    'Which coding project or tech stack are you most excited to build with this semester?',
    'Tabs or spaces, and what code editor do you swear by on campus?',
    'Have you taken part in any hackathons lately, or planning to join one soon?',
    'What was the most rewarding bug or algorithmic problem you solved recently?',
  ],
  ai: [
    'What area of AI or machine learning do you find most fascinating right now?',
    'Do you use AI tools more for coding assistance, study prep, or creative projects?',
    'Are you working on any LLM or computer vision experiments this semester?',
  ],
  study: [
    'Would you prefer a silent library study sprint or reviewing notes over coffee?',
    'What subject or module is taking up most of your focus this week?',
    'How do you usually tackle exam prep: solo deep work or group whiteboard sessions?',
  ],
  sports: [
    'Do you play turf football, cricket, or badminton on or around campus?',
    'Which sports team or tournament are you following closely this season?',
    'What is your go-to sport or workout to blow off steam after long lecture days?',
  ],
  gaming: [
    'Down for a casual gaming session between lectures or over the weekend?',
    'What game are you currently hooked on: competitive shooters, RPGs, or co-op?',
    'PC, console, or mobile gaming: what is your preferred battle station?',
  ],
  music: [
    'What artist or playlist is currently on heavy rotation during your study sessions?',
    'Have you been to any live music gigs or campus college fests recently?',
    'If you could only listen to one album for the rest of the semester, what would it be?',
  ],
  photography: [
    'What do you enjoy shooting the most: campus architecture, portraits, or street scenes?',
    'Phone camera or mirrorless/DSLR: what gear do you like carrying around?',
  ],
  entrepreneurship: [
    'Have you thought about launching a startup or student venture on campus?',
    'What business idea or tech trend has caught your attention recently?',
  ],
};

// General Campus Fallback Icebreakers
const GENERAL_CAMPUS_PROMPTS = [
  'Hey! How is your semester going so far at MIT-WPU?',
  'What is your favorite spot on campus to relax or grab a bite between lectures?',
  'Chai, cold coffee, or energy drinks: what keeps you going during exam weeks?',
  'Are you involved in any student clubs or campus activities this term?',
  'What is one skill you are hoping to pick up before this academic year wraps up?',
];

// Curated Conversation Games
const CONVERSATION_GAMES = {
  wouldYouRather: [
    {
      id: 'wyr-1',
      question: 'Would you rather have all 8:00 AM lectures or all 6:00 PM labs?',
      options: ['8:00 AM lectures', '6:00 PM labs'],
    },
    {
      id: 'wyr-2',
      question: 'Would you rather code only in Python or only in C++ for an entire semester?',
      options: ['Python only', 'C++ only'],
    },
    {
      id: 'wyr-3',
      question: 'Would you rather study in total silence in the central library or in a buzzing cafe with lo-fi beats?',
      options: ['Silent library pod', 'Buzzing cafe with beats'],
    },
    {
      id: 'wyr-4',
      question: 'Would you rather ace an individual project or build a winning hackathon prototype with a team?',
      options: ['Solo project', 'Team hackathon'],
    },
    {
      id: 'wyr-5',
      question: 'Would you rather have infinite canteen snacks or guaranteed front-row parking on campus?',
      options: ['Free canteen snacks', 'Guaranteed parking spot'],
    },
  ],
  thisOrThat: [
    {
      id: 'tot-1',
      question: 'Chai or Coffee for morning energy?',
      options: ['Masala Chai ☕', 'Espresso / Cold Coffee 🥤'],
    },
    {
      id: 'tot-2',
      question: 'Night Owl study grind or Early Bird revision?',
      options: ['Night Owl 🌙', 'Early Bird ☀️'],
    },
    {
      id: 'tot-3',
      question: 'Practical Lab assignment or Theory presentation?',
      options: ['Hands-on Lab 💻', 'Theory Presentation 📊'],
    },
    {
      id: 'tot-4',
      question: 'Paperback physical books or Digital e-reader / iPad notes?',
      options: ['Physical Books 📖', 'Digital iPad Notes 📱'],
    },
    {
      id: 'tot-5',
      question: 'Spontaneous weekend road trip or Relaxing movie binge?',
      options: ['Road Trip 🚗', 'Movie Binge 🎬'],
    },
  ],
  quickQuestions: [
    {
      id: 'qq-1',
      question: 'What is the most underrated food spot or snack counter near campus?',
    },
    {
      id: 'qq-2',
      question: 'What is your current favorite song to listen to while walking to class?',
    },
    {
      id: 'qq-3',
      question: 'What was your favorite school subject that made you choose your current degree?',
    },
    {
      id: 'qq-4',
      question: 'What is one topic or hobby you could talk about for an hour without preparation?',
    },
    {
      id: 'qq-5',
      question: 'If you had an unexpected free Friday afternoon, how would you spend it?',
    },
  ],
};

/**
 * Calculates factual shared-interest explanations between two student profiles.
 * Never invents psychological scores or exposes private fields.
 */
function calculateSharedVibe(profileA, profileB) {
  if (!profileA || !profileB) {
    return {
      hasSharedVibe: false,
      explanations: ['You are both verified students at MIT-WPU.'],
      sharedInterests: [],
      sharedGoals: [],
      sharedLanguages: [],
      academicOverlap: null,
    };
  }

  const explanations = [];

  // 1. Shared Interests
  const interestsA = Array.isArray(profileA.interests) ? profileA.interests : [];
  const interestsB = Array.isArray(profileB.interests) ? profileB.interests : [];
  const sharedInterests = interestsA.filter((i) =>
    interestsB.some((j) => j.toLowerCase().trim() === i.toLowerCase().trim())
  );

  if (sharedInterests.length > 0) {
    if (sharedInterests.length === 1) {
      explanations.push(`You both share an interest in ${sharedInterests[0]}.`);
    } else if (sharedInterests.length === 2) {
      explanations.push(`You both enjoy ${sharedInterests[0]} and ${sharedInterests[1]}.`);
    } else {
      explanations.push(
        `You share ${sharedInterests.length} common interests, including ${sharedInterests[0]}, ${sharedInterests[1]}, and ${sharedInterests[2]}.`
      );
    }
  }

  // 2. Shared Connection Goals / Looking For
  const goalsA = Array.isArray(profileA.lookingFor) ? profileA.lookingFor : [];
  const goalsB = Array.isArray(profileB.lookingFor) ? profileB.lookingFor : [];
  const sharedGoals = goalsA.filter((g) =>
    goalsB.some((h) => h.toLowerCase().trim() === g.toLowerCase().trim())
  );

  if (sharedGoals.length > 0) {
    const cleanGoals = sharedGoals.map((g) => g.replace(/^[^\w\s]+/, '').trim());
    explanations.push(`You both selected ${cleanGoals.join(' & ')} as campus connection goals.`);
  }

  // 3. Academic Proximity
  let academicOverlap = null;
  if (profileA.program && profileB.program && profileA.program.toLowerCase() === profileB.program.toLowerCase()) {
    academicOverlap = profileA.program;
    explanations.push(`You are both enrolled in the ${profileA.program} program.`);
  } else if (profileA.department && profileB.department && profileA.department.toLowerCase() === profileB.department.toLowerCase()) {
    academicOverlap = profileA.department;
    explanations.push(`You are both part of the ${profileA.department}.`);
  }

  // 4. Shared Languages
  const getLangNames = (p) => {
    if (!Array.isArray(p.languages)) return [];
    return p.languages.map((l) => (typeof l === 'string' ? l : l.language)).filter(Boolean);
  };
  const langsA = getLangNames(profileA);
  const langsB = getLangNames(profileB);
  const sharedLanguages = langsA.filter((la) =>
    langsB.some((lb) => lb.toLowerCase().trim() === la.toLowerCase().trim())
  );

  if (sharedLanguages.length > 0) {
    explanations.push(`You both speak ${sharedLanguages.join(' & ')}.`);
  }

  // 5. Fallback if little shared data exists
  if (explanations.length === 0) {
    explanations.push('You are both verified students on the MIT-WPU campus looking to meet peers.');
  }

  return {
    hasSharedVibe: sharedInterests.length > 0 || sharedGoals.length > 0 || !!academicOverlap,
    explanations,
    sharedInterests,
    sharedGoals,
    sharedLanguages,
    academicOverlap,
  };
}

/**
 * Generates curated, deterministic icebreakers based on shared profile tags,
 * with pagination/offset support for the "Shuffle" action.
 */
function generateIcebreakers(sharedVibe, offset = 0, count = 4) {
  const candidatePrompts = [];
  const interests = (sharedVibe?.sharedInterests || []).map((i) => i.toLowerCase().trim());
  const goals = (sharedVibe?.sharedGoals || []).map((g) => g.toLowerCase().trim());

  // Check interests
  if (interests.some((i) => i.includes('code') || i.includes('dsa') || i.includes('developer') || i.includes('software'))) {
    candidatePrompts.push(...PROMPT_CATALOG.coding);
  }
  if (interests.some((i) => i.includes('ai') || i.includes('machine learning') || i.includes('data'))) {
    candidatePrompts.push(...PROMPT_CATALOG.ai);
  }
  if (interests.some((i) => i.includes('cricket') || i.includes('football') || i.includes('sport') || i.includes('badminton') || i.includes('fitness'))) {
    candidatePrompts.push(...PROMPT_CATALOG.sports);
  }
  if (interests.some((i) => i.includes('game') || i.includes('esports') || i.includes('gaming'))) {
    candidatePrompts.push(...PROMPT_CATALOG.gaming);
  }
  if (interests.some((i) => i.includes('music') || i.includes('guitar') || i.includes('singing'))) {
    candidatePrompts.push(...PROMPT_CATALOG.music);
  }
  if (interests.some((i) => i.includes('photo') || i.includes('camera') || i.includes('film'))) {
    candidatePrompts.push(...PROMPT_CATALOG.photography);
  }
  if (interests.some((i) => i.includes('startup') || i.includes('business') || i.includes('entrepreneur'))) {
    candidatePrompts.push(...PROMPT_CATALOG.entrepreneurship);
  }

  // Check study goals
  if (goals.some((g) => g.includes('study') || g.includes('partner') || g.includes('project'))) {
    candidatePrompts.push(...PROMPT_CATALOG.study);
  }

  // Add general campus fallbacks to ensure rich pool
  candidatePrompts.push(...GENERAL_CAMPUS_PROMPTS);

  // Remove exact duplicates
  const uniquePrompts = Array.from(new Set(candidatePrompts));

  // Deterministic rotation based on offset
  const normalizedOffset = offset % uniquePrompts.length;
  const rotated = [
    ...uniquePrompts.slice(normalizedOffset),
    ...uniquePrompts.slice(0, normalizedOffset),
  ];

  return {
    prompts: rotated.slice(0, count),
    totalAvailable: uniquePrompts.length,
    offset: normalizedOffset,
  };
}

module.exports = {
  calculateSharedVibe,
  generateIcebreakers,
  CONVERSATION_GAMES,
};
