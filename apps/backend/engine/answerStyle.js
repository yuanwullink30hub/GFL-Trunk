/**
 * Layer C — answer-style tags (Response-Style Table v0.3.1; Answer Style Sheet v1.0). DRAFT: built and
 * tested now, live with the Bleed v2 cutover (two-layer sessions only).
 *
 * Every tag the sheet marks ready:
 *   T-CIRCUIT  both siblings of one group, more than usual — a line-for-line port of `t_circuit_v0_1.py`
 *              (Backend Task T-CIRCUIT v0.1), which also yields V-BROAD (spread at dominant intensity)
 *   T-PRECISE  two groups at Layer 1, then exactly one archetype (DROPPED), more than usual
 *   T-SHARP    "Geen van deze past" on 6–11 questions AND a corroboration — a port of `t_sharp_v0_1.py`
 *              (Backend Task T-SHARP v0.1)
 *   T-OPEN     Layer 2 left empty rarely (1 ≤ count ≤ ⌊p₀ × opportunities⌋)
 *   V-PRECISION Layer 2 left empty too often (binomial)
 *   V-POS      display slot A among the Layer-1 picks in ≥ 50 % of the answered questions
 * V-TIME and V-SPEED are not used (owner, 13 Oct).
 *
 * Layer C never feeds scores, mandjes, the geometry or the bleed: it changes how the report reads,
 * not what weighs. Session data only — nothing goes into the account profile or the tetrad row.
 * Counts, opportunities, shares and thresholds are backend-internal: the model never sees numbers
 * about picks (v7 W1), so only the tags (codes + word parameters) leave this module.
 */

'use strict';

const { toScoringInput, groupOf, posOf, GROUPS } = require('./bleedV2');
const { threshold } = require('./exact');

/** count / n ≥ a/b by integer cross-multiplication (G6). */
const atLeast = (count, n, [a, b]) => b * count >= a * n;

/** Seeds, in one versioned object — calibrated post-launch (p₀ → the median responder's rate per pattern). */
const STYLE_CONFIG = Object.freeze({
  version: 'response-style v0.3.1 / answer-style sheet v1.0 (seeds)',
  // p0 / alpha feed the binomial tail (a probability, not a comparison). Every ratio THRESHOLD is an exact
  // fraction [a, b], compared by integer cross-multiplication (gate G6): count/n ≥ a/b ⇔ b × count ≥ a × n.
  T_CIRCUIT: Object.freeze({ p0: 0.15, alpha: 0.05, min_opportunities: 8, dominant: threshold('1/2'), concentration: threshold('1/2') }),
  T_PRECISE: Object.freeze({ p0: 0.15, alpha: 0.05, min_opportunities: 8, dominant: threshold('1/2') }),
  // Backend Task T-SHARP v0.1 (owner, 13 Oct): the count gate runs at α 0.10 because T-SHARP is the only
  // tag with a second gate (the corroboration); 6..11 refusals fire, 12 or more is silence.
  T_SHARP: Object.freeze({ p0: 0.08, alpha_count: 0.10, ceiling: 12, neff_max: threshold('17/2') }),   // polar route: the engine band (> 60 %)
  // T-OPEN ceiling ⌊p0 × n⌋ in integers (p0_exact) + V-PRECISION's binomial tail (p0)
  L2_NONE: Object.freeze({ p0: 0.15, p0_exact: threshold('3/20'), alpha: 0.05, min_opportunities: 8 }),
  V_POS: Object.freeze({ share: threshold('1/2'), min_opportunities: 8, slot: 'A' }),
});

/** Python's math.comb as a float, exact for these sizes. */
function comb(n, k) {
  let c = 1n;
  for (let i = 1n; i <= BigInt(k); i++) c = (c * (BigInt(n) - BigInt(k) + i)) / i;
  return Number(c);
}

/** Smallest k with P(X ≥ k) ≤ alpha for X ~ Binomial(n, p0) — the reference's fire_min, term for term. */
function fireMin(n, p0 = STYLE_CONFIG.T_CIRCUIT.p0, alpha = STYLE_CONFIG.T_CIRCUIT.alpha) {
  for (let k = 0; k <= n; k++) {
    let tail = 0;
    for (let i = k; i <= n; i++) tail += comb(n, i) * p0 ** i * (1 - p0) ** (n - i);
    if (tail <= alpha) return k;
  }
  return n + 1;
}

