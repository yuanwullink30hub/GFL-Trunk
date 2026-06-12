import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { SYMBOLS, QUOTES, NEON_GREEN, getCombinationInsight } from './constants';

// Animation keyframes
const keyframes = `
  @keyframes modal-in {
    0% { opacity: 0; transform: scale(0.9) translateY(20px); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes modal-bg-in {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }
  @keyframes scan-line {
    0% { top: 0%; }
    100% { top: 100%; }
  }
  @keyframes pulse-glow {
    0%, 100% { filter: drop-shadow(0 0 5px rgba(0, 255, 65, 0.3)); }
    50% { filter: drop-shadow(0 0 15px rgba(0, 255, 65, 0.6)); }
  }
  @keyframes flicker {
    0% { opacity: 0.97; }
    50% { opacity: 1; }
    100% { opacity: 0.98; }
  }
  @keyframes lift3d {
    0% { 
      transform: perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale(1);
      box-shadow: 0 2px 10px rgba(0, 255, 65, 0.2);
    }
    100% { 
      transform: perspective(800px) rotateX(-15deg) rotateY(10deg) translateZ(50px) scale(1.15);
      box-shadow: 0 25px 50px rgba(0, 255, 65, 0.4), 0 0 30px rgba(0, 255, 65, 0.3);
    }
  }
  @keyframes float3d {
    0%, 100% {
      transform: perspective(800px) rotateX(-15deg) rotateY(10deg) translateZ(50px) translateY(0px);
    }
    50% {
      transform: perspective(800px) rotateX(-10deg) rotateY(15deg) translateZ(60px) translateY(-5px);
    }
  }
  @keyframes dropIn3d {
    0% {
      transform: perspective(800px) rotateX(-30deg) rotateY(20deg) translateZ(100px) scale(0.5);
      opacity: 0;
    }
    50% {
      transform: perspective(800px) rotateX(10deg) rotateY(-5deg) translateZ(30px) scale(1.1);
      opacity: 1;
    }
    100% {
      transform: perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale(1);
      opacity: 1;
    }
  }
  @keyframes orbit3d {
    0% {
      transform: rotateY(0deg) translateX(var(--orbit-radius)) rotateY(0deg);
    }
    100% {
      transform: rotateY(360deg) translateX(var(--orbit-radius)) rotateY(-360deg);
    }
  }
  @keyframes spin3d {
    0% { transform: rotateY(0deg) rotateX(0deg); }
    100% { transform: rotateY(360deg) rotateX(360deg); }
  }
  @keyframes glow-pulse-3d {
    0%, 100% {
      box-shadow: 0 0 20px rgba(0, 255, 65, 0.4), 
                  0 0 40px rgba(0, 255, 65, 0.2),
                  inset 0 0 15px rgba(0, 255, 65, 0.1);
    }
    50% {
      box-shadow: 0 0 30px rgba(0, 255, 65, 0.6), 
                  0 0 60px rgba(0, 255, 65, 0.3),
                  inset 0 0 25px rgba(0, 255, 65, 0.2);
    }
  }
  @keyframes popBack {
    0% {
      transform: scale(0) rotate(180deg);
      opacity: 0;
    }
    50% {
      transform: scale(1.3) rotate(-10deg);
      opacity: 1;
    }
    75% {
      transform: scale(0.9) rotate(5deg);
    }
    100% {
      transform: scale(1) rotate(0deg);
      opacity: 1;
    }
  }
  @keyframes cubeRotate {
    0% { transform: rotateX(0deg) rotateY(0deg); }
    25% { transform: rotateX(90deg) rotateY(90deg); }
    50% { transform: rotateX(180deg) rotateY(180deg); }
    75% { transform: rotateX(270deg) rotateY(270deg); }
    100% { transform: rotateX(360deg) rotateY(360deg); }
  }
`;

