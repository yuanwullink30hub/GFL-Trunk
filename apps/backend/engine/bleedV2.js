/**
 * Bleed Engine v2 — the two-layer test's scoring (spec v0.4.1; Backend Instruction "Bleed v2
 * Scoring" v0.1). DRAFT: built and tested now, live only when the instruction's gates G1–G5 close.
 *
 * Two-layer answers in → the 12 totals, the seven mandjes per archetype, the group view and the
 * derived identity values out. A port of the handover's reference scripts:
 *   bleed_sim_v0_4.py  `q4`                → scoreQuestion (floats — kept as the parity reference only)
 *   pick_echo_v0_1.py  v0.2.0 (gate G6)    → deriveUnit, questionUnits, testUnits, toPoints, groupView,
 *                                            supportHerkomst, payloadBlock
 *
 * G6 (owner, 13 Oct 2026; scoring instruction §3.5): EXACT INTEGER UNITS. The unit is derived at startup
 * from the configured ratios (exact strings, never binary floats): the exact common divisor of every point
 * value the bleed can produce — today 3/10, so 9 points = 30 units. Mandjes, totals, group sums and the tie
 * chain are integers (equal means equal); points exist only at the edge (display, payload line, chart), as
 * one exact integer product and one correctly rounded division. Every threshold is an integer
 * cross-multiplication. Values do not change; only how they are stored and compared.
 *
 * Fail loud: a malformed response record throws (BleedInputError) — never coerced, no `|| 0`. So does a
 * config that would push a squared session total past 2⁵³.
 * Scoring never reads the display slot, the question id or the rotation sequence.
 *
 * Wheel positions 1–12: Judge, Lover, Caregiver, Innocent, Explorer, Outlaw, Trickster, Sage,
 * Artist, Magician, Hero, Ruler.
 */

'use strict';

const { pyRound } = require('./py');
const { polarNorm, polarization } = require('./polarNorm');
const X = require('./exact');

/** The scoring version this module implements — the session's `scoring_version`. */
const SCORING_VERSION = 'v2_two_layer';

/**
 * All constants, in one versioned object, as EXACT strings (G6). Every value is a SEED (spec §1–§2), to be
 * calibrated post-launch against real geometries; never scatter these literals through the code.
 */
const CONFIG = Object.freeze({
  version: 'bleed_v2 spec v0.4.1 (seeds)',
  X: '9',            // core per question
  FB_CORE: '12',     // Layer-1 fallback, spread over the shown archetypes
  green: '1/3',      // to the sibling
  blue: '1/5',       // to the sum-13 partner (Ruling/Chaos: the sibling — the tetrad, spec §4)
  purple: '2/15',    // to the 180° partner
  yellow: '2/15',    // to EACH of the two triangle partners
  fb_blue: '1/10',   // fallback Blue (half ratio, owner-ratified; an open calibration scalar)
});
const JS_SAFE = 2n ** 53n;

/**
 * The exact common divisor of every point value the bleed can produce under cfg (pick_echo derive_unit).
 * @returns {{ unit: { num: number, den: number }, pickU: object, fbU: object }}
 */
