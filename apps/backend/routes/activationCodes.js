/**
 * Garden For Life — Activation code redemption (public).
 *
 * POST /api/activation-codes/redeem   body { code, sealedOrbCode? }
 *   200 { unlockId, orbCode }    code was active and is now used up; orbCode = the report's crystal code
 *   410 { error: 'report_expired' } the report's sealed code is past its window — the activation code is NOT used
 *   400 { error: 'malformed' }   not a code at all
 *   404 { error: 'invalid' }     unknown or revoked
 *   409 { error: 'used' }        already redeemed
 *   429 { error: 'rate_limited' }
 *
 * Single use is enforced by ONE atomic findOneAndUpdate on { codeHash, status: 'active' }:
 * two simultaneous redemptions of the same code cannot both match, so exactly one wins.
 *
 * Nothing about the person redeeming is stored — no IP, no account. The logbook entry is
 * the code's own record: when it was used. The unlock is also recorded in reportUnlocks,
 * bound to the hash of the report's crystal code, like a paid report.
 *
 * The browser only ever holds the SEALED crystal code (services/sealedCode.js). The seal is
 * opened before the activation code is spent, so an expired report never costs a code.
 */
const { Router } = require('express');
const { collections } = require('../db');
const { normalizeCode, isWellFormed, hashCode, newUnlockId } = require('../services/activationCodes');
const { recordUnlock, codeHashFor } = require('../services/reportAccess');
const { unsealCode, SealError } = require('../services/sealedCode');

const router = Router();

// ── Failed-attempt limiter (in memory) ──
// A code has ~59 bits of entropy, so guessing is hopeless anyway; this just stops a script
// from hammering the endpoint. Only failures count, so a client with a real code is never
// slowed down by their own typo retries unless they make ten of them.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 10;
const failures = new Map(); // ip -> { count, resetAt }

function isLimited(ip) {
  const entry = failures.get(ip);
  if (!entry) return false;
  if (Date.now() > entry.resetAt) { failures.delete(ip); return false; }
  return entry.count >= MAX_FAILURES;
}

function recordFailure(ip) {
  const now = Date.now();
  const entry = failures.get(ip);
  if (!entry || now > entry.resetAt) failures.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  else entry.count += 1;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of failures) if (now > entry.resetAt) failures.delete(ip);
}, WINDOW_MS).unref();

router.post('/redeem', async (req, res) => {
  const ip = req.ip || 'unknown';
  if (isLimited(ip)) return res.status(429).json({ error: 'rate_limited' });

  const normalized = normalizeCode(req.body?.code);
  if (!isWellFormed(normalized)) {
    recordFailure(ip);
    return res.status(400).json({ error: 'malformed' });
  }

  let orbCode = '';
  if (req.body?.sealedOrbCode) {
    try {
      orbCode = unsealCode(req.body.sealedOrbCode);
    } catch (e) {
      if (e instanceof SealError && e.code === 'expired') return res.status(410).json({ error: 'report_expired' });
      recordFailure(ip);
      return res.status(400).json({ error: 'malformed' });
    }
  }

  try {
    const codeHash = hashCode(normalized);
    const unlockId = newUnlockId();
    const claimed = await collections.activationCodes().findOneAndUpdate(
      { codeHash, status: 'active' },
      { $set: { status: 'used', usedAt: new Date(), unlockId } },
      { returnDocument: 'after', projection: { _id: 1, hint: 1 } },
    );
    if (claimed) { // driver v6: the document itself, or null
      // The code is spent either way; a ledger hiccup must not cost the client their unlock.
      await recordUnlock({
        unlockId, method: 'activation_code', reference: claimed._id, referenceHint: claimed.hint || '',
        codeHash: codeHashFor(orbCode),
      }).catch((e) => console.error('[ActivationCodes] ledger write failed:', e.message));
      // The one moment the raw code leaves the server: it goes into the unlocked PDF.
      return res.json({ unlockId, orbCode });
    }

    recordFailure(ip);
    const existing = await collections.activationCodes().findOne({ codeHash }, { projection: { status: 1 } });
    if (existing?.status === 'used') return res.status(409).json({ error: 'used' });
    return res.status(404).json({ error: 'invalid' });
  } catch (err) {
    console.error('[ActivationCodes] Redeem error:', err.message);
    return res.status(500).json({ error: 'server' });
  }
});

module.exports = router;
