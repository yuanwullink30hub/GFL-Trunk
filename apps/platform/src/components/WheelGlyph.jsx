import React from 'react';

/* ── WheelGlyph: a reading's full radar-wheel geometry in the ORIGINAL colour split (identical
   to the report/PDF radar). baskets12[i] = [nat_core, green(hardware), cult_core, blue(feedback),
   yellow(cognitief), purple(schaduw)] per wheel position (Judge…Ruler). Drawn as stacked cumulative
   polygons, outermost layer first — same layer order + palette as the report's radar. Owner-only
   data (via /me), never on the public card. ── */
export const WHEEL_LAYERS = [
  { color: '#166534' }, // nat_core   — Natuur Kern (dark green)
  { color: '#22c55e' }, // green      — Hardware
  { color: '#e85818' }, // cult_core  — Cultuur Kern
  { color: '#3b82f6' }, // blue       — HW Feedback
  { color: '#eab308' }, // yellow     — Cognitief
  { color: '#a855f7' }, // purple     — Schaduw
];

export default function WheelGlyph({ baskets }) {
  const C = 50, R = 46;
  // Cumulative sums per axis: layer k's outline = sum of baskets 0..k.
  const cum = baskets.map((row) => {
    const sums = []; let acc = 0;
    for (let k = 0; k < 6; k++) { acc += row[k] || 0; sums.push(acc); }
    return sums;
  });
  const maxTotal = Math.max(1, ...cum.map((s) => s[5]));
  const pt = (i, v) => {
    const a = (Math.PI * 2 * i) / 12 - Math.PI / 2;
    const r = (v / maxTotal) * R;
    return `${C + Math.cos(a) * r},${C + Math.sin(a) * r}`;
  };
  const poly = (k) => cum.map((s, i) => pt(i, s[k])).join(' ');
  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }} aria-hidden="true">
      {[0.33, 0.66, 1].map((f) => (
        <circle key={f} cx={C} cy={C} r={R * f} fill="none" stroke="rgba(165, 243, 252, 0.12)" strokeWidth="0.6" />
      ))}
      {/* outermost (schaduw) → innermost (natuur kern): painter's algorithm gives the colour split */}
      {[5, 4, 3, 2, 1, 0].map((k) => (
        <polygon key={k} points={poly(k)} fill={WHEEL_LAYERS[k].color} fillOpacity="0.9" stroke="rgba(10, 5, 16, 0.6)" strokeWidth="0.4" strokeLinejoin="round" />
      ))}
    </svg>
  );
}
