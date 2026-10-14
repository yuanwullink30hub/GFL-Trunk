/**
 * Layer C answer-style tags. T-CIRCUIT (Backend Task T-CIRCUIT v0.1 §5) and T-SHARP (Backend Task
 * T-SHARP v0.1 §5) are tested against their reference fixtures (t_circuit_v0_1.py, t_sharp_v0_1.py —
 * synthetic sessions; never edit them to make a test pass, regenerate with the reference). The other
 * tags follow the Answer Style Sheet v1.0.1 / Response-Style Table v0.3.2 definitions.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../answerStyle');
const B = require('../bleedV2');
const tcFixtures = require('./t_circuit_fixtures_v0_1.json');
const tsFixtures = require('./t_sharp_fixtures_v0_1.json');
const sessions = require('./bleed_v2_session_fixtures_v0_1.json').cases;

/** The engine values styleTags reads (bleedV2.scoreSession), never recomputed by Layer C. */
const engine = (responses) => {
  const s = B.scoreSession(responses);
  return { main: s.main, support: s.support, totals: s.totals_u, polarizationLevel: s.polarizationLevel };
};

// ── T-CIRCUIT ─────────────────────────────────────────────────────────────────

for (const [name, c] of Object.entries(tcFixtures)) {
  test(`T-CIRCUIT §5.1 ${name}: exactly the expected tags`, () => {
    const main = B.scoreSession(c.questions).main;            // production takes the engine's Main
    assert.equal(main, c.expected.main, 'the engine Main agrees with the reference Main');
    const r = S.tCircuit(c.questions, main);
    assert.deepEqual(r.tags, c.expected.tags);
    assert.equal(r.internal.opportunities, c.expected.opportunities);
    assert.equal(r.internal.count, c.expected.count);
    assert.equal(r.internal.threshold, c.expected.threshold);
    assert.equal(r.internal.fires, c.expected.fires);
    if (c.expected.fires) {
      assert.equal(r.internal.intensity, c.expected.intensity);
      for (const [g, s] of Object.entries(c.expected.shares)) assert.equal(Math.round(r.internal.shares[g] * 1000) / 1000, s);
    }
  });
}

test('T-CIRCUIT §5.2 none of the five session fixtures fires T-CIRCUIT', () => {
  for (const [name, c] of Object.entries(sessions)) {
    const r = S.tCircuit(c.questions, B.scoreSession(c.questions).main);
    assert.deepEqual(r.tags, [], name);
  }
});

test('T-CIRCUIT §5.3 binomial thresholds at p0 = 0.15', () => {
  assert.deepEqual([10, 20, 30, 36].map((n) => S.fireMin(n)), [4, 7, 9, 10]);
  assert.deepEqual(Array.from({ length: 29 }, (_, i) => S.fireMin(i + 8)),
    [4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7, 7, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9, 10, 10, 10]);
});

test('T-CIRCUIT §5.4 the payload carries tags only — no count, opportunities, shares or threshold', () => {
  for (const c of Object.values(tcFixtures)) {
    const r = S.tCircuit(c.questions, c.expected.main);
    const block = S.antwoordstijlBlock(r.tags);
    if (!r.tags.length) { assert.equal(block, null, 'no tag, no block'); continue; }
    assert.match(block, /^-- ANTWOORDSTIJL -- tags: /);
    assert.doesNotMatch(block, /\d/, `a number reached the payload: ${block}`);
    assert.doesNotMatch(block, /count|opportunit|share|threshold|aandeel/i);
  }
});

// ── T-SHARP ───────────────────────────────────────────────────────────────────

for (const [name, c] of Object.entries(tsFixtures).filter(([k]) => !k.startsWith('_'))) {
  test(`T-SHARP §5.1 ${name}: ${JSON.stringify(c.expected.tags)} (${c.expected.reason})`, () => {
    const s = B.scoreSession(c.questions);
    assert.equal(s.main, c.expected.main, 'the engine Main agrees with the reference Main');
    const r = S.tSharp(S.readQuestions(c.questions), { tPreciseFired: c.t_precise_fired, totals: s.totals_u, polarizationLevel: s.polarizationLevel });
    const sent = S.applyPrecedence([...r.tags, ...(c.v_pos ? ['V-POS'] : [])]).filter((t) => t !== 'V-POS');
    assert.deepEqual(sent, c.expected.tags);
    assert.equal(r.internal.refusals, c.expected.refusals);
    assert.equal(r.internal.threshold, c.expected.threshold);
    assert.deepEqual(r.internal.routes, c.expected.routes);
    assert.equal(Math.round(r.internal.n_eff * 100) / 100, c.expected.n_eff);
    if (!c.v_pos) assert.equal(r.internal.reason, c.expected.reason);
  });
}

