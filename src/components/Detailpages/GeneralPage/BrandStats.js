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
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
      {/* Grid */}
      {gridLevels.map((path, i) => (
        <path
          key={i}
          d={path}
          fill="none"
          stroke="rgba(0, 243, 255, 0.15)"
          strokeWidth="1"
        />
      ))}
      
      {/* Axis lines */}
      {axisLines.map((line, i) => (
        <line
          key={i}
          x1={center}
          y1={center}
          x2={line.x2}
          y2={line.y2}
          stroke="rgba(0, 243, 255, 0.1)"
          strokeWidth="1"
        />
      ))}
      
      {/* Data polygon */}
      <path
        d={pathData}
        fill="rgba(188, 19, 254, 0.3)"
        stroke="#bc13fe"
        strokeWidth="2"
      />
      
      {/* Data points */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="4"
          fill="#bc13fe"
          stroke="white"
          strokeWidth="1"
        />
      ))}
      
      {/* Labels */}
      {labelPositions.map((pos, i) => (
        <text
          key={i}
          x={pos.x}
          y={pos.y}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-cyan-400 text-[9px] font-mono"
        >
          {pos.label}
        </text>
      ))}
    </svg>
  );
};

// Chart data
const chartData = [
  { subject: 'Innov', A: 120, fullMark: 150 },
  { subject: 'Eco', A: 98, fullMark: 150 },
  { subject: 'Design', A: 130, fullMark: 150 },
  { subject: 'Util', A: 100, fullMark: 150 },
  { subject: 'Value', A: 85, fullMark: 150 },
  { subject: 'Tech', A: 110, fullMark: 150 },
];

export const BrandStats = ({ metrics }) => {
  // Handle both array format and object format with dataPoints
  const dataPoints = Array.isArray(metrics) ? metrics : metrics?.dataPoints || [];
  
  return (
    <div className="flex flex-col gap-4">
      {/* Radar Chart */}
      <HoloCard className="min-h-[250px]">
        <div className="h-[200px] w-full flex items-center justify-center">
          <SimpleRadarChart data={chartData} />
        </div>
      </HoloCard>

      {/* Metrics Grid - 2 cols for mobile */}
      <div className="grid grid-cols-2 gap-3">
        {dataPoints.map((metric, idx) => (
          <div key={idx} className="bg-slate-900/30 p-3 border border-slate-800 rounded flex flex-col justify-between hover:border-cyan-400/30 transition-colors">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{metric.label}</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-bold text-white">{metric.value}</span>
              {metric.unit && <span className="text-[10px] font-mono text-slate-600">{metric.unit}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BrandStats;
