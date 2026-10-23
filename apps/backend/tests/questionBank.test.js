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
  assert.equal(q1.text, require('../engine/data/question_bank_leerling_v1_0.json').questions[0].text);
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
  assert.equal((await call('GET', '/api/questions/bank/expert', { token: admin })).status, 404);

  // the live test still serves the ratified text
  r = await call('GET', '/api/questions/two-layer');
  const served = () => r.body.subjects.flatMap((s) => s.questions).find((q) => q.id === Q1);
  assert.equal(served().text, require('../engine/data/question_bank_leerling_v1_0.json').questions[0].text);
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

test('Gevorderd has its own bank (owner, 21 Oct): served by level, edited and published apart from Leerling', async () => {
  const admin = await account('admin');
  const G1 = 'gevorderd-zelf_zonde-01';
  const gBank = require('../engine/data/question_bank_gevorderd_v1_0.json');

  // the public plan by level: its own questions, its own rotation sequence; an unknown level is refused
  let r = await call('GET', '/api/questions/two-layer?level=gevorderd');
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.level, 'gevorderd');
  assert.match(r.body.rotation_sequence_id, /^gevorderd:\d{4}-Q\d:[0-9a-f]{12}$/);
  assert.deepEqual(r.body.subjects.map((s) => s.questions.length), [9, 9, 6, 6, 6]);
  const servedG = () => r.body.subjects.flatMap((s) => s.questions).find((q) => q.id === G1);
  assert.equal(servedG().text, gBank.questions[0].text);
  assert.ok(servedG().l1.every((a) => a.text.length > 0) && servedG().l2.every((a) => a.text.length > 0));
  assert.equal((await call('GET', '/api/questions/two-layer?level=expert')).status, 404);
  const leerling = await call('GET', '/api/questions/two-layer');
  assert.equal(leerling.body.level, 'leerling');

  // the editor opens Gevorderd: 36 drafts from its own file, all live
  r = await call('GET', '/api/questions/bank/gevorderd', { token: admin });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.questions.length, 36);
  assert.ok(r.body.questions.every((q) => q.live && q.level === 'gevorderd'));
  assert.equal(r.body.serving.kind, 'file');

  // an edit and a publish change Gevorderd only
  r = await call('PATCH', `/api/questions/bank/gevorderd/${G1}`, { token: admin, body: { version: 1, text: 'Een nieuwe Gevorderd-vraag?' } });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  r = await call('POST', '/api/questions/bank/gevorderd/publish', { token: admin });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  r = await call('GET', '/api/questions/two-layer?level=gevorderd');
  assert.equal(servedG().text, 'Een nieuwe Gevorderd-vraag?');
  const after = await call('GET', '/api/questions/two-layer');
  assert.deepEqual(after.body, leerling.body, 'Leerling is untouched by a Gevorderd publish');
});

test('Beginner has its own bank (owner, 23 Oct): 36 questions, 648 answers, served and editable by level', async () => {
  const admin = await account('admin');
  const bBank = require('../engine/data/question_bank_beginner_v1_0.json');
  assert.equal(bBank.questions.length, 36);
  assert.equal(bBank.questions.reduce((n, q) => n + q.l1_answers.length + q.l2_answers.length, 0), 648);
  assert.ok(bBank.questions.every((q) => q.text && q.l1_answers.every((a) => a.text) && q.l2_answers.every((a) => a.text)));
  // '*' marks a highlight in an answer (owner, 23 Oct: the Beginner Flow Sheet keeps them): always in pairs,
  // never in a question text, which shows them literally.
  assert.ok(bBank.questions.every((q) => !q.text.includes('*')), 'no asterisks in a question text');
  assert.ok(bBank.questions.every((q) => [...q.l1_answers, ...q.l2_answers].every((a) => (a.text.match(/\*/g) || []).length % 2 === 0)),
    'every highlight in an answer is closed');

  let r = await call('GET', '/api/questions/two-layer?level=beginner');
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.level, 'beginner');
  assert.match(r.body.rotation_sequence_id, /^beginner:\d{4}-Q\d:[0-9a-f]{12}$/);
  assert.deepEqual(r.body.subjects.map((s) => s.questions.length), [9, 9, 6, 6, 6]);
  const first = r.body.subjects.flatMap((s) => s.questions).find((q) => q.id === bBank.questions[0].question_id);
  assert.equal(first.text, bBank.questions[0].text);

  r = await call('GET', '/api/questions/bank/beginner', { token: admin });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.questions.length, 36);
  assert.ok(r.body.questions.every((q) => q.live && q.level === 'beginner'));
});

test('every level with a bank has a valid rotation for the next eight quarters', () => {
  const B = require('../services/twoLayerBank');
  assert.deepEqual(B.LEVELS, ['leerling', 'gevorderd', 'beginner']);
  for (const level of B.LEVELS) {
    for (const q of B.quartersFrom(new Date(), 8)) {
      const plan = B.twoLayerPlanFor(q, level);
      assert.equal(plan.level, level);
      assert.equal(plan.subjects.flatMap((s) => s.questions).length, 36, `${level} ${q}`);
    }
  }
  const { buildQuestionsFile } = require('../services/questionsPublisher');
  assert.equal(typeof buildQuestionsFile, 'function');
});
