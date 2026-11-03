const mongoose = require('mongoose');

const languageItemSchema = new mongoose.Schema(
  {
    language: {
      type: String,
      required: true,
      trim: true,
    },
    proficiency: {
      type: String,
      enum: ['Basic', 'Intermediate', 'Fluent', 'Native'],
      default: 'Fluent',
    },
  },
  { _id: false }
);

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    // Step 2: About You fields
    pronouns: {
      type: String,
      default: '',
      trim: true,
    },
    city: {
      type: String,
      default: 'Pune',
      trim: true,
    },
    division: {
      type: String,
      default: '',
      trim: true,
    },
    gender: {
      type: String,
      enum: ['Female', 'Male', 'Non-binary', 'Other', 'Prefer not to say'],
      default: 'Prefer not to say',
    },
    // Step 4: Who would you like to meet?
    lookingForGender: {
      type: String,
      enum: ['Women', 'Men', 'Non-binary people', 'Everyone', 'Prefer not to say'],
      default: 'Everyone',
    },
    bio: {
      type: String,
      default: '',
      maxlength: [500, 'Bio cannot exceed 500 characters'],
    },
    program: {
      type: String,
      default: 'MCA (Computer Applications)',
    },
    department: {
      type: String,
      default: 'School of Computer Science & Engineering',
    },
    year: {
      type: String,
      default: '1st Year',
    },
    age: {
      type: Number,
      default: 18,
    },
    datingEligible: {
      type: Boolean,
      default: true,
    },
    // Step 11: Photos (up to 6)
    photos: {
      type: [String],
      validate: [
        function (val) {
          return val.length <= 6;
        },
        'A profile can have at most 6 photos',
      ],
      default: [],
    },
    // Step 5: Interests
    interests: {
      type: [String],
      default: [],
    },
    hobbies: {
      type: [String],
      default: [],
    },
    // Step 6: Academic fields preference / background
    preferredFields: {
      type: [String],
      default: [],
    },
    // Step 7: Languages
    languages: {
      type: [languageItemSchema],
      default: [{ language: 'English', proficiency: 'Fluent' }],
    },
    // Step 3: What are you looking for?
    lookingFor: {
      type: [String],
      default: ['🤝 New Friends', '📚 Study Partners'],
    },
    // Step 8: Lifestyle
    lifestyle: {
      foodPreference: { type: String, default: 'Vegetarian' },
      drinking: { type: String, default: 'Prefer not to say' },
      smoking: { type: String, default: 'Prefer not to say' },
      pets: { type: String, default: 'Love pets' },
      fitness: { type: String, default: 'Casual' },
      sleepSchedule: { type: String, default: 'Night owl' },
      socialStyle: { type: String, default: 'Ambivert' },
    },
    // Step 9: Personality & Vibe
    personality: {
      type: [String],
      default: [],
    },
    vibeHeadline: {
      type: String,
      default: '',
      maxlength: [120, 'Headline cannot exceed 120 characters'],
    },
    // Step 10: Your Story
    story: {
      aboutMe: { type: String, default: '', maxlength: 300 },
      passionateAbout: { type: String, default: '', maxlength: 200 },
      perfectWeekend: { type: String, default: '', maxlength: 200 },
      talkAboutForHours: { type: String, default: '', maxlength: 200 },
      randomFact: { type: String, default: '', maxlength: 150 },
    },
    // Step 12: Matching Preferences & Privacy
    discoveryAudience: {
      type: String,
      enum: ['everyone', 'matching', 'friends_only'],
      default: 'everyone',
    },
    showInCategories: {
      type: [String],
      default: ['Friends', 'Study', 'Activities'],
    },
    privacySettings: {
      profileVisibility: { type: Boolean, default: true },
      showAge: { type: Boolean, default: true },
      showProgram: { type: Boolean, default: true },
      showLifestyle: { type: Boolean, default: true },
      showLanguages: { type: Boolean, default: true },
      discoveryVisibility: { type: Boolean, default: true },
    },
    // Onboarding progress tracking & persistence
    onboardingStep: {
      type: Number,
      default: 1,
      min: 1,
      max: 13,
    },
    isOnboarded: {
      type: Boolean,
      default: false,
      index: true,
    },
    completionPercentage: {
      type: Number,
      default: 20,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate profile completion percentage based on actual fields
profileSchema.methods.calculateCompletion = function () {
  let score = 0;

  // 1. Basic Info (First name/Program/City/Year) -> 20%
  let basicScore = 0;
  if (this.program) basicScore += 8;
  if (this.city) basicScore += 6;
  if (this.year) basicScore += 6;
  score += Math.min(20, basicScore);

  // 2. Photos -> up to 20% (approx 3.3% per photo up to 6)
  const photoCount = this.photos ? this.photos.length : 0;
  score += Math.min(20, Math.round((photoCount / 6) * 20));

  // 3. Interests -> 15% (3+ interests needed for full points)
  const interestCount = this.interests ? this.interests.length : 0;
  if (interestCount >= 5) score += 15;
  else if (interestCount >= 3) score += 10;
  else if (interestCount >= 1) score += 5;

  // 4. Languages -> 10%
  const langCount = this.languages ? this.languages.length : 0;
  if (langCount >= 2) score += 10;
  else if (langCount >= 1) score += 6;

  // 5. Looking For / Goals -> 10%
  const goalsCount = this.lookingFor ? this.lookingFor.length : 0;
  if (goalsCount >= 2) score += 10;
  else if (goalsCount >= 1) score += 5;

  // 6. Lifestyle -> 10%
  if (this.lifestyle && (this.lifestyle.foodPreference || this.lifestyle.socialStyle)) {
    score += 10;
  }

  // 7. Story & Bio -> 10%
  const hasBio = this.bio && this.bio.trim().length >= 10;
  const hasStory =
    this.story &&
    (this.story.aboutMe || this.story.perfectWeekend || this.story.passionateAbout);
  if (hasBio || hasStory) score += 10;
  else if (this.vibeHeadline) score += 5;

  // 8. Base verification check -> 5%
  score += 5;

  this.completionPercentage = Math.min(100, Math.max(10, score));

  // A profile is strictly completed when onboarded and has minimum essentials
  this.isCompleted = Boolean(
    this.isOnboarded ||
      (photoCount >= 1 && this.interests.length >= 3 && (this.bio || this.story?.aboutMe))
  );

  return this.completionPercentage;
};

// Modern async Mongoose pre-save middleware (NO next callback)
profileSchema.pre('save', async function () {
  this.calculateCompletion();
});

module.exports = mongoose.model('Profile', profileSchema);
