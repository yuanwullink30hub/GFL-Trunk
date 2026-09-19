/**
 * Garden For Life — Signed card copy.
 *
 * The profile card's microcopy (giftMicro = the in-depth gift, geomSummary = the geometry summary) is
 * written by our model when the report is generated, and travels to the account IN THE REPORT PDF: the
 * data block prints it as CGIFT::/CGEO:: markers, and the upload reads it back like the crystal code.
 * Nothing of it is stored server-side before a claim (owner, 2026-09-19).
 *
 * The card is public and PDF text can be edited, so the server signs the copy — HMAC-SHA256 over the
 * code's hash and the two texts, with a server-only key — and the PDF carries the signature as a third
 * marker (CSIG::). Register and orb-link accept the copy only when the signature matches; edited or
 * unsigned copy is dropped and the card falls back to the levensles.
 *
 * The key is derived from JWT_SECRET (always configured), like sealedCode.js, domain-separated from it.
 */
const crypto = require('crypto');
const config = require('../config');
const { sanitizeReading } = require('./readingExtract');

function key() {
  if (!config.jwtSecret) throw new Error('[cardSignature] JWT_SECRET is required to sign card copy');
  return crypto.createHash('sha256').update(`gfl-card-copy:${config.jwtSecret}`).digest();
}

// The texts as the PDF round trip delivers them: whitespace collapsed, trimmed.
const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();

/** Sign a code's card copy. `codeHash` = encryption.hash(orbCode). Returns 64 hex characters. */
function signCard(codeHash, { giftMicro = '', geomSummary = '' } = {}) {
  return crypto.createHmac('sha256', key())
    .update(JSON.stringify([String(codeHash || ''), norm(giftMicro), norm(geomSummary)]))
    .digest('hex');
}

/** True when `sig` is this code's signature over exactly these texts. */
function verifyCard(codeHash, fields, sig) {
  if (!codeHash || !/^[0-9a-f]{64}$/.test(String(sig || ''))) return false;
  const want = Buffer.from(signCard(codeHash, fields), 'hex');
  return crypto.timingSafeEqual(want, Buffer.from(String(sig), 'hex'));
}

/**
 * The card copy a claim may keep: from a reading the client sent (extracted from its PDF), only when
 * the signature holds for this code. Returns { giftMicro?, geomSummary? } — possibly empty.
 */
function verifiedCardCopy(codeHash, reading) {
  if (!reading || typeof reading !== 'object') return {};
  const fields = { giftMicro: reading.giftMicro || '', geomSummary: reading.geomSummary || '' };
  if (!fields.giftMicro && !fields.geomSummary) return {};
  if (!verifyCard(codeHash, fields, reading.cardSig)) return {};
  return {
    ...(fields.giftMicro ? { giftMicro: norm(fields.giftMicro) } : {}),
    ...(fields.geomSummary ? { geomSummary: norm(fields.geomSummary) } : {}),
  };
}

/**
 * The reading a claim (register / orb-link) stores: the client's reading, allowlist-sanitized, with its
 * card copy kept only when signed for this code. A server-held draft — reports generated before the copy
 * moved into the PDF — still wins. The signature itself is never stored. Null when nothing is left.
 */
function readingForClaim(codeHash, reading, kaartDraft = null) {
  const { cardSig, giftMicro, geomSummary, ...rest } = sanitizeReading(reading) || {};
  const card = kaartDraft && (kaartDraft.giftMicro || kaartDraft.geomSummary)
    ? sanitizeReading({ giftMicro: kaartDraft.giftMicro, geomSummary: kaartDraft.geomSummary }) || {}
    : verifiedCardCopy(codeHash, { giftMicro, geomSummary, cardSig });
  const out = { ...rest, ...card };
  return Object.keys(out).length ? out : null;
}

module.exports = { signCard, verifyCard, verifiedCardCopy, readingForClaim };
