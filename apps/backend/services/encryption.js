/**
 * Garden For Life — Field-Level Encryption Service
 *
 * AES-256-GCM encryption for PII fields (email, displayName).
 * Uses Node.js built-in `crypto` — zero extra dependencies.
 *
 * How it works:
 *   - encrypt(plaintext) → "iv:authTag:ciphertext" (base64-encoded)
 *   - decrypt(encrypted) → plaintext
 *   - hash(value) → SHA-256 hex digest (deterministic, for DB lookups)
 *
 * The ENCRYPTION_KEY (32 bytes, base64) is loaded from .env.
 * If the key is missing, encryption is SKIPPED (dev fallback) and a
 * warning is logged — so existing data and local dev still work.
 */
const crypto = require('crypto');
const config = require('../config');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;     // GCM recommended IV size
const TAG_LENGTH = 16;    // auth tag size
const SEPARATOR = ':';    // delimiter in stored string

// ─────────────────────────────────────────────────────────────
// Derive the key buffer once at startup
// ─────────────────────────────────────────────────────────────

let KEY_BUFFER = null;
let _warned = false;

function getKey() {
  if (KEY_BUFFER) return KEY_BUFFER;

  if (!config.encryptionKey) {
    if (!_warned) {
      console.warn('[Encryption] ⚠  ENCRYPTION_KEY not set — field encryption DISABLED (plaintext fallback)');
      _warned = true;
    }
    return null;
  }

  KEY_BUFFER = Buffer.from(config.encryptionKey, 'base64');

  if (KEY_BUFFER.length !== 32) {
    throw new Error(`[Encryption] ENCRYPTION_KEY must be exactly 32 bytes (got ${KEY_BUFFER.length}). Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`);
  }

  return KEY_BUFFER;
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

/**
 * Encrypt a plaintext string.
 * Returns a combined string: "iv:tag:ciphertext" (all base64).
 * If ENCRYPTION_KEY is not set, returns the plaintext unchanged.
 */
function encrypt(plaintext) {
  if (!plaintext) return plaintext;

  const key = getKey();
  if (!key) return plaintext; // dev fallback

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return [
    iv.toString('base64'),
    tag.toString('base64'),
    encrypted.toString('base64'),
  ].join(SEPARATOR);
}

/**
 * Decrypt a previously encrypted string.
 * Accepts "iv:tag:ciphertext" format.
 * If the value doesn't look encrypted (no separators), returns it as-is
 * — this handles legacy unencrypted data gracefully.
 */
function decrypt(encrypted) {
  if (!encrypted) return encrypted;

  const key = getKey();
  if (!key) return encrypted; // dev fallback — assume plaintext

  // Detect legacy plaintext: valid encrypted strings always have exactly 2 colons
  const parts = encrypted.split(SEPARATOR);
  if (parts.length !== 3) {
    return encrypted; // unencrypted legacy data — return as-is
  }

  try {
    const iv = Buffer.from(parts[0], 'base64');
    const tag = Buffer.from(parts[1], 'base64');
    const ciphertext = Buffer.from(parts[2], 'base64');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  } catch {
    // If decryption fails (wrong key, corrupted data), return raw value
    // so the app doesn't crash on legacy records
    console.warn('[Encryption] Decryption failed — returning raw value (legacy data?)');
    return encrypted;
  }
}

/**
 * SHA-256 hash of a value (deterministic).
 * Used for creating searchable lookup indexes (e.g., emailHash)
 * without exposing the plaintext in MongoDB.
 */
function hash(value) {
  if (!value) return '';
  return crypto.createHash('sha256').update(value.toLowerCase().trim()).digest('hex');
}

/**
 * Check if the encryption service is active (key is configured).
 */
function isEnabled() {
  return !!getKey();
}

/**
 * Decrypt a full user document's PII fields in-place and return it.
 * Safe to call on already-decrypted or legacy documents.
 */
function decryptUser(user) {
  if (!user) return user;
  return {
    ...user,
    email: decrypt(user.email),
    displayName: decrypt(user.displayName),
  };
}

/**
 * Decrypt an array of user documents.
 */
function decryptUsers(users) {
  return users.map(decryptUser);
}

module.exports = {
  encrypt,
  decrypt,
  hash,
  isEnabled,
  decryptUser,
  decryptUsers,
};
