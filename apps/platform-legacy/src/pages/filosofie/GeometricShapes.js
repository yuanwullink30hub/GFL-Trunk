import React, { memo } from 'react';

const NEON_GREEN = '#39ff14';
const NEON_PURPLE = '#a855f7';
const NEON_ORANGE = '#f97316';
const NEON_GOLD = '#FFD700';

// Circle - Realiteit
export const Circle = memo(({ size = 60, className = '', animate = true, color = NEON_GREEN }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    className={className}
    style={animate ? { animation: 'pulse-scale 3s ease-in-out infinite' } : {}}
  >
    <defs>
      <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <circle 
      cx="50" 
      cy="50" 
      r="40" 
      fill="none" 
      stroke={color}
      strokeWidth="2"
      filter="url(#glow-green)"
    />
    {/* Inner M F symbols for masculine/feminine */}
    <text x="35" y="55" fill={color} fontSize="14" fontFamily="Orbitron, monospace">M</text>
    <text x="55" y="55" fill={color} fontSize="14" fontFamily="Orbitron, monospace">F</text>
  </svg>
));
Circle.displayName = 'Circle';

// Triangle - Ruimte
export const Triangle = memo(({ size = 60, className = '', animate = true, color = NEON_GREEN }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    className={className}
    style={animate ? { animation: 'float-0 4s ease-in-out infinite' } : {}}
  >
    <defs>
      <filter id="glow-tri" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <polygon 
      points="50,10 90,85 10,85" 
      fill="none" 
      stroke={color}
      strokeWidth="2"
      filter="url(#glow-tri)"
    />
  </svg>
));
Triangle.displayName = 'Triangle';

// Square - Relatie
export const Square = memo(({ size = 60, className = '', animate = true, color = NEON_GREEN }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    className={className}
    style={animate ? { animation: 'morph 5s ease-in-out infinite' } : {}}
  >
    <defs>
      <filter id="glow-sq" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <rect 
      x="15" 
      y="15" 
      width="70" 
      height="70" 
      fill="none" 
      stroke={color}
      strokeWidth="2"
      filter="url(#glow-sq)"
    />
  </svg>
));
Square.displayName = 'Square';

// Cross - Tijd
export const Cross = memo(({ size = 60, className = '', animate = true, color = NEON_GREEN }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    className={className}
    style={animate ? { animation: 'spin 8s linear infinite' } : {}}
  >
    <defs>
      <filter id="glow-cross" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <line x1="50" y1="10" x2="50" y2="90" stroke={color} strokeWidth="2" filter="url(#glow-cross)"/>
    <line x1="10" y1="50" x2="90" y2="50" stroke={color} strokeWidth="2" filter="url(#glow-cross)"/>
  </svg>
));
Cross.displayName = 'Cross';

// SineWave - Bewustzijn
export const SineWave = memo(({ size = 60, className = '', animate = true, color = NEON_GREEN }) => {
  // Generate sine wave path
  const points = [];
  for (let i = 0; i <= 100; i += 2) {
    const x = i;
    const y = 50 + Math.sin((i / 100) * Math.PI * 3) * 30;
    points.push(`${x},${y}`);
  }
  const pathD = `M ${points.join(' L ')}`;

  return (
    <svg 
      width={size} 
      height={size * 0.6} 
      viewBox="0 0 100 60" 
      className={className}
      style={animate ? { animation: 'wave 2s ease-in-out infinite' } : {}}
    >
      <defs>
        <filter id="glow-wave" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <path 
        d={pathD}
        fill="none" 
        stroke={color}
        strokeWidth="2"
        filter="url(#glow-wave)"
      />
    </svg>
  );
});
SineWave.displayName = 'SineWave';

// Hexagon - Unie
export const Hexagon = memo(({ size = 60, className = '', animate = true, color = NEON_ORANGE }) => {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60 - 30) * (Math.PI / 180);
    const x = 50 + 40 * Math.cos(angle);
    const y = 50 + 40 * Math.sin(angle);
    points.push(`${x},${y}`);
  }

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      className={className}
      style={animate ? { animation: 'pulse-scale 3s ease-in-out infinite' } : {}}
    >
      <defs>
        <filter id="glow-hex" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <polygon 
        points={points.join(' ')} 
        fill="none" 
        stroke={color}
        strokeWidth="2"
        filter="url(#glow-hex)"
      />
    </svg>
  );
});
Hexagon.displayName = 'Hexagon';

