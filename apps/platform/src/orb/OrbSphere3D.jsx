import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * <OrbSphere3D config active size /> — the true-3D liquid-crystal orb.
 * Ported verbatim from orb_3d_prototype.html: a spherical-harmonics-displaced icosphere
 * (cymatic ℓ,m + displacement), iridescent birefringence ramp (breaking), nested-fractal
 * mandalas (harmony/friction), 3 nested shells for surface↔depth (radial), faceting
 * (density), and Earth-like obliquity + precession + spin (rotation). Drop-in for <OrbCanvas>.
 */

// ── exact shaders from orb_3d_prototype.html ──
const VERT = /* glsl */`
uniform float uL,uM,uH,uHB,uAmp,uT,uR,uTime,uShellR,uDepth,uPulseRate;
varying vec3 vNormalW; varying vec3 vViewDir; varying float vDisp; varying vec3 vPos;
float shTerm(vec3 p, float l, float m){
  float theta = acos(clamp(p.y,-1.0,1.0));
  float phi   = atan(p.z, p.x);
  return cos(l*theta)*cos(m*phi);
}
float theta_dummy(vec3 p){ return acos(clamp(p.y,-1.0,1.0)); }
void main(){
  vec3 p = normalize(position);
  float d1 = shTerm(p, uL, uM);
  float disp = d1;
  float BASE = 0.13;
  float freqComp = 1.0 / (1.0 + (uL-1.0)*0.18);
  float ampEff = (BASE + uAmp*(1.0-BASE)) * (1.0 - 0.45*uAmp) * freqComp;
  float d = disp * ampEff;
  // AFFECTIVE PULSE (dev-build §7.1): turbulence (uT, "how much") + affect-depth ("how deep,
  // signed") beat TOGETHER at ONE shared rate. uPulseRate is the group's cost-curve tempo preset.
  float pt = uTime * uPulseRate;
  d += uT*0.04*sin(uL*theta_dummy(p)+pt*1.3)*cos(uM*atan(p.z,p.x)-pt);
  // affect-depth: signed emotional-depth breath — flood(+) swells the surface, seal(−) draws it
  // inward — on the SAME beat, so turbulence and depth pulse as one bond.
  d += uDepth*0.06*sin(pt)*(0.35 + 0.65*abs(disp));
  vDisp = d;
  vec3 displaced = p * (uShellR + d);
  vPos = displaced;
  vec4 wp = modelMatrix * vec4(displaced,1.0);
  vNormalW = normalize(mat3(modelMatrix)*p);
  vViewDir = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const FRAG = /* glsl */`
