const Notification = require('../models/Notification');
const User = require('../models/User');
const Profile = require('../models/Profile');

/**
 * Creates and delivers a notification safely, avoiding duplicates and emitting in real-time.
 *
 * @param {Object} options
 * @param {string|mongoose.Types.ObjectId} options.recipient - Target User ID
 * @param {string|mongoose.Types.ObjectId} [options.sender] - Source User ID (optional)
 * @param {string} options.type - Notification type ('interest', 'match', 'message', 'plan', 'circle', 'pulse', 'system', 'verification')
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message
 * @param {Object} [options.data] - Safe metadata for navigation (e.g. conversationId, planId, postId)
 * @param {boolean} [options.allowDuplicate=false] - Whether to allow duplicate unread notifications
 */
async function sendNotification({
  recipient,
  sender = null,
  type,
  title,
  message,
  data = {},
  allowDuplicate = false,
}) {
  try {
    if (!recipient) return null;

    const recipientId = recipient.toString();
    const senderId = sender ? sender.toString() : null;

    // Deduplication check: if an unread notification with identical recipient, sender, type and target exists within last 24h
    if (!allowDuplicate) {
      const query = {
        recipient: recipientId,
        type,
        isRead: false,
      };

      if (senderId) query.sender = senderId;
      if (data.conversationId) query['data.conversationId'] = data.conversationId;
      if (data.planId) query['data.planId'] = data.planId;
      if (data.circleId) query['data.circleId'] = data.circleId;
      if (data.postId) query['data.postId'] = data.postId;

      const existing = await Notification.findOne(query);
      if (existing) {
        // Update existing notification with newest timestamp and message
        existing.message = message;
        existing.title = title;
        existing.data = { ...existing.data, ...data };
        await existing.save();

        emitSocketNotification(recipientId, existing);
        return existing;
      }
    }

    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      title,
      message,
      data,
    });

    // Populate safe sender information
    const populated = await Notification.findById(notification._id).populate(
      'sender',
      'firstName lastName email isVerified role gender'
    );

    let senderAvatar = null;
    let senderProgram = null;
    if (senderId) {
      const senderProfile = await Profile.findOne({ user: senderId }).select(
        'photos program department privacySettings'
      );
      if (senderProfile) {
        if (senderProfile.privacySettings?.profileVisibility !== false) {
          senderAvatar = senderProfile.photos?.[0] || null;
          senderProgram = senderProfile.program || null;
        }
      }
    }

    const result = {
      ...populated.toObject(),
      senderProfile: {
        avatar: senderAvatar,
        program: senderProgram,
      },
    };

    emitSocketNotification(recipientId, result);
    return result;
  } catch (err) {
    console.error('Failed to create/send notification:', err.message);
    return null;
  }
}

function emitSocketNotification(recipientId, notificationData) {
  try {
    const { getSocketIO } = require('../sockets/chatSocket');
    const io = getSocketIO();
    if (io) {
      io.to(recipientId.toString()).emit('new_notification', notificationData);
    }
  } catch (err) {
    // Socket emit failure should not throw
  }
}

module.exports = {
  sendNotification,
};
