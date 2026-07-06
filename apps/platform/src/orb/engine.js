/**
 * Orb engine — client entry.
 * ==========================
 * The pure engine (constants, resolveOrb, encode/decode, geometry extraction) lives in the
 * shared @gfl/orb-engine package so the backend (authoritative code-gen) and the client
 * (render + fallback) never drift. This module re-exports it and adds the client-only
 * visual PRESETS.
 *
 * NOTE: the backend authors the real LC_ORB2_ code from the matrix-engine geometry (true
 * polar_gap). The client's resolveOrb/orbCodeFromResult are a render-time FALLBACK only
 * (radial gate open, provisional) — used when a backend-authored code isn't available.
 */

// Default import + destructured re-export: @gfl/orb-engine is CommonJS, and Rollup can't
// statically resolve `export { … } from` a CJS module. Vite's interop guarantees the default
// import is the whole module.exports object, so we destructure it at runtime.
import OrbEngine from '@gfl/orb-engine';

export const {
  RANGES, LEVERS, PALETTES, GROUP, ORIENT, POLAR_SCALE, CANON,
  resolveOrb, encodeDNA, decodeDNA,
  geometryFromResult, configFromResult, orbCodeFromResult, orbCodeFromGeometry,
  // LC_ORB3 (3D orb): decode "LC_ORB3_…" → render config for <OrbSphere3D/>.
  decodeOrb3, encodeOrb3, deriveOrb3, orb3FromGeometry,
} = OrbEngine;

// ── Template presets — one hand-tuned orb per hardware group (client visual only) ──
// SECURITY: these are DECODED parameter objects, never the LC_ORB2_ code strings. The
// profile code is a login credential (the report PDF's code IS the login), so no code
// ever ships in the client bundle. The login lab's palette panel morphs the whole orb
// to the selected group; keys match GROUP values / PALETTES keys.
export const PRESETS = {
  Ruling:     { primaryFreq: 3.5, secondaryFreq: 1.5, cymaticMode: 2, nematicTension: 0.9, chiralPitch: 0.8, birefringence: 2.0, flowSpeed: 0.35, anisotropyAngle: 0, weaveDensity: 300, seamSharpness: 2.0, glowIntensity: 0.75, radialStructure: 0.7, colors: ['#0a0e14', '#2c5f7c', '#6a3c9c', '#f0deb0', '#c8a04a'], bloom: false },
  Relational: { primaryFreq: 3.0, secondaryFreq: 1.8, cymaticMode: 5, nematicTension: 1.4, chiralPitch: 1.4, birefringence: 1.8, flowSpeed: 0.45, anisotropyAngle: 0.6, weaveDensity: 320, seamSharpness: 1.8, glowIntensity: 0.7, radialStructure: 0.7, colors: ['#140509', '#6e2c3a', '#c07078', '#e0a050', '#f6ead6'], bloom: false },
  Seeker:     { primaryFreq: 6.0, secondaryFreq: 4.0, cymaticMode: 9, nematicTension: 0.7, chiralPitch: 1.2, birefringence: 2.2, flowSpeed: 0.7, anisotropyAngle: 0.4, weaveDensity: 420, seamSharpness: 1.3, glowIntensity: 0.7, radialStructure: -0.7, colors: ['#08140c', '#1e5a2c', '#7a4a1e', '#5fb0a0', '#a8c4b8'], bloom: false },
  Chaos:      { primaryFreq: 9.0, secondaryFreq: 6.5, cymaticMode: 7, nematicTension: 4.2, chiralPitch: 2.6, birefringence: 3.8, flowSpeed: 1.1, anisotropyAngle: 0.9, weaveDensity: 500, seamSharpness: 1.0, glowIntensity: 0.95, radialStructure: -0.7, colors: ['#1a0406', '#b81e1e', '#e85818', '#d89c1c', '#3a9c3a'], bloom: false },
  Abstract:   { primaryFreq: 5.0, secondaryFreq: 3.0, cymaticMode: 5, nematicTension: 2.0, chiralPitch: 3.2, birefringence: 4.5, flowSpeed: 0.4, anisotropyAngle: 1.3, weaveDensity: 450, seamSharpness: 1.1, glowIntensity: 0.9, radialStructure: -0.7, colors: ['#0a060e', '#5a2c8c', '#2c8c4c', '#b04dc6', '#e8d088'], bloom: false },
  Agency:     { primaryFreq: 7.0, secondaryFreq: 4.5, cymaticMode: 4, nematicTension: 3.4, chiralPitch: 1.8, birefringence: 3.6, flowSpeed: 1.0, anisotropyAngle: 0.2, weaveDensity: 480, seamSharpness: 1.1, glowIntensity: 1.0, radialStructure: 0.7, colors: ['#0e0202', '#c81818', '#14a0a8', '#e8501c', '#f0e4cc'], bloom: false },
};
