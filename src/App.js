import React, { useState, useEffect, useRef, useCallback } from 'react';
import HoloEarth from './components/orbital/HoloEarth';
import DesktopLayout from './components/orbital/DesktopLayout';
import MobileLayout from './components/orbital/MobileLayout';
import HoloLabel from './components/newFeature/HoloLabel';
import { getPerformanceSettings } from './utils/performanceMonitor';
import { FilosofiePage, GardensPage, DataPage, LoginPage, EyedentityPage } from './pages';

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
    <div className="text-center whitespace-nowrap">
      <div className="tracking-widest" style={{color: 'rgba(21, 179, 21, 0.8)', fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif", fontSize: 'max(13px, 0.7vw)'}}>TIME SYNC {'/'}{'/'}  {dateString} {'/'}{'/'}  {timeString}</div>
    </div>
  );
};

// ============================================
// ANIMATION SECTION CONFIGURATION
// Adjust these values to control scroll timing for each phase
// ============================================
const SCROLL_BUTTON_FRAMES = 3; // Scroll button disappears (first 3 frames)
const SECTION_1_FRAMES = 3;   // Pre-explosion phase (button gone)
const SECTION_2_FRAMES = 33;  // Earth explosion (30 + 3 extra for smoother animation)
const HEADER_START_FRAME = 9; // Header/containers start vanishing after this frame
const SECTION_3_FRAMES = 13;  // Pyramid center to bottom (system visible)
// ============================================

