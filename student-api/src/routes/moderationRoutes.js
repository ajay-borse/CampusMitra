const express = require('express');
const router = express.Router();
const { blockUser, reportUser } = require('../controllers/moderationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/blocks', protect, blockUser);
router.post('/reports', protect, reportUser);

module.exports = router;
