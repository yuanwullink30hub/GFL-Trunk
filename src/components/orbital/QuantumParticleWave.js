import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Quantum-inspired particle wave system
// Creates particles that disperse in wave patterns mimicking quantum field behavior
const QuantumParticleWave = ({ explosionProgress = 0, particleCount = 8000 }) => {
  const pointsRef = useRef();
  const materialRef = useRef();
  
  // Generate particle positions on a sphere surface
  const { positions, velocities, phases, scales, colors, waveOffsets } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const phases = new Float32Array(particleCount);
    const scales = new Float32Array(particleCount);
    const colors = new Float32Array(particleCount * 3);
    const waveOffsets = new Float32Array(particleCount);
    
    const sphereRadius = 2.5;
    
    // Color palette - quantum/plasma inspired
    const colorPalette = [
      new THREE.Color('#ff6b00'), // Orange
      new THREE.Color('#ffd700'), // Gold
      new THREE.Color('#ff8c00'), // Dark orange
      new THREE.Color('#9333ea'), // Purple
      new THREE.Color('#7c3aed'), // Violet
      new THREE.Color('#4c1d95'), // Deep purple
      new THREE.Color('#c084fc'), // Light purple
      new THREE.Color('#f97316'), // Bright orange
    ];
    
    for (let i = 0; i < particleCount; i++) {
      // Fibonacci sphere distribution for even coverage
      const phi = Math.acos(1 - 2 * (i + 0.5) / particleCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      
      const x = sphereRadius * Math.sin(phi) * Math.cos(theta);
      const y = sphereRadius * Math.sin(phi) * Math.sin(theta);
      const z = sphereRadius * Math.cos(phi);
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      // Quantum-inspired velocity - radial with wave perturbations
      const radialDir = new THREE.Vector3(x, y, z).normalize();
      
      // Add tangential component for spiral motion
      const tangent = new THREE.Vector3(-y, x, 0).normalize();
      const bitangent = new THREE.Vector3().crossVectors(radialDir, tangent).normalize();
      
      // Random factors for variation
      const speedFactor = 0.3 + Math.random() * 0.7;
      const tangentialFactor = (Math.random() - 0.5) * 0.4;
      const bitangentialFactor = (Math.random() - 0.5) * 0.4;
      
      // Combine directions
      const velocity = radialDir.clone()
        .multiplyScalar(speedFactor)
        .add(tangent.clone().multiplyScalar(tangentialFactor))
        .add(bitangent.clone().multiplyScalar(bitangentialFactor));
      
      velocities[i * 3] = velocity.x;
      velocities[i * 3 + 1] = velocity.y;
      velocities[i * 3 + 2] = velocity.z;
      
      // Phase offset for wave animation
      phases[i] = Math.random() * Math.PI * 2;
      
      // Random scale
      scales[i] = 0.5 + Math.random() * 1.5;
      
      // Wave offset based on position (creates propagating waves)
      waveOffsets[i] = Math.sqrt(x * x + y * y + z * z) + Math.random() * 0.5;
      
      // Color assignment
      const colorIndex = Math.floor(Math.random() * colorPalette.length);
      const color = colorPalette[colorIndex];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    
    return { positions, velocities, phases, scales, colors, waveOffsets };
  }, [particleCount]);
  
  // Custom shader for quantum-wave particles
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uExplosion: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
        attribute vec3 aVelocity;
        attribute float aPhase;
        attribute float aScale;
        attribute vec3 aColor;
        attribute float aWaveOffset;
        
        uniform float uTime;
        uniform float uExplosion;
        uniform float uPixelRatio;
        
        varying vec3 vColor;
        varying float vAlpha;
        varying float vDistance;
        
        // Simplex noise for organic motion
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
        
        float snoise(vec3 v) {
          const vec2 C = vec2(1.0/6.0, 1.0/3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i  = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          i = mod289(i);
          vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
          float n_ = 0.142857142857;
          vec3 ns = n_ * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);
          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }
        
        void main() {
          vColor = aColor;
          
          // Only animate when explosion is active
          if (uExplosion <= 0.0) {
            // Pre-explosion: particles are invisible/at origin
            gl_Position = vec4(0.0, 0.0, -1000.0, 1.0);
            gl_PointSize = 0.0;
            vAlpha = 0.0;
            return;
          }
          
          // Explosion animation
          float progress = uExplosion;
          
          // Staggered start based on wave offset (creates propagating wave)
          float staggeredProgress = max(0.0, progress - aWaveOffset * 0.15);
          staggeredProgress = min(staggeredProgress, 1.0);
          
          // Apply easing for organic feel
          float easedProgress = staggeredProgress * staggeredProgress * (3.0 - 2.0 * staggeredProgress);
          
          // Base position from sphere
          vec3 pos = position;
          
          // Movement along velocity direction
          float speed = 8.0 + aScale * 4.0;
          vec3 movement = aVelocity * easedProgress * speed;
          
          // Quantum wave perturbation
          float waveFreq = 3.0;
          float waveAmp = 0.5 + progress * 1.5;
          float wave1 = sin(aPhase + progress * waveFreq + aWaveOffset * 2.0) * waveAmp;
          float wave2 = cos(aPhase * 1.3 + progress * waveFreq * 0.7) * waveAmp * 0.7;
          float wave3 = sin(aPhase * 0.7 + progress * waveFreq * 1.3) * waveAmp * 0.5;
          
          // Apply waves perpendicular to velocity
          vec3 velNorm = normalize(aVelocity);
          vec3 perp1 = normalize(cross(velNorm, vec3(0.0, 1.0, 0.0)));
          if (length(perp1) < 0.1) perp1 = normalize(cross(velNorm, vec3(1.0, 0.0, 0.0)));
          vec3 perp2 = cross(velNorm, perp1);
          
          movement += perp1 * wave1 * staggeredProgress;
          movement += perp2 * wave2 * staggeredProgress;
          movement += velNorm * wave3 * 0.5;
          
          // Add noise-based turbulence (quantum fluctuations)
          float noiseScale = 2.0;
          float noiseTime = uTime * 0.5 + aPhase;
          vec3 noisePos = pos * noiseScale + noiseTime;
          float nx = snoise(noisePos);
          float ny = snoise(noisePos + vec3(100.0, 0.0, 0.0));
          float nz = snoise(noisePos + vec3(0.0, 100.0, 0.0));
          movement += vec3(nx, ny, nz) * progress * 1.5;
          
          // Spiral motion (creates vortex-like patterns)
          float spiralAngle = progress * 3.14159 * 2.0 * (0.5 + aScale * 0.5);
          float spiralRadius = staggeredProgress * 0.5;
          movement.x += cos(spiralAngle + aPhase) * spiralRadius;
          movement.z += sin(spiralAngle + aPhase) * spiralRadius;
          
          // Final position
          vec3 finalPos = pos + movement;
          
          // Distance from origin for fading
          vDistance = length(finalPos);
          
          // Alpha based on distance and progress
          float distanceFade = 1.0 - smoothstep(5.0, 25.0, vDistance);
          float progressFade = 1.0 - smoothstep(0.7, 1.0, progress);
          float entryFade = smoothstep(0.0, 0.15, staggeredProgress);
          vAlpha = distanceFade * progressFade * entryFade * 0.8;
          
          // Point size based on scale and distance
          vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
          float sizeAttenuation = (200.0 / -mvPosition.z);
          gl_PointSize = aScale * sizeAttenuation * uPixelRatio * (0.5 + progress * 0.5);
          gl_PointSize = clamp(gl_PointSize, 1.0, 15.0);
          
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        varying float vDistance;
        
        void main() {
          // Circular particle with soft edges
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          
          // Soft circle falloff
          float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
          alpha *= vAlpha;
          
          // Add glow effect
          float glow = exp(-dist * 3.0) * 0.5;
          alpha += glow * vAlpha * 0.5;
          
          // Color with slight brightness variation based on distance
          vec3 finalColor = vColor * (1.0 + (1.0 - vDistance / 20.0) * 0.3);
          
          // Discard nearly transparent fragments
          if (alpha < 0.01) discard;
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
    });
  }, []);
  
  // Animation loop
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uExplosion.value = explosionProgress;
    }
  });
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aVelocity"
          count={particleCount}
          array={velocities}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aPhase"
          count={particleCount}
          array={phases}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aScale"
          count={particleCount}
          array={scales}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aColor"
          count={particleCount}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aWaveOffset"
          count={particleCount}
          array={waveOffsets}
          itemSize={1}
        />
      </bufferGeometry>
      <primitive ref={materialRef} object={shaderMaterial} attach="material" />
    </points>
  );
};

export default QuantumParticleWave;
