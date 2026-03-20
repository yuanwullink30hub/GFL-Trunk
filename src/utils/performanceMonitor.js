/**
 * Performance Monitoring & Adaptive Quality System
 * Uses WebGPU power preference, GPU benchmarking, and renderer string parsing
 * to accurately detect device capabilities and adjust animation quality
 */

let performanceProfile = null;
let detectionPromise = null;

// Profile presets
const HIGH_PROFILE = {
  tier: 'HIGH',
  maxParticles: 9000,
  pixelRatioCap: 2,
  waveQuality: 'high',
  voronoiFrequency: 12,
  shaderDetail: 'full',
  enableAntialias: true,
  textureQuality: 1.0,
  maxDrawCalls: 1000
};

const LOW_PROFILE = {
  tier: 'LOW',
  maxParticles: 300,
  pixelRatioCap: 1,
  waveQuality: 'low',
  voronoiFrequency: 3,
  shaderDetail: 'off',
  enableAntialias: false,
  textureQuality: 0.25,
  maxDrawCalls: 100
};

/**
 * Parse GPU renderer string for known high-end and low-end patterns
 * Returns: 'high', 'low', or 'unknown'
 */
const parseRendererString = (renderer) => {
  if (!renderer || renderer === 'unknown') return 'unknown';
  
  const gpuLower = renderer.toLowerCase();
  
  // Privacy-masked renderers - can't determine from string
  if (gpuLower.includes('webkit webgl') || 
      gpuLower.includes('google swiftshader') ||
      gpuLower.includes('llvmpipe') ||
      gpuLower.includes('software')) {
    return 'unknown';
  }
  
  // ============================================
  // HIGH-END iGPUs and discrete GPUs
  // ============================================
  const highEndPatterns = [
    // Intel high-end integrated
    /iris\s*xe/i,                              // Intel Iris Xe (11th gen+)
    /arc\s*a\d+/i,                             // Intel Arc discrete (A370M, A770, etc.)
    /iris\s*plus\s*g7/i,                       // Intel Iris Plus G7 (Ice Lake)
    
    // AMD high-end integrated (RDNA2/3 based)
    /radeon\s*7\d{2}m/i,                       // Radeon 780M, 760M, etc.
    /radeon\s*8\d{2}m/i,                       // Radeon 880M, 890M, etc.
    /radeon\s*rx\s*\d/i,                       // Any discrete RX card
    
    // NVIDIA discrete (any)
    /geforce/i,
    /rtx/i,
    /gtx/i,
    /nvidia/i,
    /quadro/i,
    
    // Apple Silicon (high performance)
    /apple\s*m[1-9]/i,                         // Apple M1, M2, M3, etc.
  ];
  
  for (const pattern of highEndPatterns) {
    if (pattern.test(gpuLower)) {
      return 'high';
    }
  }
  
  // ============================================
  // LOW-END iGPUs (typical laptop integrated)
  // ============================================
  const lowEndPatterns = [
    // Intel low-end integrated
    /intel.*uhd/i,                             // Intel UHD Graphics (any)
    /intel.*hd\s*graphics/i,                   // Intel HD Graphics (generic)
    /intel.*hd\s*[4-6]\d{2}/i,                 // Intel HD 4000-6000 series
    /iris\s*(?!xe|plus\s*g7)/i,                // Older Iris (not Xe or Plus G7)
    
    // AMD low-end integrated (Vega based)
    /vega\s*\d/i,                              // Vega 3, 6, 8, 10, 11
    /radeon\s*graphics(?!\s*[78]\d{2})/i,      // Generic "Radeon Graphics" without 7xx/8xx
    /radeon\s*r[2-5]/i,                        // Older Radeon R2-R5
    
    // Very old or weak GPUs
    /mali/i,                                   // ARM Mali (except high-end)
    /adreno\s*[1-5]/i,                         // Older Adreno
    /powervr/i,                                // PowerVR
  ];
  
  for (const pattern of lowEndPatterns) {
    if (pattern.test(gpuLower)) {
      return 'low';
    }
  }
  
  return 'unknown';
};

/**
 * Test WebGPU power preference support
 * High-performance adapters indicate discrete GPU or capable iGPU
 * Returns: 'high', 'low', or 'unavailable'
 */
