const mongoose = require('mongoose');

const pulseCommentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

const pollVoteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    optionIndex: {
      type: Number,
      required: true,
    },
    votedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const pollOptionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Poll option text is required'],
      trim: true,
      maxlength: [100, 'Poll option cannot exceed 100 characters'],
    },
  },
  { _id: true }
);

const pulsePostSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
      trim: true,
      maxlength: [2000, 'Post content cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      enum: ['general', 'question', 'announcement', 'poll'],
      default: 'general',
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    mediaUrl: {
      type: String,
      default: null,
    },
    circle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Circle',
      default: null,
      index: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      default: null,
      index: true,
    },
    visibility: {
      type: String,
      enum: ['public', 'circle', 'private'],
      default: 'public',
      index: true,
    },
    poll: {
      question: {
        type: String,
        trim: true,
        maxlength: [300, 'Poll question cannot exceed 300 characters'],
      },
      options: [pollOptionSchema],
      votes: [pollVoteSchema],
      expiresAt: {
        type: Date,
        default: null,
      },
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    bookmarks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    comments: [pulseCommentSchema],
    isEdited: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

pulsePostSchema.index({ createdAt: -1 });
pulsePostSchema.index({ category: 1, createdAt: -1 });
pulsePostSchema.index({ circle: 1, createdAt: -1 });
pulsePostSchema.index({ plan: 1, createdAt: -1 });
pulsePostSchema.index({ author: 1, createdAt: -1 });
pulsePostSchema.index({ 'bookmarks': 1 });

module.exports = mongoose.model('PulsePost', pulsePostSchema);
