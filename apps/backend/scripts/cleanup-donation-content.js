/**
 * ONE-OFF CLEANUP — remove the donation content stored in siteSettings.feedback-email.
 *
 * The donation QR code (Tikkie), its admin uploader and the PDF's donation line were
 * removed from the code. Two things remain in production data:
 *   1. imageBase64 / imageMimeType — the uploaded QR image. Nothing reads it any more.
 *   2. The donation clause inside the admin-editable feedback-email text:
 *        "..., toch is elke kleine donatie een extra boost voor ons project om er nog
 *         betere resultaten uit te halen."
 *
 * The rest of the email text (greeting, thanks, signature) is left exactly as it is.
 * The script refuses to touch the text unless it finds that clause exactly once.
 *
 * Run from apps/backend:
 *   node scripts/cleanup-donation-content.js            # inspect only, writes nothing
 *   node scripts/cleanup-donation-content.js --apply    # write
 */
const config = require('../config');
const { MongoClient } = require('mongodb');

const APPLY = process.argv.includes('--apply');

// ", <newline> toch is elke kleine donatie ... te halen." -> "."
const DONATION_CLAUSE = /,[ \t]*\r?\n?[ \t]*toch is elke kleine donatie[^\n]*?\./gi;

(async () => {
  if (!config.mongoUri) throw new Error('MONGODB_URI not set in .env');
  const client = new MongoClient(config.mongoUri);
  await client.connect();
  const col = client.db().collection('siteSettings');

  try {
    const doc = await col.findOne({ _id: 'feedback-email' });
    if (!doc) { console.log('No feedback-email settings document — nothing to do.'); return; }

    const text = doc.text || '';
    const matches = text.match(DONATION_CLAUSE) || [];
    const hasImage = !!(doc.imageBase64 || doc.imageMimeType);
    const newText = matches.length === 1 ? text.replace(DONATION_CLAUSE, '.') : text;

    console.log(`Stored image: ${hasImage ? `yes (${doc.imageMimeType}, ${(doc.imageBase64 || '').length} base64 chars)` : 'none'}`);
    console.log(`Donation clause matches: ${matches.length}`);

    if (matches.length > 1) {
      console.log('\nREFUSING to edit the text: the donation clause matched more than once, so a');
      console.log('mechanical replace could remove wording that was meant to stay. Edit it in the');
      console.log('admin console instead. (The image will still be removed.)');
    }

    console.log('\n--- text BEFORE ---\n' + text);
    if (newText !== text) console.log('\n--- text AFTER ---\n' + newText);
    else if (matches.length === 0) console.log('\n(no donation clause found — text unchanged)');

    if (!APPLY) {
      console.log('\nInspection only — nothing was written. Re-run with --apply.');
      return;
    }

    const update = { $set: { updatedAt: new Date() } };
    if (newText !== text) update.$set.text = newText;
    if (hasImage) update.$unset = { imageBase64: '', imageMimeType: '' };

    if (newText === text && !hasImage) { console.log('\nNothing to change.'); return; }

    const r = await col.updateOne({ _id: 'feedback-email' }, update);
    console.log(`\nUpdated (matched ${r.matchedCount}, modified ${r.modifiedCount}).`);

    const after = await col.findOne({ _id: 'feedback-email' });
    console.log(`Verify — image fields present: ${'imageBase64' in after || 'imageMimeType' in after} | ` +
                `donation text present: ${/donati/i.test(after.text || '')}`);
  } finally {
    await client.close();
  }
})().catch((err) => {
  console.error('Cleanup failed:', err.message);
  process.exit(1);
});
