import React, { Suspense, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { MotionPredictor } from '../../utils/MotionPredictor';
import { getPerformanceSettings } from '../../utils/performanceMonitor';
import PyramidInner from '../newFeature/PyramidInner';
import EarthParticleWaves from './EarthParticleWaves';

// --- Pre-computed chunk data generator ---
// Generates chunk assignments once at geometry creation time
const generateChunkData = (geometry, frequency = 6.0) => {
  const positions = geometry.attributes.position.array;
  const vertexCount = positions.length / 3;
  
  // Pre-allocate typed arrays for performance
  const chunkIds = new Float32Array(vertexCount);
  const chunkCenters = new Float32Array(vertexCount * 3);
  const chunkHashes = new Float32Array(vertexCount * 3);
  
  // Simple hash function (same as shader)
  const hash33 = (x, y, z) => {
    let px = (x * 0.1031) % 1;
    let py = (y * 0.1030) % 1;
    let pz = (z * 0.0973) % 1;
    const dot = px * py + py * pz + pz * px + 33.33;
    px = (px + dot) % 1;
    py = (py + dot) % 1;
    pz = (pz + dot) % 1;
    return [
      Math.abs(((px + py) * pz) % 1),
      Math.abs(((py + pz) * px) % 1),
      Math.abs(((pz + px) * py) % 1)
    ];
  };
  
  for (let i = 0; i < vertexCount; i++) {
    const x = positions[i * 3] * frequency;
    const y = positions[i * 3 + 1] * frequency;
    const z = positions[i * 3 + 2] * frequency;
    
    // Floor to get cell coordinates
    const nx = Math.floor(x);
    const ny = Math.floor(y);
    const nz = Math.floor(z);
    
    // Fractional part
    const fx = x - nx;
    const fy = y - ny;
    const fz = z - nz;
    
    // Find nearest Voronoi center (simplified - just check 8 corners)
    let minDist = 100.0;
    let centerX = 0, centerY = 0, centerZ = 0;
    
    for (let dk = 0; dk <= 1; dk++) {
      for (let dj = 0; dj <= 1; dj++) {
        for (let di = 0; di <= 1; di++) {
          const gx = di, gy = dj, gz = dk;
          const [px, py, pz] = hash33(nx + gx, ny + gy, nz + gz);
          const diffX = gx + px - fx;
          const diffY = gy + py - fy;
          const diffZ = gz + pz - fz;
          const d = diffX * diffX + diffY * diffY + diffZ * diffZ;
          if (d < minDist) {
            minDist = d;
            centerX = (nx + gx + px) / frequency;
            centerY = (ny + gy + py) / frequency;
            centerZ = (nz + gz + pz) / frequency;
          }
        }
      }
    }
    
    // Store chunk center
    chunkCenters[i * 3] = centerX;
    chunkCenters[i * 3 + 1] = centerY;
    chunkCenters[i * 3 + 2] = centerZ;
    
    // Generate hash for this chunk center
    const [hx, hy, hz] = hash33(centerX * frequency, centerY * frequency, centerZ * frequency);
    chunkHashes[i * 3] = hx;
    chunkHashes[i * 3 + 1] = hy;
    chunkHashes[i * 3 + 2] = hz;
    
    // ChunkId is just the x component of hash
    chunkIds[i] = hx;
  }
  
  return { chunkIds, chunkCenters, chunkHashes };
};

// --- Custom Shader Material for the Holographic Surface ---
// OPTIMIZED: Uses pre-computed chunk data instead of per-frame Voronoi
const HolographicShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uExplode: { value: 0 },
    uChunkFade: { value: 1.0 }, // Smooth fade for chunks (1.0 = fully visible, 0.0 = hidden)
    uColorCore: { value: new THREE.Color('#0d0618') },   
    uColorLand: { value: new THREE.Color('#6b1d8f') },   // Vibrant magenta-purple
    uColorLandDeep: { value: new THREE.Color('#3d0a5c') }, // Deep purple for later frames
    uColorRim: { value: new THREE.Color('#1a0320') },    // Dark Purple Glow
    uColorBorder: { value: new THREE.Color('#FFD700') }, // Bright Gold
    uColorBorderDark: { value: new THREE.Color('#2c290e') }, // Dark Brown for post-frame 9
    uMap: { value: null },
  },
  vertexShader: `
    attribute float aChunkId;
    attribute vec3 aChunkCenter;
    attribute vec3 aChunkHash;
    
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;
    varying float vFragExplode;
    varying float vChunkId;
    varying float vChunkScale;
    varying float vNormalizedExp;

    uniform float uExplode;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vFragExplode = uExplode;
      
      vec3 finalPos = position;
      
      if (uExplode > 0.0) {
        // Normalized explosion progress (0-1)
        float normalizedExp = uExplode / 25.0;
        vNormalizedExp = normalizedExp;
        
        // Use pre-computed chunk data (NO MORE VORONOI!)
        vec3 cellCenter = aChunkCenter;
        vec3 cellHash = aChunkHash;
        float randomFactor = aChunkId;
        vChunkId = randomFactor;
        
        // === CHUNK SHRINKING ===
        // During fade period (frames 19-24, normExp 0.19-0.32), keep chunks at full size
        // so they can fade smoothly via opacity. Resume shrinking after frame 24.
        float shrinkProgress;
        if (normalizedExp >= 0.19 && normalizedExp <= 0.32) {
          // Keep at full size during fade (frames 19-24)
          shrinkProgress = 0.0;
        } else if (normalizedExp > 0.32) {
          // Resume shrinking after frame 24
          shrinkProgress = smoothstep(0.32, 0.5, normalizedExp);
        } else {
          // Normal shrinking before frame 19
          shrinkProgress = smoothstep(0.05, 0.3, normalizedExp);
        }
        vChunkScale = 1.0 - shrinkProgress * 0.95;
        
        // Pull vertices toward chunk center
        vec3 toChunkCenter = cellCenter - position;
        finalPos = position + toChunkCenter * (1.0 - vChunkScale);
        
        // Explosion direction - radial with some randomness
        vec3 explosionDir = normalize(cellCenter + (cellHash - 0.5) * 0.4);
        
        // Tangent for tumbling motion (simplified)
        vec3 tangent = normalize(cross(explosionDir, vec3(0.0, 1.0, 0.0)));
        
        // Speed variation per chunk
        float speed = 0.6 + randomFactor * 1.5;
        float dist = uExplode * speed;
        
        // Main outward movement
        finalPos += explosionDir * dist;
        
        // Tumbling/rotation motion (simplified)
        float tumbleIntensity = 1.0 + shrinkProgress * 2.0;
        float tangentialMove = sin(uExplode * (0.3 + randomFactor * 0.4) + cellHash.y * 15.0) * (dist * 0.12 * tumbleIntensity);
        finalPos += tangent * tangentialMove;
        
        // Surface cracking (disabled after frame 12)
        if (uExplode <= 3.0) {
          float crackIntensity = 1.0 + shrinkProgress * 3.0;
          float deform = sin(position.x * 4.0 * crackIntensity + uExplode * 1.5) * cos(position.y * 4.0 * crackIntensity + uExplode);
          finalPos += normalize(position) * deform * uExplode * 0.08;
        }
        
        // Add jitter as chunks get very small
        float jitter = shrinkProgress * 0.3;
        finalPos += (cellHash - 0.5) * jitter * uExplode * 0.1;
        
      } else {
        vChunkId = 0.0;
        vChunkScale = 1.0;
      }

      vPosition = (modelMatrix * vec4(finalPos, 1.0)).xyz; 
      gl_Position = projectionMatrix * viewMatrix * vec4(vPosition, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform float uExplode;
    uniform vec3 uColorCore;
    uniform vec3 uColorLand;
    uniform vec3 uColorLandDeep;
    uniform vec3 uColorRim;
    uniform vec3 uColorBorder;
    uniform vec3 uColorBorderDark;
    uniform sampler2D uMap;
    uniform float uChunkFade;

    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;
    varying float vFragExplode;
    varying float vChunkId;
    varying float vChunkScale;
    varying float vNormalizedExp;

    void main() {
      vec3 N = normalize(vNormal);
      vec3 V = normalize(cameraPosition - vPosition);
      float VdotN = dot(V, N);
      
      // Pre-compute normalized explosion once
      float normExp = uExplode * 0.04; // 1/25 = 0.04
      
      // Fresnel (simplified)
      float fresnel = pow(1.0 - abs(VdotN), 2.0);

      vec4 texColor = texture2D(uMap, vUv);
      float mapValue = texColor.r;
      
      // Combined continent and border calculation
      float continent = smoothstep(0.40, 0.60, mapValue);
      float border = smoothstep(0.3, 0.45, mapValue) * (1.0 - smoothstep(0.55, 0.7, mapValue));
      
      // Landmass color gradient - vibrant magenta/purple transitioning to deep purple
      // Matches particle color progression (bright early, deeper as explosion continues)
      float landColorBlend = smoothstep(0.1, 0.4, normExp);
      vec3 landColor = mix(uColorLand, uColorLandDeep, landColorBlend);
      
      // Base color
      vec3 color = mix(uColorCore * 0.4, landColor * 1.2, continent);
      
      // Border color - smooth transition from gold to dark brown over frames 20-24
      // Frame 20: normExp ≈ 0.19 (gold), Frame 24: normExp ≈ 0.32 (dark brown)
      float borderFade = smoothstep(0.19, 0.32, normExp);
      vec3 borderColor = mix(uColorBorder, uColorBorderDark, borderFade);
      float borderIntensity = mix(2.5, 1.0, borderFade);
      color += borderColor * border * borderIntensity;

      // Rim lighting
      color += uColorRim * fresnel * 1.5;

      // Front/back face handling
      float faceMult = gl_FrontFacing ? 1.1 : 0.5;
      color *= faceMult;
      if (!gl_FrontFacing) color += uColorRim * fresnel * 0.8;

      // Scanline effect (simplified - less frequent sin)
      float scanline = 0.9 + sin(gl_FragCoord.y * 0.15 - uTime * 2.0) * 0.1;
      color *= scanline;
      
      // Per-chunk effects during explosion
      if (vFragExplode > 0.0) {
        // Brightness reduction
        float brightnessReduction = smoothstep(0.22, 0.45, normExp);
        color *= mix(1.0, 0.05, brightnessReduction) * mix(0.9, 1.0, vChunkId);
      }

      // Alpha calculation (simplified)
      float alpha = 0.2 + (1.0 - continent) * 0.5 + fresnel * 0.6;
      
      // Chunk fade during explosion
      if (normExp > 0.0) {
        // During frames 19-24 (0.19-0.32), disable shrinkFade to allow smooth opacity fade
        float shrinkFade = (vNormalizedExp >= 0.19 && vNormalizedExp <= 0.32) ? 1.0 : smoothstep(0.1, 0.4, vChunkScale);
        
        // Apply smooth chunk fade uniform (controlled externally for frames 20-24)
        // This is the primary fade control for chunk disappearance
        alpha *= shrinkFade * uChunkFade;
        alpha *= smoothstep(2.0, 5.0, distance(cameraPosition, vPosition));
      }

      gl_FragColor = vec4(color, alpha);
    }
  `
};

