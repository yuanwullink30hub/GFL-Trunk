/**
 * P11 (Support-bewerking band, in the engine next to c_modulation) and P12 (Support-herkomst, in the
 * scoring module) — payload instruction v7 §6 tests 10, 15–17 — and the exact-tie rules of payload §10
 * (tests 18, 20; gate G6: integers and cross-multiplication, no tolerances).
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../runtimeEngine');
const B = require('../bleedV2');
const S = require('../answerStyle');
const { polarization } = require('../polarNorm');
const { pctHalfUp } = require('../exact');
const sessions = require('./bleed_v2_session_fixtures_v0_1.json').cases;

const r3 = (x) => Math.round(x * 1000) / 1000;
const kOf = (geo, support) => { const { num, den } = E.support_edit_k(geo, support); return num / den; };
const TEST_10 = {
  selftest_example:   { support: 'Sage', k: 0.311, band: 'sterk', herkomst: 'keuze' },
  ruling_tetrad:      { support: 'Judge', k: 0.142, band: 'merkbaar', herkomst: 'echo' },
  with_refusals:      { support: 'Caregiver', k: 0.076, band: 'zacht', herkomst: 'keuze' },
  concentrated_lover: { support: 'Caregiver', k: 0.054, band: 'zacht', herkomst: 'echo' },
  fallback_heavy:     { support: 'Innocent', k: 0.044, band: 'zacht', herkomst: 'passief' },
};

for (const [name, x] of Object.entries(TEST_10)) {
  test(`test 10 — ${name}: Support ${x.support}, k ${x.k}, ${x.band}, herkomst ${x.herkomst}`, () => {
    const s = B.scoreSession(sessions[name].questions);
    const geo = { scores: s.totals_u, main: s.main };
    assert.equal(s.support, x.support);
    assert.equal(r3(kOf(geo, s.support)), x.k);
    assert.equal(E.support_edit_band(geo, s.support), x.band);
    assert.equal(s.support_herkomst, x.herkomst);
  });
}

test('test 15/16 — one k: the exact integer pair (Support × Shadow, Main²); c_modulation multiplies with it', () => {
  for (const c of Object.values(sessions)) {
    const s = B.scoreSession(c.questions);
    const geo = { scores: s.totals_u, main: s.main };
    const { num, den } = E.support_edit_k(geo, s.support);
    assert.ok(Number.isSafeInteger(num) && Number.isSafeInteger(den), 'both halves are exact integers');
    assert.equal(num, s.totals_u[s.support] * s.totals_u[s.shadow]);
    assert.equal(den, s.totals_u[s.main] ** 2);
    const cm = E.c_modulation(geo, s.support, { [s.support]: { up: 1, down: -1, none: null } });
    assert.deepEqual(cm, { up: Math.round((num / den) * 1e4) / 1e4, down: -Math.round((num / den) * 1e4) / 1e4, none: null });
  }
});

test('test 17 — one Support: a second place settled by the tie chain is the Support everywhere', () => {
  // Lover and Caregiver end level; the chain falls through to the wheel position → Main Lover, Support Caregiver
  const pick = (a) => ({ l1_refusal: false, l1_groups: ['Relational'], l2_picks: a });
  const s = B.scoreSession([pick(['Lover']), pick(['Caregiver'])]);
  assert.equal(s.totals_u.Lover, s.totals_u.Caregiver);
  assert.equal(s.support, 'Caregiver');
  const accU = Object.fromEntries(Object.entries(s.mandjes_u).map(([n, m]) => [B.posOf[n], m]));
  assert.equal(s.support_herkomst, B.supportHerkomst(accU, B.posOf.Caregiver));
  const geo = { scores: s.totals_u, main: s.main };
  assert.equal(E.support_edit_band(geo, s.support), E.support_edit_band(geo, 'Caregiver'));
});

test('P11 cut-points by cross-multiplication: an exact 1/10 is merkbaar, an exact 3/10 is sterk', () => {
  // Main 100, Shadow 50 → k = Support × 50 / 100² = Support / 200
  const at = (support) => ({ scores: { ...Object.fromEntries(B.NAMES.map((n) => [n, 1])), Lover: 100, Sage: 50, Caregiver: support }, main: 'Lover' });
  assert.equal(E.support_edit_band(at(19), 'Caregiver'), 'zacht');      // 0.095
  assert.equal(E.support_edit_band(at(20), 'Caregiver'), 'merkbaar');   // exactly 0.10
  assert.equal(E.support_edit_band(at(59), 'Caregiver'), 'merkbaar');   // 0.295
  assert.equal(E.support_edit_band(at(60), 'Caregiver'), 'sterk');      // exactly 0.30
  const noShadow = { scores: { ...at(40).scores, Sage: 0 }, main: 'Lover' };
  assert.equal(kOf(noShadow, 'Caregiver'), 0, 'a fully suppressed Shadow leaves no edit');
});

test('P12: the echo list is the chart\'s two echo segments; no geometry gives no line', () => {
  assert.deepEqual([...B.ECHO].sort(), ['blauw', 'blauw_intern', 'geel', 'groen', 'paars']);
  const zero = Object.fromEntries(B.BASKETS.map((b) => [b, 0]));
  assert.equal(B.supportHerkomst({ 3: zero }, 3), null);
  assert.equal(B.supportHerkomst({ 3: { ...zero, keuze: 5, passief: 5 } }, 3), 'keuze', 'tie → keuze');
  assert.equal(B.supportHerkomst({ 3: { ...zero, keuze: 4, passief: 5 } }, 3), 'passief');
});

test('§10 test 18 — the pinned tie: 9 / 6 / 6 / 0 / 4.2 / 1.2 / 3.6 points, echo exactly 15 of 30 → echo', () => {
  // in units of 3/10: 30 / 20 / 20 / 0 / 14 / 4 / 12 — echo 50 of 100, so 2 × echo ≥ total holds exactly
  const tie = { keuze: 30, passief: 20, groen: 20, blauw: 0, blauw_intern: 14, paars: 4, geel: 12 };
  assert.deepEqual(Object.values(tie).map(B.toPoints), [9, 6, 6, 0, 4.2, 1.2, 3.6]);
  assert.equal(B.supportHerkomst({ 3: tie }, 3), 'echo');
});

test('§10 test 20 — 12.5 % shows 13; an exact 60 % is the middle band and T-SHARP\'s polar route stays off', () => {
  assert.equal(pctHalfUp(1, 8), 13);
  assert.equal(pctHalfUp(5, 8), 63);                 // 62.5 → 63 (Python's round() would give 62)
  // gekozen_aandeel through the group view: gekozen 1 unit of a total of 8
  const accU = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, Object.fromEntries(B.BASKETS.map((b) => [b, 0]))]));
  accU[2].keuze = 1; accU[3].groen = 7;
  assert.equal(B.groupView(accU).Relational.gekozen_aandeel, 13);
  // polar_norm exactly 0.6: Main 50, Shadow 20 → gap 30 = 60 % → MODERATE (the rule is > 60 %)
  assert.deepEqual(polarization(50, 20), { polarizationIndex: 30, polarizationPct: 60, polarizationLevel: 'MODERATE' });
  assert.equal(polarization(50, 19).polarizationLevel, 'HIGH_POLARIZATION');
  assert.equal(polarization(100, 70).polarizationLevel, 'MODERATE', 'exactly 30 % is the middle band too');
  assert.equal(polarization(100, 71).polarizationLevel, 'HIGH_INDIVIDUATION');
  const refusals = Array.from({ length: 7 }, () => ({ l1_refusal: true, l1_groups: [], l2_picks: [] }));
  const rest = Array.from({ length: 29 }, () => ({ l1_refusal: false, l1_groups: ['Relational'], l2_picks: ['Lover'] }));
  const even = Object.fromEntries(B.NAMES.map((n) => [n, 10]));
  const r = S.tSharp(S.readQuestions([...refusals, ...rest]), { tPreciseFired: false, totals: even, polarizationLevel: polarization(50, 20).polarizationLevel });
  assert.equal(r.internal.routes.polar_upper, false);
  assert.equal(r.internal.reason, 'uncorroborated');
});
