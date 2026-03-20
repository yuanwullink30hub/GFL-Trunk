import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';

function checkWebGL() {
  try {
    const t = document.createElement('canvas');
    const ctx = t.getContext('webgl2') || t.getContext('webgl') || t.getContext('experimental-webgl');
    if (!ctx) return false;
    const ext = ctx.getExtension && ctx.getExtension('WEBGL_lose_context');
    if (ext) ext.loseContext();
    return true;
  } catch { return false; }
}
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import HoloPyramid from './HoloPyramid';
import PyramidOverlay from './PyramidOverlay';

// Total frames for animation (discrete scroll points)
// Doubled to 360 to accommodate 2x slower layer animations (ANIMATION_SPEED_DIVISOR = 2)
const TOTAL_FRAMES = 360;

// isActive: passed from parent, controls when intro animation starts
// When true (orbit button visible), the 3s timer starts and layers will float up
const PyramidView = ({ onBack = () => {}, isActive = true }) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [webglOk, setWebglOk] = useState(true);
  const containerRef = useRef(null);
  const isScrolling = useRef(false);

  useEffect(() => { setWebglOk(checkWebGL()); }, []);

  // Calculate progress from frame (0-1)
  const scrollProgress = currentFrame / (TOTAL_FRAMES - 1);

  // Scroll handler - one tick = one frame
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    
    // Debounce to ensure one scroll tick = one frame
    if (isScrolling.current) return;
    isScrolling.current = true;
    
    const direction = e.deltaY > 0 ? 1 : -1; // Down = forward, Up = backward
    
    setCurrentFrame(prev => {
      const newFrame = Math.max(0, Math.min(TOTAL_FRAMES - 1, prev + direction));
      return newFrame;
    });
    
    // Reset debounce after short delay
    setTimeout(() => {
      isScrolling.current = false;
    }, 50);
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
      setCurrentFrame(prev => Math.max(0, Math.min(TOTAL_FRAMES - 1, prev + direction)));
      touchAccumulator.current = 0;
    }
  }, []);

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

  // Reset to frame 0
  const handleReset = () => {
    const interval = setInterval(() => {
      setCurrentFrame(prev => {
        if (prev <= 0) {
          clearInterval(interval);
          onBack();
          return 0;
        }
        return prev - 1;
      });
    }, 30);
  };

  const isAnimating = scrollProgress > 0;

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-visible"
      style={{ 
        background: '#050510', 
        touchAction: 'none',
        fontFamily: "'Courier New', Courier, monospace"
      }}
    >
      {/* 3D Scene */}
      {webglOk && <Canvas 
        shadows 
        dpr={[1, 2]} 
        gl={{ 
          antialias: true, 
          toneMapping: THREE.ACESFilmicToneMapping, 
          toneMappingExposure: 1.2,
          powerPreference: 'default',
          failIfMajorPerformanceCaveat: false,
          precision: 'mediump',
        }}
        onCreated={({ gl }) => {
          // Firefox fix: getProgramInfoLog can return null, crashing Three.js r160's .trim() call
          const ctx = gl.getContext();
          const origGPIL = ctx.getProgramInfoLog.bind(ctx);
          ctx.getProgramInfoLog = (p) => origGPIL(p) || '';
          const origGSIL = ctx.getShaderInfoLog.bind(ctx);
          ctx.getShaderInfoLog = (s) => origGSIL(s) || '';
        }}
      >
        <PerspectiveCamera makeDefault position={[0, 2, 14]} fov={45} />
        
        {/* Lights */}
        <ambientLight intensity={0.2} color="#4400ff" />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#ff8800" />
        <pointLight position={[-10, -10, -5]} intensity={1} color="#00ffff" />
        <spotLight position={[0, 10, 0]} angle={0.5} penumbra={1} intensity={2} color="#a855f7" />

        {/* Pyramid Scene - receives scrollProgress and isActive */}
        <HoloPyramid scrollProgress={scrollProgress} isActive={isActive} />
        
        {/* Controls */}
        <OrbitControls 
          enableZoom={false}
          enableRotate={true}
          enablePan={false}
        />
      </Canvas>}

      {/* UI Overlay */}
      <PyramidOverlay animate={isAnimating} scrollProgress={scrollProgress} />

      {/* Back Button */}
      <button 
        onClick={handleReset}
        className="absolute bottom-8 left-8 z-50 group flex items-center gap-3 rounded-sm transition-all duration-300 backdrop-blur-sm px-4 py-2 pointer-events-auto"
        style={{
          border: '1px solid rgba(147, 51, 234, 0.3)',
          background: 'rgba(10, 5, 16, 0.6)',
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
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 group-hover:-translate-x-1 transition-transform">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </div>
        <span className="tracking-[0.2em] uppercase text-xs" style={{color: 'rgba(255, 254, 240, 0.7)'}}>BACK</span>
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l" style={{borderColor: 'rgba(147, 51, 234, 0.5)'}}></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r" style={{borderColor: 'rgba(147, 51, 234, 0.5)'}}></div>
      </button>

      {/* Progress indicator */}
      <div 
        className="fixed bottom-4 right-4 z-50 text-xs font-mono pointer-events-none"
        style={{ color: 'rgba(245, 158, 11, 0.6)' }}
      >
        Frame: {currentFrame + 1}/{TOTAL_FRAMES}
      </div>
    </div>
  );
};

export default PyramidView;
