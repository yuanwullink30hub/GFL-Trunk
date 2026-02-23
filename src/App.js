import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import HoloEarth from './components/orbital/HoloEarth';
import DesktopLayout from './components/orbital/DesktopLayout';
import { AssessmentIntro, AssessmentCard, AssessmentUpload, AssessmentLayerPanel } from './components/assessment';
import AssessmentResultsModal from './components/assessment/AssessmentResultsModal';
import { assessmentSubjects } from './pages/assessment/assessmentData';
import { getPerformanceSettings } from './utils/performanceMonitor';
import { preloadAll, preloadInBackground } from './utils/preloadUtils';
import { FilosofiePage, GardensPage, DataPage, LoginPage, EyedentityPage } from './pages';
import { BRANDS } from './pages/GeneralBrandPage/brandData';
import { useLanguage } from './contexts/LanguageContext';

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
// MOBILE NAVIGATION WHEEL
// Circular navigation at bottom of screen for mobile
// ============================================
// ============================================
// MOBILE NAVIGATION ITEMS - Arranged like a clock (360°)
// 0° (top) = Deltawerken, 60° = Gardens, 120° = Blackhole
// 180° (bottom) = Eyedentity, 240° = Data, 300° = Filosofie
// ============================================
const MOBILE_NAV_ITEMS = [
  { 
    key: 'deltawerken', 
    label: 'DELTAWERKEN', 
    descriptionKey: 'mobileNav.deltawerken',
    icon: 'deltawerken-custom', // custom SVG: circle with triangle inside
    color: '#06b6d4', // cyan
    angle: 0 // 0° - top of clock
  },
  { 
    key: 'gardens', 
    label: 'GARDENS', 
    descriptionKey: 'mobileNav.gardens',
    icon: '⬡',
    color: '#22c55e', // green
    angle: 60 // 60° - 2 o'clock position
  },
  { 
    key: 'menu', 
    label: 'BLACKHOLE', 
    descriptionKey: 'mobileNav.blackhole',
    icon: '●',
    color: '#ef4444', // red
    angle: 120 // 120° - 4 o'clock position
  },
  { 
    key: 'login', 
    label: 'EYEDENTITY', 
    descriptionKey: 'mobileNav.eyedentity',
    icon: '◈',
    color: '#f59e0b', // amber
    angle: 180 // 180° - bottom of clock
  },
  { 
    key: 'monitor', 
    label: 'DATA', 
    descriptionKey: 'mobileNav.data',
    icon: '▣',
    color: '#3b82f6', // blue
    angle: 240 // 240° - 8 o'clock position
  },
  { 
    key: 'filosofie', 
    label: 'FILOSOFIE', 
    descriptionKey: 'mobileNav.filosofie',
    icon: '◇',
    color: '#a855f7', // purple
    angle: 300 // 300° - 10 o'clock position
  },
];

