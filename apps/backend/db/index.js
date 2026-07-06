/**
 * Garden For Life — MongoDB Connection
 *
 * Uses the native MongoDB Node.js driver (no Mongoose).
 * Connects once at startup and exposes the db instance + typed collection accessors.
 */
const { MongoClient } = require('mongodb');
const config = require('../config');

let client;
let db;

/**
 * Connect to MongoDB Atlas. Call once from server.js at startup.
 */
async function connectDB() {
  if (db) return db;

  if (!config.mongoUri) {
    throw new Error('MONGODB_URI is not set in .env');
  }

  client = new MongoClient(config.mongoUri);
  await client.connect();
  db = client.db(); // uses the database name from the connection string

  // ── Migration: email → emailHash ──
  // Backfill emailHash on any existing users that don't have it yet,
  // then swap the unique index from email to emailHash.
  await migrateEmailToHash();
  await migrateDisplayNameHash();

  // Create / ensure indexes
  await db.collection('users').createIndex({ emailHash: 1 }, { unique: true });
  // Unique VISUAL NAME (case-insensitive, via nameHash — displayName itself is encrypted so can't
  // be searched). Sparse so legacy users without a hash (or a collided one left unset by the
  // backfill) don't block the index; they re-pick a unique name on their next edit.
  await db.collection('users').createIndex({ nameHash: 1 }, { unique: true, sparse: true });
  await db.collection('assessments').createIndex({ userId: 1, createdAt: -1 });
  await db.collection('assessmentReviews').createIndex({ createdAt: -1 });
  await db.collection('assessmentReviews').createIndex({ userId: 1 }, { sparse: true });

  // Passkeys — unique 6-digit codes
  await db.collection('passkeys').createIndex({ code: 1 }, { unique: true });

  // Orb codes — an LC_ORB code links to at most ONE account (unique on the hashed code).
  // Once linked, PDF-upload login for that code is denied (the account is the credential).
  await db.collection('orbCodes').createIndex({ codeHash: 1 }, { unique: true });

  // Invoices — indexed by userId for fast lookup across viewports/devices
  await db.collection('invoices').createIndex({ userId: 1, savedAt: -1 });

  // Internal messages — inbox query (recipient, newest first)
  await db.collection('messages').createIndex({ toUserId: 1, at: -1 });

  // Kaart-microcopy drafts — authored at report generation, keyed by orb-code hash;
  // merged into the reading when the code is claimed. Auto-expire with the beta window.
  await db.collection('kaartDrafts').createIndex({ codeHash: 1 }, { unique: true });
  await db.collection('kaartDrafts').createIndex(
    { at: 1 },
    { expireAfterSeconds: 90 * 24 * 60 * 60, name: 'kaartDrafts_ttl_90d' }
  );

  // ── BETA data retention: auto-expire assessment data after 90 days ──
  // MongoDB's TTL index removes documents automatically — no cron job needed.
  const BETA_RETENTION_SECONDS = 90 * 24 * 60 * 60; // 90 days
  await db.collection('assessments').createIndex(
    { createdAt: 1 },
    { expireAfterSeconds: BETA_RETENTION_SECONDS, name: 'assessments_ttl_90d' }
  );
  await db.collection('assessmentReviews').createIndex(
    { createdAt: 1 },
    { expireAfterSeconds: BETA_RETENTION_SECONDS, name: 'assessmentReviews_ttl_90d' }
  );

  console.log('[MongoDB] Connected to', db.databaseName);
  return db;
}

/**
 * One-time migration: backfill emailHash on legacy users.
 * Safe to run multiple times — skips users that already have emailHash.
 */
async function migrateEmailToHash() {
  const { hash, encrypt, decrypt } = require('../services/encryption');
  const usersCol = db.collection('users');

  // Find users missing emailHash
  const legacy = await usersCol.find({ emailHash: { $exists: false } }).toArray();

  if (legacy.length === 0) return; // nothing to migrate

  console.log(`[Migration] Backfilling emailHash for ${legacy.length} existing user(s)...`);

  for (const user of legacy) {
    // The email might be plaintext (legacy) or already encrypted
    const plainEmail = decrypt(user.email); // handles both cases
    const emailHash = hash(plainEmail);

    // If encryption is enabled, also re-encrypt fields that are still plaintext
    const encryptedEmail = encrypt(plainEmail);
    const encryptedDisplayName = encrypt(decrypt(user.displayName));

    await usersCol.updateOne(
      { _id: user._id },
      {
        $set: {
          emailHash,
          email: encryptedEmail,
          displayName: encryptedDisplayName,
        },
      }
    );
  }

  console.log(`[Migration] ✓ Backfilled ${legacy.length} user(s)`);

  // Drop the old email_1 index if it exists
  try {
    await usersCol.dropIndex('email_1');
    console.log('[Migration] Dropped legacy email_1 index');
  } catch {
    // Index doesn't exist — that's fine
  }
}

// Normalise a display name for uniqueness (case-insensitive, whitespace-collapsed).
const nameKey = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');

/**
 * Backfill nameHash on legacy users so the unique index can be built. First user with a given
 * normalised name keeps it; later collisions are left without a nameHash (they must re-pick a
 * unique visual name on their next edit). Safe to run repeatedly.
 */
async function migrateDisplayNameHash() {
  const { hash, decrypt } = require('../services/encryption');
  const usersCol = db.collection('users');
  const pending = await usersCol.find({ nameHash: { $exists: false } }).toArray();
  if (!pending.length) return;

  const seen = new Set();
  const existing = await usersCol.find({ nameHash: { $exists: true } }).project({ nameHash: 1 }).toArray();
  existing.forEach((u) => seen.add(u.nameHash));

  let set = 0;
  for (const u of pending) {
    let name = '';
    try { name = decrypt(u.displayName) || ''; } catch { name = ''; }
    const key = nameKey(name);
    if (!key) continue;
    const nh = hash(key);
    if (seen.has(nh)) continue; // collision — leave unset; user re-picks a unique name later
    seen.add(nh);
    await usersCol.updateOne({ _id: u._id }, { $set: { nameHash: nh } });
    set++;
  }
  if (set) console.log(`[Migration] Backfilled nameHash for ${set} user(s)`);
}

/**
 * Get the database instance (must call connectDB first).
 */
function getDB() {
  if (!db) throw new Error('Database not connected. Call connectDB() first.');
  return db;
}

/**
 * Typed collection accessors for convenience.
 */
const collections = {
  users: () => getDB().collection('users'),
  assessments: () => getDB().collection('assessments'),
  questions: () => getDB().collection('questions'),
  assessmentReviews: () => getDB().collection('assessmentReviews'),
  passkeys: () => getDB().collection('passkeys'),
  orbCodes: () => getDB().collection('orbCodes'),
  messages: () => getDB().collection('messages'),
  kaartDrafts: () => getDB().collection('kaartDrafts'),
};

/**
 * Graceful shutdown.
 */
async function closeDB() {
  if (client) {
    await client.close();
    console.log('[MongoDB] Connection closed');
  }
}

module.exports = { connectDB, getDB, collections, closeDB, nameKey };
