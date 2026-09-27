/**
 * Rate limits.
 *
 * ── WHO the client is: the part an attacker must not be able to choose ──
 *
 * The API is reached as Cloudflare → Render → this process (the live response carries one CF-RAY and
 * `x-render-origin-server: Render`). The socket peer is therefore always Render's load balancer: `req.ip`
 * says nothing about the visitor, and "trust CF-Connecting-IP only from a Cloudflare IP" cannot be
 * checked here, because the peer is never Cloudflare. Express `trust proxy` would not help either — the
 * X-Forwarded-For entry Render appends is the address that reached Render, i.e. a Cloudflare edge.
 *
 * Cloudflare puts the real client in CF-Connecting-IP. A header is only as trustworthy as the hop that
 * set it, so EDGE_SECRET lets the edge vouch for it:
 *
 *   EDGE_SECRET set    A Cloudflare Transform Rule on api.gardenforlife.nl adds `X-GFL-Edge: <secret>`
 *                      to every request. CF-Connecting-IP is trusted ONLY when that header matches
 *                      (timing-safe). Anything that reached the origin some other way — the onrender.com
 *                      hostname, a direct connection — lands in one shared, deliberately tight bucket,
 *                      so rotating a forged CF-Connecting-IP buys exactly nothing.
 *   EDGE_SECRET unset  CF-Connecting-IP is trusted as before, and production says so at boot. This is
 *                      the transitional state: deploying the code first never locks real visitors into
 *                      one bucket before the edge rule exists.
 *
 * ── Where counts live ──
 *
 * Per-visitor counts stay in memory, keyed by an HMAC of the address under a salt that changes on every
 * restart — never logged, never stored. Persisting them would survive restarts, but it would also mean
 * storing a (pseudonymised) IP address, which the privacy policy does not list among what we keep and
 * explicitly says we do not record. So only the GLOBAL ceilings are persisted (`persistent: true`): a
 * bare counter per window, no personal data at all, in `rateLimits` with a TTL. Those are the ones that
 * matter across a restart anyway — they cap cost (model calls, outgoing mail) for everyone combined.
 */
const crypto = require('crypto');

const SALT = crypto.randomBytes(16);
const EDGE_HEADER = 'x-gfl-edge';
/** The bucket every unvouched request shares when EDGE_SECRET is set. */
const UNTRUSTED = 'untrusted-origin';

let warned = false;

/** Timing-safe equality for the edge secret. */
function sameSecret(given, expected) {
  const a = Buffer.from(String(given || ''));
  const b = Buffer.from(String(expected || ''));
  return a.length === b.length && a.length > 0 && crypto.timingSafeEqual(a, b);
}

/**
 * The client's network identity, as far as it can be trusted. Returns the raw address, or UNTRUSTED.
 * Read at call time, not at require time, so tests (and a secret added later) take effect.
 */
function clientAddress(req) {
  const secret = process.env.EDGE_SECRET || '';
  const cf = req.get('cf-connecting-ip');
  if (secret) return sameSecret(req.get(EDGE_HEADER), secret) && cf ? cf : UNTRUSTED;
  if (!warned && process.env.NODE_ENV === 'production') {
    warned = true;
    console.warn('[RateLimit] EDGE_SECRET not set — CF-Connecting-IP is trusted unverified; see middleware/rateLimit.js');
  }
  return cf || req.ip || 'unknown';
}

/** A stable, anonymous key for the visitor behind this request (in-memory use only). */
function visitorKey(req) {
  return crypto.createHmac('sha256', SALT).update(clientAddress(req)).digest('base64url').slice(0, 22);
}

/**
 * In-memory fixed-window counter: `max` hits per `windowMs` per key. { hit(key) → true when allowed }.
 * Expired entries are swept once per window.
 */
function createCounter({ max, windowMs }) {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [key, e] of hits) if (now > e.resetAt) hits.delete(key);
  }, windowMs).unref();
  return {
    async hit(key) {
      const now = Date.now();
      const e = hits.get(key);
      if (!e || now > e.resetAt) { hits.set(key, { count: 1, resetAt: now + windowMs }); return true; }
      if (e.count >= max) return false;
      e.count += 1;
      return true;
    },
  };
}

