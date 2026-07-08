// Restore the KAART_GIFT captured in the original rerun output (the saved analysis
// no longer contains it — production's old extractor had already stripped it).
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { MongoClient, ObjectId } = require('mongodb');

const GIFT = 'Jouw gave is dat je puinhoop en instabiliteit verandert in iets dat werkt én blijft staan — maar dan zonder de leugen die de meeste systemen nodig hebben om overeind te blijven. Je bouwt structuur die kan ademen: een orde die zichzelf blijft toetsen op eerlijkheid en durft te hervormen zodra ze stagneert. In de praktijk betekent dit dat mensen op je bouwen omdat je de waarheid zegt die het geheel gezond houdt, ook wanneer die niet welkom is.';

(async () => {
  const c = new MongoClient(process.env.MONGODB_URI);
  await c.connect();
  const db = c.db();
  const user = await db.collection('users').findOne({ _id: new ObjectId('6a482814bd47be217a8c87cd') });
  await db.collection('users').updateOne({ _id: user._id }, { $set: { 'orbHistory.1.giftMicro': GIFT } });
  await db.collection('kaartDrafts').updateOne({ codeHash: user.orbHistory[1].codeHash }, { $set: { giftMicro: GIFT } });
  const check = await db.collection('users').findOne({ _id: user._id });
  console.log('giftMicro restored (' + check.orbHistory[1].giftMicro.length + ' chars)');
  console.log('geomSummary present (' + String(check.orbHistory[1].geomSummary || '').length + ' chars)');
  await c.close();
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
