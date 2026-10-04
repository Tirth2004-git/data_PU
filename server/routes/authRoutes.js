const express = require('express');
const router = express.Router();
const { login, getMe } = require('../controllers/authController');
const { requireAdmin } = require('../middleware/auth');
const { loginRateLimiter } = require('../middleware/rateLimiter');

// Rate limited admin login
router.post('/login', loginRateLimiter, login);

// Protected profile check
router.get('/me', requireAdmin, getMe);

module.exports = router;