/**
 * Persistent fixed-window counter in Mongo (`rateLimits`, TTL on expiresAt). For GLOBAL ceilings only —
 * the key is a limit name, never anything about a visitor. One atomic upsert per hit.
 *
 * Fails OPEN on a database error: a limiter that takes the site down whenever Mongo hiccups is worse than
 * one that briefly does not count. The per-visitor limit in front of it still applies.
 */
function createPersistentCounter({ name, max, windowMs }) {
  const memory = createCounter({ max, windowMs }); // used while the DB is unavailable
  return {
    async hit(key = 'all') {
      let coll;
      try { coll = require('../db').getDB().collection('rateLimits'); } catch { return memory.hit(key); }
      const window = Math.floor(Date.now() / windowMs);
      const _id = `${name}:${key}:${window}`;
      const update = { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((window + 1) * windowMs) } };
      try {
        let doc;
        try {
          doc = await coll.findOneAndUpdate({ _id }, update, { upsert: true, returnDocument: 'after' });
        } catch (e) {
          // Two first-hits in the same window race on the upsert; the loser retries into the winner's doc.
          if (e.code !== 11000) throw e;
          doc = await coll.findOneAndUpdate({ _id }, update, { returnDocument: 'after' });
        }
        const count = (doc && (doc.value || doc).count) || 1;
        return count <= max;
      } catch (e) {
        console.warn(`[RateLimit] ${name}: counter unavailable, allowing (${e.message})`);
        return true;
      }
    },
  };
}

function tooMany(res, windowMs) {
  res.set('Retry-After', String(Math.ceil(windowMs / 1000)));
  return res.status(429).json({ error: 'rate_limited' });
}

/**
 * Express middleware: a per-visitor limit, optionally under a global ceiling.
 *
 * @param {object} o
 * @param {string} o.name            label for the global counter and log lines
 * @param {number} o.max             hits per visitor per window
 * @param {number} o.windowMs
 * @param {(req) => string} [o.key]  override the visitor key (e.g. a logged-in user id)
 * @param {{ max: number, persistent?: boolean }} [o.global]  ceiling over ALL visitors combined
 */
function rateLimit({ name = 'limit', max, windowMs, key, global } = {}) {
  const perVisitor = createCounter({ max, windowMs });
  const ceiling = global
    ? (global.persistent
      ? createPersistentCounter({ name, max: global.max, windowMs })
      : createCounter({ max: global.max, windowMs }))
    : null;

  return async (req, res, next) => {
    try {
      if (!(await perVisitor.hit(key ? key(req) : visitorKey(req)))) return tooMany(res, windowMs);
      if (ceiling && !(await ceiling.hit('all'))) {
        console.warn(`[RateLimit] ${name}: global ceiling (${global.max}) reached for this window`);
        return tooMany(res, windowMs);
      }
      return next();
    } catch (e) {
      return next(e);
    }
  };
}

/** Per logged-in account rather than per network address — for routes behind authRequired. */
const byUser = (req) => `user:${req.user && req.user.userId}`;

/**
 * Counts only FAILURES, per key, in memory: { blocked(key), fail(key), clear(key) }.
 * For credential checks, where limiting every attempt would slow a person down for succeeding, and where
 * the key is the thing being attacked (an account) rather than who is attacking it.
 */
function createFailureCounter({ max, windowMs }) {
  const fails = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [key, e] of fails) if (now > e.resetAt) fails.delete(key);
  }, windowMs).unref();
  return {
    blocked(key) {
      const e = fails.get(key);
      return !!e && Date.now() <= e.resetAt && e.count >= max;
    },
    fail(key) {
      const now = Date.now();
      const e = fails.get(key);
      if (!e || now > e.resetAt) fails.set(key, { count: 1, resetAt: now + windowMs });
      else e.count += 1;
    },
    clear(key) { fails.delete(key); },
  };
}

module.exports = {
  EDGE_HEADER, UNTRUSTED,
  clientAddress, visitorKey, createCounter, createPersistentCounter, createFailureCounter, rateLimit, byUser,
};
