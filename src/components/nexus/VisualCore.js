import React, { useState, useEffect } from 'react';
import '../../styles/poetry.css';

const SchematicLabel = ({ top, left, right, bottom, label, value, align = 'left', isCompleted = false, isLocked = false, onSquareClick = () => {} }) => (
  <div 
    className="absolute flex flex-col pointer-events-none group z-50 transition-all duration-500 overflow-visible"
    style={{ 
      top, left, right, bottom, 
      textAlign: align,
      transform: 'translateY(-50%)',
      width: 'auto'
    }}
  >
    <div className={`flex items-center ${align === 'right' ? 'flex-row-reverse' : ''}`} style={{
      gap: 'clamp(0.625rem, 1.25vw, 1.25rem)'
    }}>
      <div 
        className="transform rotate-45 border transition-all duration-300 cursor-pointer"
        onClick={isLocked ? undefined : onSquareClick}
        style={{
          width: 'clamp(1.25rem, 2.5vw, 1.875rem)',
          height: 'clamp(1.25rem, 2.5vw, 1.875rem)',
          backgroundColor: isCompleted ? '#15B315cc' : 'rgba(168, 85, 247, 0.8)',
          borderColor: isCompleted ? '#15B315' : 'rgba(255, 255, 255, 0.2)',
          opacity: isLocked ? 0.4 : 1,
          pointerEvents: isLocked ? 'none' : 'auto'
        }} 
      />
      <div className="h-[1px] bg-gradient-to-r from-transparent to-purple-500/60" style={{
        width: 'clamp(3rem, 10vw, 8rem)'
      }} />
    </div>
    <div 
      className="border-l border-purple-500/40 transition-all duration-300 group-hover:bg-purple-900/40 shadow-2xl border-r border-b border-white/5 cursor-pointer"
      onClick={isLocked ? undefined : onSquareClick}
      style={{
        marginTop: 'clamp(0.625rem, 1.25vw, 1.25rem)',
        padding: 'clamp(0.625rem, 1.25vw, 1.25rem)',
        minWidth: 'clamp(7.5rem, 20vw, 17.5rem)',
        opacity: isLocked ? 0.4 : 1,
        pointerEvents: isLocked ? 'none' : 'auto'
      }}
    >
      <div className="text-purple-400/60 font-bold uppercase tracking-[0.2em] text-white poetry leading-none tracking-tight" style={{
        fontSize: 'clamp(0.6rem, 1vw, 0.8rem)',
        marginBottom: 'clamp(0.25rem, 0.5vw, 0.5rem)'
      }}>{label}</div>
      <div className="text-white poetry leading-none tracking-tight" style={{
        fontSize: 'clamp(0.8rem, 1.5vw, 1.3rem)'
      }}>{value}</div>
    </div>
  </div>
);

const ApexMetric = ({ syncPercentage = 0, isGlowing = false, shouldFlash = false }) => (
  <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-50" style={{
    top: 'clamp(1%, 2vh, 8%)',
    transform: 'translateX(-50%) scale(clamp(0.65, 1vw, 1))',
    filter: shouldFlash ? 'drop-shadow(0 0 50px #E0E30B)' : (isGlowing ? 'drop-shadow(0 0 20px #E0E30B)' : 'none'),
    transition: 'filter 0.5s ease-in-out',
    animation: shouldFlash ? 'apexFlash 3s ease-in-out' : 'none'
  }}>
    <div className="text-amber-500 font-bold tracking-[0.3em] uppercase poetry" style={{
      fontSize: 'clamp(0.6rem, 1.2vw, 1rem)',
      marginBottom: 'clamp(0.25rem, 0.5vw, 0.5rem)',
      color: isGlowing ? '#E0E30B' : '#f59e0b',
      transition: 'color 0.5s ease-in-out'
    }}>Apex_Sync</div>
    <div className="flex items-center" style={{
      gap: 'clamp(0.5rem, 1vw, 1rem)'
    }}>
      <div className="h-[1px] bg-gradient-to-r from-transparent to-amber-500/50" style={{
        width: 'clamp(1rem, 3vw, 3rem)'
      }} />
      <div className="text-white font-bold poetry tracking-tighter" style={{
        fontSize: 'clamp(1.2rem, 2.8vw, 2rem)',
        color: isGlowing ? '#E0E30B' : 'white',
        transition: 'color 0.5s ease-in-out'
      }}>{syncPercentage}%</div>
      <div className="h-[1px] bg-gradient-to-l from-transparent to-amber-500/50" style={{
        width: 'clamp(1rem, 3vw, 3rem)'
      }} />
    </div>
    <div className="w-px bg-gradient-to-b from-amber-500/80 to-transparent" style={{
      height: 'clamp(2rem, 4vh, 4rem)',
      marginTop: 'clamp(0.5rem, 1vh, 1rem)'
    }} />
  </div>
);

