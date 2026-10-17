/**
 * The cognitive triangle (engine/cogTriangle.js) against its reference cog_triangle_v0_1.py — Backend Task
 * "Triangle Page" v0.1 §9 tests 1, 2, 4 and 6 (3, 7 and 8 live with the data block and the report request).
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const B = require('../bleedV2');
const X = require('../exact');
const CT = require('../cogTriangle');
const V = require('../reportV7');
const { triangleCanon } = require('../corpusResolver');
const { triangleLines, dataBlockText } = require('../dataBlock');
const sessions = require('./bleed_v2_session_fixtures_v0_1.json').cases;

const UNIT = X.frac(BigInt(B.UNIT.num), BigInt(B.UNIT.den));
/** Points → whole units, exactly (the reference's to_u); a value off the unit grid throws. */
const toU = (pts) => {
  const f = X.div(X.parseFraction(String(pts)), UNIT);
  assert.equal(f.d, 1n, `${pts} points is not a whole number of units`);
  return Number(f.n);
};
/** Mandjes in units from keuze points per wheel position (passief 0), plus optional geel points. */
const mandjes = (keuze, geel = {}) => Object.fromEntries(B.NAMES.map((n, i) => [n, {
  keuze: toU(keuze[i + 1] || 0), passief: 0, geel: toU(geel[i + 1] || 0),
}]));

// The owner case (the Anarchist, 17 Oct 2026): the report's keuze vector, passief 0, Main Outlaw.
const OWNER = { 1: 27, 2: 31.5, 3: 4.5, 4: 22.5, 5: 0, 6: 94.5, 7: 22.5, 8: 13.5, 9: 13.5, 10: 45, 11: 31.5, 12: 18 };

test('§9.1–2 owner case: the reference lifts, bands and payload block, exactly', () => {
  const m = mandjes(OWNER, { 2: 18.6, 6: 10.2, 10: 16.8 });
  const r2 = (x) => Math.round(x * 100) / 100;
  assert.deepEqual(Object.fromEntries(Object.entries(CT.lifts(m, 'Outlaw')).map(([t, v]) => [t, r2(v)])), { D1: 0.65, D2: 1.83, D3: 0.93, D4: 0.86 });
  assert.deepEqual(CT.triangleBands(m, 'Outlaw'), { D1: 'neutraal', D2: 'draagt', D3: 'neutraal', D4: 'neutraal' });
  const facts = CT.triangleFacts({ mandjes_u: m, main: 'Outlaw' }, triangleCanon('nl'));
  assert.equal(dataBlockText([{ title: 'COGNITIEVE DRIEHOEK', lines: triangleLines(facts, 'nl') }]), [
    '-- COGNITIEVE DRIEHOEK --',
    'Main-driehoek: De Gepassioneerde Alchemist (D2) | leden: Lover · Outlaw · Magician | band: draagt',
    'Main-rol: Outlaw — Breken / salience-disruptie (Salience-pool)',
    'Tegendriehoek: De Analytische Estheet (D1) | band: neutraal',
    'geel: Lover 18.6 | Outlaw 10.2 | Magician 16.8',
  ].join('\n'));
  // the English block: the task's EN labels, names and pool line from the English corpus
  const en = CT.triangleFacts({ mandjes_u: m, main: 'Outlaw' }, triangleCanon('en'));
  assert.deepEqual(triangleLines(en, 'en'), [
    'Main triangle: The Passionate Alchemist (D2) | members: Lover · Outlaw · Magician | band: carries',
    'Main role: Outlaw — Breaking / salience-disruption (Salience pool)',
    'Counter-triangle: The Analytical Aesthete (D1) | band: neutral',
    'yellow: Lover 18.6 | Outlaw 10.2 | Magician 16.8',
  ]);
});

