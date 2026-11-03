const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Profile = require('../models/Profile');
const User = require('../models/User');
const Block = require('../models/Block');
const Plan = require('../models/Plan');
const { calculateSharedVibe, generateIcebreakers, CONVERSATION_GAMES } = require('../utils/vibeEngine');
const { getSocketIO } = require('../sockets/chatSocket');

// ============================================================================
// @desc    Get Vibe Connect breakdown & Smart Icebreakers for a Conversation
// @route   GET /api/vibe/conversation/:conversationId
// @access  Private
// ============================================================================
const getConversationVibe = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { conversationId } = req.params;
    const offset = parseInt(req.query.offset || 0, 10);

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    // Verify current user is an authorized participant
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === currentUserId.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You are not a participant in this conversation',
      });
    }

    // Handle Plan Group Chat
    if (conversation.type === 'plan_group') {
      const plan = await Plan.findById(conversation.plan);
      return res.status(200).json({
        success: true,
        data: {
          isGroup: true,
          planTitle: plan ? plan.title : 'Campus Plan Meetup',
          sharedVibe: {
            hasSharedVibe: true,
            explanations: [
              `You are all participating in the campus meetup: "${plan ? plan.title : 'Group Plan'}"`,
              `Category: ${plan ? plan.category : 'Student Activity'}`,
            ],
            sharedInterests: plan ? [plan.category] : [],
          },
          icebreakers: {
            prompts: [
              `Hey everyone, looking forward to ${plan ? plan.title : 'the meetup'}! What should we prep before we meet?`,
              `Where is everyone coming from for this session?`,
              `Chai or coffee run before we get started? ☕`,
            ],
            totalAvailable: 3,
            offset: 0,
          },
          games: CONVERSATION_GAMES,
        },
      });
    }

    // Direct 1-to-1 Conversation
    const peerUserId = conversation.participants.find(
      (p) => p.toString() !== currentUserId.toString()
    );

    if (!peerUserId) {
      return res.status(400).json({
        success: false,
        message: 'Peer participant not found in this conversation',
      });
    }

    // Block check
    const isBlocked = await Block.findOne({
      $or: [
        { blocker: currentUserId, blockedUser: peerUserId },
        { blocker: peerUserId, blockedUser: currentUserId },
      ],
    });
    if (isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Access prohibited due to account restrictions.',
      });
    }

    // Fetch both profiles
    const [myProfile, peerProfile, peerUser] = await Promise.all([
      Profile.findOne({ user: currentUserId }),
      Profile.findOne({ user: peerUserId }),
      User.findById(peerUserId).select('firstName lastName email isVerified role'),
    ]);

    const sharedVibe = calculateSharedVibe(myProfile, peerProfile);
    const icebreakers = generateIcebreakers(sharedVibe, offset, 4);

    return res.status(200).json({
      success: true,
      data: {
        peer: {
          id: peerUser._id,
          _id: peerUser._id,
          firstName: peerUser.firstName,
          lastName: peerUser.lastName,
          isVerified: peerUser.isVerified,
          avatar: peerProfile?.photos?.[0] || null,
          program: peerProfile?.program || 'MIT-WPU Student',
        },
        sharedVibe,
        icebreakers,
        games: CONVERSATION_GAMES,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Get Vibe Connect breakdown for any matched/eligible Student Profile
// @route   GET /api/vibe/profile/:targetUserId
// @access  Private
// ============================================================================
const getProfileVibe = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { targetUserId } = req.params;
    const offset = parseInt(req.query.offset || 0, 10);

    // Block check
    const isBlocked = await Block.findOne({
      $or: [
        { blocker: currentUserId, blockedUser: targetUserId },
        { blocker: targetUserId, blockedUser: currentUserId },
      ],
    });
    if (isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Access prohibited due to account restrictions.',
      });
    }

    const [myProfile, peerProfile, peerUser] = await Promise.all([
      Profile.findOne({ user: currentUserId }),
      Profile.findOne({ user: targetUserId }),
      User.findById(targetUserId).select('firstName lastName email isVerified role'),
    ]);

    if (!peerUser) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
      });
    }

    const sharedVibe = calculateSharedVibe(myProfile, peerProfile);
    const icebreakers = generateIcebreakers(sharedVibe, offset, 4);

    return res.status(200).json({
      success: true,
      data: {
        peer: {
          id: peerUser._id,
          _id: peerUser._id,
          firstName: peerUser.firstName,
          lastName: peerUser.lastName,
          isVerified: peerUser.isVerified,
          avatar: peerProfile?.photos?.[0] || null,
          program: peerProfile?.program || 'MIT-WPU Student',
        },
        sharedVibe,
        icebreakers,
        games: CONVERSATION_GAMES,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Send a Game Prompt into an Authorized Conversation
// @route   POST /api/vibe/conversation/:conversationId/game-prompt
// @access  Private
// ============================================================================
const sendGamePrompt = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { conversationId } = req.params;
    const { gameType, question, options } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Question text is required for conversation game.',
      });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === currentUserId.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You are not a participant in this conversation',
      });
    }

    // Format game message text
    let gameTitle = 'Conversation Activity';
    if (gameType === 'wouldYouRather') gameTitle = 'Would You Rather?';
    if (gameType === 'thisOrThat') gameTitle = 'This or That?';
    if (gameType === 'quickQuestions') gameTitle = 'Quick Question';

    let messageText = `🎲 [${gameTitle}]\n${question.trim()}`;
    if (Array.isArray(options) && options.length > 0) {
      messageText += `\n👉 Options: ${options.join('  vs  ')}`;
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: currentUserId,
      text: messageText,
      readBy: [currentUserId],
    });

    conversation.lastMessage = message._id;
    conversation.updatedAt = new Date();
    await conversation.save();

    const populated = await Message.findById(message._id).populate(
      'sender',
      'firstName lastName email isVerified role'
    );

    // Broadcast via Socket.IO if connected
    const io = getSocketIO();
    if (io) {
      io.to(conversationId).emit('new_message', {
        conversationId,
        message: populated,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Game prompt shared in conversation!',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversationVibe,
  getProfileVibe,
  sendGamePrompt,
};