// SeedOfLife - Schepping
export const SeedOfLife = memo(({ size = 60, className = '', animate = true, color = NEON_PURPLE }) => {
  const circles = [];
  const centerX = 50;
  const centerY = 50;
  const radius = 18;

  // Center circle
  circles.push({ cx: centerX, cy: centerY });
  
  // 6 surrounding circles
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60) * (Math.PI / 180);
    circles.push({
      cx: centerX + radius * Math.cos(angle),
      cy: centerY + radius * Math.sin(angle)
    });
  }

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      className={className}
      style={animate ? { animation: 'spin 20s linear infinite' } : {}}
    >
      <defs>
        <filter id="glow-seed" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      {circles.map((c, i) => (
        <circle 
          key={i}
          cx={c.cx} 
          cy={c.cy} 
          r={radius} 
          fill="none" 
          stroke={color}
          strokeWidth="1.5"
          opacity="0.8"
          filter="url(#glow-seed)"
        />
      ))}
    </svg>
  );
});
SeedOfLife.displayName = 'SeedOfLife';

// Torus - approximated as concentric circles with perspective
export const Torus = memo(({ size = 60, className = '', animate = true, color = NEON_GREEN }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    className={className}
    style={animate ? { animation: 'spin 10s linear infinite' } : {}}
  >
    <defs>
      <filter id="glow-torus" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    {/* Outer ellipse */}
    <ellipse cx="50" cy="50" rx="40" ry="20" fill="none" stroke={color} strokeWidth="1.5" filter="url(#glow-torus)"/>
    {/* Inner ellipse */}
    <ellipse cx="50" cy="50" rx="25" ry="12" fill="none" stroke={color} strokeWidth="1.5" filter="url(#glow-torus)"/>
    {/* Top arc */}
    <path d="M 10 50 Q 50 10, 90 50" fill="none" stroke={color} strokeWidth="1.5" filter="url(#glow-torus)"/>
    {/* Bottom arc */}
    <path d="M 25 50 Q 50 80, 75 50" fill="none" stroke={color} strokeWidth="1.5" opacity="0.5" filter="url(#glow-torus)"/>
  </svg>
));
Torus.displayName = 'Torus';

// Infinity / Figure 8 - Orde
export const InfinityShape = memo(({ size = 60, className = '', animate = true, color = NEON_GOLD }) => (
  <svg 
    width={size} 
    height={size * 0.5} 
    viewBox="0 0 100 50" 
    className={className}
    style={animate ? { animation: 'pulse-scale 4s ease-in-out infinite' } : {}}
  >
    <defs>
      <filter id="glow-inf" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <path 
      d="M 50 25 C 30 5, 5 5, 5 25 C 5 45, 30 45, 50 25 C 70 5, 95 5, 95 25 C 95 45, 70 45, 50 25"
      fill="none" 
      stroke={color}
      strokeWidth="2"
      filter="url(#glow-inf)"
    />
  </svg>
));
InfinityShape.displayName = 'InfinityShape';

// Pentagon - optional extra shape
export const Pentagon = memo(({ size = 60, className = '', animate = true, color = NEON_GREEN }) => {
  const points = [];
  for (let i = 0; i < 5; i++) {
    const angle = (i * 72 - 90) * (Math.PI / 180);
    const x = 50 + 40 * Math.cos(angle);
    const y = 50 + 40 * Math.sin(angle);
    points.push(`${x},${y}`);
  }

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      className={className}
      style={animate ? { animation: 'float-1 5s ease-in-out infinite' } : {}}
    >
      <defs>
        <filter id="glow-pent" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <polygon 
        points={points.join(' ')} 
        fill="none" 
        stroke={color}
        strokeWidth="2"
        filter="url(#glow-pent)"
      />
    </svg>
  );
});
Pentagon.displayName = 'Pentagon';

// Export all shapes as a map for easy lookup
export const SHAPES = {
  Circle,
  Triangle,
  Square,
  Cross,
  SineWave,
  Hexagon,
  SeedOfLife,
  Torus,
  InfinityShape,
  Pentagon
};

export default SHAPES;
