/**
 * Touch and gesture utilities for better mobile/touch support
 * Handles swipe, pinch, long-press, and multi-touch gestures
 */

/**
 * Detect swipe gestures
 * @param {HTMLElement} element - Element to attach gesture to
 * @param {Object} handlers - { onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight }
 * @param {number} threshold - Minimum swipe distance in pixels (default 50)
 * @returns {Object} Controller with remove method
 */
export const createSwipeDetector = (element, handlers = {}, threshold = 50) => {
  let startX = 0;
  let startY = 0;

  const handleTouchStart = (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;

    const diffX = startX - endX;
    const diffY = startY - endY;

    const absDiffX = Math.abs(diffX);
    const absDiffY = Math.abs(diffY);

    if (Math.max(absDiffX, absDiffY) > threshold) {
      if (absDiffX > absDiffY) {
        if (diffX > 0) {
          handlers.onSwipeLeft?.();
        } else {
          handlers.onSwipeRight?.();
        }
      } else {
        if (diffY > 0) {
          handlers.onSwipeUp?.();
        } else {
          handlers.onSwipeDown?.();
        }
      }
    }
  };

  element.addEventListener('touchstart', handleTouchStart);
  element.addEventListener('touchend', handleTouchEnd);

  return {
    remove: () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    }
  };
};

/**
 * Detect pinch/zoom gestures
 * @param {HTMLElement} element - Element to attach gesture to
 * @param {Function} onPinch - Callback with { scale, deltaScale } (scale > 1 = zoom in)
 * @returns {Object} Controller with remove method
 */
export const createPinchDetector = (element, onPinch) => {
  let lastDistance = 0;

  const getDistance = (touches) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      lastDistance = getDistance(e.touches);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      const currentDistance = getDistance(e.touches);
      const scale = currentDistance / lastDistance;
      const deltaScale = scale - 1;

      onPinch?.({ scale, deltaScale, distance: currentDistance });
      lastDistance = currentDistance;
    }
  };

  element.addEventListener('touchstart', handleTouchStart);
  element.addEventListener('touchmove', handleTouchMove);

  return {
    remove: () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
    }
  };
};

/**
 * Detect long-press gesture
 * @param {HTMLElement} element - Element to attach gesture to
 * @param {Function} onLongPress - Callback when long-press detected
 * @param {number} duration - Duration in milliseconds (default 500)
 * @returns {Object} Controller with remove method
 */
export const createLongPressDetector = (element, onLongPress, duration = 500) => {
  let timeout = null;

  const handleTouchStart = () => {
    timeout = setTimeout(() => {
      onLongPress?.();
    }, duration);
  };

  const handleTouchEnd = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  element.addEventListener('touchstart', handleTouchStart);
  element.addEventListener('touchend', handleTouchEnd);
  element.addEventListener('touchcancel', handleTouchEnd);

  return {
    remove: () => {
      clearTimeout(timeout);
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
    }
  };
};

/**
 * Detect multi-touch events
 * @param {HTMLElement} element - Element to attach gesture to
 * @param {Object} handlers - { onSingleTouch, onMultiTouch }
 * @returns {Object} Controller with remove method
 */
export const createMultiTouchDetector = (element, handlers = {}) => {
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      handlers.onSingleTouch?.({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    } else if (e.touches.length > 1) {
      const touches = Array.from(e.touches).map(t => ({
        x: t.clientX,
        y: t.clientY,
        id: t.identifier
      }));
      handlers.onMultiTouch?.(touches);
    }
  };

  element.addEventListener('touchstart', handleTouchStart);

  return {
    remove: () => {
      element.removeEventListener('touchstart', handleTouchStart);
    }
  };
};

/**
 * Detect rotation gesture (two-finger rotation)
 * @param {HTMLElement} element - Element to attach gesture to
 * @param {Function} onRotate - Callback with { angle, deltaAngle } in radians
 * @returns {Object} Controller with remove method
 */
export const createRotationDetector = (element, onRotate) => {
  let lastAngle = 0;

  const getAngle = (touches) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.atan2(dy, dx);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      lastAngle = getAngle(e.touches);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      const currentAngle = getAngle(e.touches);
      let deltaAngle = currentAngle - lastAngle;

      // Normalize angle difference to -PI to PI
      while (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
      while (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;

      onRotate?.({ angle: currentAngle, deltaAngle });
      lastAngle = currentAngle;
    }
  };

  element.addEventListener('touchstart', handleTouchStart);
  element.addEventListener('touchmove', handleTouchMove);

  return {
    remove: () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
    }
  };
};

/**
 * Pointer event utilities (supports mouse, touch, pen)
 * @param {HTMLElement} element - Element to attach to
 * @param {Object} handlers - { onPointerDown, onPointerMove, onPointerUp }
 * @returns {Object} Controller with remove method
 */
export const createPointerTracker = (element, handlers = {}) => {
  const activePointers = new Map();

  const handlePointerDown = (e) => {
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY, type: e.pointerType });
    handlers.onPointerDown?.({ id: e.pointerId, x: e.clientX, y: e.clientY, type: e.pointerType });
  };

  const handlePointerMove = (e) => {
    const pointer = activePointers.get(e.pointerId);
    if (pointer) {
      const deltaX = e.clientX - pointer.x;
      const deltaY = e.clientY - pointer.y;
      pointer.x = e.clientX;
      pointer.y = e.clientY;

      handlers.onPointerMove?.({
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        deltaX,
        deltaY,
        type: e.pointerType,
        activePointers: activePointers.size
      });
    }
  };

  const handlePointerUp = (e) => {
    const pointer = activePointers.get(e.pointerId);
    activePointers.delete(e.pointerId);
    handlers.onPointerUp?.({ id: e.pointerId, type: e.pointerType });
  };

  element.addEventListener('pointerdown', handlePointerDown);
  element.addEventListener('pointermove', handlePointerMove);
  element.addEventListener('pointerup', handlePointerUp);
  element.addEventListener('pointercancel', handlePointerUp);

  return {
    remove: () => {
      element.removeEventListener('pointerdown', handlePointerDown);
      element.removeEventListener('pointermove', handlePointerMove);
      element.removeEventListener('pointerup', handlePointerUp);
      element.removeEventListener('pointercancel', handlePointerUp);
    },
    getActivePointers: () => Array.from(activePointers.values())
  };
};
