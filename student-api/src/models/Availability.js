const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: false,
      index: true,
    },
    intentions: {
      type: [String],
      enum: ['Study', 'Coffee', 'Sports', 'Coding', 'Campus events', 'Casual conversation', 'Other'],
      default: ['Study'],
    },
    note: {
      type: String,
      maxlength: [120, 'Note cannot exceed 120 characters'],
      default: '',
      trim: true,
    },
    audience: {
      type: String,
      enum: ['everyone', 'connections_only'],
      default: 'everyone',
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 2 * 60 * 60 * 1000), // Default 2 hours
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying active, non-expired availabilities
availabilitySchema.index({ isActive: 1, expiresAt: 1 });

module.exports = mongoose.model('Availability', availabilitySchema);
