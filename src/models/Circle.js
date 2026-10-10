const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'moderator', 'member'],
      default: 'member',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const circleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Circle name is required'],
      trim: true,
      minlength: [3, 'Circle name must be at least 3 characters'],
      maxlength: [80, 'Circle name cannot exceed 80 characters'],
      unique: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Circle description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: [
          'Coding & DSA',
          'AI & Technology',
          'Academic Study',
          'Sports',
          'Gaming',
          'Photography',
          'Music',
          'Entrepreneurship',
          'Other',
        ],
        message: '{VALUE} is not a valid circle category',
      },
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
      index: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    moderators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    members: [memberSchema],
    avatar: {
      type: String,
      default: null,
    },
    coverColor: {
      type: String,
      default: '#8B5CF6',
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

circleSchema.index({ category: 1, status: 1 });
circleSchema.index({ 'members.user': 1 });

module.exports = mongoose.model('Circle', circleSchema);
