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
    () => import('../components/earthholo'),
    () => import('../components/Mindholo'),
    () => import('../components/Deltawerken'),
    () => import('../components/Karman'),
    () => import('../components/Code49'),
    () => import('../components/TattooShop'),
    () => import('../components/Slide4'),
    () => import('../components/Slide5'),
    () => import('../components/Slide6'),
    () => import('../components/Slide7'),
    () => import('../components/Slide8'),
    () => import('../components/RengiFoods'),
    () => import('../components/Mind'),
    () => import('../components/Soul'),
    () => import('../components/Gardeners'),
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
  // Critical images to preload
  const imagePaths = [
    require('../images/logo.png'),
    require('../images/knightpng.png'),
    require('../images/bodypng.png'),
    require('../images/mindpng.png'),
    require('../images/soulpng.png'),
    require('../images/Holographichearth.png'),
    require('../images/Holographicmind.PNG'),
    require('../images/holographicbody.png'),
    require('../images/illustrativesun.png'),
  ];

  // Preload images by creating img elements
  imagePaths.forEach(imagePath => {
    const img = new Image();
    img.src = imagePath;
  });
};

export const preloadAll = () => {
  // Preload components and images in parallel
  preloadComponents();
  preloadImages();
};