function deriveUnit(cfg) {
  const c = Object.fromEntries(['X', 'FB_CORE', 'green', 'blue', 'purple', 'yellow', 'fb_blue'].map((k) => [k, X.parseFraction(cfg[k])]));
  const picks = {};
  for (const n of [1, 2]) {
    const core = X.div(c.X, X.fromInt(n));
    picks[n] = { core, green: X.mul(c.green, core), blue: X.mul(c.blue, core), purple: X.mul(c.purple, core), yellow: X.mul(c.yellow, core) };
  }
  const fbs = {};
  for (const s of [2, 4]) {
    const core = X.div(c.FB_CORE, X.fromInt(s));
    fbs[s] = { core, blue: X.mul(c.fb_blue, core) };
  }
  const vals = [...Object.values(picks), ...Object.values(fbs)].flatMap((d) => Object.values(d)).filter((v) => v.n !== 0n);
  let den = 1n;
  for (const v of vals) den = (den * v.d) / X.bgcd(den, v.d);
  let g = 0n;
  for (const v of vals) g = X.bgcd(g, (v.n * den) / v.d);
  const unit = X.frac(g, den);
  const toU = (v) => {
    const q = X.div(v, unit);
    if (q.d !== 1n) throw new Error(`a bleed value is not a whole number of units: ${v.n}/${v.d}`);
    return q.n;
  };
  const pickU = Object.fromEntries(Object.entries(picks).map(([n, d]) => [n, Object.fromEntries(Object.entries(d).map(([k, v]) => [k, toU(v)]))]));
  const fbU = Object.fromEntries(Object.entries(fbs).map(([s, d]) => [s, Object.fromEntries(Object.entries(d).map(([k, v]) => [k, toU(v)]))]));
  let qMax = 0n;
  for (const [n, d] of Object.entries(pickU)) { const t = BigInt(n) * (d.core + d.green + d.blue + d.purple + 2n * d.yellow); if (t > qMax) qMax = t; }
  for (const [s, d] of Object.entries(fbU)) { const t = BigInt(s) * (d.core + d.blue); if (t > qMax) qMax = t; }
  if ((36n * qMax) ** 2n >= JS_SAFE) throw new Error(`unit ${unit.n}/${unit.d} too fine: a squared session total reaches 2^53`);
  const num = (o) => Object.fromEntries(Object.entries(o).map(([k, d]) => [k, Object.fromEntries(Object.entries(d).map(([b, v]) => [b, Number(v)]))]));
  return { unit: { num: Number(unit.n), den: Number(unit.d) }, pickU: num(pickU), fbU: num(fbU) };
}

const { unit: UNIT, pickU: PICK_U, fbU: FB_U } = deriveUnit(CONFIG);

/** Units → points for display: one exact integer product, one correctly rounded division (same as Python). */
const toPoints = (u) => (u * UNIT.num) / UNIT.den;

const NAMES = ['Judge', 'Lover', 'Caregiver', 'Innocent', 'Explorer', 'Outlaw', 'Trickster', 'Sage', 'Artist', 'Magician', 'Hero', 'Ruler'];
const POSITIONS = Array.from({ length: 12 }, (_, i) => i + 1);
const byPos = (p) => NAMES[p - 1];
const posOf = Object.fromEntries(NAMES.map((n, i) => [n, i + 1]));

/** Group order is the payload order: Ruling, Relational, Seeker, Chaos, Abstract, Agency. */
const GROUPS = {
  Ruling: [1, 12], Relational: [2, 3], Seeker: [4, 5], Chaos: [6, 7], Abstract: [8, 9], Agency: [10, 11],
};
const TETRAD_GROUPS = ['Ruling', 'Chaos'];
const groupOf = Object.fromEntries(Object.entries(GROUPS).flatMap(([g, ps]) => ps.map((p) => [p, g])));

const sibling = (p) => GROUPS[groupOf[p]].find((q) => q !== p);
const purple = (p) => ((p + 5) % 12) + 1;          // 180° partner
const blue = (p) => 13 - p;                         // sum-13 partner (Ruling/Chaos: the sibling — tetrad)
const yellow = (p) => POSITIONS.filter((q) => q % 4 === p % 4 && q !== p); // the two triangle partners

const BASKETS = ['keuze', 'passief', 'groen', 'blauw', 'blauw_intern', 'paars', 'geel'];
/** The echo baskets — eigen_echo (groen + blauw_intern) + wiel_echo (blauw + paars + geel): one list for chart and P12. */
const ECHO = ['groen', 'blauw_intern', 'blauw', 'paars', 'geel'];

/** Float copies of the ratios — ONLY for scoreQuestion, the q4 parity reference. */
const F = Object.fromEntries(Object.entries(CONFIG).filter(([k]) => k !== 'version').map(([k, v]) => {
  const f = X.parseFraction(v);
  return [k, Number(f.n) / Number(f.d)];
}));

/**
 * One question, scored in floats exactly like bleed_sim q4 — the parity reference the units are checked
 * against. The scoring itself never uses it.
 */
function scoreQuestion(l1, picks) {
  const v = Object.fromEntries(POSITIONS.map((p) => [p, 0.0]));
  if (!l1.length) return v;
  if (picks.length) {
    const c = F.X / picks.length;
    for (const x of picks) {
      v[x] += c; v[sibling(x)] += F.green * c; v[blue(x)] += F.blue * c; v[purple(x)] += F.purple * c;
      for (const y of yellow(x)) v[y] += F.yellow * c;
    }
  } else {
    const shown = l1.flatMap((g) => GROUPS[g]);
    const c = F.FB_CORE / shown.length;
    for (const x of shown) { v[x] += c; v[blue(x)] += F.fb_blue * c; }
  }
  return v;
}

