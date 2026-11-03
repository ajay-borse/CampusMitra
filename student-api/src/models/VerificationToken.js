const mongoose = require('mongoose');

const verificationTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Automatically remove expired tokens
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('VerificationToken', verificationTokenSchema);
