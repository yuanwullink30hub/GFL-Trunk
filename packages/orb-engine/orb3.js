/**
 * Deltawerken Orb Engine v1 — LC_ORB3 (the 3D orb).
 * ===================================================
 * Implements the Developer Build v1.0 (§3 derivation, §4 relational tables, §5 palette+pulse,
 * §2 orb-code). SHARED / PURE / ISOMORPHIC (CommonJS): the Node backend require()s it to author
 * the code pre-PDF; the Vite client imports decodeOrb3 to render.
 *
 *   12-arc geometry (archetypeDetails) → deriveOrb3() → lever-vector (snapshot, §2)
 *                                      → encodeOrb3() → "LC_ORB3_…"  (passkey + config carrier)
 *   "LC_ORB3_…" → decodeOrb3() → render config (drop-in for <OrbSphere3D config=…/>)
 *
 * TWO lever classes (§0 of the spec):
 *   · geometry/relational (RUNTIME): palette, pulse, cymatic ℓ/m/dir, radial-sign, friction, harmony
 *     — derived from the live 12 weights + the fixed edge tables (§4). Real per-profile.
 *   · authored group-priors (§3 templates): displacement, tension, depth, breaking, density,
 *     rotation, radial-magnitude — the group-characteristic substrate. The composed-B trace for
 *     tension/breaking/rotation/depth is DEFERRED (needs the matrix-engine's composed-B emit-format,
 *     §1b / §6); until then the group template stands in (faithful to §3, provisional per §6).
 *
 * All NORM_* / FBASE / FAINT / ×1.2 / dispersion-threshold / polar_norm are DEFERRED SCALARS (§6):
 * shipped provisional so the orb renders pre-calibration. btoa/atob are global in Node ≥16 + browsers.
 */

'use strict';

// ── canonical wheel data (§3, §4, §5) ──────────────────────────────────────
const POS = {
  JUDGE: 1, LOVER: 2, CAREGIVER: 3, INNOCENT: 4, EXPLORER: 5, OUTLAW: 6,
  TRICKSTER: 7, SAGE: 8, ARTIST: 9, MAGICIAN: 10, HERO: 11, RULER: 12,
};
const GROUP_BY_POS = {
  1: 'Ruling', 12: 'Ruling', 2: 'Relational', 3: 'Relational', 4: 'Seeker', 5: 'Seeker',
  6: 'Chaos', 7: 'Chaos', 8: 'Abstract', 9: 'Abstract', 10: 'Agency', 11: 'Agency',
};
const GROUP_NAME = ['Ruling', 'Relational', 'Seeker', 'Chaos', 'Abstract', 'Agency'];
const GROUP_ID = { Ruling: 0, Relational: 1, Seeker: 2, Chaos: 3, Abstract: 4, Agency: 5 };

// orientation tag → radial SIGN (§3): External +outward, Internal −inward.
const ORIENT = { Ruling: +1, Relational: +1, Agency: +1, Seeker: -1, Chaos: -1, Abstract: -1 };

// cost-curve tempo presets → affective pulse-rate (§5c). Authored, per-group. Re-authored to match
// the tuned group templates (the panel pulse values), superseding the doc's illustrative tempos.
const TEMPO = { Ruling: 1.35, Chaos: 1.58, Agency: 1.61, Relational: 1.15, Seeker: 1.47, Abstract: 1.10 };

// 5-stop LOCKED hardware palettes (§5a).
const PALETTES = {
  Ruling:     ['#0a0e14', '#2c5f7c', '#6a3c9c', '#f0deb0', '#c8a04a'],
  Relational: ['#140509', '#6e2c3a', '#c07078', '#e0a050', '#f6ead6'],
  Seeker:     ['#08140c', '#1e5a2c', '#7a4a1e', '#5fb0a0', '#a8c4b8'],
  Chaos:      ['#1a0406', '#b81e1e', '#e85818', '#d89c1c', '#3a9c3a'],
  Abstract:   ['#0a060e', '#5a2c8c', '#2c8c4c', '#b04dc6', '#e8d088'],
  Agency:     ['#0e0202', '#c81818', '#14a0a8', '#e8501c', '#f0e4cc'],
};

