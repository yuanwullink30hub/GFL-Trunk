/**
 * Deltawerken — Runtime Engine (consolidated Node port of runtime_engine_v0 … v0_4.py)
 * ====================================================================================
 * CONSOLIDATION (Backend Instruction v1 §1):
 *   - The five-file import chain v0 → v0.1 → v0.2 → v0.3 → v0.4 is one module here, in
 *     chain order, each file's docstring kept verbatim as the section header below.
 *   - DELETED while consolidating: RATIFIED_PENDING_WIPEUP (Hero D4 = 30 lives in the
 *     v4.3 workbook) and resolve_shape_split (the tracking/operational split lives
 *     in-sheet — v4.3's Locus column already carries shape:tracking / shape:operational).
 *   - Paths: WORKBOOK is the v4.3 workbook in ./data, loaded ONLY in its compiled JSON form
 *     (scripts/compile-workbook.js; the .xlsx stays the source of record). Its content
 *     checksum is verified at load. τ loads from that workbook's Tau_Calibration sheet (its
 *     one home) instead of the retired standalone Tau_Calibration_v0_PROVISIONAL.xlsx.
 *   - Contract amendments after the port (each marked in place): register bands from the
 *     Band_Cutpoints_v0_PROVISIONAL sheet (Master Prompt v5.2 R4) and Support-always
 *     (R8 — emit_payload_v2 no longer raises when the Support sits outside the pull set).
 *   - Python semantics that move numbers are reproduced exactly (./py.js): round() is
 *     half-to-even on the exact binary value, float() rejects non-numeric text, and the
 *     synthetic corpus uses a CPython-identical random.Random.
 * Everything else ports as written — comments included; they carry provenance.
 */

'use strict';

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { pyRound, pyStr, pyFloat, pyFalsy, PyRandom } = require('./py');
const VERSIONS = require('../config/versions');

const round = pyRound;
const cell = (r, i) => (r && r[i] !== undefined ? r[i] : null);
const key3 = (main, support, state) => `${main}\u0000${support}\u0000${state}`;

const _workbooks = new Map();
function workbook(p) {
  // The compiled workbook JSON; refuses to load if its content checksum does not verify.
  if (!_workbooks.has(p)) {
    const wb = JSON.parse(fs.readFileSync(p, 'utf8'));
    const sum = crypto.createHash('sha256').update(JSON.stringify({ sheet_order: wb.sheet_order, sheets: wb.sheets })).digest('hex');
    if (wb.format !== 'gfl-workbook-json/1' || sum !== wb.content_sha256) {
      throw new Error(`workbook ${path.basename(p)}: checksum mismatch — re-run scripts/compile-workbook.js`);
    }
    _workbooks.set(p, {
      sheetNames: wb.sheet_order, source: wb.source, content_sha256: wb.content_sha256,
      rows: (name) => {
        if (!wb.sheets[name]) throw new Error(`workbook ${path.basename(p)}: no sheet ${name}`);
        return wb.sheets[name];
      },
    });
  }
  return _workbooks.get(p);
}
/** openpyxl iter_rows(min_row=2, values_only=True) */
const dataRows = (p, sheet) => workbook(p).rows(sheet).slice(1);

