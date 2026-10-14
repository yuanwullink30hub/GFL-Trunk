/**
 * C-path A on the v2 mandjes (Backend Task "Path A v2 Wiring" v0.1, gate G4; scoring instruction §5.3):
 * the adapter, the three rewirings and the task's tests 2–8. Test 1 (v1 unchanged) is the parity gate on
 * c_magnitude_parity_v2_2.json in gates.test.js. The parity fixture is path_a_v2_fixtures_v0_1.json, written
 * by the reference path_a_v2_wiring_v0_1.py (its stored D is synthetic: wiring parity only).
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { sigma, composeDState, CHANNEL_CEILING, CHANNEL_CEILING_U, Edge } = require('../../services/cMagnitude');
const { buildGeometry } = require('../../services/cRuntime');
const { edgeToMain } = require('../../services/connectionMatrix');
const B = require('../bleedV2');
const fx = require('./path_a_v2_fixtures_v0_1.json');

const UP = (n) => n.toUpperCase();
const V2 = 'v2_two_layer';

/** The route's adapter call for a v2 session: mandjes in units, archetypes in wheel order (Judge … Ruler). */
function geometryV2(accU, main, support, shadow) {
  const details = B.NAMES.map((n, i) => {
    const m = accU[i + 1];
    return { key: UP(n), total: B.BASKETS.reduce((t, b) => t + m[b], 0), ...m };
  });
  return buildGeometry({ archetypeDetails: details, mainKey: main, supportKey: support, shadowKey: shadow, scoringVersion: V2 });
}
const one = (name) => [[B.groupOf[B.posOf[name]]], [B.posOf[name]]];
const times = (q, n) => Array.from({ length: n }, () => q);
const siblingName = (name) => B.byPos(B.sibling(B.posOf[name]));

/** Seeded random tests: each question one or two groups (rarely none), then zero, one or two picks among them. */
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32);
}
function randomTest(r, { picksOnly = false } = {}) {
  const groups = Object.keys(B.GROUPS);
  return Array.from({ length: 36 }, () => {
    if (!picksOnly && r() < 0.03) return [[], []];
    const g1 = groups[Math.floor(r() * 6)];
    const l1 = r() < 0.4 ? [g1, groups.filter((g) => g !== g1)[Math.floor(r() * 5)]] : [g1];
    const shown = l1.flatMap((g) => B.GROUPS[g]);
    const n = picksOnly ? 1 + Math.floor(r() * 2) : Math.floor(r() * 3);
    const picks = [...shown].sort(() => r() - 0.5).slice(0, n);
    return [l1, picks];
  });
}
function rankedNames(accU) {
  const t = B.NAMES.map((n, i) => [n, B.BASKETS.reduce((s, b) => s + accU[i + 1][b], 0), i]);
  t.sort((a, b) => b[1] - a[1] || a[2] - b[2]);
  return t;
}

test('3. the v2 ceilings are derived from the bleed config: 360 / 216 / 144 / 144 units; v1 keeps 144 / 108 / 36 / 216', () => {
  assert.deepEqual({ ...CHANNEL_CEILING_U }, { green: 360, blue: 216, purple: 144, yellow: 144 });
  assert.deepEqual({ ...CHANNEL_CEILING_U }, fx.ceilings_units);
  assert.equal(fx.unit, `${B.UNIT.num}/${B.UNIT.den}`);
  assert.deepEqual(CHANNEL_CEILING, { green: 144, blue: 108, purple: 36, yellow: 216 });
});

