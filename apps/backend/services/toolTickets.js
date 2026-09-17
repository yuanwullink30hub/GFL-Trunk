/**
 * Anonymous tool tickets — docs/LOCAL_WORKSTATION_CONTRACT.md §7a (binding).
 *
 * A tool request must prove "someone with access sent this" without saying who. RSA blind
 * signatures (RFC 9474, RSABSSA-SHA384-PSS-Randomized) do exactly that:
 *   1. the logged-in app makes random tickets, BLINDS them and asks us to sign the blinded values
 *      (POST /api/tools/tickets, with the account token — the only account-bound step);
 *   2. we sign without ever seeing the tickets, and only count how many this account got this month;
 *   3. the app unblinds and keeps the signed tickets locally;
 *   4. later, a tool call (POST /api/tools/run/:toolId, WITHOUT any token) spends one ticket: we
 *      check our own signature and that the ticket was not spent before — and learn nothing else.
 *
 * Keys rotate per month (epoch "YYYY-MM"); tickets of the current and the previous month redeem.
 * What is stored: the monthly key pair (private key encrypted), a per-account issued COUNT per
 * month (expires with the month), and SHA-256 hashes of spent tickets (expire with their epoch).
 * Nothing links an issued ticket to a spent one, and no timestamps are kept that could be lined up.
 */
const crypto = require('crypto');
const { collections } = require('../db');
const { encrypt, decrypt } = require('./encryption');

const SUITE_NAME = 'RSABSSA-SHA384-PSS-Randomized';
const MODULUS_BITS = 3072;
const TICKETS_PER_EPOCH = 300;
const MAX_PER_REQUEST = 50;
const RSA_PARAMS = { name: 'RSA-PSS', hash: 'SHA-384' };

class TicketError extends Error {
  constructor(code, message, status = 400) { super(message); this.code = code; this.status = status; }
}

let suitePromise = null;
/** The library is ESM-only; load it once. */
function suite() {
  if (!suitePromise) {
    suitePromise = import('@cloudflare/blindrsa-ts').then(({ RSABSSA }) => RSABSSA.SHA384.PSS.Randomized());
  }
  return suitePromise;
}

const b64u = (u8) => Buffer.from(u8).toString('base64url');
const fromB64u = (s) => new Uint8Array(Buffer.from(String(s || ''), 'base64url'));

/** "YYYY-MM" in UTC. */
function epochOf(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}
function previousEpoch(epoch) {
  const [y, m] = epoch.split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
}
/** First moment after the redemption window of an epoch: the start of the month after next. */
function epochExpiry(epoch) {
  const [y, m] = epoch.split('-').map(Number);
  return new Date(Date.UTC(y, m + 1, 1)); // month index m = next month; +1 = the one after
}

const keyCache = new Map(); // epoch → { publicKey, privateKey, spki }

/** The key pair of an epoch; created on first use for the CURRENT epoch only. */
async function getKey(epoch, { create = false } = {}) {
  if (keyCache.has(epoch)) return keyCache.get(epoch);
  const s = await suite();
  let doc = await collections.toolTicketKeys().findOne({ epoch });
  if (!doc && create) {
    const pair = await s.generateKey({ modulusLength: MODULUS_BITS, publicExponent: Uint8Array.from([1, 0, 1]) });
    const spki = Buffer.from(await crypto.webcrypto.subtle.exportKey('spki', pair.publicKey)).toString('base64');
    const pkcs8 = Buffer.from(await crypto.webcrypto.subtle.exportKey('pkcs8', pair.privateKey)).toString('base64');
    try {
      await collections.toolTicketKeys().insertOne({ epoch, spki, pkcs8: encrypt(pkcs8), suite: SUITE_NAME });
    } catch (e) {
      if (e && e.code !== 11000) throw e; // another instance created it first — use that one
    }
    doc = await collections.toolTicketKeys().findOne({ epoch });
  }
  if (!doc) return null;
  const subtle = crypto.webcrypto.subtle;
  const entry = {
    spki: doc.spki,
    publicKey: await subtle.importKey('spki', Buffer.from(doc.spki, 'base64'), RSA_PARAMS, true, ['verify']),
    // extractable: the blind-signing library reads the key as JWK to do the raw RSA step; the
    // key object never leaves this process.
    privateKey: await subtle.importKey('pkcs8', Buffer.from(decrypt(doc.pkcs8), 'base64'), RSA_PARAMS, true, ['sign']),
  };
  keyCache.set(epoch, entry);
  return entry;
}