const testWebGPUPowerPreference = async () => {
  if (!navigator.gpu) return 'unavailable';
  
  try {
    // Request high-performance adapter
    const highPerfAdapter = await navigator.gpu.requestAdapter({ 
      powerPreference: 'high-performance' 
    });
    
    // Request low-power adapter
    const lowPowerAdapter = await navigator.gpu.requestAdapter({ 
      powerPreference: 'low-power' 
    });
    
    if (!highPerfAdapter && !lowPowerAdapter) return 'unavailable';
    
    // If high-performance adapter exists and is different from low-power,
    // the device likely has a discrete GPU or capable iGPU
    if (highPerfAdapter && lowPowerAdapter) {
      const highInfo = await highPerfAdapter.requestAdapterInfo?.() || {};
      const lowInfo = await lowPowerAdapter.requestAdapterInfo?.() || {};
      
      // Different adapters = discrete GPU available = HIGH
      if (highInfo.device !== lowInfo.device || highInfo.vendor !== lowInfo.vendor) {
        return 'high';
      }
    }
    
    // Single adapter - check its info
    const adapter = highPerfAdapter || lowPowerAdapter;
    const info = await adapter.requestAdapterInfo?.() || {};
    
    // Parse the adapter description for known patterns
    const description = info.description || info.device || '';
    const rendererResult = parseRendererString(description);
    if (rendererResult !== 'unknown') return rendererResult;
    
    // If only low-power adapter works well, likely integrated
    if (!highPerfAdapter && lowPowerAdapter) return 'low';
    
    return 'unknown';
  } catch (e) {
    console.log('[Performance Monitor] WebGPU detection failed:', e.message);
    return 'unavailable';
  }
};

/**
 * Run a quick GPU benchmark using WebGL
 * Measures draw call performance to determine actual capability
 * Returns: 'high', 'low', or 'error'
 */
