import React, { useRef, useEffect } from 'react';

/**
 * NebulaBackground — Procedural WebGL nebula with paint-stirring mouse physics
 *
 * Architecture: Two-pass ping-pong framebuffer system.
 *   Pass 1 — Displacement update: reads previous displacement texture, adds new
 *            forces from mouse velocity, writes to the other FBO. Displacement
 *            is permanent (near-zero decay) with gentle diffusion for organic spread.
 *   Pass 2 — Nebula render: reads the accumulated displacement texture and offsets
 *            the UV coordinates of each nebula layer for parallax-depth paint effect.
 *
 * Mouse physics: the cursor acts like a stick dragged through paint.
 *   - Paint is pushed ALONG the direction of mouse movement (advection)
 *   - Paint is pushed OUTWARD from the mouse path (wake / radial push)
 *   - Displacement accumulates permanently — it never snaps back
 *   - Gentle neighbor-diffusion makes trails bleed outward naturally
 *
 * Color palette: orange / dark-orange / purple / violet / magenta.
 */

// ─── Shared vertex shader ──────────────────────────────────────────────
const VERT = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// ─── Pass 1: Displacement field update (ping-pong) ─────────────────────
const DISP_FRAG = `
  precision mediump float;

  uniform sampler2D u_prev;       // previous frame displacement (RG encoded)
  uniform vec2  u_res;            // displacement texture resolution
  uniform vec2  u_mouse;          // current mouse  (0-1, GL-Y)
  uniform vec2  u_mousePrev;      // previous mouse (0-1, GL-Y)
  uniform float u_mouseSpeed;     // |mouse - mousePrev|
  uniform float u_aspect;         // screen width / height

  // Distance from point p to line segment a->b
  float segDist(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
    return length(pa - ba * h);
  }

  // Closest point on segment a->b to point p
  vec2 segClosest(vec2 p, vec2 a, vec2 b) {
    vec2 ba = b - a;
    float h = clamp(dot(p - a, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
    return a + ba * h;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_res;
    vec2 texel = 1.0 / u_res;

    // Decode existing displacement (-1 to 1 range)
    vec2 cur = texture2D(u_prev, uv).xy * 2.0 - 1.0;

    // 4-neighbor diffusion for organic paint bleeding
    vec2 rt = texture2D(u_prev, uv + vec2(texel.x, 0.0)).xy * 2.0 - 1.0;
    vec2 lt = texture2D(u_prev, uv - vec2(texel.x, 0.0)).xy * 2.0 - 1.0;
    vec2 up = texture2D(u_prev, uv + vec2(0.0, texel.y)).xy * 2.0 - 1.0;
    vec2 dn = texture2D(u_prev, uv - vec2(0.0, texel.y)).xy * 2.0 - 1.0;
    vec2 avg = (rt + lt + up + dn) * 0.25;
    vec2 diffused = mix(cur, avg, 0.025);

    // Mouse stroke
    if (u_mouseSpeed > 0.0001) {
      // Aspect-correct coordinates for circular brush
      vec2 uvA  = uv          * vec2(u_aspect, 1.0);
      vec2 mA   = u_mouse     * vec2(u_aspect, 1.0);
      vec2 mpA  = u_mousePrev * vec2(u_aspect, 1.0);

      // Distance from this pixel to the stroke segment
      float dist = segDist(uvA, mpA, mA);

      // Adaptive brush radius: smaller for subtler interaction
      float brushR = 0.06 + u_mouseSpeed * 2.0;
      brushR = min(brushR, 0.18);

      // Smooth cubic falloff
      float falloff = 1.0 - smoothstep(0.0, brushR, dist);
      falloff = falloff * falloff;

      // Direction of mouse movement (in UV space)
      vec2 moveDir = u_mouse - u_mousePrev;
      float spd = length(moveDir);
      vec2 dir = spd > 1e-5 ? moveDir / spd : vec2(0.0);

      // Gentle strength — subtle paint-stirring feel
      float str = max(0.015, min(spd * 10.0, 0.08));

      // Push 1: drag paint forward along movement direction
      vec2 push = dir * falloff * str;

      // Push 2: radial push paint away from the stroke path (wake)
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

    // Near-permanent: half-life about 77 s at 30 fps
    diffused *= 0.9997;

    // Clamp to sane range
    diffused = clamp(diffused, vec2(-0.5), vec2(0.5));

    // Encode for unsigned byte storage
    gl_FragColor = vec4(diffused * 0.5 + 0.5, 0.0, 1.0);
  }
`;