const HoloEarthSphere = ({ 
  exploding, 
  explosionProgress = 0, 
  isActive = false, 
  pyramidScrollProgress = 0,
  showPyramidLabels = false,
  onIntroComplete = () => {},
  onLayerStateChange = () => {},
  isMobile = false
}) => {
  const groupRef = useRef(null);
  const coreRef = useRef(null);
  const { viewport } = useThree();
  const isDragging = useRef(false);
  const previousMouse = useRef({ x: 0, y: 0 });
  const rotationVelocity = useRef({ x: 0, y: 0 });
  const motionPredictor = useRef(new MotionPredictor());
  
  // Track orbital rotation to pass to PyramidInner when in orbital mode (button invisible)
  const orbitalRotationY = useRef(0);
  
  const earthMap = useLoader(
    THREE.TextureLoader, 
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg'
  );

  // Scale: base scale with mobile multiplier for larger earth on mobile
  const baseScale = Math.min(1, viewport.width / 5.5) * 0.65;
  const scale = isMobile ? baseScale * 1.15 : baseScale;

  // Pre-compute geometry with chunk data baked in (PERFORMANCE OPTIMIZATION)
  const sphereGeometry = useMemo(() => {
    const performanceSettings = getPerformanceSettings();
    const segments = performanceSettings.tier === 'LOW' ? 32 : 128;
    
    const geometry = new THREE.SphereGeometry(2.5, segments, segments);
    
    // Generate and attach pre-computed chunk data
    const { chunkIds, chunkCenters, chunkHashes } = generateChunkData(geometry, 6.0);
    geometry.setAttribute('aChunkId', new THREE.BufferAttribute(chunkIds, 1));
    geometry.setAttribute('aChunkCenter', new THREE.BufferAttribute(chunkCenters, 3));
    geometry.setAttribute('aChunkHash', new THREE.BufferAttribute(chunkHashes, 3));
    
    return geometry;
  }, []);

  const material = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(HolographicShaderMaterial.uniforms),
      vertexShader: HolographicShaderMaterial.vertexShader,
      fragmentShader: HolographicShaderMaterial.fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false, // Render on top of pyramid during explosion
    });
    
    return mat;
  }, []);

  useEffect(() => {
    if (material) {
      material.uniforms.uMap.value = earthMap;
    }
  }, [earthMap, material]);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = -2.4; 
      groupRef.current.rotation.x = 0.25;
    }
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    
    if (material) {
      material.uniforms.uTime.value = time;

      // Use explosionProgress directly instead of time-based animation
      // explosionProgress goes from 0 to 1
      const targetExplode = 25.0; // Maximum explosion distance
      material.uniforms.uExplode.value = targetExplode * explosionProgress;
      
      // Smooth chunk fade between frames 20-24
      // Frame 20: explosionProgress ≈ 0.19, Frame 24: explosionProgress ≈ 0.32
      // Fade from 1.0 (fully visible) to 0.0 (hidden)
      const chunkFade = explosionProgress < 0.19 ? 1.0 :
                        explosionProgress > 0.32 ? 0.0 :
                        1.0 - ((explosionProgress - 0.19) / (0.32 - 0.19));
      material.uniforms.uChunkFade.value = chunkFade;
      
      // Only disable depth test during smokescreen phase (after frame 22)
      // Frames 20-24: normal depth test enabled so fading chunks render correctly
      const inSmokescreenPhase = explosionProgress > 0.25;
      material.depthTest = !inSmokescreenPhase;
      
      // Transition colors from orbital to explosion view
      // Orbital: brighter magenta-purple, Explosion: darker purple
      const orbitalCore = new THREE.Color('#0d0618');
      const explosionCore = new THREE.Color('#050310');
      const orbitalLand = new THREE.Color('#6b1d8f');   // Vibrant magenta-purple
      const explosionLand = new THREE.Color('#3d0a5c'); // Deep purple
      const orbitalRim = new THREE.Color('#1a0320');
      const explosionRim = new THREE.Color('#0a0110');
      
      // Frame 15 threshold: vFragExplode > 0.4, hide purple shadows after
      const fadeOutRim = explosionProgress > 0.4 ? 0 : new THREE.Color('#1a0320');
      
      // Lerp between colors based on explosion progress
      const currentCore = orbitalCore.clone().lerp(explosionCore, explosionProgress);
      const currentLand = orbitalLand.clone().lerp(explosionLand, explosionProgress);
      const currentRim = typeof fadeOutRim === 'number' ? new THREE.Color('#0a0110') : orbitalRim.clone().lerp(explosionRim, explosionProgress);
      
      material.uniforms.uColorCore.value = currentCore;
      material.uniforms.uColorLand.value = currentLand;
      material.uniforms.uColorLandDeep.value = explosionLand;
      material.uniforms.uColorRim.value = currentRim;
    }
    
    const momentumMagnitude = Math.abs(rotationVelocity.current.x) + Math.abs(rotationVelocity.current.y);
    
    if (coreRef.current) {
        coreRef.current.rotation.y += 0.0014;
        coreRef.current.rotation.x = Math.sin(time * 0.35) * 0.1;
        
        // Position based on explosionProgress instead of time-based animation
        // z: zoom from 0 to 4.5 (towards camera)
        // y: move from 0.25 down to -1.5 
        const zoomZ = 4.5 * explosionProgress;
        
        // Device-specific Y offset for pyramid endpoint
        // Desktop: 3rem up - 1rem down = 2rem up (+0.27)
        // Laptop: 3rem up - 1rem down = 2rem up (+0.27)
        // Tablet: 2.5rem up - 1rem down = 1.5rem up (+0.22)
        const pyramidYOffset = window.innerWidth >= 1280 ? 0.27 : // Desktop: 2rem up
                               window.innerWidth >= 1100 ? 0.27 : // Laptop: 2rem up
                               window.innerWidth >= 768 ? 0.22 : // Tablet: 1.5rem up
                               0; // Mobile
        
        const zoomY = 0.25 - (1.75 * explosionProgress) + (pyramidYOffset * explosionProgress);
        coreRef.current.position.z = zoomZ;
        coreRef.current.position.y = zoomY;
    }

    if (groupRef.current) {
        if (!exploding) {
            if (!isDragging.current) {
                rotationVelocity.current.x *= 0.95;
                rotationVelocity.current.y *= 0.95;
                groupRef.current.rotation.x += rotationVelocity.current.y;
                groupRef.current.rotation.y += rotationVelocity.current.x;
                if (momentumMagnitude < 0.0001) {
                    groupRef.current.rotation.y += 0.0014;
                }
            }
            groupRef.current.rotation.x = Math.max(-0.5, Math.min(0.5, groupRef.current.rotation.x));
        } else {
            groupRef.current.rotation.y += 0.00035; 
        }
        // Track orbital rotation for pyramid sync
        orbitalRotationY.current = groupRef.current.rotation.y;
    }
  });

  const handlePointerDown = (e) => {
    if (exploding) return;
    e.stopPropagation();
    isDragging.current = true;
    previousMouse.current = { x: e.clientX, y: e.clientY };
    document.body.style.cursor = 'grabbing';
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    document.body.style.cursor = 'auto';
  };

  const handlePointerMove = (e) => {
    if (exploding || !isDragging.current || !groupRef.current) return;
    const deltaX = (e.clientX - previousMouse.current.x) * 0.005;
    const deltaY = (e.clientY - previousMouse.current.y) * 0.005;
    groupRef.current.rotation.y += deltaX;
    groupRef.current.rotation.x += deltaY;
    const motion = motionPredictor.current.updateMotion({ x: deltaX, y: deltaY }, 16);
    rotationVelocity.current = { x: motion.velocity.x, y: motion.velocity.y };
    previousMouse.current = { x: e.clientX, y: e.clientY };
  };

  // Calculate render order for earth surface chunks - should be in front of pyramid during explosion smokescreen only
  // Smokescreen phase: after frame 22 (explosionProgress > 0.25)
  // Frames 14-22: normal depth rendering - particles behind pyramid not visible
  const earthRenderOrder = explosionProgress > 0.25 && explosionProgress < 0.35 ? 5 : 0;

  // Mobile: move down 3rem (convert rem to world units via viewport ratio)
  // 3rem ≈ 48px at 16px base, convert to world units using viewport height ratio
  const mobileYOffset = isMobile ? -(3 * 16 * viewport.height / window.innerHeight) : 0;
  const baseY = 0.45 + mobileYOffset;

  return (
    <group position={[0, baseY, 0]} scale={scale}>
      
      {/* Inner Core: PyramidInner replaces the cone */}
      <group ref={coreRef} position={[0, 0.35, 0]}>
        <PyramidInner 
          isActive={isActive}
          scrollProgress={pyramidScrollProgress}
          showLabels={showPyramidLabels}
          orbitalRotationY={orbitalRotationY}
          explosionProgress={explosionProgress}
          onIntroComplete={onIntroComplete}
          onLayerStateChange={onLayerStateChange}
        />
      </group>

      {/* Outer Holographic Crust - uses pre-computed chunk geometry */}
      <mesh 
        ref={groupRef} 
        geometry={sphereGeometry}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerMove={handlePointerMove}
        renderOrder={earthRenderOrder}
      >
        <primitive object={material} attach="material" />
      </mesh>

      {/* Earth Particle Waves - wave-like particle motion (aistudios style) */}
      {/* Particles fade in as chunks shrink and break apart */}
      {/* Disabled on low-end devices for better performance */}
      {explosionProgress > 0 && getPerformanceSettings().tier !== 'LOW' && (
        <EarthParticleWaves 
          explosionProgress={explosionProgress} 
          sphereRadius={2.5}
        />
      )}

      {/* Atmospheric Glow - hidden after frame 15, disabled on low-end for performance */}
      {getPerformanceSettings().tier !== 'LOW' && (
        <Sphere args={[3.2, 32, 32]}>
          <shaderMaterial
            transparent={true}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            uniforms={{
              uColor: { value: new THREE.Color('#360642') }, 
              uIntensity: { value: explosionProgress > 0.4 ? 0 : 0.05 }
            }}
            vertexShader={`
              varying vec3 vNormal;
              void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `}
            fragmentShader={`
              uniform vec3 uColor;
              uniform float uIntensity;
              varying vec3 vNormal;
              void main() {
                float intensity = pow(0.85 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 6.0);
                gl_FragColor = vec4(uColor, intensity * uIntensity);
              }
            `}
          />
        </Sphere>
      )}
    </group>
  );
};

