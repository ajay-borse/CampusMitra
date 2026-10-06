/**
 * CampusMitra Matching Engine
 * Computes a weighted, multi-dimensional compatibility indicator between two campus profiles
 * based on actual student profiles:
 * - Shared interests (25%)
 * - Shared academic fields & programs (15%)
 * - Connection goals & vibes (15%)
 * - Shared languages (15%)
 * - Lifestyle alignment (diet, fitness, sleep, social style) (15%)
 * - Shared personality attributes (15%)
 */
function calculateCompatibility(profileA, profileB) {
  if (!profileA || !profileB) {
    return {
      score: 60,
      sharedInterests: [],
      sharedGoals: [],
      sharedLanguages: [],
      sharedPersonality: [],
    };
  }

  // 1. Interests (up to 25 points)
  const interestsA = Array.isArray(profileA.interests) ? profileA.interests : [];
  const interestsB = Array.isArray(profileB.interests) ? profileB.interests : [];
  const sharedInterests = interestsA.filter((i) =>
    interestsB.some((j) => j.toLowerCase().trim() === i.toLowerCase().trim())
  );
  const minInterests = Math.max(1, Math.min(interestsA.length, interestsB.length));
  const interestScore = Math.min(25, Math.round((sharedInterests.length / minInterests) * 25));

  // 2. Academic Program & Preferred Fields (up to 15 points)
  let academicScore = 0;
  if (profileA.program && profileB.program && profileA.program.toLowerCase() === profileB.program.toLowerCase()) {
    academicScore += 8;
  }
  const fieldsA = Array.isArray(profileA.preferredFields) ? profileA.preferredFields : [];
  const fieldsB = Array.isArray(profileB.preferredFields) ? profileB.preferredFields : [];
  const sharedFields = fieldsA.filter((f) =>
    fieldsB.some((g) => g.toLowerCase().trim() === f.toLowerCase().trim())
  );
  if (sharedFields.length > 0) {
    academicScore += Math.min(7, sharedFields.length * 3);
  }

  // 3. Goals / Looking For (up to 15 points)
  const goalsA = Array.isArray(profileA.lookingFor) ? profileA.lookingFor : [];
  const goalsB = Array.isArray(profileB.lookingFor) ? profileB.lookingFor : [];
  const sharedGoals = goalsA.filter((g) =>
    goalsB.some((h) => h.toLowerCase().trim() === g.toLowerCase().trim())
  );
  const minGoals = Math.max(1, Math.min(goalsA.length, goalsB.length));
  const goalScore = Math.min(15, Math.round((sharedGoals.length / minGoals) * 15));

  // 4. Languages (up to 15 points)
  const getLangNames = (p) => {
    if (!Array.isArray(p.languages)) return [];
    return p.languages.map((l) => (typeof l === 'string' ? l : l.language)).filter(Boolean);
  };
  const langsA = getLangNames(profileA);
  const langsB = getLangNames(profileB);
  const sharedLanguages = langsA.filter((la) =>
    langsB.some((lb) => lb.toLowerCase().trim() === la.toLowerCase().trim())
  );
  const languageScore = sharedLanguages.length > 0 ? Math.min(15, sharedLanguages.length * 5) : 3;

  // 5. Lifestyle Alignment (up to 15 points)
  let lifestyleScore = 0;
  const lifeA = profileA.lifestyle || {};
  const lifeB = profileB.lifestyle || {};

  if (lifeA.foodPreference && lifeB.foodPreference && lifeA.foodPreference === lifeB.foodPreference) {
    lifestyleScore += 4;
  }
  if (lifeA.socialStyle && lifeB.socialStyle && lifeA.socialStyle === lifeB.socialStyle) {
    lifestyleScore += 4;
  }
  if (lifeA.fitness && lifeB.fitness && lifeA.fitness === lifeB.fitness) {
    lifestyleScore += 4;
  }
  if (lifeA.pets && lifeB.pets && lifeA.pets === lifeB.pets) {
    lifestyleScore += 3;
  }

  // 6. Personality Vibes (up to 15 points)
  const persA = Array.isArray(profileA.personality) ? profileA.personality : [];
  const persB = Array.isArray(profileB.personality) ? profileB.personality : [];
  const sharedPersonality = persA.filter((p) =>
    persB.some((q) => q.toLowerCase().trim() === p.toLowerCase().trim())
  );
  const personalityScore = sharedPersonality.length > 0 ? Math.min(15, sharedPersonality.length * 5) : 3;

  // Aggregate with base campus synergy
  const baseSynergy = 20;
  const rawSum = baseSynergy + interestScore + academicScore + goalScore + languageScore + lifestyleScore + personalityScore;
  const finalScore = Math.min(98, Math.max(52, Math.round(rawSum * 0.85)));

  return {
    score: finalScore,
    sharedInterests,
    sharedGoals,
    sharedLanguages,
    sharedPersonality,
  };
}

module.exports = {
  calculateCompatibility,
};
