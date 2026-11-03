const Interest = require('../models/Interest');

// Comprehensive curated campus interest catalog
const PRESET_INTEREST_CATALOG = [
  // 🎬 Entertainment
  { name: 'Movies', category: 'Entertainment', emoji: '🎬' },
  { name: 'Netflix', category: 'Entertainment', emoji: '🍿' },
  { name: 'Anime', category: 'Entertainment', emoji: '⚡' },
  { name: 'Marvel', category: 'Entertainment', emoji: '🛡️' },
  { name: 'DC', category: 'Entertainment', emoji: '🦇' },
  { name: 'Harry Potter', category: 'Entertainment', emoji: '🧙‍♂️' },
  { name: 'Bollywood', category: 'Entertainment', emoji: '💃' },
  { name: 'Hollywood', category: 'Entertainment', emoji: '🌟' },
  { name: 'K-Drama', category: 'Entertainment', emoji: '🌸' },
  { name: 'Comedy', category: 'Entertainment', emoji: '😂' },
  { name: 'Books', category: 'Entertainment', emoji: '📚' },
  { name: 'Manga', category: 'Entertainment', emoji: '📖' },

  // 🍕 Food & Drink
  { name: 'Biryani', category: 'Food & Drink', emoji: '🍛' },
  { name: 'Pizza', category: 'Food & Drink', emoji: '🍕' },
  { name: 'Sushi', category: 'Food & Drink', emoji: '🍣' },
  { name: 'Coffee', category: 'Food & Drink', emoji: '☕' },
  { name: 'Chai', category: 'Food & Drink', emoji: '🫖' },
  { name: 'Street Food', category: 'Food & Drink', emoji: '🌯' },
  { name: 'Desserts', category: 'Food & Drink', emoji: '🍰' },
  { name: 'Ice Cream', category: 'Food & Drink', emoji: '🍦' },
  { name: 'BBQ', category: 'Food & Drink', emoji: '🍖' },
  { name: 'Ramen', category: 'Food & Drink', emoji: '🍜' },
  { name: 'Korean Food', category: 'Food & Drink', emoji: '🥢' },
  { name: 'Italian Food', category: 'Food & Drink', emoji: '🍝' },
  { name: 'Indian Food', category: 'Food & Drink', emoji: '🥘' },
  { name: 'Baking', category: 'Food & Drink', emoji: '🧁' },
  { name: 'Cooking', category: 'Food & Drink', emoji: '🍳' },

  // 🎮 Gaming
  { name: 'Valorant', category: 'Gaming', emoji: '🎯' },
  { name: 'BGMI', category: 'Gaming', emoji: '🔫' },
  { name: 'FIFA', category: 'Gaming', emoji: '⚽' },
  { name: 'GTA', category: 'Gaming', emoji: '🚗' },
  { name: 'Minecraft', category: 'Gaming', emoji: '🧱' },
  { name: 'PlayStation', category: 'Gaming', emoji: '🎮' },
  { name: 'PC Gaming', category: 'Gaming', emoji: '💻' },
  { name: 'E-Sports', category: 'Gaming', emoji: '🏆' },
  { name: 'Fortnite', category: 'Gaming', emoji: '🪂' },
  { name: 'Free Fire', category: 'Gaming', emoji: '🔥' },
  { name: 'Roblox', category: 'Gaming', emoji: '👾' },
  { name: 'Among Us', category: 'Gaming', emoji: '🚀' },
  { name: 'Nintendo', category: 'Gaming', emoji: '🍄' },
  { name: 'Ludo', category: 'Gaming', emoji: '🎲' },

  // 🌍 Travel
  { name: 'Solo Travel', category: 'Travel', emoji: '🧳' },
  { name: 'Road Trips', category: 'Travel', emoji: '🛣️' },
  { name: 'Trekking', category: 'Travel', emoji: '🥾' },
  { name: 'Mountains', category: 'Travel', emoji: '🏔️' },
  { name: 'Beaches', category: 'Travel', emoji: '🏖️' },
  { name: 'Backpacking', category: 'Travel', emoji: '🎒' },
  { name: 'Photography Trips', category: 'Travel', emoji: '📷' },
  { name: 'Adventure', category: 'Travel', emoji: '🧗' },
  { name: 'International Travel', category: 'Travel', emoji: '✈️' },

  // 🏏 Sports
  { name: 'Cricket', category: 'Sports', emoji: '🏏' },
  { name: 'Football', category: 'Sports', emoji: '⚽' },
  { name: 'Basketball', category: 'Sports', emoji: '🏀' },
  { name: 'Badminton', category: 'Sports', emoji: '🏸' },
  { name: 'Tennis', category: 'Sports', emoji: '🎾' },
  { name: 'Gym & Lifting', category: 'Sports', emoji: '🏋️' },
  { name: 'Running', category: 'Sports', emoji: '🏃' },
  { name: 'Cycling', category: 'Sports', emoji: '🚴' },
  { name: 'Swimming', category: 'Sports', emoji: '🏊' },
  { name: 'Yoga', category: 'Sports', emoji: '🧘' },

  // 💻 Technology
  { name: 'Coding', category: 'Technology', emoji: '💻' },
  { name: 'Web Development', category: 'Technology', emoji: '🌐' },
  { name: 'AI & Generative AI', category: 'Technology', emoji: '🤖' },
  { name: 'Machine Learning', category: 'Technology', emoji: '🧠' },
  { name: 'Data Science', category: 'Technology', emoji: '📊' },
  { name: 'Cybersecurity', category: 'Technology', emoji: '🛡️' },
  { name: 'Cloud & DevOps', category: 'Technology', emoji: '☁️' },
  { name: 'Startups & Tech', category: 'Technology', emoji: '🚀' },
  { name: 'Robotics', category: 'Technology', emoji: '🦾' },
  { name: 'Mobile Apps', category: 'Technology', emoji: '📱' },

  // 🎵 Music
  { name: 'Bollywood Hits', category: 'Music', emoji: '🎶' },
  { name: 'Hip Hop', category: 'Music', emoji: '🎤' },
  { name: 'Pop', category: 'Music', emoji: '🎵' },
  { name: 'Rock', category: 'Music', emoji: '🎸' },
  { name: 'EDM', category: 'Music', emoji: '🎧' },
  { name: 'Classical Music', category: 'Music', emoji: '🎻' },
  { name: 'Indie & Lo-Fi', category: 'Music', emoji: '☕' },
  { name: 'K-Pop', category: 'Music', emoji: '✨' },
  { name: 'Rap', category: 'Music', emoji: '🎙️' },
  { name: 'Guitar', category: 'Music', emoji: '🎸' },
  { name: 'Piano', category: 'Music', emoji: '🎹' },
  { name: 'Singing', category: 'Music', emoji: '🎤' },

  // 🎨 Arts & Creativity
  { name: 'UI / UX Design', category: 'Arts & Creativity', emoji: '🎨' },
  { name: 'Graphic Design', category: 'Arts & Creativity', emoji: '🖌️' },
  { name: 'Sketching', category: 'Arts & Creativity', emoji: '✏️' },
  { name: 'Digital Art', category: 'Arts & Creativity', emoji: '💻' },
  { name: 'Painting', category: 'Arts & Creativity', emoji: '🖼️' },
  { name: 'Animation', category: 'Arts & Creativity', emoji: '🎞️' },
  { name: 'Fashion Design', category: 'Arts & Creativity', emoji: '👗' },

  // 📚 Education
  { name: 'Study Circles', category: 'Education', emoji: '📖' },
  { name: 'Hackathons', category: 'Education', emoji: '⚡' },
  { name: 'Competitive Exams', category: 'Education', emoji: '📝' },
  { name: 'Research Papers', category: 'Education', emoji: '🔬' },
  { name: 'Peer Mentoring', category: 'Education', emoji: '🤝' },

  // 🧠 Wellness
  { name: 'Mindfulness', category: 'Wellness', emoji: '🌿' },
  { name: 'Mental Health', category: 'Wellness', emoji: '🧘' },
  { name: 'Journaling', category: 'Wellness', emoji: '📓' },
  { name: 'Self Care', category: 'Wellness', emoji: '✨' },

  // 🌱 Lifestyle
  { name: 'Late Night Chats', category: 'Lifestyle', emoji: '🌙' },
  { name: 'Campus Cafeteria', category: 'Lifestyle', emoji: '🥪' },
  { name: 'Sunset Chasing', category: 'Lifestyle', emoji: '🌅' },
  { name: 'Thrifting', category: 'Lifestyle', emoji: '🛍️' },

  // 🎉 Going Out
  { name: 'Concerts & Gigs', category: 'Going Out', emoji: '🎟️' },
  { name: 'Campus Fests', category: 'Going Out', emoji: '🎪' },
  { name: 'Stand-up Comedy', category: 'Going Out', emoji: '🎙️' },
  { name: 'Parties', category: 'Going Out', emoji: '🎉' },

  // 📷 Photography
  { name: 'Portrait Photography', category: 'Photography', emoji: '📸' },
  { name: 'Street Photography', category: 'Photography', emoji: '🏙️' },
  { name: 'Landscape Shots', category: 'Photography', emoji: '🌄' },
  { name: 'Video Editing', category: 'Photography', emoji: '🎬' },

  // 🚀 Entrepreneurship
  { name: 'Pitch Decks', category: 'Entrepreneurship', emoji: '💼' },
  { name: 'Side Hustles', category: 'Entrepreneurship', emoji: '💡' },
  { name: 'Angel Investing', category: 'Entrepreneurship', emoji: '📈' },

  // 📖 Books
  { name: 'Fiction Novels', category: 'Books', emoji: '📕' },
  { name: 'Sci-Fi & Fantasy', category: 'Books', emoji: '🚀' },
  { name: 'Philosophy', category: 'Books', emoji: '🏛️' },
  { name: 'Poetry', category: 'Books', emoji: '✍️' },

  // 💰 Finance
  { name: 'Stock Market', category: 'Finance', emoji: '📊' },
  { name: 'Crypto & Web3', category: 'Finance', emoji: '🪙' },
  { name: 'Personal Investing', category: 'Finance', emoji: '💰' },

  // 🐾 Pets
  { name: 'Dogs', category: 'Pets', emoji: '🐕' },
  { name: 'Cats', category: 'Pets', emoji: '🐈' },
  { name: 'Animal Welfare', category: 'Pets', emoji: '🐾' },

  // 🌿 Nature
  { name: 'Gardening & Plants', category: 'Nature', emoji: '🌱' },
  { name: 'Wildlife & Safaris', category: 'Nature', emoji: '🦁' },
  { name: 'Eco-Living', category: 'Nature', emoji: '♻️' },
];

