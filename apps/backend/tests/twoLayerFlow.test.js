/**
 * The two-layer Leerling test end to end, up to the model call: the screen's plan (GET /api/questions/two-layer)
 * → answers recorded the way the card records them → the response records the screen sends
 * (toResponseRecords, @gfl/assessment-core) → /api/ai/analyze scores them. A request that passes every gate
 * would reach the model, so the test stops at the prompt gate: a 409 for the missing prompt means the
 * scoring gate accepted all 36 records.
 */
const h = require('./helpers');
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { pathToFileURL } = require('url');

before(h.start);
after(h.stop);

const twoLayerUrl = pathToFileURL(path.join(__dirname, '../../../packages/assessment-core/src/data/scoring/twoLayer.js')).href;

test('plan → card records → response records → the server scores them', async () => {
  const base = await h.serve([['/api/questions', require('../routes/questions')], ['/api/ai', require('../routes/ai')]], { jsonLimit: '22mb' });
  const plan = await (await fetch(`${base}/api/questions/two-layer`)).json();

  assert.equal(plan.enabled, true);
  assert.equal(plan.placeholder, true);
  assert.match(plan.rotation_sequence_id, /^leerling:\d{4}-Q[1-4]:[0-9a-f]{12}$/);
  assert.deepEqual(plan.subjects.map((s) => s.questions.length), [9, 9, 6, 6, 6]);
  const questions = plan.subjects.flatMap((s) => s.questions);
  assert.deepEqual(questions.map((q) => q.position), Array.from({ length: 36 }, (_, i) => i + 1));
  for (const q of questions) {
    assert.deepEqual(q.l1.map((a) => a.slot), ['A', 'B', 'C', 'D', 'E', 'F']);
    assert.equal(new Set(q.l1.map((a) => a.group)).size, 6);
    assert.equal(q.l2.length, 12);
  }

  // The card's records: one or two groups with their slot, 0–2 archetypes inside them; a refusal; a timeout.
  const answers = {};
  plan.subjects.forEach((s, layer) => {
    answers[layer] = {};
    s.questions.forEach((q, i) => {
      if (layer === 1 && i === 0) { answers[layer][q.id] = { l1: [], l2: [], refusal: true, timeout: false }; return; }
      if (layer === 2 && i === 0) { answers[layer][q.id] = { l1: [], l2: [], refusal: false, timeout: true }; return; }
      const l1 = q.l1.slice(0, 1 + (i % 2)).map((a) => ({ group: a.group, slot: a.slot }));
      const shown = q.l2.filter((a) => l1.some((p) => p.group === a.group)).map((a) => a.archetype);
      answers[layer][q.id] = { l1, l2: shown.slice(0, i % 3), refusal: false, timeout: false };
    });
  });
  const { toResponseRecords } = await import(twoLayerUrl);
  const responses = toResponseRecords(plan, answers);

  assert.equal(responses.length, 36);
  for (const r of responses) {
    assert.deepEqual(Object.keys(r), ['question_id', 'position', 'l1_refusal', 'timeout', 'l1_picks', 'l2_picks']);
    assert.ok(r.l1_picks.every((p) => /^[A-F]$/.test(p.slot)), 'every Layer-1 pick carries its slot');
    assert.ok(r.l2_picks.every((p) => Object.keys(p).join() === 'archetype'), 'no slot on Layer-2 picks');
  }
  assert.equal(responses.filter((r) => r.l1_refusal).length, 1);
  assert.equal(responses.filter((r) => r.timeout).length, 1);

  const res = await h.post(`${base}/api/ai/analyze`, {
    scoring_version: 'v2_two_layer', level: 'advanced', language: 'en', responses, rotation_sequence_id: plan.rotation_sequence_id,
  });
  assert.equal(res.status, 409);
  assert.match(res.body.error, /no Master Prompt for level advanced/);

  // A record the card can never produce is refused by the scoring gate (400), before the prompt gate.
  const forged = responses.map((r, i) => (i === 3 ? { ...r, l2_picks: [{ archetype: 'Hero' }, { archetype: 'Sage' }, { archetype: 'Judge' }] } : r));
  const bad = await h.post(`${base}/api/ai/analyze`, { scoring_version: 'v2_two_layer', level: 'advanced', language: 'en', responses: forged });
  assert.equal(bad.status, 400);
});
