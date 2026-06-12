import React, { useState, useCallback, useEffect, useRef } from 'react';

/**
 * MapNavigation - Grid-based navigation system
 * 
 * A massive 3x3 (or larger) grid where:
 * - Center (0,0): Main page with HoloEarth
 * - Content pages are positioned around the grid
 * - Navigation uses smooth curved perspective movement
 * 
 * Grid positions (in viewport units from center):
 * (-1,-1) | (0,-1) | (1,-1)   <- Top row
 * (-1, 0) | (0, 0) | (1, 0)   <- Center row (main page at 0,0)
 * (-1, 1) | (0, 1) | (1, 1)   <- Bottom row
 */

// Grid configuration - positions for each section
// Values are in viewport units (100vw/100vh per unit)
const GRID_POSITIONS = {
  main: { x: 0, y: 0 },           // Center - HoloEarth main page
  filosofie: { x: -1, y: -0.8 },  // Top-left area
  gardens: { x: -0.9, y: 0.85 },  // Bottom-left area  
  monitor: { x: 1, y: 0.8 },      // Bottom-right area
  login: { x: 0.95, y: -0.75 },   // Top-right area
  menu: { x: 0.8, y: 0 },         // Center-right area (Eyedentity)
};

// Animation duration for transitions (ms)
const TRANSITION_DURATION = 1200;

/**
 * Calculate a curved path control point for bezier-like movement
 * Creates natural arc movement instead of straight lines
 */
const calculateCurveOffset = (startPos, endPos) => {
  const dx = endPos.x - startPos.x;
  const dy = endPos.y - startPos.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Perpendicular offset for curve (more curve for longer distances)
  const curveStrength = distance * 0.3;
  
  // Perpendicular direction (rotated 90 degrees)
  const perpX = -dy / (distance || 1);
  const perpY = dx / (distance || 1);
  
  // Alternate curve direction based on target position
  const curveDirection = (endPos.x + endPos.y) > 0 ? 1 : -1;
  
  return {
    x: perpX * curveStrength * curveDirection,
    y: perpY * curveStrength * curveDirection
  };
};

