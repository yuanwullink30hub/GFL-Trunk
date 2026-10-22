/**
 * Level prompt routing (services/promptRouting.js): each level reads its own Master Prompt record, the
 * Leerling two-layer test reads its own, and a level without a prompt is refused before the stream opens.
 */
const h = require('./helpers');
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const R = require('../services/promptRouting');

before(h.start);
after(h.stop);

test('slots: one record per level; Leerling keeps the historic record; the test must fit the prompt', () => {
  assert.equal(R.promptSlotFor(), 'advanced');
  assert.equal(R.promptSlotFor('beginner'), 'beginner');
  assert.equal(R.promptSlotFor('intermediate', 'v1_nature_culture'), 'intermediate');
  assert.equal(R.promptSlotFor('advanced', 'v2_two_layer'), 'advanced');
  assert.deepEqual(R.SLOTS.map(R.promptRecordId), ['beginner', 'intermediate', 'default']);
  assert.throws(() => R.promptSlotFor('expert'), /unknown level/);
  // the two-layer test runs at every level (Level Routing v0.1 §1.2)
  assert.equal(R.promptSlotFor('beginner', 'v2_two_layer'), 'beginner');
  assert.equal(R.promptSlotFor('intermediate', 'v2_two_layer'), 'intermediate');
  assert.throws(() => R.promptRecordId('default'), /unknown prompt slot/);
  // v2 needs v7+, the old test v6 or earlier; a prompt that names no version passes
  const v7 = 'AI MASTER PROMPT v7.0 — DELTAWERKEN RAPPORTGENERATOR\nW1', v6 = 'AI MASTER PROMPT v6.3.6 — X\nW1';
  assert.equal(R.promptMajor(v7), 7);
  assert.equal(R.promptMismatch(v7, 'v2_two_layer'), null);
  assert.equal(R.promptMismatch(v6, 'v1_nature_culture'), null);
  assert.equal(R.promptMismatch(v6, undefined), null);
  assert.match(R.promptMismatch(v7, undefined), /retired/);
  assert.match(R.promptMismatch(v6, 'v2_two_layer'), /needs Master Prompt v7/);
  assert.equal(R.promptMismatch('LEERLING PROMPT', 'v2_two_layer'), null);
});

test('the analyze route: unknown level 400, a level without a prompt 409, a level with one passes', async () => {
  const { getDB } = require('../db');
  const prompts = getDB().collection('promptConfigs');
  await prompts.insertOne({ _id: 'default', systemPromptTemplate: 'LEERLING PROMPT' });
  await prompts.insertOne({ _id: 'intermediate', systemPromptTemplate: '   ' });   // empty counts as missing
  const base = await h.serve([['/api/ai', require('../routes/ai')]], { jsonLimit: '22mb' });
  const url = `${base}/api/ai/analyze`;

  const odd = await h.post(url, { level: 'expert' });
  assert.equal(odd.status, 400);
  assert.match(odd.body.error, /unknown level/);

  for (const level of ['beginner', 'intermediate']) {
    const r = await h.post(url, { level });
    assert.equal(r.status, 409, level);
    assert.match(r.body.error, new RegExp(`no Master Prompt for level ${level}`));
  }

  // Leerling (and an old client that sends no level) passes the gate into the stream; without an
  // archetypeKey the handler stops there, so no model is called.
  const ok = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ level: 'advanced' }) });
  assert.equal(ok.status, 200);
  assert.match(await ok.text(), /archetypeKey is required/);

  // with v7 as the Leerling prompt, the old test is refused before any model call
  await prompts.updateOne({ _id: 'default' }, { $set: { systemPromptTemplate: 'AI MASTER PROMPT v7.0 — X\nW1' } });
  const old = await h.post(url, { level: 'advanced', archetypeKey: 'RULER' });
  assert.equal(old.status, 409);
  assert.match(old.body.error, /retired/);
});
