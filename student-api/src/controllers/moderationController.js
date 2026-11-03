const Block = require('../models/Block');
const Report = require('../models/Report');
const Connection = require('../models/Connection');
const User = require('../models/User');

// ============================================================================
// @desc    Block a user
// @route   POST /api/blocks
// @access  Private
// ============================================================================
const blockUser = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { targetUserId, reason } = req.body;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'targetUserId is required',
      });
    }

    if (currentUserId.toString() === targetUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot block yourself',
      });
    }

    await Block.findOneAndUpdate(
      { blocker: currentUserId, blockedUser: targetUserId },
      { reason: reason || 'User requested block' },
      { upsert: true, returnDocument: 'after' }
    );

    // Sever any connection between them
    await Connection.deleteMany({
      $or: [
        { user1: currentUserId, user2: targetUserId },
        { user1: targetUserId, user2: currentUserId },
      ],
    });

    return res.status(200).json({
      success: true,
      message: 'User blocked successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Report a user for safety/moderation review
// @route   POST /api/reports
// @access  Private
// ============================================================================
const reportUser = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { reportedUserId, reason, description } = req.body;

    if (!reportedUserId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide reportedUserId and a valid reason',
      });
    }

    const reasonMap = {
      harassment: 'Harassment',
      fake_account: 'Fake profile',
      'fake profile': 'Fake profile',
      inappropriate_content: 'Inappropriate content',
      'inappropriate content': 'Inappropriate content',
      spam: 'Spam',
      impersonation: 'Impersonation',
      other: 'Other',
    };
    const normalizedReason = reasonMap[reason.toLowerCase()] || reason;

    const report = await Report.create({
      reporter: currentUserId,
      reportedUser: reportedUserId,
      reason: normalizedReason,
      description: description || '',
    });

    return res.status(201).json({
      success: true,
      message: 'Report submitted successfully. Campus safety team will review it.',
      data: { reportId: report._id },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  blockUser,
  reportUser,
};
