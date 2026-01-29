// Viewport and DOM utilities for common calculations

/**
 * Calculate button center position for zoom animations
 * @param {HTMLElement} buttonElement - The button element
 * @returns {Object} Center position { x, y } as percentages
 */
export const getButtonCenter = (buttonElement) => {
  if (!buttonElement) return { x: '50%', y: '50%' };

  const rect = buttonElement.getBoundingClientRect();
  const x = ((rect.left + rect.width / 2) / window.innerWidth) * 100;
  const y = ((rect.top + rect.height / 2) / window.innerHeight) * 100;

  return {
    x: `${x}%`,
    y: `${y}%`
  };
};

/**
 * Get element center coordinates in document space
 * @param {HTMLElement} element - Element to get center of
 * @returns {Object} Center coordinates { x, y, pageX, pageY }
 */
export const getElementCenter = (element) => {
  if (!element) return { x: 0, y: 0, pageX: 0, pageY: 0 };

  const rect = element.getBoundingClientRect();

  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
    pageX: rect.left + rect.width / 2 + window.scrollX,
    pageY: rect.top + rect.height / 2 + window.scrollY
  };
};

/**
 * Check if element is in viewport
 * @param {HTMLElement} element - Element to check
 * @param {boolean} partial - Check for partial visibility
 * @returns {boolean} Is in viewport
 */
export const isInViewport = (element, partial = false) => {
  if (!element) return false;

  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  const windowWidth = window.innerWidth;

  if (partial) {
    return (
      rect.bottom > 0 &&
      rect.right > 0 &&
      rect.top < windowHeight &&
      rect.left < windowWidth
    );
  }

  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= windowHeight &&
    rect.right <= windowWidth
  );
};

/**
 * Get distance of element from viewport edge
 * @param {HTMLElement} element - Element to measure
 * @param {string} edge - 'top', 'bottom', 'left', 'right'
 * @returns {number} Distance in pixels (negative = above viewport)
 */
export const getDistanceFromEdge = (element, edge = 'top') => {
  if (!element) return 0;

  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  const windowWidth = window.innerWidth;

  switch (edge) {
    case 'top':
      return rect.top;
    case 'bottom':
      return windowHeight - rect.bottom;
    case 'left':
      return rect.left;
    case 'right':
      return windowWidth - rect.right;
    default:
      return rect.top;
  }
};

/**
 * Calculate viewport dimensions and safe areas
 * @returns {Object} Viewport info
 */
export const getViewportInfo = () => {
  const isMobile = window.innerWidth < 768;
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1100;
  const isDesktop = window.innerWidth >= 1100;

  return {
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile,
    isTablet,
    isDesktop,
    aspectRatio: window.innerWidth / window.innerHeight,
    isPortrait: window.innerHeight > window.innerWidth,
    isLandscape: window.innerWidth > window.innerHeight
  };
};

/**
 * Get safe area insets (notch, etc on mobile)
 * @returns {Object} Safe area insets
 */
export const getSafeAreaInsets = () => {
  const style = getComputedStyle(document.documentElement);
  
  return {
    top: style.getPropertyValue('env(safe-area-inset-top)') || '0px',
    right: style.getPropertyValue('env(safe-area-inset-right)') || '0px',
    bottom: style.getPropertyValue('env(safe-area-inset-bottom)') || '0px',
    left: style.getPropertyValue('env(safe-area-inset-left)') || '0px'
  };
};

/**
 * Calculate transform origin string for element
 * @param {HTMLElement} element - Element to calculate for
 * @returns {string} Transform origin value
 */
export const calculateTransformOrigin = (element) => {
  if (!element) return '50% 50%';

  const center = getButtonCenter(element);
  return `${center.x} ${center.y}`;
};

/**
 * Get scroll position relative to element
 * @param {HTMLElement} element - Reference element
 * @returns {number} Scroll offset from element
 */
export const getScrollOffsetFromElement = (element) => {
  if (!element) return 0;

  const elementTop = element.getBoundingClientRect().top + window.scrollY;
  return window.scrollY - elementTop;
};

/**
 * Calculate parallax offset
 * @param {HTMLElement} element - Element to parallax
 * @param {number} speed - Parallax speed (0-1, 0.5 = 50% of scroll)
 * @returns {number} Offset value in pixels
 */
export const calculateParallaxOffset = (element, speed = 0.5) => {
  if (!element) return 0;

  const elementTop = element.getBoundingClientRect().top;
  const elementHeight = element.offsetHeight;
  const windowHeight = window.innerHeight;

  // Calculate scroll percentage of element visibility
  const visibilityPercent = 1 - (elementTop + elementHeight) / windowHeight;
  
  return (visibilityPercent * 100) * speed;
};

/**
 * Get touch-safe click area (minimum 44x44 points)
 * @param {HTMLElement} element - Element to check
 * @returns {Object} { isSafe, width, height }
 */
export const getTouchSafeArea = (element) => {
  if (!element) return { isSafe: false, width: 0, height: 0 };

  const minSize = 44; // 44 points for touch targets per WCAG
  const rect = element.getBoundingClientRect();

  return {
    isSafe: rect.width >= minSize && rect.height >= minSize,
    width: Math.max(rect.width, minSize),
    height: Math.max(rect.height, minSize),
    recommendation: rect.width < minSize || rect.height < minSize
      ? `Increase to at least ${minSize}x${minSize}px for better touch targets`
      : 'Touch target size is adequate'
  };
};
