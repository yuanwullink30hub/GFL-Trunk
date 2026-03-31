import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════════════════
   HOLO JUPITER — Holographic Jupiter sphere
   3D simplex-noise banding, Great Red Spot, secondary vortices,
   in-shader grid + scanlines, fresnel rim, additive blending.
   Matches the AI Studio reference build.
   ═══════════════════════════════════════════════════════════════════ */

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  uniform float time;
  uniform vec3 colorTint;

  // Simplex 3D Noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) {
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 = v - i + dot(i, C.xxx) ;
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute( permute( permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
    float n_ = 0.142857142857;
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
  }

  void main() {
    vec3 pos = normalize(vPosition);

    // Multi-layered turbulence for fine swirling details (fbm-like)
    float turbulence = snoise(pos * 2.0 + time * 0.05) * 0.5;
    turbulence += snoise(pos * 4.0 - time * 0.08) * 0.25;
    turbulence += snoise(pos * 8.0 + time * 0.12) * 0.125;

    // Distort the Y coordinate for bands
    float y = vPosition.y + turbulence * 0.5;

    // Complex banding logic
    float band1 = sin(y * 6.0 + turbulence * 0.5);
    float band2 = sin(y * 12.0 - turbulence * 0.8);
    float band3 = sin(y * 24.0 + turbulence * 1.2);
    float band4 = snoise(vec3(pos.x * 2.0, y * 15.0, pos.z * 2.0)) * 0.5;

    // Combine bands with different weights
    float bands = band1 * 0.4 + band2 * 0.3 + band3 * 0.2 + band4 * 0.1;
    bands = bands * 0.5 + 0.5; // Normalize to 0..1

    // Great Red Spot with a core
    vec3 spotCenter = normalize(vec3(0.6, -0.3, 0.7));
    vec3 scaledPos = pos;
    scaledPos.y *= 1.6; // More elliptical
    vec3 scaledCenter = spotCenter;
    scaledCenter.y *= 1.6;
    float ellipticalDist = distance(scaledPos, scaledCenter);

    // Spot turbulence
    float spotTurb = snoise(pos * 10.0 + time * 0.2) * 0.05;
    float spotBase = smoothstep(0.4, 0.1, ellipticalDist + spotTurb);
    float spotCore = smoothstep(0.15, 0.05, ellipticalDist + spotTurb);

    // Secondary spots (vortices)
    float secondarySpots = 0.0;
    vec3 spot2 = normalize(vec3(-0.5, 0.2, 0.8));
    vec3 spot3 = normalize(vec3(0.2, 0.5, -0.9));
    secondarySpots += smoothstep(0.2, 0.05, distance(pos, spot2) + snoise(pos * 15.0) * 0.05);
    secondarySpots += smoothstep(0.15, 0.02, distance(pos, spot3) + snoise(pos * 20.0) * 0.03);

    // Refined Color Palette
    vec3 lightColor = vec3(0.98, 0.92, 0.85); // Creamy white
    vec3 midColor = vec3(0.85, 0.55, 0.3);   // Warm orange
    vec3 darkColor = vec3(0.5, 0.25, 0.1);   // Deep rust/brown
    vec3 brickRed = vec3(0.7, 0.2, 0.1);    // Brick red for spot core

    // Base surface color
    vec3 jupiterColor = mix(darkColor, lightColor, bands);
    jupiterColor = mix(jupiterColor, midColor, pow(bands, 2.0));

    // Apply Great Red Spot
    vec3 spotFinalColor = mix(brickRed * 1.2, brickRed * 0.6, spotCore);
    jupiterColor = mix(jupiterColor, spotFinalColor, spotBase);

    // Apply secondary spots
    jupiterColor = mix(jupiterColor, lightColor * 0.8, secondarySpots);

    // Holographic effects
    float fresnel = abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
    fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
    fresnel = pow(fresnel, 6.0);

    vec2 grid = fract(vUv * 40.0);
    float gridLine = step(0.98, grid.x) + step(0.98, grid.y);
    gridLine = clamp(gridLine, 0.0, 1.0);

    float scanline = sin(vPosition.y * 100.0 - time * 3.0) * 0.5 + 0.5;
    scanline = smoothstep(0.4, 0.6, scanline);

    float intensity = fresnel * 0.25 + gridLine * 0.1 + scanline * 0.05;
    float opacity = 0.35 + bands * 0.3 + spotBase * 0.3 + fresnel * 0.15;
    opacity = clamp(opacity, 0.0, 1.0);

    vec3 finalColor = (jupiterColor * colorTint + jupiterColor * intensity) * 1.6;
    gl_FragColor = vec4(finalColor, opacity * 0.85);
  }
`;

/* ── HolographicJupiter — group rotation + wireframe overlay ───── */
function HolographicJupiter() {
  const materialRef = useRef(null);
  const planetRef = useRef(null);

  const uniforms = useMemo(() => ({
    time: { value: 0 },
    colorTint: { value: new THREE.Color(0xffffff) },
  }), []);

  useFrame((state) => {
    if (materialRef.current) materialRef.current.uniforms.time.value = state.clock.elapsedTime;
    if (planetRef.current) planetRef.current.rotation.y += 0.002;
  });

  return (
    <group ref={planetRef} scale={0.7}>
      <mesh>
        <sphereGeometry args={[2, 64, 64]} />
        <shaderMaterial
          ref={materialRef}
          transparent={true}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.005, 32, 32]} />
        <meshBasicMaterial
          color="#d95a00"
          wireframe={true}
          transparent={true}
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/* ══════════════════════════════════════════════════════════════════
   HoloJupiter — drop-in replacement for the Jupiter HologramPlanet
   Accepts the same size (vmin) and handles its own Canvas
   ══════════════════════════════════════════════════════════════════ */
const HoloJupiter = ({ size }) => {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      overflow: 'hidden',
      pointerEvents: 'none',
    }}>
      {/* Depth shadow behind sphere */}
      <div style={{
        position: 'absolute',
        inset: '-8%',
        borderRadius: '50%',
        boxShadow: '0 0 40px rgba(245,158,11,0.15), 0 0 80px rgba(245,158,11,0.08)',
        pointerEvents: 'none',
      }} />

      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        style={{ width: '100%', height: '100%', display: 'block', pointerEvents: 'none' }}
        events={() => ({ enabled: false, priority: 0, compute: () => {} })}
        gl={{
          alpha: true,
          premultipliedAlpha: false,
          antialias: false,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: false,
          depth: false,
          stencil: false,
          precision: 'mediump',
        }}
        dpr={1}
      >
        <HolographicJupiter />
      </Canvas>
    </div>
  );
};

export default HoloJupiter;
