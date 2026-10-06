const express = require('express');
const router = express.Router();
const {
  getMyProfile,
  updateProfile,
  uploadPhoto,
  deletePhoto,
  reorderPhotos,
} = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/me', protect, getMyProfile);
router.put('/me', protect, updateProfile);
router.post('/me/photos', protect, upload.single('photo'), uploadPhoto);
router.delete('/me/photos', protect, deletePhoto);
router.put('/me/photos/reorder', protect, reorderPhotos);

module.exports = router;
