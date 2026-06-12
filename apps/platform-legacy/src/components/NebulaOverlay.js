import React, { useRef, useEffect } from 'react';

/**
 * NebulaOverlay — Foreground gas layer with paint-stirring mouse physics
 *
 * Two-pass ping-pong FBO system matching NebulaBackground architecture:
 *   Pass 1 — Displacement update: mouse velocity → permanent paint trails
 *   Pass 2 — Nebula render: 3 drifting/rotating gaussians with displacement parallax
 *
 * Renders with alpha transparency so it layers in front of HoloEarth / planets.
 * Colors: amber / purple / violet — matching the 3 gaussian identities.
 */

const VERT = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// ─── Pass 1: Displacement field update (ping-pong) ─────────────────────
const DISP_FRAG = `
  precision mediump float;

  uniform sampler2D u_prev;
  uniform vec2  u_res;
  uniform vec2  u_mouse;
  uniform vec2  u_mousePrev;
  uniform float u_mouseSpeed;
  uniform float u_aspect;

  float segDist(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
    return length(pa - ba * h);
  }

  vec2 segClosest(vec2 p, vec2 a, vec2 b) {
    vec2 ba = b - a;
    float h = clamp(dot(p - a, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
    return a + ba * h;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_res;
    vec2 texel = 1.0 / u_res;

    vec2 cur = texture2D(u_prev, uv).xy * 2.0 - 1.0;

    vec2 rt = texture2D(u_prev, uv + vec2(texel.x, 0.0)).xy * 2.0 - 1.0;
    vec2 lt = texture2D(u_prev, uv - vec2(texel.x, 0.0)).xy * 2.0 - 1.0;
    vec2 up = texture2D(u_prev, uv + vec2(0.0, texel.y)).xy * 2.0 - 1.0;
    vec2 dn = texture2D(u_prev, uv - vec2(0.0, texel.y)).xy * 2.0 - 1.0;
    vec2 avg = (rt + lt + up + dn) * 0.25;
    vec2 diffused = mix(cur, avg, 0.025);

    if (u_mouseSpeed > 0.0001) {
      vec2 uvA  = uv          * vec2(u_aspect, 1.0);
      vec2 mA   = u_mouse     * vec2(u_aspect, 1.0);
      vec2 mpA  = u_mousePrev * vec2(u_aspect, 1.0);

      float dist = segDist(uvA, mpA, mA);

      float brushR = 0.035 + u_mouseSpeed * 1.2;
      brushR = min(brushR, 0.10);

      float falloff = 1.0 - smoothstep(0.0, brushR, dist);
      falloff = falloff * falloff;

      vec2 moveDir = u_mouse - u_mousePrev;
      float spd = length(moveDir);
      vec2 dir = spd > 1e-5 ? moveDir / spd : vec2(0.0);

      float str = max(0.010, min(spd * 6.0, 0.045));

      vec2 push = dir * falloff * str;

      vec2 closestA = segClosest(uvA, mpA, mA);
      vec2 radDir = uvA - closestA;
      float radLen = length(radDir);
      if (radLen > 0.001) {
        vec2 rn = radDir / radLen;
        rn.x /= u_aspect;
        push += normalize(rn) * falloff * str * 0.4;
      }

      diffused += push;
    }

    diffused *= 0.9997;
    diffused = clamp(diffused, vec2(-0.5), vec2(0.5));

    gl_FragColor = vec4(diffused * 0.5 + 0.5, 0.0, 1.0);
  }
`;