/** The §2 firing rule: enough opportunities, and a count improbably high against p₀. */
function fires(count, opportunities, cfg) {
  const threshold = opportunities >= cfg.min_opportunities ? fireMin(opportunities, cfg.p0, cfg.alpha) : null;
  return { threshold, fired: threshold !== null && count >= threshold };
}

/**
 * One question's response state (Response-Style Table §1), from the validated scoring input.
 * @param {string[]} l1     the Layer-1 groups (empty: refusal or timeout)
 * @param {number[]} picks  the Layer-2 picks as wheel positions
 * @returns {[string, string|null]} [state, the group a dual pick counts for]
 */
function responseState(l1, picks) {
  if (!l1.length) return ['NO-L1', null];
  const pg = picks.map((p) => groupOf[p]);
  if (l1.length === 1) return picks.length === 2 ? ['DUAL-ISOLATED', l1[0]] : picks.length === 1 ? ['RESOLVED', null] : ['L2-NONE', null];
  if (picks.length === 0) return ['L2-NONE', null];
  if (picks.length === 1) return ['DROPPED', null];
  return pg[0] === pg[1] ? ['DUAL-CONTRAST', pg[0]] : ['RESOLVED-PAIR', null];
}

/** Questions as { r: record, l1, picks, state, group } — validated once, read by every detector. */
function readQuestions(responses) {
  return toScoringInput(responses).map(([l1, picks], i) => {
    const [state, group] = responseState(l1, picks);
    return { r: responses[i], l1, picks, state, group };
  });
}

const groupOfName = (name) => {
  if (!posOf[name]) throw new Error(`answer style needs an archetype name (got ${JSON.stringify(name)})`);
  return groupOf[posOf[name]];
};

/**
 * T-CIRCUIT for one completed v2 session (also yields V-BROAD).
 * @param {object[]} responses the session's response records (validated: bad records throw)
 * @param {string}   main      the engine's Main (bleedV2.scoreSession, incl. its tie-break)
 * @returns {{ tags: string[], internal: object }} `tags` may be sent; `internal` never leaves the backend
 */
function tCircuit(responses, main, questions = readQuestions(responses)) {
  if (!posOf[main]) throw new Error(`T-CIRCUIT needs the engine's Main (got ${JSON.stringify(main)})`);
  const cfg = STYLE_CONFIG.T_CIRCUIT;
  const opportunities = questions.filter((q) => q.state !== 'NO-L1').length;
  const hits = questions.filter((q) => q.state === 'DUAL-ISOLATED' || q.state === 'DUAL-CONTRAST').map((q) => q.group);
  const count = hits.length;
  const threshold = opportunities >= cfg.min_opportunities ? fireMin(opportunities) : null;
  const internal = { main, opportunities, count, threshold };
  if (threshold === null || count < threshold) return { tags: [], internal: { ...internal, fires: false } };

  const intensity = atLeast(count, opportunities, cfg.dominant) ? 'dominant' : 'present';
  const tally = {};
  for (const g of hits) tally[g] = g in tally ? tally[g] + 1 : 1;
  const shares = Object.fromEntries(Object.entries(tally).map(([g, n]) => [g, n / count]));
  const mainGroup = groupOf[posOf[main]];
  const conc = Object.keys(tally).filter((g) => atLeast(tally[g], count, cfg.concentration)).sort()
    .sort((a, b) => (a === mainGroup ? 0 : 1) - (b === mainGroup ? 0 : 1));                   // the Main's group first
  let tags;
  if (conc.length) tags = conc.map((g) => `T-CIRCUIT(groep=${g}, main_group=${g === mainGroup ? 'ja' : 'nee'}, intensiteit=${intensity})`);
  else if (intensity === 'dominant') tags = ['V-BROAD'];
  else tags = ['T-CIRCUIT(spreiding=ja, intensiteit=present)'];
  return { tags, internal: { ...internal, fires: true, intensity, shares } };
}