const HoloEarth = ({
  className, 
  style, 
  exploding = false, 
  explosionProgress = 0, 
  isMobile = false,
  isActive = false,
  pyramidScrollProgress = 0,
  showPyramidLabels = false,
  onIntroComplete = () => {},
  onLayerStateChange = () => {}
}) => {
  return (
    <div 
      className={`absolute inset-0 ${className || ''}`}
      style={{
        ...style,
        pointerEvents: exploding ? 'none' : 'auto',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      <Canvas 
        camera={{ position: [0, 0, 8], fov: 40 }}
        style={{ width: '100%', height: '100%', display: 'block' }}
        gl={{ 
          alpha: true, 
          antialias: false,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: false,
          depth: true,
          stencil: false,
          precision: 'mediump',
        }}
        dpr={1}
        performance={{ min: 0.5, max: 1, debounce: 200 }}
        onCreated={(state) => {
          // Force canvas size on creation
          const width = window.innerWidth;
          const height = window.innerHeight;
          state.gl.setSize(width, height);
          state.camera.aspect = width / height;
          state.camera.updateProjectionMatrix();
        }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={1.5} color="#FFD700" />
          {getPerformanceSettings().tier !== 'LOW' && <pointLight position={[-10, -10, -10]} intensity={1} color="#360642" />}
          <HoloEarthSphere 
            exploding={exploding} 
            explosionProgress={explosionProgress}
            isActive={isActive}
            pyramidScrollProgress={pyramidScrollProgress}
            showPyramidLabels={showPyramidLabels}
            onIntroComplete={onIntroComplete}
            onLayerStateChange={onLayerStateChange}
            isMobile={isMobile}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default React.memo(HoloEarth);
