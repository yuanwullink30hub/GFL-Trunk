/**
 * The crystal code's key — what makes a code usable to CLAIM a report once its render data is public.
 *
 * The problem. A crystal code (LC_ORB3_…) is base64(JSON(render vector)). An account publishes that same
 * render vector as its render-only `publicOrb` (profile, card, directory), so anyone can rebuild the code
 * from public data. The orb-login gate stops a LINKED code from opening a session, but the coupling
 * remained: when an account was deleted, its code link went with it, and the rebuilt code could claim
 * the report — its reading and its months of access — into a stranger's account.
 *
 * The key. orbKeyFor(code) = HMAC-SHA256 of the code under a server-only key, printed in the report PDF as
 * KEY::…::KEY next to the code. It cannot be computed from anything public: it needs the server's secret.
 * A MAC rather than a stored random secret on purpose: the platform stores nothing about a report until
 * it is claimed (privacy policy, art. 5), and a MAC needs no storage to verify. The key is compared
 * exactly — no case folding — unlike the code's lookup hash (services/encryption.js hash()).
 *
 * The rule (claimCheck). A code that has EVER been redeemed for an account can only be presented together
 * with its key. Only a redeemed code can ever have appeared on a public profile, so everything that is
 * rebuildable from public data is covered. A code that was never redeemed was never public, and may still
 * be claimed without a key — which keeps every report PDF printed before the key existed working.
 *
 * "Ever redeemed" is recorded on the report's release registration (reportUnlocks.redeemed), which the
 * privacy policy already keeps for as long as the code stays valid, precisely so a code can be redeemed
 * only once. The account's own link (orbCodes) is still deleted with the account, as promised.
 */
const crypto = require('crypto');
const config = require('../config');

const KEY_LENGTH = 26; // base64url characters: ~156 bits

function secret() {
  if (!config.jwtSecret) throw new Error('[orbKey] JWT_SECRET is required to key crystal codes');
  // Same derivation pattern as sealedCode.js and cardSignature.js, under its own label.
  return crypto.createHash('sha256').update(`gfl-orb-key:${config.jwtSecret}`).digest();
}

/** The key for a crystal code. */
function orbKeyFor(orbCode) {
  return crypto.createHmac('sha256', secret()).update(String(orbCode)).digest('base64url').slice(0, KEY_LENGTH);
}

/** Does `key` belong to `orbCode`? Exact and timing-safe. */
function verifyOrbKey(orbCode, key) {
  const given = Buffer.from(String(key || ''));
  const expected = Buffer.from(orbKeyFor(orbCode));
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

/** Has this code ever been redeemed for an account? */
async function wasRedeemed(codeHash) {
  const { collections } = require('../db');
  const [unlock, link] = await Promise.all([
    collections.reportUnlocks().findOne({ codeHash, redeemed: true }, { projection: { _id: 1 } }),
    collections.orbCodes().findOne({ codeHash }, { projection: { _id: 1 } }),
  ]);
  return !!(unlock || link);
}

/** Record that a code has been redeemed. Called on every claim, and before an account's links are deleted. */
async function markRedeemed(codeHashes) {
  const list = (Array.isArray(codeHashes) ? codeHashes : [codeHashes]).filter(Boolean);
  if (!list.length) return;
  const { collections } = require('../db');
  await collections.reportUnlocks().updateMany({ codeHash: { $in: list } }, { $set: { redeemed: true } });
}

/**
 * May this code be claimed with what was presented? Resolves to null when it may, or to a refusal
 * { status, error, code }. Callers still apply their own checks (blocked, activatable, linked elsewhere).
 */
async function claimCheck(codeHash, orbCode, orbKey) {
  if (orbKey) {
    return verifyOrbKey(orbCode, orbKey)
      ? null
      : { status: 403, code: 'bad_key', error: 'De sleutel in dit rapport hoort niet bij deze kristal-code.' };
  }
  if (await wasRedeemed(codeHash)) {
    return {
      status: 403,
      code: 'key_required',
      error: 'Deze kristal-code is al eens ingewisseld en kan alleen worden gebruikt met het rapport waarin ook de sleutel staat.',
    };
  }
  return null;
}

/** The KEY::…::KEY marker out of report text (whitespace already stripped). */
function keyFromText(stripped) {
  const m = String(stripped || '').match(/KEY::([A-Za-z0-9_-]{16,64})::KEY/);
  return m ? m[1] : null;
}

module.exports = { orbKeyFor, verifyOrbKey, wasRedeemed, markRedeemed, claimCheck, keyFromText, KEY_LENGTH };
