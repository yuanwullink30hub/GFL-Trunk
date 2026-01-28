/**
 * Animation Optimization Utilities
 * Provides adaptive animation frame rates and smooth motion
 */

import { getPerformanceSettings } from './performanceMonitor';

/**
 * Create an adaptive animation frame throttle
 * Reduces frame rate on low-end devices for smoother overall performance
 */
export const createAdaptiveFrameThrottle = (callback) => {
  const settings = getPerformanceSettings();
  let frameCount = 0;
  let rafId = null;

  // Determine frame skip rate based on device tier
  let skipFrames = 0;
  if (settings.tier === 'LOW') {
    skipFrames = 1; // 30fps instead of 60fps
  } else if (settings.tier === 'MEDIUM') {
    skipFrames = 0; // 60fps with potential throttling
  }

  const animate = () => {
    frameCount++;
    if (frameCount > skipFrames) {
      callback();
      frameCount = 0;
    }
    rafId = requestAnimationFrame(animate);
  };

  return {
    start: () => {
      if (!rafId) rafId = requestAnimationFrame(animate);
    },
    stop: () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    },
  };
};

/**
 * Throttle scroll events for better performance
 * @param {Function} handler - Scroll handler function
 * @param {number} delay - Throttle delay in ms
 * @returns {Function} Throttled function
 */
export const throttleScroll = (handler, delay = 50) => {
  let lastCall = 0;
  let timeoutId = null;

  return (event) => {
    const now = Date.now();
    
    if (now - lastCall < delay) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handler(event);
        lastCall = Date.now();
      }, delay - (now - lastCall));
    } else {
      handler(event);
      lastCall = now;
    }
  };
};

/**
 * Defer heavy computations to next idle time
 * Uses requestIdleCallback if available, falls back to setTimeout
 */
export const deferComputation = (callback) => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback, { timeout: 2000 });
  } else {
    setTimeout(callback, 0);
  }
};

/**
 * Create an intersection observer for lazy loading
 * @param {Function} callback - Callback when element intersects
 * @param {Object} options - Observer options
 * @returns {IntersectionObserver}
 */
export const createLazyLoadObserver = (callback, options = {}) => {
  return new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback(entry);
      }
    });
  }, {
    threshold: 0.1,
    ...options,
  });
};

/**
 * Estimate frame time for performance monitoring
 * @returns {number} Estimated frame time in ms
 */
export const getTargetFrameTime = () => {
  const settings = getPerformanceSettings();
  
  if (settings.tier === 'LOW') {
    return 33.33; // ~30fps
  } else if (settings.tier === 'MEDIUM') {
    return 16.67; // ~60fps
  }
  return 16.67; // ~60fps for HIGH-end
};

/**
 * Monitor frame rate drops and log performance issues
 */
export const createFrameRateMonitor = (onDropDetected = null) => {
  let lastFrameTime = performance.now();
  let frameCount = 0;
  let lowFrameCount = 0;
  const frameTargetTime = getTargetFrameTime();

  return {
    checkFrame: () => {
      const now = performance.now();
      const deltaTime = now - lastFrameTime;

      if (deltaTime > frameTargetTime * 1.5) {
        // Frame drop detected
        lowFrameCount++;
        if (onDropDetected) {
          onDropDetected({
            deltaTime,
            frameTarget: frameTargetTime,
            dropCount: lowFrameCount,
          });
        }
      }

      frameCount++;
      if (frameCount % 60 === 0) {
        console.log(
          `[Frame Monitor] FPS: ${(1000 / deltaTime).toFixed(1)}, Drops: ${lowFrameCount}`
        );
        lowFrameCount = 0;
      }

      lastFrameTime = now;
    },
  };
};
