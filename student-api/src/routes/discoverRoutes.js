const express = require('express');
const router = express.Router();
const { getDiscoverProfiles } = require('../controllers/discoverController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getDiscoverProfiles);

module.exports = router;
