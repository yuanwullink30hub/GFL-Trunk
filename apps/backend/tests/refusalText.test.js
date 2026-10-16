/**
 * N1 refusal free text (Privacy & Consent instruction v0.1.1 §4.2, §4.7, §5; acceptance tests 2, 4, 7, 8):
 * opt-in only, identifiers stripped, exactly four fields stored (text encrypted), no id of any kind, nothing
 * logged, deleted 12 months after its month.
 */
const h = require('./helpers');
delete process.env.REFUSAL_TEXT_MONGODB_URI;
const test = require('node:test');
const { before, after } = test;
const assert = require('node:assert/strict');
const { MongoClient } = require('mongodb');
const N1 = require('../services/refusalTextStore');
const { decrypt } = require('../services/encryption');

before(h.start);
after(async () => { await N1.close(); await h.stop(); });

const VERSION = N1.CURRENT_CONSENT.nl;
const Q = require('../engine/data/question_bank_leerling_v1_0.json').questions.map((q) => q.question_id);
const ok = (texts) => ({ consent: true, consentVersion: VERSION, cards: texts.map((text, i) => ({ question_id: Q[i], text })) });

test('§4.2: obvious direct identifiers are stripped — e-mail, phone, URL — and ordinary numbers stay', () => {
  assert.equal(N1.stripIdentifiers('mail me op jan.de.vries@example.nl aub'), 'mail me op [e-mail] aub');
  assert.equal(N1.stripIdentifiers('bel 06-12345678 of +31 6 1234 5678'), 'bel [telefoon] of [telefoon]');
  assert.equal(N1.stripIdentifiers('zie https://example.com/x?y=1 en www.voorbeeld.nl'), 'zie [link] en [link]');
  assert.equal(N1.stripIdentifiers('mijnsite.nl/over-mij'), '[link]');
  assert.equal(N1.stripIdentifiers('3 keer per week, sinds 2019, 50 %'), '3 keer per week, sinds 2019, 50 %');
});

test('a submission without explicit consent, with an unknown consent version or out of bounds is refused, never coerced', () => {
  const bad = [
    null, { ...ok(['x']), consent: false }, { ...ok(['x']), consent: 'yes' }, { ...ok(['x']), consentVersion: 'n1-nl-v9' },
    ok([]), ok(['a', 'b', 'c', 'd', 'e', 'f']), ok([42]), ok(['x'.repeat(N1.MAX_TEXT + 1)]), { consent: true, consentVersion: VERSION },
    { ...ok([]), texts: ['x'] },                                                              // bare strings: a text names its question
    { ...ok([]), cards: [{ question_id: 'leerling-onbekend-99', text: 'x' }] },               // not a question of the bank
    { ...ok([]), cards: [{ question_id: 'jan@example.nl', text: 'x' }] },                     // so the field can carry nothing else
    { ...ok([]), cards: [{ text: 'x' }] },
    { ...ok([]), cards: [{ question_id: Q[0], text: 'x' }, { question_id: Q[0], text: 'y' }] }, // one card per question
    { ...ok([]), cards: [{ question_id: Q[0], text: 'x', position: 3 }] },                    // no position, no extra field
  ];
  for (const b of bad) assert.throws(() => N1.buildEntries(b), N1.RefusalTextInputError, JSON.stringify(b)?.slice(0, 60));
});

test('test 2 (+ owner, 13 Oct: the question): an entry carries only its question, text, consent version, month and scope; skipped cards are dropped', () => {
  const entries = N1.buildEntries(ok(['  Ik had gezegd: rust.  ', '', '   ', 'mail x@y.nl']), new Date('2026-10-31T23:30:00Z'));
  assert.deepEqual(entries, [
    { question_id: Q[0], text: 'Ik had gezegd: rust.', consent_version: VERSION, month: '2026-11', scope: 'refusal_text_quality' }, // Amsterdam is already in November
    { question_id: Q[3], text: 'mail [e-mail]', consent_version: VERSION, month: '2026-11', scope: 'refusal_text_quality' },
  ]);
  const doc = N1.storedDoc(entries[0]);
  assert.deepEqual(Object.keys(doc).sort(), ['_id', 'consent_version', 'month', 'question_id', 'scope', 'text']);
  assert.equal(doc.question_id, Q[0], 'the question id is stored in the clear: it names a question, not a person');
  assert.match(doc._id, /^[0-9a-f]{24}$/, 'a random key — never an ObjectId with its creation time');
  assert.notEqual(doc.text, entries[0].text);
  assert.equal(decrypt(doc.text), entries[0].text, 'encrypted at rest (§5.5)');
  assert.throws(() => N1.storedDoc({ ...entries[0], session_id: 'abc' }), /exactly/);
  assert.throws(() => N1.storedDoc(entries[0], (t) => t), /encrypted/, 'no key → no plaintext write');
});

