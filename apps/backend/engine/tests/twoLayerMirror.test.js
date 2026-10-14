/**
 * The browser's display mirror of the v2 scoring (packages/assessment-core/src/data/scoring/twoLayer.js)
 * must give exactly what engine/bleedV2.js gives: the same units on every one of the 189 answered question
 * states, and the same Main, Support, ranking and mandjes on the session fixtures and on random sessions.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { pathToFileURL } = require('url');
const B = require('../bleedV2');
const fixtures = require('./bleed_v2_session_fixtures_v0_1.json').cases;

const mirrorUrl = pathToFileURL(path.join(__dirname, '../../../../packages/assessment-core/src/data/scoring/twoLayer.js')).href;

/** [l1 group names, l2 wheel positions] (as validStates yields them) → the session store's response record. */
const record = (l1, l2) => ({ l1_refusal: false, l1_picks: l1.map((group, i) => ({ group, slot: 'ABCDEF'[i] })), l2_picks: l2.map((p) => ({ archetype: B.byPos(p) })) });

test('every answered question state: the mirror\'s units equal bleedV2\'s', async () => {
  const { scoreTwoLayer } = await import(mirrorUrl);
  let n = 0;
  for (const [l1, picks] of B.validStates()) {
    const r = record(l1, picks);
    const engine = B.scoreSession([r]).mandjes_u;
    assert.deepEqual(scoreTwoLayer([r]).mandjes_u, engine, JSON.stringify([l1, picks]));
    n += 1;
  }
  assert.equal(n, 189);
  assert.deepEqual(scoreTwoLayer([{ l1_refusal: true, l1_picks: [], l2_picks: [] }]).totals_u, B.scoreSession([{ l1_refusal: true, l1_picks: [], l2_picks: [] }]).totals_u);
});

test('fixtures and random sessions: same Main, Support, ranking, totals and mandjes', async () => {
  const { scoreTwoLayer } = await import(mirrorUrl);
  const sessions = Object.values(fixtures).map((c) => c.questions);
  const states = [...B.validStates()];
  let seed = 7;
  const rnd = (n) => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
  for (let s = 0; s < 300; s++) {
    sessions.push(Array.from({ length: 36 }, () => {
      if (rnd(20) === 0) return { l1_refusal: true, l1_picks: [], l2_picks: [] };
      const [l1, picks] = states[rnd(states.length)];
      return record(l1, picks);
    }));
  }
  for (const responses of sessions) {
    const engine = B.scoreSession(responses);
    const mirror = scoreTwoLayer(responses);
    assert.equal(mirror.main, engine.main);
    assert.equal(mirror.support, engine.support);
    assert.deepEqual(mirror.ranking, engine.ranking);
    assert.deepEqual(mirror.totals_u, engine.totals_u);
    assert.deepEqual(mirror.mandjes_u, engine.mandjes_u);
  }
});
