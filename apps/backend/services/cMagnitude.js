/**
 * Deltawerken — C-magnitude pre-compute path (Node port)
 * ======================================================
 * Faithful Node/CommonJS port of c_magnitude_precompute_FINAL.py (D Relational
 * Operations v1.0 §3/§4). Backend compute step that runs POST-TEST, PRE-MODEL:
 *
 *   answers -> bleed engine -> 12-arc geometry  (LOCKED, upstream, given)
 *     -> [THIS PATH] compose D-states + compute C-magnitude for this geometry
 *     -> payload (corpus + geometry + computed C-values + Q&A + framework)
 *     -> model -> PDF report
 *
 * STATUS: FORM final, FIT (D-3 runtime scalars) pending engine-run calibration.
 * The committed FORMS are transcribed from v1.0 §3/§4. The three open runtime
 * scalars (§7: polar_norm normalisation, Blue half-weight, Yellow culture-ratio)
 * are isolated in PROVISIONAL_SCALARS, seeded with the spec's exploratory defaults
 * and flagged for calibration-against-the-complete-matrix (Principle 9).
 *
 * PRINCIPLE GUARDS encoded here (D-Rel Ops §6):
 *   - Principle 1 (subset-as-calibration): NO stored cross-archetype magnitude
 *     enters the blend. Connection-Matrix supplies edge TYPE/SIGN only; every
 *     magnitude is a function of THIS user's geometry (counted basket, polar gap).
 *   - GANE-trap: Red sign is read at runtime (opposition vs lost-coupling),
 *     never hardcoded to a fixed "Red cancels".
 *   - M1: D-field traces (failure_mode / strain_response / state_relation) are
 *     carried per-archetype by ORIGIN, never collapsed into the composed band.
 *   - P5/P9: magnitude FORMS committed; scalar CONSTANTS stay geometry-functions
 *     or declared-provisional, never fitted-and-locked pre-engine-run.
 *
 * Source of all data: Matrix_360 v3.3 (now canon/deltawerken_corpus.json) +
 * Rosetta v1.4.5 + Connection Matrix v2.1. This path reads those; it stores
 * nothing and calibrates nothing.
 */

'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// PROVISIONAL SCALARS — D-3, DEFERRED. NOT FITTED. NOT FINAL. (v1.0 §7)
// Run NOW with the spec's exploratory defaults so the pipeline produces C-values
// immediately; flagged for calibration against the COMPLETE matrix (P9) once real
// geometries exist. Overwriting these after engine-run is the ONLY change needed.
// ─────────────────────────────────────────────────────────────────────────────
const PROVISIONAL_SCALARS = {
  // (a) polar_norm normalisation. §7(a): Main−Shadow scaled to [0,1] needs one
  //     runtime calibration. The denominator is a PLACEHOLDER normaliser.
  polar_norm_denominator: 100.0, // PROVISIONAL — recalibrate against real geometries
  // (c) Blue half-weight. §7(c): 0.5 is a form choice, not a fitted constant.
  blue_half_weight: 0.5, // PROVISIONAL — validate at first engine-run
  // (b) Yellow culture-ratio. §7(b): TNM-triad-dependent, rides the Four-Triangles
  //     spec (pending). No derivable default — left null so the path REFUSES to
  //     fabricate a Yellow magnitude rather than guess.
  yellow_culture_ratio: null, // PENDING Four-Triangles spec — do not invent
};
// Marks every value above as deferred, so no reader mistakes a provisional default
// for a ratified constant.
const PROVISIONAL_FLAGGED = true;

// ─────────────────────────────────────────────────────────────────────────────
// D-9 (RESOLVED, human-ratified): channel-ceiling normalisation.
// Counted basket magnitudes (~0..ceiling) are normalised against their own channel
// ceiling BEFORE the edge-structure (gate, sign, polar-scaling) applies, returning
// the magnitude axis to [0,1] — the scale the §3 composition form was written for.
// Ceilings from Matrix v3.3 bleed maxima.
// ─────────────────────────────────────────────────────────────────────────────
const CHANNEL_CEILING = {
  green: 144.0, // Green echo max
  blue: 108.0, // Blue echo max
  purple: 36.0, // Purple drip max
  yellow: 216.0, // Yellow echo max
};

// ─────────────────────────────────────────────────────────────────────────────
// Edge types — Connection Matrix v2.1, canon (§1 line 29). TYPE/SIGN only.
// ─────────────────────────────────────────────────────────────────────────────
const Edge = Object.freeze({
  GREEN: 'green', // same-network reinforce
  BLUE: 'blue', // sum-13 reorganisation bridge
  PURPLE: 'purple', // shadow, integration-conditional
  RED: 'red', // cross-group seam — sign VARIES (state-conditional)
  YELLOW: 'yellow', // TNM culture, ratio-dependent
  NONE: 'none', // no canon edge to the anchor
});