const blank = () => Object.fromEntries(POSITIONS.map((p) => [p, Object.fromEntries(BASKETS.map((b) => [b, 0]))]));

/** One question in integer units, labelled by origin at the moment it is scored: seven mandjes per position. */
function questionUnits(l1, picks) {
  const v = blank();
  if (!l1.length) return v;
  if (picks.length) {
    const u = PICK_U[picks.length];
    for (const x of picks) {
      v[x].keuze += u.core;
      v[sibling(x)].groen += u.green;
      const b = blue(x);
      v[b][groupOf[b] === groupOf[x] ? 'blauw_intern' : 'blauw'] += u.blue;
      v[purple(x)].paars += u.purple;
      for (const y of yellow(x)) v[y].geel += u.yellow;
    }
  } else {
    const shown = l1.flatMap((g) => GROUPS[g]);
    const u = FB_U[shown.length];
    for (const x of shown) {
      v[x].passief += u.core;
      const b = blue(x);
      v[b][groupOf[b] === groupOf[x] ? 'blauw_intern' : 'blauw'] += u.blue;
    }
  }
  return v;
}

/** A completed test: questions as [l1, picks] pairs → mandjes per position, in exact integer units. */
function testUnits(questions) {
  const acc = blank();
  for (const [l1, picks] of questions) {
    const q = questionUnits(l1, picks);
    for (const p of POSITIONS) for (const b of BASKETS) acc[p][b] += q[p][b];
  }
  return acc;
}

const inPoints = (acc) => Object.fromEntries(Object.entries(acc).map(([p, d]) => [p, Object.fromEntries(Object.entries(d).map(([b, u]) => [b, toPoints(u)]))]));

/** One question in points (display / parity only). */
const questionBaskets = (l1, picks) => inPoints(questionUnits(l1, picks));

/** Mandjes per position in points (display only) — converted from exact units, so no accumulated noise. */
const testBaskets = (questions) => inPoints(testUnits(questions));

// ── Input validation (instruction §2): reject and log, never coerce ──────────

class BleedInputError extends Error {
  constructor(index, message) {
    super(`response ${index + 1}: ${message}`);
    this.name = 'BleedInputError';
    this.index = index;
  }
}

const isBool = (v) => v === true || v === false;

/**
 * One response record (handover §3) → [l1 group names, l2 wheel positions], or a BleedInputError.
 * l1 comes from `l1_groups` (names) or the session store's `l1_picks` ([{group, slot}] — the slot is
 * never read); l2 from `l2_picks` (names, or [{archetype}]).
 */
function parseResponse(r, i) {
  if (!r || typeof r !== 'object') throw new BleedInputError(i, 'not a record');
  if (!isBool(r.l1_refusal)) throw new BleedInputError(i, 'l1_refusal must be a boolean');
  if (r.timeout !== undefined && !isBool(r.timeout)) throw new BleedInputError(i, 'timeout must be a boolean when present');
  let l1;
  if (Array.isArray(r.l1_groups)) l1 = r.l1_groups;
  else if (Array.isArray(r.l1_picks)) l1 = r.l1_picks.map((x) => (x && typeof x === 'object' ? x.group : undefined));
  else throw new BleedInputError(i, 'missing l1_groups');
  if (!Array.isArray(r.l2_picks)) throw new BleedInputError(i, 'missing l2_picks');
  const l2 = r.l2_picks.map((x) => (typeof x === 'string' ? x : x && typeof x === 'object' ? x.archetype : undefined));

  if (r.l1_refusal || r.timeout === true) {
    if (l1.length || l2.length) throw new BleedInputError(i, 'a refusal or timeout carries no Layer-1 or Layer-2 picks');
    return [[], []];
  }
  if (l1.length < 1 || l1.length > 2) throw new BleedInputError(i, `Layer 1 needs 1–2 groups (got ${l1.length}); no group must be flagged as a refusal or timeout`);
  for (const g of l1) if (!GROUPS[g]) throw new BleedInputError(i, `unknown group ${JSON.stringify(g)}`);
  if (new Set(l1).size !== l1.length) throw new BleedInputError(i, 'duplicate Layer-1 group');
  if (l2.length > 2) throw new BleedInputError(i, `Layer 2 allows at most 2 picks (got ${l2.length})`);
  for (const a of l2) {
    if (!posOf[a]) throw new BleedInputError(i, `unknown archetype ${JSON.stringify(a)}`);
    if (!l1.includes(groupOf[posOf[a]])) throw new BleedInputError(i, `${a} is outside the picked Layer-1 group(s)`);
  }
  if (new Set(l2).size !== l2.length) throw new BleedInputError(i, 'duplicate Layer-2 pick');
  return [l1.slice(), l2.map((a) => posOf[a])];
}

