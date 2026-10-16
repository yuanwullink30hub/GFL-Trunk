/**
 * The admin question-bank editor (owner, 16 Oct 2026): drafts seed from the ratified bank, every save is pinned
 * to the version the editor saw, nothing reaches respondents until publish, and publish swaps the bank the
 * two-layer test serves. Admin only.
 */
const h = require('./helpers');
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

let base;
before(async () => {
  await h.start();
  base = await h.serve([
    ['/api/auth', require('../routes/auth')],
    ['/api/questions', require('../routes/questions')],
  ]);
});
after(h.stop);

const STRONG = 'kerkklok-vlieger-47-regenboog';
let seq = 0;
let addr = 0;
async function call(method, path, { token, body } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'cf-connecting-ip': `198.51.100.${(++addr % 250) + 1}`,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* not JSON */ }
  return { status: res.status, body: json };
}

async function account(role) {
  const email = `bank${Date.now()}-${++seq}@example.com`;
  const r = await call('POST', '/api/auth/register', { body: { email, password: STRONG, displayName: `b${Date.now()}${seq}` } });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  if (role) {
    const { ObjectId } = require('mongodb');
    await require('../db').collections.users().updateOne({ _id: new ObjectId(String(r.body.user.id)) }, { $set: { role } });
    require('../middleware/auth').forgetAccount(String(r.body.user.id));
  }
  return r.body.token;
}

const Q1 = 'leerling-zelf_zonde-01';

test('admin only: no token 401, a client 403', async () => {
  assert.equal((await call('GET', '/api/questions/bank/leerling')).status, 401);
  const client = await account();
  assert.equal((await call('GET', '/api/questions/bank/leerling', { token: client })).status, 403);
  assert.equal((await call('PATCH', `/api/questions/bank/leerling/${Q1}`, { token: client, body: { version: 1, text: 'x' } })).status, 403);
  assert.equal((await call('POST', '/api/questions/bank/leerling/publish', { token: client })).status, 403);
});

test('drafts seed from the ratified bank, save pinned to a version, publish swaps the served bank', async () => {
  const admin = await account('admin');

  // first open: 36 drafts from the ratified file, all identical to what the test serves
  let r = await call('GET', '/api/questions/bank/leerling', { token: admin });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.questions.length, 36);
  assert.deepEqual(r.body.questions.map((q) => q.position), Array.from({ length: 36 }, (_, i) => i + 1));
  assert.ok(r.body.questions.every((q) => q.live && q.version === 1));
  assert.equal(r.body.published, null);
  assert.equal(r.body.serving.kind, 'file');
  const q1 = r.body.questions[0];
  assert.equal(q1.text, 'Wat vergeef je jezelf het moeilijkst?');
  assert.equal(Object.keys(q1.l1).length, 6);
  assert.equal(Object.keys(q1.l2).length, 12);

  // a save bumps the version; the draft is no longer what the test serves
  r = await call('PATCH', `/api/questions/bank/leerling/${Q1}`, { token: admin, body: { version: 1, text: 'Wat vergeef je jezelf het minst?' } });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.question.version, 2);
  assert.equal(r.body.question.live, false);

  // a second tab still on version 1 is refused and handed the current draft
  r = await call('PATCH', `/api/questions/bank/leerling/${Q1}`, { token: admin, body: { version: 1, l2: { Judge: 'ander' } } });
  assert.equal(r.status, 409);
  assert.equal(r.body.current.version, 2);
  assert.equal(r.body.current.text, 'Wat vergeef je jezelf het minst?');

  // bad input
  for (const body of [{ version: 2, l2: { Wizard: 'x' } }, { version: 2, l1: { Judge: 'x' } }, { version: 2, colour: 'x' }, { version: 2, text: 7 }, { version: 2 }, { text: 'x' }]) {
    assert.equal((await call('PATCH', `/api/questions/bank/leerling/${Q1}`, { token: admin, body })).status, 400, JSON.stringify(body));
  }
  assert.equal((await call('PATCH', '/api/questions/bank/leerling/leerling-nope-01', { token: admin, body: { version: 1, text: 'x' } })).status, 404);
  assert.equal((await call('GET', '/api/questions/bank/beginner', { token: admin })).status, 404);

  // the live test still serves the ratified text
  r = await call('GET', '/api/questions/two-layer');
  const served = () => r.body.subjects.flatMap((s) => s.questions).find((q) => q.id === Q1);
  assert.equal(served().text, 'Wat vergeef je jezelf het moeilijkst?');
  const rotation = r.body.rotation_sequence_id;

  // an empty answer blocks publishing, by name
  r = await call('PATCH', `/api/questions/bank/leerling/${Q1}`, { token: admin, body: { version: 2, l2: { Hero: '  ' } } });
  assert.equal(r.status, 200);
  r = await call('POST', '/api/questions/bank/leerling/publish', { token: admin });
  assert.equal(r.status, 400);
  assert.deepEqual(r.body.problems, ['Q1: Hero (laag 2) is leeg']);

  r = await call('PATCH', `/api/questions/bank/leerling/${Q1}`, { token: admin, body: { version: 3, l2: { Hero: 'Een nieuw antwoord.' } } });
  assert.equal(r.status, 200);
  r = await call('POST', '/api/questions/bank/leerling/publish', { token: admin });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.revision, 1);
  assert.equal(r.body.file.published, false, 'no R2 in tests: the file upload is skipped, the publish stands');

  // the test now serves the published texts, with the same rotation sequence
  r = await call('GET', '/api/questions/two-layer');
  assert.equal(served().text, 'Wat vergeef je jezelf het minst?');
  assert.equal(served().l2.find((a) => a.archetype === 'Hero').text, 'Een nieuw antwoord.');
  assert.equal(r.body.rotation_sequence_id, rotation);

  r = await call('GET', '/api/questions/bank/leerling', { token: admin });
  assert.ok(r.body.questions.every((q) => q.live), 'after publishing every draft is live');
  assert.equal(r.body.published.revision, 1);
  assert.equal(r.body.serving.kind, 'published');
});

test('the served bank only accepts the ratified question ids', () => {
  const { useBank } = require('../services/twoLayerBank');
  const bank = JSON.parse(JSON.stringify(require('../engine/data/question_bank_leerling_v1_0.json')));
  bank.questions[0].question_id = 'leerling-zelf_zonde-99';
  assert.throws(() => useBank(bank, { kind: 'published' }), /ratified question ids/);
});