/** Public part for the app: which month, which key, how many tickets a month. */
async function publicKeyInfo(now = new Date()) {
  const epoch = epochOf(now);
  const key = await getKey(epoch, { create: true });
  return { epoch, suite: SUITE_NAME, publicKey: key.spki, perEpoch: TICKETS_PER_EPOCH };
}

/**
 * Sign blinded tickets for an account with access. Counts, never records the values.
 * @returns {{ epoch, signatures: string[], remaining: number }}
 */
async function issueTickets({ user, epoch, blinded, now = new Date() }) {
  const current = epochOf(now);
  if (epoch !== current) throw new TicketError('wrong_epoch', 'Tickets are issued for the current month only', 409);
  if (!Array.isArray(blinded) || blinded.length === 0 || blinded.length > MAX_PER_REQUEST) {
    throw new TicketError('bad_request', `Send 1–${MAX_PER_REQUEST} blinded tickets`);
  }
  if (user.accessUntil && new Date(user.accessUntil) < now) throw new TicketError('no_access', 'Access has expired', 403);

  const key = await getKey(current, { create: true });
  const s = await suite();
  const n = blinded.length;
  const userId = String(user._id);

  // Reserve the count atomically before signing (upsert the month's counter, then a guarded $inc).
  await collections.toolTicketIssuance().updateOne(
    { userId, epoch: current },
    { $setOnInsert: { userId, epoch: current, count: 0, expiresAt: epochExpiry(current) } },
    { upsert: true },
  ).catch((e) => { if (e.code !== 11000) throw e; });
  const reserved = await collections.toolTicketIssuance().findOneAndUpdate(
    { userId, epoch: current, count: { $lte: TICKETS_PER_EPOCH - n } },
    { $inc: { count: n } },
    { returnDocument: 'after' },
  );
  const doc = reserved && (reserved.value !== undefined ? reserved.value : reserved);
  if (!doc) throw new TicketError('limit', 'Monthly ticket limit reached', 429);

  try {
    const signatures = [];
    for (const b of blinded) signatures.push(b64u(await s.blindSign(key.privateKey, fromB64u(b))));
    return { epoch: current, signatures, remaining: TICKETS_PER_EPOCH - doc.count };
  } catch (e) {
    // Give the reservation back when a blinded value was malformed.
    await collections.toolTicketIssuance().updateOne({ userId, epoch: current }, { $inc: { count: -n } });
    throw new TicketError('bad_blinded', 'A blinded ticket could not be signed');
  }
}

/**
 * Check and spend one ticket from the X-GFL-Ticket header: "v1.<epoch>.<ticket>.<signature>".
 * Throws TicketError; on success the ticket can never be used again.
 */
async function redeemTicket(header, now = new Date()) {
  const parts = String(header || '').split('.');
  if (parts.length !== 4 || parts[0] !== 'v1') throw new TicketError('no_ticket', 'A tool ticket is required', 401);
  const [, epoch, ticketB64, sigB64] = parts;
  const current = epochOf(now);
  if (epoch !== current && epoch !== previousEpoch(current)) throw new TicketError('expired_ticket', 'This ticket has expired', 401);

  const key = await getKey(epoch);
  if (!key) throw new TicketError('invalid_ticket', 'Invalid ticket', 401);
  const s = await suite();
  const ticket = fromB64u(ticketB64);
  let ok = false;
  try { ok = ticket.length >= 32 && await s.verify(key.publicKey, fromB64u(sigB64), ticket); } catch { ok = false; }
  if (!ok) throw new TicketError('invalid_ticket', 'Invalid ticket', 401);

  const hash = crypto.createHash('sha256').update(ticket).digest('hex');
  try {
    await collections.toolTicketsSpent().insertOne({ hash, expiresAt: epochExpiry(epoch) });
  } catch (e) {
    if (e && e.code === 11000) throw new TicketError('spent_ticket', 'This ticket was already used', 409);
    throw e;
  }
  return { epoch };
}

module.exports = {
  publicKeyInfo, issueTickets, redeemTicket, TicketError,
  epochOf, previousEpoch, TICKETS_PER_EPOCH, MAX_PER_REQUEST, SUITE_NAME,
  _resetKeyCache: () => keyCache.clear(),
};
