/**
 * Plastische Morfologie — the D-curve chart
 * =========================================
 * Spec A1 — `{ baseline, transform }` from the runtime engine's `enginePayload.main.register`: TWO
 * curves, BOTH the Main's — baseline (τ) and transform (τ′) — on the register layer (one shared frame,
 * configuration peak = 100%, signed). No Support curve, no composed line. A negative value is an
 * inverted conversion, so the axis extends below zero only when the configuration has one. Holes
 * ([HELD] states) render as gaps — never interpolated.
 *
 * Non-monotonic by design — the SHAPE is the reading, not the endpoint. Used both on-screen and
 * rasterised (html2canvas) into the PDF.
 */

import { useLanguage } from '@gfl/i18n';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { dPhaseLabel } from './v4Labels';

const STATES = ['D1', 'D2', 'D3', 'D4', 'D5'];

const COLORS = {
  main: '#39FF14',      // green — the transform (the configuration)
  baseline: '#15b315',  // terminal green — the Main's baseline (τ), same hue family as the Main
};

/** Axis on 25-steps: 0–100 unless the configuration inverts (negative register values). */
function registerDomain(values) {
  const vals = values.filter((v) => typeof v === 'number');
  const lo = Math.min(0, Math.floor(Math.min(...vals, 0) / 25) * 25);
  const hi = Math.max(100, Math.ceil(Math.max(...vals, 0) / 25) * 25);
  const ticks = [];
  for (let v = lo; v <= hi; v += 25) ticks.push(v);
  return { domain: [lo, hi], ticks };
}

/**
 * @param {{ chart: {baseline:(number|null)[], transform:(number|null)[]},
 *           mainName?: string, configName?: string, height?: number, language?: string }} props
 *   configName — the configuration (extension) name, e.g. "De Ronin": the transform curve is the Main
 *   as the configuration pulls it, so it carries that name; the baseline keeps the Main's.
 */
export default function MorphologyChart({ chart, mainName = 'Main', configName, height = 280, language = 'nl' }) {
  const { t } = useLanguage();
  if (!chart || !Array.isArray(chart.baseline) || !Array.isArray(chart.transform)) return null;

  const data = STATES.map((d, i) => ({
    state: d,
    label: dPhaseLabel(d, language),      // full phase name (tooltip)
    baseline: chart.baseline[i] ?? null,
    transform: chart.transform[i] ?? null,
  }));
  const axis = registerDomain([...chart.baseline, ...chart.transform]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 18, right: 28, bottom: 8, left: -8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(168,85,247,0.1)" />
        <XAxis dataKey="state" stroke="#a78bfa" tick={{ fontSize: 12, fontFamily: "'Figtree', sans-serif" }}
          tickFormatter={(v) => dPhaseLabel(v, language, true)} tickLine={false} />
        <YAxis domain={axis.domain} ticks={axis.ticks} stroke="#a78bfa" tick={{ fontSize: 11 }} tickLine={false} width={40}
          tickFormatter={(v) => `${v}%`} />
        <ReferenceLine y={0} stroke="rgba(168,85,247,0.5)" />
        <Tooltip
          contentStyle={{
            background: 'rgba(2,0,3,0.9)', border: '1px solid rgba(168,85,247,0.4)',
            borderRadius: '0.5rem', fontFamily: "'Figtree', sans-serif", fontSize: 12, color: '#FFFEF0',
          }}
          labelFormatter={(v, p) => (p && p[0] ? p[0].payload.label : v)}
          formatter={(v) => (v === null || v === undefined ? '—' : `${v}%`)}
        />
        <Legend wrapperStyle={{ fontFamily: "'Figtree', sans-serif", fontSize: 12 }} />
        {/* Baseline (reference) underneath, transform on top. connectNulls={false}: a hole is absence. */}
        <Line type="monotone" dataKey="baseline" name={`${mainName} — ${t('charts.morphology.baseline')}`} stroke={COLORS.baseline}
          strokeWidth={2} strokeDasharray="6 4" dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls={false} />
        <Line type="monotone" dataKey="transform" name={`${configName || mainName} — ${t('charts.morphology.transform')}`} stroke={COLORS.main}
          strokeWidth={2.75} dot={{ r: 3.5 }} activeDot={{ r: 5 }} connectNulls={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
