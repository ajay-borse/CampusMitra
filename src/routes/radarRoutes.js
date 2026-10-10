const express = require('express');
const router = express.Router();
const {
  getMyAvailability,
  updateAvailability,
  disableAvailability,
  getRadarFeed,
} = require('../controllers/radarController');
const { protect } = require('../middleware/authMiddleware');

// All Campus Radar routes are protected
router.use(protect);

router.get('/feed', getRadarFeed);
router.get('/availability/me', getMyAvailability);
router.put('/availability/me', updateAvailability);
router.post('/availability/disable', disableAvailability);

module.exports = router;
