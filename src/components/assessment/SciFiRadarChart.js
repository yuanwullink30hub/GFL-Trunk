import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

/**
 * SciFiRadarChart - Dual-web radar chart: Nature (purple) + Culture (orange)
 * Shows all 12 archetypes with overlaid Nature and Culture webs.
 * @param {{ data: Array<{ subject: string, A: number, nature: number, culture: number, fullMark: number }>, shadow?: string, blindspot?: string, mainArchetype?: string, supportArchetype?: string }} props
 */
const SciFiRadarChart = ({ data, shadow, blindspot, mainArchetype, supportArchetype }) => {
  // Fixed scale: each archetype has exactly 15 nature-eligible and 15 culture-eligible questions
  const fullMark = 15;

  // Custom tick renderer to highlight Shadow (red) and Blindspot (amber) labels
  const renderPolarAngleAxisTick = (props) => {
    const { payload, x, y, textAnchor } = props;
    const label = payload?.value || '';
    const upperLabel = label.toUpperCase();
    let fill = '#a5f3fc'; // default cyan
    let fontWeight = 400;
    if (shadow && upperLabel === shadow.toUpperCase()) {
      fill = '#ff4d6a'; // red for shadow
      fontWeight = 700;
    } else if (blindspot && upperLabel === blindspot.toUpperCase()) {
      fill = '#fbbf24'; // amber for blindspot
      fontWeight = 700;
    } else if (mainArchetype && upperLabel === mainArchetype.toUpperCase()) {
      fill = '#a855f7'; // purple for main
      fontWeight = 700;
    } else if (supportArchetype && upperLabel === supportArchetype.toUpperCase()) {
      fill = '#f97316'; // orange for support
      fontWeight = 700;
    }
    return (
      <text x={x} y={y} textAnchor={textAnchor} fill={fill} fontWeight={fontWeight} fontSize={11} fontFamily="'Rajdhani', sans-serif">
        {label}
      </text>
    );
  };

  // Nature dots: purple
  const renderNatureDot = (props) => {
    const { cx, cy } = props;
    if (cx == null || cy == null) return null;
    return <circle cx={cx} cy={cy} r={3.5} fill="#a855f7" stroke="#581c87" strokeWidth={1} />;
  };

  // Culture dots: orange
  const renderCultureDot = (props) => {
    const { cx, cy } = props;
    if (cx == null || cy == null) return null;
    return <circle cx={cx} cy={cy} r={3.5} fill="#f97316" stroke="#7c2d12" strokeWidth={1} />;
  };

  // Custom tooltip showing Nature + Culture breakdown
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;
    return (
      <div style={{
        backgroundColor: 'rgba(5, 10, 20, 0.95)',
        border: '1px solid rgba(168, 85, 247, 0.4)',
        borderRadius: '4px',
        padding: '0.5rem 0.75rem',
        fontFamily: "'Rajdhani', sans-serif",
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
      }}>
        <p style={{ color: '#a5f3fc', fontWeight: 700, margin: '0 0 0.25rem', fontSize: '0.85rem' }}>{d.subject}</p>
        <p style={{ color: '#a855f7', margin: '0.1rem 0', fontSize: '0.8rem' }}>Nature: {d.nature || 0}</p>
        <p style={{ color: '#f97316', margin: '0.1rem 0', fontSize: '0.8rem' }}>Culture: {d.culture || 0}</p>
        <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0.1rem 0', fontSize: '0.75rem' }}>Total: {d.A || 0}</p>
      </div>
    );
  };

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 300, position: 'relative' }}>
      {/* Decorative glowing circle behind the chart */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.04) 0%, rgba(249, 115, 22, 0.03) 50%, transparent 70%)',
        filter: 'blur(40px)',
        borderRadius: '50%',
        transform: 'scale(0.8)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

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
            tick={{ fill: 'rgba(165, 243, 252, 0.25)', fontSize: 9, fontFamily: "'Rajdhani', sans-serif" }}
            axisLine={false}
          />
          {/* Nature web — purple */}
          <Radar
            name="Nature"
            dataKey="nature"
            stroke="#a855f7"
            strokeWidth={2}
            fill="#a855f7"
            fillOpacity={0.15}
            dot={renderNatureDot}
            connectNulls
            isAnimationActive={true}
            animationDuration={800}
          />
          {/* Culture web — orange */}
          <Radar
            name="Culture"
            dataKey="culture"
            stroke="#f97316"
            strokeWidth={2}
            fill="#f97316"
            fillOpacity={0.12}
            dot={renderCultureDot}
            connectNulls
            isAnimationActive={true}
            animationDuration={800}
            animationBegin={200}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: '0.75rem',
              letterSpacing: '0.1em',
            }}
            formatter={(value) => (
              <span style={{ color: value === 'Nature' ? '#a855f7' : '#f97316' }}>{value}</span>
            )}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SciFiRadarChart;
