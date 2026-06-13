// Preload all heavy components, images, and resources for better performance
// This runs during the loading screen so content is ready when it fades out

/**
 * Schedule a task during idle browser time
 * Polyfill for older browsers
 */
const scheduleIdleTask = (callback) => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback, { timeout: 2000 });
  } else {
    // Fallback: schedule after current frame
    setTimeout(callback, 1);
  }
};

/**
 * Preload a single image and return a promise
 */
const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => {
      console.warn(`Failed to preload image: ${src}`);
      resolve(src); // Resolve anyway to not block loading
    };
    img.src = src;
  });
};

/**
 * Pre-warm WebGL context and compile basic shaders
 * This helps avoid jank when the 3D scene first renders
 */
// eslint-disable-next-line no-unused-vars
const preWarmWebGL = () => {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      
      if (!gl) {
        resolve();
        return;
      }
      
      // Create and compile a vertex shader
      const vertexShader = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vertexShader, `
        attribute vec3 position;
        attribute vec3 normal;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        varying vec3 vNormal;
        varying vec2 vUv;
        void main() {
          vNormal = normal;
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `);
      gl.compileShader(vertexShader);
      
      // Create and compile a fragment shader (similar to what Three.js uses)
      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fragmentShader, `
        precision highp float;
        varying vec3 vNormal;
        varying vec2 vUv;
        uniform vec3 color;
        uniform float opacity;
        void main() {
          vec3 light = normalize(vec3(1.0, 1.0, 1.0));
          float diffuse = max(dot(vNormal, light), 0.0);
          gl_FragColor = vec4(color * (0.3 + 0.7 * diffuse), opacity);
        }
      `);
      gl.compileShader(fragmentShader);
      
      // Create program and link
      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      gl.useProgram(program);
      
      // Create a simple geometry to force GPU pipeline warmup
      const vertices = new Float32Array([
        -1, -1, 0,  1, -1, 0,  1, 1, 0,
        -1, -1, 0,  1, 1, 0,  -1, 1, 0
      ]);
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
      
      // Draw a few frames to warm up the pipeline
      gl.viewport(0, 0, 256, 256);
      gl.clearColor(0, 0, 0, 1);
      for (let i = 0; i < 10; i++) {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
      gl.finish();
      
      // Cleanup
      gl.deleteBuffer(buffer);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteProgram(program);
      
      console.log('[Preload] WebGL context pre-warmed');
      resolve();
    } catch (e) {
      console.warn('[Preload] WebGL warmup failed:', e);
      resolve();
    }
  });
};

/**
 * Preload Three.js and related libraries
 */
// eslint-disable-next-line no-unused-vars
const preloadThreeJS = async () => {
  try {
    // Import THREE to trigger bundler to load it
    await import('three');
    await import('@react-three/fiber');
    await import('@react-three/drei');
    console.log('[Preload] Three.js libraries loaded');
  } catch (e) {
    console.warn('[Preload] Three.js preload failed:', e);
  }
};

/**
 * Preload heavy React components
 */
export const preloadComponents = () => {
  return new Promise((resolve) => {
    const componentModules = [
      () => import('../components/orbital/HoloEarth'),
      () => import('../components/orbital/DesktopLayout'),
      () => import('../components/orbital/MobileLayout'),
      () => import('../components/orbital/TechContainer'),
      () => import('../components/orbital/EarthParticleWaves'),
      () => import('../components/holoearth/HoloPyramid'),
      () => import('../components/holoearth/HoloCore'),
      () => import('../components/holoearth/HoloLabel'),
      () => import('../components/holoearth/PyramidView'),
      () => import('../components/holoearth/PyramidInner'),
      () => import('../components/holoearth/PyramidOverlay'),
      () => import('../pages/FilosofiePage'),
      () => import('../pages/GardensPage'),
      () => import('../pages/DataPage'),
      () => import('../pages/LoginPage'),
      () => import('../pages/EyedentityPage'),
    ];

    // Load all components in parallel for speed
    Promise.all(
      componentModules.map(load => 
        load().catch(err => {
          console.warn('Component preload failed:', err);
          return null;
        })
      )
    ).then(() => {
      console.log('[Preload] Components loaded');
      resolve();
    });
  });
};

/**
 * Preload critical images
 */
export const preloadImages = () => {
  // Critical images that need to be ready immediately
  const criticalImages = [
    'images/landingpage/logo.png',
  ];
  
  // Slideshow images (important but can load slightly later)
  const slideshowImages = [
    'images/slideshow images/1111logo.png',
    'images/slideshow images/club49-logo.png', 
    'images/slideshow images/karmaneventsPNG.png',
    'images/slideshow images/Rengi-logo.png',
  ];
  
  // UI images
  const uiImages = [
    'images/Blackhole.png',
    'images/Eyedentity.png',
    'images/illustrativesun.png',
  ];
  
  const allImages = [...criticalImages, ...slideshowImages, ...uiImages];
  
  return Promise.all(allImages.map(preloadImage)).then(() => {
    console.log('[Preload] Images loaded');
  });
};