// Group authored-priors (§3 templates): the levers the composed-B trace is DEFERRED on, plus the
// authored aesthetic levers. radialMag = magnitude only (sign comes from ORIENT).
const GROUP_PRESET = {
  Ruling:     { amp: 0.16, T: 0.35, depth: -0.60, B: 1.60, density: 0.75, rot: 0.12, radialMag: 0.70 },
  Relational: { amp: 0.72, T: 3.69, depth: 0.70,  B: 0.50, density: 0.50, rot: 0.50, radialMag: 0.69 },
  Seeker:     { amp: 0.35, T: 3.05, depth: 0.10,  B: 1.90, density: 0.26, rot: 0.90, radialMag: 0.43 },
  Chaos:      { amp: 0.23, T: 4.35, depth: 0.15,  B: 3.65, density: 0.72, rot: 0.90, radialMag: 0.74 },
  Abstract:   { amp: 0.20, T: 2.95, depth: -0.70, B: 3.20, density: 0.38, rot: 0.36, radialMag: 0.66 },
  Agency:     { amp: 0.22, T: 1.40, depth: 0.20,  B: 3.15, density: 0.86, rot: 1.12, radialMag: 0.72 },
};

// B-priors (Matrix v3.3 composed-B substrate) — the 6 functions the orb reads, per archetype
// position (1..12). Source: canon/deltawerken_corpus.json archetypes[*].B_functions[*].value (0..100).
// The composed-B format is CLOSED (D Relational Operations v1.0 §5): composed-B = Σ_a w[a]·B[a]
// across active archetypes — activation-weighted, function-level, OURS + committed (not external).
// Verified against the pole anchors: Sage depth (47+81)−(93+66)=−31 (DMN seal), Lover +16 (Limbic
// flood), Hero/Magician Motion+Real≈159 (Motor). Fields: Mod=Modulation, Integ=Integration,
// Abs=Abstraction, Interp=Interpretation, Motion, Real=Realisation.
const B_PRIORS = {
  1:  { Mod: 44, Integ: 26, Abs: 26, Interp: 26, Motion: 36, Real: 73 }, // Judge
  2:  { Mod: 92, Integ: 68, Abs: 64, Interp: 80, Motion: 46, Real: 44 }, // Lover
  3:  { Mod: 66, Integ: 92, Abs: 44, Interp: 78, Motion: 44, Real: 72 }, // Caregiver
  4:  { Mod: 58, Integ: 50, Abs: 80, Interp: 62, Motion: 52, Real: 36 }, // Innocent
  5:  { Mod: 62, Integ: 50, Abs: 80, Interp: 62, Motion: 74, Real: 40 }, // Explorer
  6:  { Mod: 92, Integ: 36, Abs: 80, Interp: 55, Motion: 72, Real: 48 }, // Outlaw
  7:  { Mod: 66, Integ: 36, Abs: 80, Interp: 60, Motion: 58, Real: 46 }, // Trickster
  8:  { Mod: 47, Integ: 81, Abs: 93, Interp: 66, Motion: 38, Real: 26 }, // Sage
  9:  { Mod: 47, Integ: 80, Abs: 66, Interp: 93, Motion: 36, Real: 26 }, // Artist
  10: { Mod: 74, Integ: 34, Abs: 40, Interp: 42, Motion: 66, Real: 93 }, // Magician
  11: { Mod: 74, Integ: 34, Abs: 26, Interp: 40, Motion: 93, Real: 66 }, // Hero
  12: { Mod: 48, Integ: 27, Abs: 26, Interp: 26, Motion: 38, Real: 74 }, // Ruler
};

// Relational link tables (§4) — edge TYPE only; every type is a perfect matching (≤1 pair per
// type in any top-3). Hyperlink pairs carry BOTH green + blue (counted as 2 in harmony).
const EDGES = {
  green:  [[1, 12], [2, 3], [4, 5], [6, 7], [8, 9], [10, 11]],
  blue:   [[1, 12], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]],
  purple: [[1, 7], [2, 8], [3, 9], [4, 10], [5, 11], [6, 12]],
  red:    [[1, 6], [2, 5], [3, 4], [7, 12], [8, 11], [9, 10]],
};

