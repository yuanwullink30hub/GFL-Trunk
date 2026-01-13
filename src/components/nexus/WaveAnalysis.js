import React, { useMemo, useEffect, useState } from 'react';
import '../../styles/text.css';

const MetricRow = ({ id, title, subtext, children, colorClass = "text-cyan-400" }) => (
  <div className="group relative flex flex-col border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-300" style={{
    gap: 'clamp(0.25rem, 1vw, 0.75rem)',
    padding: 'clamp(0.5rem, 2vw, 1rem)'
  }}>
    {/* Modular Text Container */}
    <div className="flex justify-between items-start border-b border-white/5" style={{
      paddingBottom: 'clamp(0.25rem, 0.75vw, 0.5rem)'
    }}>
      <div className="flex flex-col">
        <span className={`font-bold ${colorClass} tracking-tighter`} style={{
          fontSize: 'clamp(0.5rem, 0.75vw, 0.65rem)'
        }}>{id}</span>
        <span className="font-bold text-white uppercase tracking-wider" style={{
          fontSize: 'clamp(0.6rem, 1vw, 0.8rem)'
        }}>{title}</span>
      </div>
      <div className="text-right">
        <span className="text-white/30 uppercase block leading-none" style={{
          fontSize: 'clamp(0.4rem, 0.5vw, 0.5rem)'
        }}>{subtext}</span>
        <span className="text-cyan-500 font-mono" style={{
          fontSize: 'clamp(0.45rem, 0.6vw, 0.55rem)'
        }}>STATUS: OK</span>
      </div>
    </div>

    {/* Modular Content/Visual Container */}
    <div className="relative flex items-center justify-center bg-black/20 overflow-hidden" style={{
      height: 'clamp(3rem, 8vh, 6rem)'
    }}>
      {children}
    </div>

    {/* Accent Details */}
    <div className="absolute bg-white/20" style={{
      right: 'clamp(0.25rem, 1vw, 0.5rem)',
      bottom: 'clamp(0.25rem, 1vw, 0.5rem)',
      width: 'clamp(0.5rem, 1vw, 0.75rem)',
      height: 'clamp(0.5rem, 1vw, 0.75rem)'
    }} />
  </div>
);

export const WaveAnalysis = () => {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(f => f + 1);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const waveformPath = useMemo(() => {
    const points = [];
    for (let i = 0; i <= 200; i += 2) {
      const y = 20 + Math.sin((i + frame) / 8) * 8 + Math.sin((i + frame) / 3) * 4;
      points.push(`${i},${y}`);
    }
    return `M ${points.join(' L ')}`;
  }, [frame]);

  const scatterPoints = useMemo(() => 
    Array.from({ length: 25 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2,
    })), []);

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0" style={{
        marginBottom: 'clamp(0.25rem, 0.5vw, 0.5rem)'
      }}>
        <div className="border-l-2 border-purple-500 bg-purple-500/10" style={{
          padding: 'clamp(0.2rem, 0.5vw, 0.375rem) clamp(0.5rem, 1vw, 0.75rem)'
        }}>
          <span className="font-bold text-white uppercase tracking-[0.2em]" style={{
            fontSize: 'clamp(0.6rem, 0.75vw, 0.7rem)'
          }}>Telemetry_Stream</span>
        </div>
        <div className="text-white/30" style={{
          fontSize: 'clamp(0.5rem, 0.6vw, 0.6rem)'
        }}>ID: X7-009</div>
      </div>

      {/* Metrics Container */}
      <div className="flex-1 overflow-y-auto scrollbar-custom" style={{
        gap: 'clamp(0.75rem, 2vw, 1.5rem)',
        paddingRight: 'clamp(0.5rem, 1vw, 1rem)',
        paddingBottom: 'clamp(0.75rem, 2vw, 1.5rem)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Signal Flux */}
        <MetricRow id="01_FLX" title="Signal Flux" subtext="MOD_WAVE_PRIMARY" colorClass="text-cyan-400">
          <svg viewBox="0 0 200 40" className="w-full h-full opacity-60">
            <path
              d={`M 0 20 ${Array.from({length: 10}).map((_, i) => `Q ${i*20 + 10} ${10 + Math.sin((frame/5+i*10)/5)*15}, ${i*20 + 20} 20`).join(' ')}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-cyan-400"
            />
          </svg>
        </MetricRow>

        {/* Spectral Peak */}
        <MetricRow id="02_FRQ" title="Spectral Peak" subtext="BANDWIDTH_ALLOC" colorClass="text-amber-500">
          <svg viewBox="0 0 200 40" className="w-full h-full px-4">
            <path
              d={waveformPath}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.5"
              className="opacity-80"
            />
          </svg>
        </MetricRow>

        {/* Vector Load */}
        <MetricRow id="03_VEC" title="Vector Load" subtext="PARALLEL_CALC" colorClass="text-rose-500">
          <div className="flex gap-8 items-center justify-center w-full h-full">
            {[0, 1].map((i) => (
              <div key={i} className="relative w-10 h-10">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="20" cy="20" r="18" fill="none" stroke="white" strokeOpacity="0.05" strokeWidth="2" />
                  <circle 
                    cx="20" cy="20" r="18" fill="none" 
                    stroke={i === 0 ? "#f43f5e" : "#22d3ee"} 
                    strokeWidth="2" 
                    strokeDasharray="113" 
                    strokeDashoffset={113 - (i === 0 ? 82 : 45) * 1.13} 
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white">
                  {i === 0 ? '82%' : '45%'}
                </span>
              </div>
            ))}
          </div>
        </MetricRow>

        {/* Entropy Index */}
        <MetricRow id="04_ENT" title="Entropy Idx" subtext="CHAOS_MAP" colorClass="text-purple-500">
           <div className="relative w-full h-full">
              {scatterPoints.map((p, i) => (
                <div 
                  key={i} 
                  className="absolute bg-purple-500 rounded-full"
                  style={{
                    left: `${p.x + Math.sin(frame/10 + i)*2}%`,
                    top: `${p.y + Math.cos(frame/10 + i)*2}%`,
                    width: `${p.size}px`,
                    height: `${p.size}px`,
                    opacity: 0.2 + Math.random() * 0.5
                  }}
                />
              ))}
           </div>
        </MetricRow>
      </div>

      <style>{`
        .scrollbar-custom::-webkit-scrollbar { width: 3px; }
        .scrollbar-custom::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); }
        .scrollbar-custom::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); }
        .scrollbar-custom::-webkit-scrollbar-thumb:hover { background: rgba(167, 59, 198, 0.3); }
      `}</style>
    </div>
  );
};

export default WaveAnalysis;
