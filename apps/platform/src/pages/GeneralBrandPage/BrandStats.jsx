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
 * BrandStats - Radar chart component for displaying brand metrics
 * Uses recharts library for the visualization
 */

// Transform metrics for the chart
const getChartData = (metrics) => {
  return metrics.map(m => ({
    subject: m.label,
    A: typeof m.value === 'string' && m.value.includes('%') 
      ? parseInt(m.value) 
      : (typeof m.value === 'number' ? m.value : Math.random() * 100 + 50),
    fullMark: 150
  }));
};

const BrandStats = ({ metrics }) => {
  const data = getChartData(metrics);

  return (
    <div className="w-full h-full" style={{ minHeight: '180px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
          <PolarGrid stroke="rgba(188, 19, 254, 0.2)" strokeDasharray="4 4" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ 
              fill: '#ffae00', 
              fontSize: 10, 
              fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif", 
              fontWeight: 'bold' 
            }} 
          />
          <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
          <Radar
            name="Performance"
            dataKey="A"
            stroke="#bc13fe"
            strokeWidth={2}
            fill="#bc13fe"
            fillOpacity={0.4}
            dot={{ r: 3, fill: '#ffae00', strokeWidth: 0 }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(3, 0, 5, 0.9)', 
              borderColor: '#bc13fe', 
              color: '#ffae00', 
              fontSize: '10px',
              fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
              boxShadow: '0 0 20px rgba(188, 19, 254, 0.2)'
            }}
            itemStyle={{ color: '#ffae00' }}
            cursor={{ stroke: '#ffae00', strokeWidth: 1 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BrandStats;
