/**
 * CampusMitra Development Test Seed Script
 * Creates clearly marked development test student accounts to evaluate
 * discovery, matching, and messaging during local development.
 *
 * NOTE: These accounts are for development testing only and are clearly
 * identified with [TEST STUDENT] designations.
 *
 * Usage: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Connection = require('../models/Connection');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Notification = require('../models/Notification');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campusmitra';

const TEST_STUDENTS = [
  {
    firstName: 'Priya',
    lastName: 'Verma [TEST]',
    email: 'priya.test@mitwpu.edu.in',
    password: 'password123',
    dateOfBirth: '2004-05-14',
    profile: {
      bio: '[TEST ACCOUNT] React & UI designer ✨ Coffee snob & indie playlist curator. Looking for hackathon teammates!',
      program: 'B.Tech Computer Science',
      department: 'School of Computer Science & Engineering',
      year: '3rd Year',
      interests: ['💻 Coding', '🎵 Music', '☕ Coffee', '🚀 Entrepreneurship'],
      hobbies: ['Badminton', 'Sketching', 'Podcasts'],
      lookingFor: ['🤝 New Friends', '💻 Project Collaborators', '📚 Study Partners'],
      photos: [
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
      ],
      lifestyle: { drinking: 'Never', smoking: 'Never', foodPreference: 'Vegetarian', pets: 'Dog lover' },
    },
  },
  {
    firstName: 'Rahul',
    lastName: 'Sharma [TEST]',
    email: 'rahul.test@mitwpu.edu.in',
    password: 'password123',
    dateOfBirth: '2003-08-20',
    profile: {
      bio: '[TEST ACCOUNT] DevOps & Cloud enthusiast 🚀 Weekend cricket matches, always down for a chai break near the fountain.',
      program: 'MCA (Computer Applications)',
      department: 'School of Computer Science & Engineering',
      year: '2nd Year',
      interests: ['💻 Coding', '🏏 Sports', '☕ Coffee', '📚 Study'],
      hobbies: ['Cricket', 'Open Source', 'Chess'],
      lookingFor: ['📚 Study Partners', '🤝 New Friends'],
      photos: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
      ],
      lifestyle: { drinking: 'Never', smoking: 'Never', foodPreference: 'Non-Vegetarian', pets: 'Cat lover' },
    },
  },
  {
    firstName: 'Sneha',
    lastName: 'Kulkarni [TEST]',
    email: 'sneha.test@mitwpu.edu.in',
    password: 'password123',
    dateOfBirth: '2004-11-02',
    profile: {
      bio: '[TEST ACCOUNT] Figma UI/UX designer, anime fan 🎨 Making campus projects look aesthetic and modern.',
      program: 'B.Des User Experience',
      department: 'School of Design',
      year: '2nd Year',
      interests: ['🎨 Art', '🎮 Gaming', '🎵 Music', '☕ Coffee'],
      hobbies: ['Digital Art', 'Anime', 'Photography'],
      lookingFor: ['🤝 New Friends', '💻 Project Collaborators'],
      photos: [
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
      ],
      lifestyle: { drinking: 'Never', smoking: 'Never', foodPreference: 'Vegetarian', pets: 'None' },
    },
  },
  {
    firstName: 'Admin',
    lastName: 'Moderator [TEST]',
    email: 'admin.moderator@mitwpu.edu.in',
    password: 'adminpassword123',
    dateOfBirth: '2000-01-01',
    role: 'admin',
    profile: {
      bio: '[ADMIN ACCOUNT] CampusMitra system moderation & safety account.',
      program: 'Staff / Admin',
      department: 'Administration',
      year: 'Staff',
      interests: ['🛡️ Safety'],
      photos: ['https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80'],
    },
  },
];

async function seedDatabase() {
  try {
    console.log(`Connecting to MongoDB at: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected! Seeding development test accounts...');

    for (const item of TEST_STUDENTS) {
      const existing = await User.findOne({ email: item.email });
      if (existing) {
        console.log(`- Skipping existing test account: ${item.email}`);
        continue;
      }

      const user = await User.create({
        firstName: item.firstName,
        lastName: item.lastName,
        email: item.email,
        password: item.password,
        dateOfBirth: new Date(item.dateOfBirth),
        role: item.role || 'user',
        isVerified: true,
      });

      const profile = await Profile.create({
        user: user._id,
        ...item.profile,
        age: user.calculateAge(),
        datingEligible: user.calculateAge() >= 18,
      });

      user.profile = profile._id;
      await user.save();
      console.log(`+ Created test student: ${item.firstName} (${item.email})`);
    }

    console.log('✅ Development test seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
    process.exit(1);
  }
}

seedDatabase();
