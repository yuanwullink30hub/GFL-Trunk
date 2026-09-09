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
  await db.collection('assessmentReviews').createIndex({ timestamp: -1 });
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

  // Verbonden (connection requests) — incoming-pending lookup + both-direction contacts
  await db.collection('verbonden').createIndex({ toUserId: 1, status: 1, at: -1 });
  await db.collection('verbonden').createIndex({ fromUserId: 1, status: 1 });

  // Kaart-microcopy drafts — authored at report generation, keyed by orb-code hash;
  // merged into the reading when the code is claimed, and deleted at that moment.
  // NO EXPIRY: an orb code stays valid for life, so its draft has to outlive any TTL —
  // a report claimed a year later must still be able to fill its card. The draft is
  // pseudonymous until claimed (a hash plus two paragraphs, no user reference), which
  // is what makes indefinite retention proportionate here.
  await db.collection('kaartDrafts').createIndex({ codeHash: 1 }, { unique: true });
  await dropIndexes('kaartDrafts', ['kaartDrafts_ttl_90d'], { key: 'at' });

  // ── Data retention ──
  // A computed profile is a working cache, never a record: the account keeps only the
  // partial profile (users.orbHistory). `assessments` is swept every night at 00:00
  // (scheduleProfilePurge in server.js); this TTL is the safety net for the window in
  // which the sweep can't run (process restart, crash), capping retention at 24 hours.
  await ensureTtlIndex('assessments', { createdAt: 1 }, 24 * 60 * 60, 'assessments_ttl_24h');
  // Feedback reviews are business data (no raw profile): 90 days, as declared in the
  // Art. 30 register. NOTE the key is `timestamp` — the review documents carry no
  // `createdAt`, so the old TTL on that field expired nothing at all. Its name is reused
  // below, so the dead indexes have to go first or the new one collides on the name.
  await dropIndexes('assessmentReviews', ['assessmentReviews_ttl_90d', 'createdAt_-1'], { key: 'createdAt' });
  await ensureTtlIndex('assessmentReviews', { timestamp: 1 }, 90 * 24 * 60 * 60, 'assessmentReviews_ttl_90d');

  // ── devActivity: split retention by document type ──
  // Consent records are the Art. 7(1) proof that processing was lawful and must survive
  // as long as the account. A blanket TTL on `timestamp` deleted them after 90 days along
  // with the operational entries. Keying the TTL on `expiresAt` with expireAfterSeconds 0
  // means each document expires when it says it does, and one without the field never
  // expires — which is exactly the distinction consent needs.
  await dropIndexes('devActivity', ['timestamp_1'], { key: 'timestamp' });
  await ensureTtlIndex('devActivity', { expiresAt: 1 }, 0, 'devActivity_ttl_per_document');
  // Existing operational entries predate the field, so they would now never expire.
  // Backfill them once; consent records are deliberately left without it. Idempotent.
  await db.collection('devActivity').updateMany(
    { expiresAt: { $exists: false }, type: { $ne: 'consent_given' } },
    [{ $set: { expiresAt: { $add: ['$timestamp', 90 * 24 * 60 * 60 * 1000] } } }]
  ).then((r) => { if (r.modifiedCount) console.log(`[MongoDB] Backfilled expiresAt on ${r.modifiedCount} audit entr(ies)`); })
    .catch((e) => console.warn('[MongoDB] devActivity backfill skipped:', e.message));

  console.log('[MongoDB] Connected to', db.databaseName);
  return db;
}

/**
 * Drop named indexes, but only when they still key on `guard.key` — so a re-run after the
 * replacement index exists under the same name can never delete the new one.
 */
async function dropIndexes(collectionName, names, guard) {
  const coll = db.collection(collectionName);
  const existing = await coll.indexes().catch(() => []);
  for (const ix of existing) {
    if (!names.includes(ix.name)) continue;
    if (guard && !Object.prototype.hasOwnProperty.call(ix.key, guard.key)) continue;
    await coll.dropIndex(ix.name)
      .then(() => console.log(`[MongoDB] Dropped stale index ${collectionName}.${ix.name}`))
      .catch((e) => console.warn(`[MongoDB] Could not drop ${collectionName}.${ix.name}:`, e.message));
  }
}

/**
 * Create a TTL index, or retune an existing one on the same key.
 * `createIndex` throws IndexOptionsConflict when the key already carries a TTL with a
 * different lifetime or name, so an existing index is amended with collMod instead —
 * otherwise a shortened retention period would never take effect on a live database.
 */
async function ensureTtlIndex(collectionName, key, expireAfterSeconds, name) {
  const coll = db.collection(collectionName);
  const existing = await coll.indexes().catch(() => []);
  const match = existing.find((ix) => JSON.stringify(ix.key) === JSON.stringify(key));
  if (match) {
    if (match.expireAfterSeconds !== expireAfterSeconds) {
      await db.command({ collMod: collectionName, index: { name: match.name, expireAfterSeconds } })
        .then(() => console.log(`[MongoDB] TTL on ${collectionName}.${Object.keys(key)[0]} set to ${expireAfterSeconds}s`))
        .catch((e) => console.warn(`[MongoDB] Could not retune TTL on ${collectionName}:`, e.message));
    }
    return;
  }
  await coll.createIndex(key, { expireAfterSeconds, name })
    .catch((e) => console.warn(`[MongoDB] Could not create TTL on ${collectionName}:`, e.message));
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
