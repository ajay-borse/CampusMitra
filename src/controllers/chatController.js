const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Profile = require('../models/Profile');
const Block = require('../models/Block');
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
        // Plan group conversation handling
        if (conv.type === 'plan_group') {
          const Plan = require('../models/Plan');
          const plan = await Plan.findById(conv.plan);
          const unreadCount = await Message.countDocuments({
            conversation: conv._id,
            sender: { $ne: currentUserId },
            readBy: { $ne: currentUserId },
          });

          return {
            id: conv._id,
            isGroup: true,
            type: 'plan_group',
            planId: conv.plan,
            peer: {
              id: conv._id,
              name: plan ? `📌 ${plan.title}` : 'Campus Plan Group',
              firstName: plan ? plan.title : 'Plan Group',
              program: plan ? `${plan.category} Plan • ${conv.participants.length} members` : 'Group Activity',
              avatar: null,
              isVerified: true,
            },
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
        }

        // Other student participant for direct conversation
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

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message text cannot be empty',
      });
    }

    if (text.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot exceed 2000 characters',
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

    // Check if any participant has blocked the other (for direct conversations)
    if (conversation.type !== 'plan_group') {
      const otherParticipantId = conversation.participants.find(
        (p) => p.toString() !== currentUserId.toString()
      );

      if (otherParticipantId) {
        const isBlocked = await Block.findOne({
          $or: [
            { blocker: currentUserId, blockedUser: otherParticipantId },
            { blocker: otherParticipantId, blockedUser: currentUserId },
          ],
        });

        if (isBlocked) {
          return res.status(403).json({
            success: false,
            message: 'Messaging is disabled because a block is active between participants',
          });
        }
      }
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

// ============================================================================
// @desc    Edit a message
// @route   PUT /api/conversations/:id/messages/:messageId
// @access  Private
// ============================================================================
const editMessage = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { id, messageId } = req.params;
    const { text } = req.body;

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

    const message = await Message.findOne({ _id: messageId, conversation: id });
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    if (message.sender.toString() !== currentUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only edit your own messages',
      });
    }

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message text cannot be empty',
      });
    }

    if (text.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot exceed 2000 characters',
      });
    }

    message.text = text.trim();
    await message.save();

    return res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Delete a message
// @route   DELETE /api/conversations/:id/messages/:messageId
// @access  Private
// ============================================================================
const deleteMessage = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { id, messageId } = req.params;

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

    const message = await Message.findOne({ _id: messageId, conversation: id });
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    if (message.sender.toString() !== currentUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only delete your own messages',
      });
    }

    await Message.deleteOne({ _id: messageId });

    return res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
};
