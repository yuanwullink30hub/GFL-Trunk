/**
 * Deltawerken Liquid Crystal — Archetype Scalar Engine (ENGINE_RULE_LOCKED + backend-spec v1)
 * ===========================================================================================
 * SHARED, PURE, ISOMORPHIC. CommonJS so the Node backend can require() it; the Vite client
 * imports it (cjs-interop) and re-exports from src/orb/engine.js.
 *
 *   geometry {Archetype: score} → resolveOrb() → {11 blended levers + radial, colors[5], bloom}
 *                               → encodeDNA()  → "LC_ORB2_…"  (the unique profile code)
 *
 * Rule (locked): K=3 power-weighted blend of the 11 CANON levers; colour = rank-1 group's
 * palette (winner-take-all); bloom = Relational anywhere in the ranked top-3 (decoupled from
 * colour); radial lever = orientation × polar-gate (backend spec §3.3).
 *
 * AUTHORITY: the backend authors the code from the real geometry read (with a true polar_gap
 * = main_weight − shadow_weight). The client's resolveOrb/orbCodeFromResult are a render-time
 * FALLBACK only (gate open, provisional). POLAR_SCALE stays provisional until the assessment
 * engine calibrates it — radial-gated codes emitted now are pre-calibration.
 *
 * btoa/atob are used (global in Node ≥16 and browsers) so codes are byte-identical on both.
 */

'use strict';

const K = 3;

const RANGES = {
  primaryFreq: [1, 12], secondaryFreq: [0, 10], cymaticMode: [0, 12],
  nematicTension: [0, 5], chiralPitch: [0.1, 3.9], birefringence: [0.5, 5],
  flowSpeed: [0.1, 1.5], anisotropyAngle: [0, Math.PI], weaveDensity: [150, 700],
  seamSharpness: [0.6, 2.6], glowIntensity: [0.4, 1.3],   // spec §2.4 (was 1.0 — clamped Lover/Innocent)
  radialStructure: [-1, 1],   // runtime-computed radial lever (spec §3.3)
};
// The 11 CANON-blended levers (radialStructure is computed separately, not blended from CANON).
const LEVERS = Object.keys(RANGES).filter((l) => l !== 'radialStructure');

const PALETTES = {
  Ruling:     ['#0a0e14', '#2c5f7c', '#6a3c9c', '#f0deb0', '#c8a04a'],
  Relational: ['#140509', '#6e2c3a', '#c07078', '#e0a050', '#f6ead6'],
  Seeker:     ['#08140c', '#1e5a2c', '#7a4a1e', '#5fb0a0', '#a8c4b8'],
  Chaos:      ['#1a0406', '#b81e1e', '#e85818', '#d89c1c', '#3a9c3a'],
  Abstract:   ['#0a060e', '#5a2c8c', '#2c8c4c', '#b04dc6', '#e8d088'],
  Agency:     ['#0e0202', '#c81818', '#14a0a8', '#e8501c', '#f0e4cc'],
};
const GROUP = {
  Judge: 'Ruling', Ruler: 'Ruling', Lover: 'Relational', Caregiver: 'Relational',
  Innocent: 'Seeker', Explorer: 'Seeker', Outlaw: 'Chaos', Trickster: 'Chaos',
  Sage: 'Abstract', Artist: 'Abstract', Magician: 'Agency', Hero: 'Agency',
};
// Bloom fires when the Relational group appears anywhere in the ranked TOP-3
// (ENGINE_RULE §3, AMENDED — decoupled from colour: a non-Relational-dominant orb can bloom).
const BLOOM_GROUPS = new Set(['Relational']);

// Orientation tag (Rosetta v1.4.5, spec §2.2) — supplies the radial lever's SIGN.
// −1 = internal (inward / reference-inside), +1 = external (outward / reference-outside).
const ORIENT = {
  Abstract: -1, Seeker: -1, Chaos: -1,
  Ruling: +1, Agency: +1, Relational: +1,
};
// Radial gate normaliser (spec §3.3/§4 + cMagnitude PROVISIONAL_SCALARS.polar_norm_denominator).
// PROVISIONAL — recalibrate against real geometries; codes emitted before calibration must
// be treated as pre-calibration (radial-gated orbs shift, re-generation required).
const POLAR_SCALE = 100;

