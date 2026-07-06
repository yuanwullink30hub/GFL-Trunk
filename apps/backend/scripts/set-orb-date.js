/**
 * One-off: set the "Laatst gemaakt" date for a specific account's current orb.
 * Finds the user by visual-name hash (fallback: email hash) and stamps the most recent
 * orbHistory entry's `at` (creating one from the stored publicOrb if the history is empty).
 *
 * Run from apps/backend:  node scripts/set-orb-date.js
 */
const crypto = require('crypto');
const config = require('../config'); // loads .env → config.mongoUri
const { MongoClient } = require('mongodb');

const TARGET_NAME = 'yuan wullink';
const TARGET_EMAIL = 'yuanwullink30@gmail.com';
const DATE = new Date('2026-07-03T12:00:00Z'); // 3-7-2026

// Same deterministic hash the backend uses: SHA-256 of the lowercased/trimmed value.
const h = (v) => crypto.createHash('sha256').update(String(v || '').toLowerCase().trim()).digest('hex');
// nameKey: lowercase, collapse whitespace, trim.
const nameKey = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();

(async () => {
  if (!config.mongoUri) throw new Error('MONGODB_URI not set in .env');
  const client = new MongoClient(config.mongoUri);
  await client.connect();
  const users = client.db().collection('users');

  let user = await users.findOne({ nameHash: h(nameKey(TARGET_NAME)) });
  if (!user) user = await users.findOne({ emailHash: h(TARGET_EMAIL) });
  if (!user) {
    console.error('❌ User not found for', TARGET_NAME, '/', TARGET_EMAIL);
    await client.close();
    process.exit(1);
  }

  const hist = Array.isArray(user.orbHistory) ? user.orbHistory.slice() : [];
  if (hist.length) {
    hist[hist.length - 1] = { ...hist[hist.length - 1], at: DATE };
  } else {
    hist.push({ codeHash: null, orb: user.publicOrb || null, archetypeName: user.archetypeName || '', at: DATE });
  }
  const r = await users.updateOne({ _id: user._id }, { $set: { orbHistory: hist, updatedAt: new Date() } });
  console.log(`✅ ${String(user._id)} | matched ${r.matchedCount} modified ${r.modifiedCount} | Laatst gemaakt = ${DATE.toISOString()} | entries ${hist.length}`);
  await client.close();
})().catch((e) => { console.error(e); process.exit(1); });
