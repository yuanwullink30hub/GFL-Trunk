import React, { useMemo } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

/**
 * 5-layer stacked band colors (spec §4).
 * Layers rendered largest-first (painter's algorithm): Shadow → Cognitief → Feedback → Bio → Core
 */
const LAYER_COLORS = {
  green:  '#14532d',   // Natuur Kern — innermost, direct nature picks (dark green)
  lime:   '#4ade80',   // Bio Hardware (green_hw) — +3 bleed, light green (between nature & culture)
  orange: '#c2410c',   // Cultuur Kern — direct culture picks
  blue:   '#1d4ed8',   // Hardware Feedback (blue_fb) — +2 bleed
  gold:   '#EAB308',   // Cognitieve Lens (yellow_cog) — +2 cognitive pair bleed
  purple: '#7e22ce',   // Schaduw (purple_shadow) — +1 shadow drip (outermost)
};

// eslint-disable-next-line no-unused-vars
const LAYER_META = [
  // draw order: largest polygon first (outermost → innermost)
  { key: 'purple', label: 'Schaduw',          color: LAYER_COLORS.purple, field: 'purple_shadow' },
  { key: 'gold',   label: 'Cognitieve Lens',  color: LAYER_COLORS.gold,   field: 'yellow_cog'    },
  { key: 'blue',   label: 'Feedback loop',      color: LAYER_COLORS.blue,   field: 'blue_fb'       },
  { key: 'orange', label: 'Cultuur Kern',     color: LAYER_COLORS.orange, field: 'culture_core'  },
  { key: 'lime',   label: 'Bio Hardware',     color: LAYER_COLORS.lime,   field: 'green_hw'      },
  { key: 'green',  label: 'Natuur Kern',      color: LAYER_COLORS.green,  field: 'nature_core'   },
];

/**
 * SciFiRadarChart — 5-Layer Stacked Radar (Painter's Algorithm)
 *
 * Renders 5 opaque polygons from largest (purple) to smallest (green).
 * Each polygon's data represents the cumulative band outer boundary.
 * The painter's algorithm ensures each smaller polygon covers the inner
 * area of the larger one, creating visible colour bands.
 *
 * @param {{ data: Array, shadow?: string, blindspot?: string, mainArchetype?: string, supportArchetype?: string }} props
 */
