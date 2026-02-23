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
 * @param {{ data: Array<{ subject: string, A: number, fullMark: number }> }} props
 */
const SciFiRadarChart = ({ data }) => {
  // Dynamic domain: the highest-scoring archetype always reaches the outer border
  const maxVal = Math.max(1, ...data.map(d => d.A || 0));

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
          <PolarGrid stroke="#00ff9d" strokeOpacity={0.25} />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#a5f3fc', fontSize: 11, fontFamily: "'Rajdhani', sans-serif" }} 
          />
          <PolarRadiusAxis angle={30} domain={[0, maxVal]} tick={false} axisLine={false} />
          <Radar
            name="Archetype"
            dataKey="A"
            stroke="#00ff9d"
            strokeWidth={2}
            fill="#00ff9d"
            fillOpacity={0.3}
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
