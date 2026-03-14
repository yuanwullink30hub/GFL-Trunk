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

  // Create / ensure indexes
  await db.collection('users').createIndex({ emailHash: 1 }, { unique: true });
  await db.collection('assessments').createIndex({ userId: 1, createdAt: -1 });
  await db.collection('assessmentReviews').createIndex({ createdAt: -1 });
  await db.collection('assessmentReviews').createIndex({ userId: 1 }, { sparse: true });

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

module.exports = { connectDB, getDB, collections, closeDB };