// 3D Shape Component - Renders different 3D objects based on shape type
const Shape3D = memo(({ shape, size = 50, rotation = 0, onClick, title }) => {
  const baseStyle = {
    width: size,
    height: size,
    transformStyle: 'preserve-3d',
    cursor: onClick ? 'pointer' : 'default',
    transition: 'transform 0.2s ease'
  };

  // Sphere for circle shape
  if (shape === 'circle') {
    // eslint-disable-next-line no-unused-vars
    const segments = 12;
    const rings = 8;
    return (
      <div 
        onClick={onClick} 
        title={title}
        style={{
          ...baseStyle,
          transform: `rotateY(${rotation}deg) rotateX(${rotation * 0.3}deg)`,
          position: 'relative'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = `rotateY(${rotation}deg) rotateX(${rotation * 0.3}deg) scale(1.2)`}
        onMouseLeave={(e) => e.currentTarget.style.transform = `rotateY(${rotation}deg) rotateX(${rotation * 0.3}deg) scale(1)`}
      >
        {/* Create sphere using CSS - layered circles */}
        {Array.from({ length: rings }).map((_, i) => {
          const ringAngle = (i / rings) * 180 - 90;
          const ringScale = Math.cos((ringAngle * Math.PI) / 180);
          const ringY = Math.sin((ringAngle * Math.PI) / 180) * (size / 2);
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: size * ringScale,
                height: size * ringScale,
                borderRadius: '50%',
                border: `1.5px solid ${NEON_GREEN}`,
                opacity: 0.3 + ringScale * 0.5,
                transform: `translate(-50%, -50%) translateZ(${ringY}px)`,
                boxShadow: i === Math.floor(rings / 2) ? `0 0 15px rgba(0, 255, 65, 0.5), inset 0 0 10px rgba(0, 255, 65, 0.2)` : 'none'
              }}
            />
          );
        })}
        {/* Equator ring */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: size,
          height: size,
          borderRadius: '50%',
          border: `2px solid ${NEON_GREEN}`,
          transform: 'translate(-50%, -50%) rotateX(90deg)',
          boxShadow: `0 0 20px rgba(0, 255, 65, 0.6), inset 0 0 15px rgba(0, 255, 65, 0.3)`
        }} />
        {/* Vertical ring */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: size,
          height: size,
          borderRadius: '50%',
          border: `1.5px solid ${NEON_GREEN}`,
          opacity: 0.7,
          transform: 'translate(-50%, -50%)'
        }} />
        {/* Core glow */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: size * 0.5,
          height: size * 0.5,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(0, 255, 65, 0.4) 0%, transparent 70%)`,
          transform: 'translate(-50%, -50%)',
          filter: 'blur(3px)'
        }} />
      </div>
    );
  }

  // Pyramid for triangle shape - proper 4-sided pyramid
  if (shape === 'triangle') {
    // Simple wireframe tetrahedron - 4 vertices, 6 edges
    // Vertices: apex at top, 3 base corners forming triangle
    // eslint-disable-next-line no-unused-vars
    const h = size * 0.8; // total height
    // eslint-disable-next-line no-unused-vars
    const r = size * 0.4; // base radius
    
    // Calculate vertex positions (2D projection with slight 3D tilt)
    const apex = { x: size/2, y: size * 0.1 };
    // Base triangle vertices at 120° apart, projected
    const base1 = { x: size * 0.15, y: size * 0.85 }; // bottom left
    const base2 = { x: size * 0.85, y: size * 0.85 }; // bottom right  
    const base3 = { x: size * 0.5, y: size * 0.55 };  // back center (appears higher due to 3D)
    
    return (
      <div 
        onClick={onClick} 
        title={title}
        style={{
          ...baseStyle,
          transform: `rotateY(${rotation}deg)`,
          position: 'relative'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = `rotateY(${rotation}deg) scale(1.2)`}
        onMouseLeave={(e) => e.currentTarget.style.transform = `rotateY(${rotation}deg) scale(1)`}
      >
        <svg 
          style={{ 
            position: 'absolute', 
            inset: 0,
            width: '100%', 
            height: '100%'
          }}
        >
          {/* 3 edges from apex to base */}
          <line x1={apex.x} y1={apex.y} x2={base1.x} y2={base1.y} stroke={NEON_GREEN} strokeWidth="2" />
          <line x1={apex.x} y1={apex.y} x2={base2.x} y2={base2.y} stroke={NEON_GREEN} strokeWidth="2" />
          <line x1={apex.x} y1={apex.y} x2={base3.x} y2={base3.y} stroke={NEON_GREEN} strokeWidth="2" />
          
          {/* 3 base edges */}
          <line x1={base1.x} y1={base1.y} x2={base2.x} y2={base2.y} stroke={NEON_GREEN} strokeWidth="2" />
          <line x1={base2.x} y1={base2.y} x2={base3.x} y2={base3.y} stroke={NEON_GREEN} strokeWidth="2" />
          <line x1={base3.x} y1={base3.y} x2={base1.x} y2={base1.y} stroke={NEON_GREEN} strokeWidth="2" />
          
          {/* Vertex points */}
          <circle cx={apex.x} cy={apex.y} r="4" fill={NEON_GREEN} />
          <circle cx={base1.x} cy={base1.y} r="3" fill={NEON_GREEN} />
          <circle cx={base2.x} cy={base2.y} r="3" fill={NEON_GREEN} />
          <circle cx={base3.x} cy={base3.y} r="3" fill={NEON_GREEN} />
        </svg>
      </div>
    );
  }

  // Wave shape - 3D ribbon
  if (shape === 'wave') {
    return (
      <div 
        onClick={onClick} 
        title={title}
        style={{
          ...baseStyle,
          transform: `rotateY(${rotation}deg) rotateX(-10deg)`,
          position: 'relative'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = `rotateY(${rotation}deg) rotateX(-10deg) scale(1.2)`}
        onMouseLeave={(e) => e.currentTarget.style.transform = `rotateY(${rotation}deg) rotateX(-10deg) scale(1)`}
      >
        {/* Multiple wave layers */}
        {[0, 1, 2].map((layer) => (
          <svg 
            key={layer}
            style={{ 
              position: 'absolute', 
              inset: 0, 
              width: '100%', 
              height: '100%',
              transform: `translateZ(${layer * 5 - 5}px)`,
              opacity: 1 - layer * 0.25
            }}
          >
            <path
              d={`M 5 ${size/2} Q ${size*0.25} ${size*0.2}, ${size/2} ${size/2} Q ${size*0.75} ${size*0.8}, ${size-5} ${size/2}`}
              fill="none"
              stroke={NEON_GREEN}
              strokeWidth={3 - layer}
              strokeLinecap="round"
              style={{ filter: layer === 0 ? 'drop-shadow(0 0 8px rgba(0, 255, 65, 0.8))' : 'none' }}
            />
          </svg>
        ))}
        {/* Glow effect */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: size * 0.6,
          height: size * 0.4,
          borderRadius: '50%',
          background: `radial-gradient(ellipse, rgba(0, 255, 65, 0.2) 0%, transparent 70%)`,
          transform: 'translate(-50%, -50%)',
          filter: 'blur(5px)'
        }} />
      </div>
    );
  }

  // Plus/Cross shape - two 2D crosses intersecting, sharing vertical axis
  // First cross: up/down + east/west (left/right)
  // Second cross: up/down + north/south (front/back) - rotated 90deg on Y axis
  if (shape === 'plus') {
    const armLength = size * 0.35;
    const armThickness = 2;
    
    return (
      <div 
        onClick={onClick} 
        title={title}
        style={{
          ...baseStyle,
          transform: `rotateY(${rotation}deg) rotateX(15deg)`,
          position: 'relative'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = `rotateY(${rotation}deg) rotateX(15deg) scale(1.2)`}
        onMouseLeave={(e) => e.currentTarget.style.transform = `rotateY(${rotation}deg) rotateX(15deg) scale(1)`}
      >
        {/* First cross - in XY plane (vertical up/down + horizontal east/west) */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          transformStyle: 'preserve-3d'
        }}>
          {/* Vertical arm (up) */}
          <div style={{
            position: 'absolute',
            left: '50%',
            bottom: '50%',
            width: armThickness,
            height: armLength,
            background: NEON_GREEN,
            transform: 'translateX(-50%)'
          }} />
          {/* Vertical arm (down) */}
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: armThickness,
            height: armLength,
            background: NEON_GREEN,
            transform: 'translateX(-50%)'
          }} />
          {/* Horizontal arm (west/left) */}
          <div style={{
            position: 'absolute',
            right: '50%',
            top: '50%',
            width: armLength,
            height: armThickness,
            background: NEON_GREEN,
            transform: 'translateY(-50%)'
          }} />
          {/* Horizontal arm (east/right) */}
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: armLength,
            height: armThickness,
            background: NEON_GREEN,
            transform: 'translateY(-50%)'
          }} />
        </div>
        
        {/* Second cross - rotated 90deg on Y axis (shares vertical, extends north/south) */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%) rotateY(90deg)',
          transformStyle: 'preserve-3d'
        }}>
          {/* Vertical arm (up) - shared axis */}
          <div style={{
            position: 'absolute',
            left: '50%',
            bottom: '50%',
            width: armThickness,
            height: armLength,
            background: NEON_GREEN,
            transform: 'translateX(-50%)'
          }} />
          {/* Vertical arm (down) - shared axis */}
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: armThickness,
            height: armLength,
            background: NEON_GREEN,
            transform: 'translateX(-50%)'
          }} />
          {/* Horizontal arm (north/front) */}
          <div style={{
            position: 'absolute',
            right: '50%',
            top: '50%',
            width: armLength,
            height: armThickness,
            background: NEON_GREEN,
            transform: 'translateY(-50%)'
          }} />
          {/* Horizontal arm (south/back) */}
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: armLength,
            height: armThickness,
            background: NEON_GREEN,
            transform: 'translateY(-50%)'
          }} />
        </div>
        
        {/* Center point */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: NEON_GREEN,
          transform: 'translate(-50%, -50%)',
          boxShadow: `0 0 8px ${NEON_GREEN}`
        }} />
      </div>
    );
  }

  // Cube for square shape - transparent with borders only
  if (shape === 'square') {
    const half = size / 2;
    return (
      <div 
        onClick={onClick} 
        title={title}
        style={{
          ...baseStyle,
          transform: `rotateY(${rotation}deg) rotateX(${rotation * 0.3}deg)`,
          position: 'relative'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = `rotateY(${rotation}deg) rotateX(${rotation * 0.3}deg) scale(1.2)`}
        onMouseLeave={(e) => e.currentTarget.style.transform = `rotateY(${rotation}deg) rotateX(${rotation * 0.3}deg) scale(1)`}
      >
        {/* Front */}
        <div style={{
          position: 'absolute',
          width: size,
          height: size,
          background: 'transparent',
          border: `2px solid ${NEON_GREEN}`,
          transform: `translateZ(${half}px)`
        }} />
        {/* Back */}
        <div style={{
          position: 'absolute',
          width: size,
          height: size,
          background: 'transparent',
          border: `2px solid ${NEON_GREEN}`,
          transform: `translateZ(-${half}px) rotateY(180deg)`
        }} />
        {/* Top */}
        <div style={{
          position: 'absolute',
          width: size,
          height: size,
          background: 'transparent',
          border: `2px solid ${NEON_GREEN}`,
          transform: `translateY(-${half}px) rotateX(90deg)`
        }} />
        {/* Bottom */}
        <div style={{
          position: 'absolute',
          width: size,
          height: size,
          background: 'transparent',
          border: `2px solid ${NEON_GREEN}`,
          transform: `translateY(${half}px) rotateX(-90deg)`
        }} />
        {/* Left */}
        <div style={{
          position: 'absolute',
          width: size,
          height: size,
          background: 'transparent',
          border: `2px solid ${NEON_GREEN}`,
          transform: `translateX(-${half}px) rotateY(-90deg)`
        }} />
        {/* Right */}
        <div style={{
          position: 'absolute',
          width: size,
          height: size,
          background: 'transparent',
          border: `2px solid ${NEON_GREEN}`,
          transform: `translateX(${half}px) rotateY(90deg)`
        }} />
      </div>
    );
  }

  // Default fallback
  return (
    <div style={{ ...baseStyle, border: `2px solid ${NEON_GREEN}`, borderRadius: '8px' }} onClick={onClick} title={title} />
  );
});
Shape3D.displayName = 'Shape3D';

// SectorFrame - Container with corner borders
const SectorFrame = ({ children, className = '', style = {}, ...props }) => (
  <div 
    {...props}
    className={`relative rounded-lg backdrop-blur-xl overflow-hidden ${className}`} 
    style={{ 
      backgroundColor: 'rgba(1, 0, 2, 0.3)',
      boxShadow: '0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.35), 0 0 120px rgba(0,0,0,0.15), inset 0 0 12px rgba(0, 255, 65, 0.06), inset 0 0 30px rgba(0, 255, 65, 0.03)',
      ...style
    }}
  >
    {/* Corner Borders */}
    {[
      { pos: '-top-0.5 -left-0.5', radius: '10px 0 0 0', border: 'borderBottom: none, borderRight: none' },
      { pos: '-top-0.5 -right-0.5', radius: '0 10px 0 0', border: 'borderBottom: none, borderLeft: none' },
      { pos: '-bottom-0.5 -left-0.5', radius: '0 0 0 10px', border: 'borderTop: none, borderRight: none' },
      { pos: '-bottom-0.5 -right-0.5', radius: '0 0 10px 0', border: 'borderTop: none, borderLeft: none' }
    ].map((corner, i) => (
      <div key={i} className={`absolute ${corner.pos} w-4 h-4`} style={{
        border: `1.5px solid ${NEON_GREEN}`,
        borderRadius: corner.radius,
        ...(i === 0 && { borderBottom: 'none', borderRight: 'none' }),
        ...(i === 1 && { borderBottom: 'none', borderLeft: 'none' }),
        ...(i === 2 && { borderTop: 'none', borderRight: 'none' }),
        ...(i === 3 && { borderTop: 'none', borderLeft: 'none' })
      }} />
    ))}

    {/* Holographic sheen */}
    <div className="absolute inset-0 rounded-lg pointer-events-none" style={{
      background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.015) 30%, transparent 50%, rgba(255,255,255,0.01) 70%, transparent 100%)',
      backgroundSize: '400% 400%',
      backgroundRepeat: 'no-repeat',
      animation: 'holoSheen 45s ease-in-out infinite',
      mixBlendMode: 'screen',
    }} />

    {/* Scanline sweep */}
    <div className="absolute inset-0 rounded-lg pointer-events-none" style={{
      background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.008) 48%, rgba(255,255,255,0.015) 50%, rgba(255,255,255,0.008) 52%, transparent 100%)',
      backgroundSize: '100% 300%',
      animation: 'holoScanline 14s linear infinite',
    }} />

    {/* Noise texture overlay */}
    <div className="absolute inset-0 rounded-lg pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />

    <div className="relative z-10 h-full w-full">{children}</div>
  </div>
);

// Shape Icon Renderer
const ShapeIcon = ({ shape, size = 20, color = NEON_GREEN, className = '' }) => {
  const strokeWidth = 2;
  const props = { width: size, height: size, className, style: { color } };
  
  switch (shape) {
    case 'circle':
      return (
        <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}>
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
    case 'wave':
      return (
        <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}>
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      );
    case 'triangle':
      return (
        <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}>
          <path d="M12 2L2 22h20L12 2z" />
        </svg>
      );
    case 'plus':
      return (
        <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}>
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      );
    case 'square':
      return (
        <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}>
          <rect x="3" y="3" width="18" height="18" transform="rotate(45 12 12)" />
        </svg>
      );
    default:
      return null;
  }
};

// Draggable Symbol Item - Icon-only drag
const DraggableSymbol = memo(({ symbol, onDragStart, onDragEnd, isInPlayground, justReturned, onDropToPlayground }) => {
  const [isHolding, setIsHolding] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // If symbol is in playground, show empty slot
  if (isInPlayground) {
    return (
      <div
        style={{
          width: 96,
          height: 96,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px dashed rgba(0, 255, 65, 0.2)',
          background: 'rgba(0, 0, 0, 0.4)',
          flexShrink: 0,
          position: 'relative'
        }}
        title={`${symbol.dutchName} is in playground`}
      >
        <div style={{ opacity: 0.15 }}>
          <ShapeIcon shape={symbol.shape} size={40} color={NEON_GREEN} />
        </div>
        <div style={{
          position: 'absolute',
          bottom: '8px',
          fontSize: 'clamp(0.5rem, 0.7vw, 0.65rem)',
          color: 'rgba(0, 255, 65, 0.3)',
          fontFamily: "'Figtree', sans-serif",
          textAlign: 'center',
          textTransform: 'uppercase'
        }}>
          in playground
        </div>
      </div>
    );
  }

  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsHolding(true);
    // Store mouse position for fixed positioning when dragging
    setDragOffset({ x: e.clientX, y: e.clientY });
    
    let hasMoved = false;
    const moveThreshold = 5;
    const startX = e.clientX;
    const startY = e.clientY;

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      
      if (!hasMoved && (Math.abs(dx) > moveThreshold || Math.abs(dy) > moveThreshold)) {
        hasMoved = true;
        setIsDragging(true);
        onDragStart?.(symbol);
      }
      
      if (hasMoved) {
        // Store actual mouse position for fixed element
        setDragOffset({ x: moveEvent.clientX, y: moveEvent.clientY });
      }
    };

    const handleMouseUp = (upEvent) => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      if (hasMoved) {
        const playgroundEl = document.querySelector('[data-playground="true"]');
        if (playgroundEl) {
          const playgroundRect = playgroundEl.getBoundingClientRect();
          const mouseX = upEvent.clientX;
          const mouseY = upEvent.clientY;
          
          if (
            mouseX >= playgroundRect.left &&
            mouseX <= playgroundRect.right &&
            mouseY >= playgroundRect.top &&
            mouseY <= playgroundRect.bottom
          ) {
            onDropToPlayground?.(symbol);
          }
        }
        onDragEnd?.();
      }
      
      setIsHolding(false);
      setIsDragging(false);
      setDragOffset({ x: 0, y: 0 });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Container style (the bordered box) - stays in place
  const containerStyle = {
    width: 96,
    height: 96,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    position: 'relative',
    cursor: isHolding ? 'grabbing' : 'grab',
    userSelect: 'none',
    border: isDragging 
      ? '2px dashed rgba(0, 255, 65, 0.15)' 
      : `2px solid rgba(0, 255, 65, ${isHovered ? 0.6 : 0.3})`,
    background: isDragging 
      ? 'rgba(0, 0, 0, 0.3)' 
      : (isHovered ? 'rgba(0, 255, 65, 0.02)' : 'transparent'),
    transition: 'border 0.2s ease, background 0.2s ease',
    animation: justReturned ? 'popBack 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'none'
  };

  // Icon style - this moves when dragging
  const getIconStyle = () => {
    if (isDragging) {
      return {
        position: 'fixed',
        left: dragOffset.x,
        top: dragOffset.y,
        transform: 'translate(-50%, -50%)',
        transition: 'none',
        zIndex: 99999,
        pointerEvents: 'none'
      };
    }
    if (isHolding) {
      return {
        transform: 'perspective(400px) rotateX(-8deg) rotateY(6deg) scale(1.1)',
        transition: 'transform 0.15s ease-out'
      };
    }
    if (isHovered) {
      return {
        transform: 'scale(1.05)',
        transition: 'transform 0.15s ease-out'
      };
    }
    return {
      transform: 'scale(1)',
      transition: 'transform 0.15s ease-out'
    };
  };

  return (
    <>
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => !isHolding && setIsHovered(true)}
        onMouseLeave={() => !isHolding && setIsHovered(false)}
        style={containerStyle}
        title={`Drag ${symbol.dutchName} to playground`}
      >
        {/* Icon - show in container when not dragging */}
        {!isDragging && (
          <div style={getIconStyle()}>
            <ShapeIcon 
              shape={symbol.shape} 
              size={48} 
              color={isHolding || isHovered ? NEON_GREEN : 'rgba(0, 255, 65, 0.8)'} 
            />
          </div>
        )}
        
        {/* Ghost icon left behind when dragging */}
        {isDragging && (
          <div style={{ opacity: 0.15 }}>
            <ShapeIcon shape={symbol.shape} size={40} color={NEON_GREEN} />
          </div>
        )}
      </div>
      
      {/* Portal: Dragged icon rendered at body level to escape stacking contexts */}
      {isDragging && createPortal(
        <div
          style={{
            position: 'fixed',
            left: dragOffset.x,
            top: dragOffset.y,
            transform: 'translate(-50%, -50%)',
            zIndex: 999999,
            pointerEvents: 'none'
          }}
        >
          <ShapeIcon shape={symbol.shape} size={48} color={NEON_GREEN} />
        </div>,
        document.body
      )}
    </>
  );
});
DraggableSymbol.displayName = 'DraggableSymbol';

// Symbol Description Panel
const SymbolDescription = memo(({ symbol, isActive }) => (
  <div
    style={{
      padding: '0.5rem 0.75rem',
      background: isActive ? 'rgba(0, 255, 65, 0.05)' : 'transparent',
      borderLeft: isActive ? `2px solid ${NEON_GREEN}` : '2px solid transparent',
      transition: 'all 0.3s ease',
      flex: 1
    }}
  >
    <div style={{
      fontSize: 'clamp(0.85rem, 1.2vw, 1rem)',
      color: isActive ? NEON_GREEN : 'rgba(0, 255, 65, 0.8)',
      fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      marginBottom: '0.25rem'
    }}>
      {symbol.dutchName}
    </div>
    <div style={{
      fontSize: 'clamp(0.7rem, 0.9vw, 0.85rem)',
      color: 'rgba(0, 255, 65, 0.6)',
      fontFamily: "'Figtree', sans-serif",
      marginBottom: '0.35rem'
    }}>
      {symbol.englishName} :: {symbol.meaning}
    </div>
    <div style={{
      fontSize: 'clamp(0.65rem, 0.85vw, 0.8rem)',
      color: 'rgba(0, 255, 65, 0.5)',
      fontFamily: "'Figtree', sans-serif",
      lineHeight: '1.5'
    }}>
      {symbol.description}
    </div>
  </div>
));
SymbolDescription.displayName = 'SymbolDescription';

// Symbol Column Component (Left Side) - With draggable symbols
const SymbolColumn = memo(({ onDragStart, onDragEnd, playgroundSymbols, justReturnedId, onDropToPlayground }) => {
  const [activeSymbol, setActiveSymbol] = useState(null);

  return (
    <SectorFrame style={{ height: '100%', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        fontSize: 'clamp(0.9rem, 1.3vw, 1.1rem)',
        fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
        color: NEON_GREEN,
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        textAlign: 'center',
        marginBottom: '0.75rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid rgba(0, 255, 65, 0.2)'
      }}>
        UNIVERSAL CONSTANTS
      </div>

      {/* Vertical Symbol List - Symbol left, Text right */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        {SYMBOLS.map((symbol) => (
          <div
            key={symbol.id}
            onMouseEnter={() => setActiveSymbol(symbol)}
            onMouseLeave={() => setActiveSymbol(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.5rem',
              background: activeSymbol?.id === symbol.id ? 'rgba(0, 255, 65, 0.03)' : 'transparent',
              borderRadius: '4px',
              transition: 'all 0.3s ease'
            }}
          >
            {/* Draggable Symbol - Left */}
            <DraggableSymbol
              symbol={symbol}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              isInPlayground={playgroundSymbols?.some(s => s.id === symbol.id)}
              justReturned={justReturnedId === symbol.id}
              onDropToPlayground={onDropToPlayground}
            />
            {/* Text Description - Right */}
            <SymbolDescription
              symbol={symbol}
              isActive={activeSymbol?.id === symbol.id}
            />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        fontSize: 'clamp(0.7rem, 0.9vw, 0.85rem)',
        color: 'rgba(0, 255, 65, 0.4)',
        textAlign: 'center',
        marginTop: '0.75rem',
        paddingTop: '0.75rem',
        borderTop: '1px solid rgba(0, 255, 65, 0.15)',
        fontFamily: "'Figtree', sans-serif"
      }}>
        {playgroundSymbols?.length > 0 
          ? `${playgroundSymbols.length} / ${SYMBOLS.length} IN PLAYGROUND`
          : '↑ DRAG SYMBOLS TO PLAYGROUND ↑'
        }
      </div>
    </SectorFrame>
  );
});
SymbolColumn.displayName = 'SymbolColumn';

// Sacred Geometry / Consciousness Playground (Center) with 3D Support
const SacredGeometry = memo(({ onInfoClick, playgroundSymbols = [], onDrop, onRemoveSymbol, newlyAddedId }) => {
  const [rotation, setRotation] = useState(0);
  const [infoHovered, setInfoHovered] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const requestRef = useRef(null);
  
  const hasSymbols = playgroundSymbols.length > 0;

  const animate = useCallback((time) => {
    setRotation(time * 0.02);
    requestRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [animate]);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    // This handles HTML5 drag drops if any
    if (e.dataTransfer) {
      const symbolId = e.dataTransfer.getData('symbolId');
      if (symbolId) {
        const symbol = SYMBOLS.find(s => s.id === symbolId);
        if (symbol) {
          onDrop?.(symbol);
        }
      }
    }
  };

  return (
    <SectorFrame 
      data-playground="true"
      style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        position: 'relative',
        transition: 'all 0.3s ease',
        perspective: '1000px'
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Info Button - Top Right */}
      <button
        onClick={onInfoClick}
        onMouseEnter={() => setInfoHovered(true)}
        onMouseLeave={() => setInfoHovered(false)}
        style={{
          position: 'absolute',
          top: '2rem',
          right: '2rem',
          width: '34px',
          height: '34px',
          background: infoHovered ? 'rgba(0, 255, 65, 0.15)' : 'rgba(0, 0, 0, 0.6)',
          border: `1.5px solid ${infoHovered ? NEON_GREEN : 'rgba(0, 255, 65, 0.4)'}`,
          borderRadius: '4px',
          color: infoHovered ? NEON_GREEN : 'rgba(0, 255, 65, 0.7)',
          fontSize: '1.1rem',
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.25s ease',
          zIndex: 20,
          boxShadow: infoHovered ? `0 0 12px rgba(0, 255, 65, 0.25)` : 'none'
        }}
        title="Info"
      >
        i
      </button>

      {/* Main Inner Container - The 3D Playground Box */}
      <div style={{
        position: 'relative',
        width: 'calc(100% - 2rem)',
        height: 'calc(100% - 2rem)',
        margin: '1rem',
        border: `2px solid ${isDragOver ? NEON_GREEN : 'rgba(0, 255, 65, 0.3)'}`,
        background: isDragOver ? 'rgba(0, 255, 65, 0.03)' : 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s ease',
        boxShadow: isDragOver ? `0 0 30px rgba(0, 255, 65, 0.2), inset 0 0 60px rgba(0, 255, 65, 0.05)` : 'none',
        transformStyle: 'preserve-3d',
        perspective: '1200px'
      }}>
        {/* Corner accents for inner box */}
        {[
          { top: 0, left: 0, borderTop: `3px solid ${NEON_GREEN}`, borderLeft: `3px solid ${NEON_GREEN}` },
          { top: 0, right: 0, borderTop: `3px solid ${NEON_GREEN}`, borderRight: `3px solid ${NEON_GREEN}` },
          { bottom: 0, left: 0, borderBottom: `3px solid ${NEON_GREEN}`, borderLeft: `3px solid ${NEON_GREEN}` },
          { bottom: 0, right: 0, borderBottom: `3px solid ${NEON_GREEN}`, borderRight: `3px solid ${NEON_GREEN}` }
        ].map((style, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: '20px',
            height: '20px',
            ...style
          }} />
        ))}

        {/* Empty State - Drop Hint with 3D Icon */}
        {!hasSymbols && !isDragOver && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            opacity: 0.6,
            transformStyle: 'preserve-3d'
          }}>
            {/* 3D Drop Icon */}
            <div style={{
              width: '100px',
              height: '100px',
              border: `2px dashed rgba(0, 255, 65, 0.4)`,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulse-glow 3s ease-in-out infinite',
              transform: 'perspective(500px) rotateX(-10deg) rotateY(5deg)',
              transformStyle: 'preserve-3d',
              boxShadow: '0 10px 30px rgba(0, 255, 65, 0.1)'
            }}>
              <div style={{
                transform: 'translateZ(20px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={NEON_GREEN} strokeWidth="1.5" opacity="0.8">
                  <path d="M12 3v12m0 0l-4-4m4 4l4-4" />
                  <path d="M3 15v4a2 2 0 002 2h14a2 2 0 002-2v-4" />
                </svg>
                {/* 3D cube hint */}
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={NEON_GREEN} strokeWidth="1" opacity="0.5" style={{ marginTop: '8px' }}>
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
            </div>
            <div style={{
              fontSize: 'clamp(0.9rem, 1.1vw, 1.1rem)',
              fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
              color: NEON_GREEN,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              textAlign: 'center'
            }}>
              DROP 3D OBJECTS HERE
            </div>
            <div style={{
              fontSize: 'clamp(0.75rem, 0.9vw, 0.9rem)',
              fontFamily: "'Figtree', sans-serif",
              color: 'rgba(0, 255, 65, 0.5)',
              textAlign: 'center',
              maxWidth: '220px',
              lineHeight: '1.5'
            }}>
              Hold & drag symbols to transform them into 3D objects
            </div>
          </div>
        )}

        {/* Active Drag State */}
        {isDragOver && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 255, 65, 0.05)',
            zIndex: 10,
            transformStyle: 'preserve-3d'
          }}>
            {/* 3D Landing zone indicator */}
            <div style={{
              transform: 'perspective(800px) rotateX(60deg)',
              width: '120px',
              height: '120px',
              border: `3px solid ${NEON_GREEN}`,
              borderRadius: '8px',
              animation: 'pulse-glow 0.5s ease-in-out infinite',
              position: 'absolute'
            }} />
            <div style={{
              fontSize: 'clamp(1rem, 1.3vw, 1.3rem)',
              fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
              color: NEON_GREEN,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              animation: 'flicker 0.5s infinite',
              textShadow: `0 0 20px ${NEON_GREEN}`,
              transform: 'translateZ(30px)'
            }}>
              RELEASE TO DROP
            </div>
          </div>
        )}

        {/* Symbols Active State - 3D Animated Visualization */}
        {hasSymbols && !isDragOver && (
          <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transformStyle: 'preserve-3d',
            perspective: '1000px'
          }}>
            {/* Radial gradient background */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(circle at center, rgba(0, 255, 65, ${0.05 + playgroundSymbols.length * 0.02}) 0%, transparent 70%)`,
              pointerEvents: 'none'
            }} />

            {/* 3D Stage Container */}
            <div style={{
              position: 'relative',
              width: '300px',
              height: '300px',
              transformStyle: 'preserve-3d',
              transform: `rotateX(-15deg) rotateY(${rotation * 0.3}deg)`
            }}>
              {/* Base platform with glow */}
              <div style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: '200px',
                height: '200px',
                transform: 'translate(-50%, -50%) rotateX(90deg) translateZ(-50px)',
                background: `radial-gradient(circle, rgba(0, 255, 65, ${0.15 + playgroundSymbols.length * 0.05}) 0%, transparent 70%)`,
                borderRadius: '50%',
                filter: 'blur(10px)',
                pointerEvents: 'none'
              }} />

              {/* 3D Stacked symbols - all centered, consistent size */}
              {playgroundSymbols.map((symbol, idx) => {
                // Fixed size for all elements - no scaling based on order
                const shapeSize = 180;
                
                // All centered at origin
                const x = 0;
                const y = 0;
                // Slight z-offset so elements don't z-fight
                const z = idx * 10;
                
                // Each shape rotates at its own consistent speed
                const idHash = symbol.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
                const direction = idx % 2 === 0 ? 1 : -1;
                const individualSpeed = (0.2 + (idHash % 10) * 0.03) * direction;
                const shapeRotation = rotation * individualSpeed;
                
                const isNew = newlyAddedId === symbol.id;

                return (
                  <div
                    key={symbol.id}
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      width: `${shapeSize}px`,
                      height: `${shapeSize}px`,
                      transform: `translate(-50%, -50%) translate3d(${x}px, ${y}px, ${z}px)`,
                      transformStyle: 'preserve-3d',
                      animation: isNew ? 'dropIn3d 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : undefined
                    }}
                  >
                    <Shape3D
                      shape={symbol.shape}
                      size={shapeSize}
                      rotation={shapeRotation}
                      onClick={() => onRemoveSymbol?.(symbol)}
                      title={`Click to return ${symbol.dutchName} to constants`}
                    />
                  </div>
                );
              })}

              {/* Connection beams between symbols */}
              {playgroundSymbols.length > 1 && (
                <svg style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  transform: 'translateZ(0)',
                  pointerEvents: 'none'
                }}>
                  {playgroundSymbols.map((symbol, idx) => {
                    const nextIdx = (idx + 1) % playgroundSymbols.length;
                    const angle1 = rotation * (0.5 - idx * 0.08) + (idx * 72);
                    const angle2 = rotation * (0.5 - nextIdx * 0.08) + (nextIdx * 72);
                    const rad1 = (angle1 * Math.PI) / 180;
                    const rad2 = (angle2 * Math.PI) / 180;
                    const r1 = 80 + idx * 30;
                    const r2 = 80 + nextIdx * 30;
                    const x1 = 150 + Math.cos(rad1) * r1 * 0.5;
                    const y1 = 150 + Math.sin(rad1) * r1 * 0.3;
                    const x2 = 150 + Math.cos(rad2) * r2 * 0.5;
                    const y2 = 150 + Math.sin(rad2) * r2 * 0.3;
                    
                    return (
                      <line
                        key={`beam-${symbol.id}`}
                        x1={x1} y1={y1} x2={x2} y2={y2}
                        stroke={NEON_GREEN}
                        strokeWidth="1"
                        opacity="0.3"
                        strokeDasharray="4 4"
                      />
                    );
                  })}
                </svg>
              )}
            </div>

            {/* Active Symbols Stack Display - Bottom Left */}
            <div style={{
              position: 'absolute',
              bottom: '0.75rem',
              left: '0.75rem',
              display: 'flex',
              gap: '0.4rem',
              zIndex: 15
            }}>
              {playgroundSymbols.map((symbol, idx) => (
                <div
                  key={symbol.id}
                  onClick={() => onRemoveSymbol?.(symbol)}
                  style={{
                    width: 36,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0, 0, 0, 0.8)',
                    border: `2px solid ${NEON_GREEN}`,
                    cursor: 'pointer',
                    animation: `modal-in 0.3s ease-out ${idx * 0.1}s both`,
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    transformStyle: 'preserve-3d'
                  }}
                  title={`${symbol.dutchName} - Click to remove`}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 255, 65, 0.1)';
                    e.currentTarget.style.transform = 'scale(1.1) translateZ(10px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
                    e.currentTarget.style.transform = 'scale(1) translateZ(0)';
                  }}
                >
                  <ShapeIcon shape={symbol.shape} size={20} color={NEON_GREEN} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Label */}
        <div style={{
          position: 'absolute',
          bottom: hasSymbols ? '0.75rem' : '0.5rem',
          right: '0.75rem',
          fontSize: 'clamp(0.7rem, 0.85vw, 0.85rem)',
          fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
          color: NEON_GREEN,
          opacity: 0.6,
          padding: '0.3rem 0.5rem',
          background: 'rgba(0, 0, 0, 0.6)',
          border: '1px solid rgba(0, 255, 65, 0.2)'
        }}>
          {playgroundSymbols.length}/5 ACTIVE
        </div>
      </div>
    </SectorFrame>
  );
});
SacredGeometry.displayName = 'SacredGeometry';

