/**
 * ONE-OFF CLEANUP — remove the remnants of the retired beta passkey gate.
 *
 * Two things are left over after the gate was removed (2026-09-09):
 *   1. devActivity documents of type 'passkey_use' — nothing writes them any
 *      more and the read surface (GET /api/admin/passkeys/audit + the Passkeys
 *      folder in the audit tab) is gone, so they are unreachable.
 *   2. passkeys documents that are NOT the admin passkey — /api/beta/verify now
 *      matches { isActive: true, isAdminPasskey: true }, so these can no longer
 *      validate anything.
 *
 * The admin passkey is the ONLY way into the mobile admin portal. This script
 * therefore refuses to delete anything unless it can first see exactly one
 * active admin passkey — deleting it would lock the operator out.
 *
 * Run from apps/backend:
 *   node scripts/cleanup-passkey-remnants.js            # inspect only, writes nothing
 *   node scripts/cleanup-passkey-remnants.js --apply    # delete
 */
const config = require('../config');
const { MongoClient } = require('mongodb');

const APPLY = process.argv.includes('--apply');

/** Never print a usable code — show only enough to recognise the row. */
const mask = (code) => {
  const s = String(code || '');
  return s.length <= 2 ? '**' : s[0] + '*'.repeat(s.length - 2) + s[s.length - 1];
};

(async () => {
  if (!config.mongoUri) throw new Error('MONGODB_URI not set in .env');
  const client = new MongoClient(config.mongoUri);
  await client.connect();
  const db = client.db();

  try {
    // ── 1. devActivity: what is in there, by type ──────────────────────────
    const byType = await db.collection('devActivity').aggregate([
      { $group: { _id: '$type', n: { $sum: 1 } } },
      { $sort: { n: -1 } },
    ]).toArray();

    console.log('devActivity by type:');
    for (const t of byType) console.log(`  ${String(t._id).padEnd(18)} ${t.n}`);
    const passkeyUse = (byType.find((t) => t._id === 'passkey_use') || {}).n || 0;

    // ── 2. passkeys: admin vs the rest ─────────────────────────────────────
    const passkeys = await db.collection('passkeys').find({}).toArray();
    const admins = passkeys.filter((p) => p.isAdminPasskey);
    const others = passkeys.filter((p) => !p.isAdminPasskey);

    console.log(`\npasskeys (${passkeys.length} total):`);
    for (const p of passkeys) {
      const tag = p.isAdminPasskey ? 'ADMIN' : 'beta ';
      const act = p.isActive ? 'active  ' : 'inactive';
      console.log(`  ${tag} ${act} ${mask(p.code)}  uses=${p.usageCount || 0}  label=${p.label || '-'}`);
    }

    // ── 3. Safety gate — the admin passkey is the only mobile admin login ──
    const activeAdmins = admins.filter((p) => p.isActive);
    if (activeAdmins.length !== 1) {
      console.log(
        `\nREFUSING TO DELETE: expected exactly 1 active admin passkey, found ${activeAdmins.length}.` +
        `\nDeleting now could remove the only way into the mobile admin portal.` +
        `\nFix the isAdminPasskey / isActive flags first, then re-run.`
      );
      return;
    }

    console.log(`\nWould delete:`);
    console.log(`  devActivity 'passkey_use' : ${passkeyUse}`);
    console.log(`  non-admin passkeys        : ${others.length}`);
    console.log(`Would KEEP the 1 active admin passkey and every consent_given / admin_login entry.`);

    if (!APPLY) {
      console.log('\nInspection only — nothing was written. Re-run with --apply to delete.');
      return;
    }

    const a = await db.collection('devActivity').deleteMany({ type: 'passkey_use' });
    const b = await db.collection('passkeys').deleteMany({ isAdminPasskey: { $ne: true } });
    console.log(`\nDeleted ${a.deletedCount} passkey_use entr(y/ies) and ${b.deletedCount} non-admin passkey(s).`);

    const left = await db.collection('passkeys').countDocuments();
    const consents = await db.collection('devActivity').countDocuments({ type: 'consent_given' });
    console.log(`Remaining: ${left} passkey(s), ${consents} consent record(s) untouched.`);
  } finally {
    await client.close();
  }
})().catch((err) => {
  console.error('Cleanup failed:', err.message);
  process.exit(1);
});