test('T-SHARP §5.2 session fixtures: with_refusals fires, the other four do not', () => {
  for (const [name, c] of Object.entries(sessions)) {
    const s = B.scoreSession(c.questions);
    const r = S.tSharp(S.readQuestions(c.questions), { tPreciseFired: false, totals: s.totals_u, polarizationLevel: s.polarizationLevel });
    const exp = tsFixtures._session_fixtures[name];
    assert.deepEqual(r.tags, exp.tags, name);
    assert.equal(r.internal.reason, exp.reason, name);
    assert.deepEqual(r.internal.routes, exp.routes, name);
  }
});

test('T-SHARP polar route reads the engine band, not the raw polar_norm (owner, 13 Oct)', () => {
  const qs = S.readQuestions([...fill(7, refusal), ...fill(29, () => q(['Relational'], ['Lover']))]);
  const even = Object.fromEntries(B.NAMES.map((n) => [n, 10]));         // N_eff 12: the concentration route is off
  // polar_norm 0.602: raw > 0.60 would say upper, but round(60.2) = 60 → the band is MODERATE → no route
  assert.equal(S.tSharp(qs, { tPreciseFired: false, totals: even, polarizationLevel: 'MODERATE' }).internal.reason, 'uncorroborated');
  assert.deepEqual(S.tSharp(qs, { tPreciseFired: false, totals: even, polarizationLevel: 'HIGH_POLARIZATION' }).tags, ['T-SHARP']);
  assert.throws(() => S.tSharp(qs, { tPreciseFired: false, totals: even }), /polarisation band/);
});

test('T-SHARP §5.3 the count gate: 6 at α 0.10 (7 at the framework\'s α 0.05)', () => {
  assert.equal(S.fireMin(36, 0.08, 0.10), 6);
  assert.equal(S.fireMin(36, 0.08, 0.05), 7);
});

test('T-SHARP §5.4/§5.5 the payload is the bare code; V-POS drops it; T-PRECISE travels with it', () => {
  const block = S.antwoordstijlBlock(['T-SHARP']);
  assert.equal(block, '-- ANTWOORDSTIJL -- tags: T-SHARP');
  assert.doesNotMatch(block, /\d|n_eff|polar|route|refus/i);
  assert.deepEqual(S.applyPrecedence(['T-SHARP', 'V-POS']), ['V-POS']);
  assert.deepEqual(S.applyPrecedence(['T-PRECISE(intensiteit=present)', 'T-SHARP']), ['T-PRECISE(intensiteit=present)', 'T-SHARP']);
  assert.deepEqual(S.applyPrecedence(['T-SHARP', 'V-BROAD', 'V-PRECISION(groepen=Seeker)']), ['T-SHARP', 'V-BROAD', 'V-PRECISION(groepen=Seeker)'],
    'soft validity raises hedging, it does not suppress');
});

// ── The other tags (Answer Style Sheet v1.0.1; Response-Style Table v0.3.2) ───────

const q = (l1, picks = [], extra = {}) => ({ l1_refusal: false, l1_groups: l1, l2_picks: picks, ...extra });
const refusal = () => ({ l1_refusal: true, l1_groups: [], l2_picks: [] });
const fill = (n, rec) => Array.from({ length: n }, rec);
const tags = (responses) => S.styleTags(responses, engine(responses)).tags;

test('T-PRECISE: DROPPED over the two-group questions, more than usual', () => {
  const single = fill(16, () => q(['Relational'], ['Lover']));
  assert.deepEqual(tags([...fill(20, () => q(['Relational', 'Seeker'], ['Lover'])), ...single]), ['T-PRECISE(intensiteit=dominant)']);
  const few = [...fill(6, () => q(['Relational', 'Seeker'], ['Lover'])), ...fill(14, () => q(['Relational', 'Seeker'], ['Lover', 'Innocent'])), ...single];
  assert.deepEqual(tags(few), [], '6 of 20 is below the threshold of 7');
});

