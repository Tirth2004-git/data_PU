const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const {
  getAnalyticsOverview,
  getDataQualityMetrics,
} = require('../controllers/analyticsController');

// All analytics routes require valid Admin JWT authentication
router.use(requireAdmin);

router.get('/overview', getAnalyticsOverview);
router.get('/data-quality', getDataQualityMetrics);

module.exports = router;
