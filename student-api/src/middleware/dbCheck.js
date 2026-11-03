const { getDBStatus } = require('../config/db');

/**
 * Middleware ensuring MongoDB is actively connected.
 * In accordance with product rules, operations do not pretend to succeed
 * when the database is unavailable.
 */
const requireDB = (req, res, next) => {
  if (!getDBStatus()) {
    return res.status(503).json({
      success: false,
      message:
        'Database service is unavailable. Please ensure MongoDB is running or configure MONGODB_URI in your .env configuration.',
    });
  }
  next();
};

module.exports = requireDB;
