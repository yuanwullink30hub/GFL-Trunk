// RETIRED from DataPage 2026-06-12; pending owner decision (DEV_PATHGUIDE task 2/7).
// The 9-planet celestial view was replaced by the Deltawerken hypercube; this
// component currently has no importers. Kept in place until the owner confirms
// permanent deletion of the planet/celestial components.
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════════════════
   HOLO PLANET — Parameterized holographic planet shader
   Same GLSL baseline as HoloJupiter; colors, band frequency, spot
   position and strength are driven by per-planet uniforms.
   ═══════════════════════════════════════════════════════════════════ */

const PLANET_CONFIGS = {
  sun: {
    lightColor: [1.0,  0.65, 0.25],
    midColor:   [1.0,  0.42, 0.10],
    darkColor:  [0.72, 0.28, 0.06],
    spotColor:  [1.0,  0.78, 0.38],
    bandFreq: 0.9, spotStrength: 0.2,
    spotPos: [0.3, 0.2, 0.93],
    wireColor: '#e07820',
    glowColor: 'rgba(255,160,40,0.30)',
    rotSpeed: 0.001,
  },
  moon: {
    lightColor: [1.0,  0.95, 0.74],
    midColor:   [0.95, 0.82, 0.44],
    darkColor:  [0.75, 0.60, 0.26],
    spotColor:  [0.88, 0.72, 0.35],
    bandFreq: 1.2, spotStrength: 0.28,
    spotPos: [0.6, -0.3, 0.7],
    wireColor: '#fde68a',
    glowColor: 'rgba(253,230,138,0.12)',
    rotSpeed: 0.002,
  },
  venus: {
    lightColor: [0.92, 0.47, 0.14],
    midColor:   [0.68, 0.26, 0.05],
    darkColor:  [0.35, 0.14, 0.03],
    spotColor:  [0.82, 0.54, 0.20],
    bandFreq: 0.6, spotStrength: 0.85,
    spotPos: [0.2, 0.1, 0.97],
    wireColor: '#b5600a',
    glowColor: 'rgba(190,100,15,0.18)',
    rotSpeed: 0.0008,
  },
  mars: {
    lightColor: [1.0,  0.38, 0.13],
    midColor:   [0.85, 0.22, 0.07],
    darkColor:  [0.42, 0.09, 0.04],
    spotColor:  [0.30, 0.06, 0.02],
    bandFreq: 0.8, spotStrength: 1.2,
    spotPos: [-0.3, 0.2, 0.93],
    wireColor: '#c0392b',
    glowColor: 'rgba(200,50,20,0.18)',
    rotSpeed: 0.0015,
  },
  mercury: {
    lightColor: [0.82, 0.78, 0.70],
    midColor:   [0.48, 0.50, 0.62],
    darkColor:  [0.28, 0.30, 0.45],
    spotColor:  [0.95, 0.95, 0.92],
    bandFreq: 0.5, spotStrength: 1.1,
    spotPos: [-0.2, 0.3, 0.93],
    wireColor: '#8899bb',
    glowColor: 'rgba(140,150,180,0.10)',
    rotSpeed: 0.0005,
  },
  jupiter: {
    lightColor: [0.98, 0.92, 0.85],
    midColor:   [0.85, 0.55, 0.30],
    darkColor:  [0.50, 0.25, 0.10],
    spotColor:  [0.70, 0.20, 0.10],
    bandFreq: 1.0, spotStrength: 1.0,
    spotPos: [0.6, -0.3, 0.7],
    wireColor: '#d95a00',
    glowColor: 'rgba(245,158,11,0.15)',
    rotSpeed: 0.002,
  },
  saturn: {
    lightColor: [0.78, 0.62, 0.30],
    midColor:   [0.58, 0.42, 0.15],
    darkColor:  [0.38, 0.25, 0.08],
    spotColor:  [0.65, 0.50, 0.22],
    bandFreq: 1.2, spotStrength: 0.28,
    spotPos: [0.6, -0.3, 0.7],
    wireColor: '#a08830',
    glowColor: 'rgba(180,150,60,0.13)',
    ringColor: '253, 230, 138',
    rotSpeed: 0.0018,
  },
  uranus: {
    lightColor: [0.35, 0.65, 1.0],
    midColor:   [0.15, 0.38, 0.92],
    darkColor:  [0.05, 0.14, 0.54],
    spotColor:  [0.50, 0.75, 1.0],
    bandFreq: 1.1, spotStrength: 0.9,
    spotPos: [-0.5, -0.2, 0.84],
    wireColor: '#2563eb',
    glowColor: 'rgba(37,99,235,0.15)',
    rotSpeed: 0.0012,
  },
  neptune: {
    lightColor: [0.76, 0.95, 1.0],
    midColor:   [0.35, 0.80, 0.97],
    darkColor:  [0.10, 0.52, 0.75],
    spotColor:  [0.62, 0.92, 1.0],
    bandFreq: 0.7, spotStrength: 0.3,
    spotPos: [0.3, 0.4, 0.87],
    wireColor: '#38bdf8',
    glowColor: 'rgba(56,189,248,0.15)',
    rotSpeed: 0.0016,
  },
};