precision highp float;
uniform float uB, uTime, uFractal, uShell, uR, uHarmony, uDensity;
uniform vec3 uC0,uC1,uC2,uC3,uC4;
varying vec3 vNormalW; varying vec3 vViewDir; varying float vDisp; varying vec3 vPos;
vec3 ramp(float t){
  t=clamp(t,0.0,1.0)*4.0;
  if(t<1.0) return mix(uC0,uC1,t);
  if(t<2.0) return mix(uC1,uC2,t-1.0);
  if(t<3.0) return mix(uC2,uC3,t-2.0);
  return mix(uC3,uC4,t-3.0);
}
mat2 rot2(float a){ float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
float nestedFractal(vec3 p, float harmony){
  float nfold = 6.0;
  float seg = 6.28318530718 / nfold;
  vec2 z0 = p.xy*1.6 + p.zz*0.4;
  float TILE = 2.3;
  vec2 zt = z0*TILE;
  vec2 tri = abs(fract(zt*0.5)*2.0 - 1.0);
  vec2 zc = (tri - 0.5);
  vec2 crease = smoothstep(0.0, 0.12, tri) * smoothstep(0.0, 0.12, 1.0-tri);
  float seamSoft = min(crease.x, crease.y);
  vec2 z = mix(z0, zc, harmony);
  float hLocal = harmony * mix(0.55, 1.0, seamSoft);
  float acc = 0.0;
  float w = 0.6;
  for(int i=0;i<5;i++){
    vec2 zFlame = abs(z);
    zFlame = zFlame*1.9 - 0.7;
    zFlame = rot2(0.6)*zFlame;
    float a = atan(z.y, z.x);
    float r = length(z);
    a = abs(mod(a, seg) - seg*0.5);
    r = r*1.7;
    vec2 zKal = vec2(cos(a), sin(a)) * r;
    z = mix(zFlame, zKal, hLocal);
    float ra = length(z);
    float aa = atan(z.y, z.x);
    acc += w * ( sin(ra*4.5) + hLocal * cos(6.0*aa) * 0.7 );
    w *= 0.62;
  }
  return acc;
}
void main(){
  float ndv = abs(dot(normalize(vNormalW), normalize(vViewDir)));
  float nodal = abs(vDisp);
  float seamRaw = 1.0 - smoothstep(0.0, 0.18, nodal);
  float seam = pow(seamRaw, 1.6);
  float dEff = clamp(uDensity, 0.0, 1.0);
  float crease = seam * dEff;
  float ndvF = ndv * (1.0 - 0.55*crease);
  float uBEff = 0.85 + (uB-0.5) * (3.0-0.5)/(4.20-0.5);
  float base = (1.0-ndv)*uBEff + vDisp*1.5 + 0.05*sin(uTime);
  vec3 cp = vPos*1.0 + vDisp*0.6;
  cp.xy = rot2(uTime*0.04)*cp.xy;
  float hShaped = pow(clamp(uHarmony,0.0,1.0), 0.6);
  float frac = nestedFractal(cp, hShaped);
  float FBASE = 0.15;
  float fracEff = FBASE + uFractal*(1.0-FBASE);
  float idx = mix(base, base*0.5 + frac*0.5, fracEff);
  float IDXSCALE = 0.833;
  float retard = fract( idx*IDXSCALE );
  vec3 col = ramp(retard);
  float shade = 0.4 + 0.6*ndvF;
  float rim = pow(1.0-ndv, 2.5);
  col = col*shade + col*rim*0.3;
  float seamMul = 1.0 - 0.7*crease;
  seamMul = max(seamMul, 0.55);
  col *= seamMul;
  float uRvis = (uR < 0.0) ? uR*0.8 : uR;
  float target = (uRvis*0.5)+0.5;
  float shellMatch = 1.0 - abs(uShell - target);
  float depth = 0.25 + shellMatch;
  float shellAlpha = clamp(0.45 + 0.4*depth, 0.35, 1.0);
  float brightEff = 1.15 + 0.35*uDensity;
  col *= brightEff;
  gl_FragColor = vec4(col, shellAlpha);
}`;

const SHELLS = [{ r: 0.82, idx: 0.0 }, { r: 0.91, idx: 0.5 }, { r: 1.0, idx: 1.0 }];
const OBLIQUITY = 38 * Math.PI / 180;
const PREC = 1 / 9;

// Raw sRGB [0,1] (NOT THREE.Color, which would linear-convert in r160) so the custom shader's
// output matches the r128 prototype 1:1.
function hexToVec3(hex) {
  const n = parseInt(String(hex || '#000').replace('#', ''), 16);
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

function Orb({ cfgRef, activeRef }) {
  const groupRef = useRef();
  const spin = useRef(0), prec = useRef(0);
  const lastColors = useRef(null), parsed = useRef([]);

  const geo = useMemo(() => new THREE.IcosahedronGeometry(1, 24), []);

  const shells = useMemo(() => SHELLS.map((s) => {
    const uniforms = {
      uL: { value: 3 }, uM: { value: 5 }, uAmp: { value: 0.2 }, uT: { value: 2.6 }, uB: { value: 1.9 },
      uR: { value: 0.7 }, uFractal: { value: 0 }, uHarmony: { value: 0.05 }, uDensity: { value: 0.42 },
      uDepth: { value: 0 }, uPulseRate: { value: 1.0 },
      uTime: { value: 0 }, uShell: { value: s.idx }, uShellR: { value: s.r }, uH: { value: 0 }, uHB: { value: 0 },
      uC0: { value: new THREE.Vector3() }, uC1: { value: new THREE.Vector3() }, uC2: { value: new THREE.Vector3() },
      uC3: { value: new THREE.Vector3() }, uC4: { value: new THREE.Vector3() },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms, vertexShader: VERT, fragmentShader: FRAG,
      transparent: true, depthWrite: true, blending: THREE.NormalBlending,
    });
    return { mat, uniforms };
  }), []);

  useFrame((_, dt) => {
    const cfg = cfgRef.current;
    if (!cfg || !activeRef.current) return;
    const d = Math.min(0.05, dt);

    if (cfg.colors !== lastColors.current) {
      lastColors.current = cfg.colors;
      parsed.current = (cfg.colors || []).map(hexToVec3);
    }
    const cols = parsed.current;

    for (const sh of shells) {
      const u = sh.uniforms;
      u.uL.value = cfg.cymaticL; u.uM.value = cfg.cymaticM; u.uAmp.value = cfg.displacement;
      u.uT.value = cfg.tension; u.uB.value = cfg.breaking; u.uR.value = cfg.radial;
      u.uFractal.value = cfg.friction; u.uHarmony.value = cfg.harmony; u.uDensity.value = cfg.density;
      u.uDepth.value = cfg.depth || 0;
      u.uPulseRate.value = cfg.pulse || 1.0;   // per-group cost-curve tempo (§5c); lab default 1.0
      u.uTime.value += d;
      if (cols.length === 5) {
        u.uC0.value.copy(cols[0]); u.uC1.value.copy(cols[1]); u.uC2.value.copy(cols[2]);
        u.uC3.value.copy(cols[3]); u.uC4.value.copy(cols[4]);
      }
    }

    const rotSpeed = 0.35 + (cfg.rotation || 0) * (cfg.rotation || 0) * 0.352;
    const dir = cfg.dir < 0 ? -1 : 1;   // cymatic direction: co(+) / anti(−) → spin sense
    spin.current += rotSpeed * d * dir;
    prec.current += rotSpeed * PREC * d;
    if (groupRef.current) {
      const qP = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), prec.current);
      const qT = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), OBLIQUITY);
      const qS = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), spin.current);
      groupRef.current.quaternion.copy(qP.multiply(qT).multiply(qS));
    }
  });

  return (
    <group ref={groupRef}>
      {shells.map((sh, i) => <mesh key={i} geometry={geo} material={sh.mat} />)}
    </group>
  );
}

export default function OrbSphere3D({ config, active = true, size = 540, style, className, capturable = false, dprOverride }) {
  const cfgRef = useRef(config); cfgRef.current = config;
  const activeRef = useRef(active); activeRef.current = active;
  // dprOverride forces an exact pixel resolution (used by the capture orb for FHD downloads).
  const dpr = dprOverride != null ? dprOverride : (typeof window !== 'undefined' ? Math.min(2, window.devicePixelRatio || 1) : 1);

  // Layout footprint stays `size`, but the CANVAS is drawn 1.35× larger and OVERFLOWS its box
  // symmetrically (parents are overflow:visible). Same-size orb, more render room around it, so
  // the SH displacement can bulge without the canvas edge clipping it. Fixed camera → consistent
  // base-orb size across presets; frame half-height ≈ 1.9 at z=4.95 fits the tallest bumps.
  const CANVAS_SCALE = 1.35;
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', overflow: 'visible', flexShrink: 0, ...style }}>
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: size * CANVAS_SCALE, height: size * CANVAS_SCALE, transform: 'translate(-50%, -50%)' }}>
        <Canvas
          frameloop={active ? 'always' : 'demand'}
          camera={{ position: [0, 0, 4.95], fov: 42 }}
          dpr={dpr}
          gl={{ alpha: true, antialias: true, premultipliedAlpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: capturable }}
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          <Orb cfgRef={cfgRef} activeRef={activeRef} />
        </Canvas>
      </div>
    </div>
  );
}
