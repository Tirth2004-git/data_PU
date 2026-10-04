const mongoose = require('mongoose');

const pinAttemptSchema = new mongoose.Schema(
  {
    ip: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    attempts: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    firstAttemptAt: {
      type: Date,
      default: Date.now,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'pinAttempts',
  }
);

// Auto-expire attempt records 24 hours after their last update
pinAttemptSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('PinAttempt', pinAttemptSchema);
