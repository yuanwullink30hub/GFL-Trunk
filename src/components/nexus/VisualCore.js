import React from 'react';

const SchematicLabel = ({ top, left, right, bottom, label, value, align = 'left' }) => (
  <div 
    className="absolute flex flex-col pointer-events-none group z-50 transition-all duration-500"
    style={{ 
      top, left, right, bottom, 
      textAlign: align,
      transform: 'translateY(-50%)' 
    }}
  >
    <div className={`flex items-center gap-1 md:gap-2 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
      <div className="w-1 md:w-1.5 h-1 md:h-1.5 bg-purple-500/80 border border-white/20 transform rotate-45" />
      <div className="h-[0.5px] w-6 md:w-12 bg-gradient-to-r from-purple-500/50 to-transparent" />
    </div>
    <div className="mt-1 border-l border-purple-500/40 bg-black/90 p-1 md:p-1.5 backdrop-blur-md min-w-[70px] md:min-w-[110px] transition-all duration-300 group-hover:bg-purple-900/40 shadow-2xl border-r border-b border-white/5">
      <div className="text-[5px] md:text-[6px] text-purple-400/60 font-bold uppercase tracking-[0.2em] mb-0.5">{label}</div>
      <div className="text-[8px] md:text-[10px] text-white font-mono leading-none tracking-tight">{value}</div>
    </div>
  </div>
);

const ApexMetric = () => (
  <div className="absolute top-[2%] md:top-[8%] left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-50 scale-75 md:scale-100">
    <div className="text-[6px] md:text-[7px] text-amber-500 font-bold tracking-[0.3em] uppercase mb-1">Apex_Sync</div>
    <div className="flex items-center gap-2 md:gap-3">
      <div className="h-[1px] w-8 md:w-12 bg-gradient-to-r from-transparent to-amber-500/50" />
      <div className="text-sm md:text-xl text-white font-bold font-mono glow-amber tracking-tighter">99.98%</div>
      <div className="h-[1px] w-8 md:w-12 bg-gradient-to-l from-transparent to-amber-500/50" />
    </div>
    <div className="w-px h-10 md:h-16 bg-gradient-to-b from-amber-500/80 to-transparent mt-2" />
  </div>
);

const PyramidSegment = ({ baseWidth, topWidth, height, yPos, color, borderColor, isTip, opacity = 0.8 }) => {
  const halfBase = baseWidth / 2;
  const halfTop = topWidth / 2;
  const sideLength = Math.sqrt(height ** 2 + (halfBase - halfTop) ** 2);
  const angle = Math.atan2(halfBase - halfTop, height) * (180 / Math.PI);

  return (
    <div className="absolute left-1/2 top-1/2 preserve-3d" style={{ transform: `translate(-50%, -50%) translateY(${yPos}px)` }}>
      {isTip && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 md:w-32 h-20 md:h-32 bg-amber-500/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
      )}
      
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
    <div className="relative w-full h-full flex flex-col items-center justify-start pt-2 md:pt-4 bg-transparent overflow-hidden">
      <style>{`
        .perspective-container { 
            perspective: 1500px; 
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        @media (min-width: 768px) {
          .perspective-container { perspective: 2500px; }
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
          transform: scale(0.65);
        }
        @media (min-width: 768px) {
          .mobile-scale { transform: scale(1); }
        }
      `}</style>

      <ApexMetric />

      <div className="perspective-container">
        <div className="relative w-full h-full flex items-center justify-center preserve-3d">
            <div className="relative w-32 md:w-52 h-32 md:h-52 preserve-3d animate-pyramid-stable mobile-scale">
            
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

      {/* Responsive Labels */}
      <div className="absolute inset-0 pointer-events-none scale-[0.85] md:scale-100">
        <SchematicLabel top="calc(50% - 25px)" left="4%" label="DATA_LINK" value="L_04" />
        <SchematicLabel top="calc(50% + 20px)" left="4%" label="SYNC_ALIGN" value="0.0002" />
        <SchematicLabel top="calc(50% + 50px)" right="4%" label="RADIUS" value="182.0_PX" align="right" />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        {Array.from({ length: 20 }).map((_, i) => (
          <div 
            key={i} 
            className="absolute w-0.5 h-0.5 bg-purple-400/30 rounded-full animate-pulse"
            style={{ 
              top: `${Math.random() * 100}%`, 
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default VisualCore;
