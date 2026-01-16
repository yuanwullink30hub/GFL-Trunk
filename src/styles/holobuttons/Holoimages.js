/**
 * Holographic Image Configuration
 * Base styles extracted from Mindholo brain structure
 * Use these configurations to create consistent holographic effects for all 3 buttons
 */

// =============================================================================
// COLOR PALETTES
// =============================================================================

export const holoPalettes = {
  // Mind button (purple/violet brain)
  mind: {
    primary: { hue: 270, saturation: 90, lightness: 60 },      // Purple particles
    secondary: { hue: 265, saturation: 90, lightness: 55 },    // Cerebrum variation
    accent: { hue: 32, saturation: 89, lightness: 51 },        // Gold center (#ef8616)
    glow: {
      left: 'rgba(90, 20, 250, 0.7)',                          // Left hemisphere
      right: 'rgba(210, 0, 230, 0.7)',                         // Right hemisphere
    },
    connections: {
      start: '#ff4500',                                         // Orange-red
      mid: '#ff8c00',                                           // Dark orange
    },
  },

  // Soul button (suggested: cyan/blue ethereal)
  soul: {
    primary: { hue: 190, saturation: 90, lightness: 60 },      // Cyan particles
    secondary: { hue: 200, saturation: 85, lightness: 55 },    // Blue variation
    accent: { hue: 50, saturation: 100, lightness: 70 },       // Bright yellow center
    glow: {
      left: 'rgba(20, 200, 250, 0.7)',                         // Left side
      right: 'rgba(0, 150, 230, 0.7)',                         // Right side
    },
    connections: {
      start: '#00bfff',                                         // Deep sky blue
      mid: '#00ffff',                                           // Cyan
    },
  },

  // Body button (suggested: green/organic)
  body: {
    primary: { hue: 120, saturation: 80, lightness: 50 },      // Green particles
    secondary: { hue: 90, saturation: 75, lightness: 45 },     // Yellow-green variation
    accent: { hue: 0, saturation: 100, lightness: 50 },        // Red center (heart)
    glow: {
      left: 'rgba(50, 205, 50, 0.7)',                          // Left side
      right: 'rgba(0, 180, 100, 0.7)',                         // Right side
    },
    connections: {
      start: '#32cd32',                                         // Lime green
      mid: '#7cfc00',                                           // Lawn green
    },
  },
};

// =============================================================================
// PARTICLE CONFIGURATION
// =============================================================================

export const particleConfig = {
  // Node counts
  nodeCount: 150,                    // Total particles
  centerNodes: 4,                    // Special center accent nodes

  // Size ranges (in pixels)
  sizes: {
    center: 24,                      // Accent center nodes
    large: { min: 6, max: 12 },      // Main region particles
    medium: { min: 4.5, max: 10.5 }, // Default particles
    small: 9,                        // Stem/connector particles
  },

  // Spacing
  centerCluster: {
    radiusMin: 35,                   // Minimum distance from center
    radiusMax: 55,                   // Maximum distance from center
  },

  // Bounds for particle generation
  bounds: {
    x: 450,
    y: 650,
    z: 500,
  },
};

// =============================================================================
// PARTICLE STYLES
// =============================================================================

export const particleStyles = {
  // Standard particle
  default: {
    opacity: 0.9,
    background: (color) => `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.95) 0%, ${color} 55%, rgba(0,0,0,0.8) 100%)`,
    boxShadow: (color, size) => `0 0 ${size/2}px ${color}`,
  },

  // Center accent particle (pineal/heart/soul center)
  accent: {
    opacity: 1,
    background: (color) => `radial-gradient(circle at 50% 50%, rgba(255,255,255,1) 15%, ${color} 60%, rgba(0,0,0,0) 100%)`,
    boxShadow: (color, size) => `0 0 ${size}px ${color}, 0 0 ${size * 0.5}px rgba(255,255,255,0.8)`,
  },

  // Main region particles
  main: {
    opacity: 0.85,
    boxShadow: (glowColor, size) => `0 0 ${size}px ${glowColor}`,
  },
};

// =============================================================================
// CONNECTION STYLES
// =============================================================================

export const connectionConfig = {
  // Connection limits
  connectionsPerPoint: 2,
  maxDistance: 120,
  maxDistanceStem: 160,
  boxLimit: 130,
  boxLimitStem: 180,

  // Visual styling
  stroke: {
    coreWidth: 1.5,
    glowWidth: 4,
    glowOpacity: 0.3,
  },

  // Curve parameters
  curve: {
    heightMin: 15,
    heightMax: 45,                   // 15 + 30 random
    controlOffset: { min: 5, max: 20 },
  },

  // Gradient stops
  gradientStops: [
    { offset: '0%', opacity: 0 },
    { offset: '25%', opacity: 0.4 },
    { offset: '50%', opacity: 1 },
    { offset: '75%', opacity: 0.4 },
    { offset: '100%', opacity: 0 },
  ],
};

// =============================================================================
// HEMISPHERE VOLUME (GLOW PLANES)
// =============================================================================

export const hemisphereConfig = {
  xOffset: 75,                       // Distance from center
  planes: [
    { rotateX: 0, rotateY: 0, width: 160, height: 260 },
    { rotateX: 0, rotateY: 90, width: 360, height: 260 },
    { rotateX: 90, rotateY: 0, width: 160, height: 360 },
    { rotateX: 0, rotateY: 45, width: 280, height: 240 },
    { rotateX: 0, rotateY: 135, width: 280, height: 240 },
  ],
  opacity: 0.5,
  blur: 20,
};

// =============================================================================
// ANIMATION CONFIG
// =============================================================================

export const animationConfig = {
  rotation: {
    duration: '36s',
    timing: 'linear',
    iteration: 'infinite',
  },
  scanline: {
    duration: '6s',
    timing: 'ease-in-out',
    direction: 'alternate',
    range: 180,                      // translateZ range (-180 to 180)
  },
};

// =============================================================================
// CONTAINER STYLES
// =============================================================================

export const containerConfig = {
  size: 'min(800px, 90vmin)',
  perspective: '2000px',
  borderRadius: '50%',
};

// =============================================================================
// CSS KEYFRAMES (inject into component)
// =============================================================================

export const keyframes = `
  @keyframes rotator {
    0% { transform: rotateY(0deg); }
    100% { transform: rotateY(360deg); }
  }
  @keyframes scan-vertical {
    0% { transform: translate(-50%, -50%) rotateX(90deg) translateZ(-180px); opacity: 0; }
    20% { opacity: 1; }
    80% { opacity: 1; }
    100% { transform: translate(-50%, -50%) rotateX(90deg) translateZ(180px); opacity: 0; }
  }
`;

// =============================================================================
// HELPER: Generate color from palette
// =============================================================================

export const generateColor = (palette, variation = 0) => {
  const h = palette.hue + (Math.random() * variation * 2 - variation);
  const s = palette.saturation;
  const l = palette.lightness + (Math.random() * 20);
  return `hsla(${h}, ${s}%, ${l}%, 0.8)`;
};

// =============================================================================
// HELPER: Generate accent color
// =============================================================================

export const generateAccentColor = (palette) => {
  return `hsla(${palette.hue}, ${palette.saturation}%, ${palette.lightness}%, 1)`;
};