/* ════════════════════════════════════════════════════════════════════════════
 * runtime_engine_v0.py
 * ────────────────────────────────────────────────────────────────────────────
 * Deltawerken — Calibration Runtime Engine v0 (Layer-3 D-transform path)
 * ======================================================================
 * STATUS: EXPLORATORY BUILD for calibration. Runs end-to-end NOW on provisional
 * values so the synthetic corpus produces the distributions the deferred scalars
 * calibrate against. Copies the C-path discipline literally (c_magnitude_precompute
 * FINAL): committed form implemented verbatim; every non-committed value isolated
 * in PROVISIONAL_SCALARS_L3; overwriting those after calibration is the only
 * change this path should ever need.
 *
 * SOURCES (named exactly, per interim sourcing rule):
 *   - Layer-3 form:  Deltawerken_D_Relational_Operations_Layer3_v1_0 (§2 composition,
 *                    §3 terms, §4 profiles, §5 hole-map, §6 open items)
 *   - Layer-2 data:  Matrix_360_v4_1_payment_styles.xlsx :: D_Transform_Articulations
 *                    [V4.2 GAP — see below], Matrix_360 (D-arcs), Payment_Styles
 *   - C-path:        c_magnitude_precompute_FINAL.py (committed; imported unmodified)
 *   - Semantics:     C-Layer Closure v1.0 (ratified) — overload amplification is
 *                    D-state content; report reads it from composed state, never C.
 *
 * V4.2 GAP (flagged, not silently absorbed): the project workbook is v4.1. Its
 * `Locus` column stores `shape` UNSPLIT; the ratified split (shape:tracking /
 * shape:operational, 120 cells) and the Pull_Types sheet live in v4.2, which is
 * not in the project folder. Consequence here: shape-locus articulations are
 * loaded with locus_resolution="V42_PENDING" and are EXCLUDED from the pull sum
 * (conservative: shape:operational is not a pull by ratified semantics, and v4.1
 * cannot distinguish the two). Swapping in v4.2 upgrades tracking-shape cells to
 * active pulls with no other code change.
 *   [Port note: the v4.3 workbook carries the split in-sheet, so no row resolves to
 *    V42_PENDING any more; the branch is kept as written.]
 *
 * COMMITTED FORM (implemented verbatim):
 *   τ'(Main, state) = τ(Main, state) pulled by Σ[ f(direction, sense, locus) · w(co-driver) ]
 *   - Two curves, both the Main's (baseline at τ, transform at τ'). Support
 *     contributes NO D-states; identity enters through f and w only.
 *   - Active set: rank by total score; include rank k if score_k ≥ 0.70·score_Main;
 *     walk down from 5, floor 3, cap 5 (→ max 4 co-drivers).
 *   - w = score_k / score_Main (counted, this person's geometry — Principle 1).
 *   - direction: away pulls the Main OFF its cost-state (−), toward pushes ON (+).
 *   - orth: carries weight, produces NO displacement — reported, never discarded.
 *   - entry: READ not plotted (threshold statement; the arc has five points).
 *   - [HELD] propagates as a hole; the engine renders absence, never interpolates.
 *
 * NOT COMMITTED (isolated below, flagged):
 *   - τ's 60 values (five per Main) — deferred by ruling; provisional 1.0.
 *   - The pull OPERATOR binding Σ to τ — spec states "pulled by" without fixing
 *     additive vs proportional; cost-quantity gap notes τ "stays a proportion of
 *     the pull with no absolute ceiling" absent a derived bound. Provisional:
 *     proportional, τ' = τ·(1 + Σ). Alternative (additive) retained switchable.
 *   - f magnitude — spec: "the weights produce the pull" → f carries SIGN and
 *     ROUTING only, magnitude lives in w. Held as the committed reading; a unit
 *     f_magnitude scalar is exposed anyway so calibration can falsify it.
 *   - Band cut-points — derived from the synthetic distribution as percentile
 *     candidates, PROVISIONAL until real geometries exist.
 * ════════════════════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────────────────────
// PROVISIONAL SCALARS — Layer-3. NOT FITTED. NOT FINAL.
// ─────────────────────────────────────────────────────────────────────────────
const PROVISIONAL_SCALARS_L3 = {
  tau_default: 1.0,              // all 60 τ values — PROVISIONAL uniform
  tau_overrides: new Map(),      // (main, state) -> value, empty until calibrated
  pull_operator: 'proportional', // PROVISIONAL: "proportional" τ'=τ(1+Σ) | "additive" τ'=τ+Σ
  f_magnitude: 1.0,              // committed reading: sign-only (w carries magnitude)
  band_percentiles: [50, 80, 95],// candidate cut-points: above / far-above / extreme
};
const PROVISIONAL_FLAGGED = true;

const WORKBOOK = path.join(__dirname, 'data', 'Matrix_360_v4_3.json');   // compiled from Matrix_360_v4_3_reconstructed.xlsx
const V42_GAP = ("Locus 'shape' unsplit in v4.1; tracking/operational split + Pull_Types " +
                 'sheet are in v4.2 (not in project). shape cells excluded from pulls ' +
                 'pending swap-in.');

const DIRECTION_SIGN = { away: -1.0, toward: +1.0, orth: 0.0 };


// ─────────────────────────────────────────────────────────────────────────────
// Data loading — Layer-2 articulations and Main D-arcs. No derivation at load.
// ─────────────────────────────────────────────────────────────────────────────
class Articulation {
  constructor(main, support, state, direction, sense, locus, locus_resolution) {
    this.main = main; this.support = support; this.state = state;
    this.direction = direction; this.sense = sense; this.locus = locus;
    this.locus_resolution = locus_resolution;   // "committed" | "V42_PENDING" | "n/a"
  }
}

/** (main, support, state) -> Articulation. 660 expected. */
function load_layer2(p = WORKBOOK) {
  const out = new Map();
  for (const r of dataRows(p, 'D_Transform_Articulations')) {
    if (pyFalsy(cell(r, 0))) continue;
    const main = pyStr(cell(r, 0)), support = pyStr(cell(r, 1)), state = pyStr(cell(r, 2));
    const direction = pyStr(cell(r, 4)), sense = pyStr(cell(r, 7)), locus = pyStr(cell(r, 8));
    const res = (locus === 'shape' ? 'V42_PENDING'
      : ['—', 'None', ''].includes(locus) ? 'n/a' : 'committed');
    out.set(key3(main, support, state), new Articulation(main, support, state, direction, sense, locus, res));
  }
  return out;
}

// [RATIFIED_PENDING_WIPEUP deleted at consolidation — Hero D4 = 30 is in the v4.3 workbook.]

/** archetype -> [D1..D5], value or None ([HELD] hole — never interpolated). */
function load_main_arcs(p = WORKBOOK) {
  const arcs = {};
  for (const r of dataRows(p, 'Matrix_360')) {
    if (cell(r, 1) !== 'D' || pyFalsy(cell(r, 0))) continue;
    const name = pyStr(cell(r, 0)).split('/').pop().trim();
    const state = pyStr(cell(r, 2)).trim().split(/\s+/)[0];   // "D1".."D5"
    const raw = pyStr(cell(r, 3));
    let v;
    try {
      v = pyFloat(raw);
    } catch (e) {
      v = null;                                               // [HELD ...] → hole
    }
    if (!arcs[name]) arcs[name] = [null, null, null, null, null];
    const idx = parseInt(state[1], 10) - 1;
    arcs[name][idx] = v;
  }
  return arcs;
}


