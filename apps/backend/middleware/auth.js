/**
 * Garden For Life — session verification.
 *
 * Every check of a session token goes through verifySession(). A valid signature is not enough on its
 * own any more; the account behind it is consulted too:
 *
 *   role      comes from the DATABASE, not the token. A token claiming role:admin used to be honoured, so
 *             the admin boundary rested on JWT_SECRET alone; now a forged or stale claim grants nothing,
 *             and demoting an admin takes effect at once rather than when their token expires.
 *   revoked   users.tokensValidAfter: a token issued before it is refused. It is bumped on a password
 *             change, an email change and "log out everywhere". Tokens carry iatMs (issue time in ms,
 *             see signToken in routes/auth.js) because the standard iat is whole seconds: a token minted
 *             in the same second as the bump could not be told apart from one minted just before it.
 *             Tokens from before this change have no iatMs and fall back to iat — any later bump
 *             still retires them.
 *   gone      a token for a deleted account is refused.
 *   kind      only session tokens count. The same secret also signs OAuth `state` values
 *             (routes/social.js), which carry a `purpose` and no `sub`; those are refused here instead of
 *             being accepted as an "authenticated" request with no user behind it.
 *
 * The account lookup is cached per user for CACHE_MS so an authenticated request does not always cost a
 * query. forgetAccount() drops the entry the moment this process changes a role, bumps tokensValidAfter
 * or deletes an account, so those take effect immediately; the cache only bounds how stale a change made
 * elsewhere can be. A database error is never cached and refuses the request: without the account the
 * token cannot be checked for revocation.
 */
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const config = require('../config');

const CACHE_MS = 15 * 1000;
const cache = new Map(); // userId -> { at, account: { role, tokensValidAfter } | null }

async function loadAccount(userId) {
  const hit = cache.get(userId);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.account;
  if (!ObjectId.isValid(userId)) return null;
  const { collections } = require('../db');
  const doc = await collections.users().findOne(
    { _id: new ObjectId(userId) },
    { projection: { role: 1, tokensValidAfter: 1 } },
  ); // throws on a database error: not cached, the caller refuses
  const account = doc
    ? { role: doc.role || 'client', tokensValidAfter: doc.tokensValidAfter ? new Date(doc.tokensValidAfter).getTime() : 0 }
    : null;
  cache.set(userId, { at: Date.now(), account });
  return account;
}

/** Drop the cached account, so a change this process just made applies to the very next request. */
function forgetAccount(userId) {
  cache.delete(String(userId));
}

/**
 * Verify a session bearer token end to end.
 * @returns {Promise<{ userId: string, email: string, role: string } | null>}
 */
async function verifySession(token) {
  let payload;
  try {
    payload = jwt.verify(String(token || ''), config.jwtSecret, { algorithms: ['HS256'] });
  } catch {
    return null;
  }
  if (!payload || payload.purpose || typeof payload.sub !== 'string') return null;
  let account;
  try {
    account = await loadAccount(payload.sub);
  } catch (e) {
    console.error('[Auth] Account lookup failed — refusing the request:', e.message);
    return null;
  }
  if (!account) return null;
  const issuedMs = typeof payload.iatMs === 'number' ? payload.iatMs : (payload.iat || 0) * 1000;
  if (issuedMs < account.tokensValidAfter) return null;
  return { userId: payload.sub, email: payload.email, role: account.role };
}

const bearer = (req) => {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
};

/** Requires a valid session; attaches req.user = { userId, email, role }. */
async function authRequired(req, res, next) {
  const token = bearer(req);
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  const user = await verifySession(token);
  if (!user) return res.status(401).json({ error: 'Invalid or expired token' });
  req.user = user;
  return next();
}

/** Admin-only. Use AFTER authRequired; the role it reads is the database's (see verifySession). */
function adminRequired(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  return next();
}

/**
 * Optional authentication: a valid session attaches req.user; anything else — no token, a bad one, a
 * revoked one — continues as anonymous (req.user left unset).
 */
async function authOptional(req, res, next) {
  const token = bearer(req);
  if (token) {
    const user = await verifySession(token);
    if (user) req.user = user;
  }
  return next();
}

module.exports = { authRequired, adminRequired, authOptional, verifySession, forgetAccount };
