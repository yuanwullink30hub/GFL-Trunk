/**
 * polar_norm — addendum rev 2 (13 Oct 2026): one implementation, gap ÷ Main, used by the live
 * C-modulation (runtimeEngine), the precompute port (cMagnitude) and the AFGELEIDE INDICES %.
 * Expected values are the addendum's table on the Bleed v2 session fixtures (Support = rank 2).
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { polarNorm, polarization } = require('../polarNorm');
const E = require('../runtimeEngine');
const { precompute } = require('../../services/cMagnitude');
const B = require('../bleedV2');
const fixtures = require('./bleed_v2_session_fixtures_v0_1.json');

const r3 = (x) => Math.round(x * 1000) / 1000;

const ADDENDUM = {
  selftest_example:   { main: 'Lover', m: 172.2, shadow: 'Sage', s: 96.0, pn: 0.443, k: 0.311 },
  concentrated_lover: { main: 'Lover', m: 262.8, shadow: 'Sage', s: 32.4, pn: 0.877, k: 0.054 },
  ruling_tetrad:      { main: 'Ruler', m: 237.0, shadow: 'Outlaw', s: 54.6, pn: 0.770, k: 0.142 },
  fallback_heavy:     { main: 'Explorer', m: 195.6, shadow: 'Hero', s: 12.0, pn: 0.939, k: 0.044 },
  with_refusals:      { main: 'Magician', m: 176.4, shadow: 'Innocent', s: 21.6, pn: 0.878, k: 0.076 },
};

for (const [name, x] of Object.entries(ADDENDUM)) {
  test(`addendum table: ${name}`, () => {
    const acc = B.testUnits(B.toScoringInput(fixtures.cases[name].questions));      // integer units (G6)
    const scores = Object.fromEntries(Object.entries(acc).map(([p, b]) => [B.byPos(+p), Object.values(b).reduce((a, v) => a + v, 0)]));
    const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const main = ranked[0][0], support = ranked[1][0];
    assert.equal(main, x.main);
    assert.equal(E.OPP[main], x.shadow);
    assert.equal(Math.round(B.toPoints(scores[main]) * 10) / 10, x.m);
    assert.equal(Math.round(B.toPoints(scores[x.shadow]) * 10) / 10, x.s);
    const geo = { scores, main };
    assert.equal(r3(E.polar_norm(geo)), x.pn);
    // c_modulation on a unit direction = support_weight_norm × (1 − polar_norm)
    const c = E.c_modulation(geo, support, { [support]: { f: 1 } });
    assert.equal(r3(c.f), x.k);
    // the precompute port reads the same function
    const pre = precompute({ main, support, archetypes: {}, main_weight: scores[main], support_weight: scores[support], shadow_weight: scores[x.shadow] },
      { [main]: [1, 1, 1, 1, 1] }, { f: 1 });
    assert.equal(pre.polar_norm, E.polar_norm(geo));
    // AFGELEIDE INDICES % from the same function
    assert.equal(polarization(scores[main], scores[x.shadow]).polarizationPct, Math.round(100 * x.pn));
  });
}

test('guards: no geometry gives 0, never NaN', () => {
  assert.equal(polarNorm(0, 0), 0);
  assert.equal(polarNorm(undefined, 5), 0);
  const geo = { scores: Object.fromEntries(E.ARCHETYPES.map((a) => [a, 0])), main: 'Lover' };
  assert.equal(E.polar_norm(geo), 0);
  assert.deepEqual(E.c_modulation(geo, 'Caregiver', { Caregiver: { f: 1, g: null } }), { f: 0, g: null });
});

test('bands: > 60 % / 30–60 % / < 30 %', () => {
  assert.equal(polarization(100, 39).polarizationLevel, 'HIGH_POLARIZATION');   // 61 %
  assert.equal(polarization(100, 40).polarizationLevel, 'MODERATE');            // 60 %
  assert.equal(polarization(100, 70).polarizationLevel, 'MODERATE');            // 30 %
  assert.equal(polarization(100, 71).polarizationLevel, 'HIGH_INDIVIDUATION');  // 29 %
});
