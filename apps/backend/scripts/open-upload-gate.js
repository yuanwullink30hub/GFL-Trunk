/**
 * TEST HELPER: open the upload gate for the test account so a new kristal-code can be
 * linked immediately (the real gate is "2 months after the last code").
 *
 * Does two things to the test account:
 *   1. Backdates the last orbHistory entry to NOW − 2 months − 1 day → the gate is open,
 *      through the REAL /orb/link flow (nothing bypassed, the production rule stays intact).
 *   2. Seeds accessUntil = NOW + 1 month (an active window with 1 month left), so the
 *      cumulative extension is visible: after linking the new code, accessUntil must read
 *      NOW + 4 months (1 remaining + 3 new) — never "3 from redemption".
 *
 * Run from apps/backend:  node scripts/open-upload-gate.js
 */
const crypto = require('crypto');
const config = require('../config'); // loads .env → config.mongoUri
const { MongoClient } = require('mongodb');

const TARGET_NAME = 'yuan wullink';
const TARGET_EMAIL = 'yuanwullink30@gmail.com';

const h = (v) => crypto.createHash('sha256').update(String(v || '').toLowerCase().trim()).digest('hex');
const nameKey = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
const addMonths = (date, n) => { const d = new Date(date); d.setMonth(d.getMonth() + n); return d; };

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

  const now = new Date();
  const backdated = new Date(addMonths(now, -2).getTime() - 24 * 60 * 60 * 1000); // −2 months −1 day
  const accessUntil = addMonths(now, 1);

  const hist = Array.isArray(user.orbHistory) ? user.orbHistory.slice() : [];
  if (hist.length) {
    hist[hist.length - 1] = { ...hist[hist.length - 1], at: backdated };
  } else {
    hist.push({ codeHash: null, orb: user.publicOrb || null, archetypeName: user.archetypeName || '', at: backdated });
  }

  const r = await users.updateOne(
    { _id: user._id },
    { $set: { orbHistory: hist, accessUntil, updatedAt: now } }
  );
  console.log(`✅ ${String(user._id)} | matched ${r.matchedCount} modified ${r.modifiedCount}`);
  console.log(`   last code backdated to  ${backdated.toISOString()}  → upload gate OPEN`);
  console.log(`   accessUntil seeded to   ${accessUntil.toISOString()}  (1 month left)`);
  console.log(`   EXPECTED after linking a new code: accessUntil ≈ ${addMonths(accessUntil, 3).toISOString()} (cumulative +3)`);
  await client.close();
})().catch((e) => { console.error(e); process.exit(1); });
