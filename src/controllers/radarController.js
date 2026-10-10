const Availability = require('../models/Availability');
const Plan = require('../models/Plan');
const Profile = require('../models/Profile');
const User = require('../models/User');
const Block = require('../models/Block');
const Connection = require('../models/Connection');
const { calculateSharedVibe } = require('../utils/vibeEngine');
const { getSocketIO } = require('../sockets/chatSocket');

// ============================================================================
// @desc    Get Current Student's Availability Status
// @route   GET /api/radar/availability/me
// @access  Private
// ============================================================================
const getMyAvailability = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;

    let availability = await Availability.findOne({ user: currentUserId });

    if (!availability) {
      availability = await Availability.create({
        user: currentUserId,
        isActive: false,
        intentions: ['Study'],
        audience: 'everyone',
        note: '',
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      });
    } else if (availability.isActive && availability.expiresAt <= new Date()) {
      // Opportunistic expiration update
      availability.isActive = false;
      await availability.save();
    }

    return res.status(200).json({
      success: true,
      data: {
        isActive: availability.isActive,
        intentions: availability.intentions,
        note: availability.note,
        audience: availability.audience,
        expiresAt: availability.expiresAt,
        updatedAt: availability.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================================
// @desc    Enable or Update Student Availability
// @route   PUT /api/radar/availability/me
// @access  Private
// ============================================================================
const updateAvailability = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { isActive, intentions, note, audience, durationHours } = req.body;

    const validIntentions = [
      'Study',
      'Coffee',
      'Sports',
      'Coding',
      'Campus events',
      'Casual conversation',
      'Other',
    ];

    let sanitizedIntentions = ['Study'];
    if (Array.isArray(intentions) && intentions.length > 0) {
      sanitizedIntentions = intentions.filter((i) => validIntentions.includes(i));
      if (sanitizedIntentions.length === 0) sanitizedIntentions = ['Study'];
    }

    const sanitizedAudience = ['everyone', 'connections_only'].includes(audience)
      ? audience
      : 'everyone';

    const hours = Math.max(0.5, Math.min(12, Number(durationHours) || 2));
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

    const activeState = typeof isActive === 'boolean' ? isActive : true;

    const updated = await Availability.findOneAndUpdate(
      { user: currentUserId },
      {
        isActive: activeState,
        intentions: sanitizedIntentions,
        note: (note || '').substring(0, 120).trim(),
        audience: sanitizedAudience,
        expiresAt,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Optional Socket broadcast for real-time presence update
    try {
      const io = getSocketIO();
      if (io) {
        io.emit('radar_availability_changed', {
          userId: currentUserId,
          isActive: updated.isActive,
          intentions: updated.intentions,
          audience: updated.audience,
        });
      }
    } catch (_) {}

    return res.status(200).json({
      success: true,
      message: activeState ? 'Availability status is live on Radar' : 'Availability turned off',
      data: {
        isActive: updated.isActive,
        intentions: updated.intentions,
        note: updated.note,
        audience: updated.audience,
        expiresAt: updated.expiresAt,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================================
// @desc    Disable Student Availability
// @route   POST /api/radar/availability/disable
// @access  Private
// ============================================================================
const disableAvailability = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;

    const updated = await Availability.findOneAndUpdate(
      { user: currentUserId },
      { isActive: false },
      { new: true }
    );

    try {
      const io = getSocketIO();
      if (io) {
        io.emit('radar_availability_changed', {
          userId: currentUserId,
          isActive: false,
        });
      }
    } catch (_) {}

    return res.status(200).json({
      success: true,
      message: 'Availability disabled',
      data: {
        isActive: false,
        updatedAt: updated ? updated.updatedAt : new Date(),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================================
// @desc    Get Campus Radar Consolidated Feed
// @route   GET /api/radar/feed
// @access  Private
// ============================================================================
const getRadarFeed = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { category, search, availableSeatsOnly, date } = req.query;

    // 1. Fetch user blocks (both directions)
    const blocks = await Block.find({
      $or: [{ blocker: currentUserId }, { blockedUser: currentUserId }],
    });
    const blockedUserIds = blocks.map((b) =>
      b.blocker.toString() === currentUserId.toString()
        ? b.blockedUser.toString()
        : b.blocker.toString()
    );

    // 2. Fetch mutual connections of current user (for connections_only audience check)
    const connections = await Connection.find({
      $or: [
        { user1: currentUserId, status: 'accepted' },
        { user2: currentUserId, status: 'accepted' },
        { user1: currentUserId, isMatch: true },
        { user2: currentUserId, isMatch: true },
      ],
    });
    const connectedUserIds = new Set(
      connections.map((c) =>
        c.user1.toString() === currentUserId.toString()
          ? c.user2.toString()
          : c.user1.toString()
      )
    );

    // 3. Fetch current user's profile for shared-vibe calculations
    const myProfile = await Profile.findOne({ user: currentUserId });

    // 4. Fetch Available Now students
    const now = new Date();
    const activeAvailabilities = await Availability.find({
      isActive: true,
      expiresAt: { $gt: now },
      user: { $ne: currentUserId, $nin: blockedUserIds },
    })
      .populate('user', 'firstName lastName email isVerified role')
      .sort({ updatedAt: -1 });

    // Filter by audience visibility and fetch profile data
    const availableStudents = [];
    for (const item of activeAvailabilities) {
      if (!item.user) continue;
      const targetUserId = item.user._id.toString();

      // Check audience permissions
      if (item.audience === 'connections_only' && !connectedUserIds.has(targetUserId)) {
        continue;
      }

      const prof = await Profile.findOne({ user: item.user._id });
      if (!prof) continue;

      // Check privacy settings
      if (prof.privacySettings?.discoveryVisibility === false || prof.privacySettings?.profileVisibility === false) {
        continue;
      }

      // Shared vibe calculation
      const sharedVibe = calculateSharedVibe(myProfile, prof);

      // Category filter for student intentions if category is selected
      if (category && category !== 'All') {
        const matchesCategory = item.intentions.some(
          (intent) => intent.toLowerCase().includes(category.toLowerCase()) ||
          (category.toLowerCase() === 'study' && intent === 'Study') ||
          (category.toLowerCase() === 'coding' && intent === 'Coding') ||
          (category.toLowerCase() === 'sports' && intent === 'Sports') ||
          (category.toLowerCase() === 'coffee' && intent === 'Coffee')
        );
        if (!matchesCategory) continue;
      }

      // Search keyword filter
      if (search && search.trim()) {
        const s = search.toLowerCase().trim();
        const nameMatches = `${item.user.firstName} ${item.user.lastName}`.toLowerCase().includes(s);
        const noteMatches = item.note.toLowerCase().includes(s);
        const intentMatches = item.intentions.some((i) => i.toLowerCase().includes(s));
        const interestMatches = (prof.interests || []).some((i) => i.toLowerCase().includes(s));
        if (!nameMatches && !noteMatches && !intentMatches && !interestMatches) {
          continue;
        }
      }

      availableStudents.push({
        id: item.user._id,
        _id: item.user._id,
        firstName: item.user.firstName,
        lastName: item.user.lastName,
        isVerified: item.user.isVerified,
        avatar: prof.photos?.[0] || null,
        bio: prof.bio || '',
        program: prof.privacySettings?.showProgram !== false ? prof.program : null,
        year: prof.privacySettings?.showProgram !== false ? prof.year : null,
        age: prof.datingEligible && prof.privacySettings?.showAge !== false ? prof.age : null,
        interests: prof.interests || [],
        intentions: item.intentions,
        note: item.note,
        expiresAt: item.expiresAt,
        audience: item.audience,
        isConnected: connectedUserIds.has(targetUserId),
        sharedVibe,
      });
    }

    // 5. Fetch Real Campus Plans
    const planQuery = {
      status: { $in: ['upcoming', 'full'] },
      creator: { $nin: blockedUserIds },
    };

    if (category && category !== 'All') {
      planQuery.category = category;
    }

    if (date) {
      if (date === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        planQuery.date = todayStr;
      } else if (date === 'upcoming') {
        const todayStr = new Date().toISOString().split('T')[0];
        planQuery.date = { $gte: todayStr };
      } else {
        planQuery.date = date;
      }
    }

    let plans = await Plan.find(planQuery)
      .populate('creator', 'firstName lastName isVerified')
      .populate('participants.user', 'firstName lastName')
      .sort({ date: 1, time: 1 });

    // Available seats filter
    if (availableSeatsOnly === 'true' || availableSeatsOnly === true) {
      plans = plans.filter((p) => (p.participants ? p.participants.length : 0) < p.capacity);
    }

    // Search filter across plans
    if (search && search.trim()) {
      const s = search.toLowerCase().trim();
      plans = plans.filter((p) => {
        return (
          p.title.toLowerCase().includes(s) ||
          p.description.toLowerCase().includes(s) ||
          p.location.toLowerCase().includes(s) ||
          (p.tags || []).some((t) => t.toLowerCase().includes(s))
        );
      });
    }

    // Identify Featured Plan (prefer upcoming with seats available)
    const featuredPlan =
      plans.find((p) => (p.participants ? p.participants.length : 0) < p.capacity && p.status === 'upcoming') ||
      plans[0] ||
      null;

    // Segment plans for themed cinematic carousels
    const studyAndCodingPlans = plans.filter((p) => ['Study', 'Coding'].includes(p.category));
    const sportsAndRecreationPlans = plans.filter((p) => ['Sports', 'Gaming'].includes(p.category));
    const coffeeAndSocialPlans = plans.filter((p) => ['Coffee', 'Food', 'Events', 'Other'].includes(p.category));

    // 6. People With Similar Interests (Discover People)
    const candidateProfiles = await Profile.find({
      user: { $ne: currentUserId, $nin: blockedUserIds },
      'privacySettings.discoveryVisibility': { $ne: false },
      'privacySettings.profileVisibility': { $ne: false },
    })
      .sort({ updatedAt: -1 })
      .populate('user', 'firstName lastName isVerified role')
      .limit(100);

    const recommendedPeople = [];
    for (const prof of candidateProfiles) {
      if (!prof.user) continue;
      const targetUserId = prof.user._id.toString();

      const sharedVibe = calculateSharedVibe(myProfile, prof);

      // Filter by search if provided
      if (search && search.trim()) {
        const s = search.toLowerCase().trim();
        const nameMatches = `${prof.user.firstName} ${prof.user.lastName}`.toLowerCase().includes(s);
        const interestMatches = (prof.interests || []).some((i) => i.toLowerCase().includes(s));
        if (!nameMatches && !interestMatches) continue;
      }

      // Filter by category if interests match
      if (category && category !== 'All') {
        const cat = category.toLowerCase();
        const matchesCategory = (prof.interests || []).some((i) => i.toLowerCase().includes(cat));
        if (!matchesCategory) continue;
      }

      recommendedPeople.push({
        id: prof.user._id,
        _id: prof.user._id,
        firstName: prof.user.firstName,
        lastName: prof.user.lastName,
        isVerified: prof.user.isVerified,
        avatar: prof.photos?.[0] || null,
        bio: prof.bio || '',
        program: prof.privacySettings?.showProgram !== false ? prof.program : null,
        year: prof.privacySettings?.showProgram !== false ? prof.year : null,
        age: prof.datingEligible && prof.privacySettings?.showAge !== false ? prof.age : null,
        interests: prof.interests || [],
        lookingFor: prof.lookingFor || [],
        vibeHeadline: prof.vibeHeadline || '',
        isConnected: connectedUserIds.has(targetUserId),
        sharedVibe,
      });
    }

    // Deterministic ranking by count of shared interests & common vibe
    recommendedPeople.sort((a, b) => {
      const scoreA = (a.sharedVibe?.sharedInterests?.length || 0) * 2 + (a.sharedVibe?.sharedGoals?.length || 0);
      const scoreB = (b.sharedVibe?.sharedInterests?.length || 0) * 2 + (b.sharedVibe?.sharedGoals?.length || 0);
      return scoreB - scoreA;
    });

    // 7. My current availability summary
    let myAvailability = await Availability.findOne({ user: currentUserId });
    if (myAvailability && myAvailability.isActive && myAvailability.expiresAt <= now) {
      myAvailability.isActive = false;
      await myAvailability.save();
    }

    // Consolidated response
    return res.status(200).json({
      success: true,
      data: {
        counts: {
          availableNow: availableStudents.length,
          upcomingPlans: plans.length,
          recommendedPeople: recommendedPeople.length,
        },
        featuredPlan,
        plans: {
          all: plans,
          studyAndCoding: studyAndCodingPlans,
          sportsAndRecreation: sportsAndRecreationPlans,
          coffeeAndSocial: coffeeAndSocialPlans,
        },
        availableStudents,
        recommendedPeople: recommendedPeople.slice(0, 24),
        myAvailability: myAvailability
          ? {
              isActive: myAvailability.isActive,
              intentions: myAvailability.intentions,
              note: myAvailability.note,
              audience: myAvailability.audience,
              expiresAt: myAvailability.expiresAt,
            }
          : {
              isActive: false,
              intentions: ['Study'],
              audience: 'everyone',
              note: '',
            },
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyAvailability,
  updateAvailability,
  disableAvailability,
  getRadarFeed,
};
