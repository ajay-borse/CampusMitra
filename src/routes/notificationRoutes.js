const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAllRead,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getNotifications);
router.put('/read-all', protect, markAllRead);

module.exports = router;
