/**
 * devActivity — the activity log: consent records, dev events from git hooks, and admin access events.
 *
 * devActivity holds two different things with two different lifetimes: operational audit
 * entries, which expire after 90 days, and consent records, which are the Art. 7(1) proof
 * that processing was lawful and must last as long as the account they belong to.
 *
 * A blanket TTL on `timestamp` deleted both. The index keys on `expiresAt` with
 * expireAfterSeconds 0, so a document expires at the moment named in that field.
 * Index management lives in db/index.js.
 *
 * Consent records cannot be exempt from expiry ALTOGETHER: the public endpoint (routes/activity.js)
 * is deliberately unauthenticated (git hooks and the pre-account consent screen both post to it),
 * so "never expires" would turn it into unbounded permanent storage anyone can write to. Seven years
 * bounds that while comfortably outlasting any account — and the published retention page says so.
 */
const { getDB } = require('../db');

const RETENTION_DAYS = 90;
const CONSENT_RETENTION_YEARS = 7;

function activityCollection() {
  return getDB().collection('devActivity');
}

function activityExpiry(type) {
  const days = type === 'consent_given' ? CONSENT_RETENTION_YEARS * 365 : RETENTION_DAYS;
  return new Date(Date.now() + days * 86400 * 1000);
}

/**
 * Truncate to a string of at most `max` characters.
 *
 * `(value || '').slice(max)` looks like it does this and does not: when the caller sends
 * a JSON array, Array.prototype.slice returns ELEMENTS, so a single anonymous request
 * could store megabytes in a field nominally capped at 512 characters. Coercing first is
 * the whole fix.
 */
function cap(value, max) {
  if (value === undefined || value === null) return '';
  return String(value).slice(0, max);
}

/** One devActivity document from untrusted input. Every field is coerced before truncation — see cap(). */
function activityDoc(type, body, req) {
  const { message, branch, hash, userId, email, reportId, reportType, consentType, level } = body || {};
  return {
    type,
    timestamp: new Date(),
    expiresAt: activityExpiry(type),
    // dev fields
    message: cap(message, 512),
    branch: cap(branch, 256),
    hash: cap(hash, 64),
    // admin fields
    userId: userId == null ? null : cap(userId, 64),
    email: cap(email, 256),
    reportId: reportId == null ? null : cap(reportId, 64),
    reportType: cap(reportType, 64),
    // consent fields
    ...(type === 'consent_given' && {
      consentType: cap(consentType || 'art9_assessment', 64),
      level: cap(level, 32),
      userAgent: cap(req.get('user-agent'), 512),
    }),
  };
}

module.exports = { RETENTION_DAYS, CONSENT_RETENTION_YEARS, activityCollection, activityExpiry, cap, activityDoc };