test('2. parity with path_a_v2_wiring_v0_1.py: mandjes, edges, σ per archetype and the composed D-state, exactly', () => {
  const storedD = Object.fromEntries(Object.entries(fx.stored_d_synthetic).map(([n, d]) => [UP(n), d]));
  for (const c of fx.cases) {
    const accU = B.testUnits(c.questions);
    for (const [i, n] of B.NAMES.entries()) assert.deepEqual(accU[i + 1], c.mandjes_units[n], `${c.name} ${n} mandjes`);
    const g = geometryV2(accU, c.main, c.support, c.shadow);
    for (const n of B.NAMES) {
      const a = g.archetypes[UP(n)];
      assert.deepEqual([a.edge_to_main, a.red_sign_to_main], c.edges[n], `${c.name} ${n} edge`);
      assert.equal(sigma(a, g), c.sigma[n], `${c.name} ${n} σ`);
    }
    const r = composeDState(g, storedD);
    assert.deepEqual(r.raw_composed_D, c.compose.raw_composed_D, `${c.name} raw_composed_D`);
    assert.deepEqual(r.composed_D, c.compose.composed_D, `${c.name} composed_D`);
    assert.equal(r.dynamic_ceiling, c.compose.dynamic_ceiling, `${c.name} dynamic_ceiling`);
    assert.deepEqual(r.refusals, c.compose.refusals.map(([n, e]) => [UP(n), e]), `${c.name} refusals`);
  }
  assert.equal(fx.cases.length, 100);
});

test('4. every σ lies in [−1, 1] (2,000 random sessions)', () => {
  const r = rng(5);
  for (let i = 0; i < 2000; i++) {
    const accU = B.testUnits(randomTest(r));
    const [[main, mt], [support]] = rankedNames(accU);
    if (mt === 0) continue;
    const g = geometryV2(accU, main, support, B.byPos(B.purple(B.posOf[main])));
    for (const a of Object.values(g.archetypes)) {
      const v = sigma(a, g);
      assert.ok(v === null || (v >= -1 && v <= 1), `${main} ${a.name} ${v}`);
    }
  }
});

test('5. Lover picked alone × 36: the Yellow, Green and Blue edges each give σ = 1.0 exactly; Explorer is refused', () => {
  const g = geometryV2(B.testUnits(times(one('Lover'), 36)), 'Lover', 'Caregiver', 'Sage');
  const s = (n) => sigma(g.archetypes[n], g);
  for (const n of ['OUTLAW', 'MAGICIAN', 'CAREGIVER', 'HERO']) assert.equal(s(n), 1, n);
  assert.equal(s('EXPLORER'), null);
  // Purple: Lover is Sage's 180° partner — the channel reaches its ceiling, the gate is unchanged
  const g2 = geometryV2(B.testUnits(times(one('Sage'), 36)), 'Sage', 'Artist', 'Lover');
  const lv = g2.archetypes.LOVER;
  assert.equal(lv.edge_to_main, Edge.PURPLE);
  assert.equal(lv.purple_shadow / CHANNEL_CEILING_U.purple, 1);
});

test('6. the canon Connection Matrix agrees with the bleed wheel geometry (green, blue, purple, yellow)', () => {
  for (const p of B.NAMES.map((n) => B.posOf[n])) {
    const main = UP(B.byPos(p));
    const edge = (q) => edgeToMain(main, UP(B.byPos(q))).edge;
    assert.equal(edge(B.sibling(p)), Edge.GREEN, main);
    // Ruling/Chaos: the sum-13 partner is the sibling, and GREEN takes precedence
    if (B.blue(p) !== B.sibling(p)) assert.equal(edge(B.blue(p)), Edge.BLUE, main);
    assert.equal(edge(B.purple(p)), Edge.PURPLE, main);
    for (const y of B.yellow(p)) assert.equal(edge(y), Edge.YELLOW, main);
  }
});

test('7. in the v2 branch a missing mandje raises, never defaults to 0', () => {
  assert.throws(() => buildGeometry({ archetypeDetails: [{ key: 'JUDGE', total: 1, groen: 1 }], mainKey: 'RULER', supportKey: 'JUDGE', scoringVersion: V2 }),
    /JUDGE\.blauw missing/);
  const g = { scoring_version: V2, main: 'RULER', main_weight: 100, shadow_weight: 50 };
  assert.throws(() => sigma({ name: 'SAGE', edge_to_main: Edge.YELLOW }, g), /SAGE\.yellow_cog missing/);
  assert.throws(() => sigma({ name: 'JUDGE', edge_to_main: Edge.GREEN, green_hw: 1 }, g), /JUDGE\.blauw_intern missing/);
});

