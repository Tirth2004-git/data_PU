const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { verifyPin, checkSiteAccess } = require('../controllers/siteController');
const { requireSiteAccess } = require('../middleware/siteAccess');

// Rate limiter for PIN verification: 10 requests per 5 minutes per IP
const pinVerifyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many PIN verification requests. Please try again after 5 minutes.',
  },
});

// Public endpoint to verify site PIN and obtain site-access token
router.post('/verify-pin', pinVerifyLimiter, verifyPin);

// Protected endpoint to check existing site access token validity
router.get('/check', requireSiteAccess, checkSiteAccess);

module.exports = router;