const runGPUBenchmark = () => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (!gl) return 'error';
    
    // Create a simple shader program for benchmarking
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
        gl_PointSize = 2.0;
      }
    `);
    gl.compileShader(vertexShader);
    
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, `
      precision mediump float;
      void main() {
        gl_FragColor = vec4(1.0, 0.5, 0.2, 1.0);
      }
    `);
    gl.compileShader(fragmentShader);
    
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);
    
    // Create vertex buffer with many points
    const numPoints = 10000;
    const positions = new Float32Array(numPoints * 2);
    for (let i = 0; i < numPoints * 2; i++) {
      positions[i] = Math.random() * 2 - 1;
    }
    
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    
    const positionLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
    
    // Warm up
    for (let i = 0; i < 5; i++) {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.POINTS, 0, numPoints);
    }
    gl.finish();
    
    // Benchmark: measure time for multiple draw calls
    const iterations = 50;
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.POINTS, 0, numPoints);
    }
    gl.finish();
    
    const endTime = performance.now();
    const avgFrameTime = (endTime - startTime) / iterations;
    
    // Cleanup
    gl.deleteBuffer(buffer);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    gl.deleteProgram(program);
    const loseExt = gl.getExtension('WEBGL_lose_context');
    if (loseExt) loseExt.loseContext();
    
    console.log(`[Performance Monitor] GPU Benchmark: ${avgFrameTime.toFixed(2)}ms avg frame time`);
    
    // Thresholds based on testing:
    // < 2ms = HIGH (discrete GPU or capable iGPU like Iris Xe)
    // 2-8ms = MEDIUM (treat as HIGH with some caution)
    // > 8ms = LOW (basic integrated like UHD 620)
    if (avgFrameTime < 2) return 'high';
    if (avgFrameTime < 8) return 'high'; // Give benefit of doubt
    return 'low';
    
  } catch (e) {
    console.log('[Performance Monitor] GPU benchmark failed:', e.message);
    return 'error';
  }
};

/**
 * Detect device performance capabilities
 * Uses multiple methods: WebGPU, GPU benchmark, and renderer string parsing
 * Returns quality tier and settings for animations
 */
export const detectPerformance = () => {
  // Return cached profile if available
  if (performanceProfile) return performanceProfile;
  
  // Start async detection but return a sync default
  // This ensures the app can start immediately
  if (!detectionPromise) {
    detectionPromise = detectPerformanceAsync();
  }
  
  // Return sync detection result (fallback)
  return detectPerformanceSync();
};

/**
 * Synchronous detection (immediate, less accurate)
 * Used as fallback while async detection runs
 * 
 * LOW-END ONLY APPLIES TO DESKTOPS/LAPTOPS
 * Phones and tablets always get the normal (HIGH) build
 */
const detectPerformanceSync = () => {
  if (performanceProfile) return performanceProfile;
  
  let profile = { ...HIGH_PROFILE };
  
  // Phones and tablets ALWAYS get HIGH tier - no low-end option for mobile devices
  const isMobileOrTablet = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Mobile-sized viewports also get HIGH tier (for responsive testing on desktop)
  const isMobileViewport = window.innerWidth < 768;
  
  if (isMobileOrTablet || isMobileViewport) {
    profile.actualPixelRatio = Math.min(window.devicePixelRatio || 1, profile.pixelRatioCap);
    performanceProfile = profile;
    console.log(`[Performance Monitor] Mobile ${isMobileOrTablet ? 'device' : 'viewport'} - always HIGH tier (no low-end for mobile)`);
    return profile;
  }
  
  // Get WebGL renderer info
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  const debugInfo = gl?.getExtension('WEBGL_debug_renderer_info');
  const renderer = debugInfo ? gl?.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown';
  const loseExt = gl?.getExtension('WEBGL_lose_context');
  if (loseExt) loseExt.loseContext();
  
  console.log(`[Performance Monitor] GPU Renderer: ${renderer}`);
  
  // Parse renderer string
  const rendererResult = parseRendererString(renderer);
  
  // Quick system checks
  const lowMemory = navigator.deviceMemory && navigator.deviceMemory < 4;
  const lowCores = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;
  
  // Determine tier based on renderer + system specs
  let isLowEnd = false;
  
  if (rendererResult === 'low') {
    isLowEnd = true;
  } else if (rendererResult === 'unknown') {
    // Can't determine from string, use system specs as fallback
    isLowEnd = lowMemory || lowCores;
  }
  // rendererResult === 'high' stays HIGH
  
  if (isLowEnd) {
    profile = { ...LOW_PROFILE };
  }
  
  profile.actualPixelRatio = Math.min(window.devicePixelRatio || 1, profile.pixelRatioCap);
  profile.renderer = renderer;
  profile.detectionMethod = 'sync';
  
  performanceProfile = profile;
  console.log(`[Performance Monitor] Sync detection: ${profile.tier}-end device`, profile);
  
  return profile;
};

/**
 * Asynchronous detection (more accurate, uses benchmarks)
 * Updates the cached profile when complete
 */
const detectPerformanceAsync = async () => {
  // Skip if we already have a definitive result
  if (performanceProfile?.detectionMethod === 'async') return performanceProfile;
  
  // Check if device is mobile or tablet
  const isMobileOrTablet = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobileOrTablet) {
    return performanceProfile; // Keep sync result for mobile
  }
  
  let profile = { ...HIGH_PROFILE };
  const detectionResults = {
    webgpu: 'pending',
    benchmark: 'pending',
    renderer: 'pending'
  };
  
  // Get WebGL renderer info
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  const debugInfo = gl?.getExtension('WEBGL_debug_renderer_info');
  const renderer = debugInfo ? gl?.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown';
  const loseExt2 = gl?.getExtension('WEBGL_lose_context');
  if (loseExt2) loseExt2.loseContext();
  
  detectionResults.renderer = parseRendererString(renderer);
  
  // Test WebGPU power preference
  detectionResults.webgpu = await testWebGPUPowerPreference();
  
  // Run GPU benchmark
  detectionResults.benchmark = runGPUBenchmark();
  
  console.log(`[Performance Monitor] Async detection results:`, detectionResults);
  
  // Determine final tier using weighted results
  // Priority: Benchmark > WebGPU > Renderer string
  let highVotes = 0;
  let lowVotes = 0;
  
  // Benchmark is most reliable (weight: 2)
  if (detectionResults.benchmark === 'high') highVotes += 2;
  if (detectionResults.benchmark === 'low') lowVotes += 2;
  
  // WebGPU power preference (weight: 1.5)
  if (detectionResults.webgpu === 'high') highVotes += 1.5;
  if (detectionResults.webgpu === 'low') lowVotes += 1.5;
  
  // Renderer string (weight: 1)
  if (detectionResults.renderer === 'high') highVotes += 1;
  if (detectionResults.renderer === 'low') lowVotes += 1;
  
  // System specs as tie-breaker
  const lowMemory = navigator.deviceMemory && navigator.deviceMemory < 4;
  const lowCores = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;
  if (lowMemory) lowVotes += 0.5;
  if (lowCores) lowVotes += 0.5;
  
  console.log(`[Performance Monitor] Votes - HIGH: ${highVotes}, LOW: ${lowVotes}`);
  
  // LOW wins if it has more votes or ties (conservative approach)
  if (lowVotes >= highVotes) {
    profile = { ...LOW_PROFILE };
  }
  
  profile.actualPixelRatio = Math.min(window.devicePixelRatio || 1, profile.pixelRatioCap);
  profile.renderer = renderer;
  profile.detectionMethod = 'async';
  profile.detectionResults = detectionResults;
  
  // Update cached profile (will affect future calls)
  performanceProfile = profile;
  
  console.log(`[Performance Monitor] Async detection complete: ${profile.tier}-end device`, profile);
  
  // Dispatch event for components that want to update based on new detection
  window.dispatchEvent(new CustomEvent('performanceProfileUpdated', { detail: profile }));
  
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
