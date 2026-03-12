import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import HoloPyramidAssessment from './HoloPyramidAssessment';
import PyramidOverlay from '../holoearth/PyramidOverlay';

// Total frames for animation (discrete scroll points)
const TOTAL_FRAMES = 360;

/**
 * PyramidViewAssessment - Wrapper component for the assessment-integrated pyramid
 * This is the main entry point for the assessment feature with the 5-layer pyramid
 */
const PyramidViewAssessment = ({ onBack = () => {}, isActive = true, onNavigateToData }) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const containerRef = useRef(null);
  const isScrolling = useRef(false);

  // Calculate progress from frame (0-1)
  const scrollProgress = currentFrame / (TOTAL_FRAMES - 1);

  // Scroll handler - one tick = one frame
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    
    if (isScrolling.current) return;
    isScrolling.current = true;
    
    const direction = e.deltaY > 0 ? 1 : -1;
    
    setCurrentFrame(prev => {
      const newFrame = Math.max(0, Math.min(TOTAL_FRAMES - 1, prev + direction));
      return newFrame;
    });
    
    setTimeout(() => {
      isScrolling.current = false;
    }, 50);
  }, []);

  // Touch handling for mobile
  const touchStartY = useRef(0);
  const touchAccumulator = useRef(0);
  const TOUCH_THRESHOLD = 30;
  
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
    
    if (Math.abs(touchAccumulator.current) >= TOUCH_THRESHOLD) {
      const direction = touchAccumulator.current > 0 ? 1 : -1;
      setCurrentFrame(prev => Math.max(0, Math.min(TOTAL_FRAMES - 1, prev + direction)));
      touchAccumulator.current = 0;
    }
  }, []);

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

  const handleSendComplete = () => {
    setIsComplete(true);
    console.log('Assessment complete - all layers synced');
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
      {/* 3D Scene with Assessment Integration */}
      <Canvas 
        shadows 
        dpr={[1, 2]} 
        gl={{ 
          antialias: true, 
          toneMapping: THREE.ACESFilmicToneMapping, 
          toneMappingExposure: 1.2 
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

        {/* Assessment-Integrated Pyramid Scene */}
        <HoloPyramidAssessment 
          scrollProgress={scrollProgress} 
          isActive={isActive}
          onSendComplete={handleSendComplete}
          onNavigateToData={onNavigateToData}
        />
        
        {/* Controls */}
        <OrbitControls 
          enableZoom={false}
          enableRotate={true}
          enablePan={false}
        />
      </Canvas>

      {/* UI Overlay */}
      <PyramidOverlay animate={isAnimating} scrollProgress={scrollProgress} />

      {/* Completion Badge */}
      {isComplete && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-sm backdrop-blur-sm"
          style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.4)',
          }}
        >
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-green-400 font-mono text-xs tracking-wider uppercase">
            Assessment Complete
          </span>
        </div>
      )}

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

      {/* Assessment Instructions */}
      {!isComplete && (
        <div 
          className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-6 py-3 rounded-sm backdrop-blur-sm text-center"
          style={{
            background: 'rgba(10, 5, 16, 0.8)',
            border: '1px solid rgba(34, 211, 238, 0.3)',
          }}
        >
          <p className="text-cyan-300 font-mono text-xs tracking-wider uppercase mb-1">
            Consciousness Profile Assessment
          </p>
          <p className="text-cyan-100/60 font-mono text-[10px]">
            Click each layer label to answer questions • Complete all 5 layers to receive your profile
          </p>
        </div>
      )}
    </div>
  );
};

export default PyramidViewAssessment;