const CANON = {
  Judge:    { primaryFreq: 2.5, secondaryFreq: 1.0, cymaticMode: 1, nematicTension: 0.6, chiralPitch: 0.6, birefringence: 1.8, flowSpeed: 0.25, anisotropyAngle: 1.40, weaveDensity: 260, seamSharpness: 2.5, glowIntensity: 0.65 },
  Ruler:    { primaryFreq: 3.5, secondaryFreq: 1.5, cymaticMode: 2, nematicTension: 1.0, chiralPitch: 0.9, birefringence: 2.4, flowSpeed: 0.4, anisotropyAngle: 1.55, weaveDensity: 340, seamSharpness: 2.2, glowIntensity: 1.05 },
  Lover:    { primaryFreq: 5.0, secondaryFreq: 3.5, cymaticMode: 6, nematicTension: 2.8, chiralPitch: 1.8, birefringence: 4.2, flowSpeed: 1.15, anisotropyAngle: 0.55, weaveDensity: 420, seamSharpness: 1.3, glowIntensity: 1.25 },
  Caregiver:{ primaryFreq: 2.8, secondaryFreq: 1.6, cymaticMode: 4, nematicTension: 1.1, chiralPitch: 1.1, birefringence: 2.0, flowSpeed: 0.40, anisotropyAngle: 0.70, weaveDensity: 600, seamSharpness: 2.0, glowIntensity: 0.95 },
  Innocent: { primaryFreq: 4.0, secondaryFreq: 2.2, cymaticMode: 6, nematicTension: 0.4, chiralPitch: 0.8, birefringence: 2.4, flowSpeed: 0.6, anisotropyAngle: 0.25, weaveDensity: 360, seamSharpness: 1.6, glowIntensity: 1.20 },
  Explorer: { primaryFreq: 6.5, secondaryFreq: 4.5, cymaticMode: 10, nematicTension: 0.8, chiralPitch: 1.3, birefringence: 2.6, flowSpeed: 0.85, anisotropyAngle: 0.45, weaveDensity: 440, seamSharpness: 1.2, glowIntensity: 0.85 },
  Outlaw:   { primaryFreq: 8.0, secondaryFreq: 5.5, cymaticMode: 6, nematicTension: 4.2, chiralPitch: 2.4, birefringence: 3.8, flowSpeed: 1.05, anisotropyAngle: 0.95, weaveDensity: 480, seamSharpness: 1.0, glowIntensity: 0.9 },
  Trickster:{ primaryFreq: 10.5, secondaryFreq: 8.0, cymaticMode: 12, nematicTension: 4.8, chiralPitch: 3.6, birefringence: 4.2, flowSpeed: 1.35, anisotropyAngle: 1.10, weaveDensity: 560, seamSharpness: 0.85, glowIntensity: 1.0 },
  Sage:     { primaryFreq: 4.0, secondaryFreq: 2.5, cymaticMode: 3, nematicTension: 1.2, chiralPitch: 3.6, birefringence: 4.6, flowSpeed: 0.28, anisotropyAngle: 1.35, weaveDensity: 420, seamSharpness: 1.3, glowIntensity: 0.85 },
  Artist:   { primaryFreq: 5.5, secondaryFreq: 3.5, cymaticMode: 7, nematicTension: 2.6, chiralPitch: 3.0, birefringence: 5.0, flowSpeed: 0.55, anisotropyAngle: 1.20, weaveDensity: 460, seamSharpness: 1.1, glowIntensity: 0.95 },
  Magician: { primaryFreq: 6.5, secondaryFreq: 4.0, cymaticMode: 5, nematicTension: 3.4, chiralPitch: 3.0, birefringence: 3.6, flowSpeed: 0.95, anisotropyAngle: 0.30, weaveDensity: 460, seamSharpness: 1.1, glowIntensity: 1.10 },
  Hero:     { primaryFreq: 7.5, secondaryFreq: 4.5, cymaticMode: 4, nematicTension: 3.6, chiralPitch: 1.8, birefringence: 3.2, flowSpeed: 1.20, anisotropyAngle: 0.20, weaveDensity: 500, seamSharpness: 1.2, glowIntensity: 1.05 },
};

const KEY_TO_NAME = {
  JUDGE: 'Judge', RULER: 'Ruler', LOVER: 'Lover', CAREGIVER: 'Caregiver',
  INNOCENT: 'Innocent', EXPLORER: 'Explorer', OUTLAW: 'Outlaw', TRICKSTER: 'Trickster',
  SAGE: 'Sage', ARTIST: 'Artist', MAGICIAN: 'Magician', HERO: 'Hero',
};
const norm = (k) => KEY_TO_NAME[String(k || '').toUpperCase()] || null;