test('adapter: groen, blauw, paars, geel and blauw_intern map one to one, in units; no v1 fields', () => {
  const accU = B.testUnits(fx.cases.find((c) => c.name === 'ruling_tetrad').questions);
  const g = geometryV2(accU, 'Ruler', 'Judge', 'Outlaw');
  const j = g.archetypes.JUDGE, m = accU[B.posOf.Judge];
  assert.deepEqual([j.green_hw, j.blue_fb, j.purple_shadow, j.yellow_cog, j.blauw_intern], [m.groen, m.blauw, m.paars, m.geel, m.blauw_intern]);
  assert.ok(m.blauw_intern > 0, 'the tetrad fixture exercises the internal Blue');
  for (const f of ['nature_core', 'culture_core', 'is_culture_pick']) assert.ok(!(f in j), f);
  assert.equal(g.scoring_version, V2);
  assert.equal(g.main_weight, B.BASKETS.reduce((t, b) => t + accU[B.posOf.Ruler][b], 0));
});

test('rewiring 1: Yellow fires without any culture-pick flag', () => {
  const g = { scoring_version: V2, main: 'RULER', main_weight: 100, shadow_weight: 50 };
  assert.equal(sigma({ name: 'SAGE', edge_to_main: Edge.YELLOW, yellow_cog: 72 }, g), 0.5);
});

test('8. tetrad (owner, 13 Oct): pick-only sessions with a Ruling or Chaos Main give the sibling σ = groen ÷ 360 exactly', () => {
  const r = rng(9);
  let checked = 0;
  for (let i = 0; i < 3000; i++) {
    const accU = B.testUnits(randomTest(r, { picksOnly: true }));
    const [[main, mt], [support]] = rankedNames(accU);
    if (mt === 0 || !['Ruling', 'Chaos'].includes(B.groupOf[B.posOf[main]])) continue;
    const g = geometryV2(accU, main, support, B.byPos(B.purple(B.posOf[main])));
    const sb = g.archetypes[UP(siblingName(main))];
    assert.equal(sb.blauw_intern * 10, sb.green_hw * 6, 'pick-built internal Blue is 0.6 × groen');
    assert.equal(sigma(sb, g), sb.green_hw / CHANNEL_CEILING_U.green);
    checked++;
  }
  assert.ok(checked > 500, `checked ${checked}`);
});

test('tetrad: the task table — only Layer-1 fallback Blue in the Main\'s group adds', () => {
  const judge = (qs) => { const g = geometryV2(B.testUnits(qs), 'Ruler', 'Judge', 'Outlaw'); return [g.archetypes.JUDGE, g]; };
  const [j1, g1] = judge(times(one('Ruler'), 36));
  assert.equal(sigma(j1, g1), 1);
  const [jt, gt] = judge(fx.cases.find((c) => c.name === 'ruling_tetrad').questions);
  assert.equal(sigma(jt, gt).toFixed(4), '0.6389');
  assert.equal((jt.green_hw / 360).toFixed(4), '0.6389');
  const [jf, gf] = judge([...times([['Ruling'], []], 12), ...times(one('Ruler'), 24)]);
  assert.equal((jf.green_hw / 360).toFixed(4), '0.6667');
  assert.equal(sigma(jf, gf).toFixed(4), '0.7222');
  // a non-tetrad Green edge, and v1, read Green alone
  const lover = geometryV2(B.testUnits(times(one('Lover'), 36)), 'Lover', 'Caregiver', 'Sage');
  assert.equal(sigma(lover.archetypes.CAREGIVER, lover), lover.archetypes.CAREGIVER.green_hw / 360);
  assert.equal(sigma({ name: 'JUDGE', edge_to_main: Edge.GREEN, green_hw: 72, blauw_intern: 0 }, { main: 'RULER' }), 72 / 144);
});
