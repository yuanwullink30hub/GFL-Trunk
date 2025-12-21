// GPU acceleration configuration for smooth animations
export const GPU_ACCELERATION = {
  // Standard GPU acceleration for transitions and overlays
  standard: {
    willChange: 'opacity, transform',
    backfaceVisibility: 'hidden',
    perspective: '1000px'
  },

  // GPU acceleration for opacity-only animations
  opacityOnly: {
    willChange: 'opacity',
    backfaceVisibility: 'hidden',
    perspective: '1000px'
  },

  // GPU acceleration for transform-only animations (scale, rotate, translate)
  transformOnly: {
    willChange: 'transform',
    backfaceVisibility: 'hidden',
    perspective: '1000px'
  },

  // Heavy animation (combined scale, rotate, opacity)
  heavy: {
    willChange: 'transform, opacity',
    backfaceVisibility: 'hidden',
    perspective: '1000px',
    transform: 'translateZ(0)' // Force hardware acceleration
  },

  // Light animation (simple fade)
  light: {
    willChange: 'opacity',
    backfaceVisibility: 'hidden'
  }
};

// Export individual presets for convenience
export const gpuAccel = {
  standard: GPU_ACCELERATION.standard,
  opacityOnly: GPU_ACCELERATION.opacityOnly,
  transformOnly: GPU_ACCELERATION.transformOnly,
  heavy: GPU_ACCELERATION.heavy,
  light: GPU_ACCELERATION.light
};
