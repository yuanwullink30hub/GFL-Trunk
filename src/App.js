import React, { useState, useEffect, useRef, useCallback } from 'react';
import HoloEarth from './components/orbital/HoloEarth';
import DesktopLayout from './components/orbital/DesktopLayout';
import MobileLayout from './components/orbital/MobileLayout';
import HoloLabel from './components/newFeature/HoloLabel';

// Mobile detection hook
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return isMobile;
};

const TimeSync = ({ isMobile }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = time.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false 
  });

  const dateString = time.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });

  return (
    <div className={`${isMobile ? 'text-left' : 'text-center'} whitespace-nowrap`}>
      <div className={`tracking-widest ${isMobile ? 'text-xs' : 'text-sm'}`} style={{color: 'rgba(21, 179, 21, 0.8)', fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif"}}>TIME SYNC {'/'}{'/'}  {dateString} {'/'}{'/'}  {timeString}</div>
    </div>
  );
};

const TOTAL_FRAMES = 180; // Total animation set points (more frames = smoother)

// ============================================
// ANIMATION SECTION CONFIGURATION
// Adjust these values to control scroll timing for each phase
// ============================================
const SECTION_1_FRAMES = 3;   // Scroll prompt disappears
const SECTION_2_FRAMES = 30;  // Earth explosion
const HEADER_START_FRAME = 9; // Header/containers start vanishing after this frame
const SECTION_3_FRAMES = 6;   // Pyramid center to bottom (system visible)
// ============================================

const App = () => {
  const [mounted, setMounted] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0); // 0 to 29 discrete frames
  const [currentSlide, setCurrentSlide] = useState(0);
  const [pyramidScrollProgress, setPyramidScrollProgress] = useState(0); // Separate scroll for pyramid layers (0-1)
  const [introComplete, setIntroComplete] = useState(false); // Track when pyramid intro animation is done
  const [layerState, setLayerState] = useState({
    completedLayerIndex: -1,
    isIntroActive: false,
    isGoldMode: false,
    introComplete: false
  }); // Pure DOM label state from PyramidInner
  const isMobile = useIsMobile();
  const containerRef = useRef(null);
  const isScrolling = useRef(false); // Debounce to prevent multiple triggers per scroll

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate progress from frame (0-1)
  const scrollProgress = currentFrame / (TOTAL_FRAMES - 1);
  
  // Total frames needed for all three sections
  const TOTAL_ANIMATION_FRAMES = SECTION_1_FRAMES + SECTION_2_FRAMES + SECTION_3_FRAMES;
  
  // Cap the animation at the end of section 3
  const MAX_FRAME = TOTAL_ANIMATION_FRAMES;

  // Scroll handler - one tick = one frame
  // After intro completes (introComplete=true), scroll controls pyramid layers instead
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    
    // Debounce to ensure one scroll tick = one frame
    if (isScrolling.current) return;
    isScrolling.current = true;
    
    const direction = e.deltaY > 0 ? 1 : -1; // Down = forward, Up = backward
    
    // If at max frame AND intro is complete, control pyramid scroll instead
    if (currentFrame >= MAX_FRAME && introComplete) {
      setPyramidScrollProgress(prev => {
        const step = 0.1; // 10% per scroll tick (adjust for sensitivity)
        const newProgress = Math.max(0, Math.min(1, prev + (direction * step)));
        // If scrolling up and at 0, allow returning to orbital animation
        if (direction < 0 && prev <= 0) {
          setCurrentFrame(prevFrame => Math.max(0, prevFrame - 1));
          return 0;
        }
        return newProgress;
      });
    } else {
      // Normal orbital animation scroll
      setCurrentFrame(prev => {
        const newFrame = Math.max(0, Math.min(MAX_FRAME, prev + direction));
        return newFrame;
      });
    }
    
    // Reset debounce after short delay
    setTimeout(() => {
      isScrolling.current = false;
    }, 50);
  }, [currentFrame, introComplete, MAX_FRAME]);

  // Callback when pyramid intro animation completes
  const handleIntroComplete = useCallback(() => {
    setIntroComplete(true);
  }, []);

  // Callback to receive layer state from PyramidInner for pure DOM labels
  const handleLayerStateChange = useCallback((state) => {
    setLayerState(state);
  }, []);

  // Touch handling for mobile
  const touchStartY = useRef(0);
  const touchAccumulator = useRef(0);
  const TOUCH_THRESHOLD = 30; // Pixels needed to trigger one frame
  
  const handleTouchStart = useCallback((e) => {
    touchStartY.current = e.touches[0].clientY;
    touchAccumulator.current = 0;
  }, []);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    const touchY = e.touches[0].clientY;
    const delta = touchStartY.current - touchY;
    touchStartY.current = touchY;
    
    touchAccumulator.current += delta;
    
    // Check if accumulated touch exceeds threshold
    if (Math.abs(touchAccumulator.current) >= TOUCH_THRESHOLD) {
      const direction = touchAccumulator.current > 0 ? 1 : -1;
      
      // If at max frame AND intro is complete, control pyramid scroll
      if (currentFrame >= MAX_FRAME && introComplete) {
        setPyramidScrollProgress(prev => {
          const step = 0.1;
          const newProgress = Math.max(0, Math.min(1, prev + (direction * step)));
          if (direction < 0 && prev <= 0) {
            setCurrentFrame(prevFrame => Math.max(0, prevFrame - 1));
            return 0;
          }
          return newProgress;
        });
      } else {
        setCurrentFrame(prev => Math.max(0, Math.min(MAX_FRAME, prev + direction)));
      }
      touchAccumulator.current = 0;
    }
  }, [currentFrame, introComplete, MAX_FRAME]);

  // Attach wheel listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleWheel, handleTouchStart, handleTouchMove]);

  // Slideshow auto-advance
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % 6);
    }, 4000);
    return () => clearInterval(slideInterval);
  }, []);

  // Derive animation values from currentFrame using section-based timing
  // ============================================
  // SECTION 1: Scroll prompt disappears (frames 0 to SECTION_1_FRAMES)
  // SECTION 2: Earth explosion (frames SECTION_1_FRAMES to SECTION_1_FRAMES + SECTION_2_FRAMES)
  //            Header/containers start vanishing at frame HEADER_START_FRAME
  // SECTION 3: Pyramid to bottom & system visible (after section 2)
  // ============================================
  
  const section1End = SECTION_1_FRAMES;
  const section2End = SECTION_1_FRAMES + SECTION_2_FRAMES;
  const section3End = SECTION_1_FRAMES + SECTION_2_FRAMES + SECTION_3_FRAMES;
  
  // SECTION 1: Scroll prompt disappears (0 to section1End)
  const section1Progress = Math.min(1, Math.max(0, currentFrame / section1End));
  
  // Scroll prompt: fades during section 1
  const promptOpacity = Math.max(0, 1 - section1Progress);
  
  // Earth starts exploding right after section 1
  const isExploding = currentFrame >= section1End;
  
  // SECTION 2: Earth explosion (section1End to section2End)
  const section2Progress = currentFrame <= section1End 
    ? 0 
    : Math.min(1, Math.max(0, (currentFrame - section1End) / SECTION_2_FRAMES));
  
  // Apply ease-in curve to explosion so first frames are less explosive
  // Using cubic ease-in: progress^3 makes the beginning very slow
  // Visual state at frame 4 (linear 0.133) should look like frame 15 (linear 0.5)
  // Adjusted to use a custom power curve for more control
  const explosionEased = Math.pow(section2Progress, 2.5); // Quadratic-ish ease-in
  
  // Earth explosion follows eased section 2
  const explosionProgress = explosionEased;
  
  // Header/containers: start vanishing at frame HEADER_START_FRAME, complete by section2End
  const headerVanishFrames = section2End - HEADER_START_FRAME;
  const headerProgress = currentFrame <= HEADER_START_FRAME 
    ? 0 
    : Math.min(1, Math.max(0, (currentFrame - HEADER_START_FRAME) / headerVanishFrames));
  
  const headerY = headerProgress * -150;
  const headerOpacity = Math.max(0, 1 - headerProgress * 1.5);
  const headerScale = 1 - (headerProgress * 0.05);
  
  // Grid background: fades out with header
  const gridOpacity = Math.max(0, 0.4 * (1 - headerProgress));
  
  // Containers: fly away with header
  const containerProgress = headerProgress;
  
  // SECTION 3: System content visible, pyramid moves to bottom (section2End to section3End)
  const section3Progress = currentFrame <= section2End 
    ? 0 
    : Math.min(1, Math.max(0, (currentFrame - section2End) / SECTION_3_FRAMES));
  
  // System content: fades in during section 3
  const systemOpacity = section3Progress;
  const systemScale = 0.9 + section3Progress * 0.1;
  const systemTranslateY = section3Progress * 160; // 10rem = 160px
  const isSystem = section3Progress > 0;

  // Pyramid layer scroll - only active after system is visible
  // This controls the layer float-up animation via scroll after the 3s intro
  // When isSystem becomes true, the 3s intro starts automatically in PyramidInner
  // After intro, scroll continues to control layer positions

  // Reset to frame 0
  const handleReset = () => {
    setPyramidScrollProgress(0); // Reset pyramid scroll too
    setIntroComplete(false); // Reset intro state for next activation
    setLayerState({ // Reset layer state for pure DOM labels
      completedLayerIndex: -1,
      isIntroActive: false,
      isGoldMode: false,
      introComplete: false
    });
    const interval = setInterval(() => {
      setCurrentFrame(prev => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 30);
  };

  return (
    <main 
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden font-figtree" 
      style={{color: '#FFFEF0', touchAction: 'none'}}
    >
      {/* --- Background Elements --- */}
      <div className="absolute inset-0 z-0" style={{background: 'transparent'}} />
      
      {/* --- Grid Background --- */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          opacity: gridOpacity,
          backgroundImage: `
            linear-gradient(rgba(201, 160, 240, 0.05) 1px, transparent 1px), 
            linear-gradient(90deg, rgba(201, 160, 240, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      {/* --- Radial Shadow/Glow Behind Earth --- */}
      <div 
        className="absolute inset-0 z-5 pointer-events-none" 
        style={{
          background: 'radial-gradient(circle at center, rgba(147, 51, 234, 0.03) 0%, transparent 55%)',
          opacity: isExploding ? Math.max(0, 1 - explosionProgress * 1.5) : 1,
          transform: isExploding ? `scale(${1 + explosionProgress * 0.5})` : 'scale(1)',
          transition: 'none',
          transformOrigin: 'center center'
        }} 
      />

      {/* --- Main 3D Scene --- */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <HoloEarth 
          className="w-full h-full" 
          exploding={isExploding}
          explosionProgress={explosionProgress}
          isMobile={isMobile}
          isActive={isSystem}
          pyramidScrollProgress={pyramidScrollProgress}
          showPyramidLabels={isSystem}
          onIntroComplete={handleIntroComplete}
          onLayerStateChange={handleLayerStateChange}
        />
      </div>

      {/* --- Overlay UI Layer --- */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        {/* Header HUD - Flies up based on scroll progress */}
        <header 
          className={`absolute top-0 left-0 w-full flex ${isMobile ? 'justify-start' : 'justify-between'} ${isMobile ? 'items-start' : 'items-center'} pointer-events-auto`}
          style={{
            transform: `translateY(${headerY}px) scale(${headerScale})`,
            opacity: headerOpacity,
            padding: isMobile ? '0.75rem' : '1.5rem',
            marginLeft: isMobile ? '-0.6rem' : '3vw'
          }}
        >
          <div className="flex items-center" style={{gap: isMobile ? '0rem' : '1rem', transform: isMobile ? 'translateY(calc(-1 * 0.75rem))' : 'none'}}>
            <img src="images/landingpage/logo.png" alt="Delta" className="w-full h-full" style={{width: isMobile ? 'clamp(3.3rem, 20vw, 24rem)' : '5rem', height: isMobile ? 'clamp(3.3rem, 20vw, 24rem)' : '5rem'}} />
            <div>
              <h1 className="font-bold tracking-[0.2em]" style={{
                color: '#FFFEF0',
                fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                fontSize: isMobile ? 'clamp(0.9rem, 5.5vw, 2.2rem)' : '1.5rem',
                lineHeight: '1.1'
              }}>
                DELTA<span style={{color: '#f59e0b'}}>WERKEN</span>
              </h1>
              <div className="flex gap-2 items-center">
                <span className="rounded-full bg-green-500 animate-ping" style={{
                  width: isMobile ? 'clamp(0.3rem, 0.5vw, 0.5rem)' : '0.5rem',
                  height: isMobile ? 'clamp(0.3rem, 0.5vw, 0.5rem)' : '0.5rem',
                  minWidth: isMobile ? 'clamp(0.3rem, 0.5vw, 0.5rem)' : '0.5rem',
                  minHeight: isMobile ? 'clamp(0.3rem, 0.5vw, 0.5rem)' : '0.5rem'
                }}></span>
                <span className="text-gray-400 tracking-widest" style={{
                  fontSize: isMobile ? 'clamp(0.5rem, 2vw, 1rem)' : '0.75rem'
                }}>SYSTEM ONLINE {'/'}{'/'} V.4.9</span>
              </div>
            </div>
          </div>
        </header>
        
        {/* Desktop TimeSync - Right positioned */}
        {!isMobile && (
          <div className="absolute pointer-events-auto" style={{
            right: '1.5rem',
            top: '2.5rem',
            zIndex: 50
          }}>
            <TimeSync isMobile={isMobile} />
          </div>
        )}
        
        {/* Mobile TimeSync - Left sidebar */}
        {isMobile && (
          <div className="absolute pointer-events-auto" style={{
            left: 'clamp(0.5rem, 3vw, 6.5rem)',
            top: 'clamp(2rem, 12vh, 4rem)',
            maxWidth: '85%',
            overflow: 'visible',
            whiteSpace: 'nowrap',
            transform: 'scale(clamp(0.4, 1.6vw, 1.2))',
            transformOrigin: 'top left'
          }}>
            <TimeSync isMobile={isMobile} />
          </div>
        )}

        {/* --- Scroll Prompt (Orbital View Only) --- */}
        <div 
          className="absolute left-0 right-0 flex flex-col items-center justify-center gap-4 z-50 pointer-events-none"
          style={{
            bottom: isMobile ? 'clamp(11.5rem, 34.5vh, 19.5rem)' : '20%',
            opacity: promptOpacity,
            transform: promptOpacity > 0 ? 'scale(1)' : 'scale(1.5)'
          }}
        >
          <div className="relative flex flex-col items-center gap-2 bg-black/40 backdrop-blur-md rounded-sm" style={{
            border: '1px solid rgba(21, 179, 21, 0.4)',
            padding: isMobile ? 'clamp(0.4rem, 2.5vw, 1.2rem) clamp(0.8rem, 4.5vw, 2.8rem)' : '0.625rem 2rem'
          }}>
            <span className="tracking-[0.25em] font-bold" style={{
              color: 'white', 
              fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
              fontSize: isMobile ? 'clamp(0.8rem, 3.5vw, 1.8rem)' : '1rem'
            }}>SCROLL TO SYNCHRONISE</span>
            
            <div className="absolute top-0 left-0 border-t border-l" style={{
              width: isMobile ? 'clamp(0.4rem, 1.2vw, 0.9rem)' : '0.5rem',
              height: isMobile ? 'clamp(0.4rem, 1.2vw, 0.9rem)' : '0.5rem',
              borderColor: 'rgba(21, 179, 21, 0.4)'
            }}></div>
            <div className="absolute bottom-0 right-0 border-b border-r" style={{
              width: isMobile ? 'clamp(0.4rem, 1.2vw, 0.9rem)' : '0.5rem',
              height: isMobile ? 'clamp(0.4rem, 1.2vw, 0.9rem)' : '0.5rem',
              borderColor: 'rgba(21, 179, 21, 0.4)'
            }}></div>
          </div>
          
          {/* Animated scroll indicator */}
          <div className="flex flex-col items-center gap-2 animate-bounce">
            <div className="w-6 h-10 border-2 rounded-full flex justify-center pt-2" style={{borderColor: 'rgba(245, 158, 11, 0.5)'}}>
              <div className="w-1 h-2 bg-orange-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* --- Floating Containers (Orbital View) --- */}
        {!isMobile && (
          <DesktopLayout 
            isExploding={isExploding} 
            mounted={mounted} 
            currentSlide={currentSlide} 
            setCurrentSlide={setCurrentSlide}
            animationProgress={containerProgress}
          />
        )}

        {isMobile && (
          <MobileLayout 
            isExploding={isExploding} 
            mounted={mounted} 
            currentSlide={currentSlide} 
            setCurrentSlide={setCurrentSlide}
            animationProgress={containerProgress}
          />
        )}

        {/* --- SYSTEM INNER CONTENT (Shown after Zoom) --- */}
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{
            opacity: systemOpacity,
            transform: `scale(${systemScale}) translateY(${systemTranslateY}px)`
          }}
        >
          <div className={`w-[80vw] h-[80vh] flex flex-col items-center justify-center ${isSystem ? 'pointer-events-auto' : 'pointer-events-none'}`}>
            
            {/* Back Button - positioned under the pyramid */}
            <button 
              onClick={handleReset}
              className={`absolute group flex items-center gap-3 rounded-sm transition-all duration-300 backdrop-blur-sm ${isMobile ? 'px-3 py-1.5' : 'px-4 py-2'}`}
              style={{
                border: '1px solid rgba(147, 51, 234, 0.3)',
                background: 'rgba(10, 5, 16, 0.6)',
                bottom: isMobile ? '4rem' : '10rem',
                left: '50%',
                transform: 'translateX(-50%)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.6)';
                e.currentTarget.style.background = 'rgba(147, 51, 234, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.3)';
                e.currentTarget.style.background = 'rgba(10, 5, 16, 0.6)';
              }}
            >
              <div className={`flex items-center justify-center ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} style={{color: 'rgba(147, 51, 234, 0.8)'}}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`group-hover:-translate-x-1 transition-transform ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`}>
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </div>
              <span className={`tracking-[0.2em] uppercase ${isMobile ? 'text-[10px]' : 'text-xs'}`} style={{color: 'rgba(255, 254, 240, 0.7)', fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif"}}>ORBIT</span>
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l" style={{borderColor: 'rgba(147, 51, 234, 0.5)'}}></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r" style={{borderColor: 'rgba(147, 51, 234, 0.5)'}}></div>
            </button>

          </div>
        </div>

        {/* --- Pure DOM Pyramid Labels Overlay --- */}
        {isSystem && (
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ zIndex: 25 }}
          >
            {/* Layer labels - each with separate threshold */}
            {[0, 1, 2, 3, 4].map((layerIndex) => {
              // Each label has its own visibility threshold based on layer completion
              const isVisible = layerState.introComplete && layerIndex <= layerState.completedLayerIndex;
              const isHighestCompleted = layerIndex === layerState.completedLayerIndex;
              const showButton = !layerState.isIntroActive && isHighestCompleted && !layerState.isGoldMode;
              const isRight = layerIndex % 2 === 0;
              
              // Calculate label opacity - smooth fade in based on threshold
              // Layer 0 visible immediately after intro, others staggered
              const labelOpacity = isVisible ? 1 : 0;
              
              // Viewport-responsive vertical positioning - tightly aligned with pyramid layers
              // Center at 50vh with compact spacing
              const centerVh = 50;
              const layerHeightVh = 1.8; // Tighter spacing per layer
              const layerOffset = layerIndex - 2; // Offset from center layer (0-4 -> -2 to 2)
              let yOffsetVh = centerVh - (layerOffset * layerHeightVh);
              
              // Move layer 0 down by 15rem (approximately 28.5vh)
              if (layerIndex === 0) {
                yOffsetVh += 28.5;
              }
              
              // Viewport-responsive horizontal positioning (alternate sides)
              const horizontalOffsetVw = isRight ? 'auto' : '6vw';
              const horizontalOffsetVwRight = isRight ? '6vw' : 'auto';
              
              // Viewport-responsive scale using clamp (increased for better visibility)
              const scaleValue = isMobile ? 'clamp(0.65, 3.5vw, 0.95)' : 'clamp(0.7, 2.5vw, 0.95)';
              
              return (
                <div
                  key={`dom-label-${layerIndex}`}
                  className={`absolute transition-opacity duration-300 pointer-events-auto`}
                  style={{
                    opacity: labelOpacity,
                    top: `${yOffsetVh}vh`,
                    left: horizontalOffsetVw,
                    right: horizontalOffsetVwRight,
                    transform: `translate(${isRight ? '0' : '0'}, -50%) scale(${scaleValue})`,
                    transformOrigin: isRight ? 'right center' : 'left center',
                    pointerEvents: isVisible ? 'auto' : 'none',
                    willChange: 'opacity, transform'
                  }}
                >
                  <HoloLabel
                    layerIndex={layerIndex}
                    showButton={showButton}
                    isLast={layerIndex === 4}
                    alignment={isRight ? 'right' : 'left'}
                    onSend={() => {
                      // When final label is sent, trigger pyramid gold mode animation
                      if (layerIndex === 4) {
                        window.dispatchEvent(new CustomEvent('triggerGoldMode'));
                      }
                    }}
                    isSent={layerState.isGoldMode}
                  />
                </div>
              );
            })}

            {/* Compass Sync Button - shown when gold mode is active */}
            {isSystem && layerState.isGoldMode && (
              <div
                className="absolute flex items-center gap-2 whitespace-nowrap transition-opacity duration-300 pointer-events-auto"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  opacity: layerState.isGoldMode ? 1 : 0,
                  pointerEvents: layerState.isGoldMode ? 'auto' : 'none'
                }}
              >
                <div
                  className="relative px-6 py-3 bg-[#1a0525] border border-orange-500 text-white font-mono text-xs tracking-widest uppercase shadow-[0_0_30px_rgba(255,165,0,0.5)] cursor-pointer flex items-center gap-3 hover:bg-orange-900/50 transition-all duration-300 animate-pulse"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    console.log('Syncing compass...'); 
                  }}
                  style={{
                    fontSize: isMobile ? 'clamp(9px, 2vw, 12px)' : 'clamp(11px, 1.5vw, 14px)',
                    padding: isMobile ? 'clamp(6px, 1.5vw, 10px) clamp(12px, 3vw, 20px)' : 'clamp(8px, 1vw, 12px) clamp(16px, 2vw, 24px)'
                  }}
                >
                  <div className="absolute -left-1 -top-1 w-2 h-2 border-t border-l border-white"></div>
                  <div className="absolute -right-1 -bottom-1 w-2 h-2 border-b border-r border-white"></div>
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
                  Synchroniseer kompas
                </div>
                <div className="h-[1px] bg-orange-500/60" style={{ width: isMobile ? 'clamp(24px, 4vw, 36px)' : 'clamp(36px, 3vw, 48px)' }}></div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- Footer / Deco --- */}
      <div 
        className="absolute z-30 select-none tracking-widest" 
        style={{
          bottom: '0.5rem',
          left: isMobile ? '0.75rem' : '1.5rem',
          fontSize: isMobile ? '0.625rem' : '0.875rem',
          color: 'rgba(255, 254, 240, 0.2)',
          fontFamily: "'Figtree', sans-serif",
          opacity: isSystem ? 0 : 1
        }}
      >
        {isMobile ? 'COORD: 13.41° N, 103.87° E' : 'COORD: 13.412469° N, 103.866986° E'}
      </div>

      {/* Progress indicator for debugging - remove later */}
      <div 
        className="fixed bottom-4 right-4 z-50 text-xs font-mono pointer-events-none"
        style={{ color: 'rgba(245, 158, 11, 0.6)' }}
      >
        Frame: {currentFrame + 1}/{TOTAL_FRAMES}
      </div>
    </main>
  );
};

export default App;