const App = () => {
  const [mounted, setMounted] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0); // 0 to 29 discrete frames
  const [currentSlide, setCurrentSlide] = useState(0);
  const [pyramidScrollProgress, setPyramidScrollProgress] = useState(0); // Separate scroll for pyramid layers (0-1)
  const [introComplete, setIntroComplete] = useState(false); // Track when pyramid intro animation is done
  const [isLowEndMode, setIsLowEndMode] = useState(false); // Track if device is low-end
  const [lowEndAnimating, setLowEndAnimating] = useState(false); // Track low-end animation state
  // eslint-disable-next-line no-unused-vars
  const [layerState, setLayerState] = useState({
    completedLayerIndex: -1,
    isIntroActive: false,
    isGoldMode: false,
    introComplete: false
  }); // Pure DOM label state from PyramidInner
  // eslint-disable-next-line no-unused-vars
  const [mobileScrollLocked, setMobileScrollLocked] = useState(false); // Track when mobile scroll should be hijacked
  const [activeSection, setActiveSection] = useState(null); // Track active section page (filosofie, gardens, monitor, menu)
  const isMobile = useIsMobile();
  const containerRef = useRef(null);
  const earthSectionRef = useRef(null);
  const lowEndAnimationRef = useRef(null); // Ref for low-end animation interval
  const isScrolling = useRef(false); // Debounce to prevent multiple triggers per scroll
  const mobileScrollLockedRef = useRef(false); // Ref for use in event handlers

  useEffect(() => {
    setMounted(true);
    // Detect low-end device on mount
    const performanceSettings = getPerformanceSettings();
    setIsLowEndMode(performanceSettings.tier === 'LOW');
  }, []);

  // Mobile: Lock scroll when earth section is 100% visible, unlock when scrolling out
  useEffect(() => {
    if (!isMobile || !earthSectionRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.98) {
            // Earth section is completely visible - lock scroll for animation control
            setMobileScrollLocked(true);
            mobileScrollLockedRef.current = true;
            document.body.style.overflow = 'hidden';
          } else if (!entry.isIntersecting || entry.intersectionRatio < 0.5) {
            // Earth section is mostly out of view - unlock scroll
            setMobileScrollLocked(false);
            mobileScrollLockedRef.current = false;
            document.body.style.overflow = '';
          }
        });
      },
      { threshold: [0.5, 0.98] }
    );
    
    observer.observe(earthSectionRef.current);
    
    return () => {
      observer.disconnect();
      document.body.style.overflow = '';
    };
  }, [isMobile]);

  // Calculate progress from frame (0-1)
  
  // Total frames needed for all three sections
  // For low-end devices, increase frame count to slow down animation
  const totalAnimFrames = isLowEndMode ? 
    (SECTION_1_FRAMES * 2 + SECTION_2_FRAMES * 1.5 + SECTION_3_FRAMES * 1.5) : 
    (SECTION_1_FRAMES + SECTION_2_FRAMES + SECTION_3_FRAMES);
  const TOTAL_ANIMATION_FRAMES = Math.ceil(totalAnimFrames);
  
  // Cap the animation at the end of section 3
  const MAX_FRAME = TOTAL_ANIMATION_FRAMES;

  // LOW-END MODE: Trigger smooth animation on button click using requestAnimationFrame
  // Animation ends at pyramid visible state, then scroll takes over for layer control
  const triggerLowEndAnimation = useCallback(() => {
    if (lowEndAnimating) return; // Prevent double-click
    
    setLowEndAnimating(true);
    const targetFrame = MAX_FRAME;
    const animationDuration = 7500; // 7.5 seconds for full animation
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / animationDuration, 1); // 0 to 1
      
      // Use easeOutCubic for smooth deceleration
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const smoothFrame = Math.round(easeProgress * targetFrame);
      
      setCurrentFrame(smoothFrame);
      
      if (progress < 1) {
        lowEndAnimationRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete - pyramid is now visible with layers
        setCurrentFrame(targetFrame); // Ensure we land exactly on target
        setLowEndAnimating(false);
        // Don't auto-progress pyramid - let user scroll to control layers
      }
    };
    
    lowEndAnimationRef.current = requestAnimationFrame(animate);
  }, [lowEndAnimating, MAX_FRAME]);

  // Cleanup low-end animation on unmount
  useEffect(() => {
    return () => {
      if (lowEndAnimationRef.current) {
        cancelAnimationFrame(lowEndAnimationRef.current);
      }
    };
  }, []);

  // Scroll handler - one tick = one frame
  // For low-end devices: disabled until animation completes, then enabled for pyramid control only
  // After intro completes (introComplete=true), scroll controls pyramid layers instead
  const handleWheel = useCallback((e) => {
    // LOW-END: Skip scroll during animation, but allow after animation completes for pyramid control
    if (isLowEndMode && (lowEndAnimating || currentFrame < MAX_FRAME)) return;
    
    // On mobile, only capture if scroll is locked for animation
    if (window.innerWidth < 768 && !mobileScrollLockedRef.current) return;
    
    e.preventDefault();
    
    // Debounce to ensure one scroll tick = one frame
    if (isScrolling.current) return;
    isScrolling.current = true;
    
    const direction = e.deltaY > 0 ? 1 : -1; // Down = forward, Up = backward
    
    // If at max frame AND intro is complete, control pyramid scroll instead
    if (currentFrame >= MAX_FRAME && introComplete) {
      setPyramidScrollProgress(prev => {
        const step = 0.05; // 5% per scroll tick - slower for smoother layer animation
        const newProgress = Math.max(0, Math.min(1, prev + (direction * step)));
        
        // Mobile: If scrolling down and at end, unlock scroll to continue page scroll
        if (window.innerWidth < 768 && direction > 0 && prev >= 1) {
          setMobileScrollLocked(false);
          mobileScrollLockedRef.current = false;
          document.body.style.overflow = '';
          return 1;
        }
        
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
        
        // Mobile: If scrolling up from frame 0, unlock scroll to return to page scroll
        if (window.innerWidth < 768 && direction < 0 && prev <= 0) {
          setMobileScrollLocked(false);
          mobileScrollLockedRef.current = false;
          document.body.style.overflow = '';
        }
        
        return newFrame;
      });
    }
    
    // Reset debounce after short delay
    setTimeout(() => {
      isScrolling.current = false;
    }, 50);
  }, [currentFrame, introComplete, MAX_FRAME, isLowEndMode, lowEndAnimating]);

  // Callback when pyramid intro animation completes
  const handleIntroComplete = useCallback(() => {
    setIntroComplete(true);
  }, []);

  // Callback to receive layer state from PyramidInner for pure DOM labels
  const handleLayerStateChange = useCallback((state) => {
    setLayerState(state);
  }, []);

  // Trigger gold mode from DOM labels (dispatches window event to PyramidInner)
  const triggerGoldMode = useCallback(() => {
    window.dispatchEvent(new CustomEvent('triggerGoldMode'));
  }, []);

  // Touch handling for mobile
  const touchStartY = useRef(0);
  const touchAccumulator = useRef(0);
  const TOUCH_THRESHOLD = 30; // Pixels needed to trigger one frame
  
  const handleTouchStart = useCallback((e) => {
    // LOW-END: Skip during animation, allow after for pyramid control
    if (isLowEndMode && (lowEndAnimating || currentFrame < MAX_FRAME)) return;
    touchStartY.current = e.touches[0].clientY;
    touchAccumulator.current = 0;
  }, [isLowEndMode, lowEndAnimating, currentFrame, MAX_FRAME]);

  const handleTouchMove = useCallback((e) => {
    // LOW-END: Skip during animation, but allow after for pyramid control
    if (isLowEndMode && (lowEndAnimating || currentFrame < MAX_FRAME)) return;
    
    // On mobile, only capture if scroll is locked for animation
    if (window.innerWidth < 768 && !mobileScrollLockedRef.current) return;
    
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
          const step = 0.05; // 5% per scroll tick - slower for smoother layer animation
          const newProgress = Math.max(0, Math.min(1, prev + (direction * step)));
          
          // Mobile: If scrolling down and at end, unlock scroll to continue page scroll
          if (direction > 0 && prev >= 1) {
            setMobileScrollLocked(false);
            mobileScrollLockedRef.current = false;
            document.body.style.overflow = '';
            return 1;
          }
          
          if (direction < 0 && prev <= 0) {
            setCurrentFrame(prevFrame => Math.max(0, prevFrame - 1));
            return 0;
          }
          return newProgress;
        });
      } else {
        setCurrentFrame(prev => {
          const newFrame = Math.max(0, Math.min(MAX_FRAME, prev + direction));
          
          // Mobile: If scrolling up from frame 0, unlock scroll to return to page scroll
          if (direction < 0 && prev <= 0) {
            setMobileScrollLocked(false);
            mobileScrollLockedRef.current = false;
            document.body.style.overflow = '';
          }
          
          return newFrame;
        });
      }
      touchAccumulator.current = 0;
    }
  }, [currentFrame, introComplete, MAX_FRAME, isLowEndMode, lowEndAnimating]);

  // Attach wheel/touch listeners - also needed on mobile when scroll is locked
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
      setCurrentSlide(prev => (prev + 1) % 4);
    }, 3300);
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
  
  // Scroll button: fades in first 3 frames (faster than section 1)
  const buttonFadeProgress = Math.min(1, Math.max(0, currentFrame / SCROLL_BUTTON_FRAMES));
  const promptOpacity = Math.max(0, 1 - buttonFadeProgress);
  
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
  
  // Device-specific pyramid endpoint adjustment
  const pyramidOffset = window.innerWidth >= 1280 ? -48 : // Desktop: 3rem = 48px higher
                        window.innerWidth >= 1024 ? -48 : // Laptop: 3rem = 48px higher
                        window.innerWidth >= 768 ? -40 : // Tablet: 2.5rem = 40px higher
                        0; // Mobile: no change
  
  const systemTranslateY = section3Progress * 160 + pyramidOffset; // 10rem = 160px
  
  // Separate entity offset to counteract the pyramid movement
  const entityCounterOffset = window.innerWidth >= 1100 ? 16 : // Desktop/Laptop: 1rem = 16px down (counteract pyramid's 3rem move)
                              0; // Tablet/Mobile: no adjustment needed
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
      className={`relative w-screen font-figtree ${isMobile ? 'min-h-screen' : 'h-screen overflow-hidden'}`}
      style={{color: '#FFFEF0', touchAction: isMobile ? 'pan-y' : 'none'}}
    >
      {/* Grid Background - spans entire page on mobile */}
      {isMobile && (
        <div 
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(201, 160, 240, 0.05) 1px, transparent 1px), 
              linear-gradient(90deg, rgba(201, 160, 240, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      )}

      {/* =========================== */}
      {/* =========================== */}
      {/* PERSISTENT ELEMENTS (Mobile) - Stay visible during page transitions */}
      {/* =========================== */}
      {isMobile && (
        <>
          {/* --- Background/Grid (Mobile) --- */}
          <div className="absolute inset-0 z-0" style={{background: 'transparent'}} />
          <div 
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              opacity: 0.5,
              backgroundImage: `
                linear-gradient(rgba(201, 160, 240, 0.05) 1px, transparent 1px), 
                linear-gradient(90deg, rgba(201, 160, 240, 0.05) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }}
          />

          {/* --- Persistent Logo (Mobile) --- */}
          {/* Moves out with header at frame 9, but stays static if activeSection is clicked */}
          <div
            className="fixed pointer-events-auto z-50"
            style={{
              top: 'clamp(1rem, 2vw, 1.5rem)',
              left: 'clamp(0.75rem, 2vw, 1rem)',
              transform: activeSection ? 'none' : `translateX(${headerY * 2.5}px) translateY(${headerY * 2.5}px) scale(${headerScale})`,
              opacity: activeSection ? 1 : headerOpacity,
              transition: activeSection ? 'none' : undefined,
            }}
          >
            <img 
              src="images/landingpage/logo.png" 
              alt="Delta" 
              style={{
                width: 'clamp(3rem, 10vw, 4rem)', 
                height: 'clamp(3rem, 10vw, 4rem)',
                flexShrink: 0,
                cursor: activeSection ? 'pointer' : 'default',
              }} 
              onClick={() => activeSection && setActiveSection(null)}
              title={activeSection ? 'Back to Landing' : ''}
            />
          </div>
        </>
      )}

      {/* MOBILE LAYOUT - Flow based */}
      {/* =========================== */}
      {isMobile && (
        <div 
          className="flex flex-col w-full relative z-10"
          style={{
            opacity: activeSection ? 0 : 1,
            transform: activeSection ? 'scale(0.85)' : 'scale(1)',
            transformOrigin: 'center center',
            pointerEvents: activeSection ? 'none' : 'auto',
            transition: 'opacity 1.5s ease, transform 1.5s ease',
          }}
        >
          {/* Tech Containers Section - scrollable */}
          <MobileLayout 
            isExploding={isExploding} 
            mounted={mounted} 
            currentSlide={currentSlide} 
            setCurrentSlide={setCurrentSlide}
            animationProgress={containerProgress}
            position="top"
            isMobile={isMobile}
            TimeSync={
              <div style={{
                transform: `translateX(${-headerY * 2.5}px) translateY(${headerY * 2.5}px) scale(${headerScale})`,
                opacity: headerOpacity,
              }}>
                <TimeSync isMobile={isMobile} />
              </div>
            }
          />
          
          {/* Earth Animation Section */}
          <div 
            ref={earthSectionRef}
            className="relative w-full h-screen"
            style={{ background: 'transparent', marginTop: '-9rem' }}
          >
            {/* Radial Glow - disabled on low-end during intro for performance */}
            {!isLowEndMode && (
              <div 
                className="absolute inset-0 z-5 pointer-events-none" 
                style={{
                  background: 'radial-gradient(circle at center, rgba(147, 51, 234, 0.03) 0%, transparent 55%)',
                  opacity: isExploding ? Math.max(0, 1 - explosionProgress * 1.5) : 1,
                  transform: isExploding ? `scale(${1 + explosionProgress * 0.5})` : 'scale(1)',
                  transformOrigin: 'center center'
                }} 
              />
            )}

            {/* 3D Earth Scene */}
            {!(isLowEndMode && !introComplete) && (
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
            )}
          </div>

          {/* Bottom Section - Button + Data Stream */}
          <div style={{marginTop: '-13rem'}}>
            <MobileLayout 
              isExploding={isExploding} 
              mounted={mounted} 
              currentSlide={currentSlide} 
              setCurrentSlide={setCurrentSlide}
              animationProgress={containerProgress}
              position="bottom"
              isMobile={isMobile}
            />
          </div>
        </div>
      )}

      {/* =========================== */}
      {/* PERSISTENT ELEMENTS - Stay visible during all page transitions */}
      {/* =========================== */}
      {!isMobile && (
        <>
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

          {/* --- Persistent Logo (top-left) --- */}
          {/* Moves out with header at frame 9, but stays static if activeSection is clicked */}
          <div
            className="fixed pointer-events-auto z-50"
            style={{
              top: 'clamp(1.5rem, 2vw, 2rem)',
              left: 'clamp(1rem, 3vw, 2rem)',
              transform: activeSection ? 'none' : `translateX(${headerY * 2.5}px) translateY(${headerY * 2.5}px) scale(${headerScale})`,
              opacity: activeSection ? 1 : headerOpacity,
              transition: activeSection ? 'none' : undefined,
            }}
          >
            <img 
              src="images/landingpage/logo.png" 
              alt="Delta" 
              style={{
                width: 'clamp(4rem, 7vw, 12.5rem)', 
                height: 'clamp(4rem, 7vw, 12.5rem)',
                flexShrink: 0,
                cursor: activeSection ? 'pointer' : 'default',
                transition: 'transform 0.2s ease',
              }} 
              onClick={() => activeSection && setActiveSection(null)}
              title={activeSection ? 'Back to Landing' : ''}
              onMouseEnter={(e) => activeSection && (e.target.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            />
          </div>
        </>
      )}

      {/* =========================== */}
      {/* DESKTOP LAYOUT - Original absolute positioning */}
      {/* =========================== */}
      {!isMobile && (
        <div
          style={{
            opacity: activeSection ? 0 : 1,
            transform: activeSection ? 'scale(0.85)' : 'scale(1)',
            transformOrigin: 'center center',
            pointerEvents: activeSection ? 'none' : 'auto',
            transition: 'opacity 1.5s ease, transform 1.5s ease',
            position: 'absolute',
            inset: 0,
          }}
        >
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
            {/* Header HUD - Flies up based on scroll progress (without logo - logo is now persistent) */}
            <header 
              className="absolute top-0 left-0 w-full flex justify-between items-center pointer-events-auto"
              style={{
                transform: `translateY(calc(${headerY * 2.5}px - 1.5rem)) scale(${headerScale})`,
                opacity: headerOpacity,
                marginTop: window.innerWidth >= 768 ? 'clamp(3rem, 3.5vw, 3.5rem)' : 'clamp(1.75rem, 2.5vw, 2rem)',
                marginLeft: 'clamp(1rem, 3vw, 2rem)',
                paddingRight: 'clamp(1rem, 2vw, 1.5rem)',
                paddingBottom: 'clamp(0.75rem, 1.5vw, 1.5rem)'
              }}
            >
              <div className="flex items-center" style={{gap: 'clamp(0.75rem, 1.5vw, 1.5rem)'}}>
                {/* Invisible spacer where logo used to be */}
                <div 
                  style={{
                    width: 'clamp(4rem, 7vw, 12.5rem)', 
                    height: 'clamp(4rem, 7vw, 12.5rem)',
                    flexShrink: 0
                  }} 
                />
                <div style={{marginLeft: 'clamp(-1rem, -1vw, -1.5rem)'}}>
                  <h1 style={{
                    color: '#FFFEF0',
                    fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                    fontSize: 'clamp(1.2rem, 2vw, 2.25rem)',
                    fontWeight: 600,
                    lineHeight: 0.9,
                    filter: 'brightness(0.9)',
                    letterSpacing: 'clamp(0.1em, 0.15vw, 0.2em)'
                  }}>
                    DELTA<span style={{color: '#f59e0b'}}>WERKEN</span>
                  </h1>
                  <div className="flex gap-2 items-center" style={{marginTop: 'clamp(0.25rem, 0.5vw, 0.5rem)'}}>
                    <span className="rounded-full bg-green-500 animate-ping" style={{
                      width: 'clamp(0.35rem, 0.5vw, 0.5rem)',
                      height: 'clamp(0.35rem, 0.5vw, 0.5rem)',
                      minWidth: 'clamp(0.35rem, 0.5vw, 0.5rem)',
                      minHeight: 'clamp(0.35rem, 0.5vw, 0.5rem)'
                    }}></span>
                    <span className="text-gray-400 tracking-widest" style={{
                      fontSize: 'clamp(0.6rem, 0.9vw, 0.85rem)'
                    }}>SCHADUW WERK {'/'}{'/'} V.4.9</span>
                  </div>
                </div>
              </div>
            </header>
        
            {/* Desktop TimeSync - Floats out with header at frame 9 */}
            <div className="absolute pointer-events-auto" style={{
              right: '1.5rem',
              top: '2.5rem',
              zIndex: 50,
              transform: `translateX(${-headerY * 2.5}px) translateY(${headerY * 2.5}px) scale(${headerScale})`,
              opacity: headerOpacity,
            }}>
              <TimeSync isMobile={false} />
            </div>

            {/* --- Scroll Prompt (Desktop) OR Start Button (Low-End) --- */}
            <div 
              className="absolute left-0 right-0 flex flex-col items-center justify-center gap-4 z-50"
              style={{
                bottom: 'calc(20% - 3rem)',
                opacity: promptOpacity,
                transform: promptOpacity > 0 ? 'scale(1)' : 'scale(1.5)',
              }}
            >
              {/* LOW-END: Show "Start Experience" button instead of scroll prompt */}
              {isLowEndMode ? (
                <button
                  onClick={triggerLowEndAnimation}
                  disabled={lowEndAnimating}
                  className="relative flex flex-col items-center gap-2 bg-black/60 backdrop-blur-md rounded-sm cursor-pointer hover:bg-black/80 transition-all duration-300 pointer-events-auto hover:scale-105"
                  style={{
                    border: '2px solid rgba(245, 158, 11, 0.7)',
                    padding: '1rem 3rem',
                    boxShadow: '0 0 20px rgba(245, 158, 11, 0.3)',
                    transform: 'scale(0.7) translateY(-4rem)',
                    transformOrigin: 'center center'
                  }}
                >
                  <span className="tracking-[0.25em] font-bold" style={{
                    color: lowEndAnimating ? 'rgba(255,255,255,0.5)' : '#f59e0b', 
                    fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                    fontSize: '1.1rem'
                  }}>
                    {lowEndAnimating ? 'SYNCHRONISING...' : 'START EXPERIENCE'}
                  </span>
                  <div className="absolute top-0 left-0 border-t-2 border-l-2" style={{
                    width: '0.75rem',
                    height: '0.75rem',
                    borderColor: 'rgba(245, 158, 11, 0.7)'
                  }}></div>
                  <div className="absolute bottom-0 right-0 border-b-2 border-r-2" style={{
                    width: '0.75rem',
                    height: '0.75rem',
                    borderColor: 'rgba(245, 158, 11, 0.7)'
                  }}></div>
                </button>
              ) : (
                /* NORMAL: Scroll prompt for high/medium-end devices */
                <>
                  <div className="relative flex flex-col items-center gap-2 bg-black/40 backdrop-blur-md rounded-sm pointer-events-none" style={{
                    border: '1px solid rgba(21, 179, 21, 0.4)',
                    padding: '0.625rem 2rem',
                    transform: window.innerWidth >= 1325 ? 'scale(1)' : window.innerWidth >= 1100 ? 'scale(0.85) translateY(-0.7rem)' : window.innerWidth >= 768 ? 'scale(0.7)' : 'scale(1)',
                    transformOrigin: 'center bottom'
                  }}>
                    <span className="tracking-[0.25em] font-bold" style={{
                      color: 'white', 
                      fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                      fontSize: '1rem'
                    }}>{window.innerWidth >= 1100 ? 'SCROLL' : 'SWIPE'} {window.innerWidth >= 1100 ? '' : '↓'} = SYNCHRONISATIE</span>
                    <div className="absolute top-0 left-0 border-t border-l" style={{
                      width: '0.5rem',
                      height: '0.5rem',
                      borderColor: 'rgba(21, 179, 21, 0.4)'
                    }}></div>
                    <div className="absolute bottom-0 right-0 border-b border-r" style={{
                      width: '0.5rem',
                      height: '0.5rem',
                      borderColor: 'rgba(21, 179, 21, 0.4)'
                    }}></div>
                  </div>
                  <div className="flex flex-col items-center gap-2 animate-bounce pointer-events-none">
                    <div className="w-6 h-10 border-2 rounded-full flex justify-center pt-2" style={{borderColor: 'rgba(245, 158, 11, 0.5)'}}></div>
                  </div>
                </>
              )}
            </div>

            {/* --- Floating Containers (Orbital View) --- */}
            <DesktopLayout 
              isExploding={isExploding} 
              mounted={mounted} 
              currentSlide={currentSlide} 
              setCurrentSlide={setCurrentSlide}
              animationProgress={containerProgress}
              setActiveSection={setActiveSection}
            />

            {/* --- SYSTEM INNER CONTENT (Shown after Zoom) --- */}
            <div 
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{
                opacity: systemOpacity,
                transform: `scale(${systemScale}) translateY(${systemTranslateY}px)`
              }}
            >
              <div className={`w-[80vw] h-[80vh] flex flex-col items-center justify-center ${isSystem ? 'pointer-events-auto' : 'pointer-events-none'}`} style={{transform: `translateY(${entityCounterOffset}px)`}}>
                {/* Pyramid Layer Labels are rendered as static DOM elements */}
              </div>
            </div>
            
            {/* === SCROLL-ANIMATED PYRAMID LAYER LABELS === */}
            {/* Labels animate with pyramidScrollProgress to match 3D layer movement */}
            {isSystem && (() => {
              // Calculate label positions based on scroll progress
              // Each label (1-4) animates over its corresponding scroll range
              // Labels float from entity center (bottom of blue diamond) down to final positions
              const totalMovable = 4; // Layers 1-4 are movable
              
              // Viewport dimensions for calculations
              const vw = window.innerWidth / 100;
              
              // Helper to calculate animation progress for each label
              // Layer 1 starts almost immediately (at 0.02 progress = ~2 scroll ticks)
              const getLabelAnimProgress = (labelIndex) => {
                const startOffset = 0.02; // Start layer 1 at 2% progress (2-3 scroll ticks)
                const adjustedProgress = Math.max(0, (pyramidScrollProgress - startOffset) / (1 - startOffset));
                const rangeStart = (labelIndex - 1) / totalMovable;
                const rangeEnd = labelIndex / totalMovable;
                if (adjustedProgress >= rangeEnd) return 1;
                if (adjustedProgress <= rangeStart) return 0;
                return (adjustedProgress - rangeStart) / (rangeEnd - rangeStart);
              };
              
              // Fast opacity - reaches 100% very quickly (after ~10% of layer's animation)
              const getOpacity = (progress) => {
                if (progress <= 0) return 0;
                return Math.min(progress * 10, 1); // Full opacity at 10% progress
              };
              
              // Easing function (smoothstep)
              const ease = (t) => t * t * (3 - 2 * t);
              
              // Entity START position - bottom of the blue diamond in the entity cube
              // This is where ALL labels (1-4) emerge FROM - dead center horizontally
              const entityStartVh = 72; // Higher up - bottom of blue diamond
              
              // Final vertical positions for each label (in vh from bottom)
              const finalVhPositions = [21, 29, 37, 45, 53]; // Evenly spaced pyramid layers
              
              // Final horizontal offset from edge (in vw) - MATCHES LABEL 0's positioning
              const finalHorizontalVw = 6; // 6vw from edge - same as label 0
              
              // Calculate vertical position
              const getInterpolatedBottom = (labelIndex, progress) => {
                const easedProgress = ease(progress);
                const startVh = entityStartVh;
                const endVh = finalVhPositions[labelIndex];
                const currentVh = startVh - (startVh - endVh) * easedProgress;
                return `${currentVh}vh`;
              };
              
              // Scale animation - starts small (0.15), ends at full scale
              const getScale = (progress) => {
                const easedProgress = ease(progress);
                const minScale = 0.15;
                return minScale + (1 - minScale) * easedProgress;
              };
              
              // Base scale - use vw for responsive scaling
              const baseScale = Math.max(0.8, Math.min(1.4, vw * 0.055));
              
              return (
                <>
                  {/* Layer 0 - Right side - COMPLETELY STATIC (just fades in, no movement) */}
                  <div 
                    className="absolute pointer-events-auto"
                    style={{
                      right: `${finalHorizontalVw}vw`,
                      bottom: `${finalVhPositions[0]}vh`,
                      opacity: layerState.introComplete ? systemOpacity : 0,
                      visibility: layerState.introComplete ? 'visible' : 'hidden',
                      transform: `scale(${baseScale})`,
                      transformOrigin: 'right center',
                      zIndex: 100,
                      transition: 'opacity 0.5s ease'
                    }}
                  >
                    <HoloLabel
                      layerIndex={0}
                      showButton={layerState.completedLayerIndex === 0 && !layerState.isIntroActive}
                      isLast={false}
                      alignment="right"
                      onSend={() => {}}
                      isSent={layerState.isGoldMode}
                    />
                  </div>
                  
                  {/* Layer 1 - Left side - SCROLL ANIMATED from entity center */}
                  {(() => {
                    const progress = getLabelAnimProgress(1);
                    const easedProgress = ease(progress);
                    const scale = getScale(progress);
                    // Start at center (left: 50% with translateX(-50%))
                    // End at left: 6vw with translateX(0) - matching label 0's mirrored position
                    const startLeft = 50; // percent
                    const endLeft = finalHorizontalVw; // vw
                    // Interpolate translateX from -50% to 0%
                    const translateX = -50 + (50 * easedProgress);
                    // Interpolate left position (convert % to vw equivalent at start)
                    const currentLeft = startLeft + (endLeft - startLeft) * easedProgress;
                    return (
                      <div 
                        className="absolute pointer-events-auto"
                        style={{
                          left: progress === 0 ? '50%' : `${currentLeft}vw`,
                          bottom: getInterpolatedBottom(1, progress),
                          opacity: getOpacity(progress) * systemOpacity,
                          visibility: progress > 0 ? 'visible' : 'hidden',
                          transform: `scale(${baseScale * scale}) translateX(${translateX}%)`,
                          transformOrigin: 'left center',
                          zIndex: 101
                        }}
                      >
                        <HoloLabel
                          layerIndex={1}
                          showButton={layerState.completedLayerIndex === 1 && !layerState.isIntroActive}
                          isLast={false}
                          alignment="left"
                          onSend={() => {}}
                          isSent={layerState.isGoldMode}
                        />
                      </div>
                    );
                  })()}
                  
                  {/* Layer 2 - Right side - SCROLL ANIMATED from entity center */}
                  {(() => {
                    const progress = getLabelAnimProgress(2);
                    const easedProgress = ease(progress);
                    const scale = getScale(progress);
                    // Start at center, end at right: 6vw (like label 0)
                    // Use right positioning to match label 0 exactly
                    const startRight = 50; // percent from right
                    const endRight = finalHorizontalVw; // vw
                    // Interpolate translateX from 50% to 0%
                    const translateX = 50 - (50 * easedProgress);
                    const currentRight = startRight + (endRight - startRight) * easedProgress;
                    return (
                      <div 
                        className="absolute pointer-events-auto"
                        style={{
                          right: progress === 0 ? '50%' : `${currentRight}vw`,
                          bottom: getInterpolatedBottom(2, progress),
                          opacity: getOpacity(progress) * systemOpacity,
                          visibility: progress > 0 ? 'visible' : 'hidden',
                          transform: `scale(${baseScale * scale}) translateX(${translateX}%)`,
                          transformOrigin: 'right center',
                          zIndex: 102
                        }}
                      >
                        <HoloLabel
                          layerIndex={2}
                          showButton={layerState.completedLayerIndex === 2 && !layerState.isIntroActive}
                          isLast={false}
                          alignment="right"
                          onSend={() => {}}
                          isSent={layerState.isGoldMode}
                        />
                      </div>
                    );
                  })()}
                  
                  {/* Layer 3 - Left side - SCROLL ANIMATED from entity center */}
                  {(() => {
                    const progress = getLabelAnimProgress(3);
                    const easedProgress = ease(progress);
                    const scale = getScale(progress);
                    const startLeft = 50;
                    const endLeft = finalHorizontalVw;
                    const translateX = -50 + (50 * easedProgress);
                    const currentLeft = startLeft + (endLeft - startLeft) * easedProgress;
                    return (
                      <div 
                        className="absolute pointer-events-auto"
                        style={{
                          left: progress === 0 ? '50%' : `${currentLeft}vw`,
                          bottom: getInterpolatedBottom(3, progress),
                          opacity: getOpacity(progress) * systemOpacity,
                          visibility: progress > 0 ? 'visible' : 'hidden',
                          transform: `scale(${baseScale * scale}) translateX(${translateX}%)`,
                          transformOrigin: 'left center',
                          zIndex: 103
                        }}
                      >
                        <HoloLabel
                          layerIndex={3}
                          showButton={layerState.completedLayerIndex === 3 && !layerState.isIntroActive}
                          isLast={false}
                          alignment="left"
                          onSend={() => {}}
                          isSent={layerState.isGoldMode}
                        />
                      </div>
                    );
                  })()}
                  
                  {/* Layer 4 - Right side (FINAL LAYER) - SCROLL ANIMATED from entity center */}
                  {(() => {
                    const progress = getLabelAnimProgress(4);
                    const easedProgress = ease(progress);
                    const scale = getScale(progress);
                    const startRight = 50;
                    const endRight = finalHorizontalVw;
                    const translateX = 50 - (50 * easedProgress);
                    const currentRight = startRight + (endRight - startRight) * easedProgress;
                    return (
                      <div 
                        className="absolute pointer-events-auto"
                        style={{
                          right: progress === 0 ? '50%' : `${currentRight}vw`,
                          bottom: getInterpolatedBottom(4, progress),
                          opacity: getOpacity(progress) * systemOpacity,
                          visibility: progress > 0 ? 'visible' : 'hidden',
                          transform: `scale(${baseScale * scale}) translateX(${translateX}%)`,
                          transformOrigin: 'right center',
                          zIndex: 104
                        }}
                      >
                        <HoloLabel
                          layerIndex={4}
                          showButton={layerState.completedLayerIndex === 4 && !layerState.isIntroActive}
                          isLast={true}
                          alignment="right"
                          onSend={triggerGoldMode}
                          isSent={layerState.isGoldMode}
                        />
                      </div>
                    );
                  })()}
                </>
              );
            })()}
              
            {/* Back Button - positioned separately from entity transforms */}
            <button 
              onClick={handleReset}
              className="absolute group flex items-center gap-3 rounded-sm transition-all duration-300 backdrop-blur-sm px-4 py-2 mb-3"
              style={{
                border: '1px solid rgba(147, 51, 234, 0.3)',
                background: 'rgba(10, 5, 16, 0.6)',
                bottom: window.innerWidth >= 1280 ? '2rem' : window.innerWidth >= 768 ? '0.5rem' : '7rem', // Laptop/Tablet: 2rem lower
                left: '50%',
                transform: 'translateX(-50%)',
                pointerEvents: isSystem ? 'auto' : 'none',
                opacity: isSystem ? 1 : 0,
                visibility: isSystem ? 'visible' : 'hidden'
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
              <div className="flex items-center justify-center w-5 h-5" style={{color: 'rgba(147, 51, 234, 0.8)'}}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform w-4 h-4">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </div>
              <span className="tracking-[0.2em] uppercase text-xs" style={{color: 'rgba(255, 254, 240, 0.7)', fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif"}}>DELTAWERKEN</span>
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l" style={{borderColor: 'rgba(147, 51, 234, 0.5)'}}></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r" style={{borderColor: 'rgba(147, 51, 234, 0.5)'}}></div>
            </button>
          </div>
        </div>
      )}

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
        Frame: {currentFrame}/{TOTAL_ANIMATION_FRAMES}
      </div>

      {/* ========================= */}
      {/* PAGE COMPONENTS          */}
      {/* ========================= */}
      <FilosofiePage 
        isVisible={activeSection === 'filosofie'} 
        onBack={() => setActiveSection(null)} 
      />
      <GardensPage 
        isVisible={activeSection === 'gardens'} 
        onBack={() => setActiveSection(null)} 
      />
      <DataPage 
        isVisible={activeSection === 'monitor'} 
        onBack={() => setActiveSection(null)} 
      />
      <LoginPage 
        isVisible={activeSection === 'login'} 
        onBack={() => setActiveSection(null)} 
      />
      <EyedentityPage 
        isVisible={activeSection === 'menu'} 
        onBack={() => setActiveSection(null)} 
      />
    </main>
  );
};

export default App;