/** T-PRECISE — DROPPED over the questions with two Layer-1 groups. */
function tPrecise(questions) {
  const cfg = STYLE_CONFIG.T_PRECISE;
  const opportunities = questions.filter((q) => q.l1.length === 2).length;
  const count = questions.filter((q) => q.state === 'DROPPED').length;
  const { threshold, fired } = fires(count, opportunities, cfg);
  const intensity = fired && atLeast(count, opportunities, cfg.dominant) ? 'dominant' : 'present';
  return { tags: fired ? [`T-PRECISE(intensiteit=${intensity})`] : [], internal: { opportunities, count, threshold, fires: fired } };
}

/** The effective number of archetypes on the wheel: 12 = even spread, ~3.1 = the bleed's floor. */
function nEff(totals) {
  const v = Object.values(totals);
  let s = 0, ss = 0;
  for (const t of v) s += t;
  for (const t of v) ss += t * t;
  return ss ? (s * s) / ss : 12.0;
}

/**
 * T-SHARP — port of `t_sharp_v0_1.py` (Backend Task T-SHARP v0.1; RST v0.3.2 §3). "Geen van deze
 * past" at Layer 1 more often than usual (timeouts are not refusals; opportunities = all questions),
 * below the ceiling, AND a corroboration: T-PRECISE fires, the wheel is concentrated (N_eff ≤ 8.5),
 * or the polarisation band is upper. The totals and the band are the engine's (compute-once), never
 * recomputed. The band is the one AFGELEIDE INDICES carries — round(100 × polar_norm) > 60 — not the
 * reference's raw polar_norm > 0.60 (owner, 13 Oct: use the band; the two differ only for a
 * polar_norm between 0.600 and 0.605). V-POS suppression happens in applyPrecedence. Nothing is stored.
 * @param {{ tPreciseFired: boolean, totals: Record<string, number>, polarizationLevel: string }} engine
 */
function tSharp(questions, { tPreciseFired, totals, polarizationLevel }) {
  const cfg = STYLE_CONFIG.T_SHARP;
  if (!totals || Object.keys(totals).length !== 12) throw new Error('T-SHARP needs the engine\'s 12 totals');
  if (!Object.values(totals).every(Number.isSafeInteger)) throw new Error('T-SHARP needs the totals in integer units (totals_u)');
  if (!['HIGH_POLARIZATION', 'MODERATE', 'HIGH_INDIVIDUATION'].includes(polarizationLevel)) throw new Error('T-SHARP needs the engine\'s polarisation band');
  const opportunities = questions.length;
  const refusals = questions.filter((q) => q.r.l1_refusal === true && q.r.timeout !== true).length;
  const threshold = fireMin(opportunities, cfg.p0, cfg.alpha_count);
  const ne = nEff(totals);                                                     // reported only
  // N_eff ≤ a/b ⇔ b × S² ≤ a × Σt², in integers (G6): an exact 8.5 lands where the rule puts it
  let S = 0, SS = 0;
  for (const t of Object.values(totals)) { S += t; SS += t * t; }
  const [na, nb] = cfg.neff_max;
  const routes = { t_precise: Boolean(tPreciseFired), concentrated: SS > 0 && nb * S * S <= na * SS, polar_upper: polarizationLevel === 'HIGH_POLARIZATION' };
  const reason = refusals < threshold ? 'below threshold'
    : refusals >= cfg.ceiling ? 'ceiling: silence'
      : !Object.values(routes).some(Boolean) ? 'uncorroborated' : 'fires';
  return {
    tags: reason === 'fires' ? ['T-SHARP'] : [],
    internal: { opportunities, refusals, threshold, n_eff: ne, polarization_band: polarizationLevel, routes, reason },
  };
}

/**
 * Layer-2 "none" read by frequency (RST v0.3 §3/§4): rare → T-OPEN, too often → V-PRECISION, in
 * between → nothing. The two exclude each other by construction (⌊p₀ × n⌋ < the binomial threshold).
 */