// ─── Pass 2: Overlay nebula with displacement + full gaussian dynamics ──
const OVERLAY_FRAG = `
  precision highp float;

  uniform float     u_time;
  uniform vec2      u_resolution;
  uniform sampler2D u_disp;
  uniform vec2      u_offset;
  uniform float     u_opacity;

  float hash(vec2 p) {
    p = fract(p * vec2(443.8975, 397.2973));
    p += dot(p, p + 19.19);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    float va = hash(i + vec2(0.0, 0.0));
    float vb = hash(i + vec2(1.0, 0.0));
    float vc = hash(i + vec2(0.0, 1.0));
    float vd = hash(i + vec2(1.0, 1.0));
    return mix(mix(va, vb, u.x), mix(vc, vd, u.x), u.y);
  }

  float fbm(vec2 p) {
    float v = 0.0, a = 0.5, f = 1.0;
    for (int i = 0; i < 2; i++) {
      v += a * noise(p * f);
      f *= 2.1; a *= 0.48;
    }
    return v;
  }

  float ridgeNoise(vec2 p) {
    return 1.0 - abs(noise(p) * 2.0 - 1.0);
  }

  float ridgeFbm(vec2 p) {
    float v = 0.0, a = 0.5, f = 1.0;
    for (int i = 0; i < 2; i++) {
      v += a * ridgeNoise(p * f);
      f *= 2.2; a *= 0.45;
    }
    return v;
  }

  float warpedFbm(vec2 p, float t) {
    vec2 q = vec2(fbm(p + 0.05 * t), fbm(p + vec2(5.2, 1.3) + 0.065 * t));
    vec2 r = vec2(
      fbm(p + 2.0 * q + vec2(1.7, 9.2) + 0.035 * t),
      fbm(p + 2.0 * q + vec2(8.3, 2.8) + 0.04 * t)
    );
    float base = fbm(p + 2.0 * r);
    float ridge = ridgeFbm(p + 1.8 * r + 0.02 * t);
    return mix(base, ridge, 0.45);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;
    aspect = max(aspect, 0.9);

    // Read accumulated displacement from FBO
    vec2 disp = texture2D(u_disp, uv).xy * 2.0 - 1.0;

    float t = u_time * 0.07;
    vec2 mapOff = u_offset * vec2(1.0, -1.0);

    // Parallax-depth per layer — higher factors so overlay scrolls ~1:1 with map content
    vec2 p1 = (uv + disp * 0.18 - 0.5) * vec2(aspect, 1.0) + mapOff * 0.7;
    vec2 p2 = (uv + disp * 0.32 - 0.5) * vec2(aspect, 1.0) + mapOff * 0.85;
    vec2 p3 = (uv + disp * 0.48 - 0.5) * vec2(aspect, 1.0) + mapOff * 1.0;

    // ── Edge distortion: strong wavy contours ──
    float edgeWarp = fbm(p1 * 4.5 + vec2(7.3, 2.1) + t * 0.04) * 0.22 - 0.11;
    float edgeWarp2 = fbm(p1 * 6.0 + vec2(3.7, 8.4) + t * 0.03) * 0.18 - 0.09;
    float edgeWarp4 = fbm(p1 * 3.0 + vec2(4.8, 6.9) + t * 0.018) * 0.20 - 0.10;
    vec2 warpOffset = vec2(edgeWarp, edgeWarp2 + edgeWarp4);

    // ── Per-Gaussian 2D domain warp — breaks elliptical contours into organic shapes ──
    float _gA = noise(p1 * 5.5 + vec2(2.4, 9.1) + t * 0.033);
    float _gB = noise(p1 * 6.2 + vec2(8.8, 3.5) + t * 0.026);
    float _gC = noise(p1 * 4.8 + vec2(5.7, 12.3) + t * 0.030);
    float _gE = noise(p1 * 3.5 + vec2(14.1, 6.2) + t * 0.019);
    vec2 gwVecA   = (vec2(_gA, noise(p1 * 5.5 + vec2(11.3, 4.7) + t * 0.028)) - 0.5) * 0.30;
    vec2 gwVecB   = (vec2(_gB, noise(p1 * 6.2 + vec2(1.9, 10.6) + t * 0.022)) - 0.5) * 0.40;
    vec2 gwVecC   = (vec2(_gC, noise(p1 * 4.8 + vec2(9.4, 2.1)  + t * 0.025)) - 0.5) * 0.40;
    vec2 gwVecEnv = (vec2(_gE, noise(p1 * 3.5 + vec2(4.3, 11.8) + t * 0.015)) - 0.5) * 0.30;

    // ── Tiled gaussian field — 3×3 cell evaluation for infinite scrolling ──
    // Gaussian base centers (with sinusoidal drift)
    vec2 centerA = vec2(-0.03 + 0.06*sin(t*0.053), 0.08 + 0.05*sin(t*0.071));
    vec2 centerB = vec2( 0.12 + 0.07*sin(t*0.061 + 2.1), -0.04 + 0.05*sin(t*0.083 + 4.3));
    vec2 centerC = vec2(-0.10 + 0.05*sin(t*0.077 + 5.7), -0.10 + 0.06*sin(t*0.047 + 1.4));

    // Per-pixel noise warps (computed from non-tiled p1 — varies continuously)
    float gWarp1 = (noise(p1 * 3.5 + vec2(3.1, 8.7) + t * 0.03) - 0.5) * 0.28;
    float gWarp2 = (noise(p1 * 4.5 + vec2(11.2, 4.3) + t * 0.04) - 0.5) * 0.30;
    float gWarp3 = (noise(p1 * 3.0 + vec2(6.4, 1.9) + t * 0.025) - 0.5) * 0.25;

    // Cell grid — accumulate gaussians from 3×3 neighborhood
    float gCellSize = 1.3;
    vec2 cellBase = floor(p1 / gCellSize);

    float nebA = 0.0, nebB = 0.0, nebC = 0.0;
    float nebEnvelope = 0.0;

    for (int cy = -1; cy <= 1; cy++) {
      for (int cx = -1; cx <= 1; cx++) {
        vec2 cid = cellBase + vec2(float(cx), float(cy));
        vec2 cOrigin = (cid + 0.5) * gCellSize;  // cell center in world space
        vec2 lp = p1 - cOrigin;                   // local pos relative to cell center

        // Per-cell random offset so each cell's cluster is slightly different
        vec2 cellRand = (vec2(hash(cid * 127.1 + 311.7), hash(cid * 419.2 + 183.3)) - 0.5) * 0.12;

        // ── Envelope ──
        vec2 nEnv = lp + warpOffset * 0.5 + gwVecEnv - vec2(0.0, -0.02) + cellRand;
        float envD = nEnv.x * nEnv.x * 0.35 + nEnv.y * nEnv.y * 0.30;
        nebEnvelope += exp(-envD);

        // ── Gaussian A: magenta-purple ──
        vec2 nA = lp + warpOffset + gwVecA - centerA + cellRand;
        { float ca = 0.866, sa = 0.500; nA = vec2(ca*nA.x + sa*nA.y, -sa*nA.x + ca*nA.y); }
        float dA = nA.x * nA.x * 11.5 + nA.y * nA.y * 10.3;
        dA *= 1.0 + gWarp1;
        nebA += exp(-dA);

        // ── Gaussian B: warm orange ──
        vec2 nB = lp + warpOffset + gwVecB - centerB + cellRand;
        { float cb = 0.259, sb = 0.966; nB = vec2(cb*nB.x + sb*nB.y, -sb*nB.x + cb*nB.y); }
        float dB = nB.x * nB.x * 13.2 + nB.y * nB.y * 11.5;
        dB *= 1.0 + gWarp2;
        nebB += exp(-dB);

        // ── Gaussian C: violet ──
        vec2 nC = lp + warpOffset + gwVecC - centerC + cellRand;
        { float cc = 0.940, sc = -0.342; nC = vec2(cc*nC.x + sc*nC.y, -sc*nC.x + cc*nC.y); }
        float dC = nC.x * nC.x * 15.4 + nC.y * nC.y * 13.7;
        dC *= 1.0 + gWarp3;
        nebC += exp(-dC);
      }
    }

    // ── Noise-driven breakup — synced with background ──
    float breakup = warpedFbm(p1 * 2.8 + vec2(3.3, 7.7) + t * 0.3, t * 0.8);
    float breakupMask = smoothstep(0.18, 0.55, breakup);

    // Combined cloud mask — envelope excluded, steep falloff for concentrated blobs
    float rawCloud = nebA * 1.60 + nebB * 1.40 + nebC * 1.45;
    float cloudMask = clamp(rawCloud, 0.0, 1.0);
    cloudMask = pow(cloudMask, 2.0);
    cloudMask *= mix(0.85, 1.0, breakupMask);
    // Volume control — only affects final alpha, not internal color mixing
    float volumeScale = 0.65;

    // Quick exit if barely visible
    if (cloudMask < 0.02) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
      return;
    }

    // ── Sharpened weights with soft floor + noise redistribution ──
    float sA = nebA + 0.10;
    float sB = nebB + 0.10;
    float sC = nebC + 0.10;
    float cA = pow(sA, 2.5);
    float cB = pow(sB, 2.5);
    float cC = pow(sC, 2.5);
    float totalNeb = cA + cB + cC + 0.001;
    float wA = cA / totalNeb;
    float wB = cB / totalNeb;
    float wC = cC / totalNeb;

    // Noise-driven swirl so colors intermingle organically
    float hueNoise = fbm(p2 * 2.5 + vec2(13.7, 7.3) + t * 0.10);
    float hueSwirl = fbm(p1 * 1.8 + vec2(5.2, 9.1) + t * 0.11);
    float noiseShift = (hueNoise - 0.5) * 0.25 + (hueSwirl - 0.5) * 0.15;
    float shiftAC = clamp(noiseShift, -wA * 0.6, wC * 0.6);
    wA = max(wA - shiftAC, 0.0);
    wC = max(wC + shiftAC, 0.0);
    float wSum = wA + wB + wC + 0.001;
    wA /= wSum; wB /= wSum; wC /= wSum;

    // ── Volumetric noise layers ──
    float n2 = warpedFbm(p2 * 1.8 + vec2(3.1, 1.7) + vec2(t * 0.5, t * 0.14), t * 2.0);
    float n3 = warpedFbm(p3 * 2.5 + vec2(7.5, 3.2) + vec2(t * 0.20, t * 0.30), t * 1.4);
    float filament2 = ridgeFbm(p2 * 3.5 + vec2(2.0, 4.5) + t * 0.08);

    // ── Mid-layer color palettes (3 identities) ──

    // Magenta-purple mid (A) — lifted for vibrancy
    vec3 pMid = vec3(0.06, 0.008, 0.05);
    pMid = mix(pMid, vec3(0.15, 0.025, 0.13), smoothstep(0.12, 0.26, n2));
    pMid = mix(pMid, vec3(0.30, 0.055, 0.26), smoothstep(0.26, 0.42, n2));
    pMid = mix(pMid, vec3(0.48, 0.09, 0.40), smoothstep(0.42, 0.58, n2));
    pMid = mix(pMid, vec3(0.65, 0.16, 0.55), smoothstep(0.58, 0.74, n2));

    // Warm orange mid (B) — matching background
    vec3 aMid = vec3(0.04, 0.013, 0.004);
    aMid = mix(aMid, vec3(0.135, 0.047, 0.014), smoothstep(0.12, 0.26, n2));
    aMid = mix(aMid, vec3(0.30, 0.108, 0.027), smoothstep(0.26, 0.42, n2));
    aMid = mix(aMid, vec3(0.51, 0.20, 0.04), smoothstep(0.42, 0.58, n2));
    aMid = mix(aMid, vec3(0.62, 0.30, 0.08), smoothstep(0.58, 0.74, n2));

    // Violet mid (C) — shifted from blue toward true violet
    vec3 vMid = vec3(0.04, 0.012, 0.06);
    vMid = mix(vMid, vec3(0.10, 0.03, 0.16), smoothstep(0.12, 0.26, n2));
    vMid = mix(vMid, vec3(0.20, 0.06, 0.30), smoothstep(0.26, 0.42, n2));
    vMid = mix(vMid, vec3(0.32, 0.10, 0.45), smoothstep(0.42, 0.58, n2));
    vMid = mix(vMid, vec3(0.45, 0.16, 0.62), smoothstep(0.58, 0.74, n2));

    // Blend mid — per-gaussian additive for distinct 3-identity color
    vec3 midColor = pMid * wA + aMid * wB + vMid * wC;
    midColor *= (0.8 + 0.2 * filament2) * 1.8;
    float midMask = smoothstep(0.38, 0.62, n2) * cloudMask * (0.7 + 0.3 * filament2);

    // ── Bright emission cores (3 identities) ──

    // Purple bright (A) — lifted for vibrancy
    vec3 pBright = vec3(0.16, 0.03, 0.20);
    pBright = mix(pBright, vec3(0.32, 0.06, 0.38), smoothstep(0.25, 0.43, n3));
    pBright = mix(pBright, vec3(0.52, 0.12, 0.48), smoothstep(0.43, 0.60, n3));
    pBright = mix(pBright, vec3(0.75, 0.24, 0.65), smoothstep(0.60, 0.78, n3));

    // Orange bright (B) — matching background
    vec3 aBright = vec3(0.19, 0.054, 0.014);
    aBright = mix(aBright, vec3(0.40, 0.135, 0.027), smoothstep(0.25, 0.43, n3));
    aBright = mix(aBright, vec3(0.67, 0.30, 0.054), smoothstep(0.43, 0.60, n3));
    aBright = mix(aBright, vec3(0.80, 0.44, 0.14), smoothstep(0.60, 0.78, n3));

    // Violet bright (C) — shifted from blue toward true violet
    vec3 vBright = vec3(0.12, 0.025, 0.18);
    vBright = mix(vBright, vec3(0.24, 0.06, 0.36), smoothstep(0.25, 0.43, n3));
    vBright = mix(vBright, vec3(0.38, 0.12, 0.52), smoothstep(0.43, 0.60, n3));
    vBright = mix(vBright, vec3(0.55, 0.22, 0.72), smoothstep(0.60, 0.78, n3));

    float filament3 = ridgeFbm(p3 * 4.0 + vec2(1.3, 7.1) + t * 0.05);

    // Blend bright — per-gaussian additive
    vec3 brightColor = (pBright * wA + aBright * wB + vBright * wC) * 1.8;
    float brightMask = smoothstep(0.45, 0.68, n3) * smoothstep(0.38, 0.58, n2) * cloudMask * (0.6 + 0.4 * filament3);

    // ── Backlit rim glow — matching NebulaBackground ──
    float rimNoise = fbm(p3 * 3.0 + t * 0.06);
    float rim = smoothstep(0.68, 0.52, n3) * smoothstep(0.40, 0.55, n3) * cloudMask;
    rim = pow(rim, 1.2);
    vec3 rimPurple = mix(vec3(0.18, 0.04, 0.22), vec3(0.38, 0.10, 0.42), rimNoise);
    vec3 rimAmber  = mix(vec3(0.34, 0.108, 0.027), vec3(0.65, 0.216, 0.054), rimNoise);
    vec3 rimBlue   = mix(vec3(0.06, 0.06, 0.18), vec3(0.16, 0.18, 0.40), rimNoise);
    vec3 rimColor = (rimPurple * wA + rimAmber * wB + rimBlue * wC) * 1.8;

    // ── Filamentary edge emission — matching NebulaBackground Layer 4 ──
    float edge = abs(n2 - 0.5) * 2.0;
    float edgeGlow = smoothstep(0.58, 0.90, edge) * filament2 * cloudMask;
    vec3 edgePurple = mix(vec3(0.12, 0.02, 0.10), vec3(0.28, 0.06, 0.22), edge);
    vec3 edgeAmber  = mix(vec3(0.24, 0.081, 0.014), vec3(0.51, 0.189, 0.04), edge);
    vec3 edgeBlue   = mix(vec3(0.04, 0.04, 0.12), vec3(0.10, 0.12, 0.28), edge);
    vec3 edgeColor = (edgePurple * wA + edgeAmber * wB + edgeBlue * wC) * 1.8;

    // ── Compose — soft ambient base so edges glow instead of going black ──
    // Subtle colored base glow at cloud edges (like deep gas luminosity)
    vec3 baseGlow = (vec3(0.015, 0.005, 0.025) * wA + vec3(0.025, 0.010, 0.005) * wB + vec3(0.006, 0.008, 0.022) * wC) * cloudMask;
    vec3 color = baseGlow;

    color = mix(color, midColor, midMask * 0.70);
    color *= (1.0 - smoothstep(0.55, 0.75, ridgeFbm(p2 * 2.2 + vec2(5.5, 8.3) + t * 0.02)) * cloudMask * 0.35);
    color += rimColor * rim * 0.22;
    color = mix(color, brightColor, brightMask * 0.60);
    color += edgeColor * edgeGlow * 0.35;

    // ── Depth enhancement — matching NebulaBackground ──

    // Dark absorption lanes — wispy dust cutting through gas
    float dustDetail = ridgeFbm(p2 * 4.5 + vec2(11.3, 4.7) + t * 0.015);
    float voidMask = smoothstep(0.62, 0.80, dustDetail) * cloudMask;
    color *= (1.0 - voidMask * 0.25);

    // Hot emission highlights — bright peaks at densest cores
    float hotSpot = smoothstep(0.75, 0.88, n3) * smoothstep(0.62, 0.72, n2) * cloudMask;
    hotSpot = pow(hotSpot, 2.0);
    vec3 hotTint = mix(vec3(1.0, 0.82, 0.90), vec3(1.0, 0.95, 0.93), hotSpot);
    color += hotTint * hotSpot * 0.12;

    // Luminous filament wisps — thin bright edges where gas density changes
    float wisp = abs(n2 - 0.48) * 2.0;
    float wispGlow = smoothstep(0.82, 0.95, wisp) * smoothstep(0.35, 0.50, n2) * cloudMask * filament3;
    vec3 wispPurple = vec3(0.7, 0.5, 0.85);
    vec3 wispAmber  = vec3(0.9, 0.7, 0.5);
    vec3 wispBlue   = vec3(0.4, 0.5, 0.85);
    vec3 wispColor = wispPurple * wA + wispAmber * wB + wispBlue * wC;
    color += wispColor * wispGlow * 0.06;

    // S-curve contrast — lift shadows, keep highlights (matching background)
    vec3 cNorm = clamp(color * 2.8, 0.0, 1.0);
    float g = 1.08;
    vec3 curved = pow(cNorm, vec3(g)) / (pow(cNorm, vec3(g)) + pow(vec3(1.0) - cNorm, vec3(g)) + 0.001);
    color = mix(color, curved * 0.357, 0.20);

    // Breathing
    float breath = 0.88 + 0.12 * sin(t * 3.5 + fbm(p1 * 1.2 + vec2(0.0, t * 0.3)) * 3.0) + 0.05 * sin(t * 7.3 + n2 * 2.0);
    color *= breath;
    color *= 1.10;  // +10% brightness boost

    // Alpha — steep thresholds so only dense cores have opacity
    float lum = dot(color, vec3(0.299, 0.587, 0.114));
    float alpha = smoothstep(0.008, 0.06, lum) * cloudMask * u_opacity * volumeScale;
    alpha *= smoothstep(0.03, 0.12, cloudMask);

    gl_FragColor = vec4(color * alpha, alpha);  // premultiplied alpha
  }
`;

