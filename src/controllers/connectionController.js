const Connection = require('../models/Connection');
const Conversation = require('../models/Conversation');
const Notification = require('../models/Notification');
const Profile = require('../models/Profile');
const User = require('../models/User');
const Block = require('../models/Block');
const { getSocketIO } = require('../sockets/chatSocket');

const getOrCreateConversation = async (userId1, userId2) => {
  const sortedIds = [userId1.toString(), userId2.toString()].sort();
  const pairKey = sortedIds.join('_');

  let conversation = await Conversation.findOne({
    $or: [
      { pairKey },
      { participants: { $all: [userId1, userId2] } },
    ],
  });

  if (!conversation) {
    try {
      conversation = await Conversation.findOneAndUpdate(
        { pairKey },
        {
          $setOnInsert: {
            participants: [userId1, userId2],
            pairKey,
          },
        },
        { upsert: true, new: true }
      );
    } catch (err) {
      conversation = await Conversation.findOne({
        $or: [
          { pairKey },
          { participants: { $all: [userId1, userId2] } },
        ],
      });
    }
  }

  return conversation;
};

// ============================================================================
// @desc    Express interest in a student profile (Swipe Right)
// @route   POST /api/connections/interest
// @access  Private
// ============================================================================
const sendInterest = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'targetUserId is required',
      });
    }

    if (currentUserId.toString() === targetUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send interest to yourself',
      });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Target student not found',
      });
    }

    // 1. Check for active blocks in either direction
    const isBlocked = await Block.findOne({
      $or: [
        { blocker: currentUserId, blockedUser: targetUserId },
        { blocker: targetUserId, blockedUser: currentUserId },
      ],
    });

    if (isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Cannot connect with this user due to block or privacy settings',
      });
    }

    const targetProfile = await Profile.findOne({ user: targetUserId });

    // 2. Check if already matched / connected (status: 'accepted')
    const existingAccepted = await Connection.findOne({
      $or: [
        { user1: currentUserId, user2: targetUserId },
        { user1: targetUserId, user2: currentUserId },
      ],
      status: 'accepted',
    });

    if (existingAccepted) {
      const conversation = await getOrCreateConversation(currentUserId, targetUserId);
      return res.status(200).json({
        success: true,
        message: 'Already connected',
        data: {
          isMatch: true,
          conversationId: conversation?._id || null,
          matchedUser: {
            id: targetUser._id,
            name: `${targetUser.firstName} ${targetUser.lastName}`,
            firstName: targetUser.firstName,
            avatar: targetProfile?.photos?.[0] || null,
            program: targetProfile?.program,
          },
        },
      });
    }

    // 3. Check if targetUser has already expressed interest in current user
    const reverseInterest = await Connection.findOne({
      user1: targetUserId,
      user2: currentUserId,
      status: 'interested',
    });

    let isMatch = false;
    let conversationId = null;

    if (reverseInterest) {
      // 🌟 MUTUAL MATCH OCCURRED!
      isMatch = true;
      reverseInterest.status = 'accepted';
      reverseInterest.type = 'match';
      await reverseInterest.save();

      // Clean up any reciprocal one-way record
      await Connection.deleteMany({
        user1: currentUserId,
        user2: targetUserId,
        _id: { $ne: reverseInterest._id },
      });

      // 1. Create or find direct conversation atomically
      const conversation = await getOrCreateConversation(currentUserId, targetUserId);
      conversationId = conversation._id;

      // 2. Create mutual match notification for both students
      await Notification.create([
        {
          recipient: targetUserId,
          sender: currentUserId,
          type: 'match',
          title: "It's a Mutual Match! ✨",
          message: `${req.user.firstName} and you connected! Say hello in chat.`,
          data: { matchUserId: currentUserId, conversationId },
        },
        {
          recipient: currentUserId,
          sender: targetUserId,
          type: 'match',
          title: "It's a Mutual Match! ✨",
          message: `${targetUser.firstName} and you connected! Say hello in chat.`,
          data: { matchUserId: targetUserId, conversationId },
        },
      ]);

      // 3. Emit real-time Socket.IO match event if connected
      const io = getSocketIO();
      if (io) {
        io.to(targetUserId.toString()).emit('match_celebration', {
          matchedUser: {
            id: currentUserId,
            name: `${req.user.firstName} ${req.user.lastName}`,
          },
          conversationId,
        });
      }
    } else {
      // Check if current user has already expressed interest
      const myExistingInterest = await Connection.findOne({
        user1: currentUserId,
        user2: targetUserId,
        status: 'interested',
      });

      if (myExistingInterest) {
        return res.status(200).json({
          success: true,
          message: 'Interest already recorded',
          data: {
            isMatch: false,
            conversationId: null,
            matchedUser: null,
          },
        });
      }

      // Create new one-way interest connection
      await Connection.findOneAndUpdate(
        { user1: currentUserId, user2: targetUserId },
        { status: 'interested', initiatedBy: currentUserId },
        { upsert: true, returnDocument: 'after' }
      );

      // Check if target user expressed interest concurrently
      const concurrentReverse = await Connection.findOne({
        user1: targetUserId,
        user2: currentUserId,
        status: { $in: ['interested', 'accepted'] },
      });

      if (concurrentReverse && concurrentReverse.status === 'interested') {
        isMatch = true;
        concurrentReverse.status = 'accepted';
        concurrentReverse.type = 'match';
        await concurrentReverse.save();

        await Connection.deleteMany({
          user1: currentUserId,
          user2: targetUserId,
          _id: { $ne: concurrentReverse._id },
        });

        const conversation = await getOrCreateConversation(currentUserId, targetUserId);
        conversationId = conversation._id;
      } else if (concurrentReverse && concurrentReverse.status === 'accepted') {
        isMatch = true;
        const conv = await getOrCreateConversation(currentUserId, targetUserId);
        conversationId = conv?._id || null;
      } else {
        // Create notification for target user
        await Notification.create({
          recipient: targetUserId,
          sender: currentUserId,
          type: 'interest',
          title: 'New Campus Interest 💜',
          message: 'A student on campus expressed interest in connecting with you.',
          data: { senderId: currentUserId },
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: isMatch ? "It's a match! 🎉" : 'Interest recorded',
      data: {
        isMatch,
        conversationId,
        matchedUser: isMatch
          ? {
              id: targetUser._id,
              name: `${targetUser.firstName} ${targetUser.lastName}`,
              firstName: targetUser.firstName,
              avatar: targetProfile?.photos?.[0] || null,
              program: targetProfile?.program,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Pass on a student profile (Swipe Left)
// @route   POST /api/connections/pass
// @access  Private
// ============================================================================
const sendPass = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'targetUserId is required',
      });
    }

    await Connection.findOneAndUpdate(
      { user1: currentUserId, user2: targetUserId },
      { status: 'passed', initiatedBy: currentUserId },
      { upsert: true, returnDocument: 'after' }
    );

    return res.status(200).json({
      success: true,
      message: 'Pass recorded',
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Get all active connections & mutual matches for authenticated user
// @route   GET /api/connections
// @access  Private
// ============================================================================
const getConnections = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;

    // Find accepted connections involving current user
    const connections = await Connection.find({
      $or: [{ user1: currentUserId }, { user2: currentUserId }],
      status: 'accepted',
    }).populate('user1 user2', 'firstName lastName email isVerified role');

    // Extract connected user profiles
    const peerUserIds = connections.map((c) =>
      c.user1._id.toString() === currentUserId.toString() ? c.user2._id : c.user1._id
    );

    const peerProfiles = await Profile.find({ user: { $in: peerUserIds } }).populate(
      'user',
      'firstName lastName email isVerified'
    );

    const result = peerProfiles.map((p) => ({
      id: p._id,
      _id: p._id,
      userId: p.user._id,
      name: `${p.user.firstName} ${p.user.lastName}`,
      firstName: p.user.firstName,
      lastName: p.user.lastName,
      program: p.program,
      department: p.department,
      bio: p.bio,
      avatar: p.photos && p.photos.length > 0 ? p.photos[0] : null,
      photos: p.photos || [],
      interests: p.interests || [],
      lookingFor: p.lookingFor || [],
      isVerified: p.user.isVerified,
      user: p.user,
      profile: p,
    }));

    return res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendInterest,
  sendPass,
  getConnections,
};
