const express = require('express');
const router = express.Router();
const {
  createPlan,
  getPlans,
  getPlanById,
  joinPlan,
  leavePlan,
  updatePlan,
  cancelPlan,
  removeParticipant,
} = require('../controllers/planController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createPlan);
router.get('/', protect, getPlans);
router.get('/:id', protect, getPlanById);
router.put('/:id', protect, updatePlan);
router.post('/:id/join', protect, joinPlan);
router.post('/:id/leave', protect, leavePlan);
router.post('/:id/cancel', protect, cancelPlan);
router.post('/:id/remove-participant', protect, removeParticipant);

module.exports = router;
