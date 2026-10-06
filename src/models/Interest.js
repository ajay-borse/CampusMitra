const mongoose = require('mongoose');

const interestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Tech', 'Creative', 'Entertainment', 'Fitness', 'Lifestyle', 'Career', 'Academic'],
      default: 'Lifestyle',
    },
    emoji: {
      type: String,
      default: '✨',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Interest', interestSchema);
