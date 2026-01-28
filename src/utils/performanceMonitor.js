/**
 * Performance Monitoring & Adaptive Quality System
 * Detects device capabilities and adjusts animation quality accordingly
 */

let performanceProfile = null;

/**
 * Detect device performance capabilities
 * Returns quality tier and settings for animations
 */
export const detectPerformance = () => {
  if (performanceProfile) return performanceProfile;

  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  
  let profile = {
    tier: 'HIGH', // HIGH, MEDIUM, LOW
    maxParticles: 9000,
    pixelRatioCap: 2,
    waveQuality: 'high', // high, medium, low
    voronoiFrequency: 12,
    shaderDetail: 'full',
    enableAntialias: true,
    textureQuality: 1.0, // 1.0 = full, 0.5 = half
    maxDrawCalls: 1000
  };

  // Check available GPU memory and capabilities
  const debugInfo = gl?.getExtension('WEBGL_debug_renderer_info');
  const gpuVendor = debugInfo ? gl?.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown';
  
  // Check available memory (rough estimate)
  const memoryInfo = performance?.memory;
  const jsHeapSizeLimit = memoryInfo?.jsHeapSizeLimit || Infinity;
  
  // Low-end device detection
  const isLowEnd = 
    navigator.hardwareConcurrency <= 4 || // 4 or fewer cores
    jsHeapSizeLimit < 500_000_000 || // Less than 500MB
    gpuVendor?.toLowerCase().includes('radeon') || // Integrated AMD
    gpuVendor?.toLowerCase().includes('intel hd') || // Integrated Intel
    navigator.deviceMemory <= 3; // 3GB or less RAM

  // Medium-end device detection
  const isMediumEnd = 
    (navigator.hardwareConcurrency >= 5 && navigator.hardwareConcurrency <= 7) ||
    jsHeapSizeLimit < 1_000_000_000 ||
    (navigator.deviceMemory > 3 && navigator.deviceMemory < 7); // 3GB to 6.6GB RAM

  if (isLowEnd) {
    profile = {
      tier: 'LOW',
      maxParticles: 3000,
      pixelRatioCap: 1.5,
      waveQuality: 'low',
      voronoiFrequency: 8,
      shaderDetail: 'simplified',
      enableAntialias: false,
      textureQuality: 0.5,
      maxDrawCalls: 300
    };
  } else if (isMediumEnd) {
    profile = {
      tier: 'MEDIUM',
      maxParticles: 5000,
      pixelRatioCap: 1.8,
      waveQuality: 'medium',
      voronoiFrequency: 10,
      shaderDetail: 'medium',
      enableAntialias: false,
      textureQuality: 0.75,
      maxDrawCalls: 600
    };
  }

  // Cap device pixel ratio to prevent excessive rendering
  const actualPixelRatio = Math.min(window.devicePixelRatio || 1, profile.pixelRatioCap);
  profile.actualPixelRatio = actualPixelRatio;

  performanceProfile = profile;
  
  console.log(`[Performance Monitor] Detected ${profile.tier}-end device:`, profile);
  
  return profile;
};

/**
 * Get the appropriate settings for current device
 */
export const getPerformanceSettings = () => {
  return detectPerformance();
};

/**
 * Check if device can handle high-quality animations
 */
export const isHighPerformance = () => {
  return detectPerformance().tier === 'HIGH';
};

/**
 * Check if device is low-end
 */
export const isLowPerformance = () => {
  return detectPerformance().tier === 'LOW';
};

/**
 * Memoized throttle for animation frame updates
 * Helps reduce update frequency on low-end devices
 */
export const createAdaptiveRAFThrottle = (callback) => {
  const settings = getPerformanceSettings();
  let skipFrames = 0;

  // LOW tier: skip every 2nd frame (30fps instead of 60fps)
  // MEDIUM tier: skip every 3rd frame (45fps instead of 60fps)
  // HIGH tier: no skipping (60fps)
  const framesToSkip = settings.tier === 'LOW' ? 2 : settings.tier === 'MEDIUM' ? 1 : 0;

  return (args) => {
    skipFrames++;
    if (skipFrames > framesToSkip) {
      callback(args);
      skipFrames = 0;
    }
  };
};
