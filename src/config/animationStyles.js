// Animation timing constants
export const ANIMATION_TIMINGS = {
  // Welcome page animations
  WELCOME_TRIANGLE_SPIN: 9,
  WELCOME_TRIANGLE_PULSE: 4,
  
  // Landing page transitions
  DETAIL_PAGE_ENTER: 0.9,
  DETAIL_PAGE_EXIT: 0.6,
  DETAIL_PAGE_FADE: 0.3,
  PAGE_ZOOM: 1.5,
  OVERLAY_FADE: 0.6,
  
  // Detail page animations
  TRIANGLE_SCALE_BREATHE: 4,
  TRIANGLE_STROKE_BREATHE: 2.5,
  BUTTON_HOVER: 0.3,
  
  // Slideshow
  SLIDE_TRANSITION: 0.6,
  SLIDE_SCALE: 0.6,
  LOGO_FADE: 0.3,
  
  // Scroll animations
  SCROLL_EASE_DURATION: 0.8
};

// Animation easing presets
export const ANIMATION_EASING = {
  SMOOTH: 'easeInOut',
  EASE_IN: 'easeIn',
  EASE_OUT: 'easeOut',
  LINEAR: 'linear',
  SPRING: { type: 'spring', stiffness: 300, damping: 30 }
};

// Animation delays
export const ANIMATION_DELAYS = {
  STAGGER_SMALL: 0.1,
  STAGGER_MEDIUM: 0.2,
  STAGGER_LARGE: 0.5,
  BREATHE_OFFSET: 0.5
};

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
