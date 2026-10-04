const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const {
  getSuggestions,
  getStudents,
  getStudentByRollNo,
  getStudentInsights,
  getFilterOptions,
  exportStudents,
} = require('../controllers/studentController');
const { getAnalyticsOverview } = require('../controllers/analyticsController');

// All student routes require valid Admin JWT authentication
router.use(requireAdmin);

// Global autocomplete suggestions (must precede :rollNo)
router.get('/suggest', getSuggestions);

// Distinct filter values for UI dropdowns (must precede :rollNo)
router.get('/filters', getFilterOptions);

// Export filtered students to CSV (must precede :rollNo)
router.get('/export', exportStudents);

// Backward-compatible alias for overview stats (must precede :rollNo)
router.get('/stats/overview', getAnalyticsOverview);

// Cohort insights for a specific student (must precede :rollNo alone)
router.get('/:rollNo/insights', getStudentInsights);

// List students with pagination, filters and sorting
router.get('/', getStudents);

// Single student details including raw document
router.get('/:rollNo', getStudentByRollNo);

module.exports = router;