const MobileNavWheel = ({ onNavigate, activeSection, onIndexChange, onRotationChange, onBrandChange, headerOpacity = 1, headerY = 0, currentFrame = 0 }) => {
  const { t } = useLanguage();
  const [expandedItem, setExpandedItem] = useState(null);
  const [isListOpen, setIsListOpen] = useState(false);
  const [virtualIndex, setVirtualIndex] = useState(0); // Virtual index for infinite circular scroll
  const [scrollDirection, setScrollDirection] = useState(0); // -1 = left/ccw, 1 = right/cw
  const wheelRef = useRef(null);
  const eventWrapperRef = useRef(null); // Separate ref for event handling wrapper
  const touchStartRef = useRef(null);
  
  // Brand ring state (for Gardens)
  const [brandVirtualIndex, setBrandVirtualIndex] = useState(0);
  const [brandRingExpanded, setBrandRingExpanded] = useState(false); // Delayed expansion state
  const brandRingRef = useRef(null);
  const brandTouchStartRef = useRef(null);
  
  // Wheel configuration
  const wheelSizeVw = 75; // percentage of viewport width (1.1x of 68)
  const itemRadiusPercent = 0.40; // Distance from center - reduced to keep items inside outer border
  const totalItems = MOBILE_NAV_ITEMS.length;
  const anglePerItem = 360 / totalItems; // degrees between each item (60°)
  
  // Calculate continuous rotation - item at virtualIndex should be at top
  // Wheel rotation: when virtualIndex increases, wheel rotates clockwise (negative degrees)
  const rotation = -virtualIndex * anglePerItem;
  
  // Get the currently active item (at top of wheel)
  const activeItemIndex = ((virtualIndex % totalItems) + totalItems) % totalItems;
  
  // Brand ring configuration (12 brands)
  const totalBrands = BRANDS.length;
  const brandAnglePerItem = 360 / totalBrands; // 30° between brands
  const brandRotation = -brandVirtualIndex * brandAnglePerItem;
  const activeBrandIndex = ((brandVirtualIndex % totalBrands) + totalBrands) % totalBrands;
  
  // Is Gardens active? (index 1)
  const isGardensActive = activeItemIndex === 1;
  
  // Delayed brand ring expansion - expands after Gardens is active for a moment
  useEffect(() => {
    let timeoutId;
    if (isGardensActive) {
      // Short delay before expanding the ring
      timeoutId = setTimeout(() => {
        setBrandRingExpanded(true);
      }, 150); // 150ms delay
    } else {
      // Immediately collapse when leaving Gardens
      setBrandRingExpanded(false);
    }
    return () => clearTimeout(timeoutId);
  }, [isGardensActive]);
  
  // Notify parent of index and rotation changes
  useEffect(() => {
    if (onIndexChange) {
      onIndexChange(activeItemIndex, scrollDirection, MOBILE_NAV_ITEMS[activeItemIndex]?.key);
    }
    if (onRotationChange) {
      // Pass the wheel rotation so content can sync with it
      onRotationChange(rotation, activeItemIndex);
    }
  }, [activeItemIndex, scrollDirection, rotation, onIndexChange, onRotationChange]);
  
  // Notify parent of brand changes when Gardens is active
  useEffect(() => {
    if (onBrandChange && isGardensActive) {
      onBrandChange(activeBrandIndex);
    }
  }, [activeBrandIndex, isGardensActive, onBrandChange]);
  
  const handleItemClick = (item, itemIndex) => {
    // Calculate shortest path to clicked item
    const currentMod = ((virtualIndex % totalItems) + totalItems) % totalItems;
    let diff = itemIndex - currentMod;
    if (diff > totalItems / 2) diff -= totalItems;
    if (diff < -totalItems / 2) diff += totalItems;
    
    if (diff === 0) {
      // Item is already at top - handle expand/navigate
      if (expandedItem === item.key) {
        // Second tap - navigate
        onNavigate(item.key);
        setExpandedItem(null);
        setIsListOpen(false);
      } else {
        // First tap - expand to show description
        setExpandedItem(item.key);
      }
    } else {
      // Rotate to clicked item
      setScrollDirection(diff > 0 ? 1 : -1);
      setVirtualIndex(virtualIndex + diff);
      setExpandedItem(null);
    }
  };
  
  // Scoped Wheel Event Listener - only works when scrolling on the event wrapper
  useEffect(() => {
    const handleWheel = (e) => {
      // Only allow navigation during frames 0-5
      if (currentFrame > 5) return;
      
      // Only handle horizontal-ish scrolls or vertical scrolls
      const direction = e.deltaY > 0 ? 1 : -1;
      setScrollDirection(direction);
      setVirtualIndex(prev => prev + direction);
      setExpandedItem(null);
      
      // Prevent page scroll when wheel is being used for navigation
      e.preventDefault();
    };

    // Listen on the event wrapper element
    const el = eventWrapperRef.current;
    if (el) {
      el.addEventListener('wheel', handleWheel, { passive: false });
    }
    
    return () => {
      if (el) {
        el.removeEventListener('wheel', handleWheel);
      }
    };
  }, [currentFrame]);
  
  // Handle touch swipe - scoped to event wrapper only
  useEffect(() => {
    const handleTouchStart = (e) => {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now()
      };
    };
    
    const handleTouchEnd = (e) => {
      if (!touchStartRef.current) return;
      
      // Only allow navigation during frames 0-5
      if (currentFrame > 5) {
        touchStartRef.current = null;
        return;
      }
      
      const touchEnd = e.changedTouches[0].clientX;
      const diff = touchStartRef.current.x - touchEnd;
      const timeDiff = Date.now() - touchStartRef.current.time;
      
      // Lower threshold: 80px swipe OR 30% of screen width, whichever is smaller
      // Also check for quick swipes (velocity)
      const minSwipe = Math.min(80, window.innerWidth * 0.3);
      const velocity = Math.abs(diff) / timeDiff;
      
      if (Math.abs(diff) > minSwipe || (Math.abs(diff) > 40 && velocity > 0.3)) {
        const direction = diff > 0 ? 1 : -1; // Swipe left = next (clockwise), swipe right = prev
        setScrollDirection(direction);
        setVirtualIndex(prev => prev + direction);
        setExpandedItem(null);
      }
      touchStartRef.current = null;
    };

    // Add listeners to the event wrapper element
    const el = eventWrapperRef.current;
    if (el) {
      el.addEventListener('touchstart', handleTouchStart, { passive: true });
      el.addEventListener('touchend', handleTouchEnd, { passive: true });
    }
    
    return () => {
      if (el) {
        el.removeEventListener('touchstart', handleTouchStart);
        el.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [currentFrame]);
  
  // Brand ring scroll handler (separate from main wheel)
  useEffect(() => {
    const handleBrandWheel = (e) => {
      if (currentFrame > 5) return;
      if (!isGardensActive) return;
      
      const direction = e.deltaY > 0 ? 1 : -1;
      setBrandVirtualIndex(prev => prev + direction);
      e.preventDefault();
    };

    const el = brandRingRef.current;
    if (el) {
      el.addEventListener('wheel', handleBrandWheel, { passive: false });
    }
    
    return () => {
      if (el) {
        el.removeEventListener('wheel', handleBrandWheel);
      }
    };
  }, [currentFrame, isGardensActive]);
  
  // Brand ring touch handler
  useEffect(() => {
    const handleBrandTouchStart = (e) => {
      brandTouchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now()
      };
    };
    
    const handleBrandTouchEnd = (e) => {
      if (!brandTouchStartRef.current) return;
      if (currentFrame > 5) {
        brandTouchStartRef.current = null;
        return;
      }
      if (!isGardensActive) {
        brandTouchStartRef.current = null;
        return;
      }
      
      const touchEnd = e.changedTouches[0].clientX;
      const diff = brandTouchStartRef.current.x - touchEnd;
      const timeDiff = Date.now() - brandTouchStartRef.current.time;
      
      const minSwipe = Math.min(60, window.innerWidth * 0.2);
      const velocity = Math.abs(diff) / timeDiff;
      
      if (Math.abs(diff) > minSwipe || (Math.abs(diff) > 30 && velocity > 0.3)) {
        const direction = diff > 0 ? 1 : -1;
        setBrandVirtualIndex(prev => prev + direction);
      }
      brandTouchStartRef.current = null;
    };

    const el = brandRingRef.current;
    if (el) {
      el.addEventListener('touchstart', handleBrandTouchStart, { passive: true });
      el.addEventListener('touchend', handleBrandTouchEnd, { passive: true });
    }
    
    return () => {
      if (el) {
        el.removeEventListener('touchstart', handleBrandTouchStart);
        el.removeEventListener('touchend', handleBrandTouchEnd);
      }
    };
  }, [currentFrame, isGardensActive]);
  
  return (
    <>
      {/* Expanded List Overlay */}
      {isListOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(10px)',
          }}
          onClick={() => setIsListOpen(false)}
        >
          <div 
            className="flex flex-col gap-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {MOBILE_NAV_ITEMS.map((item, i) => (
              <button
                key={item.key}
                className="flex items-center gap-4 px-6 py-4 rounded-lg transition-all duration-300"
                style={{
                  background: i === activeItemIndex ? 'rgba(147, 51, 234, 0.2)' : 'rgba(0,0,0,0.6)',
                  border: `2px solid ${i === activeItemIndex ? item.color : item.color + '40'}`,
                  minWidth: '16rem',
                }}
                onClick={() => { handleItemClick(item, i); setIsListOpen(false); }}
              >
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: '3rem',
                    height: '3rem',
                    background: `radial-gradient(circle, ${item.color}30 0%, transparent 100%)`,
                    border: `2px solid ${item.color}`,
                  }}
                >
                  <span style={{ color: item.color, fontSize: '1.2rem' }}>{item.icon}</span>
                </div>
                <div className="text-left">
                  <div style={{ 
                    color: item.color, 
                    fontFamily: "'Lexend Mega', sans-serif",
                    fontSize: '0.9rem',
                    letterSpacing: '0.1em'
                  }}>
                    {item.label}
                  </div>
                  <div style={{ 
                    color: 'rgba(255,255,255,0.5)', 
                    fontFamily: "'Figtree', sans-serif",
                    fontSize: '0.7rem',
                    marginTop: '0.25rem'
                  }}>
                    {t(item.descriptionKey)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* UNDERLAY - Circular background behind the nav wheel + brand ring area only */}
      {/* Sized to match brand ring (1.35x wheel), positioned same as wheels */}
      {/* z-38 ensures it's behind nav wheel (z-40) and brand ring (z-40) */}
      <div 
        className="fixed left-1/2 pointer-events-none"
        style={{
          bottom: 0,
          transform: `translateX(-50%) translateY(calc(50% + ${-headerY}px))`,
          width: `${wheelSizeVw * 1.35}vw`, // Same size as brand ring (outermost)
          maxWidth: '30rem',
          aspectRatio: '1',
          background: 'rgba(0, 0, 0, 0.85)',
          borderRadius: '50%',
          opacity: isGardensActive ? headerOpacity : 0,
          transition: 'opacity 0.4s ease, transform 0.3s ease',
          clipPath: 'inset(-50% -50% 50% -50%)', // Only show top half (same as wheels)
          zIndex: 38,
        }}
      />
      
      {/* Half-circle wheel container */}
      <div 
        ref={wheelRef}
        className="fixed left-1/2"
        style={{
          bottom: 0,
          transform: `translateX(-50%) translateY(calc(50% + ${-headerY}px))`, // Move down 50% so only top half shows
          width: `${wheelSizeVw}vw`,
          maxWidth: '22rem',
          aspectRatio: '1',
          pointerEvents: 'auto',
          overflow: 'visible', // Allow drop shadows to show
          clipPath: 'inset(-50% -50% 50% -50%)', // Hide bottom half but allow overflow for shadows
          opacity: headerOpacity,
          transition: 'transform 0.3s ease, opacity 0.3s ease',
          zIndex: 42, // Higher than underlay (z-38) and brand ring (z-40)
        }}
      >
        {/* Wheel background glow */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle at center, rgba(147, 51, 234, 0.15) 0%, transparent 70%)',
            filter: 'blur(1.25rem)',
          }}
        />
        
        {/* Outer ring */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            border: '1px solid rgba(147, 51, 234, 0.3)',
            background: 'radial-gradient(circle at center 30%, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.95) 100%)',
          }}
        />
        
        {/* Inner decorative ring */}
        <div 
          className="absolute rounded-full"
          style={{
            top: '15%',
            left: '15%',
            right: '15%',
            bottom: '15%',
            border: '1px solid rgba(147, 51, 234, 0.2)',
          }}
        />
        
        {/* Center content - Logo only - positioned in visible top half */}
        <div 
          className="absolute left-1/2"
          style={{
            top: 'calc(25% + 0.8rem)', // Position in visible top half (moved up 1.2rem)
            transform: 'translateX(-50%) translateY(-50%)',
            zIndex: 100,
          }}
        >
          <img 
            src="/images/landingpage/logo.png" 
            alt="Logo"
            style={{
              width: 'clamp(3.5rem, 16vw, 5rem)',
              height: 'clamp(3.5rem, 16vw, 5rem)',
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 15px rgba(147, 51, 234, 0.6))',
            }}
          />
        </div>
        
        {/* Rotating wheel with all items positioned like clock */}
        <div 
          className="absolute inset-0 transition-transform duration-500 ease-out"
          style={{
            transform: `rotate(${rotation}deg)`,
          }}
        >
          {/* Navigation items arranged in 360° circle */}
          {MOBILE_NAV_ITEMS.map((item, index) => {
            // Position items around the circle - first item at top (-90°)
            const itemAngle = -90 + (index * anglePerItem); // degrees
            const angleRad = (itemAngle * Math.PI) / 180;
            
            // Position as percentage of container
            const x = 50 + itemRadiusPercent * 100 * Math.cos(angleRad);
            const y = 50 + itemRadiusPercent * 100 * Math.sin(angleRad);
            
            const isActive = index === activeItemIndex;
            const isExpanded = expandedItem === item.key && isActive;
            
            // Shrink Gardens item when brand ring is expanded (not just active)
            const isGardensItem = item.key === 'gardens';
            const gardensScale = isGardensItem && brandRingExpanded ? 0.7 : 1;
            
            return (
              <div
                key={item.key}
                className="absolute flex flex-col items-center transition-all duration-300"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  // Counter-rotate so items stay upright, scale down Gardens when brand ring is active
                  transform: `translate(-50%, -50%) rotate(${-rotation}deg) scale(${gardensScale})`,
                  width: 'clamp(4rem, 18vw, 5.5rem)',
                  pointerEvents: 'auto',
                  zIndex: isActive ? 100 : 10,
                  opacity: isActive ? 1 : 0.6,
                }}
                onClick={() => handleItemClick(item, index)}
              >
                {/* Icon circle - 0.85x size */}
                <div
                  className="flex items-center justify-center rounded-full transition-all duration-300"
                  style={{
                    width: isActive ? 'clamp(2.72rem, 11.05vw, 3.4rem)' : 'clamp(2.04rem, 7.65vw, 2.55rem)',
                    height: isActive ? 'clamp(2.72rem, 11.05vw, 3.4rem)' : 'clamp(2.04rem, 7.65vw, 2.55rem)',
                    background: isActive 
                      ? `radial-gradient(circle, ${item.color}40 0%, ${item.color}20 100%)`
                      : 'rgba(0,0,0,0.6)',
                    border: `2px solid ${isActive ? item.color : 'rgba(147, 51, 234, 0.4)'}`,
                  }}
                >
                  {item.icon === 'deltawerken-custom' ? (
                    // Custom icon: circle with triangle overlayed inside - 1.5x size
                    <div style={{ 
                      position: 'relative',
                      width: isActive ? 'clamp(1.65rem, 6.75vw, 2.25rem)' : 'clamp(1.2rem, 4.5vw, 1.5rem)',
                      height: isActive ? 'clamp(1.65rem, 6.75vw, 2.25rem)' : 'clamp(1.2rem, 4.5vw, 1.5rem)',
                    }}>
                      {/* Outer circle */}
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        border: `2px solid ${isActive ? item.color : '#c4b5fd'}`,
                      }} />
                      {/* Inner triangle */}
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -45%)',
                        width: 0,
                        height: 0,
                        borderLeft: `${isActive ? '0.525rem' : '0.375rem'} solid transparent`,
                        borderRight: `${isActive ? '0.525rem' : '0.375rem'} solid transparent`,
                        borderBottom: `${isActive ? '0.9rem' : '0.6rem'} solid ${isActive ? item.color : '#c4b5fd'}`,
                      }} />
                    </div>
                  ) : (
                    <span style={{ 
                      color: isActive ? item.color : '#c4b5fd',
                      fontSize: isActive ? 'clamp(1.65rem, 6.75vw, 2.25rem)' : 'clamp(1.2rem, 4.5vw, 1.5rem)',
                    }}>{item.icon}</span>
                  )}
                </div>
                
                {/* Label - only show for active item */}
                {isActive && (
                  <span 
                    className="text-center transition-all duration-300"
                    style={{
                      marginTop: '0.35rem',
                      fontSize: 'clamp(0.5rem, 2vw, 0.7rem)',
                      fontFamily: "'Lexend Mega', sans-serif",
                      letterSpacing: '0.05em',
                      color: item.color,
                      textShadow: `0 0 0.625rem ${item.color}`,
                    }}
                  >
                    {item.label}
                  </span>
                )}
                
                {/* Description tooltip - shows on expand */}
                {isExpanded && (
                  <div 
                    className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg"
                    style={{
                      top: '-3.5rem',
                      padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(0.75rem, 3vw, 1.25rem)',
                      background: 'rgba(0,0,0,0.95)',
                      border: `1px solid ${item.color}60`,
                      boxShadow: `0 0 1.5rem ${item.color}30`,
                    }}
                  >
                    <div style={{
                      fontSize: 'clamp(0.6rem, 2.5vw, 0.8rem)',
                      color: item.color,
                      fontFamily: "'Figtree', sans-serif",
                    }}>
                      {t(item.descriptionKey)}
                    </div>
                    <div className="text-center" style={{
                      marginTop: '0.25rem',
                      fontSize: 'clamp(0.5rem, 2vw, 0.65rem)',
                      color: 'rgba(255,255,255,0.5)',
                      fontFamily: "'Figtree', sans-serif",
                    }}>
                      TAP AGAIN TO OPEN
                    </div>
                    {/* Arrow pointing down */}
                    <div 
                      className="absolute left-1/2 -translate-x-1/2"
                      style={{
                        bottom: '-0.4rem',
                        width: 0,
                        height: 0,
                        borderLeft: '0.4rem solid transparent',
                        borderRight: '0.4rem solid transparent',
                        borderTop: `0.4rem solid ${item.color}60`,
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* BRAND RING - Outer ring that appears when Gardens is active */}
      {/* Shows 12 brand logos arranged in a circle outside the main wheel */}
      {/* Styled to match the main nav wheel but with orange outer border */}
      {/* Expands from nav wheel size (scale 0.74 = 1/1.35) to full size after delay */}
      <div 
        className="fixed left-1/2 z-40 pointer-events-none"
        style={{
          bottom: 0,
          transform: `translateX(-50%) translateY(calc(50% + ${-headerY}px)) scale(${brandRingExpanded ? 1 : 0.74})`,
          width: `${wheelSizeVw * 1.35}vw`, // 35% larger than main wheel
          maxWidth: '30rem',
          aspectRatio: '1',
          opacity: isGardensActive ? headerOpacity : 0,
          transition: 'opacity 0.3s ease, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          clipPath: 'inset(-50% -50% 50% -50%)', // Hide bottom half
          transformOrigin: 'center center',
        }}
      >
        {/* Outer ring background glow - matches main wheel style */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle at center, rgba(249, 115, 22, 0.15) 0%, transparent 70%)',
            filter: 'blur(1.25rem)',
          }}
        />
        
        {/* Outer ring border - orange accent */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            border: '1px solid rgba(249, 115, 22, 0.4)',
            background: 'radial-gradient(circle at center 30%, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.95) 100%)',
          }}
        />
        
        {/* No inner ring - the original nav wheel's purple border serves as the visual inner boundary */}
        
        {/* Rotating brand container */}
        <div
          className="absolute inset-0 transition-transform duration-500 ease-out"
          style={{
            transform: `rotate(${brandRotation}deg)`,
          }}
        >
          {BRANDS.map((brand, index) => {
            const brandAngle = index * brandAnglePerItem;
            const radians = (brandAngle - 90) * (Math.PI / 180);
            // Position brands between inner border (38% radius) and outer border (50% radius)
            // Center of that band is at 44% radius
            const brandRadiusPercent = 0.44;
            const x = 50 + brandRadiusPercent * 100 * Math.cos(radians);
            const y = 50 + brandRadiusPercent * 100 * Math.sin(radians);
            const isBrandActive = index === activeBrandIndex;
            
            return (
              <div
                key={brand.id}
                className="absolute flex items-center justify-center transition-all duration-300"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: `translate(-50%, -50%) rotate(${-brandRotation}deg)`, // Counter-rotate to keep upright
                  width: isBrandActive ? 'clamp(3.59rem, 13.46vw, 4.49rem)' : 'clamp(2.69rem, 10.47vw, 3.29rem)',
                  height: isBrandActive ? 'clamp(3.59rem, 13.46vw, 4.49rem)' : 'clamp(2.69rem, 10.47vw, 3.29rem)',
                  opacity: isBrandActive ? 1 : 0.6,
                  zIndex: isBrandActive ? 10 : 1,
                }}
              >
                <img 
                  src={brand.logoUrl} 
                  alt={brand.name}
                  className="w-full h-full object-contain"
                  style={{
                    filter: isBrandActive 
                      ? 'drop-shadow(0 0 12px rgba(249, 115, 22, 0.6))' 
                      : 'grayscale(100%) brightness(0.7)',
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
      
      {/* BRAND RING EVENT WRAPPER - Separate hit area for brand scrolling */}
      {/* Clip path creates a ring shape: outer radius 50%, inner radius ~37% (matches main wheel edge) */}
      {/* Main wheel is 1x size, brand ring is 1.35x, so inner edge = 1/1.35 = 74% of brand ring = 37% radius */}
      <div 
        ref={brandRingRef}
        className="fixed left-1/2"
        style={{
          bottom: 0,
          transform: `translateX(-50%) translateY(calc(50% + ${-headerY}px))`,
          width: `${wheelSizeVw * 1.35}vw`,
          maxWidth: '30rem',
          aspectRatio: '1',
          pointerEvents: isGardensActive && headerOpacity > 0 ? 'auto' : 'none',
          zIndex: 201, // Above main wheel event wrapper
          background: 'transparent',
          transition: 'transform 0.3s ease',
          // Ring-shaped clip: outer circle (50% radius) minus inner circle (37% radius = main wheel edge)
          // Using polygon approximation for ring shape (top half only since bottom is clipped)
          clipPath: 'polygon(50% 0%, 61% 1%, 71% 4%, 80% 9%, 88% 16%, 94% 25%, 98% 35%, 100% 46%, 100% 50%, 0% 50%, 0% 46%, 2% 35%, 6% 25%, 12% 16%, 20% 9%, 29% 4%, 39% 1%, 50% 0%, 50% 13%, 41% 14%, 33% 17%, 26% 22%, 20% 28%, 16% 36%, 14% 44%, 13% 50%, 87% 50%, 86% 44%, 84% 36%, 80% 28%, 74% 22%, 67% 17%, 59% 14%, 50% 13%)',
          // Debug: uncomment to see the wrapper
          // background: 'rgba(249,115,22,0.3)',
        }}
      />
      
      {/* EVENT WRAPPER - Invisible overlay on top of nav wheel for scroll/touch events */}
      {/* z-index 200 ensures it's above content (z-100) but captures events only in wheel area */}
      <div 
        ref={eventWrapperRef}
        className="fixed left-1/2"
        style={{
          bottom: 0,
          transform: `translateX(-50%) translateY(calc(50% + ${-headerY}px))`, // Same position as wheel + slide animation
          width: `${wheelSizeVw}vw`,
          maxWidth: '22rem',
          aspectRatio: '1',
          pointerEvents: headerOpacity > 0 ? 'auto' : 'none', // Disable events when hidden
          zIndex: 200, // Higher than content (z-100) to capture scroll events
          // Transparent - only captures events
          background: 'transparent',
          transition: 'transform 0.3s ease',
          // Debug: uncomment to see the wrapper
          // background: 'rgba(255,0,0,0.2)',
        }}
      />
      
      {/* Swipe hint below wheel - at bottom of window */}
      <div 
        className="fixed z-40 flex items-center justify-center gap-2"
        style={{ 
          bottom: 'clamp(0.6rem, 2.5vw, 1.2rem)',
          left: '50%',
          transform: `translateX(-50%) translateY(${-headerY}px)`, // Slide down with wheel
          opacity: headerOpacity, // Full opacity, no 0.6 multiplier
          width: '100%',
          transition: 'transform 0.3s ease, opacity 0.3s ease',
        }}
      >
        <span style={{ fontSize: 'clamp(0.95rem, 4vw, 1.3rem)', color: '#d8b4fe' }}>◀</span>
        <span style={{ 
          fontSize: 'clamp(0.8rem, 3.2vw, 1.05rem)', 
          color: '#d8b4fe', 
          fontFamily: "'Lexend Mega', sans-serif", 
          letterSpacing: '0.2em',
          textTransform: 'uppercase'
        }}>SWIPE</span>
        <span style={{ fontSize: 'clamp(0.95rem, 4vw, 1.3rem)', color: '#d8b4fe' }}>▶</span>
      </div>
    </>
  );
};

// ============================================
// MOBILE PAGE CONTENT - Circular transition animations
// Content is "sticky" to its nav item on the virtual 360° clock
// When wheel rotates, content follows along the circular path
// ============================================
// ============================================
// MOBILE CONTENT TRANSFORM CALCULATOR
// Calculates circular position based on wheel rotation
// Clockwise (scroll up) → content exits LEFT with curve down
// Counter-clockwise (scroll down) → content exits RIGHT with curve down
// ============================================
const getMobileContentTransform = (itemIndex, wheelRotation) => {
  const totalItems = MOBILE_NAV_ITEMS.length;
  const anglePerItem = 360 / totalItems; // 60° between items
  
  // Current angle of this item relative to top (0° = top/active position)
  const itemBaseAngle = itemIndex * anglePerItem;
  const currentAngle = itemBaseAngle + wheelRotation;
  
  // Normalize angle to -180 to 180 range
  let normalizedAngle = ((currentAngle % 360) + 360) % 360;
  if (normalizedAngle > 180) normalizedAngle -= 360;
  
  // Convert angle to radians
  const angleRad = (normalizedAngle * Math.PI) / 180;
  
  // ============================================
  // CAROUSEL MOTION:
  // - Positive angle (clockwise rotation) → content moves RIGHT (positive X)
  // - Negative angle (counter-clockwise) → content moves LEFT (negative X)
  // ============================================
  const contentRadius = 250; // Large radius for smooth exit off-screen
  
  // X position: clockwise → exits RIGHT, counter-clockwise → exits LEFT
  const xOffset = Math.sin(angleRad) * contentRadius;
  
  // Y position: minimal curve - mostly horizontal movement
  const yOffset = Math.abs(Math.sin(angleRad)) * 15;
  
  // Tilt: minimal rotation for cleaner horizontal movement
  const tiltAngle = -normalizedAngle * 0.02;
  
  // ============================================
  // OPACITY: Smooth fade as content slides out
  // ============================================
  const fadeStartAngle = 25; // Start fading at 25°
  const fadeEndAngle = 60; // Fully transparent by 60° for quick clean exit
  const absAngle = Math.abs(normalizedAngle);
  
  let opacity;
  if (absAngle <= fadeStartAngle) {
    opacity = 1; // Fully visible in center zone
  } else if (absAngle >= fadeEndAngle) {
    opacity = 0; // Fully hidden at edges
  } else {
    // Smooth fade between fadeStart and fadeEnd
    opacity = 1 - (absAngle - fadeStartAngle) / (fadeEndAngle - fadeStartAngle);
    // Apply easing for smoother fade
    opacity = opacity * opacity * (3 - 2 * opacity); // smoothstep
  }
  
  // Scale: keep scale mostly constant for cleaner movement
  const scale = 1 - Math.abs(normalizedAngle) / 800;
  
  // Z-index: keep page content BEHIND nav wheel (z-40) but in front of background
  // Active content at z-35, fades to lower z as it moves away
  const zIndex = Math.round(35 - Math.abs(normalizedAngle) / 10);
  
  // Is this item currently active (at top)?
  const isActive = Math.abs(normalizedAngle) < 30;
  
  // Is visible at all? Must be slightly larger than fadeEndAngle to allow transition to complete
  const isVisible = Math.abs(normalizedAngle) <= 75;
  
  return {
    transform: `translateX(${xOffset}%) translateY(${yOffset}%) rotate(${tiltAngle}deg) scale(${scale})`,
    opacity,
    zIndex,
    isActive,
    isVisible,
    normalizedAngle,
  };
};

// ============================================
// MOBILE PAGE CONTENT - Circular transition animations
// Content is "sticky" to its nav item on the virtual 360° clock
// NOTE: Deltawerken (index 0) is rendered separately as the main content
// ============================================
const MobilePageContent = ({ activeIndex, wheelRotation, onBack, brandIndex = 0 }) => {
  const renderPage = (item, index) => {
    // Skip deltawerken - it's rendered as the main HoloEarth content
    if (item.key === 'deltawerken') return null;
    
    const { transform, opacity, zIndex, isActive, isVisible, normalizedAngle } = 
      getMobileContentTransform(index, wheelRotation);
    
    const PageComponent = {
      filosofie: FilosofiePage,
      gardens: GardensPage,
      monitor: DataPage,
      login: LoginPage,
      menu: EyedentityPage,
    }[item.key];
    
    // Match the main content wrapper (Deltawerken) styling EXACTLY
    // No early return for !isVisible - let opacity handle the fade
    // This prevents "popping" when content crosses visibility threshold
    const pageStyle = {
      position: 'fixed',
      inset: 0,
      transform,
      opacity,
      transformOrigin: 'center center',
      pointerEvents: isActive ? 'auto' : 'none',
      // Smooth eased transition for carousel-like motion
      // visibility transition: instant when showing, delayed when hiding (to allow opacity fade)
      transition: 'transform 0.6s cubic-bezier(0.25, 0.1, 0.25, 1), opacity 0.6s cubic-bezier(0.25, 0.1, 0.25, 1), visibility 0s linear ' + (isVisible ? '0s' : '0.6s'),
      overflow: 'visible',
      willChange: 'transform, opacity',
      zIndex, // Same as Deltawerken - no +10 offset
      visibility: isVisible ? 'visible' : 'hidden', // Use CSS visibility for off-screen items (with delayed transition)
    };
    
    if (!PageComponent) {
      // Placeholder for pages not yet created
      return (
        <div style={pageStyle} key={item.key}>
          <div className="fixed inset-0 flex items-center justify-center bg-black/90">
            <div className="text-center">
              <div style={{ 
                fontSize: 'clamp(1.5rem, 6vw, 2.5rem)',
                color: item.color,
                fontFamily: "'Lexend Mega', sans-serif",
                marginBottom: '1rem'
              }}>
                {item.label}
              </div>
              <div style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: 'clamp(0.8rem, 3vw, 1rem)',
              }}>
                Coming soon...
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Pass brandIndex to GardensPage for brand selection
    const extraProps = item.key === 'gardens' ? { brandIndex } : {};
    
    return (
      <div style={pageStyle} key={item.key}>
        <PageComponent 
          isVisible={Math.abs(normalizedAngle) < 60}
          onBack={onBack}
          {...extraProps}
        />
      </div>
    );
  };
  
  // Render pages directly without a container wrapper - each page positions itself
  return (
    <>
      {MOBILE_NAV_ITEMS.map((item, index) => renderPage(item, index))}
    </>
  );
};

// ============================================
// ANIMATION SECTION CONFIGURATION
// Section 1 (frames 0-2): Label disappears, chunks become visible
// Section 2 (frames 3-45): Chunks and particles explosion (43 frames for smooth animation)
// Section 3 (frames 46-48): Pyramid shifts down, button visible at frame 49
// Total: 49 frames (0-48)
// ============================================
const SCROLL_BUTTON_FRAMES = 3; // Scroll button disappears (frames 0-2)
const SECTION_1_FRAMES = 3;     // Label disappears, chunks visible (frames 0-2)
const SECTION_2_FRAMES = 43;    // Chunks and particles explosion - maximized for smooth flow
const HEADER_START_FRAME = 12;  // Header/containers start vanishing mid-explosion
const SECTION_3_FRAMES = 3;     // Pyramid shifts down (frames 46-48)
// ============================================

const App = () => {
  const [mounted, setMounted] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true); // Loading screen visible for 6 seconds
  const [loadingFadeOut, setLoadingFadeOut] = useState(false); // Fade out animation state
  const [loadingProgress, setLoadingProgress] = useState(0); // Preloading progress (0-1)
  const [resourcesLoaded, setResourcesLoaded] = useState(false); // Track when all resources are ready
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
  const [coreScaleMultiplier, setCoreScaleMultiplier] = useState(1); // 1-5 scale for inner core growth
  const [resultsModalProgress, setResultsModalProgress] = useState(0); // 0-1 progress for results modal floating out
  const [resultsLoadingProgress, setResultsLoadingProgress] = useState(0); // 0-1 loading bar progress (AI thinking time)
  const [resultsPoetryIndex, setResultsPoetryIndex] = useState(0); // Current poetry slide index
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
  // MOBILE PAGE CONTENT STATE - Circular transitions
  // Content follows wheel rotation on the virtual 360° clock
  // ============================================
  const [mobileWheelRotation, setMobileWheelRotation] = useState(0); // Wheel rotation in degrees
  const [mobileActiveIndex, setMobileActiveIndex] = useState(0); // Currently active item index
  const [mobileBrandIndex, setMobileBrandIndex] = useState(0); // Currently active brand in Gardens
  
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
  const handleMobileRotationChange = useCallback((rotation, activeIndex) => {
    setMobileWheelRotation(rotation);
    setMobileActiveIndex(activeIndex);
  }, []);

  // Handle mobile brand changes from the brand ring
  const handleMobileBrandChange = useCallback((brandIndex) => {
    setMobileBrandIndex(brandIndex);
  }, []);

  // Pause auto-slide when user manually navigates, re-enable after 9 seconds
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

  // Beta lock: only allow full interaction on localhost
  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const hasLockOverride = urlParams.has('lock');
  const shouldShowLock = !isLocalhost || hasLockOverride;

  // Handler for opening sections - navigate on map
  const handleOpenSection = useCallback((section) => {
    // Beta lock: block locked sections (gardens, monitor, filosofie) on non-localhost
    // VERBINDINGS_MENU sections (menu, login) remain accessible
    const lockedSections = ['gardens', 'monitor', 'filosofie'];
    if (shouldShowLock && lockedSections.includes(section)) return;
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
    
    // Start preloading all heavy resources immediately
    // Loading screen shows until resources are loaded (max 6 seconds)
    const maxLoadTime = 6000;
    let hasEnded = false;
    
    const endLoadingScreen = () => {
      if (hasEnded) return;
      hasEnded = true;
      // 1) Jump progress bar to 100%
      setLoadingProgress(1);
      // 2) Wait for bar CSS transition to finish (300ms), then fade out
      setTimeout(() => {
        setLoadingFadeOut(true);
        // 3) Remove from DOM after fade-out (500ms)
        setTimeout(() => setShowLoadingScreen(false), 500);
      }, 400);
    };
    
    // Preload all resources - end loading screen when done
    preloadAll((progress) => {
      setLoadingProgress(progress);
    }).then(() => {
      setResourcesLoaded(true);
      console.log('[App] All resources preloaded');
      endLoadingScreen();
    }).catch(() => {
      // If preloading fails, still end loading screen
      console.warn('[App] Preloading failed, continuing anyway');
      endLoadingScreen();
    });
    
    // Fallback: max 6 seconds even if resources aren't fully loaded
    const maxTimer = setTimeout(() => {
      if (!hasEnded) {
        console.log('[App] Max load time reached, continuing');
        endLoadingScreen();
        // Continue loading in background
        preloadInBackground();
      }
    }, maxLoadTime);
    
    return () => {
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
            ? (currentLayerIndex + 1) / 4
            : currentLayerIndex / 4;
          newProgress = Math.min(newProgress, maxProgress);
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
  
  // Close assessment (back to hidden)
  const handleAssessmentClose = useCallback(() => {
    setAssessmentPhase('hidden');
    setAssessmentLevel(null);
  }, []);
  
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
    setConvergenceProgress(0);
    setCoreScaleMultiplier(1);
  }, []);
  
  // Convergence animation effect - panels float back, then core grows
  useEffect(() => {
    if (assessmentPhase !== 'convergence') return;
    
    const CONVERGENCE_DURATION = 3000; // 3s for panels to float back
    const CORE_GROWTH_DURATION = 2000; // 2s for core to grow
    const RESULTS_APPEAR_DURATION = 800; // 0.8s for results modal to float out
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      
      if (elapsed < CONVERGENCE_DURATION) {
        // Phase 1: Panels float back to entity center
        const progress = Math.min(elapsed / CONVERGENCE_DURATION, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setConvergenceProgress(eased);
      } else if (elapsed < CONVERGENCE_DURATION + CORE_GROWTH_DURATION) {
        // Phase 2: Core grows to fill pyramid
        setConvergenceProgress(1);
        const coreElapsed = elapsed - CONVERGENCE_DURATION;
        const coreProgress = Math.min(coreElapsed / CORE_GROWTH_DURATION, 1);
        // Ease out cubic for smooth growth
        const eased = 1 - Math.pow(1 - coreProgress, 3);
        const scale = 1 + eased * 4; // Grow from 1 to 5
        setCoreScaleMultiplier(scale);
      } else if (elapsed < CONVERGENCE_DURATION + CORE_GROWTH_DURATION + RESULTS_APPEAR_DURATION) {
        // Phase 3: Results modal floats out from entity
        setConvergenceProgress(1);
        setCoreScaleMultiplier(5);
        setAssessmentPhase('results');
        const resultsElapsed = elapsed - CONVERGENCE_DURATION - CORE_GROWTH_DURATION;
        const resultsProgress = Math.min(resultsElapsed / RESULTS_APPEAR_DURATION, 1);
        // Ease out back for overshoot effect
        const eased = 1 - Math.pow(1 - resultsProgress, 3);
        setResultsModalProgress(eased);
      } else {
        // Animation complete
        setConvergenceProgress(1);
        setCoreScaleMultiplier(5);
        setResultsModalProgress(1);
        return;
      }
      
      requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);
  }, [assessmentPhase]);
  
  // Results loading animation - poetry slideshow and loading bar
  useEffect(() => {
    if (assessmentPhase !== 'results') return;
    if (resultsModalProgress < 1) return; // Wait for modal to appear
    
    const LOADING_DURATION = 12000; // 12 seconds for AI to "think"
    const POETRY_INTERVAL = 2000; // Change poetry every 2 seconds
    const startTime = Date.now();
    
    // Reset loading state
    setResultsLoadingProgress(0);
    setResultsPoetryIndex(0);
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      
      // Update loading progress
      const progress = Math.min(elapsed / LOADING_DURATION, 1);
      // Ease-in-out for natural feeling
      const eased = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      setResultsLoadingProgress(eased);
      
      // Update poetry index based on time
      const poetryIdx = Math.min(
        Math.floor(elapsed / POETRY_INTERVAL),
        poetrySlides.length - 1
      );
      setResultsPoetryIndex(poetryIdx);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [assessmentPhase, resultsModalProgress, poetrySlides.length]);
  
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
  
  // Handle answer selection (AssessmentCard passes questionId and answerId)
  const handleAnswerSelect = useCallback((questionId, answerId) => {
    // Record the answer
    setAssessmentAnswers(prev => [...prev, {
      subjectIndex: currentSubjectIndex,
      questionIndex: currentQuestionIndex,
      questionId,
      answer: answerId
    }]);
    
    const questionsPerSubject = getQuestionsPerSubject(assessmentLevel);
    
    // Move to next question
    if (currentQuestionIndex < questionsPerSubject - 1) {
      // More questions in this subject
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (currentSubjectIndex < 4) {
      // Move to next subject
      setCurrentSubjectIndex(prev => prev + 1);
      setCurrentQuestionIndex(0);
    } else {
      // All questions done
      if (assessmentLevel === 'deep') {
        setAssessmentPhase('upload');
      } else {
        setAssessmentPhase('results');
        triggerGoldMode(); // Trigger gold mode on completion
      }
    }
  }, [currentSubjectIndex, currentQuestionIndex, assessmentLevel, triggerGoldMode]);
  
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
              ? (currentLayerIndex + 1) / 4
              : currentLayerIndex / 4;
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
  
  // Button becomes visible at frame 49 (the very last frame)
  // section1End=3, section2End=46, section3End=49
  const section3End = section2End + SECTION_3_FRAMES;
  const BUTTON_APPEAR_FRAME = section3End; // Frame 49 - the last frame
  const isSystem = currentFrame >= BUTTON_APPEAR_FRAME;

  // Pyramid layer scroll - only active after system is visible
  // This controls the layer float-up animation via scroll after the 3s intro
  // When isSystem becomes true, the 3s intro starts automatically in PyramidInner
  // After intro, scroll continues to control layer positions

  // Reset to frame 0
  const handleReset = () => {
    // Close assessment if it's open (any phase)
    if (assessmentPhase !== 'hidden') {
      setAssessmentPhase('hidden');
      setAssessmentLevel(null);
      setCoreScaleMultiplier(1);
      setConvergenceProgress(0);
      setResultsModalProgress(0);
      setResultsLoadingProgress(0);
    }
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
      className={`relative w-screen font-figtree ${isMobile ? 'min-h-screen overflow-visible' : 'h-screen overflow-hidden'}`}
      style={{color: '#FFFEF0', touchAction: isMobile ? 'pan-y pinch-zoom' : 'none'}}
    >
      {/* ========================= */}
      {/* LOADING SCREEN OVERLAY */}
      {/* ========================= */}
      {showLoadingScreen && (
        <div 
          className="fixed inset-0 flex items-center justify-center"
          style={{
            zIndex: 99999,
            backgroundColor: 'rgba(0, 0, 0, 0.98)',
            opacity: loadingFadeOut ? 0 : 1,
            transition: 'opacity 0.5s ease-out',
            pointerEvents: loadingFadeOut ? 'none' : 'auto'
          }}
        >
          {/* Loading Modal Container */}
          <div 
            className="relative backdrop-blur-md rounded-lg shadow-[0_0_30px_rgba(0,0,0,0.8)] flex flex-col items-center"
            style={{
              backgroundColor: 'rgba(8, 2, 12, 0.9)',
              padding: isMobile ? '2rem 1.5rem' : '2.5rem 3rem',
              maxWidth: isMobile ? '90vw' : '500px',
              border: '1px solid rgba(147, 51, 234, 0.3)'
            }}
          >
            {/* Top-Left Corner Border */}
            <div className="absolute -top-0.5 -left-0.5 w-5 h-5" style={{
              border: '1.5px solid #a855f7',
              borderRadius: '10px 0 0 0',
              borderBottom: 'none',
              borderRight: 'none'
            }}></div>
            
            {/* Top-Right Corner Border */}
            <div className="absolute -top-0.5 -right-0.5 w-5 h-5" style={{
              border: '1.5px solid #a855f7',
              borderRadius: '0 10px 0 0',
              borderBottom: 'none',
              borderLeft: 'none'
            }}></div>
            
            {/* Bottom-Left Corner Border */}
            <div className="absolute -bottom-0.5 -left-0.5 w-5 h-5" style={{
              border: '1.5px solid #a855f7',
              borderRadius: '0 0 0 10px',
              borderTop: 'none',
              borderRight: 'none'
            }}></div>
            
            {/* Bottom-Right Corner Border */}
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5" style={{
              border: '1.5px solid #a855f7',
              borderRadius: '0 0 10px 0',
              borderTop: 'none',
              borderLeft: 'none'
            }}></div>

            {/* Spinning Loader */}
            <div 
              className="rounded-full border-2 border-t-transparent animate-spin mb-6"
              style={{
                borderColor: '#a855f7',
                borderTopColor: 'transparent',
                width: isMobile ? '2.5rem' : '3rem',
                height: isMobile ? '2.5rem' : '3rem'
              }}
            />

            {/* Loading Message */}
            <p 
              className="text-center tracking-wide"
              style={{
                color: 'rgba(255, 254, 240, 0.9)',
                fontFamily: "'Figtree', sans-serif",
                fontSize: isMobile ? '0.9rem' : '1rem',
                lineHeight: 1.6,
                maxWidth: '320px'
              }}
            >
              {t('loading.description')}
            </p>

            {/* Progress Bar */}
            <div 
              className="mt-5 w-full relative"
              style={{
                height: '3px',
                backgroundColor: 'rgba(147, 51, 234, 0.2)',
                borderRadius: '2px',
                overflow: 'hidden',
                maxWidth: '280px'
              }}
            >
              <div 
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: `${Math.round(loadingProgress * 100)}%`,
                  backgroundColor: '#a855f7',
                  borderRadius: '2px',
                  transition: 'width 0.3s ease-out',
                  boxShadow: '0 0 10px rgba(168, 85, 247, 0.5)'
                }}
              />
            </div>

            {/* Progress percentage */}
            <p 
              className="mt-2 tracking-[0.15em]"
              style={{
                color: 'rgba(168, 85, 247, 0.8)',
                fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                fontSize: '0.7rem'
              }}
            >
              {resourcesLoaded && loadingProgress >= 0.8 ? '100%' : `${Math.round(loadingProgress * 100)}%`}
            </p>

            {/* Scanline overlay */}
            <div className="absolute inset-0 pointer-events-none rounded-lg bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay"></div>
          </div>
        </div>
      )}

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
            backgroundImage: `
              linear-gradient(rgba(201, 160, 240, 0.05) 1px, transparent 1px), 
              linear-gradient(90deg, rgba(201, 160, 240, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      )}

      {/* =========================== */}
      {/* MOBILE LAYOUT - Full screen HoloEarth with Navigation Wheel */}
      {/* =========================== */}
      {isMobile && (
        <>
          {/* --- Background/Grid (Mobile) --- */}
          <div className="fixed inset-0 z-0" style={{background: 'transparent'}} />
          <div 
            className="fixed inset-0 z-0 pointer-events-none"
            style={{
              opacity: 0.5,
              backgroundImage: `
                linear-gradient(rgba(201, 160, 240, 0.05) 1px, transparent 1px), 
                linear-gradient(90deg, rgba(201, 160, 240, 0.05) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }}
          />

          {/* Main Content Container (DELTAWERKEN) - Follows wheel circular motion */}
          {(() => {
            // Calculate Deltawerken's position (index 0) based on wheel rotation
            const deltawerkenTransform = getMobileContentTransform(0, mobileWheelRotation);
            
            return (
              <div 
                ref={containerRef}
                className="fixed inset-0"
                style={{
                  transform: deltawerkenTransform.transform,
                  opacity: deltawerkenTransform.opacity,
                  transformOrigin: 'center center',
                  pointerEvents: deltawerkenTransform.isActive ? 'auto' : 'none',
                  // Smooth eased transition for carousel-like motion
                  // visibility transition: instant when showing, delayed when hiding (to allow opacity fade)
                  transition: `transform 0.6s cubic-bezier(0.25, 0.1, 0.25, 1), opacity 0.6s cubic-bezier(0.25, 0.1, 0.25, 1), visibility 0s linear ${deltawerkenTransform.isVisible ? '0s' : '0.6s'}`,
                  overflow: 'visible',
                  zIndex: deltawerkenTransform.zIndex,
                  willChange: 'transform, opacity',
                  visibility: deltawerkenTransform.isVisible ? 'visible' : 'hidden',
                }}
              >
                {/* Header with Title - Centered (No logo on mobile) */}
                <div 
                  className="absolute z-50 left-0 right-0 flex justify-center"
                  style={{
                    top: '4rem',
                    opacity: headerOpacity,
                    transform: `translateY(${headerY}px)`,
                  }}
                >
                  <div className="flex flex-col items-center">
                    <h1 style={{
                      color: '#FFFEF0',
                      fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                      fontSize: 'clamp(1.7rem, 6vw, 2.2rem)',
                      fontWeight: 600,
                      lineHeight: 1,
                      letterSpacing: '0.1em'
                    }}>
                      DELTA<span style={{color: '#f59e0b'}}>WERKEN</span>
                    </h1>
                    <div className="flex items-center" style={{ gap: '0.5rem', marginTop: '0.5rem' }}>
                      <span className="rounded-full bg-green-500 animate-ping" style={{
                        width: '0.5rem',
                        height: '0.5rem',
                      }}></span>
                      <span className="text-gray-400 tracking-wider" style={{
                        fontSize: 'clamp(0.9rem, 3vw, 1.1rem)',
                        fontFamily: "'Figtree', sans-serif",
                      }}>{t('header.versionText')}</span>
                    </div>
                  </div>
                </div>

                {/* Top-Right Info Panel - Frame counter + Coordinates */}
                {/* Inside deltawerken wrapper so it follows carousel animation */}
                <div 
                  className="absolute top-4 right-4 z-50 text-xs font-mono pointer-events-none text-right"
                  style={{ 
                    opacity: isSystem ? 0 : headerOpacity,
                    transform: `translateY(${headerY}px)`,
                  }}
                >
                  <div style={{ color: 'rgba(245, 158, 11, 0.6)' }}>
                    Frame: {currentFrame}/{TOTAL_ANIMATION_FRAMES}
                  </div>
                  <div style={{ 
                    color: 'rgba(255, 254, 240, 0.3)',
                    fontSize: '0.6rem',
                    marginTop: '0.25rem',
                    fontFamily: "'Figtree', sans-serif",
                    letterSpacing: '0.05em'
                  }}>
                    29.98° N, 31.13° E
                  </div>
                </div>

                {/* TimeSync - Centered with 6rem from top */}
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

            {/* Earth Animation Section - Simple centered layout */}
            <div 
              ref={earthSectionRef}
              style={{ 
                position: 'fixed',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              {/* Radial Glow - centered */}
              <div 
                className="z-5 pointer-events-none" 
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'radial-gradient(circle at center, rgba(147, 51, 234, 0.03) 0%, transparent 55%)',
                  opacity: isExploding ? Math.max(0, 1 - explosionProgress * 1.5) : 1,
                }} 
              />

              {/* 3D Earth Scene - Simply centered */}
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
                  onIntroComplete={handleIntroComplete}
                  onLayerStateChange={handleLayerStateChange}
                />
              </div>

              {/* Scroll Prompt - Positioned below TimeSync at top of screen */}
              <div 
                className="absolute left-0 right-0 flex flex-col items-center justify-center z-30"
                style={{
                  top: 'clamp(10rem, 14vw, 12rem)',
                  opacity: promptOpacity,
                }}
              >
                <div className="relative flex flex-col items-center bg-black/40 backdrop-blur-md rounded-sm pointer-events-none" style={{
                  border: '1px solid rgba(21, 179, 21, 0.4)',
                  padding: 'clamp(0.4rem, 1.5vw, 0.6rem) clamp(0.8rem, 3vw, 1.2rem)',
                  gap: 'clamp(0.2rem, 0.5vw, 0.35rem)',
                }}>
                  <span className="tracking-[0.15em] font-bold" style={{
                    color: 'white', 
                    fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                    fontSize: 'clamp(0.55rem, 2vw, 0.75rem)',
                    lineHeight: 1,
                  }}>SWIPE ↓ = SYNCHRONISATIE</span>
                </div>
              </div>
            </div>
          </div>
            );
          })()}

          {/* Mobile Page Content - Circular transitions following wheel (excludes Deltawerken) */}
          <MobilePageContent
            activeIndex={mobileActiveIndex}
            wheelRotation={mobileWheelRotation}
            onBack={() => {}}
            brandIndex={mobileBrandIndex}
          />

          {/* Mobile Navigation Wheel */}
          <MobileNavWheel 
            onNavigate={handleOpenSection}
            activeSection={activeSection}
            onRotationChange={handleMobileRotationChange}
            onBrandChange={handleMobileBrandChange}
            headerOpacity={headerOpacity}
            headerY={headerY}
            currentFrame={currentFrame}
          />

          {/* Mobile Language Toggle */}
          <button
            onClick={toggleLanguage}
            style={{
              position: 'fixed',
              top: '12px',
              right: '12px',
              zIndex: 200,
              backgroundColor: 'rgba(10, 5, 21, 0.7)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px',
              cursor: 'pointer',
              padding: '5px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.3s ease'
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
              backgroundImage: `
                linear-gradient(rgba(201, 160, 240, 0.07) 1px, transparent 1px), 
                linear-gradient(90deg, rgba(201, 160, 240, 0.07) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
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
            className="absolute pointer-events-auto z-50"
            style={{
              top: 'clamp(1.5rem, 2vw, 2rem)',
              left: 'clamp(1rem, 3vw, 2rem)',
              // Header animation during scroll (before navigating)
              transform: `translateX(${headerY * 2.5}px) translateY(${headerY * 2.5}px) scale(${headerScale})`,
              opacity: headerOpacity,
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
          <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ overflow: 'visible' }}>
            <HoloEarth 
              className="w-full h-full" 
              exploding={isExploding}
              explosionProgress={explosionProgress}
              isMobile={isMobile}
              isActive={isSystem}
              pyramidScrollProgress={pyramidScrollProgress}
              showPyramidLabels={isSystem}
              coreScaleMultiplier={coreScaleMultiplier}
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
                    }}>{t('header.versionText')} {'/'}{'/'} V.4.9</span>
                  </div>
                </div>
              </div>
            </header>

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
                    }}>{window.innerWidth >= 1100 ? t('scrollPrompt.scroll') : t('scrollPrompt.swipe')}</span>
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
                  onNext={() => {}}
                  onComplete={() => {
                    if (assessmentLevel === 'deep') {
                      setAssessmentPhase('upload');
                    } else {
                      setAssessmentPhase('results');
                      triggerGoldMode();
                    }
                  }}
                  allAnswers={assessmentAnswers.reduce((acc, a) => ({ ...acc, [`${a.subjectIndex}-${a.questionIndex}`]: a.answer }), {})}
                />
              </div>
            )}
            
            {/* Assessment Layer Panel - Shows during layers and convergence phases */}
            {/* Animates in sync with pyramid layers - floats from entity center to alternating sides */}
            {/* During convergence, panels float back to entity center */}
            {isSystem && (assessmentPhase === 'layers' || assessmentPhase === 'convergence') && (
              <AssessmentLayerPanel
                currentLayerIndex={currentLayerIndex}
                scrollProgress={pyramidScrollProgress}
                onLayerComplete={handleLayerComplete}
                onScrollEnabled={handleAssessmentScrollEnabled}
                onAllLayersComplete={handleAllLayersComplete}
                convergenceProgress={convergenceProgress}
                isVisible={true}
              />
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
            
            {/* Assessment Results - Poetry slideshow during loading, then full results modal */}
            {isSystem && assessmentPhase === 'results' && (
              <AssessmentResultsModal
                resultsLoadingProgress={resultsLoadingProgress}
                resultsModalProgress={resultsModalProgress}
                resultsPoetryIndex={resultsPoetryIndex}
                poetrySlides={poetrySlides}
                layerAnswers={layerAnswers}
                onClose={() => {
                  setAssessmentPhase('hidden');
                  setCoreScaleMultiplier(1);
                  setConvergenceProgress(0);
                  setResultsModalProgress(0);
                  setResultsLoadingProgress(0);
                }}
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
    </main>
  );
};

export default App;