test('T-SHARP inside styleTags: T-PRECISE corroborates, and both are sent', () => {
  const evenly = ['Judge', 'Lover', 'Caregiver', 'Innocent', 'Explorer', 'Outlaw', 'Trickster', 'Sage', 'Artist', 'Magician', 'Hero', 'Ruler'];
  const dropped = evenly.flatMap((a) => [a, a]).map((a) => {
    const g = B.groupOf[B.posOf[a]];
    const other = Object.keys(B.GROUPS).find((x) => x !== g);
    return q([g, other], [a]);
  });
  const r = S.styleTags([...fill(7, refusal), ...dropped, ...fill(5, () => q(['Ruling'], ['Judge']))], engine([...fill(7, refusal), ...dropped, ...fill(5, () => q(['Ruling'], ['Judge']))]));
  assert.ok(r.tags.includes('T-SHARP'), JSON.stringify(r.internal.T_SHARP));
  assert.ok(r.tags.some((t) => t.startsWith('T-PRECISE')), 'T-PRECISE is sent too');
  assert.equal(r.internal.T_SHARP.routes.t_precise, true);
});

test('Layer-2 none by frequency: the T-OPEN / no reading / V-PRECISION zones of RST §3', () => {
  const zones = { 12: [1, [2, 4], 5], 20: [3, [4, 6], 7], 30: [4, [5, 8], 9], 36: [5, [6, 9], 10] };
  const ctx = { main: 'Lover', support: 'Caregiver' };
  for (const [opp, [openMax, [midLo, midHi], precMin]] of Object.entries(zones)) {
    const session = (n) => [
      ...fill(n, () => q(['Abstract'], [])),
      ...fill(+opp - n, () => q(['Relational'], ['Lover'])),
      ...fill(36 - +opp, refusal),
    ];
    const tagOf = (n) => S.l2None(S.readQuestions(session(n)), ctx).tags.map((t) => t.replace(/\(.*$/, ''));
    assert.deepEqual(tagOf(0), [], `${opp}: no fallback, no tag`);
    assert.deepEqual(tagOf(1), ['T-OPEN'], `${opp}: one fallback is rare`);
    assert.deepEqual(tagOf(openMax), ['T-OPEN'], `${opp}: ${openMax} is still rare`);
    assert.deepEqual(tagOf(midLo), [], `${opp}: ${midLo} is the middle zone`);
    assert.deepEqual(tagOf(midHi), [], `${opp}: ${midHi} is the middle zone`);
    assert.deepEqual(tagOf(precMin), ['V-PRECISION'], `${opp}: ${precMin} is too often`);
  }
});

test('T-OPEN names its groups and flags the Main\'s or Support\'s group; V-PRECISION names its groups', () => {
  const rest = fill(33, () => q(['Relational'], ['Lover']));
  assert.deepEqual(tags([q(['Abstract'], []), q(['Seeker', 'Abstract'], []), ...rest, q(['Agency'], ['Hero'])]),
    ['T-OPEN(groepen=Seeker+Abstract, main_of_support_groep=nee)']);
  assert.deepEqual(tags([q(['Relational'], []), ...rest, q(['Agency'], ['Hero']), q(['Agency'], ['Hero'])]),
    ['T-OPEN(groepen=Relational, main_of_support_groep=ja)']);
});

test('V-POS: slot A in ≥ 50 % of the answered questions; it suppresses every interpretive tag', () => {
  const slotted = (slot, l1, picks) => ({ l1_refusal: false, l1_picks: [{ group: l1[0], slot }], l2_picks: picks });
  const onA = [...fill(20, () => slotted('A', ['Relational'], ['Lover', 'Caregiver'])), ...fill(16, () => slotted('D', ['Relational'], ['Lover']))];
  const r = S.styleTags(onA, engine(onA));
  assert.deepEqual(r.tags, ['V-POS'], 'T-CIRCUIT is dropped before sending');
  assert.equal(r.internal.T_CIRCUIT.fires, true);
  const offA = [...fill(17, () => slotted('A', ['Relational'], ['Lover'])), ...fill(19, () => slotted('B', ['Relational'], ['Lover']))];
  assert.deepEqual(tags(offA), []);
  assert.equal(S.styleTags(sessions.selftest_example.questions, engine(sessions.selftest_example.questions)).internal.V_POS.evaluated, false,
    'without slot data it is not evaluated (the fixtures carry l1_groups only)');
});

test('the five session fixtures, all tags: with_refusals → T-SHARP, fallback_heavy → V-PRECISION, the rest none', () => {
  const expected = { with_refusals: ['T-SHARP'], fallback_heavy: ['V-PRECISION(groepen=Seeker+Abstract)'] };
  for (const [name, c] of Object.entries(sessions)) assert.deepEqual(tags(c.questions), expected[name] || [], name);
});

test('data page: each fired tag gets its fixed one-line meaning, and no number', () => {
  assert.deepEqual(S.dataPageLines([
    'T-CIRCUIT(groep=Relational, main_group=ja, intensiteit=dominant)',
    'T-CIRCUIT(groep=Abstract, main_group=nee, intensiteit=present)',
    'T-SHARP',
  ]), [
    'T-CIRCUIT — Groep als geheel: de hardware van de kern wordt vaak als één geheel beleefd.',
    'T-CIRCUIT — Groep als geheel: een tweede circuit (Abstract) doet vaak als geheel mee.',
    'T-SHARP — Scherp afgebakend: keuzes neigen naar helder in plaats van geschakeerd; algemene groepsantwoorden liggen vaak onder waar dit profiel werkt.',
  ]);
  assert.deepEqual(S.dataPageLines(['T-CIRCUIT(spreiding=ja, intensiteit=present)']), ['T-CIRCUIT — Antwoorden neigen naar groepsniveau, zonder één groep.']);
  assert.deepEqual(S.dataPageLines(['V-BROAD']), ['V-BROAD — Het antwoordpatroon is breder dan gemiddeld; archetype-details zijn voorzichtig te lezen.']);
  const all = ['T-CIRCUIT(groep=Relational, main_group=ja, intensiteit=dominant)', 'T-PRECISE(intensiteit=present)', 'T-SHARP',
    'T-OPEN(groepen=Abstract, main_of_support_groep=ja)', 'V-PRECISION(groepen=Seeker)', 'V-BROAD'];
  assert.doesNotMatch(S.antwoordstijlBlock(all), /\d/);
  for (const line of S.dataPageLines(all)) assert.doesNotMatch(line, /\d/);
  assert.equal(S.dataPageLines(['V-POS', ...all]).length, 3, 'V-POS keeps V-PRECISION and V-BROAD, drops the T-tags');
});

test('response states (Response-Style Table §1)', () => {
  const st = (l1, picks) => S.responseState(l1, picks.map((a) => B.posOf[a]))[0];
  assert.equal(st(['Relational'], ['Lover', 'Caregiver']), 'DUAL-ISOLATED');
  assert.equal(st(['Relational', 'Seeker'], ['Lover', 'Caregiver']), 'DUAL-CONTRAST');
  assert.equal(st(['Relational', 'Seeker'], ['Lover', 'Innocent']), 'RESOLVED-PAIR');
  assert.equal(st(['Relational', 'Seeker'], ['Lover']), 'DROPPED');
  assert.equal(st(['Relational'], ['Lover']), 'RESOLVED');
  assert.equal(st(['Relational'], []), 'L2-NONE');
  assert.equal(st([], []), 'NO-L1');
});

test('Layer C never feeds the scoring, and needs the engine\'s values', () => {
  const c = tcFixtures.tc_main_dominant;
  const before = JSON.stringify(B.scoreSession(c.questions));
  S.styleTags(c.questions, engine(c.questions));
  assert.equal(JSON.stringify(B.scoreSession(c.questions)), before);
  assert.throws(() => S.tCircuit(c.questions, 'Zeus'), /engine's Main/);
  assert.throws(() => S.styleTags(c.questions, { main: 'Lover', support: 'Caregiver' }), /12 totals/);
});