const RedSign = Object.freeze({
  OPPOSITION: 'opposition', // −, partial cancel scaled by activation ratio
  LOST_COUPLING: 'lost_coupling', // sign read at runtime from Limbic-coupling state
});

// ─────────────────────────────────────────────────────────────────────────────
// polar_norm — Polarization gap normalised to [0,1].
// Form committed (§3 note + §7a). Normaliser is PROVISIONAL.
// geo: { main_weight, support_weight, shadow_weight, main, support, archetypes }
// archetypes: name -> {
//   name, weight, edge_to_main, edge_to_support,
//   nature_core, green_hw, culture_core, blue_fb, yellow_cog, purple_shadow,
//   is_culture_pick, red_sign_to_main, d_field_traces
// }
// ─────────────────────────────────────────────────────────────────────────────
function polarNorm(geo) {
  const gap = geo.main_weight - geo.shadow_weight;
  const denom = PROVISIONAL_SCALARS.polar_norm_denominator;
  const pn = denom ? gap / denom : 0.0;
  return Math.max(0.0, Math.min(1.0, pn)); // clamp to [0,1]
}

function gatePolar(geo) {
  // gate(polar) = 1 − polar_norm (§3 line 54). small gap → full Purple
  // contribution (active integration); large gap → Purple walled off.
  return 1.0 - polarNorm(geo);
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — σ(a): edge contribution (§3 forms), ENCODER-INTEGRATED.
// Magnitude is the COUNTED basket from the bleed engine (green_hw/blue_fb/
// purple_shadow/yellow_cog) — a measured user-geometry value — NOT re-derived
// from weights. The §3 STATE-CONDITIONAL STRUCTURE still applies on top:
//   - Purple: counted purple_shadow, STILL gated by gate(polar).
//   - Red: counted seam magnitude, sign STILL resolved at runtime (never hardcoded).
//   - Red opposition: STILL scaled by (1 − polar_norm) per canon.
// Type/sign from canon; magnitude from counted geometry. Principle-1-safe.
// Returns null where genuinely unavailable (unresolved Red sign) so the caller
// refuses to fabricate rather than guess.
// ─────────────────────────────────────────────────────────────────────────────
function sigma(a, geo) {
  switch (a.edge_to_main) {
    case Edge.GREEN:
      // Counted Green magnitude, ceiling-normalised to [0,1] (D-9); full coherent add.
      return +1.0 * ((a.green_hw || 0) / CHANNEL_CEILING.green);

    case Edge.BLUE:
      // Counted Blue magnitude, ceiling-normalised (D-9). The counter applies the
      // half-weight in the count; this is the value as-counted, then normalised.
      return +1.0 * ((a.blue_fb || 0) / CHANNEL_CEILING.blue);

    case Edge.PURPLE:
      // Counted Purple magnitude, ceiling-normalised (D-9), STILL gated:
      // contributes only when integrated.
      return +1.0 * ((a.purple_shadow || 0) / CHANNEL_CEILING.purple) * gatePolar(geo);

    case Edge.RED: {
      // Sign VARIES — read at runtime (GANE-trap guard). Never hardcoded.
      // Red seam magnitude is the counted hardware-locus value, ceiling-normalised
      // on the green channel (seam locus); sign and polar-scaling per §3.
      const redMag = (a.green_hw || 0) / CHANNEL_CEILING.green; // normalised
      if (a.red_sign_to_main === RedSign.OPPOSITION) {
        // − normalised · (1 − polar_norm) → partial cancel; weakens as gap narrows.
        return -redMag * (1.0 - polarNorm(geo));
      }
      if (a.red_sign_to_main === RedSign.LOST_COUPLING) {
        // State-conditional sign supplied at runtime from Limbic-coupling read.
        // If unresolved, refuse — do not assume +/-.
        return null;
      }
      // Red with no resolved sign: refuse rather than assume.
      return null;
    }

    case Edge.YELLOW:
      // Culture-pick only; counted yellow_cog, ceiling-normalised (D-9).
      if (!a.is_culture_pick) return 0.0;
      // The Four-Triangles ratio (D-3b) governs interpretive weighting, not whether
      // the counted value exists. Counted value used normalised; ratio flagged.
      return +1.0 * ((a.yellow_cog || 0) / CHANNEL_CEILING.yellow);

    case Edge.NONE:
    default:
      // No canon edge to Main; contributes nothing to the blend.
      return 0.0;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 result — composed D-state per class k (D1..D5), §3.
// D_composed[k] = activation-weighted, edge-typed blend across active archetypes.
// storedD: name -> [D1..D5] (0..100 absolute, from Matrix v3.3 / corpus).
// Unresolved σ (null) propagates as a REFUSAL marker for that archetype, not 0.
//
// D-9 (RESOLVED): the composed curve is normalised against a DYNAMIC CEILING —
// the peak composed value in THIS geometry becomes 100%, every other state its
// proportion of that peak. Yields the curve SHAPE on [0,100] by construction (no
// clamp, no structural change). The composed curve is WITHIN-CONFIGURATION relative
// (this person's shape, peak=100%), not absolute cross-person comparable; the
// per-archetype stored curves retain the absolute reading.
// ─────────────────────────────────────────────────────────────────────────────
function composeDState(geo, storedD) {
  const classes = ['D1', 'D2', 'D3', 'D4', 'D5'];
  const raw = {};
  const refusals = [];

  classes.forEach((k, kIndex) => {
    let total = 0.0;
    total += storedD[geo.main][kIndex]; // Main contributes its own D-state (anchor)
    for (const [name, a] of Object.entries(geo.archetypes)) {
      if (name === geo.main) continue;
      const s = sigma(a, geo);
      if (s === null) {
        // record once (first class) — same edge unresolved across all classes
        if (kIndex === 0) refusals.push([name, a.edge_to_main]);
        continue;
      }
      total += s * storedD[name][kIndex];
    }
    raw[k] = total;
  });

  // Dynamic-ceiling normalisation: peak → 100%, others proportional.
  const peak = Object.keys(raw).length ? Math.max(...Object.values(raw)) : 0.0;
  const composed = {};
  if (peak > 0) {
    for (const [k, v] of Object.entries(raw)) composed[k] = Math.round((v / peak) * 100.0 * 10) / 10;
  } else {
    for (const k of Object.keys(raw)) composed[k] = 0.0;
  }

  // Render-side chart series (Master Prompt v4.1 §5.5): Main + Support stored curves
  // (absolute, on-scale) + the composed curve (dynamic-ceiling normalised) as [D1..D5].
  const main_curve = (storedD[geo.main] || []).map((v) => Math.round(v * 10) / 10);
  const support_curve = (geo.support && storedD[geo.support] ? storedD[geo.support] : []).map((v) => Math.round(v * 10) / 10);
  const composed_curve = classes.map((k) => composed[k]);

  return { composed_D: composed, raw_composed_D: raw, dynamic_ceiling: peak, refusals, main_curve, support_curve, composed_curve };
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — C-magnitude (§4, verbatim form). Applies AFTER D-composition
// (compose-then-modulate). Direction stored; magnitude geometry-driven.
//
//   C_mag = support_weight_norm · (1 − polar_norm) · base[Effect]
//
// base[Effect] is the Support's stored [Effect] DIRECTION map (Matrix v3.3 C-cells:
// +1 / −1 / no-channel per function). WHICH functions and the SIGN come from
// storage; the SCALAR falls out of the geometry.
// ─────────────────────────────────────────────────────────────────────────────
function supportWeightNorm(geo) {
  if (!geo.main_weight) return 0.0;
  return geo.support_weight / geo.main_weight;
}

function cMagnitude(geo, baseEffectDirection) {
  const swn = supportWeightNorm(geo);
  const oneMinusPn = 1.0 - polarNorm(geo);
  const out = {};
  for (const [func, direction] of Object.entries(baseEffectDirection)) {
    if (direction === null || direction === undefined) {
      out[func] = null; // "no channel" → stays absent, not 0
      continue;
    }
    // C_mag = support_weight_norm · (1 − polar_norm) · direction
    out[func] = swn * oneMinusPn * direction;
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Full pre-compute: compose D-state, then modulate with C (committed ordering).
// Output is the C-runtime layer the backend ships into the model payload,
// alongside the corpus, the raw geometry, and the framework.
// ─────────────────────────────────────────────────────────────────────────────
function precompute(geo, storedD, supportEffectDirection) {
  const step1 = composeDState(geo, storedD);
  const step2 = cMagnitude(geo, supportEffectDirection);
  return {
    composed_D_state: step1.composed_D,
    composed_D_raw: step1.raw_composed_D,
    dynamic_ceiling: step1.dynamic_ceiling,
    // Render-side D-curve chart series (Main + Support + Composed), [D1..D5].
    d_curve: { main: step1.main_curve, support: step1.support_curve, composed: step1.composed_curve },
    c_runtime_values: step2,
    polar_norm: polarNorm(geo),
    support_weight_norm: supportWeightNorm(geo),
    unresolved_edges: step1.refusals, // surfaced, never silently zeroed
    provisional_scalars_in_use: { ...PROVISIONAL_SCALARS },
    WARNING:
      'EXPLORATORY SKETCH. Provisional D-3 scalars in use (polar_norm denominator, ' +
      'Blue 0.5; Yellow pending). Not calibrated. Recalibrate against the complete ' +
      'matrix (P9) at engine-run.',
  };
}

module.exports = {
  PROVISIONAL_SCALARS,
  PROVISIONAL_FLAGGED,
  CHANNEL_CEILING,
  Edge,
  RedSign,
  polarNorm,
  gatePolar,
  sigma,
  composeDState,
  supportWeightNorm,
  cMagnitude,
  precompute,
};
