/**
 * In-memory rate limits, per visitor.
 *
 * The API runs behind Render's edge (Cloudflare) with no `trust proxy`, so `req.ip` is the proxy's
 * address — every visitor shared ONE bucket. Cloudflare sets CF-Connecting-IP to the real client and
 * overwrites any value a client sends, so that header is the visitor. Keys are salted hashes kept in
 * memory only (never logged or stored); the salt changes on every restart.
 */
const crypto = require('crypto');

const SALT = crypto.randomBytes(16);

/** A stable, anonymous key for the visitor behind this request. */
function visitorKey(req) {
  const ip = req.get('cf-connecting-ip') || req.ip || 'unknown';
  return crypto.createHmac('sha256', SALT).update(ip).digest('base64url').slice(0, 22);
}

/**
 * Fixed-window counter: `max` hits per `windowMs` per key. Returns { hit(key) → true when allowed }.
 * Expired entries are swept once per window.
 */
function createCounter({ max, windowMs }) {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [key, e] of hits) if (now > e.resetAt) hits.delete(key);
  }, windowMs).unref();
  return {
    hit(key) {
      const now = Date.now();
      const e = hits.get(key);
      if (!e || now > e.resetAt) { hits.set(key, { count: 1, resetAt: now + windowMs }); return true; }
      if (e.count >= max) return false;
      e.count += 1;
      return true;
    },
  };
}

/** Express middleware: every request counts. 429 { error: 'rate_limited' } when over. */
function rateLimit({ max, windowMs }) {
  const counter = createCounter({ max, windowMs });
  return (req, res, next) => (counter.hit(visitorKey(req)) ? next() : res.status(429).json({ error: 'rate_limited' }));
}

module.exports = { visitorKey, createCounter, rateLimit };
