const Profile = require('../models/Profile');
const User = require('../models/User');

// ============================================================================
// @desc    Get current user's profile
// @route   GET /api/profiles/me
// @access  Private
// ============================================================================
const getMyProfile = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id }).populate(
      'user',
      'firstName lastName email isVerified role gender studentIdVerificationStatus dateOfBirth'
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Update profile fields (bio, interests, program, goals, lifestyle, etc.)
// @route   PUT /api/profiles/me
// @access  Private
// ============================================================================
const updateProfile = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      gender,
      pronouns,
      city,
      division,
      bio,
      program,
      department,
      year,
      interests,
      hobbies,
      preferredFields,
      languages,
      lookingFor,
      lookingForGender,
      lifestyle,
      personality,
      vibeHeadline,
      story,
      discoveryAudience,
      showInCategories,
      privacySettings,
      onboardingStep,
      isOnboarded,
    } = req.body;

    let profile = await Profile.findOne({ user: req.user._id });
    if (!profile) {
      profile = new Profile({ user: req.user._id });
    }

    // Update user personal details if provided
    let userUpdated = false;
    const userDoc = await User.findById(req.user._id);
    if (userDoc) {
      if (firstName && firstName.trim()) {
        userDoc.firstName = firstName.trim();
        userUpdated = true;
      }
      if (lastName && lastName.trim()) {
        userDoc.lastName = lastName.trim();
        userUpdated = true;
      }
      if (gender && ['Female', 'Male', 'Non-binary', 'Other', 'Prefer not to say'].includes(gender)) {
        userDoc.gender = gender;
        profile.gender = gender;
        userUpdated = true;
      }
      if (userUpdated) {
        await userDoc.save();
      }
    }

    if (pronouns !== undefined) profile.pronouns = pronouns.trim();
    if (city !== undefined) profile.city = city.trim();
    if (division !== undefined) profile.division = division.trim();
    if (gender !== undefined) profile.gender = gender;
    if (lookingForGender !== undefined) profile.lookingForGender = lookingForGender;
    if (bio !== undefined) profile.bio = bio.trim();
    if (program !== undefined) profile.program = program.trim();
    if (department !== undefined) profile.department = department.trim();
    if (year !== undefined) profile.year = year.trim();

    if (Array.isArray(interests)) profile.interests = interests;
    if (Array.isArray(hobbies)) profile.hobbies = hobbies;
    if (Array.isArray(preferredFields)) profile.preferredFields = preferredFields;
    if (Array.isArray(languages)) profile.languages = languages;
    if (Array.isArray(personality)) profile.personality = personality;
    if (vibeHeadline !== undefined) profile.vibeHeadline = vibeHeadline.trim();

    if (story && typeof story === 'object') {
      profile.story = { ...profile.story, ...story };
    }

    // Filter lookingFor: dating is only permissible if user is 18+
    if (Array.isArray(lookingFor)) {
      if (!profile.datingEligible) {
        profile.lookingFor = lookingFor.filter(
          (goal) => !goal.toLowerCase().includes('dating')
        );
      } else {
        profile.lookingFor = lookingFor;
      }
    }

    if (lifestyle && typeof lifestyle === 'object') {
      profile.lifestyle = { ...profile.lifestyle, ...lifestyle };
    }

    if (discoveryAudience && ['everyone', 'matching', 'friends_only'].includes(discoveryAudience)) {
      profile.discoveryAudience = discoveryAudience;
    }

    if (Array.isArray(showInCategories)) {
      profile.showInCategories = showInCategories;
    }

    if (privacySettings && typeof privacySettings === 'object') {
      profile.privacySettings = { ...profile.privacySettings, ...privacySettings };
    }

    if (typeof onboardingStep === 'number') {
      profile.onboardingStep = onboardingStep;
    }

    if (typeof isOnboarded === 'boolean') {
      profile.isOnboarded = isOnboarded;
    }

    // Pre-save calculates completion percentage dynamically
    await profile.save();

    const populated = await Profile.findById(profile._id).populate(
      'user',
      'firstName lastName email isVerified role gender studentIdVerificationStatus dateOfBirth'
    );

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Upload a profile photo (max 6 photos)
// @route   POST /api/profiles/me/photos
// @access  Private
// ============================================================================
const uploadPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No photo file provided',
      });
    }

    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found',
      });
    }

    if (profile.photos.length >= 6) {
      return res.status(400).json({
        success: false,
        message: 'Profile already contains the maximum of 6 photos',
      });
    }

    // Relative URL for image serving
    const photoUrl = `/uploads/${req.file.filename}`;
    profile.photos.push(photoUrl);

    await profile.save();

    return res.status(201).json({
      success: true,
      message: 'Photo uploaded successfully',
      data: {
        photoUrl,
        photos: profile.photos,
        photoCount: profile.photos.length,
        completionPercentage: profile.completionPercentage,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Delete a profile photo by index or URL
// @route   DELETE /api/profiles/me/photos
// @access  Private
// ============================================================================
const deletePhoto = async (req, res, next) => {
  try {
    const { photoIndex, photoUrl } = req.body;

    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found',
      });
    }

    if (photoIndex !== undefined && photoIndex >= 0 && photoIndex < profile.photos.length) {
      profile.photos.splice(photoIndex, 1);
    } else if (photoUrl) {
      profile.photos = profile.photos.filter((url) => url !== photoUrl);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid photoIndex or photoUrl to remove',
      });
    }

    await profile.save();

    return res.status(200).json({
      success: true,
      message: 'Photo removed successfully',
      data: {
        photos: profile.photos,
        photoCount: profile.photos.length,
        completionPercentage: profile.completionPercentage,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Reorder photos (e.g. promoting a photo to primary #1)
// @route   PUT /api/profiles/me/photos/reorder
// @access  Private
// ============================================================================
const reorderPhotos = async (req, res, next) => {
  try {
    const { photos } = req.body;

    if (!Array.isArray(photos)) {
      return res.status(400).json({
        success: false,
        message: 'Photos array is required for reordering',
      });
    }

    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found',
      });
    }

    profile.photos = photos.slice(0, 6);
    await profile.save();

    return res.status(200).json({
      success: true,
      message: 'Photos reordered successfully',
      data: {
        photos: profile.photos,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyProfile,
  updateProfile,
  uploadPhoto,
  deletePhoto,
  reorderPhotos,
};
