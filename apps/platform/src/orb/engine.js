/**
 * Orb engine — client entry.
 * ==========================
 * The pure engine (constants, resolveOrb, encode/decode, geometry extraction) lives in the
 * shared @gfl/orb-engine package so the backend (authoritative code-gen) and the client
 * (render + fallback) never drift. This module re-exports what the client uses.
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
  PALETTES, GROUP, decodeDNA, configFromResult, orbCodeFromResult,
  // LC_ORB3 (3D orb): decode "LC_ORB3_…" → render config for <OrbSphere3D/>.
  decodeOrb3, encodeOrb3, deriveOrb3,
} = OrbEngine;
