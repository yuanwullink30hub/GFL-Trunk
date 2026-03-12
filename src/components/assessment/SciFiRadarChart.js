import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

/**
 * SciFiRadarChart - Sci-fi styled radar chart for assessment results
 * @param {{ data: Array<{ subject: string, A: number, fullMark: number }>, shadow?: string, blindspot?: string, mainArchetype?: string, supportArchetype?: string }} props
 */
const SciFiRadarChart = ({ data, shadow, blindspot, mainArchetype, supportArchetype }) => {
  // Fixed domain from tier max (fullMark is set per-tier: 669 Beginner/Intermediate, 789 Advanced)
  const fullMark = data?.[0]?.fullMark || 789;

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
    }
    return (
      <text x={x} y={y} textAnchor={textAnchor} fill={fill} fontWeight={fontWeight} fontSize={11} fontFamily="'Rajdhani', sans-serif">
        {label}
      </text>
    );
  };

  // Custom dot renderer: Main = purple, Support = orange, others = green
  const renderDot = (props) => {
    const { cx, cy, payload } = props;
    if (cx == null || cy == null) return null;
    const label = (payload?.subject || '').toUpperCase();
    let dotFill = '#00ff9d';
    let dotStroke = '#003d27';
    let r = 4;
    if (mainArchetype && label === mainArchetype.toUpperCase()) {
      dotFill = '#a855f7'; // purple for Main
      dotStroke = '#581c87';
      r = 6;
    } else if (supportArchetype && label === supportArchetype.toUpperCase()) {
      dotFill = '#f97316'; // orange for Support
      dotStroke = '#7c2d12';
      r = 6;
    }
    return <circle cx={cx} cy={cy} r={r} fill={dotFill} stroke={dotStroke} strokeWidth={1.5} />;
  };

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 300, position: 'relative' }}>
      {/* Decorative glowing circle behind the chart */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0, 255, 157, 0.05)',
        filter: 'blur(50px)',
        borderRadius: '50%',
        transform: 'scale(0.75)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#00ff9d" strokeOpacity={0.25} gridType="polygon" polarAngles={undefined} radialLines={true} />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={renderPolarAngleAxisTick}
          />
          <PolarRadiusAxis angle={30} domain={[0, fullMark]} tickCount={6} tick={false} axisLine={false} />
          <Radar
            name="Archetype"
            dataKey="A"
            stroke="#00ff9d"
            strokeWidth={2.5}
            fill="#00ff9d"
            fillOpacity={0.25}
            dot={renderDot}
            activeDot={{ r: 7, fill: '#a5f3fc', stroke: '#00ff9d', strokeWidth: 2 }}
            connectNulls
            isAnimationActive={true}
            animationDuration={800}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(5, 10, 20, 0.9)', 
              borderColor: '#00ff9d',
              color: '#00ff9d',
              fontFamily: "'Rajdhani', sans-serif",
              borderRadius: '4px',
              boxShadow: '0 0 10px rgba(0, 255, 157, 0.3)'
            }}
            itemStyle={{ color: '#fff' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SciFiRadarChart;
