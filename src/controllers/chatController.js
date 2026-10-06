const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Profile = require('../models/Profile');
const { getSocketIO } = require('../sockets/chatSocket');

// ============================================================================
// @desc    Get all conversations for authenticated user with real unread counts
// @route   GET /api/conversations
// @access  Private
// ============================================================================
const getConversations = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;

    const conversations = await Conversation.find({
      participants: currentUserId,
    })
      .populate('participants', 'firstName lastName email isVerified')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    const formatted = await Promise.all(
      conversations.map(async (conv) => {
        // Other student participant
        const peer = conv.participants.find(
          (p) => p._id.toString() !== currentUserId.toString()
        );

        const peerProfile = peer
          ? await Profile.findOne({ user: peer._id })
          : null;

        // Count unread messages for current user
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          sender: { $ne: currentUserId },
          readBy: { $ne: currentUserId },
        });

        return {
          id: conv._id,
          peer: peer
            ? {
                id: peer._id,
                name: `${peer.firstName} ${peer.lastName}`,
                firstName: peer.firstName,
                program: peerProfile?.program || 'Student',
                avatar: peerProfile?.photos?.[0] || null,
                isVerified: peer.isVerified,
              }
            : null,
          lastMessage: conv.lastMessage
            ? {
                text: conv.lastMessage.text,
                createdAt: conv.lastMessage.createdAt,
                senderId: conv.lastMessage.sender,
              }
            : null,
          unreadCount,
          updatedAt: conv.updatedAt,
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Get message history for a specific conversation
// @route   GET /api/conversations/:id/messages
// @access  Private
// ============================================================================
const getMessages = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { id } = req.params;

    const conversation = await Conversation.findOne({
      _id: id,
      participants: currentUserId,
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You are not a participant in this conversation',
      });
    }

    const messages = await Message.find({ conversation: id })
      .populate('sender', 'firstName lastName')
      .sort({ createdAt: 1 })
      .limit(100);

    // Mark unread messages as read
    await Message.updateMany(
      {
        conversation: id,
        sender: { $ne: currentUserId },
        readBy: { $ne: currentUserId },
      },
      {
        $addToSet: { readBy: currentUserId },
      }
    );

    return res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Send a message via REST endpoint
// @route   POST /api/conversations/:id/messages
// @access  Private
// ============================================================================
const sendMessage = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message text cannot be empty',
      });
    }

    const conversation = await Conversation.findOne({
      _id: id,
      participants: currentUserId,
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You are not a participant in this conversation',
      });
    }

    const message = await Message.create({
      conversation: id,
      sender: currentUserId,
      text: text.trim(),
      readBy: [currentUserId],
    });

    conversation.lastMessage = message._id;
    await conversation.save();

    const populated = await Message.findById(message._id).populate(
      'sender',
      'firstName lastName'
    );

    // Emit real-time message via Socket.IO
    const io = getSocketIO();
    if (io) {
      io.to(`conv_${id}`).emit('new_message', {
        conversationId: id,
        message: populated,
      });
    }

    return res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
};
