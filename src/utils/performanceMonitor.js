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
    tier: 'HIGH', // HIGH or LOW
    maxParticles: 9000,
    pixelRatioCap: 2,
    waveQuality: 'high',
    voronoiFrequency: 12,
    shaderDetail: 'full',
    enableAntialias: true,
    textureQuality: 1.0,
    maxDrawCalls: 1000
  };

  // Check if device is mobile or tablet
  const isMobileOrTablet = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // If mobile/tablet, always use HIGH tier
  if (isMobileOrTablet) {
    performanceProfile = profile;
    console.log(`[Performance Monitor] Detected HIGH-end device (mobile/tablet):`, profile);
    return profile;
  }

  // Check available GPU memory and capabilities
  const debugInfo = gl?.getExtension('WEBGL_debug_renderer_info');
  const gpuVendor = debugInfo ? gl?.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown';
  
  const gpuLower = gpuVendor?.toLowerCase() || '';
  
  // Check for integrated GPU
  const hasIntelIntegrated = 
    (gpuLower.includes('intel') && 
     (gpuLower.includes('uhd') || 
      gpuLower.includes('hd graphics') || 
      gpuLower.includes('iris')));
  
  const hasAMDIntegrated = 
    (gpuLower.includes('vega') && gpuLower.includes('graphics')) ||
    (gpuLower.includes('radeon') && gpuLower.includes('graphics') && !gpuLower.includes('rx'));
  
  const hasIntegratedGPU = hasIntelIntegrated || hasAMDIntegrated;
  
  // LOW-end detection: must match ALL criteria
  // <3GB RAM AND ≤4 cores AND integrated GPU
  const isLowEnd = 
    (navigator.deviceMemory < 3) &&
    (navigator.hardwareConcurrency <= 4) &&
    hasIntegratedGPU;

  if (isLowEnd) {
    profile = {
      tier: 'LOW',
      maxParticles: 1500,
      pixelRatioCap: 1,
      waveQuality: 'low',
      voronoiFrequency: 4,
      shaderDetail: 'simplified',
      enableAntialias: false,
      textureQuality: 0.25,
      maxDrawCalls: 150
    };
  }

  // Cap device pixel ratio
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
  // HIGH tier: no skipping (60fps)
  const framesToSkip = settings.tier === 'LOW' ? 2 : 0;

  return (args) => {
    skipFrames++;
    if (skipFrames > framesToSkip) {
      callback(args);
      skipFrames = 0;
    }
  };
};
