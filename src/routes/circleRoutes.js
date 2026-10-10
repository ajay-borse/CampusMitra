const express = require('express');
const router = express.Router();
const {
  createCircle,
  getCircles,
  getCircleById,
  joinCircle,
  leaveCircle,
  updateCircle,
  archiveCircle,
  removeMember,
  getCirclePosts,
  createCirclePost,
  updateCirclePost,
  deleteCirclePost,
  toggleReaction,
  addComment,
  deleteComment,
} = require('../controllers/circleController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createCircle);
router.get('/', protect, getCircles);
router.get('/:id', protect, getCircleById);
router.put('/:id', protect, updateCircle);
router.post('/:id/join', protect, joinCircle);
router.post('/:id/leave', protect, leaveCircle);
router.post('/:id/archive', protect, archiveCircle);
router.post('/:id/remove-member', protect, removeMember);

// Community Feed Posts & Interactions
router.get('/:id/posts', protect, getCirclePosts);
router.post('/:id/posts', protect, createCirclePost);
router.put('/:id/posts/:postId', protect, updateCirclePost);
router.delete('/:id/posts/:postId', protect, deleteCirclePost);
router.post('/:id/posts/:postId/react', protect, toggleReaction);
router.post('/:id/posts/:postId/comments', protect, addComment);
router.delete('/:id/posts/:postId/comments/:commentId', protect, deleteComment);

module.exports = router;