/* ── Shared GLSL ─────────────────────────────────────────────────── */
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
  uniform vec3  colorLight;
  uniform vec3  colorMid;
  uniform vec3  colorDark;
  uniform vec3  colorSpot;
  uniform float bandFreq;
  uniform float spotStrength;
  uniform vec3  spotPosU;

  // 3-D Simplex Noise
  vec3 mod289v3(vec3 x){ return x - floor(x*(1.0/289.0))*289.0; }
  vec4 mod289v4(vec4 x){ return x - floor(x*(1.0/289.0))*289.0; }
  vec4 permute(vec4 x){ return mod289v4(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159-0.85373472095314*r; }
  float snoise(vec3 v){
    const vec2 C=vec2(1.0/6.0,1.0/3.0);
    const vec4 D=vec4(0.0,0.5,1.0,2.0);
    vec3 i =floor(v+dot(v,C.yyy));
    vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz);
    vec3 l=1.0-g;
    vec3 i1=min(g.xyz,l.zxy);
    vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx;
    vec3 x2=x0-i2+C.yyy;
    vec3 x3=x0-D.yyy;
    i=mod289v3(i);
    vec4 p=permute(permute(permute(
      i.z+vec4(0.0,i1.z,i2.z,1.0))
      +i.y+vec4(0.0,i1.y,i2.y,1.0))
      +i.x+vec4(0.0,i1.x,i2.x,1.0));
    float n_=0.142857142857;
    vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.0*floor(p*ns.z*ns.z);
    vec4 x_=floor(j*ns.z);
    vec4 y_=floor(j-7.0*x_);
    vec4 x=x_*ns.x+ns.yyyy;
    vec4 y=y_*ns.x+ns.yyyy;
    vec4 h=1.0-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy);
    vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.0+1.0;
    vec4 s1=floor(b1)*2.0+1.0;
    vec4 sh=-step(h,vec4(0.0));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
    vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x);
    vec3 p1=vec3(a0.zw,h.y);
    vec3 p2=vec3(a1.xy,h.z);
    vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
    vec4 m=max(0.5-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
    m=m*m;
    return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }

  void main(){
    vec3 pos=normalize(vPosition);

    // Multi-layered turbulence
    float turbulence=snoise(pos*2.0+time*0.05)*0.5;
    turbulence+=snoise(pos*4.0-time*0.08)*0.25;
    turbulence+=snoise(pos*8.0+time*0.12)*0.125;

    float y=vPosition.y+turbulence*0.5;

    // Parametric banding
    float band1=sin(y*6.0*bandFreq+turbulence*0.5);
    float band2=sin(y*12.0*bandFreq-turbulence*0.8);
    float band3=sin(y*24.0*bandFreq+turbulence*1.2);
    float band4=snoise(vec3(pos.x*2.0,y*15.0*bandFreq,pos.z*2.0))*0.5;
    float bands=band1*0.4+band2*0.3+band3*0.2+band4*0.1;
    bands=bands*0.5+0.5;

    // Elliptical feature spot
    vec3 scaledPos=pos; scaledPos.y*=1.6;
    vec3 scaledCenter=spotPosU; scaledCenter.y*=1.6;
    float ellipticalDist=distance(scaledPos,scaledCenter);
    float spotTurb=snoise(pos*10.0+time*0.2)*0.05;
    float spotBase=smoothstep(0.4,0.1,ellipticalDist+spotTurb)*spotStrength;
    float spotCore=smoothstep(0.15,0.05,ellipticalDist+spotTurb)*spotStrength;

    // Secondary vortices (scale with spotStrength)
    float sec=0.0;
    vec3 s2=normalize(vec3(-0.5,0.2,0.8));
    vec3 s3=normalize(vec3(0.2,0.5,-0.9));
    sec+=smoothstep(0.2,0.05,distance(pos,s2)+snoise(pos*15.0)*0.05)*spotStrength*0.5;
    sec+=smoothstep(0.15,0.02,distance(pos,s3)+snoise(pos*20.0)*0.03)*spotStrength*0.3;

    // Surface color
    vec3 col=mix(colorDark,colorLight,bands);
    col=mix(col,colorMid,pow(bands,2.0));
    col=mix(col,mix(colorSpot*1.2,colorSpot*0.6,spotCore),spotBase);
    col=mix(col,colorLight*0.8,sec);

    // Holographic overlay
    float fresnel=clamp(1.0-abs(dot(vNormal,vec3(0.0,0.0,1.0))),0.0,1.0);
    fresnel=pow(fresnel,6.0);
    vec2 grid=fract(vUv*32.0);
    float gridLine=clamp(smoothstep(0.93,1.0,grid.x)+smoothstep(0.93,1.0,grid.y),0.0,1.0);
    float scanline=smoothstep(0.4,0.6,sin(vPosition.y*60.0-time*3.0)*0.5+0.5);
    float intensity=fresnel*0.25+gridLine*0.06+scanline*0.03;
    float opacity=clamp(0.35+bands*0.3+spotBase*0.3+fresnel*0.15,0.0,1.0);

    vec3 finalColor=(col+col*intensity)*1.6;
    gl_FragColor=vec4(finalColor,opacity*0.85);
  }