test('test 8: every consent text has a version id; the shown version is the stored one', () => {
  const c = N1.consentText('nl');
  assert.equal(c.version, VERSION);
  assert.ok(N1.CONSENT_TEXTS[c.version]);
  assert.equal(N1.consentText('en'), null, 'no English text until one is approved');
  assert.equal(N1.buildEntries(ok(['x']))[0].consent_version, c.version);
});

test('test 7: the retention job deletes every entry 12 or more months back, by its stored month', async () => {
  assert.equal(N1.monthsBefore('2026-10', 12), '2025-10');
  assert.equal(N1.monthsBefore('2026-01', 1), '2025-12');
  const client = new MongoClient(process.env.MONGODB_URI.replace(/\/gfl-test/, '/n1-retention'));
  await client.connect();
  try {
    const c = client.db().collection('refusal_texts');
    await c.insertMany(['2025-09', '2025-10', '2025-11', '2026-10'].map((month, i) => ({ _id: String(i), month })));
    assert.equal(await N1.purgeExpired(new Date('2026-10-15T12:00:00Z'), c), 2);
    assert.deepEqual((await c.find().toArray()).map((d) => d.month).sort(), ['2025-11', '2026-10']);
  } finally { await client.close(); }
});

test('the endpoint: 503 without its own store; 400 / 204 / 404 with it; stored rows are the five fields, each text with its question; nothing logged', async () => {
  const base = await h.serve([['/api/refusal-text', require('../routes/refusalText')]]);
  assert.equal((await h.post(`${base}/api/refusal-text`, ok(['x']))).status, 503, 'no store → no N1 step');

  process.env.REFUSAL_TEXT_MONGODB_URI = process.env.MONGODB_URI.replace(/\/gfl-test/, '/n1-store');
  const consent = await (await fetch(`${base}/api/refusal-text/consent?lang=nl`)).json();
  assert.equal(consent.version, VERSION);
  assert.equal((await fetch(`${base}/api/refusal-text/consent?lang=en`)).status, 404);

  const logged = [];
  const orig = { log: console.log, warn: console.warn, error: console.error };
  for (const k of Object.keys(orig)) console[k] = (...a) => { logged.push(a.join(' ')); };
  const secret = 'Mijn geheime antwoord over mijn gezondheid';
  let r;
  try {
    assert.equal((await h.post(`${base}/api/refusal-text`, { ...ok([secret]), consent: false })).status, 400);
    r = await h.post(`${base}/api/refusal-text`, ok([secret, 'tweede', 'derde', 'vierde', 'bel 0612345678']));
    assert.equal(await N1.flushQueue(), 5);
  } finally { Object.assign(console, orig); }
  assert.equal(r.status, 204);
  assert.ok(!logged.some((l) => l.includes(secret) || l.includes('0612345678')), 'test 4: no text in any log');

  const client = new MongoClient(process.env.REFUSAL_TEXT_MONGODB_URI);
  await client.connect();
  try {
    const docs = await client.db().collection('refusal_texts').find().toArray();
    assert.equal(docs.length, 5);
    for (const d of docs) assert.deepEqual(Object.keys(d).sort(), ['_id', 'consent_version', 'month', 'question_id', 'scope', 'text']);
    // each text stays with its own question
    const byQuestion = Object.fromEntries(docs.map((d) => [d.question_id, decrypt(d.text)]));
    assert.deepEqual(byQuestion, { [Q[0]]: secret, [Q[1]]: 'tweede', [Q[2]]: 'derde', [Q[3]]: 'vierde', [Q[4]]: 'bel [telefoon]' });
    assert.ok(!docs.some((d) => d.text.includes('geheime')), 'ciphertext only');
  } finally { await client.close(); delete process.env.REFUSAL_TEXT_MONGODB_URI; }
});
