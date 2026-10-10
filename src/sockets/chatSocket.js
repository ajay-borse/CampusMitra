const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Block = require('../models/Block');

let io = null;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'campusmitra_fallback_jwt_secret');
      const user = await User.findById(decoded.id).select('firstName lastName email role');
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    // Join personal notification channel
    socket.join(userId);

    // Join conversation room
    socket.on('join_conversation', async (conversationId, callback) => {
      try {
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: socket.user._id,
        });

        if (conversation) {
          socket.join(`conv_${conversationId}`);
          if (typeof callback === 'function') {
            callback({ success: true, joined: true });
          }
        } else {
          if (typeof callback === 'function') {
            callback({ success: false, error: 'Unauthorized: You are not a participant in this conversation' });
          }
        }
      } catch (err) {
        console.error('Error joining conversation room:', err.message);
        if (typeof callback === 'function') {
          callback({ success: false, error: err.message });
        }
      }
    });

    // Typing event
    socket.on('typing', ({ conversationId, isTyping }) => {
      socket.to(`conv_${conversationId}`).emit('user_typing', {
        conversationId,
        userId: socket.user._id,
        userName: socket.user.firstName,
        isTyping,
      });
    });

    // Direct message event
    socket.on('send_message', async ({ conversationId, text }, callback) => {
      try {
        if (!text || typeof text !== 'string' || !text.trim()) {
          if (callback) callback({ error: 'Message text cannot be empty' });
          return;
        }

        if (text.length > 2000) {
          if (callback) callback({ error: 'Message cannot exceed 2000 characters' });
          return;
        }

        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: socket.user._id,
        });

        if (!conversation) {
          if (callback) callback({ error: 'Conversation access unauthorized' });
          return;
        }

        // Check if any participant blocked the other (for direct conversations)
        if (conversation.type !== 'plan_group') {
          const otherParticipantId = conversation.participants.find(
            (p) => p.toString() !== socket.user._id.toString()
          );

          if (otherParticipantId) {
            const isBlocked = await Block.findOne({
              $or: [
                { blocker: socket.user._id, blockedUser: otherParticipantId },
                { blocker: otherParticipantId, blockedUser: socket.user._id },
              ],
            });

            if (isBlocked) {
              if (callback) callback({ error: 'Messaging is disabled due to active block' });
              return;
            }
          }
        }

        const message = await Message.create({
          conversation: conversationId,
          sender: socket.user._id,
          text: text.trim(),
          readBy: [socket.user._id],
        });

        conversation.lastMessage = message._id;
        await conversation.save();

        const populated = await Message.findById(message._id).populate(
          'sender',
          'firstName lastName'
        );

        io.to(`conv_${conversationId}`).emit('new_message', {
          conversationId,
          message: populated,
        });

        if (callback) callback({ success: true, message: populated });
      } catch (err) {
        console.error('Socket message error:', err.message);
        if (callback) callback({ error: 'Failed to send message' });
      }
    });

    socket.on('disconnect', () => {
      // Disconnect handled gracefully
    });
  });

  return io;
};

const getSocketIO = () => io;

module.exports = {
  initSocket,
  getSocketIO,
};
