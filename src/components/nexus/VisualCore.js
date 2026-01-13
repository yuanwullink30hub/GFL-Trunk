import React from 'react';

const SchematicLabel = ({ top, left, right, bottom, label, value, align = 'left' }) => (
  <div 
    className="absolute flex flex-col pointer-events-none group z-50 transition-all duration-500 overflow-visible"
    style={{ 
      top, left, right, bottom, 
      textAlign: align,
      transform: 'translateY(-50%)' 
    }}
  >
    <div className={`flex items-center ${align === 'right' ? 'flex-row-reverse' : ''}`} style={{
      gap: 'clamp(0.625rem, 1.25vw, 1.25rem)'
    }}>
      <div className="bg-purple-500/80 border border-white/20 transform rotate-45" style={{
        width: 'clamp(1.25rem, 2.5vw, 1.875rem)',
        height: 'clamp(1.25rem, 2.5vw, 1.875rem)'
      }} />
      <div className="h-[0.5px] bg-gradient-to-r from-purple-500/50 to-transparent" style={{
        width: 'clamp(2.5rem, 7.5vw, 7.5rem)'
      }} />
    </div>
    <div className="border-l border-purple-500/40 transition-all duration-300 group-hover:bg-purple-900/40 shadow-2xl border-r border-b border-white/5" style={{
      marginTop: 'clamp(0.625rem, 1.25vw, 1.25rem)',
      padding: 'clamp(0.625rem, 1.25vw, 1.25rem)',
      minWidth: 'clamp(7.5rem, 20vw, 17.5rem)'
    }}>
      <div className="text-purple-400/60 font-bold uppercase tracking-[0.2em] text-white font-mono leading-none tracking-tight" style={{
        fontSize: 'clamp(0.75rem, 1.25vw, 1rem)',
        marginBottom: 'clamp(0.3125rem, 0.625vw, 0.625rem)'
      }}>{label}</div>
      <div className="text-white font-mono leading-none tracking-tight" style={{
        fontSize: 'clamp(1rem, 1.875vw, 1.625rem)'
      }}>{value}</div>
    </div>
  </div>
);

const ApexMetric = () => (
  <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-50" style={{
    top: 'clamp(1%, 2vh, 8%)',
    transform: 'translateX(-50%) scale(clamp(0.65, 1vw, 1))'
  }}>
    <div className="text-amber-500 font-bold tracking-[0.3em] uppercase" style={{
      fontSize: 'clamp(0.4rem, 0.75vw, 0.5rem)',
      marginBottom: 'clamp(0.25rem, 0.5vw, 0.5rem)'
    }}>Apex_Sync</div>
    <div className="flex items-center" style={{
      gap: 'clamp(0.5rem, 1vw, 1rem)'
    }}>
      <div className="h-[1px] bg-gradient-to-r from-transparent to-amber-500/50" style={{
        width: 'clamp(1rem, 3vw, 3rem)'
      }} />
      <div className="text-white font-bold font-mono glow-amber tracking-tighter" style={{
        fontSize: 'clamp(0.75rem, 2vw, 1.5rem)'
      }}>99.98%</div>
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

export const VisualCore = () => {
  const pyramidColor = 'rgba(167, 59, 198, 0.4)';
  const borderColor = '#ef8616';
  const middleColor = 'rgb(255, 0, 0)';

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-start bg-transparent overflow-hidden" style={{
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
      `}</style>

      <ApexMetric />

      <div className="perspective-container">
        <div className="relative w-full h-full flex items-center justify-center preserve-3d">
            <div className="relative preserve-3d animate-pyramid-stable mobile-scale" style={{
              width: 'clamp(6rem, 25vw, 16rem)',
              height: 'clamp(6rem, 25vh, 16rem)'
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
                color={pyramidColor} borderColor={borderColor} 
                isTip={true}
            />

            {/* Vertical Core Pulse */}
            <div className="absolute left-1/2 top-1/2 w-[1.5px] h-[240px] bg-gradient-to-t from-transparent via-purple-400/20 to-transparent blur-[2px] transform -translate-x-1/2 -translate-y-1/2 opacity-50" />
            <div className="absolute left-1/2 top-1/2 w-[1px] h-[240px] bg-purple-400/40 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
        </div>
      </div>

      {/* Responsive Labels - Independently Positioned */}
      <div className="absolute inset-0 pointer-events-none">
        <SchematicLabel top="calc(50% - clamp(1rem, 3vh, 3rem))" left="clamp(1rem, 5vw, 3rem)" label="DATA_LINK" value="L_04" />
        <SchematicLabel top="calc(50% + clamp(2rem, 4vh, 5rem))" left="clamp(0.5rem, 3vw, 2rem)" label="SYNC_ALIGN" value="0.0002" />
        <SchematicLabel top="calc(50% + clamp(1rem, 3vh, 3rem))" right="clamp(1rem, 5vw, 3rem)" label="RADIUS" value="182.0_PX" align="right" />
      </div>
    </div>
  );
};

export default VisualCore;
