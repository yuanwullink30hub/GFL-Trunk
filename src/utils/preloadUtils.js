// Preload all heavy components and images for better performance
// This runs when IntroPage loads, so content is ready by the time users navigate

/**
 * Schedule a task during idle browser time
 * Polyfill for older browsers
 */
const scheduleIdleTask = (callback) => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback, { timeout: 5000 });
  } else {
    // Fallback: schedule after current frame
    setTimeout(callback, 0);
  }
};

export const preloadComponents = () => {
  // Preload heavy components - these are imported asynchronously
  // Spread the preloading across idle frames to avoid blocking main thread
  const componentModules = [
    () => import('../components/orbital/HoloEarth'),
    () => import('../components/orbital/DesktopLayout'),
    () => import('../components/orbital/MobileLayout'),
    () => import('../components/orbital/TechContainer'),
    () => import('../components/newFeature/HoloPyramid'),
    () => import('../components/newFeature/HoloCore'),
    () => import('../components/newFeature/HoloLabel'),
    () => import('../components/newFeature/PyramidView'),
    () => import('../components/newFeature/PyramidInner'),
    () => import('../components/newFeature/PyramidOverlay'),
  ];

  // Load components in batches during idle time
  let index = 0;
  const loadNextBatch = () => {
    if (index >= componentModules.length) return;

    // Load 2 components per idle callback
    for (let i = 0; i < 2 && index < componentModules.length; i++, index++) {
      componentModules[index]().catch(err => console.warn('Component preload failed:', err));
    }

    // Schedule next batch
    if (index < componentModules.length) {
      scheduleIdleTask(loadNextBatch);
    }
  };

  // Start preloading during idle time
  scheduleIdleTask(loadNextBatch);
};

export const preloadImages = () => {
  // Critical images to preload for orbital and newFeature components
  try {
    const imageContext = require.context('../images', true, /\.(png|jpg|jpeg|gif|webp)$/);
    imageContext.keys().forEach(path => {
      const img = new Image();
      img.src = imageContext(path);
    });
  } catch (error) {
    // Graceful fallback if images don't exist or can't be required
    console.warn('Could not preload images:', error);
  }
};

export const preloadAll = () => {
  // Preload components and images in parallel
  preloadComponents();
  preloadImages();
};
