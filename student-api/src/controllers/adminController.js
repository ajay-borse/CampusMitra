const User = require('../models/User');
const Profile = require('../models/Profile');
const Connection = require('../models/Connection');
const Message = require('../models/Message');
const Report = require('../models/Report');
const AuditLog = require('../models/AuditLog');
const Verification = require('../models/Verification');
const Notification = require('../models/Notification');
const fs = require('fs');
const path = require('path');

// ============================================================================
// @desc    Get real aggregate campus metrics (No manufactured numbers)
// @route   GET /api/admin/metrics
// @access  Private / Admin
// ============================================================================
const getMetrics = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const bannedUsers = await User.countDocuments({ isBanned: true });
    const totalProfiles = await Profile.countDocuments();
    const completedProfiles = await Profile.countDocuments({ isCompleted: true });
    const totalConnections = await Connection.countDocuments();
    const mutualMatches = await Connection.countDocuments({ status: 'accepted' });
    const totalMessages = await Message.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const pendingVerifications = await Verification.countDocuments({ status: 'PENDING' });
    const approvedVerifications = await Verification.countDocuments({ status: 'APPROVED' });

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        verifiedUsers,
        bannedUsers,
        totalProfiles,
        completedProfiles,
        totalConnections,
        mutualMatches,
        totalMessages,
        pendingReports,
        pendingVerifications,
        approvedVerifications,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Get real user directory with filters for moderation
// @route   GET /api/admin/users
// @access  Private / Admin
// ============================================================================
const getUsers = async (req, res, next) => {
  try {
    const { search } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .populate('profile')
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Moderate user status (Ban / Unban) with AuditLog
// @route   PUT /api/admin/users/:id/status
// @access  Private / Admin
// ============================================================================
const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isBanned, reason } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.isBanned = Boolean(isBanned);
    await user.save();

    // Record in AuditLog
    await AuditLog.create({
      admin: req.user._id,
      action: isBanned ? 'BAN_USER' : 'UNBAN_USER',
      targetUser: user._id,
      details: { reason: reason || 'Moderation decision', targetEmail: user.email },
      ipAddress: req.ip || '',
    });

    return res.status(200).json({
      success: true,
      message: `User ${isBanned ? 'suspended' : 're-activated'} successfully`,
      data: { isBanned: user.isBanned },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Get reports list
// @route   GET /api/admin/reports
// @access  Private / Admin
// ============================================================================
const getReports = async (req, res, next) => {
  try {
    const reports = await Report.find()
      .populate('reporter reportedUser', 'firstName lastName email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Resolve or dismiss a report
// @route   PUT /api/admin/reports/:id
// @access  Private / Admin
// ============================================================================
const resolveReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    if (status) report.status = status;
    if (adminNotes) report.adminNotes = adminNotes;
    await report.save();

    await AuditLog.create({
      admin: req.user._id,
      action: 'RESOLVE_REPORT',
      details: { reportId: report._id, newStatus: status, adminNotes },
      ipAddress: req.ip || '',
    });

    return res.status(200).json({
      success: true,
      message: 'Report updated successfully',
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Get security audit logs
// @route   GET /api/admin/audit-logs
// @access  Private / Admin
// ============================================================================
const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find()
      .populate('admin targetUser', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .limit(100);

    return res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Get student ID verification queue
// @route   GET /api/admin/verifications
// @access  Private / Admin
// ============================================================================
const getVerifications = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && ['PENDING', 'APPROVED', 'REJECTED', 'RESUBMIT_REQUIRED'].includes(status.toUpperCase())) {
      filter.status = status.toUpperCase();
    }

    const verifications = await Verification.find(filter)
      .populate('user', 'firstName lastName email isVerified studentIdVerificationStatus dateOfBirth')
      .populate('reviewedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: verifications.length,
      data: verifications,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Review / approve / reject / request resubmit of student ID
// @route   PUT /api/admin/verifications/:id
// @access  Private / Admin
// ============================================================================
const reviewVerification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason, adminNotes } = req.body;

    const validStatuses = ['APPROVED', 'REJECTED', 'RESUBMIT_REQUIRED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be APPROVED, REJECTED, or RESUBMIT_REQUIRED',
      });
    }

    const verification = await Verification.findById(id).populate('user');
    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Verification document not found',
      });
    }

    verification.status = status;
    verification.reviewedBy = req.user._id;
    verification.reviewedAt = new Date();
    if (rejectionReason !== undefined) verification.rejectionReason = rejectionReason;
    if (adminNotes !== undefined) verification.adminNotes = adminNotes;
    await verification.save();

    // Update target student user
    const targetUser = await User.findById(verification.user._id);
    if (targetUser) {
      targetUser.studentIdVerificationStatus = status;
      if (status === 'APPROVED') {
        targetUser.isVerified = true;
      }
      await targetUser.save();

      // Trigger student notification
      let notifyTitle = 'Student Verification Update 🎓';
      let notifyMsg = 'Your student ID has been approved! You now carry the verified student badge.';
      if (status === 'REJECTED') {
        notifyMsg = `Your student ID verification was declined: ${rejectionReason || 'Document could not be verified'}.`;
      } else if (status === 'RESUBMIT_REQUIRED') {
        notifyMsg = `Student ID resubmission needed: ${rejectionReason || 'Please upload a clearer image of your MIT-WPU ID card'}.`;
      }

      await Notification.create({
        recipient: targetUser._id,
        type: 'verification',
        title: notifyTitle,
        message: notifyMsg,
        data: { status, rejectionReason },
      });
    }

    // Record in AuditLog
    await AuditLog.create({
      admin: req.user._id,
      action: `VERIFICATION_${status}`,
      targetUser: verification.user._id,
      details: {
        verificationId: verification._id,
        newStatus: status,
        rejectionReason,
        adminNotes,
      },
      ipAddress: req.ip || '',
    });

    return res.status(200).json({
      success: true,
      message: `Student verification updated to ${status}`,
      data: verification,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Securely view / stream student ID document (Admins ONLY)
// @route   GET /api/admin/verifications/:id/document
// @access  Private / Admin
// ============================================================================
const getVerificationDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const verification = await Verification.findById(id);

    if (!verification || !verification.idDocumentPath) {
      return res.status(404).json({
        success: false,
        message: 'Document file not found',
      });
    }

    if (!fs.existsSync(verification.idDocumentPath)) {
      return res.status(404).json({
        success: false,
        message: 'Physical document image file not found on disk',
      });
    }

    res.contentType(verification.mimeType || 'image/jpeg');
    return res.sendFile(path.resolve(verification.idDocumentPath));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMetrics,
  getUsers,
  updateUserStatus,
  getReports,
  resolveReport,
  getAuditLogs,
  getVerifications,
  reviewVerification,
  getVerificationDocument,
};
