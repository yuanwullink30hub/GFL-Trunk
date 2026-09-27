/**
 * Grant admin to an EXISTING account — the one explicit way an account becomes admin.
 *
 * Registration never grants admin (routes/auth.js). It used to make the first-ever registrant an admin,
 * which quietly depended on the database being empty at that exact moment: a new or wiped database
 * handed admin to whoever registered first. After that, only this script or an existing admin (the
 * management app, PATCH /api/admin/users/:id/role) can make an admin.
 *
 * The account must already exist and be registered normally, so it has a password under the current
 * policy. Its existing sessions are ended (tokensValidAfter) so the new role starts from a fresh login.
 *
 * Run from apps/backend, against the database in .env — it writes to it:
 *   node scripts/seed-admin.js --email you@example.com            shows what it would do, changes nothing
 *   node scripts/seed-admin.js --email you@example.com --confirm  grants admin
 */
const config = require('../config'); // loads .env -> config.mongoUri
const { MongoClient } = require('mongodb');
const { hash } = require('../services/encryption');

const argv = process.argv.slice(2);
const email = String(argv[argv.indexOf('--email') + 1] || '').trim().toLowerCase();
const confirm = argv.includes('--confirm');

(async () => {
  if (!argv.includes('--email') || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('Usage: node scripts/seed-admin.js --email you@example.com [--confirm]');
    process.exit(2);
  }
  if (!config.mongoUri) throw new Error('MONGODB_URI not set in .env');

  const client = new MongoClient(config.mongoUri);
  await client.connect();
  try {
    const db = client.db();
    const users = db.collection('users');
    const user = await users.findOne({ emailHash: hash(email) }, { projection: { role: 1, emailVerified: 1 } });
    if (!user) {
      console.error(`No account for ${email} in ${db.databaseName}. Register it first, then run this again.`);
      process.exit(1);
    }
    if (user.role === 'admin') {
      console.log(`${email} is already an admin. Nothing to do.`);
      return;
    }
    if (user.emailVerified === false) {
      console.error(`${email} has not confirmed its email address yet. Confirm it first.`);
      process.exit(1);
    }
    console.log(`Database: ${db.databaseName}\nAccount:  ${email} (${user._id})\nRole:     ${user.role || 'client'} -> admin`);
    if (!confirm) {
      console.log('\nDry run — nothing changed. Add --confirm to grant admin.');
      return;
    }
    const now = new Date();
    await users.updateOne({ _id: user._id }, { $set: { role: 'admin', tokensValidAfter: now, updatedAt: now } });
    await db.collection('devActivity').insertOne({
      expiresAt: new Date(now.getTime() + 90 * 86400 * 1000),
      type: 'admin_login',
      timestamp: now,
      userId: 'SYSTEM',
      email: 'system@gardenforlife.nl',
      message: `ADMIN SEEDED: ${String(user._id)} granted admin by scripts/seed-admin.js`,
      branch: '', hash: '', reportId: null, reportType: '',
    }).catch(() => {});
    console.log(`\n${email} is now an admin. Log in again for the role to apply.`);
  } finally {
    await client.close();
  }
})().catch((e) => { console.error(e.message); process.exit(1); });
