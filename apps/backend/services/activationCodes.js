/**
 * Garden For Life — One-time activation codes for the full report.
 *
 * An activation code is an alternative to paying for one full report: the admin console
 * issues it, a client enters it in the pay component, and the first successful redemption
 * uses it up. A used (or revoked) code stays in the collection as the logbook entry.
 *
 * Codes are bearer vouchers, so they are stored like the orb codes: SHA-256 hash only,
 * plus the last four characters as a hint the admin can recognise. The plaintext exists
 * once — in the response to the admin who generated it.
 *
 * Document shape (collection `activationCodes`):
 *   { codeHash, hint, label, status: 'active' | 'used' | 'revoked',
 *     createdAt, createdBy, usedAt?, unlockId?, revokedAt?, revokedBy? }
 */
const crypto = require('crypto');

// No 0/O, 1/I/L: codes get read aloud and typed over from chat messages.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const GROUPS = 3;
const GROUP_LEN = 4;
const CODE_LEN = GROUPS * GROUP_LEN; // 12 chars over 31 symbols ≈ 59 bits

/** "abcd-efgh ijkl" → "ABCDEFGHIJKL"; anything not in the alphabet's character class is dropped. */
function normalizeCode(input) {
  return String(input || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function isWellFormed(normalized) {
  return normalized.length === CODE_LEN && [...normalized].every((ch) => ALPHABET.includes(ch));
}

function hashCode(normalized) {
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/** Uniformly random over the alphabet (crypto.randomInt has no modulo bias). */
function generateCode() {
  let raw = '';
  for (let i = 0; i < CODE_LEN; i++) raw += ALPHABET[crypto.randomInt(ALPHABET.length)];
  return raw;
}

/** "ABCDEFGHIJKL" → "ABCD-EFGH-IJKL" */
function formatCode(normalized) {
  return normalized.match(new RegExp(`.{1,${GROUP_LEN}}`, 'g')).join('-');
}

/** The token handed to the browser on redemption — the same role a Stripe payment ref plays. */
function newUnlockId() {
  return `code_${crypto.randomBytes(12).toString('hex')}`;
}

module.exports = { normalizeCode, isWellFormed, hashCode, generateCode, formatCode, newUnlockId, CODE_LEN };
