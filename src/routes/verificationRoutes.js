const express = require('express');
const router = express.Router();
const {
  submitStudentId,
  getVerificationStatus,
} = require('../controllers/verificationController');
const { protect } = require('../middleware/authMiddleware');
const uploadStudentId = require('../middleware/verificationUploadMiddleware');

router.post('/student-id', protect, uploadStudentId.single('idCard'), submitStudentId);
router.get('/status', protect, getVerificationStatus);

module.exports = router;