// ── deferred scalars (§6) — provisional, exposed so calibration can override ──
// TWO SEPARABLE GATES (the corrected status): the composed-B FORMAT is CLOSED (Σ w[a]·B[a], §5,
// ours + committed) — nothing here blocks the composed-B wire on format grounds. What remains
// deferred is the NORM_* runtime-scalar CLASS (same class as polar_norm): it scales the raw
// composed-B (0..100) into each lever's range. Provisional values below land the levers in-range
// and roughly preserve the group-template feel; a calibration pass (post-engine-run, against real
// geometries) overwrites them. SEQUENCING: format-pin (done) → individuation (now — the 4 levers
// read the individual's composed-B) → NORM-calibration (deferred) → regenerate production codes.
const SCALARS = {
  POLAR_SCALE: 100,        // polar_norm denominator (radial + purple gate)
  FBASE: 0.15,             // friction floor for an active in-top-3 seam
  FAINT: 0.30,             // out-of-top-3 red-partner attenuation (floor-bypassed)
  HARMONY_SCALE: 3.0,      // provisional harmony normalisation (NORM_harmony)
  DISPERSION_THRESHOLD: 0.40, // peaked vs distributed → cymatic dir (median-split placeholder)
  PULSE_DEADBAND: 1.2,     // ×1.2 accumulative dead-band
  // composed-B → lever NORMs (DEFERRED runtime-scalar class; PROVISIONAL, not calibrated):
  NORM_tension: 20,        // composedB.Mod / NORM → tension [0,5]
  NORM_breaking: 45,       // (composedB.Abs+Interp) / NORM → breaking [0.5,4.2]
  NORM_rotation: 130,      // (composedB.Motion+Real) / NORM → rotation [0,1.5]
  NORM_depth: 45,          // ((Mod+Integ)−(Abs+Interp)) / NORM → depth [−1,1]
};

// ── helpers ─────────────────────────────────────────────────────────────────
const clamp = (mn, mx, v) => Math.max(mn, Math.min(mx, v));
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const r2 = (v) => Math.round(v * 100) / 100;
const hasEdge = (type, a, b) => EDGES[type].some(([x, y]) => (x === a && y === b) || (x === b && y === a));
const redPartner = (pos) => { for (const [a, b] of EDGES.red) { if (a === pos) return b; if (b === pos) return a; } return null; };
const distinctGroups = (positions) => new Set(positions.map((p) => GROUP_BY_POS[p])).size;

// composed-B (§5, CLOSED format): Σ_a w[a]·B[a] across active archetypes, activation-weighted
// (weights normalised so the composed profile stays on the B-function scale [0,100]). Returns the
// 6 functions the orb consumes, or null if no active archetype has a B-prior (→ group fallback).
function composedB(w) {
  const positions = Object.keys(w).map(Number).filter((p) => w[p] > 0 && B_PRIORS[p]);
  if (!positions.length) return null;
  const tot = positions.reduce((s, p) => s + w[p], 0) || 1;
  const acc = { Mod: 0, Integ: 0, Abs: 0, Interp: 0, Motion: 0, Real: 0 };
  for (const p of positions) {
    const nw = w[p] / tot, b = B_PRIORS[p];
    for (const f of Object.keys(acc)) acc[f] += nw * b[f];
  }
  return acc;
}

// PULSE selection (§5b): ×1.2-handicapped accumulative winner, may differ from the palette peak.
function pulseSelect(w) {
  const vals = Object.values(w);
  if (!vals.length) return 'Relational';
  const peakW = Math.max(...vals);
  let peakPos = null;
  for (const p of Object.keys(w)) if (peakPos === null || w[p] > w[peakPos]) peakPos = p;
  const peakGroup = GROUP_BY_POS[peakPos];

  const sums = Object.fromEntries(GROUP_NAME.map((g) => [g, 0]));
  for (const p of Object.keys(w)) sums[GROUP_BY_POS[p]] += w[p];
  let accGroup = GROUP_NAME[0];
  for (const g of GROUP_NAME) if (sums[g] > sums[accGroup]) accGroup = g;

  return (peakW * SCALARS.PULSE_DEADBAND < sums[accGroup]) ? accGroup : peakGroup;
}

