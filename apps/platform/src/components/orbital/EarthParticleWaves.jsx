import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { isIntegratedGPU } from '@gfl/utils';

/**
 * Earth Particle Waves System
 * 
 * Based on aistudios particle animation - creates wave-like particle motion
 * that emerges from the exploding earth chunks.
 * 
 * Particles use the earth texture to determine colors:
 * - Purple for land areas
 * - Gold for coastline/borders
 * - Faint purple for ocean areas
 * 
 * The animation flow:
 * 1. Particles start hidden
 * 2. As chunks explode and shrink (0.15-0.5 progress), particles fade in
 * 3. Particles follow chunk positions initially, then transition to wave motion
 * 4. In final pyramid section, particles continue wave motion in background
 */
const EarthParticleWaves = ({ 
  explosionProgressRef,
  explosionProgress = 0, 
  sphereRadius = 2.5,
  fadeValue = 1.0,
}) => {
  const pointsRef = useRef();
  const materialRef = useRef();
  
  // Load the same earth texture for color mapping
  const earthMap = useLoader(
    THREE.TextureLoader, 
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg'
  );
  
  useEffect(() => {
    if (earthMap) {
      earthMap.minFilter = THREE.LinearFilter;
      earthMap.magFilter = THREE.LinearFilter;
    }
  }, [earthMap]);
  
  // Desktop/dedicated GPU: full 128×64 (8320 verts), Integrated GPU: 52×26 (1378 verts, -60%)
  const isLowGpu = typeof window !== 'undefined' && isIntegratedGPU();
  const geometry = useMemo(() => {
    return new THREE.SphereGeometry(sphereRadius, isLowGpu ? 52 : 128, isLowGpu ? 26 : 64);
  }, [sphereRadius, isLowGpu]);
  
  // Shader material based on attached aistudios code
  // OPTIMIZED: Reduced calculations, simplified wave function
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uExplode: { value: 0 },
        uMap: { value: null },
        uTransitionStart: { value: 0.007 }, // When particles start appearing (frame 9)
        uTransitionEnd: { value: 0.35 },   // When chunks fully gone
        uFade: { value: 1.0 },             // JS-driven fade matching chunk fadePoints schedule
      },
      vertexShader: `
        uniform float uTime;
        uniform float uExplode;
        uniform float uTransitionStart;
        uniform float uTransitionEnd;
        uniform float uFade;
        uniform sampler2D uMap;
        
        varying vec3 vColor;
        varying float vAlpha;
        varying float vCalmFactor;

        void main() {
          vec3 pos = position;

          // Sample map intensity for coloring
          vec4 mapColor = texture2D(uMap, uv);
          float landIntensity = mapColor.r; 
          
          // --- COLOR DEFINITIONS ---
          vec3 colorPurple = vec3(0.5, 0.0, 1.0);
          vec3 colorGold = vec3(1.0, 0.8, 0.1);
          vec3 colorOcean = vec3(0.2, 0.05, 0.4);
          vec3 colorDimPurple = vec3(0.3, 0.0, 0.5);

          // Pre-compute normalized explosion once
          float normExp = uExplode * 0.04; // 1/25
          
          // Particle visibility
          float particleVisibility = smoothstep(uTransitionStart, uTransitionStart + 0.12, normExp);
          
          // Calm factor - reduces movement over time
          float calmFactor = smoothstep(0.35, 0.85, normExp);
          vCalmFactor = calmFactor;

          if (uExplode > 0.0) {
              // === RADIAL SPREAD - particles separate from each other ===
              vec3 radialDir = normalize(position);
              float spreadFactor = uExplode * 0.04; // Smooth spread factor
              pos = position + radialDir * spreadFactor;
              
              // === SIMPLIFIED WAVE DISPLACEMENT ===
              float waveSpeed = mix(0.8, 0.15, calmFactor);
              float waveAmp = mix(0.2, 0.05, calmFactor);
              
              // Single combined wave (instead of multiple sin/cos)
              float wave = sin(pos.x * 2.0 + pos.z * 1.5 + uTime * waveSpeed) * waveAmp;
              
              // Chunk-like displacement (simplified - no hash33 per vertex)
              float chunkInfluence = 1.0 - smoothstep(uTransitionStart, uTransitionEnd + 0.15, normExp);
              
              // Radial explosion with wave modulation
              vec3 explosionDir = normalize(position);
              float baseDist = uExplode * (0.8 + wave);
              
              // Blend between chunk-like motion and wave motion
              pos = position + explosionDir * baseDist * mix(chunkInfluence, 1.0, particleVisibility);
              
              // Simple twist (reduced complexity)
              float twistAngle = uExplode * mix(0.1, 0.02, calmFactor) * pos.y * 0.3;
              float c = cos(twistAngle);
              float s = sin(twistAngle);
              pos.xz = vec2(pos.x * c - pos.z * s, pos.x * s + pos.z * c);
          }

          // --- ASSIGN COLORS & SIZES (simplified branching) ---
          float baseSize;
          bool isBorder = landIntensity > 0.15 && landIntensity < 0.6;
          bool isLand = landIntensity >= 0.6;
          
          if (isBorder) {
              vColor = mix(colorGold, colorGold * 0.8, calmFactor);
              vAlpha = 1.0;
              baseSize = mix(6.0, 5.5, calmFactor);
          } else if (isLand) {
              vColor = mix(colorPurple, colorDimPurple, calmFactor);
              vAlpha = mix(0.85, 0.7, calmFactor);
              baseSize = mix(4.5, 4.0, calmFactor);
          } else {
              vColor = colorOcean * (1.0 - calmFactor * 0.3);
              vAlpha = mix(0.5, 0.4, calmFactor);
              baseSize = mix(3.5, 3.0, calmFactor);
          }
          
          // Point size with distance attenuation
          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = clamp(baseSize * (12.0 / -mvPos.z), 2.0, 15.0);

          // Alpha calculations (simplified)
          vAlpha *= particleVisibility;
          vAlpha *= smoothstep(2.0, 5.0, distance(cameraPosition, (modelMatrix * vec4(pos, 1.0)).xyz));
          vAlpha *= mix(1.0, 0.9, calmFactor);
          vAlpha *= uFade;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        varying float vCalmFactor;
        
        void main() {
          if (vAlpha <= 0.01) discard;
          
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          
          if (dist > 0.5) discard;
          
          // Soft glow (simplified)
          float glow = 1.0 - smoothstep(mix(0.3, 0.2, vCalmFactor), 0.5, dist);
          
          gl_FragColor = vec4(vColor, vAlpha * glow);
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);
  
  // Update texture when loaded
  useEffect(() => {
    if (shaderMaterial && earthMap) {
      shaderMaterial.uniforms.uMap.value = earthMap;
    }
  }, [shaderMaterial, earthMap]);
  
  // Animation loop - reads from ref for smooth animation between React state updates
  useFrame((state) => {
    if (materialRef.current && pointsRef.current) {
      const ep = explosionProgressRef ? explosionProgressRef.current : explosionProgress;
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uExplode.value = 25.0 * ep;

      // Compute particle fade from ref (avoids React re-render dependency)
      const particleFadeStart = 0.641;
      const particleFadeEnd = 0.943;
      let pFade = 1.0;
      if (ep >= particleFadeEnd) pFade = 0.0;
      else if (ep > particleFadeStart) pFade = 1.0 - (ep - particleFadeStart) / (particleFadeEnd - particleFadeStart);
      materialRef.current.uniforms.uFade.value = pFade;

      // Manage visibility — Three.js skips draw calls for invisible objects
      pointsRef.current.visible = ep > 0 && pFade > 0;
      
      // Only disable depth test during smokescreen phase (after frame 22)
      // Frames 14-22: normal depth rendering - particles behind pyramid not visible
      // After frame 22 (explosionProgress > 0.25): smokescreen effect
      const inSmokescreenPhase = ep > 0.25 && ep < 0.35;
      materialRef.current.depthTest = !inSmokescreenPhase;
      
      // Update render order dynamically - particles in front only during smokescreen
      // Frames 14-22: normal depth-based rendering
      pointsRef.current.renderOrder = inSmokescreenPhase ? 10 : 0;
    }
  });
  
  return (
    <points ref={pointsRef}>
      <primitive object={geometry} attach="geometry" />
      <primitive ref={materialRef} object={shaderMaterial} attach="material" />
    </points>
  );
};

export default React.memo(EarthParticleWaves);
