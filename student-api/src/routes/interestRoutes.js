const express = require('express');
const router = express.Router();
const { getInterests, addCustomInterest } = require('../controllers/interestController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getInterests);
router.post('/custom', protect, addCustomInterest);

module.exports = router;
