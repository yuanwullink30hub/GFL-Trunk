/**
 * Tetrad observer (Bleed v2 Scoring §5.4) + the anonymous write queue (privacy instruction §5.2).
 * The observer port matched tetrad_observer_v0_4.py on 2,000 random sessions when it was written;
 * these tests pin the rules it rests on.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { observe } = require('../tetradObserver');
const { createAnonQueue } = require('../../services/anonQueue');
const { tetradDoc } = require('../../services/statsStore');
const sessions = require('./bleed_v2_session_fixtures_v0_1.json').cases;

const q = (l1, l2) => ({ l1_refusal: false, l1_groups: l1, l2_picks: l2 });

test('one row, exactly three fields', () => {
  const row = observe(sessions.ruling_tetrad.questions);
  assert.deepEqual(Object.keys(row).sort(), ['archetype', 'double_picks', 'shown']);
  assert.deepEqual(row, { archetype: 'Ruler', double_picks: 8, shown: 30 });
});

test('the Main comes from true picks only — fallback points and bleed never decide it', () => {
  // Seeker by fallback gets far more points than one Hero pick, but the true-pick Main is Hero
  const responses = [q(['Seeker'], []), q(['Seeker'], []), q(['Seeker'], []), q(['Agency'], ['Hero'])];
  assert.equal(observe(responses).archetype, 'Hero');
  assert.equal(observe([q(['Seeker'], [])]), null);                  // no direct pick, no row
});

test('shown counts the Main\'s pair on Layer 2; double counts both of it picked', () => {
  const responses = [q(['Chaos'], ['Outlaw']), q(['Chaos', 'Ruling'], ['Outlaw', 'Trickster']), q(['Chaos'], []), q(['Ruling'], ['Judge'])];
  assert.deepEqual(observe(responses), { archetype: 'Outlaw', double_picks: 1, shown: 3 });
});

test('bad records throw, like the scoring', () => {
  assert.throws(() => observe([q(['Ruling'], ['Lover'])]), /outside the picked Layer-1 group/);
});

test('store doc: the three fields plus a random key — no ObjectId timestamp, no extra field', () => {
  const d = tetradDoc({ archetype: 'Ruler', double_picks: 2, shown: 9 });
  assert.deepEqual(Object.keys(d).sort(), ['_id', 'archetype', 'double_picks', 'shown']);
  assert.match(d._id, /^[0-9a-f]{24}$/);
  assert.notEqual(tetradDoc({ archetype: 'Ruler', double_picks: 2, shown: 9 })._id, d._id);
  assert.throws(() => tetradDoc({ archetype: 'Ruler', double_picks: 2, shown: 9, level: 'leerling' }), /exactly/);
});

test('queue: holds rows until a batch is big enough, then writes them shuffled', async () => {
  const written = [];
  let seed = 7;
  const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const timers = [];
  const queue = createAnonQueue({ sink: async (rows) => { written.push(rows); }, minBatch: 5, random, setTimer: (fn, ms) => { timers.push(ms); return {}; } });
  for (let i = 0; i < 4; i++) queue.push({ n: i });
  assert.equal(await queue.flush(), 0, 'below the minimum batch nothing is written');
  queue.push({ n: 4 }); queue.push({ n: 5 });
  assert.equal(await queue.flush(), 6);
  assert.equal(written.length, 1);
  assert.deepEqual(written[0].map((r) => r.n).sort(), [0, 1, 2, 3, 4, 5]);
  assert.notDeepEqual(written[0].map((r) => r.n), [0, 1, 2, 3, 4, 5], 'written in shuffled order');
  assert.ok(timers.every((ms) => ms >= 30 * 60e3 && ms <= 120 * 60e3), 'flushes at a random moment in the window');
  assert.equal(queue.size, 0);
});

test('queue: a failed write keeps the rows for the next flush', async () => {
  let fail = true;
  const queue = createAnonQueue({ sink: async () => { if (fail) throw new Error('down'); }, minBatch: 1, setTimer: () => ({}) });
  const warn = console.warn; console.warn = () => {};
  try {
    queue.push({ n: 1 });
    assert.equal(await queue.flush(), 0);
    assert.equal(queue.size, 1);
    fail = false;
    assert.equal(await queue.flush(), 1);
  } finally { console.warn = warn; }
});
