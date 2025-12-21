// Performance optimization utilities (debounce, throttle, memoization)

/**
 * Debounce a function - delays execution until after specified time has passed
 * Useful for: scroll events, window resize, input changes, search queries
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, delay = 300) => {
  let timeoutId = null;

  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  };
};

/**
 * Throttle a function - limits execution to once per specified time interval
 * Useful for: scroll events, mouse move, animation frames
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit = 300) => {
  let inThrottle = false;
  let lastFunc = null;

  return (...args) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (lastFunc) {
          lastFunc();
          lastFunc = null;
        }
      }, limit);
    } else {
      lastFunc = () => func(...args);
    }
  };
};

/**
 * Request animation frame throttle - optimized for smooth animations
 * @param {Function} func - Function to throttle
 * @returns {Function} RAF throttled function
 */
export const rafThrottle = (func) => {
  let rafId = null;

  return (...args) => {
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        func(...args);
        rafId = null;
      });
    }
  };
};

/**
 * Create a memoized function - caches results based on arguments
 * @param {Function} func - Pure function to memoize
 * @returns {Function} Memoized function
 */
export const memoize = (func) => {
  const cache = new Map();

  return (...args) => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = func(...args);
    cache.set(key, result);

    return result;
  };
};

/**
 * Debounce with immediate option - executes on leading or trailing edge
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @param {boolean} immediate - Execute immediately
 * @returns {Function} Debounced function
 */
export const debounceImmediate = (func, delay = 300, immediate = false) => {
  let timeoutId = null;

  return (...args) => {
    const callNow = immediate && !timeoutId;

    if (timeoutId) clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      if (!immediate) {
        func(...args);
      }
      timeoutId = null;
    }, delay);

    if (callNow) {
      func(...args);
    }
  };
};

/**
 * Cancel pending debounced/throttled calls
 * @param {Function} func - The debounced/throttled function
 */
export const cancel = (func) => {
  if (func && func.cancel) {
    func.cancel();
  }
};

/**
 * Batch DOM operations to prevent layout thrashing
 * @param {Function} readFunc - Read from DOM
 * @param {Function} writeFunc - Write to DOM
 */
export const batchDOMOperations = (readFunc, writeFunc) => {
  return requestAnimationFrame(() => {
    const readResult = readFunc();
    requestAnimationFrame(() => {
      writeFunc(readResult);
    });
  });
};

/**
 * Lazy load content (intersection observer wrapper)
 * @param {HTMLElement} element - Element to observe
 * @param {Function} callback - Callback when element enters viewport
 * @param {Object} options - IntersectionObserver options
 * @returns {IntersectionObserver} Observer instance
 */
export const lazyLoad = (element, callback, options = {}) => {
  const defaultOptions = {
    threshold: 0.1,
    rootMargin: '50px',
    ...options
  };

  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      callback();
      observer.unobserve(element);
    }
  }, defaultOptions);

  observer.observe(element);

  return observer;
};