// ─────────────────────────────────────────────────────────────────────────────
// Geometry input — twelve counted numbers from the LOCKED bleed engine.
// Consumed, never recomputed.
// ─────────────────────────────────────────────────────────────────────────────
class RuntimeGeometry {
  constructor({ scores, main = '', support } = {}) {
    this.scores = scores;             // archetype -> total score (counted)
    this.main = main;
    if (support) this.support = support;
    if (!this.main) {
      let best = null;
      for (const [k, v] of Object.entries(this.scores)) if (best === null || v > this.scores[best]) best = k;
      this.main = best;
    }
  }
}


/** Committed selection rule: rank; include k if score_k ≥ 0.70·Main;
 *  walk down from 5; floor 3, cap 5. Returns [(name, w)] excluding Main. */
function active_set(geo) {
  const ranked = Object.entries(geo.scores).sort((a, b) => b[1] - a[1]);
  const m = geo.scores[geo.main];
  let sel = [ranked[0]];
  for (const [name, s] of ranked.slice(1, 5)) {
    if (s >= 0.70 * m) sel.push([name, s]);
  }
  while (sel.length < 3 && sel.length < ranked.length) {  // floor 3
    sel.push(ranked[sel.length]);
  }
  sel = sel.slice(0, 5);                                   // cap 5
  return sel.filter(([n]) => n !== geo.main).map(([n, s]) => [n, s / m]);
}


// ─────────────────────────────────────────────────────────────────────────────
// The composition — τ' = τ pulled by Σ[f·w], committed form.
// ─────────────────────────────────────────────────────────────────────────────
function tau(main, state) {
  const k = `${main}\u0000${state}`;
  return PROVISIONAL_SCALARS_L3.tau_overrides.has(k)
    ? PROVISIONAL_SCALARS_L3.tau_overrides.get(k)
    : PROVISIONAL_SCALARS_L3.tau_default;
}