test('§9.4 boundaries, exact: 17/10 and 1/2 on the Main\'s triangle, 31/20 and 3/5 on another, G\' = 0', () => {
  const M = CT.TRIANGLE_BANDS.main, O = CT.TRIANGLE_BANDS.other;
  // G' = 110: s = 34 gives lift 34/110 · 11/2 = 17/10 exactly; s = 10 gives 1/2
  assert.equal(CT.band(34, 2, 110, M), 'draagt');
  assert.equal(CT.band(33, 2, 110, M), 'neutraal');
  assert.equal(CT.band(10, 2, 110, M), 'stil');
  assert.equal(CT.band(11, 2, 110, M), 'neutraal');
  // G' = 220: s = 93 gives 93/220 · 11/3 = 1.55 = 31/20; s = 36 gives 0.6 = 3/5
  assert.equal(CT.band(93, 3, 220, O), 'draagt');
  assert.equal(CT.band(92, 3, 220, O), 'neutraal');
  assert.equal(CT.band(36, 3, 220, O), 'stil');
  assert.equal(CT.band(37, 3, 220, O), 'neutraal');
  assert.equal(CT.band(0, 2, 0, M), 'stil');
  // no chosen weight outside the Main: every band is stil
  const onlyMain = mandjes({ 6: 90 });
  assert.deepEqual(CT.triangleBands(onlyMain, 'Outlaw'), { D1: 'stil', D2: 'stil', D3: 'stil', D4: 'stil' });
  // integers only: a float never reaches the comparison
  assert.throws(() => CT.band(33.5, 2, 110, M), /integers/);
  assert.deepEqual([M.draagt, M.stil, O.draagt, O.stil], [[17, 10], [1, 2], [31, 20], [3, 5]]);
});

test('passief counts as chosen weight; geel (echo) never does', () => {
  const base = mandjes(OWNER);
  const withEcho = Object.fromEntries(Object.entries(base).map(([n, m]) => [n, { ...m, geel: m.geel + 300, groen: 500 }]));
  assert.deepEqual(CT.triangleBands(withEcho, 'Outlaw'), CT.triangleBands(base, 'Outlaw'));
  const passive = { ...base, Lover: { ...base.Lover, keuze: 0, passief: base.Lover.keuze } };
  assert.deepEqual(CT.lifts(passive, 'Outlaw'), CT.lifts(base, 'Outlaw'));
});

test('the facts: the Main\'s triangle and its counter-triangle always, another only when it carries', () => {
  for (const c of Object.values(sessions)) {
    const s = B.scoreSession(c.questions);
    const f = CT.triangleFacts(s, triangleCanon('nl'));
    assert.equal(f.main.id, CT.triangleOf(s.main));
    assert.ok(f.main.members.includes(s.main));
    assert.equal(f.counter.id, CT.COMPLEMENT[f.main.id]);
    for (const o of f.others) {
      assert.equal(o.band, 'draagt');
      assert.ok(o.id !== f.main.id && o.id !== f.counter.id);
    }
    assert.deepEqual(f.geel.map((g) => g.name), CT.membersOf(f.main.id));
  }
});

test('§9.6 never sent: no lift, s, G\' or threshold in the model input, the slice, the data block or the browser', () => {
  for (const name of Object.keys(sessions)) {
    const r = V.buildV2Request({ system: 'AI MASTER PROMPT v7.2 — X', responses: sessions[name].questions, language: 'en' });
    const lifts = Object.values(CT.lifts(r.session.mandjes_u, r.session.main)).map((x) => x.toFixed(2));
    // (the canon text in the slice is the Rosetta's own words; what we add is the user message, block and client)
    const out = [r.user, JSON.stringify(r.dataBlock), JSON.stringify(r.client)].join('\n');
    assert.doesNotMatch(out, /\blift\b|17\/10|31\/20|\b1\/2\b|\b3\/5\b|G'/i, name);
    for (const l of lifts) assert.ok(!r.client.triangle || !JSON.stringify(r.client.triangle).includes(l), `${name}: lift ${l} reached the browser`);
  }
});
