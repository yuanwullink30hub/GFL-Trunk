import React, { useMemo, useEffect, useState, useRef } from 'react';
import '../../styles/text.css';
import '../../styles/poetry.css';

const MetricRow = ({ id, title, subtext, children, colorClass = "text-green-500", onValueChange, value = '', isCompleted = false }) => (
  <div className="group relative flex flex-col border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-300" style={{
    gap: 'clamp(0.25rem, 1vw, 0.75rem)',
    padding: 'clamp(0.5rem, 2vw, 1rem)'
  }}>
    {/* Modular Text Container */}
    <div className="flex justify-between items-start border-b border-white/5" style={{
      paddingBottom: 'clamp(0.25rem, 0.75vw, 0.5rem)'
    }}>
      <div className="flex flex-col">
        <span className={`font-bold ${colorClass} tracking-tighter poetry`} style={{
          fontSize: 'clamp(0.5rem, 0.75vw, 0.65rem)'
        }}>{id}</span>
        <span className="font-bold text-white uppercase tracking-wider poetry" style={{
          fontSize: 'clamp(0.6rem, 1vw, 0.8rem)'
        }}>{title}</span>
      </div>
      <div className="text-right">
        <span className="text-white/30 uppercase block leading-none" style={{
          fontSize: 'clamp(0.4rem, 0.5vw, 0.5rem)'
        }}>{subtext}</span>
        <span style={{
          fontSize: 'clamp(0.45rem, 0.6vw, 0.55rem)',
          color: isCompleted ? '#15B315' : '#15B315',
          fontWeight: 'bold',
          textTransform: 'uppercase'
        }} className="font-mono text-xs">STATUS: {isCompleted ? 'FILLED' : 'PENDING'}</span>
      </div>
    </div>

    {/* Modular Content/Visual Container with Input */}
    <div className="relative flex flex-col items-center justify-center gap-3" style={{
      minHeight: 'clamp(5rem, 12vh, 8rem)'
    }}>
      {children}
      <input 
        type="text" 
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder="Enter value..."
        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
        style={{
          fontSize: 'clamp(0.6rem, 0.8vw, 0.75rem)'
        }}
      />
    </div>

    {/* Accent Details */}
    <div style={{
      right: 'clamp(0.25rem, 1vw, 0.5rem)',
      bottom: 'clamp(0.25rem, 1vw, 0.5rem)',
      width: 'clamp(0.5rem, 1vw, 0.75rem)',
      height: 'clamp(0.5rem, 1vw, 0.75rem)',
      transition: 'background-color 0.3s ease',
      position: 'absolute',
      backgroundColor: isCompleted ? '#15B315' : 'rgba(255, 255, 255, 0.2)'
    }} />
  </div>
);