`;

/* ── R3F inner component ─────────────────────────────────────────── */
function HolographicSphere({ type, tilt }) {
  const config = PLANET_CONFIGS[type] || PLANET_CONFIGS.jupiter;
  const materialRef = useRef(null);
  const planetRef   = useRef(null);
  const tiltRad = (tilt || 0) * Math.PI / 180;

  const uniforms = useMemo(() => ({
    time:          { value: 0 },
    colorLight:    { value: new THREE.Color(config.lightColor[0], config.lightColor[1], config.lightColor[2]) },
    colorMid:      { value: new THREE.Color(config.midColor[0],   config.midColor[1],   config.midColor[2])   },
    colorDark:     { value: new THREE.Color(config.darkColor[0],  config.darkColor[1],  config.darkColor[2])  },
    colorSpot:     { value: new THREE.Color(config.spotColor[0],  config.spotColor[1],  config.spotColor[2])  },
    bandFreq:      { value: config.bandFreq },
    spotStrength:  { value: config.spotStrength },
    spotPosU:      { value: new THREE.Vector3(config.spotPos[0], config.spotPos[1], config.spotPos[2]).normalize() },
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((state) => {
    if (materialRef.current) materialRef.current.uniforms.time.value = state.clock.elapsedTime;
    if (planetRef.current)   planetRef.current.rotation.y += config.rotSpeed;
  });

  return (
    <group ref={planetRef} scale={0.7} rotation={[0, 0, tiltRad]}>
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
        <sphereGeometry args={[2.005, type === 'mercury' ? 24 : ['moon','mars'].includes(type) ? 34 : 48, type === 'mercury' ? 24 : ['moon','mars'].includes(type) ? 34 : 48]} />
        <meshBasicMaterial
          color={config.wireColor}
          wireframe={true}
          transparent={true}
          opacity={type === 'sun' ? 0.09 : 0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/* ══════════════════════════════════════════════════════════════════
   HoloPlanet — drop-in Canvas wrapper, one per celestial body.
   Pointer events disabled so the parent div handles clicks.
   ══════════════════════════════════════════════════════════════════ */
const HoloPlanet = ({ type, tilt }) => {
  const config = PLANET_CONFIGS[type] || PLANET_CONFIGS.jupiter;
  const shadowColor = type === 'sun'
    ? config.glowColor
    : config.glowColor.replace(/([\d.]+)\)$/, (_, a) => `${(parseFloat(a) * 0.7).toFixed(2)})`);
  return (
    <div style={{
      position: 'absolute', inset: 0,
      width: '100%', height: '100%',
      pointerEvents: 'none',
    }}>
      {/* Drop shadow — own div, 80% size, behind everything */}
      <div style={{
        position: 'absolute', inset: '15%',
        borderRadius: '50%',
        boxShadow: `0 0 14px 3px ${shadowColor}`,
        pointerEvents: 'none',
      }} />
      {/* Sphere canvas — full size */}
      <div style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        borderRadius: '50%', overflow: 'hidden',
        pointerEvents: 'none',
      }}>
        {/* Ambient glow halo behind sphere */}
        <div style={{
          position: 'absolute', inset: '-8%',
          borderRadius: '50%',
          boxShadow: `0 0 40px ${config.glowColor}, 0 0 80px ${config.glowColor}`,
          pointerEvents: 'none',
        }} />
        <Canvas
          camera={{ position: [0, 0, 5], fov: 45 }}
          style={{ width: '100%', height: '100%', display: 'block', pointerEvents: 'none' }}
          events={() => ({ enabled: false, priority: 0, compute: () => {} })}
          gl={{
            alpha: true,
            premultipliedAlpha: false,
            antialias: true,
            powerPreference: 'high-performance',
            preserveDrawingBuffer: false,
            depth: false,
            stencil: false,
            precision: 'highp',
          }}
          dpr={[1, 1.5]}
        >
          <HolographicSphere type={type} tilt={tilt} />
        </Canvas>
      </div>
    </div>
  );
};

export default HoloPlanet;
