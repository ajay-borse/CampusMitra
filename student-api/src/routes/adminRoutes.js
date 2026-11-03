const express = require('express');
const router = express.Router();
const {
  getMetrics,
  getUsers,
  updateUserStatus,
  getReports,
  resolveReport,
  getAuditLogs,
  getVerifications,
  reviewVerification,
  getVerificationDocument,
} = require('../controllers/adminController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');

// All admin routes strictly require authentication AND admin role
router.use(protect, requireAdmin);

router.get('/metrics', getMetrics);
router.get('/users', getUsers);
router.put('/users/:id/status', updateUserStatus);
router.get('/reports', getReports);
router.put('/reports/:id', resolveReport);
router.get('/audit-logs', getAuditLogs);
router.get('/verifications', getVerifications);
router.put('/verifications/:id', reviewVerification);
router.get('/verifications/:id/document', getVerificationDocument);

module.exports = router;
