const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const PinAttempt = require('../models/PinAttempt');
const { sendPinAlert } = require('../services/mailer');

// Zod schema: strictly 8 digits
const pinSchema = z.object({
  pin: z
    .string({ required_error: 'PIN is required' })
    .regex(/^\d{8}$/, 'PIN must be exactly 8 numeric digits'),
});

const LOCKOUT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes lockout
const ATTEMPT_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes window for failed attempts

/**
 * Extract client IP address respecting X-Forwarded-For
 */
const getClientIp = (req) => {
  if (process.env.NODE_ENV !== 'production' && req.headers['x-test-ip']) {
    return req.headers['x-test-ip'].trim();
  }
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || '127.0.0.1';
};

/**
 * @desc    Verify 8-digit Site PIN and grant site access token
 * @route   POST /api/site/verify-pin
 * @access  Public (Rate limited & 3-attempt locked)
 */
const verifyPin = async (req, res) => {
  try {
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'Unknown';

    // 1. Zod validation: strictly 8 digits before touching DB or bcrypt
    const parseResult = pinSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid PIN format. PIN must be exactly 8 numeric digits.',
        errors: parseResult.error.errors,
      });
    }

    const { pin } = parseResult.data;
    const now = Date.now();

    // 2. Check existing attempt record for this IP
    let attemptRecord = await PinAttempt.findOne({ ip });

    // Check if currently locked
    if (attemptRecord && attemptRecord.lockedUntil) {
      const lockedUntilMs = new Date(attemptRecord.lockedUntil).getTime();
      if (lockedUntilMs > now) {
        const retryAfterSeconds = Math.max(1, Math.ceil((lockedUntilMs - now) / 1000));
        res.setHeader('Retry-After', retryAfterSeconds);
        return res.status(423).json({
          success: false,
          locked: true,
          retryAfterSeconds,
          message: `Too many wrong PIN attempts. Access locked. Try again in ${retryAfterSeconds} seconds.`,
        });
      }

      // Lockout period has elapsed: reset attempts
      attemptRecord.attempts = 0;
      attemptRecord.lockedUntil = null;
      attemptRecord.firstAttemptAt = new Date();
    }

    // Check if the previous attempt window expired naturally without hitting 3
    if (
      attemptRecord &&
      attemptRecord.firstAttemptAt &&
      now - new Date(attemptRecord.firstAttemptAt).getTime() > ATTEMPT_EXPIRY_MS
    ) {
      attemptRecord.attempts = 0;
      attemptRecord.firstAttemptAt = new Date();
    }

    // 3. Timing-safe bcrypt comparison
    const sitePinHash = process.env.SITE_PIN_HASH;
    if (!sitePinHash) {
      console.error('❌ SITE_PIN_HASH is not configured in server environment.');
      return res.status(500).json({
        success: false,
        message: 'Site security configuration error. Please contact system administrator.',
      });
    }

    const isMatch = await bcrypt.compare(pin, sitePinHash);

    // 4. Correct PIN Flow
    if (isMatch) {
      if (attemptRecord) {
        await PinAttempt.deleteOne({ ip });
      }

      // Issue signed site access token (24 hours)
      const secret =
        process.env.SITE_ACCESS_TOKEN_SECRET ||
        process.env.JWT_SECRET ||
        'fallback_site_access_token_secret_2026';

      const siteAccessToken = jwt.sign(
        {
          siteAccess: true,
          grantedAt: Date.now(),
        },
        secret,
        {
          expiresIn: '24h',
        }
      );

      // Set secure httpOnly cookie
      res.cookie('site_access_token', siteAccessToken, {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/',
      });

      return res.status(200).json({
        success: true,
        message: 'Site PIN verified successfully.',
        siteAccessToken,
      });
    }

    // 5. Wrong PIN Flow
    if (!attemptRecord) {
      attemptRecord = new PinAttempt({
        ip,
        attempts: 1,
        firstAttemptAt: new Date(),
        lockedUntil: null,
      });
    } else {
      attemptRecord.attempts += 1;
    }

    const isLockoutTrigger = attemptRecord.attempts >= 3;

    if (isLockoutTrigger) {
      attemptRecord.lockedUntil = new Date(now + LOCKOUT_WINDOW_MS);
      await attemptRecord.save();

      // 6. Fire alert asynchronously without blocking HTTP response
      sendPinAlert({
        ip,
        attemptsSoFar: attemptRecord.attempts,
        locked: true,
        userAgent,
      }).catch((err) => console.error('Background alert error:', err));

      const retryAfterSeconds = Math.ceil(LOCKOUT_WINDOW_MS / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(423).json({
        success: false,
        locked: true,
        retryAfterSeconds,
        message: 'Access locked for 5 minutes after 3 failed attempts.',
      });
    }

    // Under 3 attempts
    await attemptRecord.save();

    // Fire alert asynchronously
    sendPinAlert({
      ip,
      attemptsSoFar: attemptRecord.attempts,
      locked: false,
      userAgent,
    }).catch((err) => console.error('Background alert error:', err));

    const attemptsRemaining = 3 - attemptRecord.attempts;

    return res.status(401).json({
      success: false,
      locked: false,
      message: 'Incorrect PIN.',
      attemptsRemaining,
    });
  } catch (error) {
    console.error('PIN verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while verifying PIN.',
    });
  }
};

/**
 * @desc    Check if current request has valid site access
 * @route   GET /api/site/check
 * @access  Private (Requires site access token)
 */
const checkSiteAccess = async (req, res) => {
  return res.status(200).json({
    success: true,
    siteAccess: true,
    message: 'Site access verified.',
  });
};

module.exports = {
  verifyPin,
  checkSiteAccess,
  getClientIp,
};
