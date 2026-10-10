const Connection = require('../models/Connection');
const Conversation = require('../models/Conversation');
const Notification = require('../models/Notification');
const Profile = require('../models/Profile');
const User = require('../models/User');
const { getSocketIO } = require('../sockets/chatSocket');

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

    // Check if targetUser has already expressed interest in current user
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

      // 1. Create or find direct conversation
      let conversation = await Conversation.findOne({
        participants: { $all: [currentUserId, targetUserId] },
      });

      if (!conversation) {
        conversation = await Conversation.create({
          participants: [currentUserId, targetUserId],
        });
      }
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
      // Create new one-way interest connection
      await Connection.findOneAndUpdate(
        { user1: currentUserId, user2: targetUserId },
        { status: 'interested', initiatedBy: currentUserId },
        { upsert: true, returnDocument: 'after' }
      );

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

    const targetProfile = await Profile.findOne({ user: targetUserId });

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