function l2None(questions, { main, support }) {
  const cfg = STYLE_CONFIG.L2_NONE;
  const fallbacks = questions.filter((q) => q.state === 'L2-NONE');
  const opportunities = questions.filter((q) => q.state !== 'NO-L1').length;
  const count = fallbacks.length;
  const groups = [...new Set(fallbacks.flatMap((q) => q.l1))].sort((a, b) => Object.keys(GROUPS).indexOf(a) - Object.keys(GROUPS).indexOf(b));
  const { threshold, fired: tooOften } = fires(count, opportunities, cfg);
  const [pa, pb] = cfg.p0_exact;
  const ceiling = (pa * opportunities - ((pa * opportunities) % pb)) / pb;      // ⌊p0 × n⌋, in integers
  const rare = opportunities >= cfg.min_opportunities && count >= 1 && count <= ceiling;
  const coreGroups = [groupOfName(main), groupOfName(support)];
  const tags = [];
  if (rare) tags.push(`T-OPEN(groepen=${groups.join('+')}, main_of_support_groep=${groups.some((g) => coreGroups.includes(g)) ? 'ja' : 'nee'})`);
  if (tooOften) tags.push(`V-PRECISION(groepen=${groups.join('+')})`);
  return { tags, internal: { opportunities, count, ceiling, threshold, groups } };
}

/**
 * V-POS — display slot A among the Layer-1 picks in ≥ 50 % of the answered questions (the order is
 * randomised, so this reads screen position rather than content). Needs the session store's
 * `l1_picks: [{group, slot}]`; without slot data it is not evaluated. Scoring never reads the slot.
 */
function vPos(questions) {
  const cfg = STYLE_CONFIG.V_POS;
  const answered = questions.filter((q) => q.l1.length);
  const withSlots = answered.filter((q) => Array.isArray(q.r.l1_picks) && q.r.l1_picks.every((p) => p && p.slot !== undefined));
  if (!answered.length || withSlots.length !== answered.length) return { tags: [], internal: { evaluated: false } };
  const isA = (s) => String(s).toUpperCase() === cfg.slot || s === 1;
  const count = answered.filter((q) => q.r.l1_picks.some((p) => isA(p.slot))).length;
  const fired = answered.length >= cfg.min_opportunities && atLeast(count, answered.length, cfg.share);
  return { tags: fired ? ['V-POS'] : [], internal: { evaluated: true, opportunities: answered.length, count, fires: fired } };
}

/**
 * DUAL-CONTRAST secondary check (RST §3, not a tag): which group H was outranked. Returned for the
 * backend's own review only — never sent, never stored by this module.
 */
function dualContrastOutranked(questions) {
  const tally = {};
  for (const q of questions.filter((x) => x.state === 'DUAL-CONTRAST')) {
    const h = q.l1.find((g) => g !== q.group);
    tally[h] = h in tally ? tally[h] + 1 : 1;
  }
  return tally;
}

// ── Precedence, the whole set, payload line, data page ────────────────────────

