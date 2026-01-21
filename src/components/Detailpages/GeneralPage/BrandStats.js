import React from 'react';
import { HoloCard } from './SciFiUI';

// Simple SVG-based Radar Chart (no external dependencies)
const SimpleRadarChart = ({ data }) => {
  const size = 200;
  const center = size / 2;
  const radius = 70;
  const levels = 5;
  
  // Calculate points for the polygon
  const getPoint = (value, index, total) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const r = (value / 150) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  const points = data.map((d, i) => getPoint(d.A, i, data.length));
  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  // Grid levels
  const gridLevels = Array.from({ length: levels }, (_, i) => {
    const levelRadius = (radius / levels) * (i + 1);
    const levelPoints = data.map((_, idx) => {
      const angle = (Math.PI * 2 * idx) / data.length - Math.PI / 2;
      return {
        x: center + levelRadius * Math.cos(angle),
        y: center + levelRadius * Math.sin(angle)
      };
    });
    return levelPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  });

  // Axis lines
  const axisLines = data.map((_, idx) => {
    const angle = (Math.PI * 2 * idx) / data.length - Math.PI / 2;
    return {
      x2: center + radius * Math.cos(angle),
      y2: center + radius * Math.sin(angle)
    };
  });

  // Label positions
  const labelPositions = data.map((d, idx) => {
    const angle = (Math.PI * 2 * idx) / data.length - Math.PI / 2;
    const labelRadius = radius + 15;
    return {
      x: center + labelRadius * Math.cos(angle),
      y: center + labelRadius * Math.sin(angle),
      label: d.subject
    };
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full" style={{ background: 'transparent' }}>
      {/* Grid - Green */}
      {gridLevels.map((path, i) => (
        <path
          key={i}
          d={path}
          fill="none"
          stroke="#15B315"
          strokeWidth="1"
        />
      ))}
      
      {/* Axis lines - Green */}
      {axisLines.map((line, i) => (
        <line
          key={i}
          x1={center}
          y1={center}
          x2={line.x2}
          y2={line.y2}
          stroke="#15B315"
          strokeWidth="1"
        />
      ))}
      
      {/* Data polygon - Purple */}
      <path
        d={pathData}
        fill="rgba(188, 19, 254, 0.3)"
        stroke="#bc13fe"
        strokeWidth="2"
        style={{ pointerEvents: 'none' }}
      />
      
      {/* Data points - Yellow (rendered after polygon for higher z-index) */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="4"
          fill="#E0E30B"
          stroke="white"
          strokeWidth="1"
        />
      ))}
      
      {/* Labels - Orange */}
      {labelPositions.map((pos, i) => (
        <text
          key={i}
          x={pos.x}
          y={pos.y}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-[9px] font-mono"
          style={{ fill: '#f59e0b' }}
        >
          {pos.label}
        </text>
      ))}
    </svg>
  );
};

// Chart data (default fallback)
const defaultChartData = [
  { subject: 'Innov', A: 120, fullMark: 150 },
  { subject: 'Eco', A: 98, fullMark: 150 },
  { subject: 'Design', A: 130, fullMark: 150 },
  { subject: 'Util', A: 100, fullMark: 150 },
  { subject: 'Value', A: 85, fullMark: 150 },
  { subject: 'Tech', A: 110, fullMark: 150 },
];

export const BrandStats = ({ metrics, radarData }) => {
  // Handle both array format and object format with dataPoints
  const dataPoints = Array.isArray(metrics) ? metrics : metrics?.dataPoints || [];
  
  // Transform radarData to chart format or use defaults
  const chartData = radarData && radarData.length > 0
    ? radarData.map(item => ({
        subject: item.label,
        A: item.value,
        fullMark: 150
      }))
    : defaultChartData;
  
  return (
    <div className="flex flex-col gap-4">
      {/* Radar Chart */}
      <HoloCard className="min-h-[250px] bg-transparent" style={{ border: '1px solid rgba(168, 85, 247, 0.8)' }}>
        <div className="h-[200px] w-full flex items-center justify-center">
          <SimpleRadarChart data={chartData} />
        </div>
      </HoloCard>

      {/* Metrics Grid - 2 cols for mobile */}
      <div className="grid grid-cols-2 gap-3">
        {dataPoints.map((metric, idx) => {
          let valueColor = '#f59e0b'; // orange default
          
          // Set colors based on metric label
          const labelLower = metric.label.toLowerCase();
          if (labelLower.includes('web') || labelLower === 'web') {
            valueColor = '#15B315'; // green
          } else if (labelLower.includes('point') || labelLower === 'points') {
            valueColor = '#E0E30B'; // yellow
          }
          
          return (
            <div key={idx} className="p-3 border rounded flex flex-col justify-between" style={{ border: '1px solid #f59e0b' }}>
              <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: '#f59e0b' }}>{metric.label}</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-bold" style={{ color: valueColor }}>{metric.value}</span>
                {metric.unit && <span className="text-[10px] font-mono" style={{ color: '#f59e0b' }}>{metric.unit}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BrandStats;
