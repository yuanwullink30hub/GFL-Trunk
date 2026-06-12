/**
 * Garden For Life — JWT Auth Middleware
 *
 * Verifies the Bearer token and attaches req.user = { userId, email }.
 * Use on any route that requires authentication.
 */
const jwt = require('jsonwebtoken');
const config = require('../config');

function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    console.warn('[Auth] ❌ No Bearer token in Authorization header');
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = { userId: payload.sub, email: payload.email, role: payload.role || 'client' };
    console.log('[Auth] ✅ Token verified:', { userId: payload.sub, role: req.user.role });
    next();
  } catch (err) {
    console.error('[Auth] ❌ Token verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Admin-only middleware. Must be used AFTER authRequired.
 * Checks that req.user.role === 'admin'.
 */
function adminRequired(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

/**
 * Optional authentication middleware.
 * If a token is provided, verify it and attach req.user.
 * If no token is provided, continue without req.user (allows anonymous access).
 */
function authOptional(req, res, next) {
  const header = req.headers.authorization;
  
  // If no auth header, proceed as anonymous
  if (!header?.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = { userId: payload.sub, email: payload.email, role: payload.role || 'client' };
    console.log('[Auth] ✅ Token verified (optional):', { userId: payload.sub, role: req.user.role });
  } catch (err) {
    console.warn('[Auth] Token verification failed but continuing (optional):', err.message);
    // Don't reject, just continue without user
  }
  
  next();
}

module.exports = { authRequired, adminRequired, authOptional };
