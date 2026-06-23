/**
 * Plastische Morfologie — the D-curve chart (restructure part 2.3, v4)
 * ===================================================================
 * The 3-line cost-curve visual (plan §5): Main + Support + Samengesteld over
 * D1..D5 (0–100). Consumes assembleV4().morphology.chart ({ main, support,
 * composed }). Non-monotonic by design — the SHAPE is the reading, not the
 * endpoint. Used both on-screen and rasterised (html2canvas) into the PDF.
 */

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { dPhaseLabel } from './v4Labels';

const STATES = ['D1', 'D2', 'D3', 'D4', 'D5'];

const COLORS = {
  main: '#39FF14',      // green — Main
  support: '#BF00FF',   // purple — Support
  composed: '#22d3ee',  // cyan — Samengesteld
};

/**
 * @param {{ chart: {main?:number[], support?:number[], composed?:number[]},
 *           mainName?: string, supportName?: string, height?: number }} props
 */
export default function MorphologyChart({ chart, mainName = 'Main', supportName = 'Support', height = 280, language = 'nl' }) {
  if (!chart || (!chart.main && !chart.support && !chart.composed)) return null;
  const { main, support, composed } = chart;

  const data = STATES.map((d, i) => ({
    state: d,
    label: dPhaseLabel(d, language),      // full phase name (tooltip)
    main: main ? main[i] : null,
    support: support ? support[i] : null,
    composed: composed ? composed[i] : null,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 18, right: 28, bottom: 8, left: -8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(168,85,247,0.14)" />
        <XAxis dataKey="state" stroke="#a78bfa" tick={{ fontSize: 12, fontFamily: "'Figtree', sans-serif" }}
          tickFormatter={(v) => dPhaseLabel(v, language, true)} tickLine={false} />
        <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} stroke="#a78bfa" tick={{ fontSize: 11 }} tickLine={false} width={34} />
        <ReferenceLine y={50} stroke="rgba(168,85,247,0.2)" strokeDasharray="2 4" />
        <Tooltip
          contentStyle={{
            background: 'rgba(12,12,29,0.95)', border: '1px solid rgba(168,85,247,0.4)',
            borderRadius: 8, fontFamily: "'Figtree', sans-serif", fontSize: 12,
          }}
          labelFormatter={(v, p) => (p && p[0] ? p[0].payload.label : v)}
        />
        <Legend wrapperStyle={{ fontFamily: "'Figtree', sans-serif", fontSize: 12 }} />
        {main && (
          <Line type="monotone" dataKey="main" name={mainName} stroke={COLORS.main}
            strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
        )}
        {support && (
          <Line type="monotone" dataKey="support" name={supportName} stroke={COLORS.support}
            strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
        )}
        {composed && (
          <Line type="monotone" dataKey="composed" name="Samengesteld" stroke={COLORS.composed}
            strokeWidth={2.5} strokeDasharray="6 3" dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
