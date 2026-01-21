import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAnimationWorker } from '../hooks/useAnimationWorker';
import ParticlePool from '../utils/ParticlePool';
import sun2 from '../images/illustrativesun.png';
import '../styles/text.css';
import '../styles/poetry.css';
import { throttle } from '../utils/performanceUtils';

// Header component (moved from components/nexus/Header.js)
const Header = ({ timestamp, loginName = 'Onbekend', onModalStateChange = () => {}, onModalClosed = () => {}, showButtonGlow = false }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: '50%', y: '50%' });

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsClosing(false);
      onModalStateChange(false);
      onModalClosed();
    }, 1200);
  }, [onModalStateChange, onModalClosed]);

  // Throttle modal open calculations for performance
  const throttledModalOpen = React.useMemo(
    () => throttle((containerElement) => {
      if (!containerElement) return;
      
      // Calculate from the flex container to ensure consistent origin for both button and arrow
      const rect = containerElement.getBoundingClientRect();
      
      // Calculate center of button group, moved left 5rem (1rem additional) and up 3.5rem (2rem additional)
      // Moved 2rem (32px) to the right and 1rem (16px) down
      const centerXPercent = (((rect.left - 32) + rect.width / 2) / window.innerWidth) * 100;
      const centerYPercent = (((rect.top - 104) + rect.height / 2) / window.innerHeight) * 100;
      
      setZoomOrigin({ x: `${centerXPercent}%`, y: `${centerYPercent}%` });
      setIsModalOpen(true);
      onModalStateChange(true);
    }, 50),
    [onModalStateChange]
  );

  const handleModalOpen = (e) => {
    const containerElement = e.currentTarget.parentElement;
    throttledModalOpen(containerElement);
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isModalOpen) handleClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isModalOpen, handleClose]);

  return (
    <>
      <header className="relative z-30 uppercase tracking-widest flex flex-col justify-start items-start" style={{ color: 'rgba(21, 179, 21, 0.8)',
        fontSize: 'clamp(0.795rem, 3.634vw, 1.704rem)',
        width: '100%',
        height: 'clamp(8rem, 12vw, 12rem)',
        position: 'relative',
        paddingLeft: 0,
        textAlign: 'left'
      }}>
        {/* Main Title - left aligned */}
        <div className="flex flex-col pointer-events-none" style={{
          gap: 'clamp(0.25rem, 0.5vw, 0.5rem)',
          marginBottom: 'clamp(0.5rem, 1vw, 1rem)',
          marginLeft: '0.5rem',
          marginTop: '0.4rem',
          alignItems: 'flex-start'
        }}>
          <h1 className="font-bold tracking-[0.3em] poetry" style={{
            fontSize: 'clamp(0.9rem, 1.8vw, 1.5rem)',
            color: '#FFFEF0'
          }}>DELTA</h1>
          <div className="h-px" style={{ backgroundImage: 'linear-gradient(to right, rgba(21, 179, 21, 0.4), rgba(21, 179, 21, 0.4))',
            width: 'clamp(2rem, 4vw, 4rem)'
          }} />
          <h1 className="font-bold tracking-[0.3em] poetry" style={{
            fontSize: 'clamp(0.9rem, 1.8vw, 1.5rem)',
            color: '#FFFEF0'
          }}>WERKEN</h1>
        </div>

        {/* System Status Container - left aligned */}
        <div className="flex flex-col" style={{
          gap: 'clamp(0.25rem, 0.5vw, 0.5rem)',
          marginLeft: '0.45rem',
          pointerEvents: 'auto'
        }}>
          <div className="flex items-center" style={{
            gap: 'clamp(0.5rem, 1vw, 1.5rem)'
          }}>
            <span 
              onClick={handleModalOpen}
              className="border cursor-pointer"
              style={{
                backgroundColor: 'rgba(21, 179, 21, 0.2)',
                borderColor: 'rgba(21, 179, 21, 0.4)',
                padding: 'clamp(0.125rem, 0.5vw, 0.375rem) clamp(0.25rem, 1vw, 0.75rem)',
                fontSize: 'clamp(0.5rem, 1vw, 0.75rem)',
                animation: showButtonGlow ? 'buttonGlow 0.8s ease-out' : 'none',
                transition: showButtonGlow ? 'none' : 'all 0.2s ease',
                boxShadow: 'none'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(21, 179, 21, 0.3)';
                e.target.style.borderColor = 'rgba(21, 179, 21, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'rgba(21, 179, 21, 0.2)';
                e.target.style.borderColor = 'rgba(21, 179, 21, 0.4)';
              }} 
            >
              GEBRUIKSAANWIJZING
            </span>
            <div 
              onClick={handleModalOpen}
              className="transform rotate-45 cursor-pointer transition-all duration-200"
              style={{
                borderBottom: '1px solid rgba(21, 179, 21, 0.5)',
                borderRight: '1px solid rgba(21, 179, 21, 0.5)',
                width: 'clamp(1rem, 2vw, 1.5rem)',
                height: 'clamp(1rem, 2vw, 1.5rem)',
                transform: 'translate(0, -0.25rem) rotate(45deg)',
                padding: 'clamp(0.5rem, 1vw, 0.75rem)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(21, 179, 21, 0.8)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(21, 179, 21, 0.5)';
              }} 
            />
          </div>
          <div className="h-[1px] pointer-events-none" style={{
            backgroundImage: 'linear-gradient(to right, rgba(21, 179, 21, 0.4), transparent)',
            width: 'clamp(4rem, 15vw, 12rem)'
          }} />
        </div>

        {/* Right: Time & Encryption - absolutely positioned at top right */}
        <div className="absolute flex flex-col items-end pointer-events-none" style={{
          position: 'absolute',
          top: '0.4rem',
          right: 0,
          gap: 'clamp(0.25rem, 0.5vw, 0.5rem)',
          fontSize: 'clamp(0.5rem, 0.75vw, 0.7rem)'
        }}>
          <div className="text-right poetry" style={{
            paddingBottom: 'clamp(0.25rem, 0.5vw, 0.75rem)'
          }}>
            <div>TIME_SYNC: {timestamp}</div>
            <div className="text-amber-500/80 flicker" style={{ marginTop: '0.04rem' }}>IDENTITEIT: {loginName}</div>
          </div>
        </div>
      </header>

      {/* Modal Overlay - Zoom effect like triangles */}
      {isModalOpen && (
        <div 
          onClick={handleClose}
          className="fixed inset-0 flex items-center justify-center"
          style={{
            perspective: '1200px',
            perspectiveOrigin: `${zoomOrigin.x} ${zoomOrigin.y}`,
            animation: isClosing 
              ? 'zoomBackdropOut 0.6s ease-in forwards'
              : 'zoomBackdrop 0.6s ease-out forwards',
            zIndex: 100
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              borderColor: 'rgba(21, 179, 21, 0.4)',
              border: '1px solid rgba(21, 179, 21, 0.4)',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              padding: '32px',
              width: '37.8rem',
              maxWidth: '90vw',
              maxHeight: '68vh',
              overflowY: 'auto',
              animation: isClosing 
              ? 'zoomOut 1.2s ease-in forwards'
              : 'zoomIn 1.2s ease-out forwards',
              transformStyle: 'preserve-3d',
              transformOrigin: `${zoomOrigin.x} ${zoomOrigin.y}`,
              zIndex: 10000
            }}
          >
            <div className="text" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              color: '#e6ddf0'
            }}>
              <h2 style={{
                color: '#15B315',
                fontWeight: 'bold',
                fontSize: '18px',
                marginBottom: '16px'
              }}>GEBRUIKSAANWIJZING</h2>
              <p>
                Welkom bij het GFL Nexus systeem. Dit is uw interface naar geavanceerde gegevensvisualisatie en systeemcontrole.
              </p>
              <p>
                Gebruik de interactieve elementen om door de verschillende gegevenstreams te navigeren. Elk component biedt real-time telemetrie en systeemstatus.
              </p>
              <p>
                De centrale piramide visualisatie geeft een grafische weergave van de gegevenshiërarchie weer. Labels geven aanvullende context voor kritieke metrische gegevens.
              </p>
              <p>
                Het rechterpaneel bevat golfanalyse en systeemmetrieken. Monitor deze waarden voor optimale systeemprestaties.
              </p>
              <div style={{
                color: 'rgba(21, 179, 21, 0.6)',
                fontSize: 'clamp(16px, 4vw, 24px)',
                marginTop: '24px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(21, 179, 21, 0.2)',
                textAlign: 'center'
              }}>
                Klik buiten dit venster om te sluiten.
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes buttonGlow {
          0% {
            box-shadow: 0 0 8px rgba(21, 179, 21, 0.4), 0 0 16px rgba(21, 179, 21, 0.2);
          }
          50% {
            box-shadow: 0 0 20px rgba(21, 179, 21, 1), 0 0 40px rgba(21, 179, 21, 0.8), 0 0 60px rgba(21, 179, 21, 0.4);
          }
          100% {
            box-shadow: 0 0 8px rgba(21, 179, 21, 0.4), 0 0 16px rgba(21, 179, 21, 0.2);
          }
        }
        @keyframes zoomBackdrop {
          from { 
            background-color: rgba(0, 0, 0, 0);
            backdrop-filter: blur(0px);
          }
          to { 
            background-color: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(8px);
          }
        }
        @keyframes zoomBackdropOut {
          from { 
            background-color: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(8px);
          }
          to { 
            background-color: rgba(0, 0, 0, 0);
            backdrop-filter: blur(0px);
          }
        }
        @keyframes zoomIn {
          from { 
            opacity: 0;
            transform: scale(0.1) rotateX(25deg) translateZ(-1000px);
          }
          to { 
            opacity: 1;
            transform: scale(1) rotateX(0deg) translateZ(0px);
          }
        }
        @keyframes zoomOut {
          from { 
            opacity: 1;
            transform: scale(1) rotateX(0deg) translateZ(0px);
          }
          to { 
            opacity: 0;
            transform: scale(0.1) rotateX(25deg) translateZ(-1000px);
          }
        }
      `}</style>
    </>
  );
};

// SchematicLabel component (moved from components/nexus/VisualCore.js)
const SchematicLabel = ({ top, left, right, bottom, label, value, align = 'left', isCompleted = false, isLocked = false, onSquareClick = () => {}, shouldBeTransparent = false }) => {
  const [isGlowing, setIsGlowing] = useState(false);
  const prevCompletedRef = React.useRef(false);

  // Trigger glow when label just became completed
  useEffect(() => {
    if (isCompleted && !prevCompletedRef.current) {
      setIsGlowing(true);
      const timer = setTimeout(() => {
        setIsGlowing(false);
      }, 600); // 0.6 seconds glow
      prevCompletedRef.current = true;
      return () => clearTimeout(timer);
    }
    if (!isCompleted) {
      prevCompletedRef.current = false;
    }
  }, [isCompleted]);

  return (
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
        className="transform rotate-45 border transition-all cursor-pointer"
        onClick={isLocked ? undefined : onSquareClick}
        style={{
          width: 'clamp(1.25rem, 2.5vw, 1.875rem)',
          height: 'clamp(1.25rem, 2.5vw, 1.875rem)',
          backgroundColor: isCompleted ? '#E0E30B' : 'rgba(168, 85, 247, 0.8)',
          borderColor: isCompleted ? '#E0E30B' : 'rgba(255, 255, 255, 0.2)',
          opacity: isLocked || shouldBeTransparent ? 0.4 : 1,
          pointerEvents: isLocked ? 'none' : 'auto',
          boxShadow: isGlowing ? '0 0 30px #E0E30B, 0 0 60px rgba(224, 227, 11, 0.5)' : 'none',
          transition: 'background-color 0.43s ease-out, border-color 0.43s ease-out, box-shadow 0.1s ease-out'
        }} 
      />
      <div className="h-[1px] bg-gradient-to-r from-transparent to-yellow-400" style={{
        width: 'clamp(3rem, 10vw, 8rem)'
      }} />
    </div>
    <div 
      className="transition-all duration-300 cursor-pointer"
      onClick={isLocked ? undefined : onSquareClick}
      style={{
        marginTop: 'clamp(0.625rem, 1.25vw, 1.25rem)',
        padding: 'clamp(0.625rem, 1.25vw, 1.25rem)',
        minWidth: 'clamp(7.5rem, 20vw, 17.5rem)',
        opacity: isLocked || shouldBeTransparent ? 0.4 : 1,
        pointerEvents: isLocked ? 'none' : 'auto',
        backgroundColor: 'transparent'
      }}
    >
      <div className="font-bold uppercase tracking-[0.2em] poetry leading-none tracking-tight" style={{
        fontSize: 'clamp(0.6rem, 1vw, 0.8rem)',
        marginBottom: 'clamp(0.25rem, 0.5vw, 0.5rem)',
        color: isGlowing ? '#E0E30B' : '#E0E30B',
        textShadow: isGlowing ? '0 0 10px #E0E30B' : 'none'
      }}>{label}</div>
      <div className="poetry leading-none tracking-tight" style={{
        fontSize: 'clamp(0.8rem, 1.5vw, 1.3rem)',
        color: isCompleted ? '#15B315' : '#ff0000',
        textShadow: isCompleted ? '0 0 10px #15B315, 0 0 20px rgba(21, 179, 21, 0.5)' : 'none',
        transition: 'color 0.43s ease-out, text-shadow 0.43s ease-out'
      }}>{value}</div>
    </div>
  </div>
  );
};

// ApexMetric component (moved from components/nexus/VisualCore.js)
const ApexMetric = ({ syncPercentage = 0, isGlowing = false, shouldFlash = false }) => {
  return (
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
        color: '#f59e0b',
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
          color: syncPercentage === 99 ? '#ff0000' : '#FFFEF0',
          transition: 'color 0.1s ease-out',
          textShadow: 'none'
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
};

// PyramidSegment component (moved from components/nexus/VisualCore.js)
const PyramidSegment = ({ baseWidth, topWidth, height, yPos, color, borderColor, isTip, opacity = 0.8, onTipClick = () => {} }) => {
  const halfBase = baseWidth / 2;
  const halfTop = topWidth / 2;
  const sideLength = Math.sqrt(height ** 2 + (halfBase - halfTop) ** 2);
  const angle = Math.atan2(halfBase - halfTop, height) * (180 / Math.PI);

  return (
    <div className="absolute left-1/2 top-1/2 preserve-3d" style={{ 
      transform: `translate(-50%, -50%) translateY(${yPos}px)`, 
      cursor: isTip ? 'pointer' : 'default',
      willChange: 'transform'
    }} onClick={isTip ? onTipClick : undefined}>
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
            WebkitBackfaceVisibility: 'visible',
            filter: 'none',
            willChange: 'transform',
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
            transform: `translate(-50%, -50%) rotateX(90deg) translateZ(0)`,
            opacity: opacity,
            backfaceVisibility: 'visible',
            WebkitBackfaceVisibility: 'visible'
          }}
        />
      )}
    </div>
  );
};

// VisualCore component (moved from components/nexus/VisualCore.js)
const VisualCore = React.forwardRef(({ syncPercentage = 0, activeLabel = null, onLabelClick = () => {}, onLabelSent = () => {}, metricValues = {}, allLabelsComplete = false, hasReadInstructions = false, style = {} }, ref) => {
  const [completedLabels, setCompletedLabels] = useState({
    dataLink: false,
    syncAlign: false,
    radius: false
  });
  const [displayedCompletedLabels, setDisplayedCompletedLabels] = useState({
    dataLink: false,
    syncAlign: false,
    radius: false
  });
  const [shouldFlash, setShouldFlash] = useState(false);

  // Expose markLabelSent method via ref
  React.useImperativeHandle(ref, () => ({
    markLabelSent: (label) => {
      setCompletedLabels(prev => ({
        ...prev,
        [label]: true
      }));
      // Delay showing green square by 1500ms (animation duration)
      setTimeout(() => {
        setDisplayedCompletedLabels(prev => ({
          ...prev,
          [label]: true
        }));
      }, 1500);
    }
  }));

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

  const pyramidColor = 'rgba(167, 59, 198, 0.4)';
  const borderColor = '#ef8616';
  const middleColor = completedLabels.syncAlign ? pyramidColor : 'rgb(255, 0, 0)';

  const handleSquareClick = (labelKey) => {
    // RADIUS can always be clicked - no prerequisites
    if (labelKey === 'radius') {
      onLabelClick('radius');
    } 
    // SYNC_ALIGN can only be clicked after RADIUS is sent/completed
    else if (labelKey === 'syncAlign' && completedLabels.radius) {
      onLabelClick('syncAlign');
    }
    // DATA_LINK can only be clicked after SYNC_ALIGN is sent/completed
    else if (labelKey === 'dataLink' && completedLabels.syncAlign) {
      onLabelClick('dataLink');
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-start bg-transparent overflow-visible" style={{
      paddingTop: 'clamp(0.5rem, 1vh, 1rem)',
      ...style
    }}>
      <style>{`
        .perspective-container { 
            perspective: clamp(500px, 100vw, 2500px); 
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            transform: scale(0.92) translateY(-4.5rem);
        }
        .preserve-3d { 
            transform-style: preserve-3d;
            -webkit-transform-style: preserve-3d;
        }
        @keyframes stableRotate {
          from { transform: translateY(-5px) rotateX(-20deg) rotateY(360deg); }
          to { transform: translateY(-5px) rotateX(-20deg) rotateY(0deg); }
        }
        @keyframes projectorScanlineDown {
          0% { transform: translateY(180px); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { transform: translateY(0); opacity: 0; }
        }
        @keyframes projectorPulse {
          0%, 100% { opacity: 0.6; filter: blur(3px); }
          50% { opacity: 1; filter: blur(2px); }
        }
        .animate-pyramid-stable {
          animation: stableRotate 30s linear infinite;
          backface-visibility: visible;
          -webkit-backface-visibility: visible;
        }
        .glow-amber { text-shadow: 0 0 10px rgba(251, 191, 36, 0.7); }
        
        .mobile-scale {
          transform: scale(clamp(0.5, 1vw, 1));
        }

        @keyframes apexFlash {
          0% {
            opacity: 1;
          }
          10% {
            opacity: 1;
          }
          20% {
            opacity: 0.8;
          }
          33.33% {
            opacity: 0.8;
          }
          43.33% {
            opacity: 1;
          }
          53.33% {
            opacity: 0.8;
          }
          66.67% {
            opacity: 0.8;
          }
          76.67% {
            opacity: 1;
          }
          86.67% {
            opacity: 0.8;
          }
          100% {
            opacity: 0.8;
          }
        }
      `}</style>

      <ApexMetric syncPercentage={syncPercentage} isGlowing={allLabelsComplete} shouldFlash={shouldFlash} />

      <div className="perspective-container">
        <div className="relative w-full h-full flex items-center justify-center preserve-3d">
            <div className="relative preserve-3d animate-pyramid-stable mobile-scale" style={{
              width: 'clamp(2.304rem, 9.6vw, 6.144rem)',
              height: 'clamp(2.304rem, 9.6vh, 6.144rem)',
              transformOrigin: 'center center',
              willChange: 'transform'
            }}>
            
            {/* Layer 1: Base */}
            <PyramidSegment 
                baseWidth={182} topWidth={133} height={35} yPos={33} 
                color={pyramidColor} borderColor={borderColor} 
            />
            
            {/* Layer 2: Lower-Mid */}
            <PyramidSegment 
                baseWidth={133} topWidth={98} height={32} yPos={-12}
                color={pyramidColor} borderColor={borderColor} 
            />
            
            {/* Layer 3: Middle (RED, SOLID, THINNER) */}
            <PyramidSegment 
                baseWidth={98} topWidth={70} height={20} yPos={-44} 
                color={middleColor} borderColor={completedLabels.syncAlign ? borderColor : '#ff0000'} 
                opacity={1}
            />
            
            {/* Layer 4: Upper-Mid */}
            <PyramidSegment 
                baseWidth={70} topWidth={42} height={25} yPos={-82}
                color={pyramidColor} borderColor={borderColor} 
            />
            
            {/* Layer 5: Tip (The Glowing Apex) */}
            <PyramidSegment 
                baseWidth={42} topWidth={0} height={32} yPos={-126} 
                color={allLabelsComplete ? '#E0E30B' : pyramidColor} 
                borderColor={allLabelsComplete ? '#E0E30B' : borderColor}
                isTip={true}
                onTipClick={() => onLabelClick(null)}
            />

            {/* Holographic Projector Beam from apex metric */}
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 preserve-3d" style={{ transform: 'translate(-50%, -50%) translateY(calc(-145px + 14rem)) rotateX(180deg)', transformStyle: 'preserve-3d' }}>
              
              

              
              {/* Horizontal distortion bands */}
              {[30, 110].map((yPos, idx) => (
                <div 
                  key={idx}
                  className="absolute left-1/2"
                  style={{
                    width: `${80 - (yPos / 3)}px`,
                    height: '3px',
                    background: `linear-gradient(90deg, transparent, rgba(192, 132, 252, ${0.25 - idx * 0.06}), transparent)`,
                    top: `${yPos}px`,
                    opacity: 0.6,
                    transform: 'translateX(-50%)'
                  }}
                />
              ))}
              
            </div>

            {/* Vertical Core Pulse */}
            <div className="absolute left-1/2 top-1/2 w-[1.75px] h-[240px] bg-gradient-to-t from-transparent via-red-500/30 to-transparent blur-[2px] transform -translate-x-1/2 -translate-y-1/2 opacity-50" />
            <div className="absolute left-1/2 top-1/2 w-[1px] h-[240px] bg-red-500/60 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
        </div>
      </div>

      {/* Responsive Labels - Independently Positioned */}
      <div className="absolute inset-0 pointer-events-none z-50">
        <SchematicLabel 
          top="calc(50% - clamp(1rem, 3vh, 3rem) - 3rem - 32px)" 
          right="calc(clamp(1rem, 5vw, 3rem) + 2.9rem)" 
          label="SCHOONHEID" 
          value="IDEAAL" 
          align="right"
          isCompleted={displayedCompletedLabels.dataLink}
          isLocked={!completedLabels.syncAlign}
          onSquareClick={() => handleSquareClick('dataLink')}
          shouldBeTransparent={!hasReadInstructions || !displayedCompletedLabels.syncAlign}
        />
        <SchematicLabel 
          top="calc(50% + clamp(2rem, 4vh, 5rem) - 3rem - 32px)" 
          left="calc(clamp(0.5rem, 3vw, 2rem) + 1.1rem)" 
          label="WAARHEID" 
          value="INTEGRITEIT"
          isCompleted={displayedCompletedLabels.syncAlign}
          isLocked={!completedLabels.radius}
          onSquareClick={() => handleSquareClick('syncAlign')}
          shouldBeTransparent={!hasReadInstructions || !displayedCompletedLabels.radius}
        />
        <SchematicLabel 
          top="calc(50% + clamp(1rem, 3vh, 3rem) + 2rem - 32px)" 
          right="clamp(1rem, 5vw, 3rem)" 
          label="GOEDHEID" 
          value="TOELATEN" 
          align="right"
          isCompleted={displayedCompletedLabels.radius}
          isLocked={false}
          onSquareClick={() => handleSquareClick('radius')}
          shouldBeTransparent={!hasReadInstructions}
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
});

VisualCore.displayName = 'VisualCore';

// MetricRow component (moved from components/nexus/WaveAnalysis.js)
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

// WaveAnalysis component (moved from components/nexus/WaveAnalysis.js)
const WaveAnalysis = ({ activeLabel = null, metricValues = {}, onMetricChange = () => {}, onSendLabel = () => {}, hasReadInstructions = false, onKeyboardStateChange = () => {} }) => {
  const [frame] = useState(0);
  const [solstice, setSolstice] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [signalFluxValue, setSignalFluxValue] = useState('');
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const metricsContainerRef = useRef(null);
  const initialViewportHeightRef = useRef(window.innerHeight);
  const blurTimeoutRef = useRef(null);

  // Check if running on localhost (development)
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  useEffect(() => {
    // Animation disabled - keeping frame at 0 for static metrics
    return () => {};
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

  // Keyboard event handlers - defined at component level
  const handleFocus = useCallback(() => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    
    if (isLocalhost) {
      setKeyboardOffset(325);
      onKeyboardStateChange(true);
    } else {
      const currentHeight = window.innerHeight;
      const heightDifference = initialViewportHeightRef.current - currentHeight;
      
      if (heightDifference > 50) {
        setKeyboardOffset(heightDifference);
        onKeyboardStateChange(true);
      }
    }
  }, [onKeyboardStateChange, isLocalhost]);

  const handleBlur = useCallback(() => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }
    
    blurTimeoutRef.current = setTimeout(() => {
      setKeyboardOffset(0);
      onKeyboardStateChange(false);
      blurTimeoutRef.current = null;
    }, 100);
  }, [onKeyboardStateChange]);
  
  useEffect(() => {
    if (keyboardOffset > 0) {
      onKeyboardStateChange(true);
    }
  }, [keyboardOffset, onKeyboardStateChange]);

  useEffect(() => {
    const handleViewportResize = () => {
      if (isLocalhost) return;
      
      if (window.visualViewport) {
        const windowHeight = window.visualViewport.height;
        const initialHeight = initialViewportHeightRef.current;
        const keyboardHeight = initialHeight - windowHeight;
        
        if (keyboardHeight > 50) {
          setKeyboardOffset(keyboardHeight + 50);
          onKeyboardStateChange(true);
        } else {
          setKeyboardOffset(0);
          onKeyboardStateChange(false);
        }
      }
    };

    const handleResize = () => {
      if (isLocalhost) return;
      
      if (!window.visualViewport) {
        const currentHeight = window.innerHeight;
        const heightDifference = initialViewportHeightRef.current - currentHeight;
        
        if (heightDifference > 50) {
          setKeyboardOffset(heightDifference + 50);
          onKeyboardStateChange(true);
        } else {
          setKeyboardOffset(0);
          onKeyboardStateChange(false);
        }
      }
    };

    const attachListeners = () => {
      const inputs = document.querySelectorAll('input[type="text"]');
      inputs.forEach(input => {
        input.addEventListener('focus', handleFocus);
        input.addEventListener('blur', handleBlur);
      });
    };

    attachListeners();
    
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
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportResize);
    }
    
    return () => {
      const inputs = document.querySelectorAll('input[type="text"]');
      inputs.forEach(input => {
        input.removeEventListener('focus', handleFocus);
        input.removeEventListener('blur', handleBlur);
      });
      window.removeEventListener('resize', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportResize);
      }
      observer.disconnect();
    };
  }, [onKeyboardStateChange, handleFocus, handleBlur, isLocalhost]);

  const { isReady, generateScatter } = useAnimationWorker();
  const [scatterData, setScatterData] = useState(null);
  const particlePoolRef = useRef(new ParticlePool(50)); // Pool of 50 reusable particles

  // Generate scatter points using Web Worker and particle pooling
  useEffect(() => {
    if (!isReady) return;

    (async () => {
      try {
        const data = await generateScatter(25);
        // Use particle pool to manage scatterPoints
        particlePoolRef.current.releaseAll();
        data.forEach(point => {
          const particle = particlePoolRef.current.acquire();
          particle.x = point.x;
          particle.y = point.y;
          particle.size = point.size;
          particlePoolRef.current.addToInUse(particle);
        });
        setScatterData(particlePoolRef.current.getAll());
      } catch (error) {
        console.warn('Worker scatter generation failed, falling back:', error.message);
        // Fallback to particle pool generation
        particlePoolRef.current.releaseAll();
        for (let i = 0; i < 25; i++) {
          const particle = particlePoolRef.current.acquire();
          particle.x = Math.random() * 100;
          particle.y = Math.random() * 100;
          particle.size = 1 + Math.random() * 2;
          particlePoolRef.current.addToInUse(particle);
        }
        setScatterData(particlePoolRef.current.getAll());
      }
    })();
  }, [isReady, generateScatter]);

  const scatterPoints = useMemo(() => 
    scatterData || (() => {
      particlePoolRef.current.releaseAll();
      for (let i = 0; i < 25; i++) {
        const particle = particlePoolRef.current.acquire();
        particle.x = Math.random() * 100;
        particle.y = Math.random() * 100;
        particle.size = 1 + Math.random() * 2;
        particlePoolRef.current.addToInUse(particle);
      }
      return particlePoolRef.current.getAll();
    })(), [scatterData]);

  const handleMetricChange = (metricId, value) => {
    onMetricChange(activeLabel, metricId, value);
  };

  const isCurrentLabelComplete = activeLabel && metricValues[activeLabel] && Object.values(metricValues[activeLabel]).every(v => v.trim() !== '');

  const handleSendLabel = () => {
    if (isCurrentLabelComplete && !isSending) {
      setIsSending(true);
      
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        activeElement.blur();
      }
      
      if (isLocalhost) {
        setTimeout(() => {
          onSendLabel(activeLabel);
          setIsSending(false);
        }, 1500);
        return;
      }
      
      const docElement = document.documentElement;
      if (!document.fullscreenElement) {
        if (docElement.requestFullscreen) {
          docElement.requestFullscreen().catch(() => {
            setTimeout(() => {
              onSendLabel(activeLabel);
              setIsSending(false);
            }, 1500);
          });
          setTimeout(() => {
            onSendLabel(activeLabel);
            setIsSending(false);
          }, 1500);
        } else {
          setTimeout(() => {
            onSendLabel(activeLabel);
            setIsSending(false);
          }, 1500);
        }
      } else {
        setTimeout(() => {
          onSendLabel(activeLabel);
          setIsSending(false);
        }, 1500);
      }
    }
  };

  return (
    <div className="relative flex flex-col h-full w-full" style={{
      height: '100%',
      transform: keyboardOffset > 0 ? `translateY(-${keyboardOffset}px)` : 'translateY(0px)',
      transition: 'transform 0.3s ease-out',
      zIndex: keyboardOffset > 0 ? 60 : 10,
      position: keyboardOffset > 0 ? 'relative' : 'relative',
      maxWidth: '100%',
      margin: '0 auto'
    }}>
      
      {/* Header */}
      <div className="flex items-center justify-between shrink-0" style={{
        marginBottom: 'clamp(0.1rem, 0.25vw, 0.25rem)',
        paddingTop: 'clamp(0.25rem, 0.5vw, 0.5rem)',
        marginTop: '-100px'
      }}>
        <div className="flex items-center" style={{
          gap: 'clamp(1rem, 2vw, 2rem)'
        }}>
          <div className="border-l-2 border-purple-500 bg-purple-500/10" style={{
            padding: 'clamp(0.2rem, 0.5vw, 0.375rem) clamp(0.5rem, 1vw, 0.75rem)'
          }}>
            <span className="font-bold uppercase tracking-[0.2em] poetry" style={{
              fontSize: 'clamp(0.6rem, 0.75vw, 0.7rem)',
              color: '#FFFEF0'
            }}>V4.9</span>
          </div>
          <div className="flex flex-col leading-tight" style={{
            gap: '0.1rem'
          }}>
            <span className="text-white/20 uppercase tracking-[0.1em]" style={{
              fontSize: 'clamp(0.5rem, 0.7vw, 0.7rem)'
            }}>SCHADUW WERK</span>
            <span className="text-amber-500/80 truncate" style={{
              fontSize: 'clamp(0.55rem, 0.8vw, 0.8rem)'
            }}>FM/MF=MF/FM</span>
          </div>
        </div>
        <div className="text-white/30 poetry" style={{
          fontSize: 'clamp(0.5rem, 0.6vw, 0.6rem)',
          marginTop: '1rem'
        }}>{solstice}</div>
      </div>

      {/* Metrics Container - wrapped in relative container for blur overlay */}
      <div className="relative flex-1 min-h-0">
        {/* Blur Overlay - covers only metrics, not header */}
        {!hasReadInstructions && (
          <div 
            className="absolute inset-0 z-40"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              backdropFilter: 'blur(120px)',
              WebkitBackdropFilter: 'blur(150px)',
              pointerEvents: 'none',
              borderRadius: '4px'
            }}
          />
        )}
        <div ref={metricsContainerRef} className="h-full overflow-y-auto scrollbar-custom" style={{
        gap: 'clamp(0.75rem, 2vw, 1.5rem)',
        paddingTop: 'clamp(0.25rem, 0.5vw, 0.5rem)',
        paddingBottom: '0',
        display: 'flex',
        flexDirection: 'column',
        flex: '1 1 auto',
        minHeight: '0',
        scrollbarGutter: 'stable',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(255, 255, 255, 1) transparent'
      }}>
        {!activeLabel ? (
          <>
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
            <MetricRow id="01_MSR" title="Radius Measurement" subtext="PRIMARY_AXIS" colorClass="text-green-500" onValueChange={(val) => handleMetricChange('01_MSR', val)} value={metricValues.radius['01_MSR']} isCompleted={metricValues.radius['01_MSR'].trim() !== ''}>
              <svg viewBox="0 0 200 40" className="w-full h-full opacity-60">
                <circle cx="100" cy="20" r="15" fill="none" stroke="#15B315" strokeWidth="1" />
                <circle cx="100" cy="20" r={10 + Math.sin(frame/5)*3} fill="none" stroke="#15B315" strokeWidth="1" opacity="0.5" />
                <line x1="100" y1="5" x2="100" y2="35" stroke="#15B315" strokeWidth="0.5" opacity="0.5" />
              </svg>
            </MetricRow>
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
            <MetricRow id="01_ALN" title="Sync Alignment" subtext="PHASE_LOCK" colorClass="text-emerald-400" onValueChange={(val) => handleMetricChange('01_ALN', val)} value={metricValues.syncAlign['01_ALN']} isCompleted={metricValues.syncAlign['01_ALN'].trim() !== ''}>
              <svg viewBox="0 0 200 40" className="w-full h-full opacity-70">
                <circle cx="50" cy="20" r="10" fill="none" stroke="#15B315" strokeWidth="1" />
                <circle cx="150" cy="20" r="10" fill="none" stroke="#15B315" strokeWidth="1" opacity="0.6" />
                <line x1="60" y1="20" x2="140" y2="20" stroke="#15B315" strokeWidth="1" opacity="0.5" />
                <path d={`M 50 20 Q 100 ${10 + Math.sin(frame/4)*5} 150 20`} fill="none" stroke="#15B315" strokeWidth="1.5" opacity="0.7" />
              </svg>
            </MetricRow>
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
            <MetricRow id="01_CHN" title="Data Channel" subtext="BANDWIDTH_UTIL" colorClass="text-rose-400" onValueChange={(val) => handleMetricChange('01_CHN', val)} value={metricValues.dataLink['01_CHN']} isCompleted={metricValues.dataLink['01_CHN'].trim() !== ''}>
              <svg viewBox="0 0 200 40" className="w-full h-full opacity-70">
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

      {/* Send Button */}
      {!activeLabel ? (
        <div style={{
          padding: 'clamp(0.75rem, 2vw, 1.5rem)',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{ display: 'flex', gap: 'clamp(0.5rem, 2vw, 1rem)' }}>
            <button
              onClick={() => {}}
              className="flex-1 font-bold uppercase tracking-widest transition-all duration-300 poetry"
              style={{
                padding: 'clamp(0.5rem, 1vw, 0.75rem)',
                fontSize: 'clamp(0.6rem, 0.9vw, 0.8rem)',
                backgroundColor: '#15B315',
                color: '#000',
                border: '1px solid white',
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
              onClick={() => {}}
              className="flex-1 font-bold uppercase tracking-widest transition-all duration-300 poetry"
              style={{
                padding: 'clamp(0.5rem, 1vw, 0.75rem)',
                fontSize: 'clamp(0.6rem, 0.9vw, 0.8rem)',
                backgroundColor: '#15B315',
                color: '#000',
                border: '1px solid white',
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
          borderTop: '1px solid rgba(255, 255, 255, 0.05)'
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
              border: `1px solid ${(isCurrentLabelComplete && !isSending) ? '#FFFEF0' : 'rgba(255, 255, 255, 0.2)'}`,
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
          borderTop: '1px solid rgba(255, 255, 255, 0.05)'
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
              border: `1px solid ${(isCurrentLabelComplete && !isSending) ? '#FFFEF0' : 'rgba(255, 255, 255, 0.2)'}`,
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
          borderTop: '1px solid rgba(255, 255, 255, 0.05)'
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
      </div>
      </div>

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

// Footer component (moved from components/nexus/Footer.js)
const Footer = () => {
  return (
    <footer className="relative z-30" style={{
      height: 0,
      padding: 0,
      overflow: 'hidden'
    }}>
    </footer>
  );
};

// Helper function to format date and time consistently
const formatDateTime = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${month}/${day}/${year}, ${hours}:${minutes}:${seconds}`;
};

export const Deltawerken = ({ onBack }) => {
  const [timestamp, setTimestamp] = useState(formatDateTime(new Date()));
  const [timezone, setTimezone] = useState(null);
  const [activeLabel, setActiveLabel] = useState(null);
  const [hasReadInstructions, setHasReadInstructions] = useState(false);
  const [isKeyboardActive, setIsKeyboardActive] = useState(false);
  const visualCoreRef = useRef(null);
  
  // Track metric values for completion tracking
  const [metricValues, setMetricValues] = useState({
    radius: { '01_MSR': '', '02_DEV': '', '03_FLD': '', '04_SYN': '' },
    syncAlign: { '01_ALN': '', '02_PHS': '', '03_FRQ': '', '04_COH': '' },
    dataLink: { '01_CHN': '', '02_BND': '', '03_SIG': '', '04_PKT': '' }
  });

  // Track label completions and sync percentage
  const [completedLabels, setCompletedLabels] = useState({
    radius: false,
    syncAlign: false,
    dataLink: false
  });
  
  const [syncPercentage, setSyncPercentage] = useState(0);
  const [animatingLabel, setAnimatingLabel] = useState(null);
  const [showCompletionGlow, setShowCompletionGlow] = useState(false);
  const [showButtonGlow, setShowButtonGlow] = useState(false);

  // Trigger button glow after fade-in animation completes plus 0.5s delay
  useEffect(() => {
    const glowTimer = setTimeout(() => {
      setShowButtonGlow(true);
    }, 4100);
    return () => clearTimeout(glowTimer);
  }, []);

  // Monitor label completions for state tracking only (not animation)
  useEffect(() => {
    // Check if a label is complete
    const isLabelComplete = (label) => {
      if (!metricValues[label]) return false;
      return Object.values(metricValues[label]).every(v => v.trim() !== '');
    };

    const newCompleted = {
      radius: isLabelComplete('radius'),
      syncAlign: isLabelComplete('syncAlign'),
      dataLink: isLabelComplete('dataLink')
    };

    // Update completed labels state without triggering animation
    // Animation will be triggered by handleSendLabel button click instead
    if (newCompleted.radius && !completedLabels.radius) {
      setCompletedLabels(prev => ({ ...prev, radius: true }));
    }
    if (newCompleted.syncAlign && !completedLabels.syncAlign) {
      setCompletedLabels(prev => ({ ...prev, syncAlign: true }));
    }
    if (newCompleted.dataLink && !completedLabels.dataLink) {
      setCompletedLabels(prev => ({ ...prev, dataLink: true }));
    }
  }, [metricValues, completedLabels]);

  useEffect(() => {
    // Fetch user's timezone from IP once on mount
    const fetchTimezone = async () => {
      try {
        const response = await fetch('https://www.googleapis.com/geolocation/v1/geolocate?key=AIzaSyDummy', {
          method: 'POST'
        }).catch(() => {
          // Fallback to ipapi.co if Google fails
          return fetch('https://ipapi.co/json/');
        });
        
        const data = await response.json();
        const tz = data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
        setTimezone(tz);
      } catch (error) {
        // Use browser's default timezone
        setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
      }
    };

    fetchTimezone();

    // Update timestamp every second locally
    const timer = setInterval(() => {
      setTimestamp(formatDateTime(new Date()));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timezone]);

  // Handle metric value updates
  const handleMetricChange = (label, metricId, value) => {
    setMetricValues(prev => ({
      ...prev,
      [label]: {
        ...prev[label],
        [metricId]: value
      }
    }));
  };

  // Handle sending/confirming a label
  const handleSendLabel = (label) => {
    // Trigger animation when button is clicked
    setAnimatingLabel(label);
    
    // Mark label as completed in VisualCore
    if (visualCoreRef.current) {
      visualCoreRef.current.markLabelSent(label);
    }
    
    // Update sync percentage based on which label was sent
    setTimeout(() => {
      if (label === 'radius') {
        setSyncPercentage(33);
      } else if (label === 'syncAlign') {
        setSyncPercentage(66);
      } else if (label === 'dataLink') {
        setSyncPercentage(99);
      }
      setAnimatingLabel(null);
    }, 1500); // Animation duration
    
    // Move to next label
    const labelOrder = ['radius', 'syncAlign', 'dataLink'];
    const currentIndex = labelOrder.indexOf(label);
    
    if (currentIndex < labelOrder.length - 1) {
      // Move to next label
      const nextLabel = labelOrder[currentIndex + 1];
      setTimeout(() => {
        setActiveLabel(nextLabel);
      }, 1500); // Wait for animation to complete
    } else {
      // All labels complete - clear active label and show completion glow after animation
      setTimeout(() => {
        setActiveLabel(null);
        setShowCompletionGlow(true);
      }, 1500);
    }
  };

  // Callback for when a label is sent - called by VisualCore
  const onLabelSentCallback = (label) => {
    // VisualCore will handle updating its own completedLabels state
    // This is just a notification hook if needed
  };

  // Callback for when user closes the GEBRUIKSAANWIJZING modal
  const handleModalClosed = () => {
    setHasReadInstructions(true);
    setActiveLabel('radius'); // Show first label forms when blur disappears
    setIsKeyboardActive(false); // Clear any lingering keyboard blur state
  };

  return (
    <div className="relative h-full w-full overflow-hidden flex flex-col font-mono touch-none" style={{ color: '#15B315' }}>
      {/* Sun Logo - Persistent across content */}
      <button
        onClick={() => window.location.href = '/login'}
        className="absolute right-6 p-2 hover:opacity-80 transition-opacity duration-300"
        style={{ top: 'calc(1.5rem + 0.4rem)', zIndex: 60, filter: 'none', mixBlendMode: 'screen', background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
        title="Go to login"
      >
        <img src={sun2} alt="Login" style={{ width: '55px', height: '55px', transformOrigin: 'center', rotate: '-30deg', pointerEvents: 'none', display: 'block', filter: 'none' }} />
      </button>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;600;700&display=swap');
        
        .nexus-container {
          font-family: 'Figtree', sans-serif;
        }

        .glow-cyan { text-shadow: 0 0 10px rgba(21, 179, 21, 0.5); }
        .glow-amber { text-shadow: 0 0 10px rgba(251, 191, 36, 0.7); }
        .border-glow-cyan { box-shadow: 0 0 15px rgba(21, 179, 21, 0.2); }
        
        .flicker {
            animation: flicker 2s infinite;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes flicker {
            0% { opacity: 0.8; }
            5% { opacity: 0.5; }
            10% { opacity: 0.9; }
            15% { opacity: 0.6; }
            20% { opacity: 1; }
            100% { opacity: 0.9; }
        }

        @keyframes flowToApex {
            0% {
                transform: translate(-50%, 0) scale(1);
                opacity: 1;
            }
            100% {
                transform: translate(-50%, calc(-100vh + clamp(1%, 2vh, 8%) + 80px + 25rem)) scale(0.1);
                opacity: 0;
            }
        }

        .floating-wave-analysis {
            animation: flowToApex 1s linear forwards;
            transform-origin: center center;
            pointer-events: none;
        }
      `}</style>

      {/* Visual FX Layers */}
      
      {/* Main Unified Holographic Container */}
      <div className="nexus-container relative flex-1 z-20 flex flex-col overflow-hidden bg-black/20" style={{
        margin: 'clamp(0.5rem, 1.5vw, 1.5rem)',
        touchAction: 'manipulation'
      }}>
        {/* Corner Brackets with connecting lines */}
        <div className="absolute top-0 left-0 pointer-events-none" style={{
          width: 'clamp(1rem, 3vw, 2rem)',
          height: 'clamp(1rem, 3vw, 2rem)',
          borderTop: '2px solid #531a6d',
          borderLeft: '2px solid #531a6d',
          zIndex: 10
        }} />
        <div className="absolute pointer-events-none" style={{
          top: 'clamp(0.5rem, 1.5vw, 1rem)',
          inset: '0 0 auto 0',
          height: '1px',
          backgroundColor: 'rgba(255, 255, 255, 0.2)'
        }} />
        <div className="absolute top-0 right-0 pointer-events-none" style={{
          width: 'clamp(1rem, 3vw, 2rem)',
          height: 'clamp(1rem, 3vw, 2rem)',
          borderTop: '2px solid #531a6d',
          borderRight: '2px solid #531a6d',
          zIndex: 10
        }} />
        
        <div className="absolute bottom-0 left-0 pointer-events-none" style={{
          width: 'clamp(1rem, 3vw, 2rem)',
          height: 'clamp(1rem, 3vw, 2rem)',
          borderBottom: '2px solid #531a6d',
          borderLeft: '2px solid #531a6d',
          zIndex: 10
        }} />
        <div className="absolute pointer-events-none" style={{
          bottom: 'clamp(0.5rem, 1.5vw, 1rem)',
          inset: 'auto 0 0 0',
          height: '1px',
          backgroundColor: 'rgba(255, 255, 255, 0.2)'
        }} />
        <div className="absolute bottom-0 right-0 pointer-events-none" style={{
          width: 'clamp(1rem, 3vw, 2rem)',
          height: 'clamp(1rem, 3vw, 2rem)',
          borderBottom: '2px solid #531a6d',
          borderRight: '2px solid #531a6d',
          zIndex: 10
        }} />

        <div className="absolute pointer-events-none" style={{
          left: 'clamp(0.5rem, 1.5vw, 1rem)',
          inset: '0 auto 0 0',
          width: '1px',
          backgroundColor: 'rgba(255, 255, 255, 0.2)'
        }} />
        <div className="absolute pointer-events-none" style={{
          right: 'clamp(0.5rem, 1.5vw, 1rem)',
          inset: '0 0 0 auto',
          width: '1px',
          backgroundColor: 'rgba(255, 255, 255, 0.2)'
        }} />

        <div className="shrink-0" style={{
          padding: 'clamp(0.5rem, 1.5vw, 1.5rem)'
        }}>
          <Header timestamp={timestamp} onModalStateChange={() => {}} onModalClosed={handleModalClosed} showButtonGlow={showButtonGlow} />
        </div>

        {/* Responsive Content Flow */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden" style={{
          gap: 'clamp(0.5rem, 1.5vw, 1.5rem)',
          padding: `clamp(2rem, 3vw, 3rem) clamp(0.75rem, 2vw, 2rem) clamp(0.25rem, 0.75vw, 1rem) clamp(0.75rem, 2vw, 2rem)`,
          marginTop: '-5rem'
        }}>
          {/* Main Visual Core - Top on Mobile, Left on Desktop */}
          <div className="flex-[2] md:flex-[3] relative overflow-visible flex items-center justify-center" style={{
            minHeight: 'clamp(8rem, 30vh, 22rem)',
            marginBottom: '-100px',
            marginTop: '-1rem'
          }}>
             <div className="absolute top-0 left-0 border border-white/10 bg-black/40 text-white/40 uppercase tracking-widest z-10" style={{
               padding: 'clamp(0.25rem, 0.5vw, 0.375rem) clamp(0.5rem, 1vw, 0.75rem)',
               fontSize: 'clamp(0.35rem, 0.55vw, 0.5rem)',
               marginTop: '0.7rem'
             }}>
                CORE_NODE_YUGENESIS
             </div>
             <VisualCore ref={visualCoreRef} activeLabel={activeLabel} onLabelClick={setActiveLabel} onLabelSent={onLabelSentCallback} metricValues={metricValues} allLabelsComplete={showCompletionGlow} syncPercentage={syncPercentage} hasReadInstructions={hasReadInstructions} style={{
               filter: isKeyboardActive ? 'blur(15px)' : 'none',
               transition: 'filter 0.3s ease-out'
             }} />
          </div>

          {/* Metrics Panel - Bottom on Mobile, Right on Desktop */}
          <div className="flex-1 min-h-0 flex flex-col border-t md:border-t-0 md:border-l border-white/5" style={{
            paddingTop: 'clamp(0.25rem, 0.75vw, 0.5rem)',
            paddingLeft: 'clamp(0, 2vw, 1rem)'
          }}>
             <WaveAnalysis activeLabel={activeLabel} metricValues={metricValues} onMetricChange={handleMetricChange} onSendLabel={handleSendLabel} hasReadInstructions={hasReadInstructions} onKeyboardStateChange={setIsKeyboardActive} />
          </div>
        </div>

        <div className="shrink-0">
          <Footer />
        </div>
      </div>

      {/* Floating Wave Analysis Animation */}
      {animatingLabel && (
        <div 
          className="floating-wave-analysis fixed left-1/2 pointer-events-none z-40"
          style={{
            width: 'clamp(250px, 25vw, 350px)',
            top: '40%',
            transformOrigin: 'center center',
          }}
        >
          <div className="relative flex flex-col h-auto w-full border border-green-500/40 bg-gradient-to-b from-black/60 to-black/40 backdrop-blur-sm p-3">
            {/* Animated Border Glow */}
            <div className="absolute inset-0 border border-green-500/20 rounded-sm pointer-events-none" />
            
            {/* Copy of WaveAnalysis Header */}
            <div className="flex items-center justify-between shrink-0 mb-3 relative z-10">
              <div className="border-l-2 border-green-500/60 bg-green-500/5 px-2 py-1">
                <span className="font-bold text-green-500 uppercase tracking-[0.2em] poetry text-xs">
                  V4.9
                </span>
              </div>
              <span className="text-green-500/40 text-xs">SURGE</span>
            </div>
            
            {/* Simplified metric rows with glow effect */}
            <div className="flex-1 overflow-hidden space-y-2">
              {[1, 2, 3, 4].map((idx) => (
                <div 
                  key={idx} 
                  className="border border-green-500/20 bg-green-500/5 p-2 animate-pulse"
                  style={{
                    animation: `pulse 0.8s ease-in-out infinite`,
                    animationDelay: `${idx * 0.1}s`
                  }}
                >
                  <div className="h-2 bg-green-500/30 rounded-full w-full" />
                </div>
              ))}
            </div>
            
            {/* Bottom accent */}
            <div className="mt-2 h-px bg-gradient-to-r from-transparent via-green-500/40 to-transparent" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Deltawerken;
