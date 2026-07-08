// One-shot repair: re-extract section 15 (Kaart Microcopy) from the rerun analysis
// with the PATCHED delimiter-tolerant extractor, then store the clean fields on the
// dev account's newest reading + kaartDrafts, and strip the section from the saved
// analysis (production ran the old colon-only extractor, which leaked).
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');
const { extractKaartSection } = require('../services/readingExtract');

(async () => {
  const c = new MongoClient(process.env.MONGODB_URI);
  await c.connect();
  const db = c.db();

  const doc = await db.collection('assessments').findOne({ _id: new ObjectId('6a4d05504d55a3ac5ea32bca') });
  const kaart = extractKaartSection(doc.analysis);
  console.log('re-extracted — gift:', kaart.giftMicro.length, 'chars | geometrie:', kaart.geomSummary.length, 'chars');
  console.log('cleaned analysis still contains KAART_:', /KAART_/.test(kaart.cleaned));
  console.log('\n=== KAART_GIFT ===\n' + kaart.giftMicro);
  console.log('\n=== KAART_GEOMETRIE ===\n' + kaart.geomSummary);

  const user = await db.collection('users').findOne({ _id: new ObjectId('6a482814bd47be217a8c87cd') });
  const entry = user.orbHistory[1];
  await db.collection('users').updateOne(
    { _id: user._id },
    { $set: { 'orbHistory.1.giftMicro': kaart.giftMicro, 'orbHistory.1.geomSummary': kaart.geomSummary } }
  );
  await db.collection('kaartDrafts').updateOne(
    { codeHash: entry.codeHash },
    { $set: { giftMicro: kaart.giftMicro, geomSummary: kaart.geomSummary, at: new Date() } },
    { upsert: true }
  );
  await db.collection('assessments').updateOne(
    { _id: doc._id },
    { $set: { analysis: kaart.cleaned } }
  );
  fs.writeFileSync(path.join(__dirname, '..', '..', '..', 'tmp', 'maverick-rerun-analysis.md'), kaart.cleaned);
  console.log('\norbHistory[1], kaartDrafts, assessment.analysis and tmp file updated with clean values.');
  await c.close();
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
