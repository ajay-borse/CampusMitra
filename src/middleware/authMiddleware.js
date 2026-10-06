const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication Middleware
 * Validates JWT Bearer token and attaches authenticated user to request.
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'campusmitra_fallback_jwt_secret');

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists or token is invalid',
        });
      }

      if (user.isBanned) {
        return res.status(403).json({
          success: false,
          message: 'This account has been suspended by campus moderators',
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token verification failed',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, authentication token missing',
    });
  }
};

/**
 * Admin Authorization Middleware
 * Verifies that the authenticated user possesses the 'admin' role.
 */
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Forbidden: Administrative access required',
  });
};

module.exports = {
  protect,
  requireAdmin,
};
