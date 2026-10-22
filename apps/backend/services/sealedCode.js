/**
 * Garden For Life — Sealed crystal codes.
 *
 * The crystal code is the key to an account, and only a PAID (or activation-code) report may
 * carry it. So the browser never receives the code with the analysis. It receives a SEALED
 * copy instead: the code encrypted with a server-only key (AES-256-GCM) plus an expiry. The
 * browser can hold it in memory but cannot read it. When the report is unlocked, the server
 * opens the seal, records the unlock against the code's hash and hands the code over for the
 * PDF — once, at that moment.
 *
 * The seal also carries the report's level (beginner | intermediate | advanced), so the price the
 * server charges follows the report, not what the browser claims (owner, 22 Oct 2026: price per level).
 * A seal without one (made before that) counts as advanced.
 *
 * Nothing is stored: the seal lives only in the tab. When the tab is closed or SEAL_TTL_MS has
 * passed, the code is gone for good — which matches the one-time nature of the report.
 *
 * The key is derived from JWT_SECRET (always configured) rather than ENCRYPTION_KEY, because
 * field encryption falls back to PLAINTEXT when ENCRYPTION_KEY is missing — that fallback
 * would hand the raw code to the browser.
 */
const crypto = require('crypto');
const config = require('../config');

const SEAL_TTL_MS = 24 * 60 * 60 * 1000; // same window as the computed profile
const VERSION = 's1';
const LEVELS = ['beginner', 'intermediate', 'advanced'];
const DEFAULT_LEVEL = 'advanced';

function key() {
  if (!config.jwtSecret) throw new Error('[sealedCode] JWT_SECRET is required to seal crystal codes');
  return crypto.createHash('sha256').update(`gfl-crystal-seal:${config.jwtSecret}`).digest();
}

class SealError extends Error {
  constructor(code) { super(code); this.code = code; } // 'invalid' | 'expired'
}

/** Seal a raw crystal code and the report's level. Returns an opaque string safe to send to the browser. */
function sealCode(orbCode, now = Date.now(), { level = DEFAULT_LEVEL } = {}) {
  if (!LEVELS.includes(level)) throw new Error(`[sealedCode] unknown level ${JSON.stringify(level)}`);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify({ c: String(orbCode), e: now + SEAL_TTL_MS, l: level }), 'utf8'), cipher.final()]);
  return `${VERSION}.${Buffer.concat([iv, cipher.getAuthTag(), body]).toString('base64url')}`;
}

/** Open a seal: { code, level }. Throws SealError('invalid' | 'expired'). `allowExpired` is for clean-up
 *  only (discarding an unpaid report's leftovers) — never for unlocking. */
function openSeal(sealed, now = Date.now(), { allowExpired = false } = {}) {
  const [version, payload] = String(sealed || '').split('.');
  if (version !== VERSION || !payload) throw new SealError('invalid');
  let data;
  try {
    const raw = Buffer.from(payload, 'base64url');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key(), raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    data = JSON.parse(Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8'));
  } catch {
    throw new SealError('invalid');
  }
  if (!data || typeof data.c !== 'string' || !/^LC_ORB[23]?_/.test(data.c)) throw new SealError('invalid');
  if (!allowExpired && !(data.e > now)) throw new SealError('expired');
  return { code: data.c, level: LEVELS.includes(data.l) ? data.l : DEFAULT_LEVEL };
}

/** The raw crystal code of a seal (see openSeal). */
const unsealCode = (sealed, now, opts) => openSeal(sealed, now, opts).code;

module.exports = { sealCode, unsealCode, openSeal, SealError, SEAL_TTL_MS, LEVELS };
