import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense, lazy } from 'react';
import NebulaBackground from './components/NebulaBackground';
import NebulaOverlay from './components/NebulaOverlay';
import { assessmentSubjects } from './pages/assessment/assessmentData';
import { getPerformanceSettings } from './utils/performanceMonitor';
import { preloadAll, preloadInBackground } from './utils/preloadUtils';
import { useLanguage } from './contexts/LanguageContext';

// Retry wrapper: if a chunk fails (stale deploy), reload the page once.
const lazyRetry = (fn) => lazy(() =>
  fn().catch(() => {
    const reloaded = sessionStorage.getItem('chunk_reload');
    if (!reloaded) {
      sessionStorage.setItem('chunk_reload', '1');
      window.location.reload();
      return new Promise(() => {}); // hang until reload
    }
    sessionStorage.removeItem('chunk_reload');
    return fn(); // second attempt — surface the real error
  })
);

// Lazy-load ALL heavy components so the main bundle stays tiny.
const HoloEarth = lazyRetry(() => import('./components/orbital/HoloEarth'));
const DesktopLayout = lazyRetry(() => import('./components/orbital/DesktopLayout'));
const AssessmentIntro = lazyRetry(() => import('./components/assessment/AssessmentIntro'));
const AssessmentCard = lazyRetry(() => import('./components/assessment/AssessmentCard'));
const AssessmentUpload = lazyRetry(() => import('./components/assessment/AssessmentUpload'));
const AssessmentLayerPanel = lazyRetry(() => import('./components/assessment/AssessmentLayerPanel'));
const AssessmentResultsModal = lazyRetry(() => import('./components/assessment/AssessmentResultsModal'));
const FilosofiePage = lazyRetry(() => import('./pages/FilosofiePage'));
const GardensPage = lazyRetry(() => import('./pages/GardensPage'));
const DataPage = lazyRetry(() => import('./pages/DataPage'));
const LoginPage = lazyRetry(() => import('./pages/LoginPage'));
const EyedentityPage = lazyRetry(() => import('./pages/EyedentityPage'));

// ============================================
// GRID MAP NAVIGATION CONFIGURATION
// Creates illusion of floating/panning across a massive grid
// Transform: translate(-x*100vw, -y*100vh)
// Positive x = content moves LEFT (we float RIGHT)
// Positive y = content moves UP (we float DOWN)
// Each section is 1+ viewport away to prevent overlap
// ============================================
const GRID_POSITIONS = {
  main: { x: 0, y: 0 },              // Center - HoloEarth main page
  filosofie: { x: -1.2, y: -1.1 },   // Top-left button → far top-left on map
  gardens: { x: 1.3, y: 1.2 },       // Bottom-RIGHT button → far bottom-right on map
  monitor: { x: -1.3, y: 1.2 },      // Bottom-LEFT button → far bottom-left on map
  login: { x: 0, y: 1 },             // Eyedentity (right verbindingsmenu) → 1 viewport below
  menu: { x: 0, y: 2 },              // Blackhole (left verbindingsmenu) → 2 viewports below
};
const MAP_TRANSITION_DURATION = 1800; // ms for smooth curved map movement (longer for more distance)

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
// Section 1 (frame 0): Label disappears, chunks become visible
// Section 2 (frames 1-47): Chunks and particles explosion (47 frames for smooth animation)
// Section 3 (frame 48): Pyramid snaps to bottom, system visible — sharp cut
// Total: 49 frames (0-48)
// ============================================
const SECTION_1_FRAMES = 1;     // Label disappears, chunks visible (frame 0)
const SECTION_2_FRAMES = 47;    // Chunks and particles explosion - maximized for smooth flow
const HEADER_START_FRAME = 12;  // Header/containers start vanishing mid-explosion
const SECTION_3_FRAMES = 1;     // Pyramid snaps down — sharp ending (frame 48)
// ============================================