const MapNavigation = ({ 
  children, 
  activeSection, 
  onSectionChange,
  mainContent,
  filosofieContent,
  gardensContent,
  monitorContent,
  loginContent,
  menuContent 
}) => {
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 });
  const [targetPosition, setTargetPosition] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [curveOffset, setCurveOffset] = useState({ x: 0, y: 0 });
  const animationRef = useRef(null);
  const startTimeRef = useRef(0);
  const startPosRef = useRef({ x: 0, y: 0 });

  // Navigate to a section
  const navigateTo = useCallback((section) => {
    const target = GRID_POSITIONS[section] || GRID_POSITIONS.main;
    const start = currentPosition;
    
    // Calculate curve offset for natural movement
    const curve = calculateCurveOffset(start, target);
    setCurveOffset(curve);
    
    setTargetPosition(target);
    startPosRef.current = { ...currentPosition };
    startTimeRef.current = performance.now();
    setIsAnimating(true);
    
    if (onSectionChange) {
      onSectionChange(section === 'main' ? null : section);
    }
  }, [currentPosition, onSectionChange]);

  // Animation loop using requestAnimationFrame
  useEffect(() => {
    if (!isAnimating) return;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / TRANSITION_DURATION, 1);
      
      // Easing function - smooth ease-in-out
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      // Bezier-like curve: start -> curve peak -> end
      // At progress 0.5, we're at the peak of the curve
      const curveFactor = Math.sin(progress * Math.PI); // 0 -> 1 -> 0
      
      const newX = startPosRef.current.x + 
        (targetPosition.x - startPosRef.current.x) * eased +
        curveOffset.x * curveFactor;
      
      const newY = startPosRef.current.y + 
        (targetPosition.y - startPosRef.current.y) * eased +
        curveOffset.y * curveFactor;
      
      setCurrentPosition({ x: newX, y: newY });
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        setCurrentPosition(targetPosition);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating, targetPosition, curveOffset]);

  // Handle section changes from parent
  useEffect(() => {
    const targetSection = activeSection || 'main';
    const target = GRID_POSITIONS[targetSection];
    
    if (target && (target.x !== targetPosition.x || target.y !== targetPosition.y)) {
      navigateTo(targetSection);
    }
  }, [activeSection, targetPosition, navigateTo]);

  // Grid transform - moves the entire grid to show current position
  const gridTransform = `translate(${-currentPosition.x * 100}vw, ${-currentPosition.y * 100}vh)`;

  return (
    <div 
      className="fixed inset-0 overflow-hidden"
      style={{ 
        perspective: '1000px',
        perspectiveOrigin: '50% 50%'
      }}
    >
      {/* The massive grid container */}
      <div
        className="absolute"
        style={{
          width: '300vw',
          height: '300vh',
          left: '-100vw',
          top: '-100vh',
          transform: gridTransform,
          transition: isAnimating ? 'none' : 'transform 0.1s ease-out',
          willChange: 'transform'
        }}
      >
        {/* CENTER (0,0) - Main page with HoloEarth */}
        <div
          className="absolute"
          style={{
            width: '100vw',
            height: '100vh',
            left: '100vw',
            top: '100vh'
          }}
        >
          {mainContent}
        </div>

        {/* TOP-LEFT - Filosofie */}
        <div
          className="absolute"
          style={{
            width: '100vw',
            height: '100vh',
            left: `${100 + GRID_POSITIONS.filosofie.x * 100}vw`,
            top: `${100 + GRID_POSITIONS.filosofie.y * 100}vh`
          }}
        >
          {filosofieContent}
        </div>

        {/* BOTTOM-LEFT - Gardens */}
        <div
          className="absolute"
          style={{
            width: '100vw',
            height: '100vh',
            left: `${100 + GRID_POSITIONS.gardens.x * 100}vw`,
            top: `${100 + GRID_POSITIONS.gardens.y * 100}vh`
          }}
        >
          {gardensContent}
        </div>

        {/* BOTTOM-RIGHT - Monitor/Data */}
        <div
          className="absolute"
          style={{
            width: '100vw',
            height: '100vh',
            left: `${100 + GRID_POSITIONS.monitor.x * 100}vw`,
            top: `${100 + GRID_POSITIONS.monitor.y * 100}vh`
          }}
        >
          {monitorContent}
        </div>

        {/* TOP-RIGHT - Login */}
        <div
          className="absolute"
          style={{
            width: '100vw',
            height: '100vh',
            left: `${100 + GRID_POSITIONS.login.x * 100}vw`,
            top: `${100 + GRID_POSITIONS.login.y * 100}vh`
          }}
        >
          {loginContent}
        </div>

        {/* CENTER-RIGHT - Menu/Eyedentity */}
        <div
          className="absolute"
          style={{
            width: '100vw',
            height: '100vh',
            left: `${100 + GRID_POSITIONS.menu.x * 100}vw`,
            top: `${100 + GRID_POSITIONS.menu.y * 100}vh`
          }}
        >
          {menuContent}
        </div>
      </div>

      {/* Navigation indicator (optional - shows current position on minimap) */}
      {process.env.NODE_ENV === 'development' && (
        <div 
          className="fixed bottom-4 left-4 z-[200] bg-black/80 p-2 rounded text-xs text-white font-mono"
        >
          <div>Pos: ({currentPosition.x.toFixed(2)}, {currentPosition.y.toFixed(2)})</div>
          <div>Target: {activeSection || 'main'}</div>
          <div>Animating: {isAnimating ? 'yes' : 'no'}</div>
        </div>
      )}
    </div>
  );
};

// Export grid positions for use in other components
export { GRID_POSITIONS, TRANSITION_DURATION };
export default MapNavigation;
