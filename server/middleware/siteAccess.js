const jwt = require('jsonwebtoken');

/**
 * Middleware: Enforce site-wide PIN access token check
 * Reads token from httpOnly cookie or x-site-access-token header.
 * Rejects unauthorized requests before any data or admin logic executes.
 */
const requireSiteAccess = (req, res, next) => {
  const cookieToken = req.cookies && req.cookies.site_access_token;
  const headerToken = req.headers['x-site-access-token'] || req.headers['x-site-access'];
  const token = cookieToken || headerToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      code: 'SITE_ACCESS_REQUIRED',
      message: 'Access denied. Site-wide PIN verification required.',
    });
  }

  const secret =
    process.env.SITE_ACCESS_TOKEN_SECRET ||
    process.env.JWT_SECRET ||
    'fallback_site_access_token_secret_2026';

  try {
    const decoded = jwt.verify(token, secret);
    if (!decoded || !decoded.siteAccess) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_SITE_ACCESS_TOKEN',
        message: 'Invalid site access credentials.',
      });
    }

    req.siteAccess = decoded;
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        code: 'SITE_ACCESS_EXPIRED',
        message: 'Site access session expired. Please re-enter PIN.',
      });
    }
    return res.status(401).json({
      success: false,
      code: 'INVALID_SITE_ACCESS_TOKEN',
      message: 'Invalid or corrupted site access token.',
    });
  }
};

module.exports = { requireSiteAccess };
