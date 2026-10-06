const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

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
    socket.on('join_conversation', async (conversationId) => {
      try {
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: socket.user._id,
        });

        if (conversation) {
          socket.join(`conv_${conversationId}`);
        }
      } catch (err) {
        console.error('Error joining conversation room:', err.message);
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
        if (!text || !text.trim()) return;

        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: socket.user._id,
        });

        if (!conversation) {
          if (callback) callback({ error: 'Conversation access unauthorized' });
          return;
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
