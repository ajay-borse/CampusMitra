const Notification = require('../models/Notification');
const Profile = require('../models/Profile');

// ============================================================================
// @desc    Get user notifications with pagination & safe actor data
// @route   GET /api/notifications
// @access  Private
// ============================================================================
const getNotifications = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 30));
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ recipient: req.user._id })
        .populate('sender', 'firstName lastName email isVerified role gender')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ recipient: req.user._id }),
      Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    ]);

    // Attach sender profiles (avatar, program) safely
    const senderIds = notifications
      .map((n) => n.sender?._id)
      .filter(Boolean);

    const profiles = await Profile.find({ user: { $in: senderIds } })
      .select('user photos program department privacySettings')
      .lean();

    const profileMap = new Map();
    profiles.forEach((p) => {
      if (p.user) profileMap.set(p.user.toString(), p);
    });

    const enriched = notifications.map((item) => {
      let senderProfile = null;
      if (item.sender?._id) {
        const prof = profileMap.get(item.sender._id.toString());
        if (prof) {
          const visible = prof.privacySettings?.profileVisibility !== false;
          senderProfile = {
            avatar: visible && prof.photos?.length > 0 ? prof.photos[0] : null,
            program: visible ? prof.program : null,
            department: visible ? prof.department : null,
          };
        }
      }

      return {
        ...item,
        senderProfile,
      };
    });

    return res.status(200).json({
      success: true,
      unreadCount,
      count: enriched.length,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      data: enriched,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Mark a single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
// ============================================================================
const markOneRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.user._id },
      { $set: { isRead: true } },
      { returnDocument: 'after' }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or unauthorized',
      });
    }

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
// ============================================================================
const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      unreadCount: 0,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
// ============================================================================
const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deleted = await Notification.findOneAndDelete({
      _id: id,
      recipient: req.user._id,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or unauthorized',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markOneRead,
  markAllRead,
  deleteNotification,
};
