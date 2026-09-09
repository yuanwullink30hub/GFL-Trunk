/**
 * Export account profiles — one-off safety net before the retention change.
 *
 *   node apps/backend/scripts/export-account-profiles.js [outfile]
 *
 * Exports ONLY what belongs to an existing account:
 *   - the account itself (email + display name decrypted, no password hash, no raw code)
 *   - its partial profile (orbHistory — what the account UI actually renders from)
 *   - its computed assessments, which the 24h retention window is about to remove
 *
 * Deliberately NOT exported: assessments with no owner (anonymous runs), feedback
 * reviews, messages, verbond relations. Those are either not account data or not
 * ours to hoard.
 *
 * ⚠ The output file contains Art. 9 personal data in the clear. Keep it off shared
 * drives, encrypt it at rest, and delete it once you no longer need it — the whole
 * point of the retention change is that this data should not be sitting around.
 */
const fs = require('fs');
const path = require('path');
const config = require('../config'); // loads .env → config.mongoUri
const { MongoClient } = require('mongodb');
const { decrypt, isEnabled } = require('../services/encryption');

const OUT = process.argv[2] || path.join(
  process.cwd(),
  'exports',
  `account-profiles-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
);

function safeDecrypt(value) {
  if (!value) return null;
  try { return decrypt(value); } catch { return '[decrypt failed]'; }
}

async function main() {
  if (!config.mongoUri) {
    console.error('❌ MONGODB_URI not set in .env');
    process.exit(1);
  }
  if (!isEnabled()) {
    console.warn('⚠ ENCRYPTION_KEY not set — email/displayName will export as stored, not decrypted.');
  }

  const client = new MongoClient(config.mongoUri);
  await client.connect();

  try {
    const db = client.db();
    const users = await db.collection('users').find({}).toArray();
    console.log(`\n👤 ${users.length} account(s) found\n`);

    const accounts = [];
    let assessmentTotal = 0;
    let withoutAssessments = 0;

    for (const u of users) {
      const userId = String(u._id);
      // Assessments store userId as a string (routes/assessment.js), not an ObjectId.
      const assessments = await db.collection('assessments')
        .find({ userId })
        .sort({ createdAt: -1 })
        .toArray();

      assessmentTotal += assessments.length;
      if (assessments.length === 0) withoutAssessments++;

      accounts.push({
        accountId: userId,
        email: safeDecrypt(u.email),
        displayName: safeDecrypt(u.displayName),
        role: u.role || 'client',
        emailVerified: !!u.emailVerified,
        country: u.country || null,
        age: u.age != null ? u.age : null,
        createdAt: u.createdAt || null,
        accessUntil: u.accessUntil || null,
        listed: u.listed !== false,
        // The partial profile — what the account renders from, and what survives the
        // retention change. Included so this file is a complete picture of the account.
        archetypeName: u.archetypeName || null,
        publicOrb: u.publicOrb || null,
        orbHistory: Array.isArray(u.orbHistory) ? u.orbHistory : [],
        // The computed profiles that the 24h window removes.
        assessments,
      });

      console.log(
        `  ${(safeDecrypt(u.displayName) || userId).padEnd(28)} ` +
        `${String(assessments.length).padStart(3)} assessment(s), ` +
        `${(u.orbHistory || []).length} orb entr(ies)`
      );
    }

    const payload = {
      exportedAt: new Date().toISOString(),
      source: 'GFL account profiles — pre-retention-change export',
      note: 'Contains Art. 9 personal data. Store encrypted, delete when no longer needed.',
      counts: {
        accounts: accounts.length,
        assessments: assessmentTotal,
        accountsWithoutAssessments: withoutAssessments,
      },
      accounts,
    };

    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(payload, null, 2), 'utf8');

    const kb = (fs.statSync(OUT).size / 1024).toFixed(1);
    console.log(`\n✅ ${accounts.length} account(s), ${assessmentTotal} assessment(s) → ${OUT} (${kb} KB)`);
    if (withoutAssessments) {
      console.log(`   ${withoutAssessments} account(s) had no stored assessment (already expired, or created via PDF upload).`);
    }
    console.log('\n⚠ This file contains personal data in the clear. Keep it offline and delete it when done.\n');
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error('❌ Export failed:', err.message);
  process.exit(1);
});
