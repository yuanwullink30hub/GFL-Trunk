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
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = { userId: payload.sub, email: payload.email, role: payload.role || 'client' };
    next();
  } catch (err) {
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

module.exports = { authRequired, adminRequired };
