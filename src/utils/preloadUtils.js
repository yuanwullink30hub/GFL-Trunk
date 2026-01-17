// Preload all heavy components and images for better performance
// This runs when IntroPage loads, so content is ready by the time users navigate

export const preloadComponents = () => {
  // Preload heavy components - these are imported asynchronously
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

  // Load all components in the background
  componentModules.forEach(loader => {
    loader().catch(err => console.warn('Component preload failed:', err));
  });
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
