import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { renderOrbFrame } from './orbRender';

/**
 * <OrbSphere config={…} active size /> — the liquid-crystal orb as a real 3D sphere.
 * The tuned 2D pattern (renderOrbFrame) is drawn to an offscreen canvas and used as a live
 * texture on a sphere whose UVs bake the front-projection (visible hemisphere → pattern disc).
 * A standard meshBasicMaterial handles colour management (round-trips to the exact 2D
 * brightness — no custom-shader darkness), and a separate additive fresnel pass adds the
 * glass rim. Drop-in replacement for <OrbCanvas> (same props).
 */

const TEX = 512;

// Fresnel rim — a glassy edge glow. No texture, so no colour-management concerns.
const RIM_VERT = /* glsl */`
  varying vec3 vN;
  void main() { vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const RIM_FRAG = /* glsl */`
  precision highp float;
  varying vec3 vN;
  void main() {
    float f = pow(1.0 - clamp(normalize(vN).z, 0.0, 1.0), 3.0);
    gl_FragColor = vec4(vec3(0.45, 0.36, 0.78) * f, f);
  }
`;

function OrbMeshes({ cfgRef, activeRef }) {
  const time = useRef(0);

  const { texture, ctx } = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = TEX; c.height = TEX;
    const context = c.getContext('2d');
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace; // standard colour texture — meshBasicMaterial round-trips it
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    return { texture: tex, ctx: context };
  }, []);

  // Sphere with the front-projection baked into UVs: unit sphere → position == normal, so
  // uv = (x,y)*0.5+0.5 maps the visible hemisphere onto the circular pattern disc.
  const geo = useMemo(() => {
    const g = new THREE.SphereGeometry(1, 96, 96);
    const pos = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) * 0.5 + 0.5, pos.getY(i) * 0.5 + 0.5);
    uv.needsUpdate = true;
    return g;
  }, []);

  const rimMat = useMemo(() => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: RIM_VERT, fragmentShader: RIM_FRAG,
  }), []);

  useFrame((_, dt) => {
    const config = cfgRef.current;
    if (!config || !activeRef.current) return;
    const speed = config.flowSpeed <= 0.9 ? config.flowSpeed : 0.9 + (config.flowSpeed - 0.9) * 0.625;
    time.current += speed * 0.9 * Math.min(dt, 0.1);
    renderOrbFrame(ctx, config, TEX, TEX, time.current, true); // full tuned pattern incl. baked shading
    texture.needsUpdate = true;
  });

  return (
    <group>
      <mesh geometry={geo}>
        {/* toneMapped:false so R3F's ACES doesn't darken it — meshBasicMaterial shows the map 1:1 */}
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      <mesh geometry={geo} material={rimMat} scale={1.004} />
    </group>
  );
}

export default function OrbSphere({ config, active = true, size = 540, style, className }) {
  const cfgRef = useRef(config); cfgRef.current = config;
  const activeRef = useRef(active); activeRef.current = active;
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 1.5) : 1;

  return (
    <div className={className} style={{ width: size, height: size, display: 'block', ...style }}>
      <Canvas
        frameloop={active ? 'always' : 'demand'}
        camera={{ position: [0, 0, 3.0], fov: 40 }}
        dpr={dpr}
        gl={{ alpha: true, antialias: true, premultipliedAlpha: false, powerPreference: 'high-performance' }}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <OrbMeshes cfgRef={cfgRef} activeRef={activeRef} />
      </Canvas>
    </div>
  );
}
