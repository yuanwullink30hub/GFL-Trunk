import React, { useMemo, useEffect, useState, useRef } from 'react';
import '../../styles/text.css';
import '../../styles/poetry.css';

const MetricRow = ({ id, title, subtext, children, colorClass = "text-green-500", onValueChange, value = '', isCompleted = false, placeholder = "Enter value..." }) => (
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
        placeholder={placeholder}
        autoComplete="off"
        spellCheck="false"
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

export const WaveAnalysis = ({ activeLabel = null, metricValues = {}, onMetricChange = () => {}, onSendLabel = () => {}, hasReadInstructions = false, onKeyboardStateChange = () => {} }) => {
  const [frame, setFrame] = useState(0);
  const [solstice, setSolstice] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [signalFluxValue, setSignalFluxValue] = useState('');
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const metricsContainerRef = useRef(null);
  const initialViewportHeightRef = useRef(window.innerHeight);

  // Check if running on localhost (development)
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

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

  // Keyboard detection - adjust content when keyboard appears or input is focused
  useEffect(() => {
    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const heightDifference = initialViewportHeightRef.current - currentHeight;
      
      // If height decreased significantly, keyboard likely appeared
      if (heightDifference > 100) {
        setKeyboardOffset(heightDifference);
      } else {
        setKeyboardOffset(0);
      }
    };

    const handleFocus = (e) => {
      // On keyboard focus, set a large fixed offset (300px) for significant push-up
      setKeyboardOffset(100);      onKeyboardStateChange(true);    };

    const handleBlur = () => {
      setKeyboardOffset(0);
      onKeyboardStateChange(false);
    };

    // Attach listeners to all inputs in metrics container
    const attachListeners = () => {
      const inputs = document.querySelectorAll('input[type="text"]');
      inputs.forEach(input => {
        input.addEventListener('focus', handleFocus);
        input.addEventListener('blur', handleBlur);
      });
    };

    // Initial attachment
    attachListeners();
    
    // Re-attach when activeLabel changes (new inputs may be added)
    const observer = new MutationObserver(() => {
      attachListeners();
    });

    if (metricsContainerRef.current) {
      observer.observe(metricsContainerRef.current, { 
        childList: true, 
        subtree: true 
      });
    }

    window.addEventListener('resize', handleResize);
    
    return () => {
      const inputs = document.querySelectorAll('input[type="text"]');
      inputs.forEach(input => {
        input.removeEventListener('focus', handleFocus);
        input.removeEventListener('blur', handleBlur);
      });
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [onKeyboardStateChange]);

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

  // Check if all metrics for current label are filled
  const isCurrentLabelComplete = activeLabel && metricValues[activeLabel] && Object.values(metricValues[activeLabel]).every(v => v.trim() !== '');

  const handleSendLabel = () => {
    if (isCurrentLabelComplete && !isSending) {
      setIsSending(true);
      
      // Close keyboard by blurring all inputs
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        activeElement.blur();
      }
      
      // Skip fullscreen on localhost (development)
      if (isLocalhost) {
        setTimeout(() => {
          onSendLabel(activeLabel);
          setIsSending(false);
        }, 1500);
        return;
      }
      
      // Request fullscreen if not already fullscreen
      const docElement = document.documentElement;
      if (!document.fullscreenElement) {
        if (docElement.requestFullscreen) {
          docElement.requestFullscreen().catch(() => {
            // Fullscreen request denied, proceed anyway with just keyboard close
            setTimeout(() => {
              onSendLabel(activeLabel);
              setIsSending(false);
            }, 1500);
          });
          // Wait for fullscreen to activate then trigger send (0.2s after fullscreen)
          setTimeout(() => {
            onSendLabel(activeLabel);
            setIsSending(false);
          }, 1500);
        } else {
          // Fullscreen not supported, just wait for keyboard to close
          setTimeout(() => {
            onSendLabel(activeLabel);
            setIsSending(false);
          }, 1500);
        }
      } else {
        // Already fullscreen
        setTimeout(() => {
          onSendLabel(activeLabel);
          setIsSending(false);
        }, 1500);
      }
    }
  };

  return (
    <div className="relative flex flex-col h-full w-full" style={{
      transform: keyboardOffset > 0 ? `translateY(-${keyboardOffset * 3}px)` : 'translateY(0)',
      transition: 'transform 0.3s ease-out',
      zIndex: keyboardOffset > 0 ? 60 : 10,
      position: keyboardOffset > 0 ? 'relative' : 'relative'
    }}>
      {/* Blur Overlay - original modal blur */}
      {!hasReadInstructions && (
        <div 
          className="absolute inset-0 backdrop-blur-lg z-40"
          style={{
            animation: 'fadeIn 0.5s ease-out',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(20px)',
            pointerEvents: 'auto'
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
        flexDirection: 'column',
        scrollbarGutter: 'stable',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(255, 255, 255, 1) transparent'
      }}>
        {!activeLabel ? (
          <>
            {/* Signal Flux */}
            <MetricRow id="01_FLX" title="Signal Flux" subtext="MOD_WAVE_PRIMARY" colorClass="text-green-500" onValueChange={(val) => setSignalFluxValue(val)} value={signalFluxValue} placeholder="jouw@emailadres">
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

      {/* Send Button - visible only when a label is active */}
      {!activeLabel ? (
        // Show two buttons on the 4th form (after all labels are completed)
        <div style={{
          padding: 'clamp(0.75rem, 2vw, 1.5rem)',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          marginTop: 'auto'
        }}>
          <div style={{ display: 'flex', gap: 'clamp(0.5rem, 2vw, 1rem)' }}>
            <button
              onClick={() => {/* Download handler */}}
              className="flex-1 font-bold uppercase tracking-widest transition-all duration-300 poetry"
              style={{
                padding: 'clamp(0.5rem, 1vw, 0.75rem)',
                fontSize: 'clamp(0.6rem, 0.9vw, 0.8rem)',
                backgroundColor: '#15B315',
                color: '#000',
                border: '1px solid #15B315',
                cursor: 'pointer',
                opacity: 1,
                boxShadow: '0 0 15px rgba(21, 179, 21, 0.3)',
                transform: 'scale(1)',
                textShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
                letterSpacing: '0.2em'
              }}
            >
              DOWNLOAD
            </button>
            <button
              onClick={() => {/* AANMELDEN handler */}}
              className="flex-1 font-bold uppercase tracking-widest transition-all duration-300 poetry"
              style={{
                padding: 'clamp(0.5rem, 1vw, 0.75rem)',
                fontSize: 'clamp(0.6rem, 0.9vw, 0.8rem)',
                backgroundColor: '#15B315',
                color: '#000',
                border: '1px solid #15B315',
                cursor: 'pointer',
                opacity: 1,
                boxShadow: '0 0 15px rgba(21, 179, 21, 0.3)',
                transform: 'scale(1)',
                textShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
                letterSpacing: '0.2em'
              }}
            >
              AANMELDEN
            </button>
          </div>
        </div>
      ) : activeLabel === 'radius' ? (
        <div style={{
          padding: 'clamp(0.75rem, 2vw, 1.5rem)',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          marginTop: 'auto'
        }}>
          <button
            onClick={handleSendLabel}
            disabled={!isCurrentLabelComplete || isSending}
            className="w-full font-bold uppercase tracking-widest transition-all duration-300 poetry"
            style={{
              padding: 'clamp(0.5rem, 1vw, 0.75rem)',
              fontSize: 'clamp(0.6rem, 0.9vw, 0.8rem)',
              backgroundColor: (isCurrentLabelComplete && !isSending) ? '#15B315' : 'rgba(21, 179, 21, 0.2)',
              color: (isCurrentLabelComplete && !isSending) ? '#000' : 'rgba(255, 255, 255, 0.4)',
              border: `1px solid ${(isCurrentLabelComplete && !isSending) ? '#15B315' : 'rgba(255, 255, 255, 0.1)'}`,
              cursor: (isCurrentLabelComplete && !isSending) ? 'pointer' : 'not-allowed',
              opacity: (isCurrentLabelComplete && !isSending) ? 1 : 0.5,
              boxShadow: (isCurrentLabelComplete && !isSending) ? '0 0 15px rgba(21, 179, 21, 0.3)' : 'none',
              transform: (isCurrentLabelComplete && !isSending) ? 'scale(1)' : 'scale(0.98)',
              textShadow: (isCurrentLabelComplete && !isSending) ? '0 0 10px rgba(0, 0, 0, 0.5)' : 'none',
              letterSpacing: isSending ? '0.15em' : '0.2em'
            }}
          >
            {isSending ? 'PROCESSING...' : 'TOELATEN'}
          </button>
        </div>
      ) : activeLabel === 'syncAlign' ? (
        <div style={{
          padding: 'clamp(0.75rem, 2vw, 1.5rem)',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          marginTop: 'auto'
        }}>
          <button
            onClick={handleSendLabel}
            disabled={!isCurrentLabelComplete || isSending}
            className="w-full font-bold uppercase tracking-widest transition-all duration-300 poetry"
            style={{
              padding: 'clamp(0.5rem, 1vw, 0.75rem)',
              fontSize: 'clamp(0.6rem, 0.9vw, 0.8rem)',
              backgroundColor: (isCurrentLabelComplete && !isSending) ? '#15B315' : 'rgba(21, 179, 21, 0.2)',
              color: (isCurrentLabelComplete && !isSending) ? '#000' : 'rgba(255, 255, 255, 0.4)',
              border: `1px solid ${(isCurrentLabelComplete && !isSending) ? '#15B315' : 'rgba(255, 255, 255, 0.1)'}`,
              cursor: (isCurrentLabelComplete && !isSending) ? 'pointer' : 'not-allowed',
              opacity: (isCurrentLabelComplete && !isSending) ? 1 : 0.5,
              boxShadow: (isCurrentLabelComplete && !isSending) ? '0 0 15px rgba(21, 179, 21, 0.3)' : 'none',
              transform: (isCurrentLabelComplete && !isSending) ? 'scale(1)' : 'scale(0.98)',
              textShadow: (isCurrentLabelComplete && !isSending) ? '0 0 10px rgba(0, 0, 0, 0.5)' : 'none',
              letterSpacing: isSending ? '0.15em' : '0.2em'
            }}
          >
            {isSending ? 'PROCESSING...' : 'LOSLATEN'}
          </button>
        </div>
      ) : activeLabel === 'dataLink' ? (
        <div style={{
          padding: 'clamp(0.75rem, 2vw, 1.5rem)',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          marginTop: 'auto'
        }}>
          <button
            onClick={handleSendLabel}
            disabled={!isCurrentLabelComplete || isSending}
            className="w-full font-bold uppercase tracking-widest transition-all duration-300 poetry"
            style={{
              padding: 'clamp(0.5rem, 1vw, 0.75rem)',
              fontSize: 'clamp(0.6rem, 0.9vw, 0.8rem)',
              backgroundColor: (isCurrentLabelComplete && !isSending) ? '#15B315' : 'rgba(21, 179, 21, 0.2)',
              color: (isCurrentLabelComplete && !isSending) ? '#000' : 'rgba(255, 255, 255, 0.4)',
              border: `1px solid ${(isCurrentLabelComplete && !isSending) ? '#15B315' : 'rgba(255, 255, 255, 0.1)'}`,
              cursor: (isCurrentLabelComplete && !isSending) ? 'pointer' : 'not-allowed',
              opacity: (isCurrentLabelComplete && !isSending) ? 1 : 0.5,
              boxShadow: (isCurrentLabelComplete && !isSending) ? '0 0 15px rgba(21, 179, 21, 0.3)' : 'none',
              transform: (isCurrentLabelComplete && !isSending) ? 'scale(1)' : 'scale(0.98)',
              textShadow: (isCurrentLabelComplete && !isSending) ? '0 0 10px rgba(0, 0, 0, 0.5)' : 'none',
              letterSpacing: isSending ? '0.15em' : '0.2em'
            }}
          >
            {isSending ? 'PROCESSING...' : 'AANBID1'}
          </button>
        </div>
      ) : null}

      <style>{`
        .scrollbar-custom { 
          scrollbar-gutter: stable;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 1) transparent;
        }
        .scrollbar-custom::-webkit-scrollbar { 
          width: 8px; 
          background: transparent;
        }
        .scrollbar-custom::-webkit-scrollbar-track { 
          background: transparent; 
        }
        .scrollbar-custom::-webkit-scrollbar-thumb { 
          background: rgba(255, 255, 255, 1) !important;
          border-radius: 4px;
          min-height: 40px;
        }
        .scrollbar-custom::-webkit-scrollbar-thumb:hover { 
          background: rgba(255, 255, 255, 1) !important;
        }
      `}</style>
    </div>
  );
};

export default WaveAnalysis;
