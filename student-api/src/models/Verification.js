const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    // Filename / path stored securely (never exposed publicly)
    idDocumentPath: {
      type: String,
      required: true,
    },
    originalFileName: {
      type: String,
      default: '',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    mimeType: {
      type: String,
      default: 'image/jpeg',
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'RESUBMIT_REQUIRED'],
      default: 'PENDING',
      index: true,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    adminNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Verification', verificationSchema);