// Entropy Graph Component (Right Side)
const EntropyGraph = memo(() => {
  const { t } = useLanguage();
  const [sliderVal, setSliderVal] = useState(50);
  const canvasRef = useRef(null);
  const pointsRef = useRef([]);

  const getStage = (val) => {
    if (val > 70) return { title: 'NEGENTROPY', subtitle: 'Awareness', desc: 'Complex Order' };
    if (val < 30) return { title: 'ENTROPY', subtitle: 'Dissolution', desc: 'Random Chaos' };
    return { title: 'EQUILIBRIUM', subtitle: 'Transition', desc: 'Balance State' };
  };

  const stage = getStage(sliderVal);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gridSize = 8;
    const spacing = 18;
    const offsetX = (canvas.width - (gridSize * spacing)) / 2;
    const offsetY = (canvas.height - (gridSize * spacing)) / 2;

    // Initialize points only once
    if (pointsRef.current.length === 0) {
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          pointsRef.current.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            tx: offsetX + i * spacing,
            ty: offsetY + j * spacing,
            speed: 0.05 + Math.random() * 0.05
          });
        }
      }
    }

    let animationId;
    const render = (time) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = NEON_GREEN;
      
      const orderFactor = sliderVal / 100;
      
      pointsRef.current.forEach((p, idx) => {
        const noiseX = (Math.sin(time * 0.001 + idx) * canvas.width * 0.4) + canvas.width / 2;
        const noiseY = (Math.cos(time * 0.0013 + idx) * canvas.height * 0.4) + canvas.height / 2;

        const currentTx = p.tx * orderFactor + noiseX * (1 - orderFactor);
        const currentTy = p.ty * orderFactor + noiseY * (1 - orderFactor);

        p.x += (currentTx - p.x) * p.speed;
        p.y += (currentTy - p.y) * p.speed;

        const size = 1.5 + (orderFactor * 1);
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();
      });

      if (orderFactor > 0.6) {
        ctx.strokeStyle = `rgba(0, 255, 65, ${(orderFactor - 0.6)})`;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(offsetX, offsetY, gridSize * spacing, gridSize * spacing);
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [sliderVal]);

  return (
    <SectorFrame style={{ height: '100%', padding: '0.75rem', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        fontSize: 'clamp(0.8rem, 1vw, 0.95rem)',
        fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
        color: NEON_GREEN,
        textAlign: 'center',
        paddingBottom: '0.5rem',
        borderBottom: '1px solid rgba(0, 255, 65, 0.2)',
        marginBottom: '0.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ color: 'rgba(0, 255, 65, 0.5)', fontSize: 'clamp(0.7rem, 0.85vw, 0.85rem)' }}>[SYS]</span>
        <span>{t('pages.filosofiePage.entropyDynamics')}</span>
        <span style={{ color: 'rgba(0, 255, 65, 0.5)', fontSize: 'clamp(0.7rem, 0.85vw, 0.85rem)' }}>[{sliderVal}%]</span>
      </div>

      {/* Stage Display */}
      <div style={{
        textAlign: 'center',
        padding: '0.5rem',
        background: 'rgba(0, 255, 65, 0.03)',
        border: '1px solid rgba(0, 255, 65, 0.15)',
        marginBottom: '0.5rem'
      }}>
        <div style={{ fontSize: 'clamp(0.9rem, 1.2vw, 1.1rem)', color: NEON_GREEN, fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif", fontWeight: 'bold' }}>
          {stage.title}
        </div>
        <div style={{ fontSize: 'clamp(0.75rem, 0.95vw, 0.9rem)', color: 'rgba(0, 255, 65, 0.6)', fontFamily: "'Figtree', sans-serif" }}>
          {stage.subtitle} — {stage.desc}
        </div>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '120px' }}>
        <canvas 
          ref={canvasRef} 
          width={180} 
          height={180} 
          style={{ 
            border: '1px solid rgba(0, 255, 65, 0.2)',
            background: 'rgba(0, 0, 0, 0.3)'
          }} 
        />
      </div>

      {/* Slider */}
      <div style={{ marginTop: '0.75rem' }}>
        <input
          type="range"
          min="0"
          max="100"
          value={sliderVal}
          onChange={(e) => setSliderVal(Number(e.target.value))}
          style={{
            width: '100%',
            accentColor: NEON_GREEN,
            cursor: 'pointer'
          }}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 'clamp(0.7rem, 0.85vw, 0.85rem)',
          color: 'rgba(0, 255, 65, 0.5)',
          fontFamily: "'Figtree', sans-serif",
          marginTop: '0.25rem'
        }}>
          <span>{t('pages.filosofiePage.chaos')}</span>
          <span>{t('pages.filosofiePage.order')}</span>
        </div>
      </div>

      <div style={{
        fontSize: 'clamp(0.65rem, 0.8vw, 0.8rem)',
        color: 'rgba(0, 255, 65, 0.4)',
        textAlign: 'center',
        marginTop: '0.5rem',
        fontFamily: "'Figtree', sans-serif"
      }}>
        {/* ADJUST TO OBSERVE PARTICLE DYNAMICS */}
        ADJUST TO OBSERVE PARTICLE DYNAMICS
      </div>
    </SectorFrame>
  );
});
EntropyGraph.displayName = 'EntropyGraph';

