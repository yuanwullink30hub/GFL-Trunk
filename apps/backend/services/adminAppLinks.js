/**
 * Install links for the management phone app (owner, 23 Oct 2026).
 *
 * An admin makes a link in the phone app's settings: gardenforlife.nl/<30 random characters>. It works once,
 * on a phone. Opening it shows an install page (functions/_middleware.js); its button posts the token here,
 * which spends it and hands the phone a signed device grant as a cookie. The phone app lives at /beheer/ and
 * the Pages function only serves it to a phone holding a valid grant — everyone else gets the normal site.
 * The admin login is still required inside the app; the grant only lets the page itself load.
 *
 * Only a SHA-256 of each token is stored. The grant is an ECDSA P-256 signature made with ADMIN_APP_GATE_KEY
 * (base64 PKCS#8, Render env); the matching public key sits in functions/_middleware.js.
 */
const crypto = require('crypto');
const { collections } = require('../db');

const TOKEN_LENGTH = 30;
// 64 URL-safe characters, so a random byte & 63 picks one uniformly. No '&' or '%': they break a link.
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const TOKEN_RE = /^[A-Za-z0-9_-]{30}$/;
const SITE = 'https://gardenforlife.nl';
const COOKIE = 'gfl_beheer';
const COOKIE_MAX_AGE = 5 * 365 * 24 * 3600; // the installed app keeps working; a new key revokes every grant

function generateToken() {
  const bytes = crypto.randomBytes(TOKEN_LENGTH);
  let out = '';
  for (let i = 0; i < TOKEN_LENGTH; i++) out += ALPHABET[bytes[i] & 63];
  return out;
}

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const b64url = (buf) => Buffer.from(buf).toString('base64url');

let signingKey = null;
function gateKey() {
  if (signingKey) return signingKey;
  const raw = process.env.ADMIN_APP_GATE_KEY;
  if (!raw) return null;
  signingKey = crypto.createPrivateKey({ key: Buffer.from(raw, 'base64'), format: 'der', type: 'pkcs8' });
  return signingKey;
}

/** A signed device grant: v1.<payload>.<signature>, verified at the edge with the public key. */
function signGrant(deviceId, now = new Date()) {
  const key = gateKey();
  if (!key) return null;
  const payload = b64url(JSON.stringify({ d: deviceId, iat: Math.floor(now.getTime() / 1000) }));
  const signature = crypto.sign('sha256', Buffer.from(`v1.${payload}`), { key, dsaEncoding: 'ieee-p1363' });
  return `v1.${payload}.${b64url(signature)}`;
}

/** A new one-time link, with an optional name (who it is for). The plain token is in the return value only. */
async function createLink(createdBy, label = '', now = new Date()) {
  label = String(label || '').trim().slice(0, 60);
  for (let attempt = 0; attempt < 3; attempt++) {
    const token = generateToken();
    try {
      const r = await collections.adminAppLinks().insertOne({
        tokenHash: hashToken(token), hint: token.slice(-4), label, createdBy, createdAt: now, usedAt: null, revokedAt: null,
      });
      return { _id: r.insertedId, url: `${SITE}/${token}`, hint: token.slice(-4), label, createdAt: now };
    } catch (e) {
      if (e.code !== 11000 || attempt === 2) throw e;
    }
  }
  return null;
}

/** The latest links, newest first, without tokens: open, used or revoked. */
async function listLinks(limit = 20) {
  const docs = await collections.adminAppLinks().find({}, { projection: { tokenHash: 0 } })
    .sort({ createdAt: -1 }).limit(limit).toArray();
  return docs.map((d) => ({
    _id: d._id, hint: d.hint, label: d.label || '', createdAt: d.createdAt, usedAt: d.usedAt, revokedAt: d.revokedAt,
    status: d.revokedAt ? 'revoked' : d.usedAt ? 'used' : 'open',
  }));
}

async function revokeLink(id, now = new Date()) {
  const r = await collections.adminAppLinks().updateOne({ _id: id, usedAt: null, revokedAt: null }, { $set: { revokedAt: now } });
  return r.modifiedCount === 1;
}

/** Spend a token: the device grant on success, null if the token is unknown, used or revoked. */
async function redeem(token, now = new Date()) {
  if (!TOKEN_RE.test(String(token || ''))) return null;
  if (!gateKey()) throw new Error('ADMIN_APP_GATE_KEY is not set');
  const deviceId = b64url(crypto.randomBytes(12));
  const doc = await collections.adminAppLinks().findOneAndUpdate(
    { tokenHash: hashToken(token), usedAt: null, revokedAt: null },
    { $set: { usedAt: now, deviceId } },
  );
  const found = doc && (doc.value !== undefined ? doc.value : doc);
  if (!found) return null;
  return signGrant(deviceId, now);
}

function grantCookie(grant, { secure = true } = {}) {
  return [
    `${COOKIE}=${grant}`, 'Path=/beheer', `Max-Age=${COOKIE_MAX_AGE}`, 'HttpOnly', 'SameSite=Lax',
    ...(secure ? ['Secure', 'Domain=gardenforlife.nl'] : []),
  ].join('; ');
}

module.exports = { TOKEN_LENGTH, TOKEN_RE, SITE, COOKIE, generateToken, hashToken, signGrant, createLink, listLinks, revokeLink, redeem, grantCookie };
