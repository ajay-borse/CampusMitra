const Profile = require('../models/Profile');
const User = require('../models/User');
const Connection = require('../models/Connection');
const Block = require('../models/Block');
const { calculateCompatibility } = require('../utils/matchingEngine');

// ============================================================================
// @desc    Fetch real eligible campus student profiles for Discover deck
// @route   GET /api/discover
// @access  Private
// ============================================================================
const getDiscoverProfiles = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { category, search } = req.query;

    // 1. Get current user's profile and user record
    const myProfile = await Profile.findOne({ user: currentUserId });
    const meUser = await User.findById(currentUserId);
    if (!myProfile) {
      return res.status(404).json({
        success: false,
        message: 'Your profile must be initialized to discover peers',
      });
    }

    // 2. Safeguard: Dating is strictly 18+
    const myAge = myProfile.age || (meUser ? meUser.calculateAge() : 18);
    const isAdult = myAge >= 18;

    if (category === 'dating' && !isAdult) {
      return res.status(403).json({
        success: false,
        message: 'Dating is available only for verified adults 18+.',
      });
    }

    // 3. Identify blocked users in both directions
    const blocks = await Block.find({
      $or: [{ blocker: currentUserId }, { blockedUser: currentUserId }],
    });
    const blockedUserIds = blocks.map((b) =>
      b.blocker.toString() === currentUserId.toString()
        ? b.blockedUser.toString()
        : b.blocker.toString()
    );

    // 4. Identify users already swiped (interested or passed by current user)
    const existingConnections = await Connection.find({
      $or: [{ user1: currentUserId }, { user2: currentUserId }],
    });
    const swipedUserIds = existingConnections.map((c) =>
      c.user1.toString() === currentUserId.toString()
        ? c.user2.toString()
        : c.user1.toString()
    );

    // Combine all IDs to exclude
    const excludedUserIds = [
      currentUserId.toString(),
      ...blockedUserIds,
      ...swipedUserIds,
    ];

    // 5. Query MongoDB for real, active, unbanned student profiles
    const query = {
      user: { $nin: excludedUserIds },
      'privacySettings.discoveryVisibility': true,
    };

    // Filter by discoveryAudience preference of candidate
    // If candidate set 'friends_only', they only want friendship
    if (category === 'dating') {
      query.datingEligible = true;
      query.age = { $gte: 18 };
      query.showInCategories = { $in: ['Dating', 'dating'] };
    }

    const eligibleProfiles = await Profile.find(query)
      .populate('user', 'firstName lastName email isVerified isBanned role gender studentIdVerificationStatus dateOfBirth')
      .limit(60);

    // Filter out banned users or profiles without an active user
    let validProfiles = eligibleProfiles.filter(
      (p) => p.user && !p.user.isBanned
    );

    // If searching by text (e.g. program, interest, or name)
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      validProfiles = validProfiles.filter((p) => {
        const fullName = `${p.user.firstName} ${p.user.lastName}`.toLowerCase();
        const prog = (p.program || '').toLowerCase();
        const hasInterest = (p.interests || []).some((i) => i.toLowerCase().includes(q));
        const bio = (p.bio || '').toLowerCase();
        return fullName.includes(q) || prog.includes(q) || hasInterest || bio.includes(q);
      });
    }

    // 6. Category-specific filtering
    if (category && category !== 'all' && category !== 'for_you') {
      if (category === 'same_program') {
        validProfiles = validProfiles.filter(
          (p) => p.program && myProfile.program && p.program.toLowerCase() === myProfile.program.toLowerCase()
        );
      } else if (category === 'study') {
        validProfiles = validProfiles.filter((p) =>
          (p.lookingFor || []).some((g) => g.toLowerCase().includes('study'))
        );
      } else if (category === 'activities') {
        validProfiles = validProfiles.filter((p) =>
          (p.lookingFor || []).some((g) => g.toLowerCase().includes('activity') || g.toLowerCase().includes('sports'))
        );
      } else if (category === 'music') {
        validProfiles = validProfiles.filter((p) =>
          (p.interests || []).some((i) =>
            ['music', 'guitar', 'piano', 'singing', 'k-pop', 'hip hop', 'bollywood', 'edme', 'rock', 'pop', 'indie'].some((m) =>
              i.toLowerCase().includes(m)
            )
          )
        );
      } else if (category === 'gaming') {
        validProfiles = validProfiles.filter((p) =>
          (p.interests || []).some((i) =>
            ['gaming', 'valorant', 'bgmi', 'fifa', 'gta', 'minecraft', 'playstation', 'pc gaming', 'fortnite', 'roblox'].some((g) =>
              i.toLowerCase().includes(g)
            )
          )
        );
      }
    }

    // 7. Dynamically calculate real compatibility metrics for each candidate
    const evaluatedProfiles = validProfiles.map((candidate) => {
      const matchMetrics = calculateCompatibility(myProfile, candidate);
      const privacy = candidate.privacySettings || {};

      return {
        id: candidate._id,
        userId: candidate.user._id,
        name: `${candidate.user.firstName} ${candidate.user.lastName}`,
        firstName: candidate.user.firstName,
        lastName: candidate.user.lastName,
        gender: candidate.gender || candidate.user.gender,
        pronouns: candidate.pronouns,
        city: candidate.city,
        division: candidate.division,
        // Privacy controlled fields
        age: privacy.showAge !== false ? candidate.age : null,
        showAge: privacy.showAge !== false,
        program: privacy.showProgram !== false ? candidate.program : 'Student @ MIT-WPU',
        department: candidate.department,
        year: candidate.year,
        bio: candidate.bio,
        vibeHeadline: candidate.vibeHeadline,
        story: candidate.story,
        photos: Array.isArray(candidate.photos) && candidate.photos.length > 0 ? candidate.photos : [],
        avatar: Array.isArray(candidate.photos) && candidate.photos.length > 0 ? candidate.photos[0] : null,
        interests: candidate.interests || [],
        preferredFields: candidate.preferredFields || [],
        languages: privacy.showLanguages !== false ? candidate.languages || [] : [],
        lifestyle: privacy.showLifestyle !== false ? candidate.lifestyle : null,
        personality: candidate.personality || [],
        lookingFor: candidate.lookingFor || [],
        sharedGoals: matchMetrics.sharedGoals,
        sharedInterests: matchMetrics.sharedInterests,
        sharedLanguages: matchMetrics.sharedLanguages,
        sharedPersonality: matchMetrics.sharedPersonality,
        compatibility: matchMetrics.score,
        isVerified: candidate.user.isVerified,
        studentIdVerificationStatus: candidate.user.studentIdVerificationStatus || 'NONE',
        datingEligible: Boolean(candidate.datingEligible && isAdult),
        createdAt: candidate.createdAt,
      };
    });

    // Sort order:
    if (category === 'new') {
      evaluatedProfiles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      evaluatedProfiles.sort((a, b) => b.compatibility - a.compatibility);
    }

    return res.status(200).json({
      success: true,
      count: evaluatedProfiles.length,
      data: evaluatedProfiles,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDiscoverProfiles,
};