// FRICTION (§3): red seam among top-3 (single, floored) + Main's out-of-top-3 red partner (faint, stacks).
function deriveFriction(w, top3, Main) {
  let friction = 0;
  let seam = null;
  for (const [a, b] of EDGES.red) if (top3.includes(a) && top3.includes(b)) { seam = [a, b]; break; }
  if (seam) {
    const [hi, lo] = w[seam[0]] >= w[seam[1]] ? seam : [seam[1], seam[0]];
    friction = SCALARS.FBASE + (1 - SCALARS.FBASE) * clamp01((w[lo] || 0) / (w[hi] || 1)); // B-as-proportion-of-A, floored
  }
  const mrp = redPartner(Main);
  if (mrp && !top3.includes(mrp)) friction += SCALARS.FAINT * ((w[mrp] || 0) / (w[Main] || 1)); // faint, floor-bypassed, stacks
  return clamp01(friction);
}

// HARMONY (§3): green/blue/purple instances among top-3 pairs, instance-counted, purple integration-gated.
function deriveHarmony(w, top3, polarNorm) {
  const tot = top3.reduce((s, p) => s + w[p], 0) || 1;
  const nw = Object.fromEntries(top3.map((p) => [p, w[p] / tot]));
  let h = 0;
  for (let i = 0; i < top3.length; i++) for (let j = i + 1; j < top3.length; j++) {
    const a = top3[i], b = top3[j], prod = nw[a] * nw[b];
    if (hasEdge('green', a, b)) h += prod;
    if (hasEdge('blue', a, b))  h += prod;               // hyperlink pair → green AND blue → counts 2
    if (hasEdge('purple', a, b)) h += prod * (1 - polarNorm); // integration-gated
  }
  return clamp01(h * SCALARS.HARMONY_SCALE);
}

// cymatic DIRECTION (§3): peaked top-3 → co (+1); distributed → anti (−1). Threshold deferred.
function peakedDir(w, top3) {
  if (top3.length < 3) return 1;
  const [a, , c] = top3;
  return ((w[a] - w[c]) / (w[a] || 1)) > SCALARS.DISPERSION_THRESHOLD ? 1 : -1;
}

// ── the engine: 12-arc geometry → lever-vector (§2 snapshot) ─────────────────
/**
 * @param {Array<{key:string,total?:number,score?:number}>} archetypeDetails  the 12 arc weights
 * @param {{ polarNorm?: number }} opts  provisional polar_norm (0 = gate open, pre-calibration)
 * @returns {object|null} lever-vector, or null if fewer than 1 active archetype.
 */
function deriveOrb3(archetypeDetails, opts = {}) {
  const polarNorm = Number.isFinite(opts.polarNorm) ? clamp01(opts.polarNorm) : 0;

  const w = {};
  for (const d of archetypeDetails || []) {
    const p = POS[String(d && d.key || '').toUpperCase()];
    if (p) w[p] = (w[p] || 0) + (d.total ?? d.score ?? 0);
  }
  const positions = Object.keys(w).map(Number).filter((p) => w[p] > 0);
  if (!positions.length) return null;

  const ranked = positions.slice().sort((a, b) => w[b] - w[a]);
  const top3 = ranked.slice(0, 3);
  const Main = ranked[0];
  const mainGroup = GROUP_BY_POS[Main];
  const gp = GROUP_PRESET[mainGroup];

  const paletteGroup = GROUP_BY_POS[ranked[0]];               // §5a peak hardware
  const pulseGroup = pulseSelect(w);                          // §5b ×1.2 accumulative winner
  const radial = clamp(-1, 1, ORIENT[mainGroup] * gp.radialMag * (1 - polarNorm));

  // ── the four composed-B levers (§4/§7): tension/breaking/rotation/affect-depth read the
  //    INDIVIDUAL's composed-B = Σ w[a]·B[a], not the group template. This is what individuates
  //    two same-Main profiles (different Support/Pol pull the weighted sum apart). Magnitude is
  //    provisional (NORM_* deferred); the group template is the fallback if B-priors are absent. ──
  const cB = composedB(w);
  const bLevers = cB ? {
    T: clamp(0, 5, cB.Mod / SCALARS.NORM_tension),
    B: clamp(0.5, 4.2, (cB.Abs + cB.Interp) / SCALARS.NORM_breaking),
    rot: clamp(0, 1.5, (cB.Motion + cB.Real) / SCALARS.NORM_rotation),
    depth: clamp(-1, 1, ((cB.Mod + cB.Integ) - (cB.Abs + cB.Interp)) / SCALARS.NORM_depth),
  } : { T: gp.T, B: gp.B, rot: gp.rot, depth: gp.depth };   // fallback: §3 group prior

  return {
    v: 1,
    palette: GROUP_ID[paletteGroup],                          // 0..5
    L: distinctGroups(top3),                                  // cymatic ℓ (1..3)
    M: Main,                                                  // cymatic m (Main wheel position 1..12)
    dir: peakedDir(w, top3),                                  // ±1 co/anti
    amp: r2(gp.amp),                                          // displacement (authored/§3)
    R: r2(radial),                                            // radial (signed, polar-gated)
    fractal: r2(deriveFriction(w, top3, Main)),               // colour-friction (runtime)
    harmony: r2(deriveHarmony(w, top3, polarNorm)),           // harmony (runtime)
    density: r2(gp.density),                                  // faceting + brightness (authored/§3)
    T: r2(bLevers.T),                                         // tension ← composed-B Modulation
    depth: r2(bLevers.depth),                                 // affect-depth ← composed-B flood−seal
    B: r2(bLevers.B),                                         // breaking ← composed-B Abs+Interp
    rot: r2(bLevers.rot),                                     // rotation ← composed-B Motion+Real
    pulse: r2(TEMPO[pulseGroup]),                             // affective pulse-rate (§5c preset)
  };
}

