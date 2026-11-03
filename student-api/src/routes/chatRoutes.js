const express = require('express');
const router = express.Router();
const {
  getConversations,
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getConversations);
router.get('/:id/messages', protect, getMessages);
router.post('/:id/messages', protect, sendMessage);
router.put('/:id/messages/:messageId', protect, editMessage);
router.delete('/:id/messages/:messageId', protect, deleteMessage);

module.exports = router;
