const mongoose = require('mongoose');

/**
 * Student Schema definition for MongoDB via Mongoose
 * Fields:
 * - name: String (required)
 * - email: String (required)
 * - course: String (required)
 * - timestamps: createdAt and updatedAt are auto-generated
 */
const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    course: {
      type: String,
      required: [true, 'Course is required'],
      trim: true,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

module.exports = mongoose.model('Student', studentSchema);