function compose_transform(geo, layer2, arcs) {
  const states = ['D1', 'D2', 'D3', 'D4', 'D5'];
  const codrivers = active_set(geo);
  const baseline = arcs[geo.main] || [null, null, null, null, null];
  const transform = [], per_state = {}, orth_ledger = [], entry_reads = [], excluded = [];

  states.forEach((st, i) => {
    let pull = 0.0;
    const terms = [];
    for (const [name, w] of codrivers) {
      const art = layer2.get(key3(geo.main, name, st));
      if (art === undefined) continue;
      if (art.direction === 'orth') {
        orth_ledger.push({ state: st, codriver: name, weight: round(w, 3),
          reading: 'loaded, bears not on the forfeit' });
        continue;
      }
      if (art.locus === 'entry') {
        entry_reads.push({ state: st, codriver: name, weight: round(w, 3),
          direction: art.direction, sense: art.sense,
          reading: 'threshold statement — read, not plotted' });
        continue;                     // entry never enters the plotted pull
      }
      if (art.locus_resolution === 'V42_PENDING') {
        excluded.push({ state: st, codriver: name, locus: 'shape',
          reason: 'v4.1 cannot split tracking/operational' });
        continue;
      }
      if (art.locus !== 'value') {
        // AXIS PARTITION (L3 §5 'Moves'): only value-locus moves the
        // conversion's MAGNITUDE. shape:* never enters this sum —
        // tracking rides its own axis (v0.4), operational is not a pull.
        continue;
      }
      const f = DIRECTION_SIGN[art.direction] * PROVISIONAL_SCALARS_L3.f_magnitude;
      pull += f * w;
      terms.push({ codriver: name, f, w: round(w, 3), sense: art.sense, locus: art.locus });
    }
    const t = tau(geo.main, st);
    const t_prime = PROVISIONAL_SCALARS_L3.pull_operator === 'proportional' ? t * (1.0 + pull) : t + pull;
    per_state[st] = { tau: t, pull: round(pull, 4), tau_prime: round(t_prime, 4), terms };
    const b = baseline[i];
    transform.push(b === null ? null : round(b * t_prime, 1));
  });

  const displacement = {};
  states.forEach((st, i) => {
    displacement[st] = (baseline[i] === null || transform[i] === null) ? null : round(transform[i] - baseline[i], 1);
  });
  const provisional_scalars_in_use = {};
  for (const [k, v] of Object.entries(PROVISIONAL_SCALARS_L3)) {
    provisional_scalars_in_use[k] = k !== 'tau_overrides' ? v : `${v.size} set`;
  }
  return {
    main: geo.main,
    codrivers: codrivers.map(([n, w]) => ({ name: n, w: round(w, 3) })),
    baseline_arc: baseline,                 // holes stay holes
    transform_arc: transform,               // hole × anything = hole
    per_state,
    orth_ledger,                            // weight carried, no displacement
    entry_reads,                            // prose payload, never a curve value
    excluded_v42_pending: excluded,
    displacement,
    provisional_scalars_in_use,
    WARNING: ('CALIBRATION BUILD. τ uniform-provisional; pull operator ' +
              'provisional; v4.2 shape-split pending. Distributions from this ' +
              'build set candidate cut-points only.'),
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// Synthetic corpus — constructed vectors hitting the configurations where the
// engine could go wrong, plus a random population for distributions.
// ─────────────────────────────────────────────────────────────────────────────
const ARCHETYPES = ['Judge', 'Lover', 'Caregiver', 'Innocent', 'Explorer', 'Outlaw',
  'Trickster', 'Sage', 'Artist', 'Magician', 'Hero', 'Ruler'];

function _vec(main, highs, base = 25, jitter = 8, seed = null) {
  const rng = new PyRandom(seed);
  const scores = {};
  for (const a of ARCHETYPES) scores[a] = base + rng.uniform(0, jitter);
  scores[main] = 95.0;
  Object.assign(scores, highs);
  return new RuntimeGeometry({ scores, main });
}

function synthetic_corpus(n_random = 200, seed = 7) {
  const rng = new PyRandom(seed);
  const named = {
    // four co-drivers pulling one way (stacked-away stress case)
    stacked_pull: _vec('Ruler', { Judge: 90, Sage: 85, Magician: 80, Hero: 78 }, 25, 8, 1),
    // Agency Main with entry pulls live (depletion, deferred profile)
    agency_entry: _vec('Magician', { Hero: 88, Ruler: 80, Outlaw: 75 }, 25, 8, 2),
    // high-weight orth (loaded co-driver bearing not on the forfeit)
    heavy_orth: _vec('Sage', { Innocent: 90, Explorer: 82, Lover: 76 }, 25, 8, 3),
    // the hole: Hero Main, D4 [HELD] must propagate as absence
    hero_hole: _vec('Hero', { Magician: 85, Ruler: 80, Judge: 72 }, 25, 8, 4),
    // thin margin: co-drivers hovering at the 0.70 threshold
    threshold_edge: _vec('Lover', { Caregiver: 66.6, Artist: 66.4, Sage: 67.0 }, 25, 8, 5),
  };
  const population = [];
  for (let i = 0; i < n_random; i++) {
    const main = rng.choice(ARCHETYPES);
    const others = ARCHETYPES.filter((x) => x !== main);
    const chosen = rng.sample(others, rng.randint(2, 5));
    const highs = {};
    for (const a of chosen) highs[a] = rng.uniform(40, 92);
    population.push(_vec(main, highs, 25, 8, 1000 + i));
  }
  return { named, population };
}


/** Displacement distribution → PROVISIONAL percentile cut-point candidates. */
function distribution_report(results) {
  const disp = [];
  for (const r of results) for (const d of Object.values(r.displacement)) if (d !== null) disp.push(Math.abs(d));
  if (!disp.length) return { error: 'no displacements' };
  disp.sort((a, b) => a - b);
  const p = PROVISIONAL_SCALARS_L3.band_percentiles;
  const pct = (q) => disp[Math.min(disp.length - 1, Math.trunc((q / 100) * disp.length))];
  const mean = disp.reduce((s, x) => s + x, 0) / disp.length;
  const mid = Math.floor(disp.length / 2);
  const median = disp.length % 2 ? disp[mid] : (disp[mid - 1] + disp[mid]) / 2;
  return {
    n_displacements: disp.length,
    mean: round(mean, 2),
    median: round(median, 2),
    candidate_cut_points: {
      above_average: round(pct(p[0]), 2),
      far_above_average: round(pct(p[1]), 2),
      extremely_high: round(pct(p[2]), 2),
    },
    NOTE: ('PROVISIONAL — synthetic distribution. Real-geometry ' +
           'recalibration required before any report uses these bands.'),
  };
}


/* ════════════════════════════════════════════════════════════════════════════
 * runtime_engine_v0_1.py
 * ────────────────────────────────────────────────────────────────────────────
 * Deltawerken — Calibration Runtime Engine v0.1
 * =============================================
 * Delta over v0 (both human-ratified this cycle):
 *   1. τ is PRE-DETERMINED BY SHEET: all 60 values load from Tau_Calibration
 *      (Tau_Calibration_v0_PROVISIONAL.xlsx). No τ lives in code. Calibration =
 *      editing the sheet. The engine stamps the payload with the sheet version.
 *   2. MINIMAL PAYLOAD: only the required values are sent — the Main plus the
 *      active co-drivers per the ratified selection rule (set 3–5 incl. Main →
 *      2–4 co-drivers), each fully RESOLVED. No canon, no full matrix, no
 *      derivation downstream. The model is the prose; this is the reasoning.
 * Open (unchanged, deliberately): the pull OPERATOR / boundedness — still
 * provisional-proportional, still the load-bearing calibration decision.
 *   [Port note: the Tau_Calibration sheet now lives inside the v4.3 workbook — its one
 *    home — and the returned version is the pinned tau_calibration_version.]
 * ════════════════════════════════════════════════════════════════════════════ */

const TAU_SHEET = WORKBOOK;

function load_tau_sheet(p = TAU_SHEET) {
  let n = 0;
  for (const r of dataRows(p, 'Tau_Calibration')) {
    if (pyFalsy(cell(r, 0))) continue;
    const main = pyStr(cell(r, 0));
    ['D1', 'D2', 'D3', 'D4', 'D5'].forEach((st, i) => {
      PROVISIONAL_SCALARS_L3.tau_overrides.set(`${main}\u0000${st}`, pyFloat(cell(r, 4 + i)));
      n += 1;
    });
  }
  if (n !== 60) throw new Error(`expected 60 tau values, loaded ${n}`);
  return VERSIONS.tau_calibration_version;
}

/** Only the required values. Resolved fields per active co-driver; the
 *  saved serialisation semantics carried explicitly (orth loaded-not-displacing,
 *  entry read-not-plotted, [HELD] as hole). */
function emit_payload(result, tau_version) {
  const STS = ['D1', 'D2', 'D3', 'D4', 'D5'];
  return {
    main: result.main,
    active_set_size: 1 + result.codrivers.length,      // 3–5 incl. Main
    codrivers_resolved: result.codrivers.map((c) => ({
      name: c.name, w: c.w,
      per_state_terms: Object.fromEntries(Object.entries(result.per_state)
        .map(([st, ps]) => [st, ps.terms.filter((t) => t.codriver === c.name)])),
    })),
    baseline_arc: result.baseline_arc,
    transform_arc: result.transform_arc,
    displacement: result.displacement,
    holes: STS.filter((st, i) => result.baseline_arc[i] === null),
    orth_ledger: result.orth_ledger,
    entry_reads: result.entry_reads,
    tau_calibration_version: tau_version,
    semantics: {
      orth: 'carries weight, no displacement — a reading, not a gap',
      entry: 'threshold statement, never a curve value',
      holes: 'render absence; do not interpolate',
    },
  };
}


/* ════════════════════════════════════════════════════════════════════════════
 * runtime_engine_v0_2.py
 * ────────────────────────────────────────────────────────────────────────────
 * Deltawerken — Calibration Runtime Engine v0.2
 * =============================================
 * Delta over v0.1 (human-directed this cycle): ROLE-INDEXED VALUES.
 * Every archetype carries values in two roles, and the payload must never
 * cross-bind them:
 *   MAIN-role    : its D-arc (the Main's cost curve) and its Main-side τ row.
 *   SUPPORT-role : its C-direction cells (stored explicitly as 'post-test
 *                  support-modulation' in Matrix_360) and its Layer-2 f-fields,
 *                  which are pairwise (Main, Support) reads by construction.
 * Enforcement, not convention: role-guarded accessors raise RoleError on any
 * wrong-role lookup, and every payload block carries an explicit "role" tag so
 * the backend and the model can never mis-bind a value downstream.
 * The distinguished geometric Support (stage-2) additionally ships its committed
 * C-modulation: C_mag = support_weight_norm · (1 − polar_norm) · direction
 * (D-Rel Ops v1.0 §4, verbatim; scalars provisional per C-path discipline).
 * ════════════════════════════════════════════════════════════════════════════ */

const WHEEL = { Judge: 1, Lover: 2, Caregiver: 3, Innocent: 4, Explorer: 5, Outlaw: 6,
  Trickster: 7, Sage: 8, Artist: 9, Magician: 10, Hero: 11, Ruler: 12 };
const OPP = Object.fromEntries(Object.entries(WHEEL).map(([a, i]) =>
  [a, Object.keys(WHEEL).find((b) => WHEEL[b] === ((i + 6 - 1) % 12) + 1)]));

class RoleError extends Error {
  constructor(message) { super(message); this.name = 'RoleError'; }
}

/** archetype -> {function: +1|-1|None}. SUPPORT-role by storage definition
 *  ('post-test support-modulation'). */
function load_c_cells(p = WORKBOOK) {
  const out = {};
  for (const r of dataRows(p, 'Matrix_360')) {
    if (cell(r, 1) !== 'C' || pyFalsy(cell(r, 0))) continue;
    const name = pyStr(cell(r, 0)).split('/').pop().trim();
    const v = pyStr(cell(r, 3));
    const d = v.includes('+') ? +1 : (v.includes('−') || v.includes('-')) ? -1 : null;
    (out[name] = out[name] || {})[pyStr(cell(r, 2))] = d;
  }
  return out;
}

/** The single gate every value passes through, role-checked. */
class RoleIndexedStore {
  constructor(geo, arcs, c_cells, layer2) {
    this.geo = geo; this.arcs = arcs; this.c = c_cells; this.l2 = layer2;
  }
  main_values(name) {
    if (name !== this.geo.main) {
      throw new RoleError(`${name} requested as MAIN but Main is ${this.geo.main}`);
    }
    return { role: 'main', arc: this.arcs[name],
      tau_row: Object.fromEntries(['D1', 'D2', 'D3', 'D4', 'D5'].map((st) => [st, tau(name, st)])) };
  }
  support_values(name) {
    if (name === this.geo.main) {
      throw new RoleError(`${name} is the Main; requested as SUPPORT`);
    }
    const f_rows = {};
    for (const st of ['D1', 'D2', 'D3', 'D4', 'D5']) {
      const art = this.l2.get(key3(this.geo.main, name, st));
      if (art !== undefined) f_rows[st] = { ...art };
    }
    return { role: 'support', c_direction: this.c[name] || {}, f_rows };
  }
}

function polar_norm(geo) {
  const gap = geo.scores[geo.main] - (geo.scores[OPP[geo.main]] ?? 0.0);
  return Math.max(0.0, Math.min(1.0, gap / 100.0));            // denominator PROVISIONAL (D-3)
}

/** support_weight_norm = s_Support / s_Main — the factor c_modulation applies (D-Rel Ops v1.0 §4). */
function support_weight_norm(geo, support) {
  return geo.scores[support] / geo.scores[geo.main];
}

function c_modulation(geo, support, c_cells) {
  const swn = geo.scores[support] / geo.scores[geo.main];
  const k = swn * (1.0 - polar_norm(geo));
  return Object.fromEntries(Object.entries(c_cells[support] || {})
    .map(([f, d]) => [f, d === null ? null : round(k * d, 4)]));
}

function emit_payload_v2(geo, result, store, c_cells, tau_version) {
  const support = geo.support || result.codrivers[0].name;
  store.support_values(support);
  // [R8 amendment — Master Prompt v5.1/v5.2, ratified] The Support is ALWAYS present: the
  //  C-path and the D-path have different membership rules. The Python v0.2 raised
  //  StopIteration when the Support was not an active co-driver; it now ships with its
  //  support_weight_norm and contributes no τ′ terms. For an active Support the value is
  //  identical to its co-driver w (both s_Support / s_Main, rounded to 3).
  const supportCodriver = result.codrivers.find((c) => c.name === support);
  return {
    main: { name: geo.main, role: 'main',
      baseline_arc: result.baseline_arc,
      transform_arc: result.transform_arc,
      displacement: result.displacement,
      holes: ['D1', 'D2', 'D3', 'D4', 'D5'].filter((st, i) => result.baseline_arc[i] === null) },
    support: { name: support, role: 'support',
      w: supportCodriver ? supportCodriver.w : round(support_weight_norm(geo, support), 3),
      c_modulation: c_modulation(geo, support, c_cells),
      c_note: "support-role by storage ('post-test support-modulation'); " +
              'no-channel stays absent, never 0' },
    codrivers: result.codrivers.map((c) => ({ name: c.name, role: 'support', w: c.w })),
    orth_ledger: result.orth_ledger,
    entry_reads: result.entry_reads,
    tau_calibration_version: tau_version,
    role_guard: 'enforced — RoleError on any cross-role lookup',
  };
}


/* ════════════════════════════════════════════════════════════════════════════
 * runtime_engine_v0_3.py
 * ────────────────────────────────────────────────────────────────────────────
 * Deltawerken — Calibration Runtime Engine v0.3
 * =============================================
 * Delta over v0.2 (human-ratified this cycle): COMPUTE / REGISTER SEPARATION.
 *
 * RULING: compute values and register values are distinct layers.
 *   COMPUTE  — the unbounded math space. Raw τ', raw transform, signed, off-scale
 *              legal. No clamp, no squash: the proportional operator stands and
 *              needs no bound. (Discharges the operator decision; the
 *              cost-quantity gap's "nothing bounds τ" dissolves — nothing NEEDS
 *              to bound it, the register is relative.)
 *   REGISTER — %-based, within-configuration relative (D-9 precedent, C-path):
 *              the configuration's own peak |transform| = 100%; every state is
 *              its signed proportion of that peak. A compute 256 IS 100%; the
 *              relative differences tell the model how strong the pulls are.
 *              Sign carries direction (conversion deepened vs inverted/relieved),
 *              never a negative "amount".
 * Consequences wired in:
 *   - Band cut-points are computed on REGISTER displacements (relative %), never
 *     on compute values. Still PROVISIONAL pending real geometries.
 *   - Payload ships both layers, labelled; the model narrates the register only.
 *   - Within-configuration relativity matches the ratified report scope ("no
 *     metric claims, no cross-person position") — the register cannot make a
 *     cross-person claim by construction.
 * ════════════════════════════════════════════════════════════════════════════ */

const STATES = ['D1', 'D2', 'D3', 'D4', 'D5'];

// Human-ratified register statement (this cycle) — travels with EVERY payload.
const REGISTER_STATEMENT = (
  'TRANSPERSONAL TOPOLOGY TRANSLATION (T3): the third t-operation of the ' +
  'D-path notation stack (t = tau conversion, t-prime = transform, T3 = ' +
  'translation). NOTATION ONLY — never an arithmetic power; the compute ' +
  'layer never exponentiates. Values across all three ' +
  'components (B, C, D) are ' +
  'not clinical measurements. They tell a story about what a function does ' +
  'at what strength, compared to other functions at other strengths — a ' +
  'registered relative encoding. They show the model how the instrument has ' +
  'registered them and how the translation into the PDF report is wanted. ' +
  'The report translates relative strengths into narrative; it never ' +
  'presents a value as a measurement of the person.');

/** Compute → register. RESOLVED definition (T3 single-crossing):
 *  ONE shared frame — the configuration's overall peak |value| across
 *  baseline AND transform = 100%. Displacement is computed in COMPUTE space
 *  and translated once. No arithmetic above the translation line. */
function register_layer(result) {
  const allv = [...result.transform_arc, ...result.baseline_arc].filter((v) => v !== null);
  const ceiling = allv.length ? Math.max(...allv.map((v) => Math.abs(v))) : 0.0;
  const tr = (v) => (v === null ? null : (ceiling ? round((v / ceiling) * 100.0, 1) : 0.0));
  const reg_t = result.transform_arc.map(tr);
  const reg_b = result.baseline_arc.map(tr);
  const reg_disp = {};
  STATES.forEach((st, i) => {
    reg_disp[st] = (result.baseline_arc[i] === null || result.transform_arc[i] === null)
      ? null : tr(result.transform_arc[i] - result.baseline_arc[i]);
  });
  const inverted = STATES.filter((st, i) => result.transform_arc[i] !== null && result.transform_arc[i] < 0);
  return {
    register_baseline_pct: reg_b, register_transform_pct: reg_t,
    register_displacement_pct: reg_disp,
    dynamic_ceiling_compute: round(ceiling, 1),
    inverted_states: inverted,
    register_statement: REGISTER_STATEMENT,
    semantics: ('%-based, within-configuration relative: this ' +
                "configuration's peak = 100%. Sign = direction " +
                '(negative compute = conversion inverted/pulled off ' +
                'the cost-state), never a negative amount. No ' +
                'cross-person claim is expressible in this layer.'),
  };
}

function distribution_report_register(results) {
  const disp = [];
  for (const r of results) {
    for (const d of Object.values(register_layer(r).register_displacement_pct)) if (d !== null) disp.push(Math.abs(d));
  }
  disp.sort((a, b) => a - b);
  const p = PROVISIONAL_SCALARS_L3.band_percentiles;
  const pct = (q) => disp[Math.min(disp.length - 1, Math.trunc((q / 100) * disp.length))];
  return {
    n: disp.length, unit: 'register % (relative)',
    candidate_cut_points_pct: {
      above_average: round(pct(p[0]), 1),
      far_above_average: round(pct(p[1]), 1),
      extremely_high: round(pct(p[2]), 1),
    },
    NOTE: 'PROVISIONAL — synthetic; recalibrate on real geometries.',
  };
}


/* ════════════════════════════════════════════════════════════════════════════
 * runtime_engine_v0_4.py
 * ────────────────────────────────────────────────────────────────────────────
 * Deltawerken — Calibration Runtime Engine v0.4
 * =============================================
 * Delta over v0.3: the 120 shape-locus cells go LIVE, split per the ratified
 * L3 §5 availability rule (reconstruction verified against the spec's own
 * censuses: tracking 64 articulations / 42 cells, operational 56; diff against
 * v4.2 verbatim pending at wipe-up — the sheet wins any discrepancy).
 *
 * AXIS PARTITION (derived from L3 §5 'Moves' column, on the record):
 *   value            → moves the conversion's MAGNITUDE → the only locus in Σ.
 *   shape:tracking   → moves HOW EXPRESSION TRACKS CONDITION → live pull with
 *                      f·w strength on its OWN axis; never displaces magnitude.
 *   shape:operational→ NOT a pull (ratified); own ledger, kept away from the
 *                      model's loci narration.
 * Transform magnitudes therefore UNCHANGED from v0.3 — the 120 cells add the
 * tracking-axis story, not curve movement.
 *   [Port note: resolve_shape_split deleted at consolidation — the split is in-sheet.]
 * ════════════════════════════════════════════════════════════════════════════ */

/** core compose + the two shape channels. Magnitude Σ = value-locus only
 *  (unchanged); tracking pulls carried on their own axis. */
function compose_transform_v4(geo, layer2, arcs) {
  const r = compose_transform(geo, layer2, arcs);   // value-only Σ by exclusion logic
  const tracking = [], operational = [];
  for (const [name, w] of active_set(geo)) {
    for (const st of STATES) {
      const art = layer2.get(key3(geo.main, name, st));
      if (art === undefined) continue;
      if (art.locus === 'shape:tracking') {
        const f = DIRECTION_SIGN[art.direction];
        tracking.push({ state: st, codriver: name,
          pull: round(f * w, 3), sense: art.sense,
          axis: 'expression-tracking',
          reading: 'pulls how expression tracks condition; ' +
                   'no magnitude displacement' });
      } else if (art.locus === 'shape:operational') {
        operational.push({ state: st, codriver: name,
          note: 'not a pull (ratified); excluded from loci narration' });
      }
    }
  }
  r.tracking_pulls = tracking;
  r.operational_ledger = operational;
  r.excluded_v42_pending = [];          // discharged by the split
  return r;
}


// ─────────────────────────────────────────────────────────────────────────────
// [R4 amendment — Master Prompt v5.2] Register bands. The cut-points live in ONE place, the
// workbook sheet Band_Cutpoints_v0_PROVISIONAL (hard rule 8: no band cut-point in code), and
// ship in the payload as register_bands with their version stamp. Read on the register-%
// scale (configuration peak = 100). Lower bound inclusive, upper bound exclusive; a blank
// bound is open.
// ─────────────────────────────────────────────────────────────────────────────
const BAND_SHEET = 'Band_Cutpoints_v0_PROVISIONAL';

function load_register_bands(p = WORKBOOK) {
  const bands = [];
  let scale = null;
  for (const r of dataRows(p, BAND_SHEET)) {
    if (pyFalsy(cell(r, 1))) continue;
    const bound = (v) => (v === null || v === '' ? null : pyFloat(v));
    bands.push({ label: pyStr(cell(r, 1)), min: bound(cell(r, 2)), max: bound(cell(r, 3)) });
    scale = pyStr(cell(r, 4));
  }
  bands.sort((a, b) => (a.min ?? -Infinity) - (b.min ?? -Infinity));
  for (let i = 1; i < bands.length; i++) {
    if (bands[i].min !== bands[i - 1].max) throw new Error(`${BAND_SHEET}: bands not contiguous at ${bands[i].label}`);
  }
  if (bands.length !== 5 || bands[0].min !== null || bands[4].max !== null) {
    throw new Error(`${BAND_SHEET}: expected 5 contiguous bands with open ends, got ${bands.length}`);
  }
  return { version: VERSIONS.register_bands_version, scale, bands };
}

/** Band a register-% value on its magnitude — the sign is direction (inversion), never an amount. */
function band_of(pct, register_bands) {
  if (pct === null || pct === undefined) return null;
  const m = Math.abs(pct);
  const hit = register_bands.bands.find((b) => (b.min === null || m >= b.min) && (b.max === null || m < b.max));
  return hit ? hit.label : null;
}

/** Band labels per D-state for both register curves (R5 machine block), so the model reads them
 *  instead of banding the %-values itself. Holes stay null. */
function register_band_labels(register, register_bands) {
  const per = (arc) => Object.fromEntries(STATES.map((st, i) => [st, band_of(arc[i], register_bands)]));
  return {
    baseline: per(register.register_baseline_pct),
    transform: per(register.register_transform_pct),
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// Runtime cache — "Engine loads at boot, caches in memory; reload = deploy event."
// ─────────────────────────────────────────────────────────────────────────────
let _loaded = null;
function loadEngine() {
  if (!_loaded) {
    const tau_version = load_tau_sheet();
    _loaded = {
      tau_version, layer2: load_layer2(), arcs: load_main_arcs(), c_cells: load_c_cells(),
      register_bands: load_register_bands(),
    };
  }
  return _loaded;
}

module.exports = {
  // v0
  PROVISIONAL_SCALARS_L3, PROVISIONAL_FLAGGED, WORKBOOK, V42_GAP, DIRECTION_SIGN,
  Articulation, load_layer2, load_main_arcs, RuntimeGeometry, active_set, tau,
  compose_transform, ARCHETYPES, _vec, synthetic_corpus, distribution_report,
  // v0.1
  TAU_SHEET, load_tau_sheet, emit_payload,
  // v0.2
  WHEEL, OPP, RoleError, load_c_cells, RoleIndexedStore, polar_norm, c_modulation, emit_payload_v2,
  support_weight_norm,
  // v0.3
  STATES, REGISTER_STATEMENT, register_layer, distribution_report_register,
  // v0.4
  compose_transform_v4,
  // amendments
  BAND_SHEET, load_register_bands, band_of, register_band_labels,
  // runtime
  loadEngine,
};

// ─────────────────────────────────────────────────────────────────────────────
// __main__ — the v0.2 role-guard proof + the v0.4 run (named register + distribution).
// ─────────────────────────────────────────────────────────────────────────────
if (require.main === module) {
  const { tau_version, layer2, arcs, c_cells } = loadEngine();
  const corpus = synthetic_corpus();
  console.log(`tau loaded from sheet: ${tau_version}`);
  console.log(`Layer-2 articulations loaded: ${layer2.size}; C-cell maps: ${Object.keys(c_cells).length}`);
  console.log('split live in-sheet: tracking / operational read from the Locus column');
  const geoGuard = corpus.named.agency_entry;
  const store = new RoleIndexedStore(geoGuard, arcs, c_cells, layer2);
  for (const [fn, arg] of [[(n) => store.main_values(n), 'Hero'], [(n) => store.support_values(n), geoGuard.main]]) {
    try { fn(arg); console.log('GUARD FAILED'); } catch (e) { if (e instanceof RoleError) console.log(`  guard ok: ${e.message}`); else throw e; }
  }
  for (const [label, geo] of Object.entries(corpus.named)) {
    const r = compose_transform_v4(geo, layer2, arcs);
    const reg = register_layer(r);
    console.log(`-- ${label}: register=${JSON.stringify(reg.register_transform_pct)} ` +
      `tracking_pulls=${r.tracking_pulls.length} operational=${r.operational_ledger.length}`);
  }
  const pop = corpus.population.map((g) => compose_transform_v4(g, layer2, arcs));
  const named = Object.values(corpus.named).map((g) => compose_transform_v4(g, layer2, arcs));
  console.log(JSON.stringify(distribution_report_register([...named, ...pop]), null, 2));
}
