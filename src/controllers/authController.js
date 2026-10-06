const crypto = require('crypto');
const User = require('../models/User');
const Profile = require('../models/Profile');
const VerificationToken = require('../models/VerificationToken');
const { generateToken } = require('../utils/token');

// Helper to calculate age from DOB
const calculateAge = (dateOfBirth) => {
  const diffMs = Date.now() - new Date(dateOfBirth).getTime();
  const ageDt = new Date(diffMs);
  return Math.abs(ageDt.getUTCFullYear() - 1970);
};

// ============================================================================
// @desc    Register a new student user
// @route   POST /api/auth/register
// @access  Public
// ============================================================================
const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, dateOfBirth } = req.body;

    // 1. Basic validation
    if (!firstName || !lastName || !email || !password || !dateOfBirth) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: firstName, lastName, email, password, dateOfBirth',
      });
    }

    // 2. Strict backend verification for university email
    const allowedDomains = (process.env.ALLOWED_EMAIL_DOMAINS || 'mitwpu.edu.in')
      .split(',')
      .map((d) => d.trim().toLowerCase());
    const emailDomain = email.split('@')[1]?.toLowerCase();

    if (!emailDomain || !allowedDomains.includes(emailDomain)) {
      return res.status(400).json({
        success: false,
        message: 'Registration is restricted to university students (@mitwpu.edu.in)',
      });
    }

    // 3. Check for existing user
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this university email already exists',
      });
    }

    // 4. Server-side age calculation & dating eligibility safety check
    const age = calculateAge(dateOfBirth);
    const datingEligible = age >= 18;

    // 5. Create user record
    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      password,
      dateOfBirth: new Date(dateOfBirth),
    });

    // 6. Create corresponding student profile
    const profile = await Profile.create({
      user: user._id,
      age,
      datingEligible,
      lookingFor: datingEligible
        ? ['🤝 New Friends', '📚 Study Partners']
        : ['🤝 New Friends', '📚 Study Partners'], // Under-18 strictly gets friendship/study goals
    });

    user.profile = profile._id;
    await user.save();

    // 7. Generate email verification token
    const rawToken = crypto.randomBytes(32).toString('hex');
    await VerificationToken.create({
      user: user._id,
      token: rawToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours validity
    });

    const token = generateToken(user._id, user.role);

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Verification token generated.',
      data: {
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          gender: user.gender,
          studentIdVerificationStatus: user.studentIdVerificationStatus,
          dateOfBirth: user.dateOfBirth,
          age,
          datingEligible,
        },
        profile,
        // Provided for clean local development and testing without third-party email service
        verificationUrl: `/api/auth/verify-email/${rawToken}`,
        verificationToken: rawToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
// ============================================================================
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    // Find user with password selected
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid university email or password',
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended by campus moderators',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid university email or password',
      });
    }

    const profile = await Profile.findOne({ user: user._id });
    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          gender: user.gender,
          studentIdVerificationStatus: user.studentIdVerificationStatus,
          dateOfBirth: user.dateOfBirth,
        },
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Get current authenticated user profile
// @route   GET /api/auth/me
// @access  Private (JWT required)
// ============================================================================
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const profile = await Profile.findOne({ user: req.user._id });

    return res.status(200).json({
      success: true,
      data: {
        user,
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Verify student university email with token
// @route   GET /api/auth/verify-email/:token
// @access  Public
// ============================================================================
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    const tokenDoc = await VerificationToken.findOne({ token });
    if (!tokenDoc) {
      return res.status(400).json({
        success: false,
        message: 'Verification link is invalid or has expired',
      });
    }

    const user = await User.findById(tokenDoc.user);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User associated with token not found',
      });
    }

    user.isVerified = true;
    await user.save();

    await VerificationToken.deleteOne({ _id: tokenDoc._id });

    return res.status(200).json({
      success: true,
      message: 'University email successfully verified! You have full campus access.',
      data: {
        isVerified: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  verifyEmail,
};