// ─── Pass 2: Nebula render with displacement applied ───────────────────
// Factory: generates shader source with configurable octave counts
function makeNebulaFrag(fbmOctaves = 5, ridgeOctaves = 5, precision = 'highp', gasLayers = 4, mobileLayout = false, mobileStars = false) {
  return `
  #extension GL_OES_standard_derivatives : enable
  precision ${precision} float;

  uniform float     u_time;
  uniform vec2      u_resolution;
  uniform sampler2D u_disp;   // accumulated displacement field
  uniform vec2      u_offset; // map navigation offset (viewport units)
  uniform float     u_brightness;  // overall brightness multiplier (higher on mobile)
  uniform float     u_saturation;  // color saturation boost (higher on mobile)
  uniform float     u_colorDepth;  // gas color intensity multiplier (higher on mobile)

  // Noise
  float hash(vec2 p) {
    p = fract(p * vec2(443.8975, 397.2973));
    p += dot(p, p + 19.19);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0, a = 0.5, f = 1.0;
    for (int i = 0; i < ${fbmOctaves}; i++) {
      v += a * noise(p * f);
      f *= 2.1; a *= 0.48;
    }
    return v;
  }

  // Ridge noise — creates filamentary wisps like real nebulae
  float ridgeNoise(vec2 p) {
    return 1.0 - abs(noise(p) * 2.0 - 1.0);
  }

  float ridgeFbm(vec2 p) {
    float v = 0.0, a = 0.5, f = 1.0;
    for (int i = 0; i < ${ridgeOctaves}; i++) {
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

  float stars(vec2 uv, float density, float sizeScale) {
    vec2 cell = floor(uv * density);
    vec2 local = fract(uv * density);
    float h = hash(cell);
    if (h > 0.15) return 0.0;
    vec2 sp = vec2(hash(cell + 0.1), hash(cell + 0.2));
    float d = length(local - sp);
    float sz = (0.015 + 0.025 * hash(cell + 0.3)) * 1.1 * sizeScale;
    float b = smoothstep(sz, sz * 0.1, d);
    b *= 0.6 + 0.4 * sin(u_time * (2.0 + 4.0 * hash(cell + 0.5)) + hash(cell + 0.7) * 6.28);
    return b;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;
` + (mobileLayout ? `
    // Mobile: portrait phones have aspect ~0.45 which squishes x coords to ±0.23,
    // making the nebula look extremely zoomed-in. Clamp to 0.9 for readable features.
    aspect = max(aspect, 0.9);
` : ``) + `
    // Read accumulated displacement
    vec2 disp = texture2D(u_disp, uv).xy * 2.0 - 1.0;

    float t = u_time * 0.07;

    // Map navigation offset
    vec2 mapOff = u_offset * vec2(0.35, 0.35);

    // Parallax-depth displacement per layer
    vec2 p0 = (uv + disp * 0.06 - 0.5) * vec2(aspect, 1.0) + mapOff * 0.12; // deepest — background gas
    vec2 p1 = (uv + disp * 0.18 - 0.5) * vec2(aspect, 1.0) + mapOff * 0.3;
    vec2 p2 = (uv + disp * 0.32 - 0.5) * vec2(aspect, 1.0) + mapOff * 0.5;
    vec2 p3 = (uv + disp * 0.48 - 0.5) * vec2(aspect, 1.0) + mapOff * 0.7;

    // ── Edge distortion: 3 noise layers for organic nebula boundaries ──
    float edgeWarp = fbm(p1 * 4.5 + vec2(7.3, 2.1) + t * 0.04) * 0.16 - 0.08;
    float edgeWarp2 = ridgeFbm(p1 * 6.0 + vec2(3.7, 8.4) + t * 0.03) * 0.12 - 0.06;
    float edgeWarp4 = warpedFbm(p1 * 3.0 + vec2(4.8, 6.9), t * 0.5) * 0.14 - 0.07;
    vec2 warpOffset = vec2(edgeWarp, edgeWarp2 + edgeWarp4);

    // ── Background Gaussians — distant diffuse glow for depth illusion ──
    // Very wide, soft shapes at deepest parallax (p0) — feels like distant gas
    // behind the main nebulae. Subtle enough to not overpower foreground.
    // Reuse main edgeWarp scaled down — bg blobs are too diffuse to need dedicated warp
    vec2 bgWarpOff = vec2(edgeWarp * 0.5, edgeWarp2 * 0.35);

` + (mobileLayout ? `
    // Mobile: BG Gaussians tightened to fit fixed portrait viewport
    // BG1: Upper — cool violet wash
    vec2 bgN1 = p0 + bgWarpOff - vec2(0.05, 0.22);
    float nebBG1 = exp(-(bgN1.x * bgN1.x * 1.2 + bgN1.y * bgN1.y * 1.0));

    // BG2: Lower-left — warm ember
    vec2 bgN2 = p0 + bgWarpOff - vec2(-0.25, -0.22);
    float nebBG2 = exp(-(bgN2.x * bgN2.x * 1.5 + bgN2.y * bgN2.y * 1.2));

    // BG3: Right — blue haze
    vec2 bgN3 = p0 + bgWarpOff - vec2(0.28, -0.10);
    float nebBG3 = exp(-(bgN3.x * bgN3.x * 1.8 + bgN3.y * bgN3.y * 1.5));
` : `
    // BG Nebula 1: Upper-center — vast cool violet wash
    vec2 bgN1 = p0 + bgWarpOff - vec2(0.05, 0.22);
    float nebBG1 = exp(-(bgN1.x * bgN1.x * 0.9 + bgN1.y * bgN1.y * 1.1));

    // BG Nebula 2: Lower-left — warm diffuse ember
    vec2 bgN2 = p0 + bgWarpOff - vec2(-0.40, -0.18);
    float nebBG2 = exp(-(bgN2.x * bgN2.x * 1.2 + bgN2.y * bgN2.y * 0.8));

    // BG Nebula 3: Right — faint blue haze
    vec2 bgN3 = p0 + bgWarpOff - vec2(0.45, -0.05);
    float nebBG3 = exp(-(bgN3.x * bgN3.x * 1.5 + bgN3.y * bgN3.y * 1.8));
`) + `

    float bgGaussMask = clamp(nebBG1 + nebBG2 * 0.8 + nebBG3 * 0.6, 0.0, 1.0);

    // ── Spatial confinement: nebulae across the viewport ──

` + (mobileLayout ? `
    // Mobile: All 3 nebulae repositioned into the fixed portrait viewport
    // No map navigation — everything must be visible at offset (0,0)

    // Nebula A: Upper-center — magenta-purple, main feature
    vec2 nA = p1 + warpOffset - vec2(-0.08, 0.18);
    float nebA = exp(-(nA.x * nA.x * 3.5 + nA.y * nA.y * 2.8));

    // Nebula B: Lower-left — warm orange-gold, pulled into viewport
    vec2 nB = p1 + warpOffset - vec2(-0.28, -0.25);
    float nebB = exp(-(nB.x * nB.x * 4.0 + nB.y * nB.y * 3.5));

    // Nebula C: Right — phoenix warm, compact, pulled into viewport
    vec2 nC_base = p1 + warpOffset - vec2(0.30, -0.12);
    float nebC_body = exp(-(nC_base.x * nC_base.x * 10.0 + nC_base.y * nC_base.y * 8.0));
    vec2 nC_lw = nC_base - vec2(-0.06, -0.02);
    vec2 lw = vec2(0.866 * nC_lw.x + 0.5 * nC_lw.y, -0.5 * nC_lw.x + 0.866 * nC_lw.y);
    float nebC_lw = exp(-(lw.x * lw.x * 6.0 + lw.y * lw.y * 28.0));
    vec2 nC_rw = nC_base - vec2(0.07, -0.02);
    vec2 rw = vec2(0.866 * nC_rw.x - 0.5 * nC_rw.y, 0.5 * nC_rw.x + 0.866 * nC_rw.y);
    float nebC_rw = exp(-(rw.x * rw.x * 6.0 + rw.y * rw.y * 28.0));
    vec2 nC_hd = nC_base - vec2(0.01, 0.05);
    vec2 hd = vec2(0.966 * nC_hd.x + 0.259 * nC_hd.y, -0.259 * nC_hd.x + 0.966 * nC_hd.y);
    float nebC_hd = exp(-(hd.x * hd.x * 24.0 + hd.y * hd.y * 6.0));
    vec2 nC_tl = nC_base - vec2(-0.015, -0.07);
    vec2 tl = vec2(0.985 * nC_tl.x + 0.174 * nC_tl.y, -0.174 * nC_tl.x + 0.985 * nC_tl.y);
    float nebC_tl = exp(-(tl.x * tl.x * 20.0 + tl.y * tl.y * 4.0));
    float nebC = max(max(max(nebC_body, nebC_lw), max(nebC_rw, nebC_hd)), nebC_tl);
` : `
    // Each nebula has unique position, shape, and rich color grading.
    // They may overflow between viewports as user navigates.

    // Nebula A: Center-left — visible from main page — large elongated, magenta-purple
    vec2 nA = p1 + warpOffset - vec2(-0.15, 0.1);
    float nebA = exp(-(nA.x * nA.x * 4.5 + nA.y * nA.y * 7.0));

    // Nebula B: Lower-left — near gardens area — wide diffuse, warm orange-gold
    vec2 nB = p1 + warpOffset - vec2(-0.6, -0.32);
    float nebB = exp(-(nB.x * nB.x * 6.5 + nB.y * nB.y * 6.0));

    // Nebula C: Lower-right — phoenix silhouette, 5 sub-Gaussians merged
    vec2 nC_base = p1 + warpOffset - vec2(0.5, -0.38);
    float nebC_body = exp(-(nC_base.x * nC_base.x * 14.0 + nC_base.y * nC_base.y * 11.0));
    vec2 nC_lw = nC_base - vec2(-0.08, -0.03);
    vec2 lw = vec2(0.866 * nC_lw.x + 0.5 * nC_lw.y, -0.5 * nC_lw.x + 0.866 * nC_lw.y);
    float nebC_lw = exp(-(lw.x * lw.x * 5.0 + lw.y * lw.y * 28.0));
    vec2 nC_rw = nC_base - vec2(0.09, -0.025);
    vec2 rw = vec2(0.866 * nC_rw.x - 0.5 * nC_rw.y, 0.5 * nC_rw.x + 0.866 * nC_rw.y);
    float nebC_rw = exp(-(rw.x * rw.x * 5.0 + rw.y * rw.y * 28.0));
    vec2 nC_hd = nC_base - vec2(0.01, 0.07);
    vec2 hd = vec2(0.966 * nC_hd.x + 0.259 * nC_hd.y, -0.259 * nC_hd.x + 0.966 * nC_hd.y);
    float nebC_hd = exp(-(hd.x * hd.x * 24.0 + hd.y * hd.y * 6.0));
    vec2 nC_tl = nC_base - vec2(-0.02, -0.10);
    vec2 tl = vec2(0.985 * nC_tl.x + 0.174 * nC_tl.y, -0.174 * nC_tl.x + 0.985 * nC_tl.y);
    float nebC_tl = exp(-(tl.x * tl.x * 20.0 + tl.y * tl.y * 4.0));
    float nebC = max(max(max(nebC_body, nebC_lw), max(nebC_rw, nebC_hd)), nebC_tl);
`) + `

    // Combined cloud mask — warm clouds contribute equally
    float cloudMask = clamp(nebA + nebB * 1.0 + nebC * 0.85, 0.0, 1.0);
    cloudMask = pow(cloudMask, 1.5); // sharpen edges

    // Per-nebula color identity: 0 = purple/magenta, 1 = warm orange
    // Each nebula leans toward a hue but all contain both colors swirling through
    float totalNeb = nebA + nebB + nebC + 0.001;
    float baseHue = (nebA * 0.25 + nebB * 0.55 + nebC * ${mobileLayout ? '0.95' : '0.82'}) / totalNeb;
    // Add large-scale noise to break up the spatial color separation
    // This makes purple streaks appear in warm regions and vice versa
    float hueNoise = fbm(p2 * 2.5 + vec2(13.7, 7.3) + t * 0.06);
    float hueSwirl = warpedFbm(p1 * 1.8 + vec2(5.2, 9.1) + vec2(t * 0.08, -t * 0.05), t * 0.7);
    // Blend noise into hue — ±0.30 variation so colors truly intermingle
    float nebulaHue = clamp(baseHue + (hueNoise - 0.5) * 0.40 + (hueSwirl - 0.5) * 0.20, 0.0, 1.0);
    // Blue depth factor: strongest in transition zones + at depth edges
    float blueDepth = smoothstep(0.20, 0.45, nebulaHue) * smoothstep(0.85, 0.55, nebulaHue);
    blueDepth *= 0.15; // cap blue at ~15% contribution

    // ── Volumetric depth simulation ──
    vec2 pBack = p2 + vec2(0.06, -0.04);
    float nBack = warpedFbm(pBack * 1.7 + vec2(2.8, 1.4) + vec2(t * 0.28, t * 0.07), t * 1.1);
    float dustLane = ridgeFbm(p2 * 2.2 + vec2(5.5, 8.3) + t * 0.02);
    float absorption = smoothstep(0.55, 0.75, dustLane) * cloudMask * 0.35;

    // Layer 1: Deep background void — subtle color hint from nearest nebula
    float n1 = warpedFbm(p1 * 1.2 + vec2(0.0, t * 0.3), t);

    // ── BACKGROUND STARS (behind all gas) ──
    vec3 color = vec3(0.0); // accumulate bg stars first, gas composited on top later
    vec2 bgStarUv = uv + mapOff * 0.15; // slowest parallax — deepest layer

` + (mobileStars ? `
    // Mobile: single background star layer (halved, brightened)
    float bgS2 = stars(bgStarUv, 80.0, 1.1);
    vec3 bgSc2 = mix(vec3(0.55, 0.55, 0.8), vec3(0.8, 0.7, 0.45), hash(floor(bgStarUv * 80.0) + 44.0));
    color += bgSc2 * bgS2 * 0.42;
` : `
    // Tiny distant background stars — dense field
    float bgS1 = stars(bgStarUv, 120.0, 1.1);
    vec3 bgSc1 = mix(vec3(0.5, 0.5, 0.75), vec3(0.7, 0.65, 0.5), hash(floor(bgStarUv * 120.0)));
    color += bgSc1 * bgS1 * 0.24;

    // Small background stars — brighter
    float bgS2 = stars(bgStarUv, 80.0, 1.1);
    vec3 bgSc2 = mix(vec3(0.55, 0.55, 0.8), vec3(0.8, 0.7, 0.45), hash(floor(bgStarUv * 80.0) + 44.0));
    color += bgSc2 * bgS2 * 0.34;

    // Background galaxies — very distant, dim ellipses
    {
      float density = 4.0;
      for (int dx = -1; dx <= 1; dx++) {
        for (int dy = -1; dy <= 1; dy++) {
          vec2 cell = floor(bgStarUv * density) + vec2(float(dx), float(dy));
          float h = hash(cell + 200.0);
          if (h < 0.06) {
            vec2 center = (cell + vec2(hash(cell + 201.0), hash(cell + 202.0))) / density;
            vec2 delta = (bgStarUv - center) * density;
            float angle = hash(cell + 203.0) * 6.28;
            float ca = cos(angle), sa = sin(angle);
            vec2 rotD = vec2(ca * delta.x + sa * delta.y, -sa * delta.x + ca * delta.y);
            float axisRatio = 0.2 + 0.3 * hash(cell + 204.0);
            rotD.y /= axisRatio;
            float dist = length(rotD);
            float gDist = 0.2 + 0.4 * hash(cell + 207.0); // far only
            float falloff = 60.0 / (gDist * gDist);
            float galaxyBright = exp(-dist * dist * falloff) * gDist * (0.10 + 0.08 * hash(cell + 205.0));
            float gc = hash(cell + 206.0);
            vec3 galaxyColor = gc < 0.4 ? vec3(0.6, 0.55, 0.45) :
                               gc < 0.7 ? vec3(0.45, 0.48, 0.65) :
                                           vec3(0.65, 0.52, 0.40);
            color += galaxyColor * max(galaxyBright, 0.0) * 0.7;
          }
        }
      }
    }

    // Background star clusters — faint, compact
    {
      float density = 6.0;
      for (int dx = -1; dx <= 1; dx++) {
        for (int dy = -1; dy <= 1; dy++) {
          vec2 cell = floor(bgStarUv * density) + vec2(float(dx), float(dy));
          float h = hash(cell + 350.0);
          if (h < 0.04) {
            vec2 clusterCenter = (cell + vec2(hash(cell + 351.0), hash(cell + 352.0))) / density;
            float clusterDist = length(bgStarUv - clusterCenter) * density;
            float cDist = 0.25 + 0.35 * hash(cell + 353.0); // small/dim
            float spread = 0.12 + 0.10 * cDist;
            if (clusterDist < 0.35 * cDist) {
              for (int i = 0; i < 4; i++) {
                float fi = float(i);
                vec2 subPos = clusterCenter + vec2(
                  hash(cell + fi * 10.0 + 360.0) - 0.5,
                  hash(cell + fi * 10.0 + 361.0) - 0.5
                ) * spread / density;
                float subDist = length(bgStarUv - subPos) * density;
                float starSize = 0.008 * (0.7 + 0.3 * hash(cell + fi + 375.0));
                float subBright = smoothstep(starSize, starSize * 0.1, subDist) * 0.30 * (0.6 + 0.4 * hash(cell + fi + 370.0));
                vec3 subColor = mix(vec3(0.6, 0.65, 0.9), vec3(0.9, 0.8, 0.55), hash(cell + fi + 380.0));
                color += subColor * max(subBright, 0.0);
              }
              float clGlow = exp(-clusterDist * clusterDist * 18.0) * 0.025 * cDist;
              color += vec3(0.5, 0.5, 0.7) * clGlow;
            }
          }
        }
      }
    }
`) + `

    vec3 deepPurple = mix(vec3(0.008, 0.002, 0.018), vec3(0.025, 0.008, 0.04), n1);
    vec3 deepBlue   = mix(vec3(0.004, 0.006, 0.020), vec3(0.012, 0.018, 0.045), n1);
    vec3 deepWarm   = mix(vec3(0.020, 0.007, 0.004), vec3(0.047, 0.016, 0.008), n1);
    // Primary: purple→warm, then tint with blue as depth accent
    vec3 deepColor  = mix(deepPurple, deepWarm, smoothstep(0.25, 0.75, nebulaHue));
    deepColor = mix(deepColor, deepBlue, blueDepth);
    deepColor = mix(deepColor, deepColor * 1.5, cloudMask * 0.3);

    // Layer 2 back: "rear gas" — 4 color grades per nebula (very dark → medium)
    float filamentBack = ridgeFbm(pBack * 3.0 + vec2(1.5, 3.8) + t * 0.04);
    // Magenta-purple nebula back grades
    vec3 backMag1 = vec3(0.03, 0.008, 0.025);
    vec3 backMag2 = vec3(0.06, 0.015, 0.05);
    vec3 backMag3 = vec3(0.10, 0.025, 0.08);
    vec3 backMag4 = vec3(0.16, 0.04, 0.12);
    vec3 backMagenta = mix(mix(backMag1, backMag2, smoothstep(0.2, 0.4, nBack)),
                          mix(backMag3, backMag4, smoothstep(0.5, 0.7, nBack)),
                          smoothstep(0.35, 0.55, nBack));
    // Blue-violet nebula back grades
    vec3 backB1 = vec3(0.015, 0.015, 0.04);
    vec3 backB2 = vec3(0.03, 0.035, 0.08);
    vec3 backB3 = vec3(0.05, 0.06, 0.13);
    vec3 backB4 = vec3(0.07, 0.08, 0.18);
    vec3 backBlue = mix(mix(backB1, backB2, smoothstep(0.2, 0.4, nBack)),
                       mix(backB3, backB4, smoothstep(0.5, 0.7, nBack)),
                       smoothstep(0.35, 0.55, nBack));
    // Warm nebula back grades
    vec3 backW1 = vec3(0.054, 0.020, 0.007);
    vec3 backW2 = vec3(0.108, 0.040, 0.014);
    vec3 backW3 = vec3(0.189, 0.074, 0.020);
    vec3 backW4 = vec3(0.27, 0.108, 0.034);
    vec3 backWarm = mix(mix(backW1, backW2, smoothstep(0.2, 0.4, nBack)),
                       mix(backW3, backW4, smoothstep(0.5, 0.7, nBack)),
                       smoothstep(0.35, 0.55, nBack));
    // Primary: purple→warm (50/35 split), blue as depth accent (15%)
    backMagenta *= 1.27; // boost purple/magenta depth
    vec3 backGasColor = mix(backMagenta, backWarm, smoothstep(0.25, 0.75, nebulaHue));
    backGasColor = mix(backGasColor, backBlue, blueDepth);
    backGasColor *= u_colorDepth;
    float backMask = smoothstep(0.40, 0.62, nBack) * cloudMask * 0.5 * (0.6 + 0.4 * filamentBack);

    // Layer 2 front: Mid nebula clouds — rich 5-grade palette per identity
    float n2 = warpedFbm(p2 * 1.8 + vec2(3.1, 1.7) + vec2(t * 0.3, t * 0.08), t * 1.2);
    float filament2 = ridgeFbm(p2 * 3.5 + vec2(2.0, 4.5) + t * 0.05);

    // Magenta-purple grades: pitch black → dark plum → magenta → hot pink → bright rose
    vec3 mag1 = vec3(0.04, 0.005, 0.03);
    vec3 mag2 = vec3(0.10, 0.015, 0.08);
    vec3 mag3 = vec3(0.20, 0.035, 0.16);
    vec3 mag4 = vec3(0.32, 0.06, 0.26);
    vec3 mag5 = vec3(0.50, 0.12, 0.40);
    vec3 midMagenta = mag1;
    midMagenta = mix(midMagenta, mag2, smoothstep(0.15, 0.30, n2));
    midMagenta = mix(midMagenta, mag3, smoothstep(0.30, 0.48, n2));
    midMagenta = mix(midMagenta, mag4, smoothstep(0.48, 0.65, n2));
    midMagenta = mix(midMagenta, mag5, smoothstep(0.65, 0.82, n2));

    // Blue-violet grades: deep navy → slate blue → cerulean → bright blue → electric blue
    vec3 blu1 = vec3(0.02, 0.015, 0.05);
    vec3 blu2 = vec3(0.04, 0.04, 0.12);
    vec3 blu3 = vec3(0.07, 0.08, 0.22);
    vec3 blu4 = vec3(0.12, 0.14, 0.35);
    vec3 blu5 = vec3(0.20, 0.24, 0.52);
    vec3 midBlue = blu1;
    midBlue = mix(midBlue, blu2, smoothstep(0.15, 0.30, n2));
    midBlue = mix(midBlue, blu3, smoothstep(0.30, 0.48, n2));
    midBlue = mix(midBlue, blu4, smoothstep(0.48, 0.65, n2));
    midBlue = mix(midBlue, blu5, smoothstep(0.65, 0.82, n2));

    // Warm orange grades: near-black → deep brown → burnt orange → amber → bright gold
    vec3 wrm1 = vec3(0.04, 0.013, 0.004);
    vec3 wrm2 = vec3(0.135, 0.047, 0.014);
    vec3 wrm3 = vec3(0.30, 0.108, 0.027);
    vec3 wrm4 = vec3(0.51, 0.20, 0.04);
    vec3 wrm5 = vec3(0.62, 0.30, 0.08);
    vec3 midWarm = wrm1;
    midWarm = mix(midWarm, wrm2, smoothstep(0.15, 0.30, n2));
    midWarm = mix(midWarm, wrm3, smoothstep(0.30, 0.48, n2));
    midWarm = mix(midWarm, wrm4, smoothstep(0.48, 0.65, n2));
    midWarm = mix(midWarm, wrm5, smoothstep(0.65, 0.82, n2));

    // Primary blend: magenta→warm (50/35), blue depth accent (15%)
    midMagenta *= 1.27; // boost purple/magenta depth
    vec3 midColor = mix(midMagenta, midWarm, smoothstep(0.25, 0.75, nebulaHue));
    midColor = mix(midColor, midBlue, blueDepth);
    // Blend some filament texture into it
    midColor *= (0.8 + 0.2 * filament2);
    midColor *= u_colorDepth;
    float midMask = smoothstep(0.42, 0.65, n2) * cloudMask * (0.7 + 0.3 * filament2);

    // Layer 3: Bright emission cores — 4-grade ramp to peak brightness
    float n3 = warpedFbm(p3 * 2.5 + vec2(7.5, 3.2) + vec2(t * 0.12, t * 0.18), t * 0.8);
    float filament3 = ridgeFbm(p3 * 4.0 + vec2(1.3, 7.1) + t * 0.03);

    // Purple core grades: dark violet → vivid purple → magenta → hot white-pink
    vec3 cp1 = vec3(0.12, 0.02, 0.16);
    vec3 cp2 = vec3(0.25, 0.04, 0.30);
    vec3 cp3 = vec3(0.42, 0.08, 0.38);
    vec3 cp4 = vec3(0.65, 0.20, 0.55);
    vec3 corePurple = cp1;
    corePurple = mix(corePurple, cp2, smoothstep(0.3, 0.5, n3));
    corePurple = mix(corePurple, cp3, smoothstep(0.5, 0.68, n3));
    corePurple = mix(corePurple, cp4, smoothstep(0.68, 0.85, n3));

    // Blue core grades: deep indigo → sapphire → bright blue → white-blue
    vec3 cb1 = vec3(0.04, 0.03, 0.14);
    vec3 cb2 = vec3(0.08, 0.08, 0.28);
    vec3 cb3 = vec3(0.14, 0.16, 0.42);
    vec3 cb4 = vec3(0.28, 0.32, 0.62);
    vec3 coreBlue = cb1;
    coreBlue = mix(coreBlue, cb2, smoothstep(0.3, 0.5, n3));
    coreBlue = mix(coreBlue, cb3, smoothstep(0.5, 0.68, n3));
    coreBlue = mix(coreBlue, cb4, smoothstep(0.68, 0.85, n3));

    // Orange core grades: dark red-brown → ember → fire → white-gold
    vec3 co1 = vec3(0.19, 0.054, 0.014);
    vec3 co2 = vec3(0.40, 0.135, 0.027);
    vec3 co3 = vec3(0.67, 0.30, 0.054);
    vec3 co4 = vec3(0.80, 0.44, 0.14);
    vec3 coreOrange = co1;
    coreOrange = mix(coreOrange, co2, smoothstep(0.3, 0.5, n3));
    coreOrange = mix(coreOrange, co3, smoothstep(0.5, 0.68, n3));
    coreOrange = mix(coreOrange, co4, smoothstep(0.68, 0.85, n3));

    // Primary blend: purple→orange (50/35), blue depth accent (15%)
    corePurple *= 1.27; // boost purple/magenta depth
    vec3 brightColor = mix(corePurple, coreOrange, smoothstep(0.25, 0.75, nebulaHue));
    brightColor = mix(brightColor, coreBlue, blueDepth);
    brightColor *= u_colorDepth;
    float brightMask = smoothstep(0.50, 0.70, n3) * smoothstep(0.42, 0.60, n2) * cloudMask * (0.6 + 0.4 * filament3);

    // Backlit rim glow — per-nebula tinted with grade variation
    float rimNoise = fbm(p3 * 3.0 + t * 0.06);
    float rim = smoothstep(0.68, 0.52, n3) * smoothstep(0.40, 0.55, n3) * cloudMask;
    rim = pow(rim, 1.2); // concentrated to thin bright line
    vec3 rimPurple = mix(vec3(0.18, 0.04, 0.22), vec3(0.38, 0.10, 0.42), rimNoise);
    rimPurple *= 1.27; // boost purple/magenta depth
    vec3 rimBlue   = mix(vec3(0.06, 0.08, 0.25), vec3(0.15, 0.20, 0.45), rimNoise);
    vec3 rimWarm   = mix(vec3(0.34, 0.108, 0.027), vec3(0.65, 0.216, 0.054), rimNoise);
    vec3 rimColor = mix(rimPurple, rimWarm, smoothstep(0.25, 0.75, nebulaHue));
    rimColor = mix(rimColor, rimBlue, blueDepth);
    rimColor *= u_colorDepth;

    // Layer 4: Filamentary edge emission — graded
    float edge = abs(n2 - 0.5) * 2.0;
    float combinedEdge = smoothstep(0.20, 0.80, edge);
` + (gasLayers >= 4 ? `
    float edgeGlow = smoothstep(0.58, 0.90, edge) * filament2 * cloudMask;
    vec3 edgePurple = mix(vec3(0.12, 0.02, 0.10), vec3(0.28, 0.06, 0.22), edge);
    vec3 edgeBlue   = mix(vec3(0.05, 0.05, 0.14), vec3(0.12, 0.14, 0.32), edge);
    vec3 edgeWarm   = mix(vec3(0.24, 0.081, 0.014), vec3(0.51, 0.189, 0.04), edge);
    vec3 edgeColor = mix(edgePurple, edgeWarm, smoothstep(0.25, 0.75, nebulaHue));
    edgeColor = mix(edgeColor, edgeBlue, blueDepth);
` : `
    float edgeGlow = 0.0;
    vec3 edgeColor = vec3(0.0);
`) + `

    // Compose nebula with depth layering — bg stars show through voids
    vec3 bgStars = color; // save accumulated background stars
    color = deepColor + bgStars * (1.0 - cloudMask); // stars visible in voids, hidden behind gas

    // ── Background Gaussian glow — deep-space luminosity behind main gas ──
    // Adds subtle color wash visible in voids and partially through thin gas
    vec3 bgGlow = vec3(0.0);
    // Cool violet — upper wash
    bgGlow += mix(vec3(0.012, 0.007, 0.032), vec3(0.028, 0.014, 0.058), n1) * nebBG1;
    // Warm ember — lower-left
    bgGlow += mix(vec3(0.028, 0.010, 0.005), vec3(0.048, 0.022, 0.010), n1) * nebBG2;
    // Cool blue — right haze
    bgGlow += mix(vec3(0.007, 0.010, 0.025), vec3(0.016, 0.022, 0.045), n1) * nebBG3;
    // Show through voids, partially dimmed behind dense foreground gas
    color += bgGlow * (1.0 - cloudMask * 0.6);

    color = mix(color, backGasColor, backMask * 0.50);
    color *= (1.0 - absorption);
    color = mix(color, midColor, midMask * 0.70);
    color += rimColor * rim * 0.22;
    color = mix(color, brightColor, brightMask * 0.60);
    color += edgeColor * edgeGlow * 0.35;

    // ── Depth enhancement: dark voids, highlights, contrast ──

    // Dark absorption lanes — wispy dark dust cutting through gas
    float dustDetail = ridgeFbm(p2 * 4.5 + vec2(11.3, 4.7) + t * 0.015);
    float voidMask = smoothstep(0.62, 0.80, dustDetail) * cloudMask;
    color *= (1.0 - voidMask * ${mobileLayout ? '0.25' : '0.45'}); // darken in dust lanes

    // Hot emission highlights — bright white/pink peaks at densest cores
    float hotSpot = smoothstep(${mobileLayout ? '0.75' : '0.68'}, 0.88, n3) * smoothstep(${mobileLayout ? '0.62' : '0.55'}, 0.72, n2) * cloudMask;
    hotSpot = pow(hotSpot, ${mobileLayout ? '2.0' : '1.4'}); // concentrate to peaks
    // White-hot tint: desaturates toward white at the brightest peaks
    vec3 hotTint = mix(vec3(1.0, 0.82, 0.90), vec3(1.0, 0.95, 0.93), hotSpot);
    color += hotTint * hotSpot * ${mobileLayout ? '0.12' : '0.35'};

` + (mobileLayout ? `
    // Mobile: skip border/edge hotspots (2 octaves = too smooth → giant white blocks)
` : `
    // Border/edge hotspots — fire only on sharp edge curves
    float borderHot = pow(combinedEdge, 1.8) * cloudMask;
    float edgeHotGlow = pow(combinedEdge, 2.2) * cloudMask;
    color += hotTint * borderHot * 0.35;
    color += hotTint * edgeHotGlow * 0.35;
`) + `

    // Luminous filament wisps — thin bright edges where gas density changes sharply
    float wisp = abs(n2 - 0.48) * 2.0;
    float wispGlow = smoothstep(0.82, 0.95, wisp) * smoothstep(0.35, 0.50, n2) * cloudMask * filament3;
    vec3 wispColor = mix(vec3(0.7, 0.5, 0.85), vec3(0.9, 0.7, 0.5), nebulaHue);
    color += wispColor * wispGlow * ${mobileLayout ? '0.06' : '0.12'};

    // S-curve contrast — crushes blacks deeper, lifts highlights
    // Subtle per-channel sigmoid: x → x^g / (x^g + (1-x)^g)  with g ≈ 1.15
    vec3 cNorm = clamp(color * 2.8, 0.0, 1.0); // normalize to 0-1 range for curve
    float g = ${mobileLayout ? '1.08' : '1.15'};
    vec3 curved = pow(cNorm, vec3(g)) / (pow(cNorm, vec3(g)) + pow(vec3(1.0) - cNorm, vec3(g)) + 0.001);
    color = mix(color, curved * 0.357, ${mobileLayout ? '0.20' : '0.35'}); // blend contrast curve

    // Ambient breathing
    float breath = 0.93 + 0.07 * sin(t * 2.5 + n1 * 3.0);
    color *= breath;

    // ── MIDGROUND STARS (partially occluded by gas) ──
    vec2 midStarUv = uv + mapOff * 0.35; // medium parallax
    float gasOcclusion = 1.0 - cloudMask * 0.65; // dimmed inside dense gas

` + (mobileStars ? `
    // Mobile: single midground star layer (halved, brightened)
    float mS1 = stars(midStarUv, 35.0, 1.0);
    vec3 mSc1 = mix(vec3(0.7, 0.7, 0.9), vec3(0.9, 0.8, 0.55), hash(floor(midStarUv * 35.0) + 55.0));
    color += mSc1 * mS1 * 0.58 * gasOcclusion;
` : `
    // Medium midground stars — partially hidden by nebula
    float mS1 = stars(midStarUv, 45.0, 1.0);
    vec3 mSc1 = mix(vec3(0.7, 0.7, 0.9), vec3(0.9, 0.8, 0.55), hash(floor(midStarUv * 45.0) + 55.0));
    color += mSc1 * mS1 * 0.42 * gasOcclusion;

    // Medium-bright stars — some shine through gas edges
    float mS2 = stars(midStarUv + 0.01, 25.0, 1.0);
    vec3 mSc2 = mix(vec3(0.8, 0.78, 0.72), vec3(0.95, 0.7, 0.4), hash(floor((midStarUv + 0.01) * 25.0) + 88.0));
    color += mSc2 * mS2 * 0.52 * gasOcclusion;

    // Midground galaxies — partially visible through gas
    {
      float density = 5.0;
      for (int dx = -1; dx <= 1; dx++) {
        for (int dy = -1; dy <= 1; dy++) {
          vec2 cell = floor(midStarUv * density) + vec2(float(dx), float(dy));
          float h = hash(cell + 400.0);
          if (h < 0.05) {
            vec2 center = (cell + vec2(hash(cell + 401.0), hash(cell + 402.0))) / density;
            vec2 delta = (midStarUv - center) * density;
            float angle = hash(cell + 403.0) * 6.28;
            float ca = cos(angle), sa = sin(angle);
            vec2 rotD = vec2(ca * delta.x + sa * delta.y, -sa * delta.x + ca * delta.y);
            float axisRatio = 0.25 + 0.35 * hash(cell + 404.0);
            rotD.y /= axisRatio;
            float dist = length(rotD);
            float gDist = 0.4 + 0.6 * hash(cell + 407.0);
            float falloff = 50.0 / (gDist * gDist);
            float galaxyBright = exp(-dist * dist * falloff) * gDist * (0.15 + 0.10 * hash(cell + 405.0));
            if (gDist > 0.7) {
              float armAngle = atan(rotD.y, rotD.x);
              float spiral = sin(armAngle * 2.0 + dist * 12.0) * 0.5 + 0.5;
              galaxyBright *= (0.7 + 0.3 * spiral);
            }
            float gc = hash(cell + 406.0);
            vec3 galaxyColor = gc < 0.4 ? vec3(0.70, 0.65, 0.52) :
                               gc < 0.7 ? vec3(0.52, 0.56, 0.72) :
                                           vec3(0.75, 0.60, 0.45);
            color += galaxyColor * max(galaxyBright, 0.0) * gasOcclusion;
          }
        }
      }
    }
`) + `

    // ── FOREGROUND STARS (in front of everything) ──
    vec2 fgStarUv = uv + mapOff * 0.55; // fastest parallax — closest layer

    // Foreground small bright stars
    float fgS1 = stars(fgStarUv, 30.0, 1.0);
    vec3 fgSc1 = mix(vec3(0.85, 0.85, 1.0), vec3(1.0, 0.9, 0.6), hash(floor(fgStarUv * 30.0) + 77.0));
    color += fgSc1 * fgS1 * ${mobileStars ? '0.65' : '0.50'};

    // ── Large bright foreground stars — with diffraction spikes ──
    {
      float density = ${mobileStars ? '6.0' : '10.0'};
      for (int dx = -1; dx <= 1; dx++) {
        for (int dy = -1; dy <= 1; dy++) {
          vec2 cell = floor(fgStarUv * density) + vec2(float(dx), float(dy));
          float h = hash(cell + 77.0);
          if (h < ${mobileStars ? '0.08' : '0.12'}) {
            vec2 sp = (cell + vec2(hash(cell + 0.3), hash(cell + 0.4))) / density;
            vec2 toStar = fgStarUv - sp;
            float d = length(toStar) * density;
            // Distance factor: 0.4 (far/small) to 1.0 (close/large)
            float distFactor = 0.4 + 0.6 * hash(cell + 12.0);
            float coreR = 0.04 * distFactor;
            float core = smoothstep(coreR, 0.0, d);
            float glow = exp(-d * d * (35.0 / (distFactor * distFactor))) * 0.5 * distFactor;
            // Tilted diffraction spikes — rotate the delta by a random angle per star
            float spikeAngle = hash(cell + 15.0) * 3.14159; // 0 to π rotation
            float sc = sin(spikeAngle), cc = cos(spikeAngle);
            vec2 rotDiff = abs(vec2(cc * toStar.x + sc * toStar.y, -sc * toStar.x + cc * toStar.y)) * density;
            float spikeLen = 12.0 + 10.0 * distFactor;
            float spike = exp(-min(rotDiff.x, rotDiff.y) * spikeLen) * exp(-max(rotDiff.x, rotDiff.y) * (3.5 / distFactor)) * 0.3 * distFactor;
            float brightness = core + glow + spike;
            float cs = hash(cell + 5.0);
            vec3 starColor = cs < 0.35 ? vec3(0.8, 0.85, 1.0) :
                             cs < 0.65 ? vec3(1.0, 0.95, 0.7) :
                                         vec3(1.0, 0.7, 0.4);
            brightness *= (0.85 + 0.15 * sin(u_time * (1.0 + 2.0 * hash(cell + 8.0)) + hash(cell + 9.0) * 6.28));
            brightness *= (0.4 + 0.6 * distFactor);
            color += starColor * max(brightness, 0.0);
          }
        }
      }
    }

    // (old single-layer galaxies removed — now split into bg + midground layers above)

` + (mobileStars ? `
    // Mobile: foreground clusters — boosted visibility
    {
      float density = 6.0;
      for (int dx = -1; dx <= 1; dx++) {
        for (int dy = -1; dy <= 1; dy++) {
          vec2 cell = floor(fgStarUv * density) + vec2(float(dx), float(dy));
          float h = hash(cell + 300.0);
          if (h < 0.09) {
            vec2 clusterCenter = (cell + vec2(hash(cell + 301.0), hash(cell + 302.0))) / density;
            float clusterDist = length(fgStarUv - clusterCenter) * density;
            float cDist = 0.45 + 0.55 * hash(cell + 303.0);
            float spread = 0.22 + 0.20 * cDist;
            if (clusterDist < 0.7 * cDist) {
              for (int i = 0; i < 4; i++) {
                float fi = float(i);
                vec2 subPos = clusterCenter + vec2(
                  hash(cell + fi * 10.0 + 310.0) - 0.5,
                  hash(cell + fi * 10.0 + 311.0) - 0.5
                ) * spread / density;
                float subDist = length(fgStarUv - subPos) * density;
                float starSize = (0.016 + 0.016 * cDist) * (0.7 + 0.3 * hash(cell + fi + 325.0));
                float subBright = smoothstep(starSize, starSize * 0.1, subDist) * (0.5 + 0.5 * cDist) * (0.6 + 0.4 * hash(cell + fi + 320.0));
                vec3 subColor = mix(vec3(0.7, 0.75, 1.0), vec3(1.0, 0.9, 0.6), hash(cell + fi + 330.0));
                color += subColor * max(subBright, 0.0);
              }
              float clGlow = exp(-clusterDist * clusterDist * (8.0 / (cDist * cDist))) * 0.08 * cDist;
              color += vec3(0.6, 0.6, 0.8) * clGlow;
            }
          }
        }
      }
    }
` : `
    // ── Foreground star clusters — bright, close ──
    {
      float density = 7.0;
      for (int dx = -1; dx <= 1; dx++) {
        for (int dy = -1; dy <= 1; dy++) {
          vec2 cell = floor(fgStarUv * density) + vec2(float(dx), float(dy));
          float h = hash(cell + 300.0);
          if (h < 0.05) {
            vec2 clusterCenter = (cell + vec2(hash(cell + 301.0), hash(cell + 302.0))) / density;
            float clusterDist = length(fgStarUv - clusterCenter) * density;
            // Distance: 0.35 (compact/dim) to 1.0 (spread/bright)
            float cDist = 0.35 + 0.65 * hash(cell + 303.0);
            float spread = 0.18 + 0.18 * cDist;
            if (clusterDist < 0.5 * cDist) {
              for (int i = 0; i < 5; i++) {
                float fi = float(i);
                vec2 subPos = clusterCenter + vec2(
                  hash(cell + fi * 10.0 + 310.0) - 0.5,
                  hash(cell + fi * 10.0 + 311.0) - 0.5
                ) * spread / density;
                float subDist = length(fgStarUv - subPos) * density;
                float starSize = (0.012 + 0.012 * cDist) * (0.7 + 0.3 * hash(cell + fi + 325.0));
                float subBright = smoothstep(starSize, starSize * 0.1, subDist) * (0.3 + 0.4 * cDist) * (0.6 + 0.4 * hash(cell + fi + 320.0));
                vec3 subColor = mix(vec3(0.7, 0.75, 1.0), vec3(1.0, 0.9, 0.6), hash(cell + fi + 330.0));
                color += subColor * max(subBright, 0.0);
              }
              // Cluster ambient glow — stronger for closer clusters
              float clGlow = exp(-clusterDist * clusterDist * (12.0 / (cDist * cDist))) * 0.04 * cDist;
              color += vec3(0.6, 0.6, 0.8) * clGlow;
            }
          }
        }
      }
    }
`) + `

    // Vignette
    float vig = 1.0 - dot(uv - 0.5, uv - 0.5) * 1.2;
    color *= smoothstep(0.0, 0.50, vig);

    color *= u_brightness;

    // Saturation boost — enriches color depth on mobile where fewer layers thin out the gas
    float luma = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(vec3(luma), color, u_saturation);

    gl_FragColor = vec4(max(color, 0.0), 1.0);
  }
`;
} // end makeNebulaFrag

