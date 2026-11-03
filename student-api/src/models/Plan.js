const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    role: {
      type: String,
      enum: ['creator', 'participant'],
      default: 'participant',
    },
  },
  { _id: false }
);

const planSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Plan title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Plan description is required'],
      trim: true,
      maxlength: [1500, 'Description cannot exceed 1500 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['Study', 'Coffee', 'Sports', 'Coding', 'Gaming', 'Food', 'Events', 'Other'],
        message: '{VALUE} is not a supported plan category',
      },
      index: true,
    },
    date: {
      type: String,
      required: [true, 'Plan date is required (YYYY-MM-DD)'],
      index: true,
    },
    time: {
      type: String,
      required: [true, 'Plan start time is required'],
    },
    duration: {
      type: String,
      required: [true, 'Approximate duration is required'],
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Participant capacity is required'],
      min: [2, 'Capacity must be at least 2 participants'],
      max: [50, 'Capacity cannot exceed 50 participants'],
    },
    location: {
      type: String,
      required: [true, 'Meeting location is required'],
      trim: true,
      maxlength: [120, 'Location cannot exceed 120 characters'],
    },
    locationType: {
      type: String,
      enum: ['campus', 'public', 'online'],
      default: 'campus',
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ['upcoming', 'full', 'completed', 'cancelled'],
      default: 'upcoming',
      index: true,
    },
    participants: [participantSchema],
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
    },
    circle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Circle',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for discovery and filtering
planSchema.index({ date: 1, status: 1 });
planSchema.index({ category: 1, status: 1 });
planSchema.index({ 'participants.user': 1 });

module.exports = mongoose.model('Plan', planSchema);
