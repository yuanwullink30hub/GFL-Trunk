// Edit Yuan's stored geomSummary: replace the opening two sentences with the
// user's shorter line; the rest of the text stays untouched.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { MongoClient, ObjectId } = require('mongodb');

const NEW_OPENING = 'De rechter en de held trekken zwaar in je profiel, ze geven je oordeel gewicht en uitvoerings kracht.';
// Everything up to and including "je uitvoering kracht." gets replaced.
const OLD_OPENING_END = 'je uitvoering kracht.';

(async () => {
  const c = new MongoClient(process.env.MONGODB_URI);
  await c.connect();
  const db = c.db();
  const user = await db.collection('users').findOne({ _id: new ObjectId('6a482814bd47be217a8c87cd') });
  const cur = String(user.orbHistory[1].geomSummary || '');
  const idx = cur.indexOf(OLD_OPENING_END);
  if (idx < 0) { console.error('opening marker not found — geomSummary starts with:', cur.slice(0, 120)); process.exit(1); }
  const next = NEW_OPENING + cur.slice(idx + OLD_OPENING_END.length);
  await db.collection('users').updateOne({ _id: user._id }, { $set: { 'orbHistory.1.geomSummary': next } });
  await db.collection('kaartDrafts').updateOne({ codeHash: user.orbHistory[1].codeHash }, { $set: { geomSummary: next } });
  console.log('geomSummary updated (' + next.length + ' chars). New opening:');
  console.log(next.slice(0, 200) + '…');
  await c.close();
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
