import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';

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
  explosionProgress = 0, 
  sphereRadius = 2.5,
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
  
  // Create geometry with high resolution for dense particle coverage
  // High width segments (128) = dense horizontal rings that look connected
  // Height segments (64) provide vertical resolution
  const geometry = useMemo(() => {
    return new THREE.SphereGeometry(sphereRadius, 128, 64);
  }, [sphereRadius]);
  
  // Shader material based on attached aistudios code
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uExplode: { value: 0 },
        uMap: { value: null },
        uTransitionStart: { value: 0.04 }, // When particles start appearing (very early for smooth blend)
        uTransitionEnd: { value: 0.35 },   // When chunks fully gone
      },
      vertexShader: `
        uniform float uTime;
        uniform float uExplode;
        uniform float uTransitionStart;
        uniform float uTransitionEnd;
        uniform sampler2D uMap;
        
        varying vec2 vUv;
        varying vec3 vColor;
        varying float vAlpha;
        varying float vTransitionPhase;

        // Hash for chunk-like behavior during transition
        vec3 hash33(vec3 p) {
          p = fract(p * vec3(.1031, .1030, .0973));
          p += dot(p, p.yxz + 33.33);
          return fract((p.xxy + p.yxx) * p.zyx);
        }

        void main() {
          vUv = uv;
          vec3 pos = position;
          vec3 norm = normal;

          // Sample map intensity for coloring
          vec4 mapColor = texture2D(uMap, uv);
          float landIntensity = mapColor.r; 
          
          // --- COLOR DEFINITIONS ---
          vec3 colorPurple = vec3(0.5, 0.0, 1.0);     // Deep Neon Purple
          vec3 colorGold = vec3(1.0, 0.8, 0.1);       // Bright Gold
          vec3 colorOcean = vec3(0.2, 0.05, 0.4);     // Faint Purple Grid
          vec3 colorDimPurple = vec3(0.3, 0.0, 0.5);  // Dimmed purple for background

          // --- BORDER DETECTION ---
          bool isBorder = landIntensity > 0.15 && landIntensity < 0.6;
          bool isLand = landIntensity >= 0.6;

          // Calculate normalized explosion (0-1)
          float normalizedExp = uExplode / 25.0;
          
          // Phase tracking for smooth transitions
          // Phase 0-0.04: hidden
          // Phase 0.04-0.35: transition (fading in, matching chunks)
          // Phase 0.35-0.7: active wave motion
          // Phase 0.7-1.0: calming down for pyramid background
          vTransitionPhase = normalizedExp;
          
          // Particle visibility - smooth fade in (starts very early)
          float particleVisibility = smoothstep(uTransitionStart, uTransitionStart + 0.12, normalizedExp);
          
          // Calm factor - reduces movement intensity gradually starting after smokescreen ends
          // Start calming at 0.35 (when smokescreen ends) for more elegance through frames 30-33
          float calmFactor = smoothstep(0.35, 0.85, normalizedExp);
          float movementIntensity = mix(1.0, 0.2, calmFactor); // Reduce to 20% by frame 33

          // --- WAVE FUNCTION (gentler for pyramid section) ---
          float waveFreq = 2.0;
          float waveSpeed = mix(0.8, 0.15, calmFactor); // Slow down much faster now
          
          // Gentle interference pattern - reduced amplitude
          float wave = sin(pos.x * waveFreq + uTime * waveSpeed) * 
                       cos(pos.y * waveFreq + uTime * waveSpeed) + 
                       sin(pos.z * waveFreq * 0.5 + uTime * waveSpeed * 0.5);
          
          // Flowing "ribbon" offset - reduced frequency to minimize bottom motion, boost middle
          float ribbonSpeed = mix(2.0, 0.3, calmFactor);
          float ribbonFlow = sin(uv.y * 6.0 + uTime * ribbonSpeed) * 0.8; // Reduced from 40.0 to 6.0 

          if (uExplode > 0.0) {
              // === CHUNK-LIKE DISPLACEMENT (early phase) ===
              vec3 chunkHash = hash33(floor(position * 1.8) / 1.8);
              float chunkSpeed = 0.6 + chunkHash.x * 1.5;
              
              // Chunk influence fades out smoothly
              float chunkInfluence = 1.0 - smoothstep(uTransitionStart, uTransitionEnd + 0.15, normalizedExp);
              
              // Chunk-based radial explosion
              vec3 chunkDir = normalize(position + (chunkHash - 0.5) * 0.3);
              vec3 tangent = cross(chunkDir, vec3(0.0, 1.0, 0.0));
              if (length(tangent) < 0.1) tangent = cross(chunkDir, vec3(1.0, 0.0, 0.0));
              tangent = normalize(tangent);
              
              float chunkDist = uExplode * chunkSpeed;
              float tangentialMove = sin(uExplode * 0.3 + chunkHash.y * 15.0) * (chunkDist * 0.12);
              
              vec3 chunkDisplacement = chunkDir * chunkDist + tangent * tangentialMove;
              
              // === WAVE-LIKE DISPLACEMENT ===
              // Gentler wave displacement that calms over time
              float waveAmp = mix(0.2, 0.05, calmFactor);  // Increased from 0.15 to 0.2 for more middle movement
              float ribbonAmp = mix(0.08, 0.02, calmFactor);  // Increased from 0.05 to 0.08 to compensate for lower frequency
              float waveDisplacement = uExplode * (0.8 + waveAmp * wave + ribbonAmp * ribbonFlow);
              vec3 waveDisplacementVec = norm * waveDisplacement;
              
              // Blend between chunk motion and wave motion
              vec3 totalDisplacement = mix(chunkDisplacement, waveDisplacementVec, particleVisibility);
              
              pos = pos + totalDisplacement * chunkInfluence + waveDisplacementVec * (1.0 - chunkInfluence);
              
              // Apply twist - reduce in pyramid section
              float twistIntensity = mix(0.1, 0.02, calmFactor);
              float twistAngle = uExplode * twistIntensity * sin(pos.y * 0.5);
              float c = cos(twistAngle);
              float s = sin(twistAngle);
              mat2 twistMat = mat2(c, -s, s, c);
              pos.xz = twistMat * pos.xz;
          }

          // --- ASSIGN COLORS & SIZES ---
          float baseSize;
          
          // Fade colors toward dimmer tones in pyramid section
          float colorDim = mix(1.0, 0.7, calmFactor);
          
          if (isBorder) {
              vColor = mix(colorGold, colorGold * 0.8, calmFactor);
              vAlpha = 1.0;
              baseSize = mix(6.0, 5.5, calmFactor); // Keep size visible in pyramid view
          } else if (isLand) {
              vColor = mix(colorPurple, colorDimPurple, calmFactor);
              vAlpha = mix(0.85, 0.7, calmFactor);
              baseSize = mix(4.5, 4.0, calmFactor);
          } else {
              vColor = colorOcean * colorDim;
              vAlpha = mix(0.5, 0.4, calmFactor);
              baseSize = mix(3.5, 3.0, calmFactor);
          }
          
          // Scale point size based on distance
          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = baseSize * (12.0 / -mvPos.z);
          gl_PointSize = clamp(gl_PointSize, 2.0, 15.0);

          // --- ALPHA CALCULATIONS ---
          
          // Smooth visibility fade in
          vAlpha *= particleVisibility;
          
          // Fade distant particles - less aggressive
          float distFade = 1.0 - smoothstep(22.0, 40.0, uExplode);
          vAlpha *= distFade;
          
          // Fade particles too close to camera
          float distToCam = distance(cameraPosition, (modelMatrix * vec4(pos, 1.0)).xyz);
          vAlpha *= smoothstep(2.0, 5.0, distToCam);
          
          // Keep particles visible in pyramid section
          vAlpha *= mix(1.0, 0.9, calmFactor);

          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        varying float vTransitionPhase;
        
        void main() {
          if (vAlpha <= 0.01) discard;
          
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          
          // Circle shape
          if (dist > 0.5) discard;
          
          // Soft glow - gentler in later phases
          float glowSharpness = mix(0.3, 0.2, smoothstep(0.5, 0.8, vTransitionPhase));
          float glow = 1.0 - smoothstep(glowSharpness, 0.5, dist);
          
          // Softer color in pyramid section
          vec3 finalColor = vColor;
          
          gl_FragColor = vec4(finalColor, vAlpha * glow);
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: false, // Render on top of pyramid during explosion
      blending: THREE.AdditiveBlending,
    });
  }, []);
  
  // Update texture when loaded
  useEffect(() => {
    if (shaderMaterial && earthMap) {
      shaderMaterial.uniforms.uMap.value = earthMap;
    }
  }, [shaderMaterial, earthMap]);
  
  // Animation loop - also update depthTest based on explosion phase
  useFrame((state) => {
    if (materialRef.current && pointsRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uExplode.value = 25.0 * explosionProgress;
      
      // Only disable depth test during smokescreen phase (ends at frame 24)
      const inSmokescreenPhase = explosionProgress > 0.1 && explosionProgress < 0.26;
      materialRef.current.depthTest = !inSmokescreenPhase;
      
      // Update render order dynamically - particles in front only during smokescreen
      // After frame 25: normal depth-based rendering creates 3D sphere effect
      pointsRef.current.renderOrder = inSmokescreenPhase ? 10 : 0;
    }
  });
  
  // Don't render if no explosion yet
  if (explosionProgress <= 0) return null;
  
  return (
    <points ref={pointsRef}>
      <primitive object={geometry} attach="geometry" />
      <primitive ref={materialRef} object={shaderMaterial} attach="material" />
    </points>
  );
};

export default React.memo(EarthParticleWaves);