/** Response records → scoring input, validated; the first bad record throws. */
function toScoringInput(responses) {
  if (!Array.isArray(responses)) throw new BleedInputError(-1, 'responses must be an array');
  return responses.map(parseResponse);
}

// ── Session outputs (instruction §3.4) ────────────────────────────────────────

const sumOf = (o) => Object.values(o).reduce((a, b) => a + b, 0);

/**
 * The Keuze/Echo graph data per group, from UNITS (payload instruction §1.2; pick_echo v0.2.0): points to
 * one decimal, and gekozen_aandeel = gekozen ÷ totaal in %, half up, exact. A Layer-1 choice is a direct
 * choice too (owner, 13 Oct): gekozen = keuze + passief; keuze and passief stay separate in the data.
 */
function groupView(accU) {
  const pts = (u) => pyRound(toPoints(u), 1);
  const out = {};
  for (const [g, ps] of Object.entries(GROUPS)) {
    let k = 0, pa = 0, ee = 0, we = 0;
    for (const p of ps) k += accU[p].keuze;
    for (const p of ps) pa += accU[p].passief;
    for (const p of ps) ee += accU[p].groen + accU[p].blauw_intern;
    for (const p of ps) we += accU[p].blauw + accU[p].paars + accU[p].geel;
    const tot = k + pa + ee + we;
    out[g] = {
      keuze: pts(k), passief: pts(pa), eigen_echo: pts(ee), wiel_echo: pts(we), totaal: pts(tot),
      gekozen: pts(k + pa), gekozen_aandeel: X.pctHalfUp(k + pa, tot),
    };
  }
  return out;
}

/**
 * Payload P12, from UNITS — the origin of ONE archetype's weight (pick_echo v0.2.0 support_herkomst). Call it
 * with the Support from scoreSession (the same Support c_modulation and the P11 band use); never determine
 * the Support here. Echo ≥ 50 % of the total → 'echo' (exact: 2 × echo ≥ total); otherwise the larger of
 * keuze and passief (tie → 'keuze'). No geometry → null (no line).
 */
function supportHerkomst(accU, supportPos) {
  const b = accU[supportPos];
  const tot = sumOf(b);
  if (tot <= 0) return null;
  let echo = 0;
  for (const k of ECHO) echo += b[k];
  if (2 * echo >= tot) return 'echo';
  return b.keuze >= b.passief ? 'keuze' : 'passief';
}

/** Python's str() of a value already rounded to one decimal: 36 → "36.0". */
const pyFloat = (x) => (Number.isInteger(x) ? x.toFixed(1) : String(x));

/** `-- KEUZE / ECHO PER GROEP --` from UNITS — computed once, sent in the payload, never recomputed by the model. */
function payloadBlock(accU) {
  const lines = ['-- KEUZE / ECHO PER GROEP --'];
  for (const [g, d] of Object.entries(groupView(accU))) {
    lines.push(`${g}: keuze ${pyFloat(d.keuze)} | passief ${pyFloat(d.passief)} | echo eigen hardware ${pyFloat(d.eigen_echo)} `
      + `| echo uit het wiel ${pyFloat(d.wiel_echo)} | totaal ${pyFloat(d.totaal)} | gekozen-aandeel ${d.gekozen_aandeel}%`);
  }
  return lines.join('\n');
}

/**
 * Rank all twelve, in integers: total, then more single Layer-2 picks, more keuze, more passief, then the
 * lower wheel position (PROVISIONAL — owner decision B1; each such case is returned in `tie_breaks` so the
 * caller logs it). Equal means equal: no tolerance.
 */
function rank(totalsU, singlePicks, accU) {
  const tieBreaks = [];
  const order = POSITIONS.slice().sort((a, b) => {
    const steps = [
      totalsU[b] - totalsU[a],
      singlePicks[b] - singlePicks[a],
      accU[b].keuze - accU[a].keuze,
      accU[b].passief - accU[a].passief,
    ];
    for (const d of steps) if (d !== 0) return d;
    tieBreaks.push([byPos(a), byPos(b)].sort());
    return a - b;
  });
  return { order, tieBreaks };
}

