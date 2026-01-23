// Centralized export for all utility functions and classes

// Viewport utilities
export {
  getButtonCenter,
  getElementCenter,
  isInViewport,
  getDistanceFromEdge,
  getViewportInfo,
  getSafeAreaInsets,
  calculateTransformOrigin,
  getScrollOffsetFromElement,
  calculateParallaxOffset,
  getTouchSafeArea
} from './viewportUtils';

// Scroll utilities
export {
  smoothScrollToElement,
  scrollToTop,
  getElementPosition,
  getScrollToCenter,
  lockScroll,
  unlockScroll,
  getScrollProgress
} from './scrollUtils';

// Performance utilities
export {
  debounce,
  throttle,
  rafThrottle,
  memoize,
  debounceImmediate,
  cancel,
  batchDOMOperations,
  lazyLoad
} from './performanceUtils';

// Preload utilities
export {
  preloadComponents,
  preloadImages,
  preloadAll
} from './preloadUtils';

// Animation utilities
export {
  easing,
  animateValue,
  springPhysics,
  frameRateLimiter,
  lerp,
  inverseLerp,
  clamp,
  smoothstep
} from './animationUtils';

// Geometry utilities (3D/Three.js)
export {
  Vector3Utils,
  QuaternionUtils,
  AngleUtils,
  MatrixUtils,
  GeometryUtils,
  RayCastUtils
} from './geometryUtils';

// Touch and gesture utilities
export {
  createSwipeDetector,
  createPinchDetector,
  createLongPressDetector,
  createMultiTouchDetector,
  createRotationDetector,
  createPointerTracker
} from './touchGestureUtils';

// Device utilities
export {
  getDeviceInfo,
  getBrowserInfo,
  getScreenInfo,
  getFeatureSupport,
  getNetworkInfo,
  getMemoryInfo,
  getDeviceProfile,
  monitorDeviceChanges
} from './deviceUtils';

// Storage utilities
export {
  localStorageManager,
  sessionStorageManager,
  memoryStorage,
  indexedDBManager
} from './storageUtils';

// Particle pool
export { default as ParticlePool } from './ParticlePool';

// Motion predictor
export { MotionPredictor, default as MotionPredictorDefault } from './MotionPredictor';