const SciFiRadarChart = ({ data, shadow, blindspot, mainArchetype, supportArchetype }) => {
  // Dynamic domain: find max total across all archetypes, round up to next 50
  const fullMark = useMemo(() => {
    if (!data || !data.length) return 200;
    const maxVal = Math.max(...data.map(d => d.purple || d.A || 0)); // purple = outermost = total
    return Math.max(50, Math.ceil(maxVal / 50) * 50);
  }, [data]);

  // Custom tick renderer to highlight Shadow (red) and Blindspot (amber) labels
  const renderPolarAngleAxisTick = (props) => {
    const { payload, x, y, textAnchor } = props;
    const label = payload?.value || '';
    const upperLabel = label.toUpperCase();
    let fill = '#a5f3fc'; // default cyan
    let fontWeight = 400;
    if (shadow && upperLabel === shadow.toUpperCase()) {
      fill = '#ff4d6a'; fontWeight = 700;
    } else if (blindspot && upperLabel === blindspot.toUpperCase()) {
      fill = '#fbbf24'; fontWeight = 700;
    } else if (mainArchetype && upperLabel === mainArchetype.toUpperCase()) {
      fill = '#a855f7'; fontWeight = 700;
    } else if (supportArchetype && upperLabel === supportArchetype.toUpperCase()) {
      fill = '#f97316'; fontWeight = 700;
    }
    return (
      <text x={x} y={y} textAnchor={textAnchor} fill={fill} fontWeight={fontWeight} fontSize={18} fontFamily="'Segoe UI', Arial, sans-serif">
        {label}
      </text>
    );
  };

  // Custom tooltip showing 5-basket breakdown
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;
    const rows = [
      { label: 'Natuur Kern',  value: d.nature_core,    color: LAYER_COLORS.green },
      { label: 'Hardware',     value: d.green_hw,       color: LAYER_COLORS.lime },
      { label: 'Cultuur Kern', value: d.culture_core,   color: LAYER_COLORS.orange },
      { label: 'HW Feedback',  value: d.blue_fb,        color: LAYER_COLORS.blue },
      { label: 'Cognitief',    value: d.yellow_cog,     color: LAYER_COLORS.gold },
      { label: 'Schaduw',      value: d.purple_shadow,  color: LAYER_COLORS.purple },
    ];
    return (
      <div style={{
        backgroundColor: 'rgba(5, 10, 20, 0.95)',
        border: '1px solid rgba(46, 125, 50, 0.4)',
        borderRadius: '4px',
        padding: '0.5rem 0.75rem',
        fontFamily: "'Rajdhani', sans-serif",
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
      }}>
        <p style={{ color: '#a5f3fc', fontWeight: 700, margin: '0 0 0.25rem', fontSize: '0.85rem' }}>{d.subject}</p>
        {rows.map(r => (
          <p key={r.label} style={{ color: r.color, margin: '0.1rem 0', fontSize: '0.8rem' }}>
            {r.label}: {r.value || 0}
          </p>
        ))}
        <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0.25rem 0 0', fontSize: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.2rem' }}>
          Total: {d.A || d.purple || 0}
        </p>
      </div>
    );
  };

  // Legend items (display order: innermost → outermost, matching visual layer order)
  const legendPayload = [
    { value: 'Natuur Kern',  type: 'square', color: LAYER_COLORS.green, labelColor: '#4ade80' },  // swatch = dark green, text = bright green
    { value: 'Hardware',     type: 'square', color: LAYER_COLORS.lime },    // light green
    { value: 'Cultuur Kern', type: 'square', color: LAYER_COLORS.orange },  // orange
    { value: 'HW Feedback',  type: 'square', color: LAYER_COLORS.blue },    // blue
    { value: 'Cognitief',    type: 'square', color: LAYER_COLORS.gold },    // yellow
    { value: 'Schaduw',      type: 'square', color: LAYER_COLORS.purple },  // purple — outermost
  ];

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 300, position: 'relative', background: 'transparent' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#a5f3fc" strokeOpacity={0.15} gridType="polygon" radialLines={true} />
          <PolarAngleAxis
            dataKey="subject"
            tick={renderPolarAngleAxisTick}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, fullMark]}
            tickCount={4}
            tick={{ fill: 'rgba(165, 243, 252, 0.25)', fontSize: 14, fontFamily: "'Segoe UI', Arial, sans-serif" }}
            axisLine={false}
          />

          {/* Painter's Algorithm: draw largest polygon first, smallest last.
              Each layer is opaque (fillOpacity=1) — smaller layers cover inner area.
              Order (outermost → innermost): purple > gold > blue > lime > orange > green */}

          {/* Layer 6: Purple — Schaduw drip (outermost = total) */}
          <Radar name="Schaduw" dataKey="purple"
            stroke={LAYER_COLORS.purple} strokeWidth={1} strokeOpacity={0.6}
            fill={LAYER_COLORS.purple} fillOpacity={1}
            isAnimationActive={true} animationDuration={800} />

          {/* Layer 5: Gold — Cognitieve Lens */}
          <Radar name="Cognitief" dataKey="gold"
            stroke={LAYER_COLORS.gold} strokeWidth={1} strokeOpacity={0.6}
            fill={LAYER_COLORS.gold} fillOpacity={1}
            isAnimationActive={true} animationDuration={800} animationBegin={100} />

          {/* Layer 4: Blue — Hardware Feedback */}
          <Radar name="HW Feedback" dataKey="blue"
            stroke={LAYER_COLORS.blue} strokeWidth={1} strokeOpacity={0.6}
            fill={LAYER_COLORS.blue} fillOpacity={1}
            isAnimationActive={true} animationDuration={800} animationBegin={200} />

          {/* Layer 3: Orange — Cultuur Kern (direct culture picks) */}
          <Radar name="Cultuur Kern" dataKey="orange"
            stroke={LAYER_COLORS.orange} strokeWidth={1} strokeOpacity={0.6}
            fill={LAYER_COLORS.orange} fillOpacity={1}
            isAnimationActive={true} animationDuration={800} animationBegin={300} />

          {/* Layer 2: Lime — Bio Hardware bleed (light green, between nature & culture) */}
          <Radar name="Hardware" dataKey="lime"
            stroke={LAYER_COLORS.lime} strokeWidth={1} strokeOpacity={0.6}
            fill={LAYER_COLORS.lime} fillOpacity={1}
            isAnimationActive={true} animationDuration={800} animationBegin={400} />

          {/* Layer 1: Green — Natuur Kern (innermost, drawn last = on top) */}
          <Radar name="Natuur Kern" dataKey="green"
            stroke={LAYER_COLORS.green} strokeWidth={2}
            fill={LAYER_COLORS.green} fillOpacity={1}
            isAnimationActive={true} animationDuration={800} animationBegin={500} />

          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>

      {/* Custom legend — rendered outside Recharts so order is fully controlled */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '0.5rem 1rem',
        marginTop: '0.5rem',
        fontFamily: "'Segoe UI', Arial, sans-serif",
        fontSize: '0.85rem',
        letterSpacing: '0.04em',
      }}>
        {legendPayload.map(item => (
          <span key={item.value} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{
              display: 'inline-block',
              width: 12,
              height: 12,
              borderRadius: 2,
              background: item.color,
              flexShrink: 0,
            }} />
            <span style={{ color: item.labelColor || item.color }}>{item.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default SciFiRadarChart;