const NebulaOverlay = ({ mapPositionRef, opacity = 0.55, isVisible = true, isZoomedIn = false }) => {
  const wrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const mapPosRef = useRef({ x: 0, y: 0 });
  const isVisibleRef = useRef(isVisible);
  const renderFnRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const mousePrevRef = useRef({ x: -9999, y: -9999 });

  // Sync isVisible prop → ref, and restart/stop the rAF loop accordingly
  useEffect(() => {
    isVisibleRef.current = isVisible;
    if (isVisible && !animRef.current && renderFnRef.current) {
      animRef.current = requestAnimationFrame(renderFnRef.current);
    } else if (!isVisible && animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
  }, [isVisible]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      preserveDrawingBuffer: false,
    });
    if (!gl) return;

    // ── Helpers ──────────────────────────────────────────────────────────
    function compileShader(src, type) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn('NebulaOverlay shader error:', gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    }

    function linkProg(vSrc, fSrc) {
      const vs = compileShader(vSrc, gl.VERTEX_SHADER);
      const fs = compileShader(fSrc, gl.FRAGMENT_SHADER);
      if (!vs || !fs) return null;
      const p = gl.createProgram();
      gl.attachShader(p, vs);
      gl.attachShader(p, fs);
      gl.bindAttribLocation(p, 0, 'a_position');
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        console.warn('NebulaOverlay link error:', gl.getProgramInfoLog(p));
        return null;
      }
      return p;
    }

    function createFBO(w, h) {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return { tex, fb };
    }

    // ── Programs ─────────────────────────────────────────────────────────
    const dispProg = linkProg(VERT, DISP_FRAG);
    const overlayProg = linkProg(VERT, OVERLAY_FRAG);
    if (!dispProg || !overlayProg) return;

    // Fullscreen quad
    const quadBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

    // Canvas sizing
    const dpr = Math.min(window.devicePixelRatio, 1.5);
    const vpW = wrapper.clientWidth;
    const vpH = wrapper.clientHeight;
    const cw = Math.round(vpW * dpr);
    const ch = Math.round(vpH * dpr);
    canvas.width = cw;
    canvas.height = ch;

    // Displacement FBOs — quarter res for performance (matching NebulaBackground)
    const dispW = Math.max(256, Math.ceil(cw / 4));
    const dispH = Math.max(256, Math.ceil(ch / 4));
    let fboA = createFBO(dispW, dispH);
    let fboB = createFBO(dispW, dispH);

    // ── Displacement program uniforms ────────────────────────────────────
    gl.useProgram(dispProg);
    const dU = {
      prev:       gl.getUniformLocation(dispProg, 'u_prev'),
      res:        gl.getUniformLocation(dispProg, 'u_res'),
      mouse:      gl.getUniformLocation(dispProg, 'u_mouse'),
      mousePrev:  gl.getUniformLocation(dispProg, 'u_mousePrev'),
      mouseSpeed: gl.getUniformLocation(dispProg, 'u_mouseSpeed'),
      aspect:     gl.getUniformLocation(dispProg, 'u_aspect'),
    };

    // ── Overlay program uniforms ─────────────────────────────────────────
    gl.useProgram(overlayProg);
    const oU = {
      time:    gl.getUniformLocation(overlayProg, 'u_time'),
      res:     gl.getUniformLocation(overlayProg, 'u_resolution'),
      disp:    gl.getUniformLocation(overlayProg, 'u_disp'),
      offset:  gl.getUniformLocation(overlayProg, 'u_offset'),
      opacity: gl.getUniformLocation(overlayProg, 'u_opacity'),
    };

    const aPos = 0; // bound at index 0 in linkProg
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // ── Mouse tracking ───────────────────────────────────────────────────
    function onPointerMove(e) {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: 1.0 - (e.clientY - rect.top) / rect.height,
      };
    }
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('mousemove', onPointerMove);

    // ── Render loop — 30fps matching NebulaBackground ────────────────────
    const INTERVAL = 1000 / 30;
    let lastFrame = 0;
    let running = true;

    function render(now) {
      if (!running) return;
      if (!isVisibleRef.current) {
        animRef.current = null;
        return;
      }

      animRef.current = requestAnimationFrame(render);

      if (now - lastFrame < INTERVAL) return;
      lastFrame = now;

      // Smooth map position — snap during navigation so overlay tracks content 1:1
      const target = mapPositionRef.current;
      const curr = mapPosRef.current;
      const mapDx = target.x - curr.x;
      const mapDy = target.y - curr.y;
      const mapDist = Math.abs(mapDx) + Math.abs(mapDy);
      // During navigation (large delta): near-instant tracking; idle: gentle organic drift
      const factor = mapDist > 0.02 ? 0.7 : 0.08;
      curr.x += mapDx * factor;
      curr.y += mapDy * factor;

      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const aspect = cw / ch;

      // Mouse speed
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const px = mousePrevRef.current.x;
      const py = mousePrevRef.current.y;
      const dx = (mx - px) * aspect;
      const dy = my - py;
      const speed = Math.sqrt(dx * dx + dy * dy) * 60;
      mousePrevRef.current = { x: mx, y: my };

      // ── Pass 1: Displacement update (render to FBO) ──
      gl.bindFramebuffer(gl.FRAMEBUFFER, fboB.fb);
      gl.viewport(0, 0, dispW, dispH);
      gl.disable(gl.BLEND);

      gl.useProgram(dispProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fboA.tex);
      gl.uniform1i(dU.prev, 0);
      gl.uniform2f(dU.res, dispW, dispH);
      gl.uniform2f(dU.mouse, mx, my);
      gl.uniform2f(dU.mousePrev, px, py);
      gl.uniform1f(dU.mouseSpeed, speed);
      gl.uniform1f(dU.aspect, aspect);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // Swap FBOs
      const tmp = fboA;
      fboA = fboB;
      fboB = tmp;

      // ── Pass 2: Overlay render (to screen) ──
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, cw, ch);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(overlayProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fboA.tex);
      gl.uniform1i(oU.disp, 0);
      gl.uniform1f(oU.time, elapsed);
      gl.uniform2f(oU.res, cw, ch);
      gl.uniform2f(oU.offset, curr.x, curr.y);
      gl.uniform1f(oU.opacity, opacity);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    renderFnRef.current = render;
    animRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      renderFnRef.current = null;
      if (animRef.current) cancelAnimationFrame(animRef.current);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('mousemove', onPointerMove);
      gl.deleteBuffer(quadBuf);
      gl.deleteProgram(dispProg);
      gl.deleteProgram(overlayProg);
      gl.deleteTexture(fboA.tex);
      gl.deleteFramebuffer(fboA.fb);
      gl.deleteTexture(fboB.tex);
      gl.deleteFramebuffer(fboB.fb);
    };
  }, [opacity]);

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 15,
        pointerEvents: 'none',
        overflow: 'hidden',
        opacity: isZoomedIn ? 0 : 1,
        transition: isZoomedIn ? 'opacity 0.5s ease' : 'opacity 0.6s ease 2.5s',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
};

export default NebulaOverlay;
