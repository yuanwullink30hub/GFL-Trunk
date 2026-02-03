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
      () => import('../components/newFeature/HoloPyramid'),
      () => import('../components/newFeature/HoloCore'),
      () => import('../components/newFeature/HoloLabel'),
      () => import('../components/newFeature/PyramidView'),
      () => import('../components/newFeature/PyramidInner'),
      () => import('../components/newFeature/PyramidOverlay'),
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
 * Master preload function - loads everything in parallel
 * Returns a promise that resolves when critical resources are ready
 * @param {function} onProgress - Optional callback with progress (0-1)
 */
export const preloadAll = (onProgress) => {
  const tasks = [
    { name: 'webgl', fn: preWarmWebGL, weight: 1 },
    { name: 'three', fn: preloadThreeJS, weight: 2 },
    { name: 'components', fn: preloadComponents, weight: 3 },
    { name: 'images', fn: preloadImages, weight: 2 },
    { name: 'fonts', fn: preloadFonts, weight: 1 },
  ];
  
  const totalWeight = tasks.reduce((sum, t) => sum + t.weight, 0);
  let completedWeight = 0;
  
  const taskPromises = tasks.map(task => 
    task.fn().then(() => {
      completedWeight += task.weight;
      if (onProgress) {
        onProgress(completedWeight / totalWeight);
      }
    })
  );
  
  return Promise.all(taskPromises).then(() => {
    console.log('[Preload] All resources loaded');
  });
};

/**
 * Preload in background during idle time (non-blocking)
 * Use this for non-critical resources after initial load
 */
export const preloadInBackground = () => {
  scheduleIdleTask(() => {
    // Load any additional resources during idle time
    try {
      const imageContext = require.context('../images', true, /\.(png|jpg|jpeg|gif|webp)$/);
      imageContext.keys().forEach(path => {
        const img = new Image();
        img.src = imageContext(path);
      });
    } catch (error) {
      // Graceful fallback if images don't exist or can't be required
    }
  });
};
