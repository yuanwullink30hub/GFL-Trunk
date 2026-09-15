/**
 * ONE-OFF MIGRATION — register beta reports as unlocked.
 *
 * Since the sealed-code model, a crystal code only opens or extends an account when an active
 * unlock exists for it in `reportUnlocks` (services/reportAccess.js → isCodeActivatable).
 * During the beta every full report was free, so none of those reports has an unlock.
 *
 *   - Codes already LINKED to an account keep working through that link — nothing to do.
 *   - Beta codes NOT yet linked would be refused. This script registers them as 'legacy'
 *     unlocks. The only server-side trace of an unlinked beta code is its card draft
 *     (`kaartDrafts`, keyed by code hash, written before the sealed model — no `sealed` flag).
 *
 * Beta reports that never got a card draft cannot be recognised and stay unactivatable.
 *
 * Run BEFORE the new backend has run a nightly sweep for a day? Not required: the sweep only
 * deletes drafts flagged `sealed: true`, which beta drafts are not.
 *
 * Run from apps/backend:
 *   node scripts/backfill-legacy-unlocks.js            # inspect only, writes nothing
 *   node scripts/backfill-legacy-unlocks.js --apply    # write
 */
const crypto = require('crypto');
const config = require('../config');
const { MongoClient } = require('mongodb');

const APPLY = process.argv.includes('--apply');

(async () => {
  if (!config.mongoUri) throw new Error('MONGODB_URI not set in .env');
  const client = new MongoClient(config.mongoUri);
  await client.connect();
  const db = client.db();

  try {
    const drafts = await db.collection('kaartDrafts')
      .find({ sealed: { $ne: true } }, { projection: { codeHash: 1, at: 1 } }).toArray();
    const hashes = drafts.map((d) => d.codeHash).filter(Boolean);

    const [linked, unlocked] = await Promise.all([
      db.collection('orbCodes').find({ codeHash: { $in: hashes } }, { projection: { codeHash: 1 } }).toArray(),
      db.collection('reportUnlocks').find({ codeHash: { $in: hashes } }, { projection: { codeHash: 1 } }).toArray(),
    ]);
    const linkedSet = new Set(linked.map((x) => x.codeHash));
    const unlockedSet = new Set(unlocked.map((x) => x.codeHash));
    const todo = drafts.filter((d) => d.codeHash && !linkedSet.has(d.codeHash) && !unlockedSet.has(d.codeHash));

    const totalLinked = await db.collection('orbCodes').countDocuments();
    console.log(`Beta card drafts (not sealed):      ${drafts.length}`);
    console.log(`  of which already linked:          ${drafts.filter((d) => linkedSet.has(d.codeHash)).length}`);
    console.log(`  of which already unlocked:        ${drafts.filter((d) => unlockedSet.has(d.codeHash)).length}`);
    console.log(`  to register as legacy unlocks:    ${todo.length}`);
    console.log(`Linked codes overall (keep working): ${totalLinked}`);

    if (!APPLY) {
      console.log('\nInspection only — nothing was written. Re-run with --apply.');
      return;
    }
    if (!todo.length) { console.log('\nNothing to register.'); return; }

    const now = new Date();
    const r = await db.collection('reportUnlocks').insertMany(todo.map((d) => ({
      unlockId: `legacy_${crypto.randomBytes(12).toString('hex')}`,
      method: 'legacy',
      reference: 'beta',
      referenceHint: '',
      codeHash: d.codeHash,
      amountCents: 0,
      currency: 'EUR',
      unlockedAt: d.at || now,
      refundableUntil: null,
      status: 'active',
    })));
    console.log(`\nRegistered ${r.insertedCount} legacy unlock(s).`);
  } finally {
    await client.close();
  }
})().catch((err) => {
  console.error('Backfill failed:', err.message);
  process.exit(1);
});