// ── resolve geometry → scalar config ──────────────────────────────────────
// opts.polarGap (Main − Shadow weight) gates the radial lever per spec §3.3. When
// absent (no geometry read available), the gate opens fully (polar_norm = 0) and the
// radial lever expresses orientation ungated — a flagged provisional (spec §4).
function resolveOrb(geometry, opts = {}) {
  const ranked = Object.entries(geometry || {})
    .filter(([a]) => CANON[a] && geometry[a] > 0)
    .sort((a, b) => b[1] - a[1]);
  if (!ranked.length) return null;

  const tot = ranked.reduce((s, [, w]) => s + w, 0) || 1;
  let w = ranked.map(([a, x]) => [a, Math.pow(x / tot, K)]);
  const ws = w.reduce((s, [, x]) => s + x, 0) || 1;
  w = w.map(([a, x]) => [a, x / ws]);   // normalised sharpened weights (wn), sum = 1

  const out = {};
  for (const L of LEVERS) { let v = 0; for (const [a, x] of w) v += x * CANON[a][L]; out[L] = v; }

  const dom = ranked[0][0];
  out.colors = PALETTES[GROUP[dom]].slice();   // colour = rank-1 group, winner-take-all
  // bloom = Relational anywhere in the ranked top-3 (decoupled from colour, spec §3.4)
  out.bloom = ranked.slice(0, 3).some(([a]) => BLOOM_GROUPS.has(GROUP[a]));

  for (const L of LEVERS) {
    const [mn, mx] = RANGES[L];
    const v = Math.max(mn, Math.min(mx, out[L]));
    out[L] = (L === 'cymaticMode' || L === 'weaveDensity') ? Math.round(v) : Math.round(v * 100) / 100;
  }

  // Radial lever (spec §3.3): direction from orientation, magnitude geometry-driven, polar-gated.
  //   orient_balance = Σ wn[a]·ORIENT[GROUP[a]]   (−1 pure-internal … +1 pure-external)
  //   r = orient_balance · (1 − polar_norm)       (polarised geometry walls the radial toward 0)
  const orientBalance = w.reduce((s, [a, x]) => s + x * (ORIENT[GROUP[a]] || 0), 0);
  const polarNorm = Number.isFinite(opts.polarGap)
    ? Math.max(0, Math.min(1, opts.polarGap / POLAR_SCALE))
    : 0;   // no polar read → gate open (provisional, pre-calibration)
  out.radialStructure = Math.round(Math.max(-1, Math.min(1, orientBalance * (1 - polarNorm))) * 100) / 100;

  out._dominant = dom;
  out._weights = w;
  return out;
}

// ── DNA (LC_ORB2_…) — bloom byte `bl` + radial field `r` round-trip ────────
// Version bumped to LC_ORB2_ (adds `r`, radial structure). Legacy LC_ORB_ codes
// still decode — they simply lack `r`, which defaults to 0 (neutral).
function encodeDNA(c) {
  if (!c) return '';
  const comp = {
    f1: +c.primaryFreq.toFixed(2), f2: +c.secondaryFreq.toFixed(2), m: Math.round(c.cymaticMode),
    t: +c.nematicTension.toFixed(2), p: +c.chiralPitch.toFixed(2), b: +c.birefringence.toFixed(2),
    s: +c.flowSpeed.toFixed(2), a: +c.anisotropyAngle.toFixed(2), d: Math.round(c.weaveDensity),
    w: +c.seamSharpness.toFixed(2), g: +c.glowIntensity.toFixed(2),
    r: +(+(c.radialStructure ?? 0)).toFixed(2), c: c.colors, bl: c.bloom ? 1 : 0,
  };
  try { return 'LC_ORB2_' + btoa(encodeURIComponent(JSON.stringify(comp))); } catch { return ''; }
}
function decodeDNA(dna) {
  const pfx = dna && dna.startsWith('LC_ORB2_') ? 'LC_ORB2_'
            : dna && dna.startsWith('LC_ORB_') ? 'LC_ORB_'   // legacy — no radial field
            : null;
  if (!pfx) return null;
  try {
    const p = JSON.parse(decodeURIComponent(atob(dna.replace(pfx, ''))));
    return {
      primaryFreq: p.f1 ?? 4, secondaryFreq: p.f2 ?? 2, cymaticMode: p.m ?? 4,
      nematicTension: p.t ?? 2, chiralPitch: p.p ?? 1.5, birefringence: p.b ?? 2.5,
      flowSpeed: p.s ?? 0.5, anisotropyAngle: p.a ?? 0, weaveDensity: p.d ?? 300,
      seamSharpness: p.w ?? 1.5, glowIntensity: p.g ?? 0.8,
      radialStructure: p.r ?? 0,   // legacy LC_ORB_ codes default to 0 (neutral)
      colors: p.c ?? ['#050510', '#2c5f7c', '#6a3c9c', '#f0deb0', '#c8a04a'],
      bloom: !!p.bl,
    };
  } catch { return null; }
}

