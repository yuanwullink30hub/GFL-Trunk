import React, { Suspense, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { MotionPredictor } from '../../utils/MotionPredictor';
import PyramidInner from '../newFeature/PyramidInner';
import EarthParticleWaves from './EarthParticleWaves';

// --- Custom Shader Material for the Holographic Surface ---
// Simplified - no more chunk explosion, just fade out when exploding
const HolographicShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uExplode: { value: 0 },
    uColorCore: { value: new THREE.Color('#0d0618') },   
    uColorLand: { value: new THREE.Color('#4a1d66') },   
    uColorRim: { value: new THREE.Color('#1a0320') },    // Dark Purple Glow
    uColorBorder: { value: new THREE.Color('#FFD700') }, // Bright Gold
    uColorBorderDark: { value: new THREE.Color('#2c290e') }, // Dark Brown for post-frame 9
    uMap: { value: null }, 
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;
    varying float vFragExplode;
    varying float vChunkId;
    varying float vChunkScale;

    uniform float uExplode;
    uniform float uTime;

    // Hash function for chunk randomization
    vec3 hash33(vec3 p) {
      p = fract(p * vec3(.1031, .1030, .0973));
      p += dot(p, p.yxz + 33.33);
      return fract((p.xxy + p.yxx) * p.zyx);
    }

    // Voronoi for chunk generation - with dynamic frequency
    vec4 voronoi(in vec3 x, float freq) {
      vec3 scaledX = x * freq;
      vec3 n = floor(scaledX);
      vec3 f = fract(scaledX);
      float m_dist = 100.0;
      vec3 m_center = vec3(0.0);
      for(int k=-1; k<=1; k++)
      for(int j=-1; j<=1; j++)
      for(int i=-1; i<=1; i++) {
        vec3 g = vec3(float(i),float(j),float(k));
        vec3 p = hash33(n + g);
        vec3 diff = g + p - f;
        float d = dot(diff, diff);
        if(d < m_dist) {
          m_dist = d;
          m_center = n + g + p;
        }
      }
      return vec4(m_dist, m_center);
    }

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vFragExplode = uExplode;
      
      vec3 finalPos = position;
      
      if (uExplode > 0.0) {
        // Normalized explosion progress (0-1)
        float normalizedExp = uExplode / 25.0;
        
        // === PROGRESSIVE CHUNK BREAKING ===
        // Chunks shatter into tiny pieces very quickly
        // Start with medium chunks (freq 2.5), rapidly break into tiny fragments (freq 12.0)
        float baseFreq = 2.5;
        float maxFreq = 12.0;
        // Fast exponential-like transition - by frame 10 (0.22) already at high freq
        float freqProgress = smoothstep(0.0, 0.2, normalizedExp) * 0.7 + smoothstep(0.1, 0.35, normalizedExp) * 0.3;
        float frequency = baseFreq + (maxFreq - baseFreq) * freqProgress;
        
        // Create chunks using Voronoi with dynamic frequency
        vec4 cell = voronoi(position, frequency);
        vec3 cellCenter = cell.yzw / frequency; // Unscale center
        
        // Random properties per chunk
        vec3 cellHash = hash33(cellCenter * frequency);
        float randomFactor = cellHash.x;
        vChunkId = randomFactor;
        
        // === CHUNK SHRINKING ===
        // Chunks shrink rapidly towards their center as they shatter
        float shrinkStart = 0.05;
        float shrinkEnd = 0.3;
        float shrinkProgress = smoothstep(shrinkStart, shrinkEnd, normalizedExp);
        
        // Calculate chunk scale - shrink to ~4x particle size very quickly
        // By frame 10 (~0.22) chunks should be tiny (about 4x particle size)
        vChunkScale = 1.0 - shrinkProgress * 0.95; // Shrink to 5% original size (nearly particle-sized)
        
        // Pull vertices toward chunk center
        vec3 toChunkCenter = cellCenter - position;
        finalPos = position + toChunkCenter * (1.0 - vChunkScale);
        
        // Explosion direction - radial with some randomness
        vec3 explosionDir = normalize(cellCenter + (cellHash - 0.5) * 0.4);
        
        // Tangent for tumbling motion
        vec3 tangent = cross(explosionDir, vec3(0.0, 1.0, 0.0));
        if (length(tangent) < 0.1) tangent = cross(explosionDir, vec3(1.0, 0.0, 0.0));
        tangent = normalize(tangent);
        vec3 bitangent = cross(tangent, explosionDir);
        
        // Speed variation per chunk
        float speed = 0.6 + randomFactor * 1.5;
        float dist = uExplode * speed;
        
        // Main outward movement
        finalPos += explosionDir * dist;
        
        // Tumbling/rotation motion (intensifies as chunks get smaller)
        float tumbleIntensity = 1.0 + shrinkProgress * 2.0;
        float rotation = cellHash.y * 15.0;
        float tangentialMove = sin(uExplode * (0.3 + randomFactor * 0.4) + rotation) * (dist * 0.12 * tumbleIntensity);
        float bitangentialMove = cos(uExplode * (0.2 + randomFactor * 0.3) + cellHash.z * 12.0) * (dist * 0.1 * tumbleIntensity);
        finalPos += tangent * tangentialMove;
        finalPos += bitangent * bitangentialMove;
        
        // Surface cracking/deformation (increases with breakage)
        float crackIntensity = 1.0 + shrinkProgress * 3.0;
        float deform = sin(position.x * 4.0 * crackIntensity + uExplode * 1.5) * cos(position.y * 4.0 * crackIntensity + uExplode);
        finalPos += normalize(position) * deform * uExplode * 0.08;
        
        // Add jitter as chunks get very small (particle-like)
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
    uniform vec3 uColorRim;
    uniform vec3 uColorBorder;
    uniform vec3 uColorBorderDark;
    uniform sampler2D uMap;

    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;
    varying float vFragExplode;
    varying float vChunkId;
    varying float vChunkScale;

    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    void main() {
      vec3 N = normalize(vNormal);
      vec3 V = normalize(cameraPosition - vPosition);
      
      float fresnel = pow(1.0 - abs(dot(V, N)), 2.0);

      vec4 texColor = texture2D(uMap, vUv);
      float mapValue = texColor.r;
      float continent = smoothstep(0.40, 0.60, mapValue);
      
      vec3 color = uColorCore * 0.4; 
      color = mix(color, uColorLand * 1.2, continent);

      // THICKER BORDER LOGIC
      float border = smoothstep(0.3, 0.45, mapValue) * (1.0 - smoothstep(0.55, 0.7, mapValue));
      
      // Normalize explosion value (uExplode goes 0-25, normalize to 0-1)
      float normalizedExplosion = uExplode / 25.0;
      
      // Before frame 9: gold border, After: dark brown
      bool isAfterFrame9 = normalizedExplosion > 0.2;
      vec3 borderColor = isAfterFrame9 ? uColorBorderDark : uColorBorder;
      float borderIntensity = isAfterFrame9 ? 1.0 : 2.5;
      color += borderColor * border * borderIntensity;

      color += uColorRim * fresnel * 1.5;

      if (!gl_FrontFacing) {
         color *= 0.5; 
         color += uColorRim * fresnel * 0.8;
      } else {
         color *= 1.1;
      }

      float scanline = sin(gl_FragCoord.y * 0.15 - uTime * 2.0) * 0.1 + 0.9;
      color *= scanline;
      
      float flicker = 1.0 - 0.03 * random(vec2(floor(uTime * 20.0), 0.0));
      color *= flicker;
      
      // Per-chunk color variation during explosion
      if (vFragExplode > 0.0) {
        float chunkBrightness = mix(0.9, 1.0, vChunkId);
        color *= chunkBrightness;
        
        // Smooth color transition to dimmer tones as chunks fade
        float brownTransition = smoothstep(0.15, 0.4, normalizedExplosion);
        vec3 tintColor = mix(uColorBorder, uColorBorderDark, brownTransition);
        color = mix(color, color + tintColor * 0.2, vChunkId * normalizedExplosion);
        
        // === GRADUAL BRIGHTNESS REDUCTION ===
        // Start dimming earlier for smoother transition at frame 23
        float dimStart = 0.22;  // ~frame 10
        float dimEnd = 0.45;    // ~frame 20
        float brightnessReduction = smoothstep(dimStart, dimEnd, normalizedExplosion);
        
        // Reduce brightness gradually (1.0 -> 0.05) - more aggressive fade
        float brightnessMult = mix(1.0, 0.05, brightnessReduction);
        color *= brightnessMult;
        
        // Also reduce gold/border intensity specifically
        float goldFade = smoothstep(dimStart - 0.05, dimEnd - 0.1, normalizedExplosion);
        color = mix(color, color * vec3(0.4, 0.3, 0.5), goldFade * border);
        
        // Remove purple glow - it creates bright center at frame 23
        // float smallChunkGlow = (1.0 - vChunkScale) * 0.3 * (1.0 - brightnessReduction);
        // color += vec3(0.3, 0.0, 0.6) * smallChunkGlow;
      }

      // Landmass opacity
      float landmassOpacity = (1.0 - continent) * 0.5;
      float alpha = 0.2 + landmassOpacity + (fresnel * 0.6);
      
      // === SMOOTH CHUNK FADE OUT ===
      // Multi-stage opacity transition for smooth chunk-to-particle handoff
      
      // Determine if chunk is on backside (facing away from camera)
      // dot(V, N) < 0 means backside
      float facingCamera = dot(V, N);
      float isBackside = smoothstep(0.1, -0.3, facingCamera); // 1.0 for backside, 0.0 for frontside
      
      // Backside chunks get delayed fade (extra 0.15 normalized time = ~7 frames)
      float backsideDelay = isBackside * 0.15;
      
      // Stage 1: Start fading early based on chunk shrink (more aggressive)
      float shrinkFade = smoothstep(0.1, 0.4, vChunkScale);
      
      // Stage 2: Per-chunk staggered fade - backside gets delayed
      float staggerOffset = vChunkId * 0.06;
      float fadeStart = 0.06 + staggerOffset + backsideDelay;
      float fadeEnd = 0.28 + staggerOffset + backsideDelay;
      float staggeredFade = 1.0 - smoothstep(fadeStart, fadeEnd, normalizedExplosion);
      
      // Stage 3: Hard cutoff - backside chunks get more time
      float cutoffStart = 0.28 + backsideDelay;
      float cutoffEnd = 0.42 + backsideDelay; // Extended from 0.38 for backside
      float hardCutoff = 1.0 - smoothstep(cutoffStart, cutoffEnd, normalizedExplosion);
      
      // Combine all fades with smooth blending
      float combinedChunkFade = shrinkFade * staggeredFade * hardCutoff;
      
      // Distance-based fade
      float distToCamera = distance(cameraPosition, vPosition);
      float proximityFade = smoothstep(2.0, 5.0, distToCamera);
      
      // Edge fade for softer silhouette
      float edgeSoftness = 1.0 - pow(1.0 - abs(dot(V, N)), 4.0) * normalizedExplosion;
      
      alpha *= combinedChunkFade * proximityFade * edgeSoftness;

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
      
      // Only disable depth test during smokescreen phase
      const inSmokescreenPhase = explosionProgress > 0.1 && explosionProgress < 0.32;
      material.depthTest = !inSmokescreenPhase;
      
      // Transition colors from orbital to explosion view
      // Orbital: brighter, Explosion: darker
      const orbitalCore = new THREE.Color('#0d0618');
      const explosionCore = new THREE.Color('#050310');
      const orbitalLand = new THREE.Color('#4a1d66');
      const explosionLand = new THREE.Color('#2d0f3d');
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
        const zoomY = 0.25 - (1.75 * explosionProgress); // ends at y=-1.5
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
  const earthRenderOrder = explosionProgress > 0.1 && explosionProgress < 0.32 ? 5 : 0;

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

      {/* Outer Holographic Crust - renders in front of pyramid during explosion */}
      <Sphere 
        ref={groupRef} 
        args={[2.5, 128, 128]} 
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerMove={handlePointerMove}
        renderOrder={earthRenderOrder}
      >
        <primitive object={material} attach="material" />
      </Sphere>

      {/* Earth Particle Waves - wave-like particle motion (aistudios style) */}
      {/* Particles fade in as chunks shrink and break apart */}
      {explosionProgress > 0 && (
        <EarthParticleWaves 
          explosionProgress={explosionProgress} 
          sphereRadius={2.5}
        />
      )}

      {/* Atmospheric Glow - hidden after frame 15 */}
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
        pointerEvents: exploding ? 'none' : 'auto'
      }}
    >
      <Canvas 
        camera={{ position: [0, 0, 8], fov: 40 }}
        gl={{ 
          alpha: true, 
          antialias: true,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: false,
          depth: true,
          stencil: false
        }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={1.5} color="#FFD700" />
          <pointLight position={[-10, -10, -10]} intensity={1} color="#360642" />
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