// ── orb-code (§2): LC_ORB3_<base64(JSON)> — version carried in payload `v` ────
function encodeOrb3(vec) {
  if (!vec) return '';
  try { return 'LC_ORB3_' + btoa(encodeURIComponent(JSON.stringify(vec))); } catch { return ''; }
}

/** "LC_ORB3_…" → render config (drop-in for <OrbSphere3D config=…/>). Frontend runs NO engine. */
function decodeOrb3(code) {
  if (!code || !String(code).startsWith('LC_ORB3_')) return null;
  try {
    const v = JSON.parse(decodeURIComponent(atob(String(code).replace('LC_ORB3_', ''))));
    const colors = PALETTES[GROUP_NAME[v.palette]] || PALETTES.Relational;
    return {
      _v3: true,
      cymaticL: v.L ?? 1, cymaticM: v.M ?? 2, dir: v.dir ?? 1,
      displacement: v.amp ?? 0.2, radial: v.R ?? 0,
      friction: v.fractal ?? 0, harmony: v.harmony ?? 0,
      density: v.density ?? 0.5, tension: v.T ?? 1,
      depth: v.depth ?? 0, breaking: v.B ?? 2,
      rotation: v.rot ?? 0.4, pulse: v.pulse ?? 1,
      colors: colors.slice(),
    };
  } catch { return null; }
}

/**
 * AUTHORITATIVE backend code-gen. Reads the geometry + gates radial/purple with the real
 * polar_gap (main − shadow weight), then snapshots to "LC_ORB3_…" (§1 snapshot, pre-PDF).
 * @returns {string} "LC_ORB3_…" or '' when the geometry is incomplete.
 */
function orb3FromGeometry({ archetypeDetails, mainKey, shadowKey } = {}) {
  if (!Array.isArray(archetypeDetails) || !archetypeDetails.length) return '';
  const totalByKey = {};
  for (const d of archetypeDetails) totalByKey[String(d.key || '').toUpperCase()] = d.total ?? d.score ?? 0;
  const mainW = totalByKey[String(mainKey || '').toUpperCase()] ?? 0;
  const shadowW = shadowKey ? (totalByKey[String(shadowKey).toUpperCase()] ?? 0) : 0;
  const polarNorm = clamp01((mainW - shadowW) / SCALARS.POLAR_SCALE);
  return encodeOrb3(deriveOrb3(archetypeDetails, { polarNorm }));
}

module.exports = {
  ORB3_POS: POS, ORB3_GROUP_BY_POS: GROUP_BY_POS, ORB3_GROUP_NAME: GROUP_NAME,
  ORB3_ORIENT: ORIENT, ORB3_TEMPO: TEMPO, ORB3_PALETTES: PALETTES, ORB3_EDGES: EDGES,
  ORB3_GROUP_PRESET: GROUP_PRESET, ORB3_SCALARS: SCALARS, ORB3_B_PRIORS: B_PRIORS,
  deriveOrb3, encodeOrb3, decodeOrb3, orb3FromGeometry, composedB,
};
