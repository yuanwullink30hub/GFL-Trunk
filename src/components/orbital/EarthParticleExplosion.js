import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Earth Particle Explosion System
 * 
 * Creates adaptive particle count based on device performance
 * Organized into wave-like streams that emerge from earth chunks
 * 
 * The transition happens over multiple frames:
 * - Phase 1 (0-0.3): Particles start inside chunks, begin emerging
 * - Phase 2 (0.3-0.6): Full transition - chunks dissolve into particles
 * - Phase 3 (0.6-1.0): Pure particle streams flowing outward
 */
const EarthParticleExplosion = ({ 
  explosionProgress = 0, 
  particleCount = null, // If null, uses adaptive count
  streamCount = null, // If null, scales with particleCount
  sphereRadius = 2.5,
  chunkExplosionValue = 0  // The uExplode value from chunks shader
}) => {
  // Desktop: 9000 particles, Laptop (<1800px): 1500
  const isLaptop = typeof window !== 'undefined' && window.innerWidth < 1800;
  const adaptiveParticleCount = particleCount || (isLaptop ? 1500 : 9000);
  const adaptiveStreamCount = streamCount || Math.max(100, Math.floor(adaptiveParticleCount / 30));
  const pointsRef = useRef();
  const materialRef = useRef();
  
  // Generate particles organized into wave streams
  const particleData = useMemo(() => {
    const positions = new Float32Array(adaptiveParticleCount * 3);
    const streamIds = new Float32Array(adaptiveParticleCount);
    const streamOffsets = new Float32Array(adaptiveParticleCount); // Position along stream
    const wavePhases = new Float32Array(adaptiveParticleCount);
    const colors = new Float32Array(adaptiveParticleCount * 3);
    const sizes = new Float32Array(adaptiveParticleCount);
    
    // Pre-calculate stream directions (golden spiral distribution on sphere)
    const streamDirections = [];
    const streamTangents = [];
    const streamBitangents = [];
    
    for (let s = 0; s < adaptiveStreamCount; s++) {
      // Golden angle spiral for even distribution
      const phi = Math.acos(1 - 2 * (s + 0.5) / adaptiveStreamCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * s;
      
      const dir = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi)
      ).normalize();
      
      // Calculate tangent and bitangent for wave oscillation plane
      const tangent = new THREE.Vector3(0, 1, 0).cross(dir);
      if (tangent.length() < 0.1) {
        tangent.set(1, 0, 0).cross(dir);
      }
      tangent.normalize();
      
      const bitangent = new THREE.Vector3().crossVectors(dir, tangent).normalize();
      
      streamDirections.push(dir);
      streamTangents.push(tangent);
      streamBitangents.push(bitangent);
    }
    
    // Color palette - purple and gold theme
    const colorPalette = [
      new THREE.Color('#9333ea'), // Purple
      new THREE.Color('#a855f7'), // Light purple
      new THREE.Color('#7c3aed'), // Violet
      new THREE.Color('#6d28d9'), // Deep purple
      new THREE.Color('#ffd700'), // Gold
      new THREE.Color('#f59e0b'), // Amber
      new THREE.Color('#d97706'), // Dark gold
      new THREE.Color('#c084fc'), // Lavender
    ];
    
    // Distribute particles among streams
    const particlesPerStream = Math.ceil(adaptiveParticleCount / adaptiveStreamCount);
    
    for (let i = 0; i < adaptiveParticleCount; i++) {
      // Assign to a stream
      const streamId = Math.floor(i / particlesPerStream) % adaptiveStreamCount;
      const positionInStream = (i % particlesPerStream) / particlesPerStream;
      
      streamIds[i] = streamId;
      streamOffsets[i] = positionInStream;
      
      // Initial position on sphere surface (clustered around stream origin)
      const dir = streamDirections[streamId];
      
      // Add small random offset from stream center for thickness
      const spreadAngle = 0.15; // How wide each stream spreads
      const randomTheta = Math.random() * Math.PI * 2;
      const randomSpread = Math.random() * spreadAngle;
      
      const tangent = streamTangents[streamId];
      const bitangent = streamBitangents[streamId];
      
      const offsetDir = tangent.clone()
        .multiplyScalar(Math.cos(randomTheta) * randomSpread)
        .add(bitangent.clone().multiplyScalar(Math.sin(randomTheta) * randomSpread));
      
      const finalDir = dir.clone().add(offsetDir).normalize();
      
      positions[i * 3] = finalDir.x * sphereRadius;
      positions[i * 3 + 1] = finalDir.y * sphereRadius;
      positions[i * 3 + 2] = finalDir.z * sphereRadius;
      
      // Wave phase - staggered along stream for wave propagation effect
      wavePhases[i] = positionInStream * Math.PI * 4 + Math.random() * 0.5;
      
      // Size variation
      sizes[i] = 0.8 + Math.random() * 0.8;
      
      // Color - alternate between purple and gold based on stream
      const isPurpleStream = streamId % 3 !== 0;
      const colorIndex = isPurpleStream 
        ? Math.floor(Math.random() * 4) // Purple colors (0-3)
        : 4 + Math.floor(Math.random() * 4); // Gold colors (4-7)
      
      const color = colorPalette[colorIndex];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    
    return {
      positions,
      streamIds,
      streamOffsets,
      wavePhases,
      colors,
      sizes,
      streamDirections,
      streamTangents,
      streamBitangents
    };
  }, [particleCount, streamCount, sphereRadius]);
  
  // Shader material for light-wave particle movement
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uExplosion: { value: 0 },
        uChunkExplosion: { value: 0 }, // Synced with chunk shader uExplode
        uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
        uSphereRadius: { value: sphereRadius },
        uStreamCount: { value: adaptiveStreamCount }, // For shader optimization
      },
      vertexShader: `
        attribute float aStreamId;
        attribute float aStreamOffset;
        attribute float aWavePhase;
        attribute vec3 aColor;
        attribute float aSize;
        
        uniform float uTime;
        uniform float uExplosion;
        uniform float uPixelRatio;
        uniform float uSphereRadius;
        uniform float uChunkExplosion; // Synced with chunk displacement
        uniform float uStreamCount;
        
        varying vec3 vColor;
        varying float vAlpha;
        
        #define PI 3.14159265359
        
        // Transition phases
        #define PHASE1_START 0.08   // When particles start appearing
        #define PHASE1_END 0.25     // Particles fully visible, starting to emerge
        #define PHASE2_END 0.5      // Chunks fully dissolved, pure particles
        
        // Golden ratio for stream distribution
        vec3 getStreamDirection(float streamId) {
          float phi = acos(1.0 - 2.0 * (streamId + 0.5) / uStreamCount);
          float theta = PI * (1.0 + sqrt(5.0)) * streamId;
          return normalize(vec3(
            sin(phi) * cos(theta),
            sin(phi) * sin(theta),
            cos(phi)
          ));
        }
        
        vec3 getStreamTangent(vec3 dir) {
          vec3 up = vec3(0.0, 1.0, 0.0);
          vec3 tangent = cross(up, dir);
          if (length(tangent) < 0.1) {
            tangent = cross(vec3(1.0, 0.0, 0.0), dir);
          }
          return normalize(tangent);
        }
        
        // Hash function for chunk-like positioning
        vec3 hash33(vec3 p) {
          p = fract(p * vec3(.1031, .1030, .0973));
          p += dot(p, p.yxz + 33.33);
          return fract((p.xxy + p.yxx) * p.zyx);
        }
        
        void main() {
          vColor = aColor;
          
          // Before explosion threshold - particles completely hidden
          if (uExplosion < PHASE1_START) {
            gl_Position = vec4(0.0, 0.0, -1000.0, 1.0);
            gl_PointSize = 0.0;
            vAlpha = 0.0;
            return;
          }
          
          // Get stream direction and tangent
          vec3 streamDir = getStreamDirection(aStreamId);
          vec3 tangent = getStreamTangent(streamDir);
          vec3 bitangent = cross(streamDir, tangent);
          
          // Calculate how far along the transition we are
          float transitionProgress = smoothstep(PHASE1_START, PHASE2_END, uExplosion);
          
          // === PHASE 1: Particles emerge from within chunks ===
          // During early explosion, particles are positioned with the chunks
          // then gradually separate and form their own streams
          
          // Calculate chunk-like displacement to sync with chunk positions
          vec3 chunkCenter = streamDir * uSphereRadius; // Approximate chunk center
          vec3 chunkHash = hash33(chunkCenter * 1.5);
          float chunkSpeed = 0.5 + chunkHash.x * 2.0;
          vec3 chunkDisplacement = streamDir * uChunkExplosion * chunkSpeed;
          
          // Add chunk tangential motion (matches chunk shader)
          float chunkRotation = chunkHash.y * 20.0;
          float tangentialIntensity = sin(uChunkExplosion * (0.2 + chunkHash.x * 0.3) + chunkRotation) * (uChunkExplosion * chunkSpeed * 0.15);
          chunkDisplacement += tangent * tangentialIntensity;
          
          // Staggered release - particles within same chunk release together then spread
          float releaseDelay = aStreamOffset * 0.3;
          float particleProgress = max(0.0, (uExplosion - PHASE1_END) / (1.0 - PHASE1_END) - releaseDelay);
          particleProgress = clamp(particleProgress, 0.0, 1.0);
          
          // Ease the progress for smooth acceleration
          float easedProgress = particleProgress * particleProgress * (3.0 - 2.0 * particleProgress);
          
          // Distance traveled along stream (light-wave speed)
          float travelSpeed = 10.0 + aStreamOffset * 5.0;
          float distance = easedProgress * travelSpeed;
          
          // Start position - blend between chunk position and sphere surface
          vec3 spherePos = position; // Original position on sphere
          vec3 chunkPos = position + chunkDisplacement; // Position with chunk
          
          // During Phase 1: particles follow chunks
          // During Phase 2: particles separate from chunks into streams
          float separationProgress = smoothstep(PHASE1_START, PHASE2_END, uExplosion);
          vec3 startPos = mix(chunkPos, spherePos + streamDir * 0.5, separationProgress);
          
          // Main movement - outward along stream direction (only after separation)
          vec3 newPos = startPos + streamDir * distance * separationProgress;
          
          // LIGHT WAVE OSCILLATION - Adaptive complexity based on performance
          // Sinusoidal wave perpendicular to travel direction
          // This creates the characteristic wave-like movement
          float waveFrequency = 2.5; // Number of oscillations
          float waveAmplitude = 0.3 + easedProgress * 0.8; // Grows as it travels
          
          // Primary wave (side-to-side)
          float wave1 = sin(aWavePhase + easedProgress * waveFrequency * PI * 2.0);
          // Secondary wave (up-down) - phase shifted for figure-8 like motion
          // Skip secondary wave on LOW performance devices to reduce shader complexity
          float wave2 = 0.0;
          if (uStreamCount > 150.0) { // Only high/medium end devices
            wave2 = sin(aWavePhase * 1.3 + easedProgress * waveFrequency * PI * 2.0 + PI * 0.5);
          }
          
          // Apply wave oscillation perpendicular to stream direction
          newPos += tangent * wave1 * waveAmplitude;
          newPos += bitangent * wave2 * waveAmplitude * 0.7;
          
          // Add subtle spiral motion (like light helicity) - only on high-end devices
          if (uStreamCount > 200.0) { // Only HIGH performance devices
            float spiralAngle = easedProgress * PI * 3.0 + aStreamOffset * PI * 2.0;
            float spiralRadius = 0.15 * easedProgress;
            newPos += tangent * cos(spiralAngle) * spiralRadius;
            newPos += bitangent * sin(spiralAngle) * spiralRadius;
          }
          
          // Subtle time-based shimmer
          float shimmer = sin(uTime * 5.0 + aWavePhase * 10.0) * 0.05 * easedProgress;
          newPos += streamDir * shimmer;
          
          // Alpha based on progress
          // Phase 1: Fade in as chunks dissolve (particles become visible)
          // Phase 2-3: Full visibility, then fade at distance
          float phaseInFade = smoothstep(PHASE1_START, PHASE1_END, uExplosion);
          float entryFade = smoothstep(0.0, 0.15, particleProgress + transitionProgress * 0.5);
          float distanceFade = 1.0 - smoothstep(10.0, 18.0, distance);
          float progressFade = 1.0 - smoothstep(0.85, 1.0, uExplosion);
          
          // Combine all fades - particles brighten as chunks fade
          vAlpha = phaseInFade * entryFade * distanceFade * progressFade * 0.95;
          
          // Point size - larger when closer, with variation
          vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
          float sizeAttenuation = 180.0 / -mvPosition.z;
          gl_PointSize = aSize * sizeAttenuation * uPixelRatio;
          gl_PointSize *= (0.7 + easedProgress * 0.5); // Grow slightly as they travel
          gl_PointSize = clamp(gl_PointSize, 1.0, 12.0);
          
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          // Soft circular particle with glow
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          
          // Sharp core with soft glow
          float core = 1.0 - smoothstep(0.2, 0.35, dist);
          float glow = exp(-dist * 4.0) * 0.6;
          float alpha = (core + glow) * vAlpha;
          
          // Slight color brightening at center
          vec3 finalColor = vColor * (1.0 + core * 0.3);
          
          if (alpha < 0.01) discard;
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
    });
  }, [sphereRadius]);
  
  // Animation
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uExplosion.value = explosionProgress;
      // Sync with chunk explosion value (25.0 max * progress)
      materialRef.current.uniforms.uChunkExplosion.value = chunkExplosionValue;
    }
  });
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={particleData.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aStreamId"
          count={particleCount}
          array={particleData.streamIds}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aStreamOffset"
          count={particleCount}
          array={particleData.streamOffsets}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aWavePhase"
          count={particleCount}
          array={particleData.wavePhases}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aColor"
          count={particleCount}
          array={particleData.colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aSize"
          count={particleCount}
          array={particleData.sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <primitive ref={materialRef} object={shaderMaterial} attach="material" />
    </points>
  );
};

export default React.memo(EarthParticleExplosion);
