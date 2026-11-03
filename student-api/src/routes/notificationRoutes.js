const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markOneRead,
  markAllRead,
  deleteNotification,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getNotifications);
router.put('/read-all', protect, markAllRead);
router.put('/:id/read', protect, markOneRead);
router.delete('/:id', protect, deleteNotification);

module.exports = router;
