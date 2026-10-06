const Verification = require('../models/Verification');
const User = require('../models/User');
const Notification = require('../models/Notification');
const fs = require('fs');

// ============================================================================
// @desc    Submit / re-submit student ID card for verification
// @route   POST /api/verifications/student-id
// @access  Private (Student)
// ============================================================================
const submitStudentId = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Student ID card image is required (JPEG, PNG, or WebP up to 5MB)',
      });
    }

    const userId = req.user._id;

    // Check if previous verification exists
    let verification = await Verification.findOne({ user: userId });

    if (verification) {
      // If previous file exists and is being replaced, clean up old file safely
      if (verification.idDocumentPath && fs.existsSync(verification.idDocumentPath)) {
        try {
          fs.unlinkSync(verification.idDocumentPath);
        } catch {
          // Ignore cleanup failure in case file was already moved
        }
      }

      verification.idDocumentPath = req.file.path;
      verification.originalFileName = req.file.originalname;
      verification.fileSize = req.file.size;
      verification.mimeType = req.file.mimetype;
      verification.status = 'PENDING';
      verification.rejectionReason = '';
      verification.reviewedBy = null;
      verification.reviewedAt = null;
      await verification.save();
    } else {
      verification = await Verification.create({
        user: userId,
        idDocumentPath: req.file.path,
        originalFileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        status: 'PENDING',
      });
    }

    // Update user record status
    await User.findByIdAndUpdate(userId, {
      studentIdVerificationStatus: 'PENDING',
      studentIdVerification: verification._id,
    });

    return res.status(200).json({
      success: true,
      message: 'Student ID successfully uploaded! Your verification is now pending campus review.',
      data: {
        status: 'PENDING',
        uploadedAt: verification.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Get current student's verification status
// @route   GET /api/verifications/status
// @access  Private
// ============================================================================
const getVerificationStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select(
      'isVerified studentIdVerificationStatus email'
    );
    const verification = await Verification.findOne({ user: req.user._id });

    return res.status(200).json({
      success: true,
      data: {
        isEmailVerified: user?.isVerified || false,
        studentIdStatus: user?.studentIdVerificationStatus || 'NONE',
        rejectionReason: verification?.rejectionReason || '',
        submittedAt: verification?.createdAt || null,
        reviewedAt: verification?.reviewedAt || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitStudentId,
  getVerificationStatus,
};