const PyramidSegment = ({ baseWidth, topWidth, height, yPos, color, borderColor, isTip, opacity = 0.8 }) => {
  const halfBase = baseWidth / 2;
  const halfTop = topWidth / 2;
  const sideLength = Math.sqrt(height ** 2 + (halfBase - halfTop) ** 2);
  const angle = Math.atan2(halfBase - halfTop, height) * (180 / Math.PI);

  return (
    <div className="absolute left-1/2 top-1/2 preserve-3d" style={{ transform: `translate(-50%, -50%) translateY(${yPos}px)` }}>
      {[0, 90, 180, 270].map((rot) => (
        <div
          key={rot}
          className="absolute origin-top preserve-3d"
          style={{
            width: baseWidth,
            height: sideLength,
            backgroundColor: color,
            border: `1px solid ${borderColor}`,
            opacity: opacity,
            clipPath: isTip 
              ? `polygon(50% 0%, 100% 100%, 0% 100%)` 
              : `polygon(${((halfBase - halfTop) / baseWidth) * 100}% 0%, ${100 - ((halfBase - halfTop) / baseWidth) * 100}% 0%, 100% 100%, 0% 100%)`,
            transform: `translateX(-50%) rotateY(${rot}deg) translateZ(${halfTop}px) rotateX(${angle}deg)`,
            backfaceVisibility: 'visible',
            filter: isTip ? `drop-shadow(0 0 10px ${borderColor})` : 'none',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-10 pointer-events-none" />
        </div>
      ))}
      
      {!isTip && (
        <div 
          className="absolute left-1/2 top-1/2"
          style={{
            width: topWidth,
            height: topWidth,
            backgroundColor: color,
            border: `1px solid ${borderColor}`,
            transform: `translate(-50%, -50%) rotateX(90deg)`,
            opacity: opacity
          }}
        />
      )}
    </div>
  );
};

export const VisualCore = ({ syncPercentage = 0, activeLabel = null, onLabelClick = () => {}, metricValues = {}, allLabelsComplete = false }) => {
  const [completedLabels, setCompletedLabels] = useState({
    dataLink: false,
    syncAlign: false,
    radius: false
  });
  const [isClosing, setIsClosing] = useState(false);
  const [shouldFlash, setShouldFlash] = useState(false);

  // Trigger flash when all labels are completed
  useEffect(() => {
    if (allLabelsComplete) {
      setShouldFlash(true);
      const timer = setTimeout(() => {
        setShouldFlash(false);
      }, 3000); // Total duration: 3 flashes (0.6s each) + 2 delays (0.4s each) = 2.6s, padded to 3s
      return () => clearTimeout(timer);
    }
  }, [allLabelsComplete]);

  // Helper function to check if all metrics for a label are filled
  const isLabelComplete = (labelName) => {
    if (!metricValues[labelName]) return false;
    return Object.values(metricValues[labelName]).every(v => v.trim() !== '');
  };

  const pyramidColor = 'rgba(167, 59, 198, 0.4)';
  const borderColor = '#ef8616';
  const middleColor = 'rgb(255, 0, 0)';

  const handleSquareClick = (labelKey) => {
    // RADIUS can always be clicked
    if (labelKey === 'radius') {
      setCompletedLabels(prev => ({
        ...prev,
        radius: !prev.radius
      }));
      onLabelClick('radius');
    } 
    // SYNC_ALIGN can be clicked after RADIUS is completed
    else if (labelKey === 'syncAlign' && completedLabels.radius) {
      setCompletedLabels(prev => ({
        ...prev,
        syncAlign: !prev.syncAlign
      }));
      onLabelClick('syncAlign');
    }
    // DATA_LINK can be clicked after SYNC_ALIGN is completed
    else if (labelKey === 'dataLink' && completedLabels.syncAlign) {
      setCompletedLabels(prev => ({
        ...prev,
        dataLink: !prev.dataLink
      }));
      onLabelClick('dataLink');
    }
  };

  const handleCloseModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      onLabelClick(null);
      setIsClosing(false);
    }, 300);
  };

  const telemetricData = {
    radius: {
      title: 'RADIUS ANALYSIS',
      metrics: [
        { label: 'MEASUREMENT', value: '182.0_PX', status: 'CALIBRATED' },
        { label: 'DEVIATION', value: '±0.02_PX', status: 'OPTIMAL' },
        { label: 'FIELD_DENSITY', value: '94.3%', status: 'STABLE' },
        { label: 'SYNC_STATUS', value: 'LOCKED', status: 'ACTIVE' }
      ]
    },
    syncAlign: {
      title: 'SYNC ALIGNMENT ANALYSIS',
      metrics: [
        { label: 'ALIGNMENT', value: '0.0002', status: 'PRECISE' },
        { label: 'PHASE_OFFSET', value: '0.15°', status: 'MINIMAL' },
        { label: 'FREQUENCY_MATCH', value: '99.98%', status: 'PERFECT' },
        { label: 'COHERENCE', value: '1.00', status: 'MAXIMUM' }
      ]
    },
    dataLink: {
      title: 'DATA LINK ANALYSIS',
      metrics: [
        { label: 'CHANNEL', value: 'L_04', status: 'ACTIVE' },
        { label: 'BANDWIDTH', value: '2.4_GHz', status: 'OPTIMAL' },
        { label: 'SIGNAL_STRENGTH', value: '-42_dBm', status: 'EXCELLENT' },
        { label: 'PACKET_LOSS', value: '0%', status: 'ZERO' }
      ]
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-start bg-transparent overflow-visible" style={{
      paddingTop: 'clamp(0.5rem, 1vh, 1rem)'
    }}>
      <style>{`
        .perspective-container { 
            perspective: clamp(500px, 100vw, 2500px); 
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            transform: scale(0.92) translateY(-2.5rem);
        }
        .preserve-3d { transform-style: preserve-3d; }
        @keyframes stableRotate {
          from { transform: translateY(-5px) rotateX(-20deg) rotateY(0deg); }
          to { transform: translateY(-5px) rotateX(-20deg) rotateY(360deg); }
        }
        .animate-pyramid-stable {
          animation: stableRotate 15s linear infinite;
        }
        .glow-amber { text-shadow: 0 0 10px rgba(251, 191, 36, 0.7); }
        
        .mobile-scale {
          transform: scale(clamp(0.5, 1vw, 1));
        }

        @keyframes apexFlash {
          /* Flash 1: 0-20% (0-0.6s) */
          0% {
            filter: drop-shadow(0 0 50px #E0E30B);
          }
          10% {
            filter: drop-shadow(0 0 80px #FFFF00);
          }
          20% {
            filter: drop-shadow(0 0 20px #E0E30B);
          }
          
          /* Delay 1: 20%-33.33% (0.6-1.0s) */
          33.33% {
            filter: drop-shadow(0 0 20px #E0E30B);
          }
          
          /* Flash 2: 33.33%-53.33% (1.0-1.6s) */
          33.33% {
            filter: drop-shadow(0 0 50px #E0E30B);
          }
          43.33% {
            filter: drop-shadow(0 0 80px #FFFF00);
          }
          53.33% {
            filter: drop-shadow(0 0 20px #E0E30B);
          }
          
          /* Delay 2: 53.33%-66.67% (1.6-2.0s) */
          66.67% {
            filter: drop-shadow(0 0 20px #E0E30B);
          }
          
          /* Flash 3: 66.67%-86.67% (2.0-2.6s) */
          66.67% {
            filter: drop-shadow(0 0 50px #E0E30B);
          }
          76.67% {
            filter: drop-shadow(0 0 80px #FFFF00);
          }
          86.67% {
            filter: drop-shadow(0 0 20px #E0E30B);
          }
          
          /* Fade out: 86.67%-100% (2.6-3.0s) */
          100% {
            filter: drop-shadow(0 0 20px #E0E30B);
          }
        }
      `}</style>

      <ApexMetric syncPercentage={syncPercentage} isGlowing={allLabelsComplete} shouldFlash={shouldFlash} />

      <div className="perspective-container">
        <div className="relative w-full h-full flex items-center justify-center preserve-3d">
            <div className="relative preserve-3d animate-pyramid-stable mobile-scale" style={{
              width: 'clamp(2.304rem, 9.6vw, 6.144rem)',
              height: 'clamp(2.304rem, 9.6vh, 6.144rem)'
            }}>
            
            {/* Layer 1: Base */}
            <PyramidSegment 
                baseWidth={182} topWidth={133} height={35} yPos={65} 
                color={pyramidColor} borderColor={borderColor} 
            />
            
            {/* Layer 2: Lower-Mid */}
            <PyramidSegment 
                baseWidth={133} topWidth={98} height={32} yPos={20} 
                color={pyramidColor} borderColor={borderColor} 
            />
            
            {/* Layer 3: Middle (RED, SOLID, THINNER) */}
            <PyramidSegment 
                baseWidth={98} topWidth={70} height={10} yPos={-12} 
                color={middleColor} borderColor="#ff0000" 
                opacity={1}
            />
            
            {/* Layer 4: Upper-Mid */}
            <PyramidSegment 
                baseWidth={70} topWidth={42} height={25} yPos={-50} 
                color={pyramidColor} borderColor={borderColor} 
            />
            
            {/* Layer 5: Tip (The Glowing Apex) */}
            <PyramidSegment 
                baseWidth={42} topWidth={0} height={32} yPos={-94} 
                color={allLabelsComplete ? '#E0E30B' : pyramidColor} 
                borderColor={allLabelsComplete ? '#E0E30B' : borderColor}
                isTip={true}
            />

            {/* Vertical Core Pulse */}
            <div className="absolute left-1/2 top-1/2 w-[1.5px] h-[240px] bg-gradient-to-t from-transparent via-purple-400/20 to-transparent blur-[2px] transform -translate-x-1/2 -translate-y-1/2 opacity-50" />
            <div className="absolute left-1/2 top-1/2 w-[1px] h-[240px] bg-purple-400/40 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
        </div>
      </div>

      {/* Responsive Labels - Independently Positioned */}
      <div className="absolute inset-0 pointer-events-none z-50">
        <SchematicLabel 
          top="calc(50% - clamp(1rem, 3vh, 3rem) - 1rem)" 
          right="calc(clamp(1rem, 5vw, 3rem) + 2.9rem)" 
          label="DATA_LINK" 
          value="L_04" 
          align="right"
          isCompleted={isLabelComplete('dataLink')}
          isLocked={!isLabelComplete('syncAlign')}
          onSquareClick={() => handleSquareClick('dataLink')}
        />
        <SchematicLabel 
          top="calc(50% + clamp(2rem, 4vh, 5rem) - 1rem)" 
          left="calc(clamp(0.5rem, 3vw, 2rem) + 1.1rem)" 
          label="SYNC_ALIGN" 
          value="0.0002"
          isCompleted={isLabelComplete('syncAlign')}
          isLocked={!isLabelComplete('radius')}
          onSquareClick={() => handleSquareClick('syncAlign')}
        />
        <SchematicLabel 
          top="calc(50% + clamp(1rem, 3vh, 3rem) + 4rem)" 
          right="clamp(1rem, 5vw, 3rem)" 
          label="RADIUS" 
          value="182.0_PX" 
          align="right"
          isCompleted={isLabelComplete('radius')}
          isLocked={false}
          onSquareClick={() => handleSquareClick('radius')}
        />
      </div>



      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes slideIn {
          from { 
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to { 
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes slideOut {
          from { 
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          to { 
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
        }
      `}</style>
    </div>
  );
};

export default VisualCore;