// Quote Network / Insight Panel (Bottom) - Shows content based on playground symbols
const QuoteNetwork = memo(({ playgroundSymbols = [] }) => {
  const combinationInsight = getCombinationInsight(playgroundSymbols);
  const hasSymbols = playgroundSymbols.length > 0;

  return (
    <SectorFrame style={{ padding: '0.75rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        fontSize: 'clamp(0.85rem, 1.1vw, 1rem)',
        fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
        color: NEON_GREEN,
        marginBottom: '0.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>{hasSymbols ? 'SYMBOL INSIGHT' : 'MUZIEK / FOOD FOR THOUGHT'}</span>
        {hasSymbols && (
          <span style={{ 
            fontSize: 'clamp(0.7rem, 0.85vw, 0.85rem)', 
            color: 'rgba(0, 255, 65, 0.5)',
            fontFamily: "'Figtree', sans-serif"
          }}>
            {combinationInsight?.category || 'UNKNOWN'}
          </span>
        )}
      </div>

      {/* Content Area */}
      <div style={{ display: 'flex', gap: '0.5rem', flex: 1, alignItems: 'stretch' }}>
        {/* Show combination insight when symbols are active */}
        {hasSymbols ? (
          <div style={{
            flex: 1,
            padding: '1rem',
            border: `1px solid ${NEON_GREEN}`,
            background: 'rgba(0, 255, 65, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            animation: 'modal-in 0.3s ease-out'
          }}>
            {/* Symbol combination display */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.75rem',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid rgba(0, 255, 65, 0.2)'
            }}>
              {playgroundSymbols.map((symbol, idx) => (
                <React.Fragment key={symbol.id}>
                  <div style={{
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${NEON_GREEN}`,
                    background: 'rgba(0, 0, 0, 0.5)'
                  }}>
                    <ShapeIcon shape={symbol.shape} size={18} color={NEON_GREEN} />
                  </div>
                  {idx < playgroundSymbols.length - 1 && (
                    <span style={{ color: NEON_GREEN, fontSize: '1.2rem', opacity: 0.5 }}>+</span>
                  )}
                </React.Fragment>
              ))}
              <span style={{
                marginLeft: 'auto',
                fontSize: 'clamp(0.7rem, 0.85vw, 0.85rem)',
                color: 'rgba(0, 255, 65, 0.4)',
                fontFamily: "'Figtree', sans-serif"
              }}>
                = {combinationInsight?.title || 'UNKNOWN'}
              </span>
            </div>

            {/* Insight title */}
            <div style={{
              fontSize: 'clamp(1rem, 1.3vw, 1.2rem)',
              fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
              color: NEON_GREEN,
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}>
              {combinationInsight?.title || 'EMERGENCE'}
            </div>

            {/* Insight text */}
            <p style={{
              fontSize: 'clamp(0.85rem, 1.05vw, 1rem)',
              fontFamily: "'Figtree', sans-serif",
              color: 'rgba(0, 255, 65, 0.8)',
              lineHeight: '1.6',
              margin: 0
            }}>
              {combinationInsight?.insight || 'Unknown combination...'}
            </p>
          </div>
        ) : (
          /* Default quotes when no symbols */
          QUOTES.slice(0, 3).map((quote) => (
            <div
              key={quote.id}
              style={{
                flex: '1 1 0',
                minWidth: '120px',
                padding: '0.75rem',
                border: `1px solid rgba(0, 255, 65, 0.4)`,
                background: 'rgba(0, 0, 0, 0.5)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = NEON_GREEN;
                e.currentTarget.style.boxShadow = `0 0 15px rgba(0, 255, 65, 0.2)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0, 255, 65, 0.4)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <p style={{ fontSize: 'clamp(0.8rem, 1vw, 0.95rem)', color: NEON_GREEN, fontFamily: "'Figtree', sans-serif", marginBottom: '0.35rem', lineHeight: '1.4' }}>
                "{quote.text}"
              </p>
              <div style={{ fontSize: 'clamp(0.7rem, 0.85vw, 0.85rem)', color: 'rgba(0, 255, 65, 0.5)', textTransform: 'uppercase', fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif" }}>
                {quote.category}
              </div>
            </div>
          ))
        )}
      </div>
    </SectorFrame>
  );
});
QuoteNetwork.displayName = 'QuoteNetwork';

// Info Modal
const InfoModal = memo(({ isOpen, onClose }) => {
  const { t } = useLanguage();
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'modal-bg-in 0.3s ease-out'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: 'min(1100px, 85vw)',
          maxHeight: '80vh',
          overflow: 'hidden',
          animation: 'modal-in 0.4s ease-out',
          transform: 'scale(1.54)',
          transformOrigin: 'center'
        }}
      >
        <SectorFrame style={{ padding: 0 }}>
          {/* Scan line */}
          <div style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: '2px',
            background: `linear-gradient(90deg, transparent, ${NEON_GREEN}44, transparent)`,
            animation: 'scan-line 3s linear infinite',
            zIndex: 5,
            pointerEvents: 'none'
          }} />

          {/* Header */}
          <div style={{
            padding: '1rem',
            borderBottom: `1px solid rgba(0, 255, 65, 0.2)`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{
              color: NEON_GREEN,
              fontSize: 'clamp(0.9rem, 1.15vw, 1.1rem)',
              fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
              fontWeight: 'bold',
              letterSpacing: '0.1em'
            }}>
              UNIVERSAL CONSTANTS :: HUMAN PROPORTION
            </span>
            <button
              onClick={onClose}
              style={{
                width: '28px',
                height: '28px',
                background: 'rgba(255, 100, 100, 0.1)',
                border: '1px solid rgba(255, 100, 100, 0.3)',
                borderRadius: '4px',
                color: '#ff6666',
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: '1.25rem', overflowY: 'auto', maxHeight: 'calc(80vh - 60px)' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ color: NEON_GREEN, fontSize: 'clamp(0.85rem, 1vw, 1rem)', fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif" }}>{t('pages.filosofiePage.supersymmetry')}</span>
                <span style={{ color: 'rgba(0, 255, 65, 0.5)', fontSize: 'clamp(0.75rem, 0.9vw, 0.9rem)' }}>::</span>
                <span style={{ color: 'rgba(0, 255, 65, 0.6)', fontSize: 'clamp(0.8rem, 0.95vw, 0.95rem)', fontFamily: "'Figtree', sans-serif" }}>
                  {t('pages.filosofiePage.supersymmetryDescription')}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <span style={{ color: NEON_GREEN, fontSize: 'clamp(0.85rem, 1vw, 1rem)', fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif" }}>{t('pages.filosofiePage.dimensionalConscious')}</span>
                <span style={{ color: 'rgba(0, 255, 65, 0.5)', fontSize: 'clamp(0.75rem, 0.9vw, 0.9rem)' }}>::</span>
                <span style={{ color: 'rgba(0, 255, 65, 0.6)', fontSize: 'clamp(0.8rem, 0.95vw, 0.95rem)', fontFamily: "'Figtree', sans-serif" }}>
                  {t('pages.filosofiePage.dimensionalDescription')}
                </span>
              </div>
            </div>

            {/* Symbols Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
              gap: '0.6rem'
            }}>
              {SYMBOLS.map((symbol) => (
                <div key={symbol.id} style={{
                  padding: '0.6rem',
                  background: 'rgba(0, 255, 65, 0.03)',
                  border: '1px solid rgba(0, 255, 65, 0.15)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <ShapeIcon shape={symbol.shape} size={16} color={NEON_GREEN} />
                    <span style={{ fontSize: 'clamp(0.85rem, 1vw, 1rem)', color: NEON_GREEN, fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif", fontWeight: 'bold' }}>
                      {symbol.dutchName}
                    </span>
                  </div>
                  <div style={{ fontSize: 'clamp(0.8rem, 0.95vw, 0.95rem)', color: 'rgba(0, 255, 65, 0.7)', fontFamily: "'Figtree', sans-serif", marginBottom: '0.2rem' }}>
                    {symbol.meaning}
                  </div>
                  <div style={{ fontSize: 'clamp(0.75rem, 0.9vw, 0.9rem)', color: 'rgba(0, 255, 65, 0.5)', fontFamily: "'Figtree', sans-serif", lineHeight: '1.4' }}>
                    {symbol.description}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{
              marginTop: '1rem',
              padding: '0.6rem',
              background: 'rgba(0, 255, 65, 0.02)',
              border: '1px solid rgba(0, 255, 65, 0.1)',
              textAlign: 'center'
            }}>
              <span style={{ color: 'rgba(0, 255, 65, 0.4)', fontSize: 'clamp(0.75rem, 0.9vw, 0.9rem)', fontFamily: "'Figtree', sans-serif" }}>
                SECURE CONNECTION :: PROTOCOL: TRUTH • 2025
              </span>
            </div>
          </div>
        </SectorFrame>
      </div>
    </div>
  );
});
InfoModal.displayName = 'InfoModal';

// Back Button
const BackButton = memo(({ onClick }) => {
  const { t } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'absolute',
        top: '0.5rem',
        right: '1rem',
        padding: '0.4rem 0.65rem',
        background: isHovered ? 'rgba(167, 139, 250, 0.2)' : 'rgba(8, 2, 12, 0.85)',
        border: `1.5px solid ${isHovered ? 'rgba(167, 139, 250, 0.6)' : 'rgba(167, 139, 250, 0.3)'}`,
        color: isHovered ? '#c4b5fd' : 'rgba(196, 181, 253, 0.6)',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: 'clamp(0.8rem, 1vw, 0.95rem)',
        fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
        transition: 'all 0.25s ease',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        zIndex: 10,
        boxShadow: isHovered ? '0 0 15px rgba(167, 139, 250, 0.2)' : 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem'
      }}
    >
      <span>←</span>
      <span>{t('pages.filosofiePage.back')}</span>
    </button>
  );
});
BackButton.displayName = 'BackButton';

// Main FilosofiePage Component
const FilosofiePage = memo(({ isVisible, onBack }) => {
  const [showInfo, setShowInfo] = useState(false);
  const [playgroundSymbols, setPlaygroundSymbols] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [isDragging, setIsDragging] = useState(false);
  const [justReturnedId, setJustReturnedId] = useState(null);
  const [newlyAddedId, setNewlyAddedId] = useState(null);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDropToPlayground = useCallback((symbol) => {
    console.log('handleDropToPlayground called with:', symbol);
    setPlaygroundSymbols(prev => {
      console.log('Previous playground symbols:', prev);
      if (prev.some(s => s.id === symbol.id)) {
        console.log('Symbol already in playground');
        return prev;
      }
      const newSymbols = [...prev, symbol];
      console.log('New playground symbols:', newSymbols);
      return newSymbols;
    });
    // Trigger newly added animation
    setNewlyAddedId(symbol.id);
    setTimeout(() => setNewlyAddedId(null), 1000);
  }, []);

  const handleRemoveFromPlayground = useCallback((symbol) => {
    setPlaygroundSymbols(prev => prev.filter(s => s.id !== symbol.id));
    // Track which symbol just returned for pop animation
    setJustReturnedId(symbol.id);
    setTimeout(() => setJustReturnedId(null), 600);
  }, []);

  // Always render content - use CSS opacity transition for smooth exit animation
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        overflow: 'hidden',
        fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
        padding: '0',
        boxSizing: 'border-box',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)',
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      {/* Inject keyframes and body overflow fix */}
      <style>{keyframes + `
        body, html {
          overflow: hidden !important;
          height: 100vh !important;
          width: 100vw !important;
        }
      `}</style>

      {/* Scanline overlay */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(to bottom, rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.15) 50%)',
        backgroundSize: '100% 4px',
        pointerEvents: 'none',
        zIndex: 50,
        opacity: 0.2
      }} />

      {/* Main Grid Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(234px, 416px) 1fr minmax(240px, 300px)',
        gridTemplateRows: '3fr minmax(180px, 2fr)',
        gap: '0.6rem',
        width: '100%',
        height: '100%',
        maxWidth: 'calc(100vw - 2rem)',
        maxHeight: '100vh',
        overflow: 'hidden',
        position: 'relative',
        paddingLeft: '6rem'
      }}>
        {/* Left: Symbol Column - Wrapper for individual positioning */}
        <div style={{ 
          gridRow: '1 / 3',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ 
            width: '100%', 
            height: 'calc((100% - 6rem) * 0.8)',
            position: 'relative',
            transform: 'translate(-1rem, 1rem)'
          }}>
            <SymbolColumn 
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              playgroundSymbols={playgroundSymbols}
              justReturnedId={justReturnedId}
              onDropToPlayground={handleDropToPlayground}
            />
          </div>
        </div>

        {/* Center: Sacred Geometry - Wrapper for individual positioning */}
        <div style={{ 
          gridColumn: '2', 
          gridRow: '1',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ 
            width: '80%', 
            height: '80%',
            position: 'relative',
            transform: 'translate(-5.5rem, 4rem)'
          }}>
            <SacredGeometry 
              onInfoClick={() => setShowInfo(true)}
              playgroundSymbols={playgroundSymbols}
              onDrop={handleDropToPlayground}
              onRemoveSymbol={handleRemoveFromPlayground}
              newlyAddedId={newlyAddedId}
            />
          </div>
        </div>

        {/* Right: Entropy Graph - Wrapper for individual positioning */}
        <div style={{ 
          gridColumn: '3', 
          gridRow: '1 / 3',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Back Button - centered 1.5rem above entropy sector */}
          <div style={{
            position: 'absolute',
            top: '5rem',
            left: '-4.5rem',
            zIndex: 20
          }}>
            <BackButton onClick={onBack} />
          </div>
          <div style={{ 
            width: '100%', 
            height: 'calc((100% - 3rem) * 0.45)',
            position: 'relative',
            transform: 'translate(-9rem, -10.7rem)'
          }}>
            <EntropyGraph />
          </div>
        </div>

        {/* Bottom Center: Quote Network - Wrapper for individual positioning */}
        <div style={{ 
          gridColumn: '2', 
          gridRow: '2',
          position: 'relative',
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'center'
        }}>
          <div style={{ 
            width: '128%', 
            height: '80%',
            position: 'relative',
            transform: 'translate(5rem, 1rem)'
          }}>
            <QuoteNetwork playgroundSymbols={playgroundSymbols} />
          </div>
        </div>
      </div>

      {/* Info Modal */}
      <InfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} />
    </div>
  );
});

FilosofiePage.displayName = 'FilosofiePage';

export default FilosofiePage;