export const WaveAnalysis = ({ activeLabel = null, metricValues = {}, onMetricChange = () => {} }) => {
  const [frame, setFrame] = useState(0);
  const [solstice, setSolstice] = useState('');
  const metricsContainerRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(f => f + 1);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Scroll metrics container to top when label changes
  useEffect(() => {
    if (metricsContainerRef.current && activeLabel) {
      metricsContainerRef.current.scrollTop = 0;
    }
  }, [activeLabel]);

  // Calculate which solstice based on current date
  useEffect(() => {
    const now = new Date();
    const month = now.getMonth();
    const day = now.getDate();

    // Approximate solstice dates
    // Winter: ~Dec 21 (month 11, day 21)
    // Spring: ~Mar 21 (month 2, day 21)
    // Summer: ~Jun 21 (month 5, day 21)
    // Autumn: ~Sep 21 (month 8, day 21)

    let currentSolstice = '';
    
    if ((month === 11 && day >= 21) || (month === 0 && day < 21)) {
      currentSolstice = 'Winter Solstice';
    } else if ((month === 2 && day >= 21) || (month === 3 && day < 21)) {
      currentSolstice = 'Spring Solstice';
    } else if ((month === 5 && day >= 21) || (month === 6 && day < 21)) {
      currentSolstice = 'Summer Solstice';
    } else if ((month === 8 && day >= 21) || (month === 9 && day < 21)) {
      currentSolstice = 'Autumn Solstice';
    } else {
      currentSolstice = 'Winter Solstice';
    }
    
    setSolstice(currentSolstice);
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

  // Handle metric value changes
  const handleMetricChange = (metricId, value) => {
    onMetricChange(activeLabel, metricId, value);
  };

  return (
    <div className="relative flex flex-col h-full w-full">
      {/* Blur Overlay - visible until first label is clicked */}
      {!activeLabel && (
        <div 
          className="absolute inset-0 backdrop-blur-lg bg-black/30 z-50"
          style={{
            animation: 'fadeIn 0.5s ease-out'
          }}
        />
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between shrink-0" style={{
        marginBottom: 'clamp(0.25rem, 0.5vw, 0.5rem)'
      }}>
        <div className="border-l-2 border-purple-500 bg-purple-500/10" style={{
          padding: 'clamp(0.2rem, 0.5vw, 0.375rem) clamp(0.5rem, 1vw, 0.75rem)'
        }}>
          <span className="font-bold text-white uppercase tracking-[0.2em] poetry" style={{
            fontSize: 'clamp(0.6rem, 0.75vw, 0.7rem)'
          }}>Telemetry_Stream</span>
        </div>
        <div className="text-white/30 poetry" style={{
          fontSize: 'clamp(0.5rem, 0.6vw, 0.6rem)'
        }}>{solstice}</div>
      </div>

      {/* Metrics Container */}
      <div ref={metricsContainerRef} className="flex-1 overflow-y-auto scrollbar-custom" style={{
        gap: 'clamp(0.75rem, 2vw, 1.5rem)',
        paddingRight: 'clamp(0.5rem, 1vw, 1rem)',
        paddingBottom: 'clamp(0.75rem, 2vw, 1.5rem)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {!activeLabel ? (
          <>
            {/* Signal Flux */}
            <MetricRow id="01_FLX" title="Signal Flux" subtext="MOD_WAVE_PRIMARY" colorClass="text-green-500">
              <svg viewBox="0 0 200 40" className="w-full h-full opacity-60">
                <path
                  d={`M 0 20 ${Array.from({length: 10}).map((_, i) => `Q ${i*20 + 10} ${10 + Math.sin((frame/5+i*10)/5)*15}, ${i*20 + 20} 20`).join(' ')}`}
                  fill="none"
                  stroke="#15B315"
                  strokeWidth="1"
                  className="opacity-60"
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
                      className="absolute rounded-full"
                      style={{
                        left: `${p.x + Math.sin(frame/10 + i)*2}%`,
                        top: `${p.y + Math.cos(frame/10 + i)*2}%`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        backgroundColor: '#15B315',
                        opacity: 0.2 + Math.random() * 0.5
                      }}
                    />
                  ))}
               </div>
            </MetricRow>
          </>
        ) : activeLabel === 'radius' ? (
          <>
            {/* RADIUS Analysis */}
            <MetricRow id="01_MSR" title="Radius Measurement" subtext="PRIMARY_AXIS" colorClass="text-green-500" onValueChange={(val) => handleMetricChange('01_MSR', val)} value={metricValues.radius['01_MSR']} isCompleted={metricValues.radius['01_MSR'].trim() !== ''}>
              <svg viewBox="0 0 200 40" className="w-full h-full opacity-60">
                <circle cx="100" cy="20" r="15" fill="none" stroke="#15B315" strokeWidth="1" />
                <circle cx="100" cy="20" r={10 + Math.sin(frame/5)*3} fill="none" stroke="#15B315" strokeWidth="1" opacity="0.5" />
                <line x1="100" y1="5" x2="100" y2="35" stroke="#15B315" strokeWidth="0.5" opacity="0.5" />
              </svg>
            </MetricRow>

            {/* Deviation Analysis */}
            <MetricRow id="02_DEV" title="Deviation Analysis" subtext="ERROR_MARGIN" colorClass="text-amber-500" onValueChange={(val) => handleMetricChange('02_DEV', val)} value={metricValues.radius['02_DEV']} isCompleted={metricValues.radius['02_DEV'].trim() !== ''}>
              <svg viewBox="0 0 200 40" className="w-full h-full px-4">
                <path
                  d={`M 0 20 ${Array.from({length: 20}).map((_, i) => {
                    const x = i * 10;
                    const y = 20 + Math.sin((i + frame/2)/3)*6;
                    return `${x},${y}`;
                  }).join(' L ')}`}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  className="opacity-80"
                />
              </svg>
            </MetricRow>

            {/* Field Density */}
            <MetricRow id="03_FLD" title="Field Density" subtext="SPATIAL_DIST" colorClass="text-rose-500" onValueChange={(val) => handleMetricChange('03_FLD', val)} value={metricValues.radius['03_FLD']} isCompleted={metricValues.radius['03_FLD'].trim() !== ''}>
              <div className="flex gap-4 items-center justify-center w-full h-full">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="relative w-10 h-10">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="20" cy="20" r="18" fill="none" stroke="white" strokeOpacity="0.05" strokeWidth="2" />
                      <circle 
                        cx="20" cy="20" r="18" fill="none" 
                        stroke={["#f43f5e", "#22d3ee", "#fbbf24"][i]} 
                        strokeWidth="2" 
                        strokeDasharray="113" 
                        strokeDashoffset={113 - ([65, 78, 91][i]) * 1.13} 
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white">
                      {[65, 78, 91][i]}%
                    </span>
                  </div>
                ))}
              </div>
            </MetricRow>

            {/* Sync Status */}
            <MetricRow id="04_SYN" title="Sync Status" subtext="COHERENCE" colorClass="text-purple-500" onValueChange={(val) => handleMetricChange('04_SYN', val)} value={metricValues.radius['04_SYN']} isCompleted={metricValues.radius['04_SYN'].trim() !== ''}>
               <div className="relative w-full h-full">
                  {scatterPoints.slice(0, 15).map((p, i) => (
                    <div 
                      key={i} 
                      className="absolute rounded-full"
                      style={{
                        left: `${p.x + Math.sin(frame/8 + i)*1.5}%`,
                        top: `${p.y + Math.cos(frame/8 + i)*1.5}%`,
                        width: `${p.size + 0.5}px`,
                        height: `${p.size + 0.5}px`,
                        backgroundColor: '#15B315',
                        opacity: 0.3 + Math.sin(frame/10 + i)*0.2
                      }}
                    />
                  ))}
               </div>
            </MetricRow>
          </>
        ) : activeLabel === 'syncAlign' ? (
          <>
            {/* SYNC ALIGNMENT Analysis */}
            <MetricRow id="01_ALN" title="Sync Alignment" subtext="PHASE_LOCK" colorClass="text-emerald-400" onValueChange={(val) => handleMetricChange('01_ALN', val)} value={metricValues.syncAlign['01_ALN']} isCompleted={metricValues.syncAlign['01_ALN'].trim() !== ''}>
              <svg viewBox="0 0 200 40" className="w-full h-full opacity-70">
                <circle cx="50" cy="20" r="10" fill="none" stroke="#15B315" strokeWidth="1" />
                <circle cx="150" cy="20" r="10" fill="none" stroke="#15B315" strokeWidth="1" opacity="0.6" />
                <line x1="60" y1="20" x2="140" y2="20" stroke="#15B315" strokeWidth="1" opacity="0.5" />
                <path d={`M 50 20 Q 100 ${10 + Math.sin(frame/4)*5} 150 20`} fill="none" stroke="#15B315" strokeWidth="1.5" opacity="0.7" />
              </svg>
            </MetricRow>

            {/* Phase Offset */}
            <MetricRow id="02_PHS" title="Phase Offset" subtext="TEMPORAL_LAG" colorClass="text-amber-500" onValueChange={(val) => handleMetricChange('02_PHS', val)} value={metricValues.syncAlign['02_PHS']} isCompleted={metricValues.syncAlign['02_PHS'].trim() !== ''}>
              <svg viewBox="0 0 200 40" className="w-full h-full px-4">
                <path
                  d={`M 0 20 ${Array.from({length: 20}).map((_, i) => {
                    const x = i * 10;
                    const y = 20 + Math.sin((i + frame/3 + Math.PI/4)/2.5)*7;
                    return `${x},${y}`;
                  }).join(' L ')}`}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="1.5"
                  className="opacity-80"
                />
              </svg>
            </MetricRow>

            {/* Frequency Match */}
            <MetricRow id="03_FRQ" title="Frequency Match" subtext="HARMONIC_ALIGN" colorClass="text-blue-500" onValueChange={(val) => handleMetricChange('03_FRQ', val)} value={metricValues.syncAlign['03_FRQ']} isCompleted={metricValues.syncAlign['03_FRQ'].trim() !== ''}>
              <div className="flex gap-3 items-center justify-center w-full h-full">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="relative w-8 h-8">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="16" cy="16" r="14" fill="none" stroke="white" strokeOpacity="0.05" strokeWidth="1.5" />
                      <circle 
                        cx="16" cy="16" r="14" fill="none" 
                        stroke={["#15B315", "#15B315", "#15B315", "#15B315"][i]} 
                        strokeWidth="1.5" 
                        strokeDasharray="88" 
                        strokeDashoffset={88 - ([72, 85, 92, 88][i]) * 0.88} 
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold text-white">
                      {[72, 85, 92, 88][i]}%
                    </span>
                  </div>
                ))}
              </div>
            </MetricRow>

            {/* Coherence */}
            <MetricRow id="04_COH" title="Coherence Index" subtext="SIGNAL_UNITY" colorClass="text-emerald-500" onValueChange={(val) => handleMetricChange('04_COH', val)} value={metricValues.syncAlign['04_COH']} isCompleted={metricValues.syncAlign['04_COH'].trim() !== ''}>
               <div className="relative w-full h-full">
                  {scatterPoints.slice(0, 20).map((p, i) => (
                    <div 
                      key={i} 
                      className="absolute rounded-full"
                      style={{
                        left: `${p.x + Math.sin(frame/6 + i)*2}%`,
                        top: `${p.y + Math.cos(frame/6 + i)*2}%`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        backgroundColor: '#15B315',
                        opacity: 0.25 + Math.sin(frame/8 + i)*0.25
                      }}
                    />
                  ))}
               </div>
            </MetricRow>
          </>
        ) : activeLabel === 'dataLink' ? (
          <>
            {/* DATA LINK Analysis */}
            <MetricRow id="01_CHN" title="Data Channel" subtext="BANDWIDTH_UTIL" colorClass="text-rose-400" onValueChange={(val) => handleMetricChange('01_CHN', val)} value={metricValues.dataLink['01_CHN']} isCompleted={metricValues.dataLink['01_CHN'].trim() !== ''}>
              <svg viewBox="0 0 200 40" className="w-full h-full opacity-70">
                {/* Channel representation */}
                {[0, 1, 2].map((i) => (
                  <rect 
                    key={i} 
                    x={20 + i*50} y={10 + Math.sin(frame/4 + i)*3} width="30" height="20" 
                    fill="none" stroke="#f43f5e" strokeWidth="1" opacity="0.7"
                  />
                ))}
                <path d={`M 0 20 L ${Array.from({length: 10}).map((_, i) => `${i*20},${20 + Math.sin((i+frame/2)*0.5)*5}`).join(' L ')}`} 
                  fill="none" stroke="#f43f5e" strokeWidth="1.5" opacity="0.5"/>
              </svg>
            </MetricRow>

            {/* Bandwidth */}
            <MetricRow id="02_BND" title="Bandwidth Alloc" subtext="THROUGHPUT" colorClass="text-rose-500" onValueChange={(val) => handleMetricChange('02_BND', val)} value={metricValues.dataLink['02_BND']} isCompleted={metricValues.dataLink['02_BND'].trim() !== ''}>
              <svg viewBox="0 0 200 40" className="w-full h-full px-4">
                <path
                  d={`M 0 25 ${Array.from({length: 20}).map((_, i) => {
                    const x = i * 10;
                    const y = 25 - Math.abs(Math.sin((i + frame/2.5)*0.6))*12;
                    return `${x},${y}`;
                  }).join(' L ')}`}
                  fill="none"
                  stroke="#f87171"
                  strokeWidth="2"
                  className="opacity-80"
                />
              </svg>
            </MetricRow>

            {/* Signal Strength */}
            <MetricRow id="03_SIG" title="Signal Strength" subtext="POWER_LEVEL" colorClass="text-yellow-500" onValueChange={(val) => handleMetricChange('03_SIG', val)} value={metricValues.dataLink['03_SIG']} isCompleted={metricValues.dataLink['03_SIG'].trim() !== ''}>
              <div className="flex gap-2 items-end justify-center w-full h-full px-4">
                {Array.from({length: 12}).map((_, i) => (
                  <div 
                    key={i} 
                    className="bg-yellow-400 rounded-t"
                    style={{
                      width: 'clamp(2px, 1vw, 4px)',
                      height: `${30 + (Math.sin((i + frame/3)*0.5) + 1) * 20}%`,
                      opacity: 0.4 + Math.sin(frame/5 + i)*0.3
                    }}
                  />
                ))}
              </div>
            </MetricRow>

            {/* Packet Loss */}
            <MetricRow id="04_PKT" title="Packet Status" subtext="ERROR_RATE" colorClass="text-orange-500" onValueChange={(val) => handleMetricChange('04_PKT', val)} value={metricValues.dataLink['04_PKT']} isCompleted={metricValues.dataLink['04_PKT'].trim() !== ''}>
               <div className="relative w-full h-full">
                  {scatterPoints.map((p, i) => (
                    <div 
                      key={i} 
                      className={`absolute rounded-full ${i % 3 === 0 ? 'bg-red-400' : 'bg-orange-400'}`}
                      style={{
                        left: `${p.x + Math.sin(frame/7 + i)*2.5}%`,
                        top: `${p.y + Math.cos(frame/7 + i)*2.5}%`,
                        width: `${p.size + (i % 3 === 0 ? 1 : 0)}px`,
                        height: `${p.size + (i % 3 === 0 ? 1 : 0)}px`,
                        opacity: 0.15 + Math.random() * 0.4
                      }}
                    />
                  ))}
               </div>
            </MetricRow>
          </>
        ) : null}
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
