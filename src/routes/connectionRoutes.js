const express = require('express');
const router = express.Router();
const {
  sendInterest,
  sendPass,
  getConnections,
} = require('../controllers/connectionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/interest', protect, sendInterest);
router.post('/pass', protect, sendPass);
router.get('/', protect, getConnections);

module.exports = router;
