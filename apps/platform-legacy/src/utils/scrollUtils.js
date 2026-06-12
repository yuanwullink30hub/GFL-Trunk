// Scroll utility functions for smooth scrolling and viewport calculations

/**
 * Smooth scroll to element with easing
 * @param {HTMLElement} element - Element to scroll to
 * @param {number} duration - Duration in milliseconds
 * @param {string} easing - Easing function: 'easeInOut', 'easeIn', 'easeOut', 'linear'
 */
export const smoothScrollToElement = (element, duration = 800, easing = 'easeInOut') => {
  if (!element) return;

  const startPosition = window.scrollY;
  const targetPosition = element.getBoundingClientRect().top + window.scrollY;
  const distance = targetPosition - startPosition;
  let start = null;

  const easingFunctions = {
    linear: (t) => t,
    easeIn: (t) => t * t,
    easeOut: (t) => t * (2 - t),
    easeInOut: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  };

  const easeFunction = easingFunctions[easing] || easingFunctions.easeInOut;

  const scroll = (timestamp) => {
    if (!start) start = timestamp;
    const progress = (timestamp - start) / duration;
    const ease = easeFunction(Math.min(progress, 1));

    window.scrollTo(0, startPosition + distance * ease);

    if (progress < 1) {
      requestAnimationFrame(scroll);
    }
  };

  requestAnimationFrame(scroll);
};

/**
 * Scroll to top with easing
 * @param {number} duration - Duration in milliseconds
 * @param {string} easing - Easing function
 */
export const scrollToTop = (duration = 800, easing = 'easeOut') => {
  const startPosition = window.scrollY;
  let start = null;

  const easingFunctions = {
    linear: (t) => t,
    easeIn: (t) => t * t,
    easeOut: (t) => t * (2 - t),
    easeInOut: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  };

  const easeFunction = easingFunctions[easing] || easingFunctions.easeOut;

  const scroll = (timestamp) => {
    if (!start) start = timestamp;
    const progress = (timestamp - start) / duration;
    const ease = easeFunction(Math.min(progress, 1));

    window.scrollTo(0, startPosition * (1 - ease));

    if (progress < 1) {
      requestAnimationFrame(scroll);
    }
  };

  requestAnimationFrame(scroll);
};

/**
 * Get element position relative to viewport
 * @param {HTMLElement} element - Element to get position of
 * @returns {Object} Position object { top, bottom, left, right, inView }
 */
export const getElementPosition = (element) => {
  if (!element) return null;

  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  const windowWidth = window.innerWidth;

  return {
    top: rect.top,
    bottom: rect.bottom,
    left: rect.left,
    right: rect.right,
    inView: {
      vertical: rect.top >= 0 && rect.bottom <= windowHeight,
      horizontal: rect.left >= 0 && rect.right <= windowWidth,
      partial: rect.top < windowHeight && rect.bottom > 0
    },
    rect
  };
};

/**
 * Calculate scroll position for centered element
 * @param {HTMLElement} element - Element to center
 * @returns {number} Scroll position
 */
export const getScrollToCenter = (element) => {
  if (!element) return 0;

  const rect = element.getBoundingClientRect();
  const elementTop = rect.top + window.scrollY;
  const elementHeight = rect.height;
  const windowHeight = window.innerHeight;

  return elementTop - (windowHeight / 2) + (elementHeight / 2);
};

/**
 * Lock scroll (prevent scrolling)
 */
export const lockScroll = () => {
  const scrollTop = window.scrollY;
  document.body.style.overflow = 'hidden';
  document.body.style.top = `-${scrollTop}px`;
};

/**
 * Unlock scroll (restore scrolling)
 */
export const unlockScroll = () => {
  const scrollTop = Math.abs(parseInt(document.body.style.top));
  document.body.style.overflow = 'auto';
  document.body.style.top = '0';
  window.scrollTo(0, scrollTop);
};

/**
 * Get scroll progress percentage
 * @returns {number} Progress 0-100
 */
export const getScrollProgress = () => {
  const windowHeight = document.documentElement.clientHeight;
  const documentHeight = document.documentElement.scrollHeight - windowHeight;
  const scrolled = (window.scrollY / documentHeight) * 100;
  return Math.round(scrolled);
};
