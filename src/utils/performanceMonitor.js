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
  
  // Low-end device detection - AGGRESSIVE
  // Prioritize GPU type as the main indicator
  // Be specific about integrated GPUs vs dedicated GPUs
  const gpuLower = gpuVendor?.toLowerCase() || '';
  
  // Intel integrated GPUs (UHD, HD Graphics, Iris, etc.)
  const hasIntelIntegrated = 
    (gpuLower.includes('intel') && 
     (gpuLower.includes('uhd') || 
      gpuLower.includes('hd graphics') || 
      gpuLower.includes('iris')));
  
  // AMD integrated GPUs (Vega, Radeon Graphics on APUs)
  // Note: Dedicated Radeon cards (RX, etc.) should NOT be flagged
  const hasAMDIntegrated = 
    (gpuLower.includes('vega') && gpuLower.includes('graphics')) ||
    (gpuLower.includes('radeon') && gpuLower.includes('graphics') && !gpuLower.includes('rx'));
  
  const hasIntegratedGPU = hasIntelIntegrated || hasAMDIntegrated;
  
  const isLowEnd = 
    hasIntegratedGPU || // Integrated GPU = LOW-end (biggest bottleneck)
    navigator.hardwareConcurrency <= 4 || // 4 or fewer cores
    jsHeapSizeLimit < 500_000_000 || // Less than 500MB
    navigator.deviceMemory <= 3; // 3GB or less RAM

  // Medium-end device detection
  const isMediumEnd = 
    (navigator.hardwareConcurrency >= 5 && navigator.hardwareConcurrency <= 7) &&
    !hasIntegratedGPU && // Must have dedicated GPU
    navigator.deviceMemory >= 7 && // At least 7GB RAM
    jsHeapSizeLimit >= 1_000_000_000; // At least 1GB heap

  if (isLowEnd) {
    profile = {
      tier: 'LOW',
      maxParticles: 1500, // Reduced from 3000 - aggressive for integrated GPU
      pixelRatioCap: 1, // No super-sampling, 1x only
      waveQuality: 'low',
      voronoiFrequency: 4, // Reduced from 8 - much simpler chunks
      shaderDetail: 'simplified',
      enableAntialias: false,
      textureQuality: 0.25, // Very low texture quality
      maxDrawCalls: 150
    };
  } else if (isMediumEnd) {
    profile = {
      tier: 'MEDIUM',
      maxParticles: 4000, // Increased from 5000
      pixelRatioCap: 1.5,
      waveQuality: 'medium',
      voronoiFrequency: 8,
      shaderDetail: 'medium',
      enableAntialias: false,
      textureQuality: 0.5,
      maxDrawCalls: 500
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
  // MEDIUM tier: skip every 1 frame (45fps instead of 60fps)
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
