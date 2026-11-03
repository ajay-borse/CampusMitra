const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema(
  {
    user1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    user2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['interested', 'passed', 'accepted'],
      default: 'interested',
    },
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['match', 'friendship', 'study'],
      default: 'friendship',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast connection matching and filtering
connectionSchema.index({ user1: 1, user2: 1 }, { unique: true });
connectionSchema.index({ user1: 1, status: 1 });
connectionSchema.index({ user2: 1, status: 1 });

module.exports = mongoose.model('Connection', connectionSchema);
