const express = require('express');
const router = express.Router();
const {
  getConversationVibe,
  getProfileVibe,
  sendGamePrompt,
} = require('../controllers/vibeController');
const { protect } = require('../middleware/authMiddleware');

router.get('/conversation/:conversationId', protect, getConversationVibe);
router.get('/profile/:targetUserId', protect, getProfileVibe);
router.post('/conversation/:conversationId/game-prompt', protect, sendGamePrompt);

module.exports = router;
