const express = require('express');
const router = express.Router();
const {
  getPulseFeed,
  createPulsePost,
  getPulsePostById,
  updatePulsePost,
  deletePulsePost,
  toggleLikePost,
  toggleBookmarkPost,
  votePoll,
  addComment,
  deleteComment,
} = require('../controllers/pulseController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getPulseFeed);
router.post('/', protect, createPulsePost);
router.get('/:id', protect, getPulsePostById);
router.put('/:id', protect, updatePulsePost);
router.delete('/:id', protect, deletePulsePost);
router.post('/:id/like', protect, toggleLikePost);
router.post('/:id/bookmark', protect, toggleBookmarkPost);
router.post('/:id/vote', protect, votePoll);
router.post('/:id/comments', protect, addComment);
router.delete('/:id/comments/:commentId', protect, deleteComment);

module.exports = router;