const HARD_VALIDITY = ['V-POS'];
const code = (tag) => tag.replace(/\(.*$/, '');

/**
 * Precedence, applied BEFORE sending (sheet §Precedence): hard validity (V-POS) drops every
 * interpretive T-tag; soft validity (V-BROAD, V-PRECISION) leaves them. T-SHARP and T-PRECISE are
 * BOTH sent when both fire (T-SHARP task §3): the model writes one sentence (T-SHARP's), and
 * T-PRECISE's non-text effect — firmer function claims for the picked archetypes — still applies.
 */
function applyPrecedence(tags) {
  let out = tags.slice();
  if (out.some((t) => HARD_VALIDITY.includes(code(t)))) out = out.filter((t) => !code(t).startsWith('T-'));
  return out;
}

/**
 * Every Layer-C tag for one completed v2 session, precedence applied.
 * @param {object[]} responses the session's response records
 * @param {{ main: string, support: string, totals: Record<string, number>, polarizationLevel: string }} engine
 *        the engine's values (bleedV2.scoreSession: main, support, totals_u — integer units — and
 *        polarizationLevel) — read, never
 *        recomputed; the tags never feed them back
 */
function styleTags(responses, { main, support, totals, polarizationLevel }) {
  const questions = readQuestions(responses);
  const circuit = tCircuit(responses, main, questions);
  const precise = tPrecise(questions);
  const sharp = tSharp(questions, { tPreciseFired: precise.tags.length > 0, totals, polarizationLevel });
  const none = l2None(questions, { main, support });
  const pos = vPos(questions);
  const all = [...circuit.tags, ...precise.tags, ...sharp.tags, ...none.tags, ...pos.tags];
  return {
    tags: applyPrecedence(all),
    internal: {
      T_CIRCUIT: circuit.internal, T_PRECISE: precise.internal, T_SHARP: sharp.internal,
      L2_NONE: none.internal, V_POS: pos.internal, dual_contrast_outranked: dualContrastOutranked(questions),
    },
  };
}

/** `-- ANTWOORDSTIJL -- tags: …` for the model payload (P5), or null when no tag fired (no block at all). */
function antwoordstijlBlock(tags) {
  const sent = applyPrecedence(tags);
  return sent.length ? `-- ANTWOORDSTIJL -- tags: ${sent.join(', ')}` : null;
}

/**
 * The fixed one-line meaning per fired tag, for the server-built data block (read by the external
 * assistant of 5.9). T-CIRCUIT and V-BROAD are the task's own lines; the others follow v7 R-f.
 */
/**
 * The one-line meaning per tag, NL and EN (Data Block Labels EN v0.1 §3). T-PRECISE, T-OPEN, V-PRECISION
 * and V-POS carry the labels file's proposed Dutch (13 Oct), which the English mirrors; the V-PRECISION line
 * says nothing about empty answers (Answer Style Sheet, "never"). Owner ratifies.
 */
const PAGE_LINES = {
  nl: {
    circuitMain: 'Groep als geheel: de hardware van de kern wordt vaak als één geheel beleefd.',
    circuitOther: (g) => `Groep als geheel: een tweede circuit (${g}) doet vaak als geheel mee.`,
    circuitSpread: 'Antwoorden neigen naar groepsniveau, zonder één groep.',
    'V-BROAD': 'Het antwoordpatroon is breder dan gemiddeld; archetype-details zijn voorzichtig te lezen.',
    'T-PRECISE': 'Scherpe resolutie: de algemene richting diende vooral als filter; precies kiezen gaat goed.',
    'T-SHARP': 'Scherp afgebakend: keuzes neigen naar helder in plaats van geschakeerd; algemene groepsantwoorden liggen vaak onder waar dit profiel werkt.',
    'T-OPEN': 'Open gehouden keuze: op enkele momenten was de richting gekozen en bleef de keuze tussen de twee uitdrukkingen open.',
    'V-PRECISION': 'Passieve identiteit alleen op groepsniveau lezen; niet als besluiteloosheid.',
    'V-POS': 'Antwoorden volgen mogelijk de schermpositie; lees het profiel met voorbehoud.',
  },
  en: {
    circuitMain: "Group as a whole: the core's hardware tends to be lived as one whole.",
    circuitOther: (g) => `Group as a whole: a second circuit (${g}) often takes part as a whole.`,
    circuitSpread: 'Answers tend towards group level, without one group standing out.',
    'V-BROAD': 'The answer pattern is broader than average; read archetype details with care.',
    'T-PRECISE': 'Sharp resolution: the general direction mainly served as a filter; precise choosing works well.',
    'T-SHARP': 'Sharply defined: choices tend to be clear-cut rather than graded; general group answers often sit below where this profile operates.',
    'T-OPEN': 'Choice held open: at a few moments the direction was chosen and the choice between its two expressions was held open.',
    'V-PRECISION': 'Read passive identity at group level only; not as indecision.',
    'V-POS': 'Answers may follow screen position; read the profile with reservation.',
  },
};

function dataPageLines(tags, language = 'nl') {
  const L = PAGE_LINES[language === 'en' ? 'en' : 'nl'];
  return applyPrecedence(tags).map((t) => {
    const c = code(t);
    if (c === 'T-CIRCUIT') {
      if (/spreiding=ja/.test(t)) return `T-CIRCUIT — ${L.circuitSpread}`;
      if (/main_group=ja/.test(t)) return `T-CIRCUIT — ${L.circuitMain}`;
      return `T-CIRCUIT — ${L.circuitOther(/groep=([^,)]+)/.exec(t)[1])}`;
    }
    return L[c] ? `${c} — ${L[c]}` : c;
  });
}

module.exports = {
  STYLE_CONFIG, fireMin, nEff, responseState, tCircuit, tPrecise, tSharp, l2None, vPos, dualContrastOutranked,
  styleTags, applyPrecedence, antwoordstijlBlock, dataPageLines, PAGE_LINES, readQuestions,
};
