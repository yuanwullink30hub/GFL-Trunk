/**
 * Animation utilities for smooth animations and frame management
 * Useful for Three.js scenes and canvas-based visualizations
 */

/**
 * Standard easing functions for animations
 */
export const easing = {
  linear: (t) => t,
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => (--t) * t * t + 1,
  easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * (t - 2)) * (2 * (t - 2)) + 1,
  easeInQuart: (t) => t * t * t * t,
  easeOutQuart: (t) => 1 - (--t) * t * t * t,
  easeInOutQuart: (t) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
  easeInExpo: (t) => t === 0 ? 0 : Math.pow(2, 10 * t - 10),
  easeOutExpo: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeInOutExpo: (t) => t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
  easeInCirc: (t) => 1 - Math.sqrt(1 - Math.pow(t, 2)),
  easeOutCirc: (t) => Math.sqrt(1 - Math.pow(t - 1, 2)),
  easeInOutCirc: (t) => t < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2 : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2,
};

/**
 * Animate a value over time with easing
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {number} duration - Duration in milliseconds
 * @param {Function} onUpdate - Callback with current value
 * @param {string} easingName - Name of easing function
 * @returns {Object} Animation controller with stop method
 */
export const animateValue = (start, end, duration, onUpdate, easingName = 'easeInOutQuad') => {
  const easeFn = easing[easingName] || easing.easeInOutQuad;
  let startTime = null;
  let animationId = null;

  const animate = (timestamp) => {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    const easedProgress = easeFn(progress);
    const currentValue = start + (end - start) * easedProgress;

    onUpdate(currentValue);

    if (progress < 1) {
      animationId = requestAnimationFrame(animate);
    }
  };

  animationId = requestAnimationFrame(animate);

  return {
    stop: () => {
      if (animationId) cancelAnimationFrame(animationId);
    },
    isRunning: () => animationId !== null
  };
};

/**
 * Spring animation for bouncy effects
 * @param {number} value - Current value
 * @param {number} target - Target value
 * @param {number} velocity - Current velocity
 * @param {number} stiffness - Spring stiffness (default 0.1)
 * @param {number} damping - Damping coefficient (default 0.05)
 * @returns {Object} { value, velocity }
 */
export const springPhysics = (value, target, velocity, stiffness = 0.1, damping = 0.05) => {
  const force = (target - value) * stiffness;
  const newVelocity = (velocity + force) * (1 - damping);
  const newValue = value + newVelocity;

  return { value: newValue, velocity: newVelocity };
};

/**
 * Frame limiter for consistent frame rates
 * @param {Function} callback - Function to call each frame
 * @param {number} fps - Target frames per second (default 60)
 * @returns {Object} Controller with start/stop methods
 */
export const frameRateLimiter = (callback, fps = 60) => {
  const frameInterval = 1000 / fps;
  let lastFrameTime = 0;
  let rafId = null;

  const loop = (currentTime) => {
    if (currentTime - lastFrameTime >= frameInterval) {
      callback(currentTime);
      lastFrameTime = currentTime;
    }
    rafId = requestAnimationFrame(loop);
  };

  return {
    start: () => {
      lastFrameTime = performance.now();
      rafId = requestAnimationFrame(loop);
    },
    stop: () => {
      if (rafId) cancelAnimationFrame(rafId);
    }
  };
};

/**
 * Interpolate between two values
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Progress (0-1)
 * @returns {number} Interpolated value
 */
export const lerp = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t));

/**
 * Inverse lerp - get progress from value
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} value - Current value
 * @returns {number} Progress (0-1)
 */
export const inverseLerp = (a, b, value) => {
  if (a === b) return 0;
  return (value - a) / (b - a);
};

/**
 * Clamp value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/**
 * Smoothstep interpolation (smoother than linear)
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Progress (0-1)
 * @returns {number} Smoothstepped value
 */
export const smoothstep = (a, b, t) => {
  const smoothT = t * t * (3 - 2 * t);
  return lerp(a, b, smoothT);
};
