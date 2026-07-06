// 3D orb lever model — ported from orb_3d_prototype.html (the tuned render prototype).
// Replaces the 2D lever set for the template/login orb. Client-side visual metadata + the
// six hardware-group presets (authored illustrations; the geometry→lever engine feeds real
// values later). Palettes are the LOCKED six-group hardware hex.

export const ORB3D_LEVERS = [
  { key: 'cymaticL',     label: 'Cymatisch ℓ',   min: 1,   max: 12,  step: 1,    int: true },
  { key: 'cymaticM',     label: 'Cymatisch m',   min: 0,   max: 12,  step: 1,    int: true },
  { key: 'displacement', label: 'Verplaatsing',  min: 0,   max: 1,   step: 0.01 },
  { key: 'radial',       label: 'Radiaal',       min: -1,  max: 1,   step: 0.01 },
  { key: 'tension',      label: 'Spanning',      min: 0,   max: 5,   step: 0.01 },
  { key: 'depth',        label: 'Diepte',        min: -1,  max: 1,   step: 0.01 },
  { key: 'pulse',        label: 'Pulsslag',      min: 0.3, max: 2.0, step: 0.01 },
  { key: 'breaking',     label: 'Breking',       min: 0.5, max: 4.2, step: 0.01 },
  { key: 'friction',     label: 'Kleurwrijving', min: 0,   max: 1,   step: 0.01 },
  { key: 'harmony',      label: 'Harmonie',      min: 0,   max: 1,   step: 0.01 },
  { key: 'density',      label: 'Dichtheid',     min: 0,   max: 1,   step: 0.01 },
  { key: 'rotation',     label: 'Rotatie',       min: 0,   max: 1.5, step: 0.01 },
];

// friction + harmony are composition-only (baseline for a lone group); presets set them low.
export const ORB3D_PRESETS = {
  Ruling:     { cymaticL: 4, cymaticM: 2, displacement: 0.16, radial: 0.7,   tension: 0.35, depth: -0.6, pulse: 1.35, breaking: 1.6,  friction: 0.5,  harmony: 0.9,  density: 0.75, rotation: 0.12, colors: ['#0a0e14', '#2c5f7c', '#6a3c9c', '#f0deb0', '#c8a04a'] },
  Relational: { cymaticL: 1, cymaticM: 2, displacement: 0.72, radial: 0.69,  tension: 3.69, depth: 0.88, pulse: 1.15, breaking: 1.15, friction: 0.12, harmony: 0.72, density: 0.5,  rotation: 0.3,  colors: ['#140509', '#6e2c3a', '#c07078', '#e0a050', '#f6ead6'] },
  Seeker:     { cymaticL: 6, cymaticM: 1, displacement: 0.35, radial: 0.43,  tension: 3.05, depth: 0.1,  pulse: 1.47, breaking: 1.9,  friction: 0.28, harmony: 0.25, density: 0.26, rotation: 0.9,  colors: ['#08140c', '#1e5a2c', '#7a4a1e', '#5fb0a0', '#a8c4b8'] },
  Chaos:      { cymaticL: 8, cymaticM: 1,  displacement: 0.23, radial: -0.74, tension: 4.35, depth: 0.15, pulse: 1.58, breaking: 3.65, friction: 0.8,  harmony: 0.28, density: 0.72, rotation: 0.9,  colors: ['#1a0406', '#b81e1e', '#e85818', '#d89c1c', '#3a9c3a'] },
  Abstract:   { cymaticL: 4, cymaticM: 10, displacement: 0.20, radial: -0.66, tension: 2.95, depth: -0.7, pulse: 1.1,  breaking: 3.2,  friction: 0.9,  harmony: 0.69, density: 0.38, rotation: 0.36, colors: ['#0a060e', '#5a2c8c', '#2c8c4c', '#b04dc6', '#e8d088'] },
  Agency:     { cymaticL: 3, cymaticM: 7, displacement: 0.22, radial: 0.72,  tension: 1.4,  depth: 0.2,  pulse: 1.61, breaking: 3.15, friction: 0.81, harmony: 0.85, density: 0.86, rotation: 1.12, colors: ['#0e0202', '#c81818', '#14a0a8', '#e8501c', '#f0e4cc'] },
};