/**
 * One completed v2 session → everything §3.4 lists. Engine-facing values are integer units (`totals_u`,
 * `mandjes_u`; the unit is `unit`); `totals` and `mandjes` are the same values in points, for display.
 * Session data only: nothing here goes into the account profile without an owner decision (privacy §3).
 * @param {object[]} responses the session's 36 response records
 */
function scoreSession(responses) {
  const questions = toScoringInput(responses);
  const accU = testUnits(questions);
  const totalsU = Object.fromEntries(POSITIONS.map((p) => [p, sumOf(accU[p])]));
  const singlePicks = Object.fromEntries(POSITIONS.map((p) => [p, 0]));
  for (const [, picks] of questions) if (picks.length === 1) singlePicks[picks[0]] += 1;

  const { order, tieBreaks } = rank(totalsU, singlePicks, accU);
  const [main, support] = order;
  const shadow = purple(main);
  const named = (o) => Object.fromEntries(POSITIONS.map((p) => [byPos(p), o[p]]));
  return {
    scoring_version: SCORING_VERSION,
    config_version: CONFIG.version,
    unit: `${UNIT.num}/${UNIT.den}`,
    totals_u: named(totalsU),
    mandjes_u: named(accU),
    totals: named(Object.fromEntries(POSITIONS.map((p) => [p, toPoints(totalsU[p])]))),
    mandjes: named(inPoints(accU)),
    single_picks: named(singlePicks),
    group_view: groupView(accU),
    payload_block: payloadBlock(accU),
    ranking: order.map(byPos),
    main: byPos(main),
    support: byPos(support),
    support_herkomst: supportHerkomst(accU, support),
    shadow: byPos(shadow),
    tetrad: groupOf[main] === groupOf[support] && TETRAD_GROUPS.includes(groupOf[main]),
    polar_norm: polarNorm(totalsU[main], totalsU[shadow]),
    ...polarization(totalsU[main], totalsU[shadow]),
    tie_breaks: [...new Map(tieBreaks.map((t) => [t.join('|'), t])).values()],
  };
}

/** Every answer one question allows: one or two groups in Layer 1, then zero, one or two picks among them. */
function* validStates() {
  const gs = Object.keys(GROUPS);
  const combos = (xs, k) => (k === 0 ? [[]] : xs.flatMap((x, i) => combos(xs.slice(i + 1), k - 1).map((c) => [x, ...c])));
  for (const k of [1, 2]) {
    for (const l1 of combos(gs, k)) {
      const shown = l1.flatMap((g) => GROUPS[g]);
      for (const n of [0, 1, 2]) for (const picks of combos(shown, n)) yield [l1, picks];
    }
  }
}

/**
 * C-path A channel ceilings for v2 (Path A wiring task v0.1, rewiring 2), in integer units, derived from the
 * same config as the unit: 36 × the most one question can put in that channel for one archetype. Blue counts
 * the internal Blue too. Today 360 / 216 / 144 / 144 (× 3/10 = 108 / 64.8 / 43.2 / 43.2 points).
 */
function deriveChannelCeilings() {
  const mx = { green: 0, blue: 0, purple: 0, yellow: 0 };
  for (const [l1, picks] of validStates()) {
    for (const b of Object.values(questionUnits(l1, picks))) {
      mx.green = Math.max(mx.green, b.groen);
      mx.blue = Math.max(mx.blue, b.blauw + b.blauw_intern);
      mx.purple = Math.max(mx.purple, b.paars);
      mx.yellow = Math.max(mx.yellow, b.geel);
    }
  }
  return Object.freeze(Object.fromEntries(Object.entries(mx).map(([k, v]) => [k, 36 * v])));
}
const CHANNEL_CEILING_U = deriveChannelCeilings();

module.exports = {
  SCORING_VERSION, CONFIG, UNIT, PICK_U, FB_U, deriveUnit, toPoints, CHANNEL_CEILING_U, validStates,
  NAMES, GROUPS, BASKETS, ECHO, groupOf, posOf, byPos, sibling, purple, blue, yellow,
  scoreQuestion, questionUnits, testUnits, questionBaskets, testBaskets, toScoringInput, parseResponse,
  groupView, payloadBlock, scoreSession, rank, supportHerkomst, BleedInputError,
};