const App = () => {
  const [mounted, setMounted] = useState(false);
  const [mountNebula, setMountNebula] = useState(false); // Mount nebula after imports are done
  const nebulaReadyRef = useRef(null); // resolves when NebulaBackground fires onReady
  const { language, toggleLanguage, t, tArray } = useLanguage();
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
  
  // ============================================
  // ASSESSMENT STATE - Replaces the old label system
  // Phases: 'hidden' → 'intro' → 'layers' → 'convergence' → 'results'
  // ============================================
  const [assessmentPhase, setAssessmentPhase] = useState('hidden'); // Current assessment phase
  const [assessmentLevel, setAssessmentLevel] = useState(null); // 'quick' | 'standard' | 'deep'
  const [currentSubjectIndex, setCurrentSubjectIndex] = useState(0); // 0-4 for 5 subjects
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); // 0-5 for 6 questions per subject
  const [assessmentAnswers, setAssessmentAnswers] = useState([]); // Array of {subjectIndex, questionIndex, answer}
  const [uploadedFiles, setUploadedFiles] = useState([]); // Files for deep assessment
  const [currentLayerIndex, setCurrentLayerIndex] = useState(0); // 0-4 for 5 layers
  const [layerAnswers, setLayerAnswers] = useState({}); // { layerIndex: { questionId: answerId } }
  const [assessmentScrollEnabled, setAssessmentScrollEnabled] = useState(false); // Controls when user can scroll to next layer
  const [convergenceProgress, setConvergenceProgress] = useState(0); // 0-1 progress for panels floating back to entity
  const [gatherProgress, setGatherProgress] = useState(0); // 0-1 progress for cards gathering to center stack
  const [staircaseStep, setStaircaseStep] = useState(-1); // -1=waiting, 0=absorb cards into pyramid, 1=fold pyramid up, 2=done
  const [foldProgress, setFoldProgress] = useState(0); // 0-1 for pyramid fold-up animation (3D layers)
  const [coreScaleMultiplier, setCoreScaleMultiplier] = useState(1); // 1-5 scale for inner core growth
  const [resultsModalProgress, setResultsModalProgress] = useState(0); // 0-1 progress for results modal floating out
  const [resultsLoadingProgress, setResultsLoadingProgress] = useState(0); // 0-1 loading bar progress (AI thinking time)
  const [resultsPoetryIndex, setResultsPoetryIndex] = useState(0); // Current poetry slide index
  const [aiAnalysisReady, setAiAnalysisReady] = useState(false); // True when AI response received
  const [showLoginFromResults, setShowLoginFromResults] = useState(false); // Show login modal after results
  
  // Poetry slides for the results loading screen
  const poetrySlides = useMemo(() => [
    {
      title: t('poetry.slide1.title'),
      lines: tArray('poetry.slide1.lines')
    },
    {
      title: t('poetry.slide2.title'),
      lines: tArray('poetry.slide2.lines')
    },
    {
      title: t('poetry.slide3.title'),
      lines: tArray('poetry.slide3.lines')
    },
    {
      title: t('poetry.slide4.title'),
      lines: tArray('poetry.slide4.lines')
    },
    {
      title: t('poetry.slide5.title'),
      lines: tArray('poetry.slide5.lines')
    },
    {
      title: t('poetry.slide6.title'),
      lines: tArray('poetry.slide6.lines')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [language]);
  
  // Assessment data: 5 subjects with 6 questions each (30 total)
  // assessmentSubjects is imported from './pages/assessment/assessmentData' (60 Dutch questions, 12 per layer)
  
  // Get total questions based on level (5 layers × questions per layer)
  const getTotalQuestions = (level) => {
    switch (level) {
      case 'quick': return 15; // 3 questions per subject
      case 'standard': return 60; // 12 per layer × 5 layers
      case 'deep': return 60; // 12 per layer × 5 layers + upload
      default: return 60;
    }
  };
  
  // Get questions per subject based on level
  const getQuestionsPerSubject = (level) => {
    return level === 'quick' ? 3 : 12;
  };
  
  // eslint-disable-next-line no-unused-vars
  const [mobileScrollLocked, setMobileScrollLocked] = useState(false); // Track when mobile scroll should be hijacked
  const [activeSection, setActiveSection] = useState(null); // Track active section page (filosofie, gardens, monitor, menu)
  const [autoSlideEnabled, setAutoSlideEnabled] = useState(true); // Track if auto-slide is enabled
  const [gardensBrandIndex, setGardensBrandIndex] = useState(0); // Captured brand index when opening gardens
  
  // ============================================
  // MOBILE LOGIN STATE
  // ============================================
  const [showMobileLogin, setShowMobileLogin] = useState(false);

  const [mobileActiveIndex] = useState(0); // Currently active item index
  
  // ============================================
  // MAP NAVIGATION STATE - Smooth curved panning
  // ============================================
  const [mapPosition, setMapPosition] = useState({ x: 0, y: 0 }); // Current grid position
  const [isMapAnimating, setIsMapAnimating] = useState(false);
  const mapAnimationRef = useRef(null);
  const mapStartPosRef = useRef({ x: 0, y: 0 });
  const mapTargetPosRef = useRef({ x: 0, y: 0 });
  const mapCurveOffsetRef = useRef({ x: 0, y: 0 });
  const mapStartTimeRef = useRef(0);
  
  const isMobile = useIsMobile();
  const containerRef = useRef(null);
  const earthSectionRef = useRef(null);
  const lowEndAnimationRef = useRef(null); // Ref for low-end animation interval
  const isScrolling = useRef(false); // Debounce to prevent multiple triggers per scroll
  const mobileScrollLockedRef = useRef(false); // Ref for use in event handlers
  const autoSlideTimeoutRef = useRef(null); // Ref for auto-slide re-enable timeout

  // Handle mobile wheel rotation changes - sync content with wheel
  const pauseAutoSlide = useCallback(() => {
    setAutoSlideEnabled(false);
    if (autoSlideTimeoutRef.current) {
      clearTimeout(autoSlideTimeoutRef.current);
    }
    autoSlideTimeoutRef.current = setTimeout(() => {
      setAutoSlideEnabled(true);
    }, 9000);
  }, []);

  // ============================================
  // MAP NAVIGATION - Precise directional movement
  // Content exits up-left, new content enters from bottom-right
  // ============================================
  const calculateCurveOffset = useCallback((startPos, endPos) => {
    // Subtle curve for natural feel - very minimal
    const dx = endPos.x - startPos.x;
    const dy = endPos.y - startPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Very subtle perpendicular offset (10% of previous)
    const curveStrength = distance * 0.08;
    
    // Perpendicular direction
    const perpX = -dy / (distance || 1);
    const perpY = dx / (distance || 1);
    
    return {
      x: perpX * curveStrength,
      y: perpY * curveStrength
    };
  }, []);

  const navigateToSection = useCallback((section) => {
    const target = GRID_POSITIONS[section] || GRID_POSITIONS.main;
    const start = { ...mapPosition };
    
    // Don't animate if already at target
    if (Math.abs(target.x - start.x) < 0.01 && Math.abs(target.y - start.y) < 0.01) {
      setActiveSection(section === 'main' ? null : section);
      return;
    }
    
    // Calculate curve offset for natural movement
    const curve = calculateCurveOffset(start, target);
    
    mapStartPosRef.current = start;
    mapTargetPosRef.current = target;
    mapCurveOffsetRef.current = curve;
    mapStartTimeRef.current = performance.now();
    setIsMapAnimating(true);
    setActiveSection(section === 'main' ? null : section);
  }, [mapPosition, calculateCurveOffset]);

  // Map animation loop
  useEffect(() => {
    if (!isMapAnimating) return;

    const animate = (currentTime) => {
      const elapsed = currentTime - mapStartTimeRef.current;
      const progress = Math.min(elapsed / MAP_TRANSITION_DURATION, 1);
      
      // Smooth ease-in-out cubic
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      // Bezier-like curve: at progress 0.5, we're at the peak of the curve
      const curveFactor = Math.sin(progress * Math.PI); // 0 -> 1 -> 0
      
      const start = mapStartPosRef.current;
      const target = mapTargetPosRef.current;
      const curve = mapCurveOffsetRef.current;
      
      const newX = start.x + (target.x - start.x) * eased + curve.x * curveFactor;
      const newY = start.y + (target.y - start.y) * eased + curve.y * curveFactor;
      
      setMapPosition({ x: newX, y: newY });
      
      if (progress < 1) {
        mapAnimationRef.current = requestAnimationFrame(animate);
      } else {
        setIsMapAnimating(false);
        setMapPosition(target);
      }
    };

    mapAnimationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (mapAnimationRef.current) {
        cancelAnimationFrame(mapAnimationRef.current);
      }
    };
  }, [isMapAnimating]);

  // Section lock: on deployed (non-localhost) sites, sections stay locked regardless of passkey.
  // The passkey gate in index.html controls initial site access, but content sections remain disabled.
  const isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const shouldShowLock = !isLocalhost;

  // Handler for opening sections - navigate on map
  const handleOpenSection = useCallback((section) => {
    // Beta lock: block locked sections
    const lockedSections = ['gardens', 'monitor', 'filosofie'];
    if (shouldShowLock && lockedSections.includes(section)) {
      return;
    }
    // Capture current slide when opening gardens section
    if (section === 'gardens') {
      setGardensBrandIndex(currentSlide);
    }
    navigateToSection(section);
  }, [navigateToSection, currentSlide, shouldShowLock]);

  // Handler for closing sections - navigate back to main
  const handleCloseSection = useCallback(() => {
    navigateToSection('main');
  }, [navigateToSection]);

  useEffect(() => {
    setMounted(true);
    // Detect low-end device on mount
    const performanceSettings = getPerformanceSettings();
    setIsLowEndMode(performanceSettings.tier === 'LOW');
    
    // AbortController prevents StrictMode double-fire from causing races
    const abortController = new AbortController();
    
    // Start preloading all heavy resources immediately
    // Loading screen stays until nebula background is fully rendered
    const maxLoadTime = 12000;
    let hasEnded = false;
    
    const endLoadingScreen = () => {
      if (hasEnded || abortController.signal.aborted) return;
      hasEnded = true;
      // Signal to the overlay that the app is ready.
      // If passkey was already entered, this dismisses immediately.
      // If user is still typing the passkey, it will dismiss once they unlock.
      if (window.__gflAppReady) {
        window.__gflAppReady();
      } else {
        // Fallback: just remove the overlay
        const overlay = document.getElementById('gfl-loading-overlay');
        if (overlay) {
          overlay.style.opacity = '0';
          overlay.style.pointerEvents = 'none';
          setTimeout(() => { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 500);
        }
      }
    };

    // Create a promise that resolves when NebulaBackground fires onReady
    let resolveNebulaReady;
    const nebulaReadyPromise = new Promise(resolve => { resolveNebulaReady = resolve; });
    nebulaReadyRef.current = resolveNebulaReady;

    // THREE-PHASE LOADING:
    // Phase 1 (0→80%): Download + evaluate Three.js and app components
    // Phase 2 (80→95%): Mount NebulaBackground, wait for shader compile + first render
    // Phase 3 (95→100%): Nebula ready → end loading screen
    preloadAll(null, { signal: abortController.signal }).then(async () => {
      if (abortController.signal.aborted) return;
      console.log('[App] JS chunks loaded — mounting nebula background');
      // Mount nebula — shader compilation will block the thread
      setMountNebula(true);
      // Give React a tick to mount the canvas before WebGL init blocks the thread
      await new Promise(r => setTimeout(r, 16));
      if (abortController.signal.aborted) return;
      // Bar stays at 81% while shaders compile (thread blocked, can't animate)
      
      // Wait for nebula to signal it’s rendered its first frame
      return nebulaReadyPromise;
    }).then(() => {
      if (abortController.signal.aborted) return;
      console.log('[App] Nebula background ready');
      // Nebula is rendered — end loading screen
      endLoadingScreen();
    }).catch(() => {
      if (abortController.signal.aborted) return;
      console.warn('[App] Preloading failed, continuing anyway');
      setMountNebula(true);
      endLoadingScreen();
    });
    
    // Fallback: max load time even if something hangs
    const maxTimer = setTimeout(() => {
      if (!hasEnded && !abortController.signal.aborted) {
        console.log('[App] Max load time reached, continuing');
        setMountNebula(true);
        endLoadingScreen();
        preloadInBackground();
      }
    }, maxLoadTime);
    
    return () => {
      abortController.abort();
      clearTimeout(maxTimer);
    };
  }, []);

  // LOW-END ONLY APPLIES TO DESKTOPS/LAPTOPS
  // Phones, tablets, and mobile viewports always get normal (HIGH) build
  useEffect(() => {
    if (isMobile) {
      setIsLowEndMode(false); // Mobile = always normal build
    } else {
      // Desktop/laptop: check hardware for low-end detection
      const performanceSettings = getPerformanceSettings();
      setIsLowEndMode(performanceSettings.tier === 'LOW');
    }
  }, [isMobile]);

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
            // Only lock scroll via JS when animation is active
            if (window.innerWidth < 768) {
              document.body.style.setProperty('overflow', 'hidden', 'important');
            }
          } else if (!entry.isIntersecting || entry.intersectionRatio < 0.5) {
            // Earth section is mostly out of view - unlock scroll
            setMobileScrollLocked(false);
            mobileScrollLockedRef.current = false;
            // Remove inline style to let CSS media query take over
            document.body.style.removeProperty('overflow');
          }
        });
      },
      { threshold: [0.5, 0.98] }
    );
    
    observer.observe(earthSectionRef.current);
    
    return () => {
      observer.disconnect();
      document.body.style.removeProperty('overflow');
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
  // Only works when viewing HoloEarth/Deltawerken (activeSection === null AND mobileActiveIndex === 0)
  const handleWheel = useCallback((e) => {
    // Don't process scroll if viewing other content sections
    if (activeSection !== null) return;
    
    // Don't process scroll when assessment results modal is open
    if (assessmentPhase === 'results' || assessmentPhase === 'convergence') return;
    
    // On mobile, only process if Deltawerken is the active nav item (index 0)
    if (window.innerWidth < 768 && mobileActiveIndex !== 0) return;
    
    // LOW-END: Skip scroll during animation, but allow after animation completes for pyramid control
    if (isLowEndMode && (lowEndAnimating || currentFrame < MAX_FRAME)) return;
    
    const direction = e.deltaY > 0 ? 1 : -1; // Down = forward, Up = backward
    
    // On mobile: Re-enable scroll lock when at frame 0 and scrolling forward
    if (window.innerWidth < 768 && !mobileScrollLockedRef.current) {
      // Only allow re-locking if at frame 0 and scrolling forward (down)
      if (currentFrame === 0 && direction > 0) {
        setMobileScrollLocked(true);
        mobileScrollLockedRef.current = true;
        document.body.style.setProperty('overflow', 'hidden', 'important');
      } else {
        // Not at start or scrolling backward - don't capture scroll
        return;
      }
    }
    
    e.preventDefault();
    
    // Debounce to ensure one scroll tick = one frame
    if (isScrolling.current) return;
    isScrolling.current = true;
    
    // If at max frame AND intro is complete, control pyramid scroll instead
    if (currentFrame >= MAX_FRAME && introComplete) {
      setPyramidScrollProgress(prev => {
        const step = 0.05; // 5% per scroll tick - slower for smoother layer animation
        let newProgress = Math.max(0, Math.min(1, prev + (direction * step)));
        
        // SCROLL GATING via dynamic cap:
        // - Scroll enabled (layer saved): allow forward to next layer threshold
        // - Scroll disabled (layer unsaved): cap at CURRENT layer threshold
        //   so the user can scroll the card back out but not beyond
        if (assessmentPhase === 'layers' && direction > 0) {
          const maxProgress = assessmentScrollEnabled
            ? Math.min(1, (currentLayerIndex + 1) / 4)
            : (currentLayerIndex / 4);
          newProgress = Math.min(newProgress, maxProgress);
          // (scroll progress updated)
        }
        
        // Mobile: If scrolling down and at end, unlock scroll to continue page scroll
        if (window.innerWidth < 768 && direction > 0 && prev >= 1) {
          setMobileScrollLocked(false);
          mobileScrollLockedRef.current = false;
          document.body.style.overflow = '';
          return 1;
        }
        
        // If scrolling up and at 0, allow returning to orbital animation
        // BUT NOT during assessment — stay locked at progress 0
        if (direction < 0 && prev <= 0) {
          if (assessmentPhase !== 'layers' && assessmentPhase !== 'convergence') {
            setCurrentFrame(prevFrame => Math.max(0, prevFrame - 1));
          }
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
  }, [currentFrame, introComplete, MAX_FRAME, isLowEndMode, lowEndAnimating, activeSection, mobileActiveIndex, assessmentPhase, assessmentScrollEnabled, currentLayerIndex]);

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

  // ============================================
  // ASSESSMENT HANDLERS
  // ============================================
  
  // Show intro modal when entity intro completes
  useEffect(() => {
    if (layerState.introComplete && assessmentPhase === 'hidden') {
      setAssessmentPhase('intro');
    }
  }, [layerState.introComplete, assessmentPhase]);
  
  // Start assessment with selected level
  const handleAssessmentStart = useCallback((levelId) => {
    setAssessmentLevel(levelId);
    setCurrentSubjectIndex(0);
    setCurrentQuestionIndex(0);
    setAssessmentAnswers([]);
    setCurrentLayerIndex(0);
    setLayerAnswers({});
    setPyramidScrollProgress(0); // Reset scroll so layers start from zero
    setAssessmentScrollEnabled(false);
    setAssessmentPhase('layers');
  }, []);
  
  // Full reset of all assessment/pyramid state — used when closing results, returning to landing, etc.
  const resetAssessmentState = useCallback(() => {
    setAssessmentPhase('hidden');
    setAssessmentLevel(null);
    setCurrentSubjectIndex(0);
    setCurrentQuestionIndex(0);
    setAssessmentAnswers([]);
    setUploadedFiles([]);
    setCurrentLayerIndex(0);
    setLayerAnswers({});
    setAssessmentScrollEnabled(false);
    setConvergenceProgress(0);
    setGatherProgress(0);
    setStaircaseStep(-1);
    setFoldProgress(0);
    setCoreScaleMultiplier(1);
    setResultsModalProgress(0);
    setResultsLoadingProgress(0);
    setResultsPoetryIndex(0);
    setAiAnalysisReady(false);
    setShowLoginFromResults(false);
    setPyramidScrollProgress(0);
    setIntroComplete(false);
    setLayerState({
      completedLayerIndex: -1,
      isIntroActive: false,
      isGoldMode: false,
      introComplete: false
    });
  }, []);

  // Close assessment (back to hidden)
  const handleAssessmentClose = useCallback(() => {
    resetAssessmentState();
  }, [resetAssessmentState]);
  
  // Handle layer completion (Save button clicked)
  const handleLayerComplete = useCallback((layerIndex, answers) => {
    setLayerAnswers(prev => ({
      ...prev,
      [layerIndex]: answers
    }));
  }, []);
  
  // Handle all layers complete - triggers convergence animation
  const handleAllLayersComplete = useCallback((allAnswers) => {
    setLayerAnswers(allAnswers);
    setAssessmentPhase('convergence');
    setGatherProgress(0);
    setConvergenceProgress(0);
    setStaircaseStep(-1);
    setFoldProgress(0);
    setCoreScaleMultiplier(1);
  }, []);
  
  // Convergence animation effect — 2 visual phases:
  // Phase 0 (absorb): All 5 saved cards simultaneously fly to their pyramid layer center and shrink to invisible
  // Phase 1 (fold):   3D pyramid layers do a folding-mat staircase upward into the entity, shrinking on the way
  useEffect(() => {
    if (assessmentPhase !== 'convergence') return;
    
    const ABSORB_DELAY = 1000;           // Wait for card 5 collapse to finish (skip slide-to-left)
    const ABSORB_DURATION = 900;         // Cards fly to pyramid centers and shrink to 0
    const FOLD_PAUSE = 200;              // Brief pause before fold starts
    const FOLD_DURATION = 2800;          // Smooth continuous fold up to entity
    const CORE_GROWTH_DURATION = 1500;   // Core grows after fold
    const RESULTS_APPEAR_DURATION = 600; // Results modal floats out
    
    const t1 = ABSORB_DELAY;                        // absorb starts
    const t2 = t1 + ABSORB_DURATION;                // absorb ends
    const t3 = t2 + FOLD_PAUSE;                     // fold starts
    const t4 = t3 + FOLD_DURATION;                  // fold ends
    const t5 = t4 + CORE_GROWTH_DURATION;           // core growth ends
    const t6 = t5 + RESULTS_APPEAR_DURATION;        // results appear done
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      
      if (elapsed < t1) {
        // Waiting for last card's save animation to finish
        setStaircaseStep(-1);
        setGatherProgress(0);
        setFoldProgress(0);
        setConvergenceProgress(0);
      } else if (elapsed < t2) {
        // Phase 0: Cards fly to pyramid layer centers and shrink
        setStaircaseStep(0);
        const p = (elapsed - t1) / ABSORB_DURATION;
        const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
        setGatherProgress(eased);
        setFoldProgress(0);
        setConvergenceProgress(0);
      } else if (elapsed < t3) {
        // Brief pause — cards absorbed, pyramid about to fold
        setStaircaseStep(0);
        setGatherProgress(1);
        setFoldProgress(0);
        setConvergenceProgress(0);
      } else if (elapsed < t4) {
        // Phase 1: Pyramid layers fold up to entity (folding mat)
        setStaircaseStep(1);
        setGatherProgress(1);
        const p = (elapsed - t3) / FOLD_DURATION;
        const eased = p * p * (3 - 2 * p); // smoothstep for flowing motion
        setFoldProgress(eased);
        setConvergenceProgress(0);
      } else if (elapsed < t5) {
        // Core grows — fold complete
        setStaircaseStep(2);
        setGatherProgress(1);
        setFoldProgress(1);
        setConvergenceProgress(1);
        const coreElapsed = elapsed - t4;
        const coreProgress = Math.min(coreElapsed / CORE_GROWTH_DURATION, 1);
        const eased = 1 - Math.pow(1 - coreProgress, 3);
        setCoreScaleMultiplier(1 + eased * 4);
      } else if (elapsed < t6) {
        // Results modal floats out
        setStaircaseStep(2);
        setGatherProgress(1);
        setFoldProgress(1);
        setConvergenceProgress(1);
        setCoreScaleMultiplier(5);
        setAssessmentPhase('results');
        const resultsElapsed = elapsed - t5;
        const resultsProgress = Math.min(resultsElapsed / RESULTS_APPEAR_DURATION, 1);
        const eased = 1 - Math.pow(1 - resultsProgress, 3);
        setResultsModalProgress(eased);
      } else {
        // Animation complete
        setStaircaseStep(2);
        setGatherProgress(1);
        setFoldProgress(1);
        setConvergenceProgress(1);
        setCoreScaleMultiplier(5);
        setResultsModalProgress(1);
        return;
      }
      
      requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);
  }, [assessmentPhase]);
  
  // Show loading screen until AI analysis is ready, then reveal results
  useEffect(() => {
    if (!aiAnalysisReady) return;
    setResultsLoadingProgress(1);
  }, [aiAnalysisReady]);
  
  // Handle scroll to next layer (Scroll button clicked)
  // Handle scroll to next layer - triggered by scroll progress during layers phase
  // eslint-disable-next-line no-unused-vars
  const handleScrollToNextLayer = useCallback((nextLayerIndex) => {
    if (nextLayerIndex < 5) {
      setCurrentLayerIndex(nextLayerIndex);
      setAssessmentScrollEnabled(false); // Disable scroll until next save
    } else {
      // All layers complete, show results
      setAssessmentPhase('results');
    }
  }, []);
  
  // Handle scroll enabled toggle from assessment panel
  const handleAssessmentScrollEnabled = useCallback((enabled) => {
    setAssessmentScrollEnabled(enabled);
  }, []);
  
  // Update current layer based on pyramid scroll progress when in layers phase
  // Only advances ONE layer at a time: after saving layer N, scrolling reveals layer N+1
  // Layer N+1 fully animates in at scrollProgress = (N+1)/4
  useEffect(() => {
    if (assessmentPhase === 'layers' && assessmentScrollEnabled) {
      const nextLayer = currentLayerIndex + 1;
      if (nextLayer > 4) return; // All layers visible
      
      // Layer N+1 is fully animated when scroll reaches (N+1)/4
      const threshold = nextLayer / 4;
      if (pyramidScrollProgress >= threshold) {
        setCurrentLayerIndex(nextLayer);
        setAssessmentScrollEnabled(false); // Disable until next save
      }
    }
  }, [pyramidScrollProgress, assessmentPhase, assessmentScrollEnabled, currentLayerIndex]);
  
  // Handle answer selection (AssessmentCard passes questionId and selections array)
  const handleAnswerSelect = useCallback((questionId, selections) => {
    // Record the answer (selections is an array of 0-1 answer IDs — single choice)
    setAssessmentAnswers(prev => {
      // Replace existing entry for this question if present
      const filtered = prev.filter(a => a.questionId !== questionId);
      if (selections.length === 0) return filtered;
      return [...filtered, {
        subjectIndex: currentSubjectIndex,
        questionIndex: currentQuestionIndex,
        questionId,
        answer: selections
      }];
    });
  }, [currentSubjectIndex, currentQuestionIndex]);
  
  // Go back one question
  const handleGoBack = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setAssessmentAnswers(prev => prev.slice(0, -1));
    } else if (currentSubjectIndex > 0) {
      setCurrentSubjectIndex(prev => prev - 1);
      const questionsPerSubject = getQuestionsPerSubject(assessmentLevel);
      setCurrentQuestionIndex(questionsPerSubject - 1);
      setAssessmentAnswers(prev => prev.slice(0, -1));
    }
  }, [currentQuestionIndex, currentSubjectIndex, assessmentLevel]);
  
  // File upload handlers
  const handleAddFile = useCallback((file) => {
    setUploadedFiles(prev => [...prev, file]);
  }, []);
  
  const handleRemoveFile = useCallback((index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);
  
  const handleUploadContinue = useCallback(() => {
    setAssessmentPhase('results');
    triggerGoldMode();
  }, [triggerGoldMode]);
  
  const handleUploadSkip = useCallback(() => {
    setAssessmentPhase('results');
    triggerGoldMode();
  }, [triggerGoldMode]);

  // Touch handling for mobile
  const touchStartY = useRef(0);
  const touchAccumulator = useRef(0);
  const TOUCH_THRESHOLD = 30; // Pixels needed to trigger one frame
  
  const handleTouchStart = useCallback((e) => {
    // LOW-END: Skip during animation, allow after for pyramid control
    if (isLowEndMode && (lowEndAnimating || currentFrame < MAX_FRAME)) return;
    // Don't process touch when assessment results modal is open
    if (assessmentPhase === 'results' || assessmentPhase === 'convergence') return;
    // On mobile, only process if Deltawerken is the active nav item (index 0)
    if (window.innerWidth < 768 && mobileActiveIndex !== 0) return;
    touchStartY.current = e.touches[0].clientY;
    touchAccumulator.current = 0;
  }, [isLowEndMode, lowEndAnimating, currentFrame, MAX_FRAME, mobileActiveIndex, assessmentPhase]);

  const handleTouchMove = useCallback((e) => {
    // LOW-END: Skip during animation, but allow after for pyramid control
    if (isLowEndMode && (lowEndAnimating || currentFrame < MAX_FRAME)) return;
    
    // Don't process touch when assessment results modal is open
    if (assessmentPhase === 'results' || assessmentPhase === 'convergence') return;
    
    // On mobile, only process if Deltawerken is the active nav item (index 0)
    if (window.innerWidth < 768 && mobileActiveIndex !== 0) return;
    
    const touchY = e.touches[0].clientY;
    const delta = touchStartY.current - touchY;
    const direction = delta > 0 ? 1 : -1; // Swipe up = forward, swipe down = backward
    
    // On mobile: Re-enable scroll lock when at frame 0 and swiping forward (up)
    if (window.innerWidth < 768 && !mobileScrollLockedRef.current) {
      // Only allow re-locking if at frame 0 and scrolling forward
      if (currentFrame === 0 && direction > 0 && Math.abs(delta) > 10) {
        setMobileScrollLocked(true);
        mobileScrollLockedRef.current = true;
        document.body.style.setProperty('overflow', 'hidden', 'important');
      } else {
        // Not at start or scrolling backward - don't capture touch
        return;
      }
    }
    
    e.preventDefault();
    touchStartY.current = touchY;
    
    touchAccumulator.current += delta;
    
    // Check if accumulated touch exceeds threshold
    if (Math.abs(touchAccumulator.current) >= TOUCH_THRESHOLD) {
      const accDirection = touchAccumulator.current > 0 ? 1 : -1;
      
      // If at max frame AND intro is complete, control pyramid scroll
      if (currentFrame >= MAX_FRAME && introComplete) {
        setPyramidScrollProgress(prev => {
          const step = 0.05; // 5% per scroll tick - slower for smoother layer animation
          let newProgress = Math.max(0, Math.min(1, prev + (accDirection * step)));
          
          // SCROLL GATING via dynamic cap:
          // - Scroll enabled (layer saved): allow forward to next layer threshold
          // - Scroll disabled (layer unsaved): cap at CURRENT layer threshold
          if (assessmentPhase === 'layers' && accDirection > 0) {
            const maxProgress = assessmentScrollEnabled
              ? Math.min(1, (currentLayerIndex + 1) / 4)
              : (currentLayerIndex / 4);
            newProgress = Math.min(newProgress, maxProgress);
          }
          
          // Mobile: If scrolling down and at end, unlock scroll to continue page scroll
          if (accDirection > 0 && prev >= 1) {
            setMobileScrollLocked(false);
            mobileScrollLockedRef.current = false;
            document.body.style.overflow = '';
            return 1;
          }
          
          if (accDirection < 0 && prev <= 0) {
            if (assessmentPhase !== 'layers' && assessmentPhase !== 'convergence') {
              setCurrentFrame(prevFrame => Math.max(0, prevFrame - 1));
            }
            return 0;
          }
          return newProgress;
        });
      } else {
        setCurrentFrame(prev => {
          const newFrame = Math.max(0, Math.min(MAX_FRAME, prev + accDirection));
          
          // Mobile: If scrolling up from frame 0, unlock scroll to return to page scroll
          if (accDirection < 0 && prev <= 0) {
            setMobileScrollLocked(false);
            mobileScrollLockedRef.current = false;
            document.body.style.overflow = '';
          }
          
          return newFrame;
        });
      }
      touchAccumulator.current = 0;
    }
  }, [currentFrame, introComplete, MAX_FRAME, isLowEndMode, lowEndAnimating, mobileActiveIndex, assessmentPhase, assessmentScrollEnabled, currentLayerIndex]);

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

  // Slideshow auto-advance - respects autoSlideEnabled state
  useEffect(() => {
    if (!autoSlideEnabled) return; // Don't run if auto-slide is paused
    
    const slideInterval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % 4);
    }, 3300);
    return () => clearInterval(slideInterval);
  }, [autoSlideEnabled]);

  // Derive animation values from currentFrame using section-based timing
  // ============================================
  // SECTION 1: Scroll prompt disappears (frames 0 to SECTION_1_FRAMES)
  // SECTION 2: Earth explosion (frames SECTION_1_FRAMES to SECTION_1_FRAMES + SECTION_2_FRAMES)
  //            Header/containers start vanishing at frame HEADER_START_FRAME
  // SECTION 3: Pyramid to bottom & system visible (after section 2)
  // ============================================
  
  const section1End = SECTION_1_FRAMES;
  const section2End = SECTION_1_FRAMES + SECTION_2_FRAMES;
  
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
  
  // --- Per-component delays for staggered entropicalm movement ---
  // GFL icon logo: delayed 1 frame
  const logoStartFrame = HEADER_START_FRAME + 1;
  const logoVanishFrames = section2End - logoStartFrame;
  const logoProgress = currentFrame <= logoStartFrame ? 0 : Math.min(1, Math.max(0, (currentFrame - logoStartFrame) / logoVanishFrames));
  const logoY = logoProgress * -150;
  const logoOpacity = Math.max(0, 1 - logoProgress * 1.5);
  const logoScale = 1 - (logoProgress * 0.05);
  
  // DELTAWerken header + subheader: delayed 2 frames
  const deltaStartFrame = HEADER_START_FRAME + 2;
  const deltaVanishFrames = section2End - deltaStartFrame;
  const deltaProgress = currentFrame <= deltaStartFrame ? 0 : Math.min(1, Math.max(0, (currentFrame - deltaStartFrame) / deltaVanishFrames));
  const deltaY = deltaProgress * -150;
  const deltaOpacity = Math.max(0, 1 - deltaProgress * 1.5);
  const deltaScale = 1 - (deltaProgress * 0.05);
  
  // gardenforlife.nl container: delayed 2 frames
  const gardenStartFrame = HEADER_START_FRAME + 2;
  const gardenVanishFrames = section2End - gardenStartFrame;
  const gardenProgress = currentFrame <= gardenStartFrame ? 0 : Math.min(1, Math.max(0, (currentFrame - gardenStartFrame) / gardenVanishFrames));
  
  // Verbindings menu: starts 1 frame EARLIER than other containers
  const verbindingsStartFrame = HEADER_START_FRAME - 1;
  const verbindingsVanishFrames = section2End - verbindingsStartFrame;
  const verbindingsProgress = currentFrame <= verbindingsStartFrame ? 0 : Math.min(1, Math.max(0, (currentFrame - verbindingsStartFrame) / verbindingsVanishFrames));
  
  // Scroll label: entropicalm movement, starts 3 frames BEFORE verbindingsmenu (frame 9)
  const scrollLabelStartFrame = HEADER_START_FRAME - 3;
  const scrollLabelVanishFrames = section2End - scrollLabelStartFrame;
  const scrollLabelProgress = currentFrame <= scrollLabelStartFrame ? 0 : Math.min(1, Math.max(0, (currentFrame - scrollLabelStartFrame) / scrollLabelVanishFrames));
  const scrollLabelY = scrollLabelProgress * 250; // faster outward movement (closer to explosion)
  const scrollLabelOpacity = Math.max(0, 1 - scrollLabelProgress * 2.0);
  const scrollLabelScale = 1 - (scrollLabelProgress * 0.08);

  // Login button (mobile): matches scroll label, delayed 1 frame
  const loginBtnStartFrame = scrollLabelStartFrame + 1;
  const loginBtnVanishFrames = section2End - loginBtnStartFrame;
  const loginBtnProgress = currentFrame <= loginBtnStartFrame ? 0 : Math.min(1, Math.max(0, (currentFrame - loginBtnStartFrame) / loginBtnVanishFrames));
  const loginBtnY = loginBtnProgress * 250;
  const loginBtnOpacity = Math.max(0, 1 - loginBtnProgress * 2.0);
  const loginBtnScale = 1 - (loginBtnProgress * 0.08);

  // Language toggle (mobile): 1 frame delay relative to Deltawerken header
  const langStartFrame = deltaStartFrame + 1;
  const langVanishFrames = section2End - langStartFrame;
  const langProgress = currentFrame <= langStartFrame ? 0 : Math.min(1, Math.max(0, (currentFrame - langStartFrame) / langVanishFrames));
  const langY = langProgress * -150;
  const langOpacity = Math.max(0, 1 - langProgress * 1.5);
  
  // Grid background: fades out with header
  const gridOpacity = Math.max(0, 0.3 * (1 - headerProgress));

  // Alternating + and × cross grid: 100x100 tile, checkerboard pattern at 50px spacing
  // (0,0)=+  (50,0)=×  (0,50)=×  (50,50)=+
  const crossPatternDesktop = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cline x1='0' y1='0.5' x2='6' y2='0.5' stroke='rgba(201,160,240,0.045)' stroke-width='1'/%3E%3Cline x1='94' y1='0.5' x2='100' y2='0.5' stroke='rgba(201,160,240,0.045)' stroke-width='1'/%3E%3Cline x1='0.5' y1='0' x2='0.5' y2='6' stroke='rgba(201,160,240,0.045)' stroke-width='1'/%3E%3Cline x1='0.5' y1='94' x2='0.5' y2='100' stroke='rgba(201,160,240,0.045)' stroke-width='1'/%3E%3Cline x1='44' y1='50.5' x2='56' y2='50.5' stroke='rgba(201,160,240,0.045)' stroke-width='1'/%3E%3Cline x1='50.5' y1='44' x2='50.5' y2='56' stroke='rgba(201,160,240,0.045)' stroke-width='1'/%3E%3Cline x1='46' y1='4' x2='54' y2='-4' stroke='rgba(201,160,240,0.035)' stroke-width='1'/%3E%3Cline x1='54' y1='4' x2='46' y2='-4' stroke='rgba(201,160,240,0.035)' stroke-width='1'/%3E%3Cline x1='46' y1='96' x2='54' y2='104' stroke='rgba(201,160,240,0.035)' stroke-width='1'/%3E%3Cline x1='54' y1='96' x2='46' y2='104' stroke='rgba(201,160,240,0.035)' stroke-width='1'/%3E%3Cline x1='-4' y1='46' x2='4' y2='54' stroke='rgba(201,160,240,0.035)' stroke-width='1'/%3E%3Cline x1='4' y1='46' x2='-4' y2='54' stroke='rgba(201,160,240,0.035)' stroke-width='1'/%3E%3Cline x1='96' y1='46' x2='104' y2='54' stroke='rgba(201,160,240,0.035)' stroke-width='1'/%3E%3Cline x1='104' y1='46' x2='96' y2='54' stroke='rgba(201,160,240,0.035)' stroke-width='1'/%3E%3C/svg%3E")`;
  const crossPatternMobile = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cline x1='0' y1='0.5' x2='6' y2='0.5' stroke='rgba(201,160,240,0.05)' stroke-width='1'/%3E%3Cline x1='94' y1='0.5' x2='100' y2='0.5' stroke='rgba(201,160,240,0.05)' stroke-width='1'/%3E%3Cline x1='0.5' y1='0' x2='0.5' y2='6' stroke='rgba(201,160,240,0.05)' stroke-width='1'/%3E%3Cline x1='0.5' y1='94' x2='0.5' y2='100' stroke='rgba(201,160,240,0.05)' stroke-width='1'/%3E%3Cline x1='44' y1='50.5' x2='56' y2='50.5' stroke='rgba(201,160,240,0.05)' stroke-width='1'/%3E%3Cline x1='50.5' y1='44' x2='50.5' y2='56' stroke='rgba(201,160,240,0.05)' stroke-width='1'/%3E%3Cline x1='46' y1='4' x2='54' y2='-4' stroke='rgba(201,160,240,0.04)' stroke-width='1'/%3E%3Cline x1='54' y1='4' x2='46' y2='-4' stroke='rgba(201,160,240,0.04)' stroke-width='1'/%3E%3Cline x1='46' y1='96' x2='54' y2='104' stroke='rgba(201,160,240,0.04)' stroke-width='1'/%3E%3Cline x1='54' y1='96' x2='46' y2='104' stroke='rgba(201,160,240,0.04)' stroke-width='1'/%3E%3Cline x1='-4' y1='46' x2='4' y2='54' stroke='rgba(201,160,240,0.04)' stroke-width='1'/%3E%3Cline x1='4' y1='46' x2='-4' y2='54' stroke='rgba(201,160,240,0.04)' stroke-width='1'/%3E%3Cline x1='96' y1='46' x2='104' y2='54' stroke='rgba(201,160,240,0.04)' stroke-width='1'/%3E%3Cline x1='104' y1='46' x2='96' y2='54' stroke='rgba(201,160,240,0.04)' stroke-width='1'/%3E%3C/svg%3E")`;
  
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
  
  // Button becomes visible at the very last frame
  // section1End=1, section2End=46, section3End=49
  const section3End = section2End + SECTION_3_FRAMES;
  const BUTTON_APPEAR_FRAME = section3End; // Frame 49 - the last frame
  const isSystem = currentFrame >= BUTTON_APPEAR_FRAME;

  // Pyramid layer scroll - only active after system is visible
  // This controls the layer float-up animation via scroll after the 3s intro
  // When isSystem becomes true, the 3s intro starts automatically in PyramidInner
  // After intro, scroll continues to control layer positions

  // Reset to frame 0
  const handleReset = () => {
    // Full reset of all assessment/pyramid state
    resetAssessmentState();
    // Rewind frames back to 0
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
      className={`relative w-screen font-figtree ${isMobile ? 'min-h-screen overflow-visible' : 'h-screen overflow-hidden'}`}
      style={{color: '#FFFEF0', touchAction: isMobile ? 'pan-y pinch-zoom' : 'none', zIndex: 1, isolation: 'isolate'}}
    >
      {/* Procedural WebGL nebula background — fixed behind all content.
          Mounted after JS chunks are loaded (mountNebula=true). Shader compilation
          happens behind the opaque loading overlay. The onReady callback signals
          when the first frame has rendered, allowing the loading screen to end. */}
      {mountNebula && (
        <NebulaBackground
          mapPosition={mapPosition}
          onReady={() => {
            if (nebulaReadyRef.current) {
              nebulaReadyRef.current();
              nebulaReadyRef.current = null;
            }
          }}
        />
      )}
      {/* ========================= */}
      {/* LOADING SCREEN OVERLAY */}
      {/* ========================= */}
      {/* Loading screen is now rendered as static HTML in index.html (appears before JS loads).
          It is faded out & removed from the DOM by endLoadingScreen(). */}

      {/* Suspense boundary for all lazy-loaded components.
          The loading screen above handles the visual — this just prevents React errors. */}
      <Suspense fallback={null}>

      {/* Desktop TimeSync - Fixed HUD element, stays in viewport corner like camera timestamp */}
      {!isMobile && (
        <div className="fixed pointer-events-none" style={{
          right: '1.5rem',
          top: '2.5rem',
          zIndex: 9999,
        }}>
          <TimeSync isMobile={false} />
        </div>
      )}

      {/* Grid Background - spans entire page on mobile */}
      {isMobile && (
        <div 
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: crossPatternMobile,
            backgroundSize: '100px 100px'
          }}
        />
      )}

      {/* =========================== */}
      {/* MOBILE LAYOUT - Login + Dashboard only */}
      {/* =========================== */}
      {isMobile && (
        <>
          {/* --- Background/Grid (Mobile) --- */}
          <div className="fixed inset-0 z-0" style={{background: 'transparent'}} />
          <div 
            className="fixed inset-0 z-0 pointer-events-none"
            style={{
              opacity: 0.4,
              backgroundImage: crossPatternMobile,
              backgroundSize: '100px 100px'
            }}
          />

          {/* HoloEarth background - centered */}
          <div 
            ref={containerRef}
            className="fixed inset-0"
            style={{ pointerEvents: 'none' }}
          >
            {/* Header with Title - Centered */}
            <div 
              className="absolute z-50 left-0 right-0 flex justify-center"
              style={{
                top: '4rem',
                opacity: showMobileLogin ? 0 : deltaOpacity,
                transform: `translateY(${showMobileLogin ? -60 : deltaY}px) scale(${deltaScale})`,
                transition: 'opacity 0.4s ease, transform 0.4s ease',
                pointerEvents: showMobileLogin ? 'none' : 'auto',
              }}
            >
              <div className="flex flex-col items-center">
                <h1 style={{
                  color: '#FFFEF0',
                  fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                  fontSize: 'clamp(1.7rem, 6vw, 2.2rem)',
                  fontWeight: 600,
                  lineHeight: 1,
                  letterSpacing: '0.1em',
                  animation: 'headerBreathe 6s ease-in-out infinite',
                }}>
                  DELTA<span style={{color: '#f59e0b'}}>WERKEN</span>
                </h1>
                {/* Gradient underline */}
                <div style={{
                  width: '100%',
                  height: '1px',
                  marginTop: 'clamp(0.2rem, 1vw, 0.4rem)',
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,254,240,0.4) 20%, rgba(245,158,11,0.5) 50%, rgba(255,254,240,0.4) 80%, transparent 100%)',
                }} />
                <div className="flex items-center" style={{ gap: '0.5rem', marginTop: '0.5rem' }}>
                  <span className="rounded-full bg-green-500 animate-ping" style={{
                    width: '0.5rem',
                    height: '0.5rem',
                  }}></span>
                  <span className="text-gray-400 tracking-wider" style={{
                    fontSize: 'clamp(0.9rem, 3vw, 1.1rem)',
                    fontFamily: "'Figtree', sans-serif",
                  }}>{t('header.versionText')} {'/'}{'/'} V.4.9</span>
                </div>
              </div>
            </div>

            {/* TimeSync - Centered */}
            <div 
              className="absolute z-50 left-0 right-0 flex justify-center"
              style={{
                top: '8rem',
                opacity: headerOpacity,
                transform: `translateY(${headerY}px) scale(0.7)`,
              }}
            >
              <TimeSync isMobile={true} />
            </div>

            <div 
              ref={earthSectionRef}
              style={{ 
                position: 'fixed',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div 
                className="z-10" 
                style={{ 
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <HoloEarth 
                  exploding={isExploding}
                  explosionProgress={explosionProgress}
                  isMobile={isMobile}
                  isActive={isSystem}
                  pyramidScrollProgress={pyramidScrollProgress}
                  showPyramidLabels={isSystem}
                  coreScaleMultiplier={coreScaleMultiplier}
                  currentFrame={currentFrame}
                  onIntroComplete={handleIntroComplete}
                  onLayerStateChange={handleLayerStateChange}
                />
              </div>

            </div>
          </div>

          {/* Scroll Prompt - Between HoloEarth and Login */}
          <div 
            className="fixed left-0 right-0 flex flex-col items-center justify-center z-30"
            style={{
              bottom: '9.5rem',
              opacity: scrollLabelOpacity,
              transform: `translateY(${scrollLabelY * 2.5}px) scale(${scrollLabelScale})`,
            }}
          >
            <div className="relative pointer-events-none">
              <div className="relative overflow-hidden" style={{
                padding: 'clamp(0.65rem, 1.5vw, 0.85rem) clamp(0.8rem, 3vw, 1.2rem)',
                transform: 'scale(1.02) scaleY(1.045)',
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(180deg, transparent 0%, rgba(21, 179, 21, 0.04) 45%, rgba(21, 179, 21, 0.08) 50%, rgba(21, 179, 21, 0.04) 55%, transparent 100%)',
                  animation: 'scrollPromptScanline 4s linear infinite',
                  pointerEvents: 'none',
                }} />
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(21, 179, 21, 0.025) 3px, rgba(21, 179, 21, 0.025) 4px)',
                  pointerEvents: 'none',
                }} />
                <span className="tracking-[0.15em] font-bold relative" style={{
                  color: 'rgba(21, 179, 21, 0.7)',
                  fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                  fontSize: 'clamp(0.55rem, 2vw, 0.75rem)',
                  lineHeight: 1,
                  textShadow: '0 0 8px rgba(21, 179, 21, 0.3)',
                  animation: 'scrollPromptTextFlicker 8s linear infinite',
                }}>SWIPE = SYNCHRONISATIE</span>
              </div>
              <div style={{ position: 'absolute', top: -2, left: -4, width: '0.6rem', height: '0.6rem', background: 'transparent', pointerEvents: 'none', borderTop: '1px solid rgba(21,179,21,0.5)', borderLeft: '1px solid rgba(21,179,21,0.5)', borderTopLeftRadius: '2px', animation: 'scrollPromptGlow 3s ease-in-out infinite, scrollPromptCornerPulse 2s ease-in-out infinite' }} />
              <div style={{ position: 'absolute', top: -2, right: -4, width: '0.6rem', height: '0.6rem', background: 'transparent', pointerEvents: 'none', borderTop: '1px solid rgba(21,179,21,0.5)', borderRight: '1px solid rgba(21,179,21,0.5)', borderTopRightRadius: '2px', animation: 'scrollPromptGlow 3s ease-in-out infinite, scrollPromptCornerPulse 2s ease-in-out infinite 0.5s' }} />
              <div style={{ position: 'absolute', bottom: -2, left: -4, width: '0.6rem', height: '0.6rem', background: 'transparent', pointerEvents: 'none', borderBottom: '1px solid rgba(21,179,21,0.5)', borderLeft: '1px solid rgba(21,179,21,0.5)', borderBottomLeftRadius: '2px', animation: 'scrollPromptGlow 3s ease-in-out infinite, scrollPromptCornerPulse 2s ease-in-out infinite 1s' }} />
              <div style={{ position: 'absolute', bottom: -2, right: -4, width: '0.6rem', height: '0.6rem', background: 'transparent', pointerEvents: 'none', borderBottom: '1px solid rgba(21,179,21,0.5)', borderRight: '1px solid rgba(21,179,21,0.5)', borderBottomRightRadius: '2px', animation: 'scrollPromptGlow 3s ease-in-out infinite, scrollPromptCornerPulse 2s ease-in-out infinite 1.5s' }} />
            </div>
          </div>

          {/* Login Button - Bottom center — sci-fi themed to match scroll label */}
          {!showMobileLogin && (
            <button
              onClick={() => setShowMobileLogin(true)}
              className="relative"
              style={{
                position: 'fixed',
                bottom: '5rem',
                left: '50%',
                transform: `translateX(-50%) translateY(${loginBtnY * 2.5}px) scale(${loginBtnScale})`,
                opacity: loginBtnOpacity,
                zIndex: 100,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <div className="relative pointer-events-none">
                <div className="relative overflow-hidden" style={{
                  padding: 'clamp(0.65rem, 1.5vw, 0.85rem) clamp(1.2rem, 4vw, 1.8rem)',
                  border: '1px solid rgba(255, 174, 0, 0.35)',
                  borderRadius: '2px',
                }}>
                  {/* Scanline sweep */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(180deg, transparent 0%, rgba(255, 174, 0, 0.04) 45%, rgba(255, 174, 0, 0.08) 50%, rgba(255, 174, 0, 0.04) 55%, transparent 100%)',
                    animation: 'scrollPromptScanline 4s linear infinite',
                    pointerEvents: 'none',
                  }} />
                  {/* CRT lines */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255, 174, 0, 0.025) 3px, rgba(255, 174, 0, 0.025) 4px)',
                    pointerEvents: 'none',
                  }} />
                  <span className="tracking-[0.15em] font-bold relative" style={{
                    color: 'rgba(255, 174, 0, 0.7)',
                    fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                    fontSize: 'clamp(0.55rem, 2vw, 0.75rem)',
                    lineHeight: 1,
                    textShadow: '0 0 8px rgba(255, 174, 0, 0.3)',
                    animation: 'scrollPromptTextFlicker 8s linear infinite',
                    pointerEvents: 'auto',
                  }}>LOGIN</span>
                </div>

              </div>
            </button>
          )}

          {/* LoginPage Modal - Full screen overlay */}
          {showMobileLogin && (
            <div className="fixed inset-0" style={{ zIndex: 250 }}>
              <Suspense fallback={<div />}>
                <LoginPage 
                  isVisible={true}
                  onBack={() => setShowMobileLogin(false)}
                />
              </Suspense>
            </div>
          )}

          {/* Mobile Back Button - HoloPyramid return (matches login button position) */}
          {isSystem && (
            <button 
              onClick={handleReset}
              className="group flex items-center gap-3 rounded-sm transition-all duration-300 backdrop-blur-sm px-4 py-2"
              style={{
                position: 'fixed',
                bottom: '5rem',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10001,
                border: '1px solid rgba(147, 51, 234, 0.3)',
                background: 'rgba(10, 5, 16, 0.6)',
                pointerEvents: 'auto',
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
          )}

          {/* Mobile Language Toggle — hidden when login/dashboard modal is open */}
          <button
            onClick={toggleLanguage}
            style={{
              position: 'fixed',
              top: '12px',
              right: '12px',
              zIndex: 200,
              opacity: showMobileLogin ? 0 : langOpacity,
              transform: `translateY(${showMobileLogin ? -40 : langY}px)`,
              backgroundColor: 'rgba(10, 5, 21, 0.7)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px',
              cursor: 'pointer',
              padding: '5px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backdropFilter: 'blur(8px)',
              transition: 'opacity 0.4s ease, transform 0.4s ease',
              pointerEvents: showMobileLogin ? 'none' : 'auto',
            }}
          >
            <span style={{ fontSize: '12px', color: language === 'nl' ? '#f97316' : 'rgba(255,255,255,0.4)', fontWeight: language === 'nl' ? 'bold' : 'normal' }}>NL</span>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>|</span>
            <span style={{ fontSize: '12px', color: language === 'en' ? '#f97316' : 'rgba(255,255,255,0.4)', fontWeight: language === 'en' ? 'bold' : 'normal' }}>EN</span>
          </button>
        </>
      )}

      {/* =========================== */}
      {/* PERSISTENT ELEMENTS - Stay visible during all page transitions */}
      {/* =========================== */}
      {!isMobile && (
        <>
          {/* --- Background Elements --- */}
          <div className="absolute inset-0 z-0" style={{background: 'transparent'}} />
      
          {/* --- Grid Background - Moves with map for floating illusion --- */}
          <div 
            className="fixed z-0 pointer-events-none"
            style={{
              // Extend grid far beyond viewport (5x5 viewport area)
              width: '500vw',
              height: '500vh',
              left: '-200vw',
              top: '-200vh',
              opacity: gridOpacity,
              backgroundImage: crossPatternDesktop,
              backgroundSize: '100px 100px',
              // Move grid with map position - creates floating illusion
              transform: `translate(${-mapPosition.x * 100}vw, ${-mapPosition.y * 100}vh)`,
              transition: isMapAnimating ? 'none' : 'transform 0.1s ease-out',
              willChange: 'transform',
            }}
          />
        </>
      )}

      {/* =========================== */}
      {/* DESKTOP LAYOUT - Grid Map Navigation - pure position movement, no scale/fade */}
      {/* =========================== */}
      {!isMobile && (
        <div
          style={{
            transform: `translate(${-mapPosition.x * 100}vw, ${-mapPosition.y * 100}vh)`,
            transformOrigin: 'center center',
            pointerEvents: activeSection ? 'none' : 'auto',
            transition: isMapAnimating ? 'none' : 'transform 0.1s ease-out',
            position: 'absolute',
            inset: 0,
            willChange: 'transform',
            overflow: 'visible',
          }}
        >
          {/* --- Logo (top-left) - Inside moving container --- */}
          <div
            className="absolute pointer-events-auto z-10"
            style={{
              top: 'clamp(1.5rem, 2vw, 2rem)',
              left: 'clamp(1rem, 3vw, 2rem)',
              // Header animation during scroll — delayed 1 frame
              transform: `translateX(${logoY * 2.5}px) translateY(${logoY * 2.5}px) scale(${logoScale})`,
              opacity: logoOpacity,
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
              onClick={() => activeSection && handleCloseSection()}
              title={activeSection ? 'Back to Landing' : ''}
              onMouseEnter={(e) => activeSection && (e.target.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            />
          </div>


          {/* --- Main 3D Scene --- */}
          <div className="absolute inset-0 flex items-center justify-center" style={{ overflow: 'visible', zIndex: currentFrame > 6 ? 20 : 10 }}>
            <HoloEarth 
              className="w-full h-full" 
              exploding={isExploding}
              explosionProgress={explosionProgress}
              isMobile={isMobile}
              isActive={isSystem}
              pyramidScrollProgress={pyramidScrollProgress}
              showPyramidLabels={isSystem}
              coreScaleMultiplier={coreScaleMultiplier}
              foldProgress={foldProgress}
              currentFrame={currentFrame}
              onIntroComplete={handleIntroComplete}
              onLayerStateChange={handleLayerStateChange}
            />
          </div>

          {/* --- Foreground nebula gas overlay — upper magenta-purple cloud layered in front of HoloEarth --- */}
          <NebulaOverlay mapPosition={mapPosition} opacity={0.55} />

          {/* --- Overlay UI Layer --- */}
          {/* z-10 normally (behind HoloEarth z-20), z-30 when assessment active so modals float above */}
          <div className={`absolute inset-0 ${isSystem ? 'z-30' : 'z-10'} pointer-events-none`}>
            {/* Header HUD - Flies up based on scroll progress — delayed 2 frames */}
            <header 
              className="absolute top-0 left-0 w-full flex justify-between items-center pointer-events-auto"
              style={{
                transform: `translateY(calc(${deltaY * 2.5}px - 1.5rem)) scale(${deltaScale})`,
                opacity: deltaOpacity,
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
                    letterSpacing: 'clamp(0.1em, 0.15vw, 0.2em)',
                    animation: 'headerBreathe 6s ease-in-out infinite',
                  }}>
                    DELTA<span style={{color: '#f59e0b'}}>WERKEN</span>
                  </h1>
                  {/* Gradient underline */}
                  <div style={{
                    height: '1px',
                    marginTop: 'clamp(0.2rem, 0.4vw, 0.4rem)',
                    background: 'linear-gradient(90deg, rgba(255,254,240,0.4) 0%, rgba(245,158,11,0.5) 50%, transparent 100%)',
                  }} />
                  <div className="flex gap-2 items-center" style={{marginTop: 'clamp(0.25rem, 0.5vw, 0.5rem)'}}>
                    <span className="rounded-full bg-green-500 animate-ping" style={{
                      width: 'clamp(0.35rem, 0.5vw, 0.5rem)',
                      height: 'clamp(0.35rem, 0.5vw, 0.5rem)',
                      minWidth: 'clamp(0.35rem, 0.5vw, 0.5rem)',
                      minHeight: 'clamp(0.35rem, 0.5vw, 0.5rem)'
                    }}></span>
                    <span className="text-gray-400 tracking-widest" style={{
                      fontSize: 'clamp(0.6rem, 0.9vw, 0.85rem)'
                    }}>{t('header.versionText')} {'/'}{'/'} V.4.9</span>
                  </div>
                </div>
              </div>
            </header>

            {/* --- Scroll Prompt (Desktop) OR Start Button (Low-End) --- */}
            <div 
              className="absolute left-0 right-0 flex flex-col items-center justify-center gap-4 z-50"
              style={{
                bottom: 'calc(20% + 0.5rem)',
                opacity: scrollLabelOpacity,
                transform: `translateY(${scrollLabelY * 2.5}px) scale(${scrollLabelScale})`,
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
                    {lowEndAnimating ? t('lowEndButton.synchronising') : t('lowEndButton.start')}
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
                <div className="relative flex flex-col items-center pointer-events-none" style={{
                  transform: window.innerWidth >= 1325 ? 'scale(1)' : window.innerWidth >= 1100 ? 'scale(0.85) translateY(-0.7rem)' : window.innerWidth >= 768 ? 'scale(0.7)' : 'scale(1)',
                  transformOrigin: 'center bottom'
                }}>
                  {/* Text with scanline + data lines */}
                  <div className="relative overflow-hidden" style={{
                    padding: '0.875rem 2rem',
                    transform: 'scale(1.02) scaleY(1.045)',
                  }}>
                    {/* Scanline sweep */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(180deg, transparent 0%, rgba(21, 179, 21, 0.04) 45%, rgba(21, 179, 21, 0.08) 50%, rgba(21, 179, 21, 0.04) 55%, transparent 100%)',
                      animation: 'scrollPromptScanline 4s linear infinite',
                      pointerEvents: 'none',
                    }} />
                    {/* Horizontal data lines */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(21, 179, 21, 0.025) 3px, rgba(21, 179, 21, 0.025) 4px)',
                      pointerEvents: 'none',
                    }} />
                    {/* Text */}
                    <span className="tracking-[0.25em] font-bold relative" style={{
                      color: 'rgba(21, 179, 21, 0.7)',
                      fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                      fontSize: '1rem',
                      textShadow: '0 0 8px rgba(21, 179, 21, 0.3)',
                      animation: 'scrollPromptTextFlicker 8s linear infinite',
                      letterSpacing: '0.25em',
                    }}>{window.innerWidth >= 1100 ? t('scrollPrompt.scroll') : t('scrollPrompt.swipe')}</span>
                  </div>
                  {/* Corner bracket accents — curved, offset outward */}
                  <div style={{ position: 'absolute', top: -3, left: -5, width: '0.8rem', height: '0.8rem', background: 'transparent', pointerEvents: 'none', borderTop: '1px solid rgba(21,179,21,0.5)', borderLeft: '1px solid rgba(21,179,21,0.5)', borderTopLeftRadius: '3px', animation: 'scrollPromptGlow 3s ease-in-out infinite, scrollPromptCornerPulse 2s ease-in-out infinite' }} />
                  <div style={{ position: 'absolute', top: -3, right: -5, width: '0.8rem', height: '0.8rem', background: 'transparent', pointerEvents: 'none', borderTop: '1px solid rgba(21,179,21,0.5)', borderRight: '1px solid rgba(21,179,21,0.5)', borderTopRightRadius: '3px', animation: 'scrollPromptGlow 3s ease-in-out infinite, scrollPromptCornerPulse 2s ease-in-out infinite 0.5s' }} />
                  <div style={{ position: 'absolute', bottom: -3, left: -5, width: '0.8rem', height: '0.8rem', background: 'transparent', pointerEvents: 'none', borderBottom: '1px solid rgba(21,179,21,0.5)', borderLeft: '1px solid rgba(21,179,21,0.5)', borderBottomLeftRadius: '3px', animation: 'scrollPromptGlow 3s ease-in-out infinite, scrollPromptCornerPulse 2s ease-in-out infinite 1s' }} />
                  <div style={{ position: 'absolute', bottom: -3, right: -5, width: '0.8rem', height: '0.8rem', background: 'transparent', pointerEvents: 'none', borderBottom: '1px solid rgba(21,179,21,0.5)', borderRight: '1px solid rgba(21,179,21,0.5)', borderBottomRightRadius: '3px', animation: 'scrollPromptGlow 3s ease-in-out infinite, scrollPromptCornerPulse 2s ease-in-out infinite 1.5s' }} />
                </div>
              )}
            </div>

            {/* --- Floating Containers (Orbital View) --- */}
            <DesktopLayout 
              isExploding={isExploding} 
              mounted={mounted} 
              currentSlide={currentSlide} 
              setCurrentSlide={setCurrentSlide}
              animationProgress={containerProgress}
              gardenAnimationProgress={gardenProgress}
              verbindingsAnimationProgress={verbindingsProgress}
              setActiveSection={handleOpenSection}
              pauseAutoSlide={pauseAutoSlide}
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
            
            {/* === ASSESSMENT SYSTEM === */}
            {/* Replaces the old scroll-animated pyramid labels */}
            {/* Shows intro modal first, then questions one at a time */}
            
            {/* Assessment Intro Modal - Shows when entity intro completes */}
            {isSystem && assessmentPhase === 'intro' && (
              <div 
                className="fixed inset-0 flex items-center justify-center z-[200] pointer-events-auto"
                style={{
                  background: 'transparent'
                }}
              >
                <AssessmentIntro 
                  onStart={handleAssessmentStart}
                  onClose={handleAssessmentClose}
                  onNavigateToData={() => { handleAssessmentClose(); handleOpenSection('monitor'); }}
                  uploadedFiles={uploadedFiles}
                  onAddFile={handleAddFile}
                  onRemoveFile={handleRemoveFile}
                />
              </div>
            )}
            
            {/* Assessment Questions - Shows one question at a time */}
            {isSystem && assessmentPhase === 'questions' && (
              <div 
                className="fixed inset-0 flex items-center justify-center z-[200] pointer-events-auto"
                style={{
                  background: 'transparent'
                }}
              >
                <AssessmentCard 
                  questions={assessmentSubjects[currentSubjectIndex].questions.slice(0, getQuestionsPerSubject(assessmentLevel))}
                  currentSubject={assessmentSubjects[currentSubjectIndex]}
                  currentSubjectIndex={currentSubjectIndex}
                  currentQuestionIndex={currentQuestionIndex}
                  totalQuestions={getTotalQuestions(assessmentLevel)}
                  answeredCount={assessmentAnswers.length}
                  onSelectAnswer={handleAnswerSelect}
                  onGoBack={handleGoBack}
                  canGoBack={assessmentAnswers.length > 0}
                  onNext={() => {
                    const questionsPerSubject = getQuestionsPerSubject(assessmentLevel);
                    if (currentQuestionIndex < questionsPerSubject - 1) {
                      setCurrentQuestionIndex(prev => prev + 1);
                    } else if (currentSubjectIndex < 4) {
                      setCurrentSubjectIndex(prev => prev + 1);
                      setCurrentQuestionIndex(0);
                    }
                  }}
                  onComplete={() => {
                    // Convert assessmentAnswers array to layerAnswers format for scoring
                    const converted = {};
                    assessmentAnswers.forEach(a => {
                      if (!converted[a.subjectIndex]) converted[a.subjectIndex] = {};
                      // answer is [answerId] array — take first (single-choice)
                      converted[a.subjectIndex][a.questionId] = a.answer[0];
                    });
                    console.log('[GFL] onComplete — assessmentAnswers count:', assessmentAnswers.length);
                    console.log('[GFL] onComplete — converted layerAnswers:', JSON.stringify(converted).slice(0, 500));
                    setLayerAnswers(converted);

                    if (assessmentLevel === 'deep') {
                      setAssessmentPhase('upload');
                    } else {
                      setAssessmentPhase('results');
                      setResultsModalProgress(1); // Ensure loading screen is visible (not hidden at opacity 0)
                      triggerGoldMode();
                    }
                  }}
                  allAnswers={assessmentAnswers.reduce((acc, a) => ({ ...acc, [a.questionId]: a.answer }), {})}
                />
              </div>
            )}
            
            {/* Assessment Layer Panel - Shows during layers and convergence phases */}
            {/* Animates in sync with pyramid layers - floats from entity center to alternating sides */}
            {/* During convergence, panels float back to entity center */}
            {isSystem && (assessmentPhase === 'layers' || assessmentPhase === 'convergence') && (
              <>
                <AssessmentLayerPanel
                currentLayerIndex={currentLayerIndex}
                scrollProgress={pyramidScrollProgress}
                onLayerComplete={handleLayerComplete}
                onScrollEnabled={handleAssessmentScrollEnabled}
                onAllLayersComplete={handleAllLayersComplete}
                gatherProgress={gatherProgress}
                convergenceProgress={convergenceProgress}
                staircaseStep={staircaseStep}
                isVisible={true}
              />
              </>
            )}
            
            {/* Assessment Upload - Shows after questions for deep level */}
            {isSystem && assessmentPhase === 'upload' && (
              <div 
                className="fixed inset-0 flex items-center justify-center z-[200] pointer-events-auto"
                style={{
                  background: 'transparent'
                }}
              >
                <AssessmentUpload 
                  files={uploadedFiles}
                  onAddFile={handleAddFile}
                  onRemoveFile={handleRemoveFile}
                  onContinue={handleUploadContinue}
                  onSkip={handleUploadSkip}
                />
              </div>
            )}
            
            {/* Assessment Results - wait for AI, then show full results modal */}
            {isSystem && assessmentPhase === 'results' && (
              <AssessmentResultsModal
                resultsLoadingProgress={resultsLoadingProgress}
                resultsModalProgress={resultsModalProgress}
                layerAnswers={layerAnswers}
                onClose={resetAssessmentState}
                onAiReady={() => setAiAnalysisReady(true)}
                onDownload={() => {
                  console.log('Download PDF:', layerAnswers);
                  // TODO: Generate and download PDF
                }}
                onCreateAccount={() => {
                  console.log('Download PDF and create account:', layerAnswers);
                  // TODO: Generate and download PDF
                  setShowLoginFromResults(true);
                }}
                t={t}
              />
            )}
            
            {/* Login Modal from Results */}
            {showLoginFromResults && (
              <div 
                className="fixed inset-0 flex items-center justify-center z-[250] pointer-events-auto"
                style={{ background: 'rgba(0, 0, 0, 0.7)' }}
              >
                <div 
                  className="relative w-96 p-6 rounded-lg backdrop-blur-sm"
                  style={{ background: 'rgba(8, 2, 12, 0.95)' }}
                >
                  {/* Corner decorations */}
                  <div className="absolute -top-0.5 -left-0.5 w-4 h-4" style={{
                    border: '1.5px solid #ffae00',
                    borderRadius: '10px 0 0 0',
                    borderBottom: 'none',
                    borderRight: 'none'
                  }}></div>
                  <div className="absolute -top-0.5 -right-0.5 w-4 h-4" style={{
                    border: '1.5px solid #ffae00',
                    borderRadius: '0 10px 0 0',
                    borderBottom: 'none',
                    borderLeft: 'none'
                  }}></div>
                  <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4" style={{
                    border: '1.5px solid #ffae00',
                    borderRadius: '0 0 0 10px',
                    borderTop: 'none',
                    borderRight: 'none'
                  }}></div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4" style={{
                    border: '1.5px solid #ffae00',
                    borderRadius: '0 0 10px 0',
                    borderTop: 'none',
                    borderLeft: 'none'
                  }}></div>
                  
                  <h2 
                    className="text-lg font-bold mb-4 tracking-wider uppercase text-center"
                    style={{
                      color: '#a855f7',
                      fontFamily: "'Lexend Mega', sans-serif"
                    }}
                  >
                    {t('results.createAccount')}
                  </h2>
                  
                  <p 
                    className="text-sm mb-6 text-center leading-relaxed"
                    style={{ color: 'rgba(255, 254, 240, 0.7)' }}
                  >
                    Save your profile and track your growth over time.
                  </p>
                  
                  <div className="space-y-4">
                    <input
                      type="email"
                      placeholder="Email"
                      className="w-full px-4 py-3 rounded-lg text-sm"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        color: 'rgba(255, 254, 240, 0.9)',
                        outline: 'none'
                      }}
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      className="w-full px-4 py-3 rounded-lg text-sm"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        color: 'rgba(255, 254, 240, 0.9)',
                        outline: 'none'
                      }}
                    />
                    
                    <button
                      onClick={() => {
                        console.log('Create account');
                        setShowLoginFromResults(false);
                      }}
                      className="w-full py-3 rounded-lg font-bold uppercase tracking-wider transition-all duration-300"
                      style={{
                        background: '#a855f7',
                        color: '#000',
                        border: '2px solid #a855f7'
                      }}
                    >
                      {t('results.createAccount')}
                    </button>
                    
                    <button
                      onClick={() => setShowLoginFromResults(false)}
                      className="w-full py-2 rounded-lg text-sm transition-all duration-300"
                      style={{
                        background: 'transparent',
                        color: 'rgba(255, 254, 240, 0.5)',
                        border: '1px solid rgba(255, 254, 240, 0.2)'
                      }}
                    >
                      {t('results.close')}
                    </button>
                  </div>
                </div>
              </div>
            )}
              
            {/* Back Button - positioned separately from entity transforms */}
            <button 
              onClick={handleReset}
              className="absolute z-[10001] group flex items-center gap-3 rounded-sm transition-all duration-300 backdrop-blur-sm px-4 py-2 mb-3"
              style={{
                border: '1px solid rgba(147, 51, 234, 0.3)',
                background: 'rgba(10, 5, 16, 0.6)',
                bottom: window.innerWidth >= 1280 ? '2rem' : window.innerWidth >= 768 ? '0.5rem' : '5rem', // Mobile matches login button position
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

      {/* --- Footer / Deco --- Desktop only */}
      {!isMobile && (
        <div 
          className="absolute z-30 select-none tracking-widest" 
          style={{
            bottom: '0.5rem',
            left: '1.5rem',
            fontSize: '0.875rem',
            color: 'rgba(255, 254, 240, 0.2)',
            fontFamily: "'Figtree', sans-serif",
            opacity: isSystem ? 0 : 1
          }}
        >
          COORD: 29.9792458° N, 31.1342° E
        </div>
      )}

      {/* Debug: Map position indicator - Desktop only */}
      {!isMobile && (
        <div 
          className="fixed top-4 right-4 z-50 text-xs font-mono pointer-events-none"
          style={{ color: 'rgba(147, 51, 234, 0.6)' }}
        >
          Map: ({mapPosition.x.toFixed(2)}, {mapPosition.y.toFixed(2)}) {isMapAnimating ? '⟳' : '●'}
        </div>
      )}

      {/* Frame counter - Desktop only - Bottom right */}
      {!isMobile && (
        <div 
          className="fixed bottom-4 right-4 z-50 text-xs font-mono pointer-events-none text-right"
        >
          <div style={{ color: 'rgba(245, 158, 11, 0.6)' }}>
            Frame: {currentFrame}/{TOTAL_ANIMATION_FRAMES}
          </div>
        </div>
      )}



      {/* ========================= */}
      {/* PAGE COMPONENTS - Smart pre-loading with content-visibility */}
      {/* Uses CSS content-visibility: auto to skip rendering off-screen content */}
      {/* ========================= */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 95,
          pointerEvents: 'none',
          overflow: 'visible',
        }}
      >
        {/* Each page is positioned at its grid location */}
        {/* Filosofie - Top-left button area */}
        <div style={{
          position: 'absolute',
          width: '100vw',
          height: '100vh',
          transform: `translate(${(GRID_POSITIONS.filosofie.x - mapPosition.x) * 100}vw, ${(GRID_POSITIONS.filosofie.y - mapPosition.y) * 100}vh)`,
          transition: isMapAnimating ? 'none' : 'transform 0.1s ease-out',
          pointerEvents: activeSection === 'filosofie' ? 'auto' : 'none',
          // Smart rendering: skip painting when far off-screen
          contentVisibility: (activeSection === 'filosofie' || isMapAnimating) ? 'visible' : 'auto',
          containIntrinsicSize: '100vw 100vh',
          willChange: activeSection === 'filosofie' ? 'transform' : 'auto',
        }}>
          <FilosofiePage 
            isVisible={activeSection === 'filosofie' || isMapAnimating}
            onBack={handleCloseSection} 
          />
        </div>

        {/* Gardens - Bottom-RIGHT button area */}
        <div style={{
          position: 'absolute',
          width: '100vw',
          height: '100vh',
          transform: `translate(${(GRID_POSITIONS.gardens.x - mapPosition.x) * 100}vw, ${(GRID_POSITIONS.gardens.y - mapPosition.y) * 100}vh)`,
          transition: isMapAnimating ? 'none' : 'transform 0.1s ease-out',
          pointerEvents: activeSection === 'gardens' ? 'auto' : 'none',
          contentVisibility: (activeSection === 'gardens' || isMapAnimating) ? 'visible' : 'auto',
          containIntrinsicSize: '100vw 100vh',
          willChange: activeSection === 'gardens' ? 'transform' : 'auto',
        }}>
          <GardensPage 
            isVisible={activeSection === 'gardens' || isMapAnimating}
            onBack={handleCloseSection}
            initialBrandIndex={gardensBrandIndex}
          />
        </div>

        {/* Monitor/Data - Bottom-LEFT button area */}
        <div style={{
          position: 'absolute',
          width: '100vw',
          height: '100vh',
          transform: `translate(${(GRID_POSITIONS.monitor.x - mapPosition.x) * 100}vw, ${(GRID_POSITIONS.monitor.y - mapPosition.y) * 100}vh)`,
          transition: isMapAnimating ? 'none' : 'transform 0.1s ease-out',
          pointerEvents: activeSection === 'monitor' ? 'auto' : 'none',
          contentVisibility: (activeSection === 'monitor' || isMapAnimating) ? 'visible' : 'auto',
          containIntrinsicSize: '100vw 100vh',
          willChange: activeSection === 'monitor' ? 'transform' : 'auto',
        }}>
          <DataPage 
            isVisible={activeSection === 'monitor' || isMapAnimating}
            onBack={handleCloseSection} 
          />
        </div>

        {/* Login - Right verbindingsmenu button area */}
        <div style={{
          position: 'absolute',
          width: '100vw',
          height: '100vh',
          transform: `translate(${(GRID_POSITIONS.login.x - mapPosition.x) * 100}vw, ${(GRID_POSITIONS.login.y - mapPosition.y) * 100}vh)`,
          transition: isMapAnimating ? 'none' : 'transform 0.1s ease-out',
          pointerEvents: activeSection === 'login' ? 'auto' : 'none',
          contentVisibility: (activeSection === 'login' || isMapAnimating) ? 'visible' : 'auto',
          containIntrinsicSize: '100vw 100vh',
          willChange: activeSection === 'login' ? 'transform' : 'auto',
        }}>
          <LoginPage 
            isVisible={activeSection === 'login' || isMapAnimating}
            onBack={handleCloseSection} 
          />
        </div>

        {/* Eyedentity/Menu - Left verbindingsmenu button area */}
        <div style={{
          position: 'absolute',
          width: '100vw',
          height: '100vh',
          transform: `translate(${(GRID_POSITIONS.menu.x - mapPosition.x) * 100}vw, ${(GRID_POSITIONS.menu.y - mapPosition.y) * 100}vh)`,
          transition: isMapAnimating ? 'none' : 'transform 0.1s ease-out',
          pointerEvents: activeSection === 'menu' ? 'auto' : 'none',
          contentVisibility: (activeSection === 'menu' || isMapAnimating) ? 'visible' : 'auto',
          containIntrinsicSize: '100vw 100vh',
          willChange: activeSection === 'menu' ? 'transform' : 'auto',
        }}>
          <EyedentityPage 
            isVisible={activeSection === 'menu' || isMapAnimating}
            onBack={handleCloseSection} 
          />
        </div>
      </div>
      </Suspense>

    </main>
  );
};

export default App;
