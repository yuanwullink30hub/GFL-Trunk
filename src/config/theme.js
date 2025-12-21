// Global theme and color configuration
export const COLORS = {
  // Primary brand colors
  PRIMARY_ORANGE: '#ef8616',
  PRIMARY_PURPLE: 'rgb(167, 59, 198)',
  
  // Button colors (triangle buttons)
  BUTTON_TEACHERS: 'rgba(239, 134, 22, 0.75)',
  BUTTON_MIND: 'rgba(34, 197, 94, 0.75)',
  BUTTON_SOUL: 'rgba(245, 158, 11, 0.75)',
  
  // Text colors
  TEXT_PRIMARY: '#FFFEF0',
  TEXT_DARK: '#26163e',
  TEXT_LIGHT: '#0c0418ff',
  
  // Background colors
  BG_DARK: '#0a0513ff',
  BG_GRADIENT_START: '#000000ff',
  BG_GRADIENT_MID: '#0a0513ff',
  BG_GRADIENT_END: '#150a24ff',
  BG_LIGHT: '#f5f5f5',
  
  // Accent colors (for slides)
  ACCENT_GREEN: 'rgba(34, 197, 94, 0.15)',
  ACCENT_BLUE: 'rgba(59, 130, 246, 0.15)',
  ACCENT_PURPLE: 'rgba(168, 85, 247, 0.15)',
  ACCENT_ORANGE: 'rgba(249, 115, 22, 0.15)',
  ACCENT_PINK: 'rgba(236, 72, 153, 0.15)',
  ACCENT_VIOLET: 'rgba(139, 92, 246, 0.15)',
  ACCENT_SKY: 'rgba(14, 165, 233, 0.15)',
  ACCENT_ORANGE_LIGHT: 'rgba(251, 146, 60, 0.15)',
  
  // Overlay colors
  OVERLAY_DARK: '#150a24ff',
  OVERLAY_TRANSPARENT: 'rgba(0,0,0,0.5)',
  OVERLAY_INVISIBLE: 'rgba(0,0,0,0.001)',
  
  // Stroke colors for buttons
  STROKE_TEACHERS: 'rgba(239, 134, 22, 0.75)',
  STROKE_MIND: 'rgba(34, 197, 94, 0.75)',
  STROKE_SOUL: 'rgba(245, 158, 11, 0.75)',
  STROKE_DEFAULT: '#ef8616',
  
  // Transparent variants for hover/focus
  TRANSPARENT_LIGHT: 'rgba(255, 255, 255, 0.1)',
  TRANSPARENT_MEDIUM: 'rgba(0, 0, 0, 0.3)'
};

// Gradient presets
export const GRADIENTS = {
  // Landing page gradient
  LANDING_PAGE: `linear-gradient(to bottom, ${COLORS.BG_GRADIENT_START}, ${COLORS.BG_GRADIENT_MID}, ${COLORS.BG_GRADIENT_END})`,
  
  // Detail pages gradient
  DETAIL_PAGE: `linear-gradient(to bottom, ${COLORS.BG_GRADIENT_START}, ${COLORS.BG_GRADIENT_MID}, ${COLORS.BG_GRADIENT_END})`
};

// Dark mode theme
export const DARK_MODE = {
  background: COLORS.BG_DARK,
  text: COLORS.TEXT_PRIMARY,
  gradient: GRADIENTS.LANDING_PAGE
};

// Light mode theme
export const LIGHT_MODE = {
  background: COLORS.BG_LIGHT,
  text: COLORS.TEXT_DARK,
  gradient: `linear-gradient(to bottom, #ffffff, #f5f5f5)`
};

// Color breathing animation (used in button borders)
export const COLOR_BREATHING = [COLORS.PRIMARY_ORANGE, COLORS.PRIMARY_PURPLE, COLORS.PRIMARY_ORANGE];

// Button specific colors
export const BUTTON_COLORS = {
  teachers: {
    text: '#0c0418ff',
    stroke: COLORS.STROKE_TEACHERS,
    accent: 'rgba(239, 134, 22, 0.5)'
  },
  mind: {
    text: '#22c55e',
    stroke: COLORS.STROKE_MIND,
    accent: 'rgba(34, 197, 94, 0.5)'
  },
  soul: {
    text: '#f59e0b',
    stroke: COLORS.STROKE_SOUL,
    accent: 'rgba(245, 158, 11, 0.5)'
  }
};
