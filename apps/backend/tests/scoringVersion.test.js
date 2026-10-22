/**
 * scoring_version on /api/ai/analyze (Bleed v2 Scoring instruction §1; payload instruction v7): a v2
 * session is scored on the server from its raw answers before the stream opens, and reaches only the
 * Leerling prompt, and only when that prompt is v7 or later; in Dutch only with ratified enrichment cells.
 * Every refusal here happens before any model call. (A request that passes every gate would reach the
 * model, so none is sent from a test.)
 */
const h = require('./helpers');
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

before(h.start);
after(h.stop);

test('v2: unknown versions 400, malformed answers 400, every level (no prompt 409), no v7 prompt 409, Dutch without ratified cells 409', async () => {
  const base = await h.serve([['/api/ai', require('../routes/ai')]], { jsonLimit: '22mb' });
  const url = `${base}/api/ai/analyze`;
  const responses = require('../engine/tests/bleed_v2_session_fixtures_v0_1.json').cases.selftest_example.questions;

  const odd = await h.post(url, { scoring_version: 'v3', archetypeKey: 'RULER' });
  assert.equal(odd.status, 400);

  const bad = await h.post(url, { scoring_version: 'v2_two_layer', language: 'en', responses: [{ l1_refusal: false, l1_groups: ['Nowhere'], l2_picks: [] }] });
  assert.equal(bad.status, 400);
  assert.match(bad.body.error, /unknown group/);

  // every level takes the two-layer test (Level Routing v0.1 §1.2); without its prompt it stops at 409
  const beginner = await h.post(url, { scoring_version: 'v2_two_layer', level: 'beginner', language: 'en', responses });
  assert.equal(beginner.status, 409);
  assert.match(beginner.body.error, /no Master Prompt for level beginner/);

  const noPrompt = await h.post(url, { scoring_version: 'v2_two_layer', level: 'advanced', language: 'en', responses });
  assert.equal(noPrompt.status, 409);
  assert.match(noPrompt.body.error, /no Master Prompt for level advanced/);

  // a v6 Leerling prompt never receives a v2 payload
  await require('../db').getDB().collection('promptConfigs').insertOne({ _id: 'default', systemPromptTemplate: 'AI MASTER PROMPT v6.3.6 — X\nW1' });
  const v6 = await h.post(url, { scoring_version: 'v2_two_layer', level: 'advanced', language: 'en', responses });
  assert.equal(v6.status, 409);
  assert.match(v6.body.error, /needs Master Prompt v7/);

  const { enrichmentNl } = require('../engine/index');
  if (!enrichmentNl()) {
    const dutch = await h.post(url, { scoring_version: 'v2_two_layer', language: 'nl', responses });
    assert.equal(dutch.status, 409);
    assert.match(dutch.body.error, /Dutch enrichment cells/);
  }
});
