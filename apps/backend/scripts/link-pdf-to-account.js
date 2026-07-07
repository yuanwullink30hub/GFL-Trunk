/**
 * TEST HELPER: attach a report-PDF's kristal-code to an account, exactly like the
 * /orb/login extraction + /orb/link flow — but run directly against the DB (no gate).
 *
 * Usage (from apps/backend):
 *   node scripts/link-pdf-to-account.js "<path-to-pdf>" [email]
 * Default email: yuanwullink30@gmail.com (dev profile Yuan Wullink).
 *
 * Does what POST /orb/link does on success:
 *   - claims the code globally (orbCodes, once-only — aborts if already claimed elsewhere)
 *   - appends the orbHistory entry (decoded orb + archetype + extracted reading + kaartDraft merge)
 *   - promotes it to the active publicOrb / archetypeName
 *   - extends accessUntil cumulatively: max(now, current expiry) + 3 months
 */
const crypto = require('crypto');
const fs = require('fs');
const config = require('../config');
const { MongoClient } = require('mongodb');
const { decodeOrb3 } = require('@gfl/orb-engine');
const { extractReading, sanitizeReading } = require('../services/readingExtract');
const { hash } = require('../services/encryption');

const PDF_PATH = process.argv[2];
const TARGET_EMAIL = process.argv[3] || 'yuanwullink30@gmail.com';
const emailHash = (v) => crypto.createHash('sha256').update(String(v || '').toLowerCase().trim()).digest('hex');
const addMonths = (d, n) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; };

(async () => {
  if (!PDF_PATH || !fs.existsSync(PDF_PATH)) throw new Error(`PDF not found: ${PDF_PATH}`);
  if (!config.mongoUri) throw new Error('MONGODB_URI not set in .env');

  // ── Extract code + archetype + reading — same regexes as POST /orb/login ──
  const { PDFParse } = require('pdf-parse');
  const parser = new PDFParse({ data: fs.readFileSync(PDF_PATH) });
  const parsed = await parser.getText();
  const text = parsed.text || '';
  await parser.destroy();

  const stripped = text.replace(/\s+/g, '');
  const marked = stripped.match(/ORB::(LC_ORB[23]?_[A-Za-z0-9+/=]+?)::ORB/);
  const bare = stripped.match(/LC_ORB[23]?_[A-Za-z0-9+/=]{24,}/);
  const code = marked ? marked[1] : (bare ? bare[0] : null);
  if (!code) throw new Error('Geen kristal-code gevonden in deze PDF.');
  let archetypeName = '';
  const archMatch = stripped.match(/ARCH::([A-Za-z0-9+/=]+)::ARCH/);
  if (archMatch) { try { archetypeName = Buffer.from(archMatch[1], 'base64').toString('utf8'); } catch (_) { /* ignore */ } }
  const reading = extractReading(text);
  console.log(`Code: ${code.slice(0, 24)}… | Archetype: ${archetypeName || '—'} | reading extracted: ${!!reading}`);

  const client = new MongoClient(config.mongoUri);
  await client.connect();
  const db = client.db();
  const users = db.collection('users');
  const orbCodes = db.collection('orbCodes');

  const user = await users.findOne({ emailHash: emailHash(TARGET_EMAIL) });
  if (!user) throw new Error(`User not found for ${TARGET_EMAIL}`);
  const userId = String(user._id);

  const codeHash = hash(code);
  const existing = await orbCodes.findOne({ codeHash });
  if (existing) {
    if (String(existing.userId) === userId) { console.log('Already linked to THIS account — nothing to do.'); await client.close(); return; }
    throw new Error('Deze kristal-code is al aan een ANDER account gekoppeld.');
  }

  // kaartDraft merge — the server-authored microcopy rides along, like /orb/link does.
  let kaartDraft = null;
  try { kaartDraft = await db.collection('kaartDrafts').findOne({ codeHash }); } catch { /* ignore */ }
  const cleanReading = sanitizeReading({
    ...(reading || {}),
    ...(kaartDraft && kaartDraft.giftMicro ? { giftMicro: kaartDraft.giftMicro } : {}),
    ...(kaartDraft && kaartDraft.geomSummary ? { geomSummary: kaartDraft.geomSummary } : {}),
  });

  const at = new Date();
  await orbCodes.insertOne({ codeHash, userId, linkedAt: at });

  let orb = null; try { orb = decodeOrb3(code) || null; } catch { /* ignore */ }
  const entry = { codeHash, orb, archetypeName, at, ...(cleanReading || {}) };
  const accessBase = user.accessUntil && new Date(user.accessUntil) > at ? new Date(user.accessUntil) : at;
  const accessUntil = addMonths(accessBase, 3);

  await users.updateOne(
    { _id: user._id },
    {
      $push: { orbHistory: entry },
      $set: { publicOrb: orb, accessUntil, updatedAt: at, ...(archetypeName ? { archetypeName } : {}) },
    }
  );

  console.log(`✅ Linked to ${TARGET_EMAIL} (${userId})`);
  console.log(`   orbHistory entries: ${(user.orbHistory || []).length} → ${(user.orbHistory || []).length + 1}`);
  console.log(`   accessUntil: ${user.accessUntil ? new Date(user.accessUntil).toISOString() : '—'} → ${accessUntil.toISOString()}`);
  console.log(`   next upload gate opens: ${addMonths(at, 2).toISOString()}`);
  console.log(`   kaartDraft merged: ${!!kaartDraft}`);
  await client.close();
})().catch((e) => { console.error('❌', e.message); process.exit(1); });
