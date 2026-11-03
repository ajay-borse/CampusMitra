const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['direct', 'plan_group'],
      default: 'direct',
      index: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      index: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    pairKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({ participants: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