const NEBULA_FRAG = makeNebulaFrag(2, 2, 'highp', 3, true, false);  // Desktop: mobile gaussians, full desktop stars
const NEBULA_FRAG_MOBILE = makeNebulaFrag(2, 2, 'mediump', 3, true, true); // Mobile: 2 octaves, mediump, 3 gas layers, mobile stars

// ─── React Component ────────────────────────────────────────────────────
const NebulaBackground = ({ mapPosition = { x: 0, y: 0 }, onReady }) => {
  const wrapperRef    = useRef(null);
  const canvasRef     = useRef(null);
  const animRef       = useRef(null);
  const mouseRef      = useRef({ x: 0.5, y: 0.5 });
  const mousePrevRef  = useRef({ x: 0.5, y: 0.5 });
  const startTimeRef  = useRef(Date.now());
  const mapPosTargetRef = useRef({ x: 0, y: 0 }); // target from prop
  const mapPosRef       = useRef({ x: 0, y: 0 }); // smoothed value sent to shader
  const onReadyRef      = useRef(onReady);
  const readyFiredRef   = useRef(false);

  // Keep onReady ref current
  useEffect(() => { onReadyRef.current = onReady; }, [onReady]);

  // Keep target in a ref so the WebGL render loop always has the latest value
  useEffect(() => {
    mapPosTargetRef.current = mapPosition;
  }, [mapPosition]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Defer WebGL init to the next macrotask so the loading bar can update
    // (shader compilation blocks the main thread for 2-5s)
    let cleanupFn = null;
    const initTimer = setTimeout(() => {
      cleanupFn = initWebGL(canvas);
    }, 0);

    function initWebGL(canvas) {

    // WebGL context
    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      preserveDrawingBuffer: false,
      desynchronized: true,
      failIfMajorPerformanceCaveat: false,
      powerPreference: 'high-performance',
    });
    if (!gl) {
      console.warn('NebulaBackground: WebGL unavailable');
      canvas.style.background = 'radial-gradient(ellipse at 40% 50%, #1a0525 0%, #0a0510 100%)';
      // Signal ready even on failure so loading screen still ends
      if (onReadyRef.current) onReadyRef.current();
      return () => {};
    }

    // Enable GPU extensions for potential driver optimizations
    gl.getExtension('OES_standard_derivatives');
    gl.getExtension('EXT_shader_texture_lod');

    // Shader helpers
    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    }
    function linkProg(vSrc, fSrc) {
      const v = compile(gl.VERTEX_SHADER, vSrc);
      const f = compile(gl.FRAGMENT_SHADER, fSrc);
      if (!v || !f) return null;
      const p = gl.createProgram();
      gl.attachShader(p, v);
      gl.attachShader(p, f);
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        console.error('Link error:', gl.getProgramInfoLog(p));
        return null;
      }
      p._shaders = [v, f];
      return p;
    }

    // Create programs — mobile uses reduced-octave shader and skips displacement
    const isMobileDevice = window.innerWidth < 768;
    const dispProg   = isMobileDevice ? null : linkProg(VERT, DISP_FRAG);
    const nebulaProg = linkProg(VERT, isMobileDevice ? NEBULA_FRAG_MOBILE : NEBULA_FRAG);
    if (!nebulaProg || (!isMobileDevice && !dispProg)) {
      canvas.style.background = 'radial-gradient(ellipse at 40% 50%, #1a0525 0%, #0a0510 100%)';
      if (onReadyRef.current) onReadyRef.current();
      return () => {};
    }
    console.log('NebulaBackground: both programs compiled & linked');

    // Fullscreen quad
    const quadBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

    // Canvas sizing — use wrapper's real viewport dimensions (avoids mobile 100vh bugs)
    const wrapper = wrapperRef.current;
    const vpW = wrapper ? wrapper.clientWidth  : window.innerWidth;
    const vpH = wrapper ? wrapper.clientHeight : window.innerHeight;
    const dpr = isMobileDevice ? 0.5 : Math.min(window.devicePixelRatio, 1.5);
    let cw = Math.round(vpW * dpr);
    let ch = Math.round(vpH * dpr);
    if (isMobileDevice) {
      const maxDim = 540;
      if (ch > maxDim) { const scale = maxDim / ch; cw = Math.round(cw * scale); ch = maxDim; }
    }
    canvas.width  = cw;
    canvas.height = ch;

    // Displacement FBOs (quarter-res for performance) — desktop only
    let dispW, dispH, fboA, fboB, readFBO, writeFBO, dU, dPosLoc;
    if (!isMobileDevice) {
      dispW = Math.max(256, Math.ceil(canvas.width  / 4));
      dispH = Math.max(256, Math.ceil(canvas.height / 4));

    function createFBO(w, h) {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      const data = new Uint8Array(w * h * 4);
      data.fill(128); // 128/255 = 0.502 -> decodes to ~0.0 displacement
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      const fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      if (status !== gl.FRAMEBUFFER_COMPLETE) {
        console.error('NebulaBackground: FBO incomplete:', status);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return { tex, fb };
    }

      fboA = createFBO(dispW, dispH);
      fboB = createFBO(dispW, dispH);
      readFBO  = fboA;
      writeFBO = fboB;

    // Uniform locations — displacement program
    gl.useProgram(dispProg);
    dU = {
      prev:       gl.getUniformLocation(dispProg, 'u_prev'),
      res:        gl.getUniformLocation(dispProg, 'u_res'),
      mouse:      gl.getUniformLocation(dispProg, 'u_mouse'),
      mousePrev:  gl.getUniformLocation(dispProg, 'u_mousePrev'),
      mouseSpeed: gl.getUniformLocation(dispProg, 'u_mouseSpeed'),
      aspect:     gl.getUniformLocation(dispProg, 'u_aspect'),
    };
    dPosLoc = gl.getAttribLocation(dispProg, 'a_position');
    } // end desktop-only displacement setup

    // Mobile: create a static neutral displacement texture (no interaction)
    let mobileDispTex = null;
    if (isMobileDevice) {
      mobileDispTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, mobileDispTex);
      const neutralData = new Uint8Array(4);
      neutralData.fill(128); // neutral = zero displacement
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, neutralData);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }

    // Uniform locations — nebula program
    gl.useProgram(nebulaProg);
    const nU = {
      time:       gl.getUniformLocation(nebulaProg, 'u_time'),
      resolution: gl.getUniformLocation(nebulaProg, 'u_resolution'),
      disp:       gl.getUniformLocation(nebulaProg, 'u_disp'),
      offset:     gl.getUniformLocation(nebulaProg, 'u_offset'),
      brightness:  gl.getUniformLocation(nebulaProg, 'u_brightness'),
      saturation:  gl.getUniformLocation(nebulaProg, 'u_saturation'),
      colorDepth:  gl.getUniformLocation(nebulaProg, 'u_colorDepth'),
    };
    const nPosLoc = gl.getAttribLocation(nebulaProg, 'a_position');

    // Resize handler
    function resize() {
      const mob = window.innerWidth < 768;
      const d = mob ? 0.5 : Math.min(window.devicePixelRatio, 1.5);
      let rw = Math.round(window.innerWidth  * d);
      let rh = Math.round(window.innerHeight * d);
      if (mob) {
        const maxDim = 540;
        if (rh > maxDim) { const s = maxDim / rh; rw = Math.round(rw * s); rh = maxDim; }
      }
      canvas.width  = rw;
      canvas.height = rh;
      canvas.style.width  = window.innerWidth  + 'px';
      canvas.style.height = window.innerHeight + 'px';
      // Displacement FBOs intentionally keep their size — trails persist through resize
    }
    window.addEventListener('resize', resize);

    // Mouse / pointer tracking — desktop only (no interactive path on mobile)
    function onPointerMove(e) {
      mouseRef.current.x = e.clientX / window.innerWidth;
      mouseRef.current.y = 1.0 - e.clientY / window.innerHeight;
    }
    if (!isMobileDevice) {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('mousemove', onPointerMove, { passive: true });
    }

    // Render loop
    let lastFrame = 0;
    const INTERVAL = 1000 / (isMobileDevice ? 25 : 30);

    function render(timestamp) {
      animRef.current = requestAnimationFrame(render);
      if (timestamp - lastFrame < INTERVAL) return;
      lastFrame = timestamp;

      const elapsed = (Date.now() - startTimeRef.current) / 1000;

      if (!isMobileDevice) {
        // Desktop: full displacement pass with mouse interaction
        const mx = mouseRef.current.x;
        const my = mouseRef.current.y;
        const px = mousePrevRef.current.x;
        const py = mousePrevRef.current.y;
        const speed  = Math.sqrt((mx - px) * (mx - px) + (my - py) * (my - py));
        const aspect = canvas.width / canvas.height;

        // ═══ Pass 1: Update displacement field ═══
        gl.bindFramebuffer(gl.FRAMEBUFFER, writeFBO.fb);
        gl.viewport(0, 0, dispW, dispH);
        gl.useProgram(dispProg);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, readFBO.tex);
        gl.uniform1i(dU.prev, 0);
        gl.uniform2f(dU.res, dispW, dispH);
        gl.uniform2f(dU.mouse, mx, my);
        gl.uniform2f(dU.mousePrev, px, py);
        gl.uniform1f(dU.mouseSpeed, speed);
        gl.uniform1f(dU.aspect, aspect);

        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
        gl.enableVertexAttribArray(dPosLoc);
        gl.vertexAttribPointer(dPosLoc, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // Swap ping-pong
        const tmp = readFBO;
        readFBO  = writeFBO;
        writeFBO = tmp;

        // Store previous mouse for next frame's velocity
        mousePrevRef.current.x = mx;
        mousePrevRef.current.y = my;
      }

      // ═══ Pass 2: Render nebula to screen ═══
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(nebulaProg);

      // Smoothly lerp map offset to prevent glitchy noise jumps during fast panning
      const lerpFactor = 0.04;
      mapPosRef.current.x += (mapPosTargetRef.current.x - mapPosRef.current.x) * lerpFactor;
      mapPosRef.current.y += (mapPosTargetRef.current.y - mapPosRef.current.y) * lerpFactor;

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, isMobileDevice ? mobileDispTex : readFBO.tex);
      gl.uniform1i(nU.disp, 0);
      gl.uniform1f(nU.time, elapsed);
      gl.uniform2f(nU.resolution, canvas.width, canvas.height);
      gl.uniform2f(nU.offset, mapPosRef.current.x, mapPosRef.current.y);
      gl.uniform1f(nU.brightness, isMobileDevice ? 1.4 : 1.3);
      gl.uniform1f(nU.saturation, isMobileDevice ? 1.6 : 1.6);
      gl.uniform1f(nU.colorDepth, isMobileDevice ? 1.8 : 1.8);

      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
      gl.enableVertexAttribArray(nPosLoc);
      gl.vertexAttribPointer(nPosLoc, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // Signal ready after first frame is fully rendered
      if (!readyFiredRef.current) {
        readyFiredRef.current = true;
        // Use gl.finish() to ensure GPU has completed all draw calls
        gl.finish();
        if (onReadyRef.current) onReadyRef.current();
      }
    }
    animRef.current = requestAnimationFrame(render);

    // Visibility API — pause when tab hidden
    function onVisibility() {
      if (document.hidden) {
        if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
      } else {
        if (!animRef.current) { lastFrame = 0; animRef.current = requestAnimationFrame(render); }
      }
    }
    document.addEventListener('visibilitychange', onVisibility);

    // Cleanup returned from initWebGL
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      if (!isMobileDevice) {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('mousemove', onPointerMove);
      }
      document.removeEventListener('visibilitychange', onVisibility);
      if (dispProg)   { dispProg._shaders.forEach(s => gl.deleteShader(s));   gl.deleteProgram(dispProg); }
      if (nebulaProg) { nebulaProg._shaders.forEach(s => gl.deleteShader(s)); gl.deleteProgram(nebulaProg); }
      gl.deleteBuffer(quadBuf);
      if (fboA) { gl.deleteTexture(fboA.tex);  gl.deleteFramebuffer(fboA.fb); }
      if (fboB) { gl.deleteTexture(fboB.tex);  gl.deleteFramebuffer(fboB.fb); }
      if (mobileDispTex) gl.deleteTexture(mobileDispTex);
      // Force-release the WebGL context so it doesn't linger during hot-reload
      const loseCtx = gl.getExtension('WEBGL_lose_context');
      if (loseCtx) loseCtx.loseContext();
    };

    } // end initWebGL

    // useEffect cleanup: clear deferred init timer + inner cleanup
    return () => {
      clearTimeout(initTimer);
      if (cleanupFn) cleanupFn();
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
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

export default NebulaBackground;