// ============================================================================
// @desc    Get all categorized interests with search / filter
// @route   GET /api/interests
// @access  Public / Private
// ============================================================================
const getInterests = async (req, res, next) => {
  try {
    const { category, search } = req.query;

    // Fetch custom stored interests from DB as well
    const dbInterests = await Interest.find().lean();

    // Merge preset catalog with DB interests, eliminating duplicates
    const interestMap = new Map();

    PRESET_INTEREST_CATALOG.forEach((item) => {
      interestMap.set(item.name.toLowerCase(), item);
    });

    dbInterests.forEach((item) => {
      if (!interestMap.has(item.name.toLowerCase())) {
        interestMap.set(item.name.toLowerCase(), {
          name: item.name,
          category: item.category || 'Other',
          emoji: item.emoji || '✨',
        });
      }
    });

    let results = Array.from(interestMap.values());

    if (category && category !== 'All') {
      results = results.filter(
        (i) => i.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      results = results.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q)
      );
    }

    // Unique category list
    const categories = [
      'All',
      ...new Set(Array.from(interestMap.values()).map((i) => i.category)),
    ];

    return res.status(200).json({
      success: true,
      count: results.length,
      categories,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Add a custom interest chip
// @route   POST /api/interests/custom
// @access  Private
// ============================================================================
const addCustomInterest = async (req, res, next) => {
  try {
    const { name, category, emoji } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Interest name is required',
      });
    }

    const cleanName = name.trim();

    // Check if already in DB
    let interest = await Interest.findOne({
      name: { $regex: new RegExp(`^${cleanName}$`, 'i') },
    });

    if (!interest) {
      interest = await Interest.create({
        name: cleanName,
        category: category || 'Other',
        emoji: emoji || '✨',
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Custom interest ready',
      data: {
        name: interest.name,
        category: interest.category,
        emoji: interest.emoji,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInterests,
  addCustomInterest,
  PRESET_INTEREST_CATALOG,
};
