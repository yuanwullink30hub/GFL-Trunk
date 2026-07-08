// Re-run the Maverick analysis for the dev test account with the UPDATED master
// prompt (section 15 Kaart Microcopy), exactly as if the test was just made:
// rebuilds the /api/ai/analyze request from the stored assessment (full 5-mandje
// archetypeDetails + responses + OCEAN), streams the SSE call, then replaces the
// newest orbHistory reading's card fields with the fresh section-15 output.
//
// Usage: node scripts/rerun-maverick.js [apiBase]
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');

const API = process.argv[2] || 'https://gfl-api.onrender.com/api';
const ASSESSMENT_ID = '6a4d05504d55a3ac5ea32bca';
const USER_ID = '6a482814bd47be217a8c87cd';

const LEVENSLES = 'Ik heb de rebellie in mijn leiderschap geïntegreerd — en dat maakt me zeldzaam. Maar de dag dat ik mijn eigen regels breek en het niet meer voel, is de dag dat integriteit een verhaal werd dat ik mezelf vertel, en ik ben wat ik doe, niet wat ik zeg.';

// Dual-core N/C per group — from the Maverick PDF machine block (PROFIEL DATA).
const SUBGROUPS = [
  { group: 'Ruling',     leftLabel: 'Judge',    rightLabel: 'Ruler',     leftNature: 13, leftCulture: 3, rightNature: 0, rightCulture: 0 },
  { group: 'Relational', leftLabel: 'Lover',    rightLabel: 'Caregiver', leftNature: 8,  leftCulture: 1, rightNature: 0, rightCulture: 0 },
  { group: 'Seeker',     leftLabel: 'Innocent', rightLabel: 'Explorer',  leftNature: 3,  leftCulture: 1, rightNature: 0, rightCulture: 0 },
  { group: 'Chaos',      leftLabel: 'Outlaw',   rightLabel: 'Trickster', leftNature: 10, leftCulture: 4, rightNature: 0, rightCulture: 0 },
  { group: 'Abstract',   leftLabel: 'Sage',     rightLabel: 'Artist',    leftNature: 7,  leftCulture: 5, rightNature: 0, rightCulture: 0 },
  { group: 'Agency',     leftLabel: 'Magician', rightLabel: 'Hero',      leftNature: 11, leftCulture: 2, rightNature: 0, rightCulture: 0 },
];

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();

  const doc = await db.collection('assessments').findOne({ _id: new ObjectId(ASSESSMENT_ID) });
  if (!doc) throw new Error('assessment not found');
  console.log('[1/4] Loaded assessment', ASSESSMENT_ID, '-', doc.extendedArchetypeName, '| details:', doc.archetypeDetails.length, '| responses:', doc.responses.length);

  const scores = {};
  for (const d of doc.archetypeDetails) scores[d.key] = d.total;

  const body = {
    provider: 'claude',
    maxTokens: 30000,
    level: 'advanced',
    language: 'nl',
    archetypeKey: doc.archetypeKey,               // RULER
    supportArchetype: 'OUTLAW',
    supportGroup: doc.supportGroup,               // CHAOS
    extendedArchetypeName: doc.extendedArchetypeName, // The Maverick
    shadowArchetype: 'OUTLAW',
    blindspotArchetype: 'TRICKSTER',
    isIndividuated: true,                          // polarization gap 4% -> Hoge Individuatie
    hasHarmonyBonus: false,
    harmonyBonusApplied: 0,
    oceanScores: doc.oceanScores,
    scores,
    archetypeDetails: doc.archetypeDetails,        // full 5-mandje geometry
    responses: doc.responses,
    subgroups: SUBGROUPS,
    levensles: LEVENSLES,
  };

  console.log('[2/4] POST', API + '/ai/analyze', '(SSE, this takes minutes)...');
  const res = await fetch(API + '/ai/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) throw new Error('analyze HTTP ' + res.status);

  // Minimal SSE parser over the fetch stream.
  let buf = '';
  let result = null;
  const decoder = new TextDecoder();
  for await (const chunk of res.body) {
    buf += decoder.decode(chunk, { stream: true });
    let idx;
    while ((idx = buf.indexOf('\n\n')) >= 0) {
      const block = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      const evMatch = block.match(/^event: (.+)$/m);
      const dataMatch = block.match(/^data: (.+)$/m);
      if (!evMatch || !dataMatch) continue; // heartbeat comments
      const ev = evMatch[1];
      const data = JSON.parse(dataMatch[1]);
      if (ev === 'progress') console.log('   progress:', data.stage, '-', data.message);
      else if (ev === 'error') throw new Error('analyze error: ' + data.error);
      else if (ev === 'result') result = data;
    }
  }
  if (!result || !result.analysis) throw new Error('no result received');
  console.log('[3/4] Analysis received:', result.analysis.length, 'chars | provider:', result.provider, '| model:', result.model, '| orbCode len:', (result.orbCode || '').length);

  fs.writeFileSync(require('path').join(__dirname, '..', '..', '..', 'tmp', 'maverick-rerun-analysis.md'), result.analysis);

  // The kaart microcopy was stripped server-side into kaartDrafts (keyed by orb-code
  // hash). Read it back; same geometry -> same orb code -> same hash as the claimed
  // reading on the account.
  const { hash } = require('../services/encryption');
  const codeHash = result.orbCode ? hash(result.orbCode) : null;
  const draft = codeHash ? await db.collection('kaartDrafts').findOne({ codeHash }) : null;
  console.log('--- SECTION 15 / KAART MICROCOPY ---');
  console.log('KAART_GIFT:\n' + (draft?.giftMicro || '(missing!)'));
  console.log('\nKAART_GEOMETRIE:\n' + (draft?.geomSummary || '(missing!)'));

  // Replace the newest orbHistory reading of the dev account with the new card fields.
  const user = await db.collection('users').findOne({ _id: new ObjectId(USER_ID) });
  if (!user || !Array.isArray(user.orbHistory) || !user.orbHistory.length) throw new Error('user/orbHistory not found');
  let newest = 0;
  for (let i = 1; i < user.orbHistory.length; i++) {
    if (new Date(user.orbHistory[i].at || 0) > new Date(user.orbHistory[newest].at || 0)) newest = i;
  }
  const entry = user.orbHistory[newest];
  console.log('[4/4] Newest orbHistory entry:', newest, '| archetype:', entry.archetypeName, '| at:', entry.at, '| codeHash match:', codeHash ? entry.codeHash === codeHash : 'n/a');

  const set = { updatedByRerun: new Date() };
  if (draft?.giftMicro) set[`orbHistory.${newest}.giftMicro`] = draft.giftMicro;
  if (draft?.geomSummary) set[`orbHistory.${newest}.geomSummary`] = draft.geomSummary;
  await db.collection('users').updateOne({ _id: new ObjectId(USER_ID) }, { $set: set });
  console.log('orbHistory entry updated with new giftMicro/geomSummary.');

  // Also store the fresh analysis on the assessment doc (was empty) for dev replay.
  await db.collection('assessments').updateOne(
    { _id: new ObjectId(ASSESSMENT_ID) },
    { $set: { analysis: result.analysis, aiProvider: result.provider, aiModel: result.model, rerunAt: new Date() } }
  );
  console.log('assessment.analysis updated. Full analysis saved to tmp/maverick-rerun-analysis.md');

  await client.close();
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