// ── geometry extraction from a GFL assessment/result ───────────────────────
/** Accepts a result OR a raw assessment doc; reads archetypeDetails[].total (or a scores map). */
function geometryFromResult(src) {
  if (!src) return null;
  const geo = {};
  const details = src.archetypeDetails;
  if (Array.isArray(details) && details.length) {
    for (const d of details) { const n = norm(d.key); if (n) geo[n] = (geo[n] || 0) + (d.total ?? d.score ?? 0); }
  } else {
    const scores = src.scores || src._archetypeScores || src;
    for (const [k, v] of Object.entries(scores || {})) {
      const n = norm(k);
      const val = typeof v === 'number' ? v : (v && (v.total ?? v.score));
      if (n && typeof val === 'number') geo[n] = (geo[n] || 0) + val;
    }
  }
  return Object.keys(geo).length >= 3 ? geo : null;
}

/** result/assessment → resolved config (client render FALLBACK; gate open). */
function configFromResult(src) {
  const geo = geometryFromResult(src);
  return geo ? resolveOrb(geo) : null;
}

/** result/assessment → "LC_ORB2_…" profile code (client FALLBACK; gate open). */
function orbCodeFromResult(src) {
  return encodeDNA(configFromResult(src));
}

/**
 * AUTHORITATIVE code-gen (backend). Reads the real matrix-engine geometry and gates
 * the radial lever with the true polar_gap = main_weight − shadow_weight (spec §3.3).
 * @param {{ archetypeDetails: Array, mainKey: string, shadowKey?: string }} geometry
 * @returns {string} "LC_ORB2_…" or '' when the geometry is incomplete.
 */
function orbCodeFromGeometry({ archetypeDetails, mainKey, shadowKey } = {}) {
  if (!Array.isArray(archetypeDetails) || !archetypeDetails.length) return '';
  const geo = {};
  const totalByKey = {};
  for (const d of archetypeDetails) {
    const total = d.total ?? d.score ?? 0;
    const n = norm(d.key);
    if (n) geo[n] = (geo[n] || 0) + total;
    totalByKey[String(d.key || '').toUpperCase()] = total;
  }
  const mainW = totalByKey[String(mainKey || '').toUpperCase()] ?? 0;
  const shadowW = shadowKey ? (totalByKey[String(shadowKey).toUpperCase()] ?? 0) : 0;
  const polarGap = mainW - shadowW;
  return encodeDNA(resolveOrb(geo, { polarGap }));
}

// ── LC_ORB3 (3D orb) engine — 12-arc → lever-vector → "LC_ORB3_…" (see ./orb3.js) ──
const orb3 = require('./orb3');

module.exports = {
  K, RANGES, LEVERS, PALETTES, GROUP, BLOOM_GROUPS, ORIENT, POLAR_SCALE, CANON, KEY_TO_NAME,
  resolveOrb, encodeDNA, decodeDNA,
  geometryFromResult, configFromResult, orbCodeFromResult, orbCodeFromGeometry,
  // LC_ORB3 (3D):
  deriveOrb3: orb3.deriveOrb3, encodeOrb3: orb3.encodeOrb3, decodeOrb3: orb3.decodeOrb3,
  orb3FromGeometry: orb3.orb3FromGeometry, composedB: orb3.composedB,
  ORB3_TEMPO: orb3.ORB3_TEMPO, ORB3_PALETTES: orb3.ORB3_PALETTES, ORB3_GROUP_PRESET: orb3.ORB3_GROUP_PRESET,
  ORB3_B_PRIORS: orb3.ORB3_B_PRIORS, ORB3_SCALARS: orb3.ORB3_SCALARS,
};
