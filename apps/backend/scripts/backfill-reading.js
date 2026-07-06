/**
 * One-off: extract the reading fields (Main/Support, shapeVector12, 5-mandje baskets12)
 * from a report PDF and stamp them on a user's orbHistory entry — the same extraction
 * the /orb/login → /orb/link flow performs, applied directly for backfill.
 *
 * Matches the history entry by the PDF's own ORB-code hash (falls back to the latest
 * entry). The PDF is read once and discarded; only the allowlisted fields are stored.
 *
 * Run from apps/backend:  node scripts/backfill-reading.js "<path-to-report.pdf>" "<visual name>"
 */
const fs = require('fs');
const crypto = require('crypto');
const config = require('../config'); // loads .env → config.mongoUri
const { MongoClient } = require('mongodb');
const { extractReading } = require('../services/readingExtract');

const pdfPath = process.argv[2];
const targetName = process.argv[3] || 'yuan wullink';

const h = (v) => crypto.createHash('sha256').update(String(v || '').toLowerCase().trim()).digest('hex');
const nameKey = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();

(async () => {
  if (!pdfPath || !fs.existsSync(pdfPath)) throw new Error(`PDF niet gevonden: ${pdfPath}`);
  if (!config.mongoUri) throw new Error('MONGODB_URI not set in .env');

  // ── Parse the PDF exactly like /orb/login does ──
  const { PDFParse } = require('pdf-parse');
  const parser = new PDFParse({ data: fs.readFileSync(pdfPath) });
  const parsed = await parser.getText();
  await parser.destroy();
  const text = parsed.text || '';
  const stripped = text.replace(/\s+/g, '');

  const reading = extractReading(text);
  if (!reading) throw new Error('Geen reading-velden gevonden in deze PDF.');
  const marked = stripped.match(/ORB::(LC_ORB[23]?_[A-Za-z0-9+/=]+?)::ORB/);
  const codeHash = marked ? h(marked[1]) : null;
  console.log('extracted:', {
    main: reading.archetypeMainId, support: reading.archetypeSupportId,
    vector: !!reading.shapeVector12, baskets: !!reading.baskets12, codeFound: !!marked,
  });

  // ── Stamp the matching orbHistory entry ──
  const client = new MongoClient(config.mongoUri);
  await client.connect();
  const users = client.db().collection('users');
  let user = await users.findOne({ nameHash: h(nameKey(targetName)) });
  if (!user) user = await users.findOne({ emailHash: h('yuanwullink30@gmail.com') }); // fallback: known account email
  if (!user) throw new Error(`User niet gevonden: ${targetName}`);

  const hist = Array.isArray(user.orbHistory) ? user.orbHistory : [];
  if (!hist.length) throw new Error('Account heeft geen orbHistory.');
  let idx = codeHash ? hist.findIndex((e) => e.codeHash === codeHash) : -1;
  if (idx === -1) idx = hist.length - 1; // fallback: the active reading

  const set = { updatedAt: new Date() };
  for (const [k, v] of Object.entries(reading)) set[`orbHistory.${idx}.${k}`] = v;
  const r = await users.updateOne({ _id: user._id }, { $set: set });
  console.log(`✅ ${String(user._id)} | entry ${idx}/${hist.length - 1} | matched ${r.matchedCount} modified ${r.modifiedCount}`);
  await client.close();
})().catch((e) => { console.error('❌', e.message); process.exit(1); });