/**
 * Preload fonts to prevent FOUT (Flash of Unstyled Text)
 */
const preloadFonts = () => {
  return new Promise((resolve) => {
    if (!document.fonts) {
      resolve();
      return;
    }
    
    const fontPromises = [
      document.fonts.load('400 16px "Figtree"'),
      document.fonts.load('700 16px "Figtree"'),
      document.fonts.load('400 16px "Lexend Mega"'),
      document.fonts.load('700 16px "Lexend Mega"'),
      document.fonts.load('400 16px "Rajdhani"'),
      document.fonts.load('700 16px "Rajdhani"'),
    ];
    
    Promise.all(fontPromises)
      .then(() => {
        console.log('[Preload] Fonts loaded');
        resolve();
      })
      .catch(() => {
        console.warn('[Preload] Some fonts failed to load');
        resolve();
      });
  });
};

/**
 * Yield to the event loop so setInterval / DOM updates can fire
 */
const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Master preload function — phased loading with smooth progress
 *
 * Phase 1 (0→50%): Download + evaluate Three.js (the single heaviest dep)
 * Phase 2 (50→100%): Download + evaluate all components in parallel
 *
 * Yields between phases so the loading bar interval can fire.
 * Images + fonts load in background without blocking.
 *
 * @param {function} onProgress - Callback with progress (0-1)
 * @param {object} options - { signal: AbortController.signal } for cancellation
 */
export const preloadAll = async (onProgress, options = {}) => {
  const signal = options.signal;
  const aborted = () => signal && signal.aborted;
  const report = (p) => { if (onProgress && !aborted()) onProgress(p); };

  report(0);

  // ── All imports loaded sequentially with yields ──
  // Sequential loading ensures each import triggers a visible progress
  // bar update before the next one starts evaluating.
  const allImports = [
    // Three.js core (heaviest)
    () => import('three'),
    () => import('@react-three/fiber'),
    () => import('@react-three/drei'),
    // App components
    () => import('../components/orbital/HoloEarth'),
    () => import('../components/orbital/DesktopLayout'),
    () => import('../components/orbital/MobileLayout'),
    () => import('../components/orbital/TechContainer'),
    () => import('../components/orbital/EarthParticleWaves'),
    () => import('../components/holoearth/HoloPyramid'),
    () => import('../components/holoearth/HoloCore'),
    () => import('../components/holoearth/HoloLabel'),
    () => import('../components/holoearth/PyramidView'),
    () => import('../components/holoearth/PyramidInner'),
    () => import('../components/holoearth/PyramidOverlay'),
    // NOTE: the section pages (DataPage/Filosofie/Gardens/Login/Eyedentity) are
    // intentionally NOT eagerly preloaded — they're navigated-to and already lazy,
    // and three.js (warmed above) is their heavy dep. Eager-loading them here
    // saturated the main thread for ~30s after the loading screen, making
    // section navigation laggy. They now load on-demand (fast, three is warm).
  ];
  const total = allImports.length;
  for (let i = 0; i < total; i++) {
    if (aborted()) return;
    try {
      await allImports[i]();
    } catch (e) {
      console.warn('[Preload] Import failed:', e);
    }
    report((i + 1) / total);
    // Yield to event loop so the loading bar interval can fire
    await yieldToMain();
  }

  // ── Background: images + fonts (fire-and-forget) ──
  const bgImages = [
    'images/landingpage/logo.png',
    'images/slideshow images/1111logo.png',
    'images/slideshow images/club49-logo.png',
    'images/slideshow images/karmaneventsPNG.png',
    'images/slideshow images/Rengi-logo.png',
    'images/Blackhole.png',
    'images/Eyedentity.png',
    'images/illustrativesun.png',
  ];
  bgImages.forEach(src => preloadImage(src).catch(() => {}));
  preloadFonts().catch(() => {});

  if (!aborted()) {
    report(1);
    console.log('[Preload] All critical resources loaded');
  }
};

/**
 * Preload in background during idle time (non-blocking)
 * Use this for non-critical resources after initial load
 */
export const preloadInBackground = () => {
  // Gently warm the section-page chunks AFTER the landing is ready — ONE per idle
  // tick, so the first navigation to a section doesn't pay a synchronous chunk
  // eval (a full freeze). This is the calm counterpart to the up-front preloadAll
  // blast that made navigation laggy for ~30s: low priority, spread across idle.
  const pages = [
    () => import('../pages/LoginPage'),
    () => import('../pages/FilosofiePage'),
    () => import('../pages/GardensPage'),
    () => import('../pages/DataPage'),
    () => import('../pages/EyedentityPage'),
  ];
  // Kick off once the main thread is idle after the landing, then warm them
  // back-to-back with a yield between each (so all 5 are ready within ~1s instead
  // of waiting for a fresh idle callback per page, which gets starved while the
  // landing renders — leaving the first nav to evaluate an un-warmed chunk).
  scheduleIdleTask(async () => {
    for (const load of pages) {
      try { await Promise.resolve(load()); } catch (e) { /* ignore */ }
      await new Promise(r => setTimeout(r, 0)); // yield to the event loop
    }
  });
};
