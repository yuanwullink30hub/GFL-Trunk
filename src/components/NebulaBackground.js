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
function makeNebulaFrag(fbmOctaves = 5, ridgeOctaves = 5, precision = 'highp', gasLayers = 4) {
  return `
  #extension GL_OES_standard_derivatives : enable
  precision ${precision} float;

  uniform float     u_time;
  uniform vec2      u_resolution;
  uniform sampler2D u_disp;   // accumulated displacement field
  uniform vec2      u_offset; // map navigation offset (viewport units)
  uniform float     u_brightness;  // overall brightness multiplier
  uniform float     u_saturation;  // color saturation boost
  uniform float     u_colorDepth;  // gas color intensity multiplier

  // Noise
  float hash(vec2 p) {
    p = fract(p * vec2(443.8975, 397.2973));
    p += dot(p, p + 19.19);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    // Quintic interpolation (C2 continuous) — eliminates grid artifacts
    f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
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
    if (h > 0.20) return 0.0; // slightly more stars
    vec2 sp = vec2(hash(cell + 0.1), hash(cell + 0.2));
    float d = length(local - sp);
    // Size variety: from pinpricks to small bright dots
    float sz = (0.010 + 0.030 * hash(cell + 0.3)) * sizeScale;
    float b = smoothstep(sz, sz * 0.05, d);
    // Twinkle: very slow, gentle drift — no rapid flashing
    // Small stars (high density calls) get slower multipliers via sizeScale being small
    float twinkleRate = 0.18 + 0.22 * hash(cell + 0.5); // 0.18–0.40 rad/s
    b *= 0.70 + 0.30 * sin(u_time * twinkleRate + hash(cell + 0.7) * 6.28);
    return b;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;

    // Clamp aspect so narrow viewports don't squish features beyond recognition
    aspect = max(aspect, 0.9);

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


    // BG1: Upper — cool violet wash
    vec2 bgN1 = p0 + bgWarpOff - vec2(0.05, 0.22);
    float nebBG1 = exp(-(bgN1.x * bgN1.x * 2.6 + bgN1.y * bgN1.y * 2.25));

    // BG2: Lower-left — warm ember
    vec2 bgN2 = p0 + bgWarpOff - vec2(-0.25, -0.22);
    float nebBG2 = exp(-(bgN2.x * bgN2.x * 3.15 + bgN2.y * bgN2.y * 2.6));

    // BG3: Right — blue haze
    vec2 bgN3 = p0 + bgWarpOff - vec2(0.28, -0.10);
    float nebBG3 = exp(-(bgN3.x * bgN3.x * 3.75 + bgN3.y * bgN3.y * 3.15));


    float bgGaussMask = clamp(nebBG1 + nebBG2 * 0.8 + nebBG3 * 0.6, 0.0, 1.0);

    // ── Spatial confinement: nebulae across the viewport ──

    // Large shared gas envelope — connects all clouds into one continuous mass
    vec2 nEnv = p1 + warpOffset * 0.5 - vec2(0.0, -0.02);
    float nebEnvelope = exp(-(nEnv.x * nEnv.x * 0.68 + nEnv.y * nEnv.y * 0.6));

    // Nebula A: Upper-center — magenta-purple, main feature (wide, pulled toward center)
    vec2 nA = p1 + warpOffset - vec2(-0.05, 0.12);
    float nebA = exp(-(nA.x * nA.x * 2.1 + nA.y * nA.y * 1.88));

    // Nebula B: Lower-left — warm orange-gold (wide, pulled toward center)
    vec2 nB = p1 + warpOffset - vec2(-0.18, -0.16);
    float nebB = exp(-(nB.x * nB.x * 2.4 + nB.y * nB.y * 2.1));

    // Nebula C: Right — phoenix warm, wider base (pulled toward center)
    vec2 nC_base = p1 + warpOffset - vec2(0.20, -0.06);
    float nebC_body = exp(-(nC_base.x * nC_base.x * 3.75 + nC_base.y * nC_base.y * 3.4));
    vec2 nC_lw = nC_base - vec2(-0.06, -0.02);
    vec2 lw = vec2(0.866 * nC_lw.x + 0.5 * nC_lw.y, -0.5 * nC_lw.x + 0.866 * nC_lw.y);
    float nebC_lw = exp(-(lw.x * lw.x * 3.4 + lw.y * lw.y * 7.5));
    vec2 nC_rw = nC_base - vec2(0.07, -0.02);
    vec2 rw = vec2(0.866 * nC_rw.x - 0.5 * nC_rw.y, 0.5 * nC_rw.x + 0.866 * nC_rw.y);
    float nebC_rw = exp(-(rw.x * rw.x * 3.4 + rw.y * rw.y * 7.5));
    vec2 nC_hd = nC_base - vec2(0.01, 0.05);
    vec2 hd = vec2(0.966 * nC_hd.x + 0.259 * nC_hd.y, -0.259 * nC_hd.x + 0.966 * nC_hd.y);
    float nebC_hd = exp(-(hd.x * hd.x * 6.0 + hd.y * hd.y * 3.4));
    vec2 nC_tl = nC_base - vec2(-0.015, -0.07);
    vec2 tl = vec2(0.985 * nC_tl.x + 0.174 * nC_tl.y, -0.174 * nC_tl.x + 0.985 * nC_tl.y);
    float nebC_tl = exp(-(tl.x * tl.x * 5.25 + tl.y * tl.y * 3.0));
    float nebC = max(max(max(nebC_body, nebC_lw), max(nebC_rw, nebC_hd)), nebC_tl);

    // Noise-driven breakup — sculpts organic holes and tendrils in the gas
    float breakup = warpedFbm(p1 * 2.8 + vec2(3.3, 7.7) + t * 0.3, t * 0.8);
    float breakupMask = smoothstep(0.28, 0.52, breakup);

    // Combined cloud mask — envelope connects, clouds overlap and add up
    // Allow values above 1.0 before clamping so overlaps create brighter collision zones
    float rawCloud = nebA + nebB * 1.0 + nebC * 0.85 + nebEnvelope * 0.35;
    float cloudMask = clamp(rawCloud, 0.0, 1.0);
    // Gentle edge softening instead of harsh sharpening
    cloudMask = pow(cloudMask, 1.1);
    // Apply organic breakup — creates holes and tendrils
    cloudMask *= mix(0.65, 1.0, breakupMask);

    // Per-nebula color identity: 0 = purple/magenta, 1 = warm orange
    // Each nebula leans toward a hue but all contain both colors swirling through
    float totalNeb = nebA + nebB + nebC + 0.001;
    float baseHue = (nebA * 0.25 + nebB * 0.55 + nebC * 0.95) / totalNeb;
    // Add large-scale noise to break up the spatial color separation
    // This makes purple streaks appear in warm regions and vice versa
    float hueNoise = fbm(p2 * 2.5 + vec2(13.7, 7.3) + t * 0.10);
    float hueSwirl = warpedFbm(p1 * 1.8 + vec2(5.2, 9.1) + vec2(t * 0.14, -t * 0.09), t * 1.2);
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
    // Galaxy exclusion zones — suppress individual stars within galaxy footprints
    float galExcl2 = smoothstep(0.009, 0.019, length(uv - vec2(0.88, 0.60)));  // right galaxy
    float galExcl3 = smoothstep(0.07, 0.14, length(uv - vec2(0.447, 0.10)));  // bottom galaxy
    float galStarSuppression = min(galExcl2, galExcl3);


    // Ultra-distant micro-star deep field — raised from pinpricks to faint but legible dots
    float bgS0 = stars(bgStarUv * 1.7 + 0.37, 137.0, 1.45);
    color += vec3(0.45, 0.47, 0.65) * bgS0 * 0.95 * galStarSuppression;

    // Tiny distant background stars — dense field, now more visible
    float bgS1 = stars(bgStarUv, 74.0, 1.95);
    vec3 bgSc1 = mix(vec3(0.55, 0.55, 0.85), vec3(0.75, 0.70, 0.55), hash(floor(bgStarUv * 74.0)));
    color += bgSc1 * bgS1 * 1.30 * galStarSuppression;

    // Small background stars — clearly visible points
    float bgS2 = stars(bgStarUv + 0.03, 47.0, 2.05);
    vec3 bgSc2 = mix(vec3(0.62, 0.65, 0.92), vec3(0.88, 0.78, 0.50), hash(floor((bgStarUv + 0.03) * 47.0) + 44.0));
    color += bgSc2 * bgS2 * 1.45 * galStarSuppression;

    // Medium background stars — sparse but clearly visible points
    float bgS3 = stars(bgStarUv + 0.07, 29.0, 1.80);
    vec3 bgSc3 = mix(vec3(0.72, 0.74, 1.00), vec3(1.00, 0.87, 0.54), hash(floor((bgStarUv + 0.07) * 29.0) + 99.0));
    color += bgSc3 * bgS3 * 1.10 * galStarSuppression;

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

    // ── HAND-PLACED GALAXIES — 5 distinct types, scattered across viewport ──
    // Uses bgStarUv (slowest parallax) so they sit deep behind the nebulae.
    // Each galaxy is a function of distance from a fixed UV center.
    {
      // Helper: rotate a 2D vector
      // Galaxy 2: Andromeda-style tilted spiral — highly elongated disk, multiple rings, warm red palette
      {
        vec2 gCenter = vec2(0.88, 0.60);
        vec2 d = (bgStarUv - gCenter) * (1.0 / 0.149);  // 85% of previous size (-15%)
        float angle = 1.05;
        float ca = cos(angle), sa = sin(angle);
        vec2 rd = vec2(ca * d.x + sa * d.y, -sa * d.x + ca * d.y);
        float axisRatio = 0.14;  // highly flattened — Andromeda-style tilted disk
        vec2 ed = vec2(rd.x, rd.y / axisRatio);
        float r = length(ed);
        float rSph2 = length(rd); // unflattened radius — drives spherical bulge for 3D depth

        // Nucleus + bulge — boosted core
        float core  = exp(-r * r * 260.0) * 2.20;
        float bulge = exp(-r * r * 50.0)  * 3.00;  // increased bulge
        // Spherical nuclear glow — extends above/below the disk plane, giving volumetric depth
        float sphBulge2 = exp(-rSph2 * rSph2 * 2.8) * 0.28;  // larger, stronger spherical bulge
        // Two distinct brightness rings
        float ring1 = exp(-(r - 0.25) * (r - 0.25) * 500.0) * 0.58;
        float ring2 = exp(-(r - 0.45) * (r - 0.45) * 180.0) * 0.28;
        // Wide faint outer halo
        float halo  = exp(-r * r * 4.0) * 0.10;

        // Primary dust lane — thin dark equatorial strip
        float dustLane = exp(-rd.y * rd.y * 80.0) *
                         smoothstep(0.08, 0.22, abs(rd.x)) *
                         smoothstep(0.56, 0.38, abs(rd.x)) * 0.80;

        // Spiral dust arms — two logarithmic bands that cut into the disk brightness
        float thetaD = atan(ed.y, ed.x);
        float dsd1 = mod(thetaD - r * 8.0 + 0.8 + 3.14159, 6.28318) - 3.14159;
        float dsd2 = mod(thetaD - r * 8.0 - 2.34 + 3.14159, 6.28318) - 3.14159;
        float spiralDust1 = exp(-dsd1 * dsd1 * 9.0) * exp(-r * r * 12.0) *
                            smoothstep(0.12, 0.22, r) * 0.55;
        float spiralDust2 = exp(-dsd2 * dsd2 * 9.0) * exp(-r * r * 12.0) *
                            smoothstep(0.12, 0.22, r) * 0.50;

        // Near/far depth gradient — near side slightly brighter, reinforces perceived tilt
        float nearFar2 = 1.0 + 0.35 * smoothstep(-0.12, 0.30, rd.y);

        float gal = (core + bulge + sphBulge2 + ring1 + ring2 + halo)
                  * nearFar2
                  * (1.0 - dustLane)
                  * (1.0 - spiralDust1)
                  * (1.0 - spiralDust2);

        // Round nucleus: inner color uses rSph2 (spherical), blends to disk r outward
        float rCol2 = mix(rSph2, r, smoothstep(0.0, 0.60, r));  // wider round-nucleus zone
        // White nucleus → warm amber → orange-red disk → muted red → dark outer halo
        vec3 col = vec3(1.00, 0.98, 0.94);
        col = mix(col, vec3(0.96, 0.82, 0.50), smoothstep(0.0,  0.10, rCol2));
        col = mix(col, vec3(0.85, 0.48, 0.25), smoothstep(0.10, 0.28, rCol2));
        col = mix(col, vec3(0.55, 0.22, 0.16), smoothstep(0.28, 0.50, rCol2));
        col = mix(col, vec3(0.18, 0.07, 0.09), smoothstep(0.50, 0.70, rCol2));

        color += col * max(gal, 0.0);
      }

      // Galaxy 3: Tilted spiral vortex — elliptical disk, sharp winding arms, bright centre → dim arms
      {
        vec2 gCenter = vec2(0.447, 0.10);
        vec2 d = (bgStarUv - gCenter) * 4.77;  // 70% of previous size
        float angle = -0.55;
        float ca = cos(angle), sa = sin(angle);
        vec2 rd = vec2(ca * d.x + sa * d.y, -sa * d.x + ca * d.y);
        float axisRatio = 0.30;           // clearly tilted ellipse
        vec2 ed = vec2(rd.x, rd.y / axisRatio);
        float r = length(ed);
        float rSph3 = length(rd); // unflattened radius — drives spherical bulge for 3D depth
        float theta = atan(ed.y, ed.x);

        // Elliptical nucleus — restored larger core
        float core  = exp(-r * r * 48.0) * 3.20;  // boosted core — clearly dominant (wider)
        float bulge = exp(-r * r * 14.0) * 2.70;  // increased bulge (wider)
        // Spherical nuclear glow — bulge pops out of the disk plane for volumetric 3D depth
        float sphBulge3 = exp(-rSph3 * rSph3 * 3.2) * 0.25;  // larger, stronger spherical bulge
        // Dim background fill
        float disk  = exp(-r * r * 5.0)   * 0.03;

        // Primary spiral arms — 4 arms (sin(2x) = 4 peaks/revolution), thinner per arm
        float pitch = 9.0;
        float spiralPhase = theta - r * pitch;
        // sin(2*phase) → 4 arms; exponent 11 = thin arms with clear dark gaps
        float armShape = pow(abs(sin(2.0 * spiralPhase)), 11.0);
        // Inter-arm haze: 0.22 base keeps the disk faintly visible between arms → no hard black ring
        float armWithHaze = 0.22 + 0.78 * armShape;
        float armEnv   = exp(-r * r * 8.6) * smoothstep(0.016, 0.064, r);
        float arms     = armWithHaze * armEnv * 0.75;

        // Secondary inner winding — 4 arms, slightly offset in phase for depth
        float armShape2 = pow(abs(sin(2.0 * spiralPhase + 0.5)), 7.0);
        float arms2haze = 0.18 + 0.82 * armShape2;
        float arms2     = arms2haze * exp(-r * r * 6.25) * smoothstep(0.048, 0.16, r) * 0.24;

        // Tertiary outer wisp — softer, wider outer traces
        float armShape3 = pow(abs(sin(2.0 * spiralPhase - 0.4)), 4.0);
        float arms3haze = 0.12 + 0.88 * armShape3;
        float arms3     = arms3haze * exp(-r * r * 4.4) * smoothstep(0.12, 0.28, r) * 0.09;

        // HII region knots / bright star-forming clumps scattered along arms
        vec2 k1 = rd - vec2( 0.09,  0.02);  float knot1 = exp(-dot(k1,k1) * 3000.0) * 1.4;
        vec2 k2 = rd - vec2(-0.07,  0.04);  float knot2 = exp(-dot(k2,k2) * 3000.0) * 1.1;
        vec2 k3 = rd - vec2( 0.14, -0.03);  float knot3 = exp(-dot(k3,k3) * 2000.0) * 0.9;
        vec2 k4 = rd - vec2(-0.11, -0.05);  float knot4 = exp(-dot(k4,k4) * 2000.0) * 0.8;
        vec2 k5 = rd - vec2( 0.05,  0.08);  float knot5 = exp(-dot(k5,k5) * 2500.0) * 1.0;
        float knots = knot1 + knot2 + knot3 + knot4 + knot5;

        // Near/far depth gradient along minor axis — near side slightly brighter
        float nearFar3 = 1.0 + 0.28 * smoothstep(-0.20, 0.35, rd.y);

        float gal = (core + bulge + sphBulge3 + disk + arms + arms2 + arms3 + knots) * nearFar3;

        // Round nucleus: inner color uses rSph3 (spherical), blends to disk r outward
        float rCol3 = mix(rSph3, r, smoothstep(0.0, 0.65, r));  // wider round-nucleus zone
        // White-amber grades: blazing white core → warm amber haze → amber-grey → dark warm outer
        vec3 col = vec3(1.00, 1.00, 1.00);
        col = mix(col, vec3(0.98, 0.95, 0.84), smoothstep(0.0,  0.10, rCol3));
        col = mix(col, vec3(0.80, 0.72, 0.52), smoothstep(0.10, 0.25, rCol3));
        col = mix(col, vec3(0.52, 0.46, 0.34), smoothstep(0.25, 0.42, rCol3));
        col = mix(col, vec3(0.18, 0.14, 0.10), smoothstep(0.42, 0.58, rCol3));

        color += col * max(gal, 0.0) * 0.70;  // -30% overall brightness
      }



    }

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
    float n2 = warpedFbm(p2 * 1.8 + vec2(3.1, 1.7) + vec2(t * 0.5, t * 0.14), t * 2.0);
    float filament2 = ridgeFbm(p2 * 3.5 + vec2(2.0, 4.5) + t * 0.08);

    // Magenta-purple grades: pitch black → dark plum → magenta → hot pink → bright rose
    vec3 mag1 = vec3(0.04, 0.005, 0.03);
    vec3 mag2 = vec3(0.10, 0.015, 0.08);
    vec3 mag3 = vec3(0.20, 0.035, 0.16);
    vec3 mag4 = vec3(0.32, 0.06, 0.26);
    vec3 mag5 = vec3(0.50, 0.12, 0.40);
    vec3 midMagenta = mag1;
    midMagenta = mix(midMagenta, mag2, smoothstep(0.12, 0.26, n2));
    midMagenta = mix(midMagenta, mag3, smoothstep(0.26, 0.42, n2));
    midMagenta = mix(midMagenta, mag4, smoothstep(0.42, 0.58, n2));
    midMagenta = mix(midMagenta, mag5, smoothstep(0.58, 0.74, n2));

    // Blue-violet grades: deep navy → slate blue → cerulean → bright blue → electric blue
    vec3 blu1 = vec3(0.02, 0.015, 0.05);
    vec3 blu2 = vec3(0.04, 0.04, 0.12);
    vec3 blu3 = vec3(0.07, 0.08, 0.22);
    vec3 blu4 = vec3(0.12, 0.14, 0.35);
    vec3 blu5 = vec3(0.20, 0.24, 0.52);
    vec3 midBlue = blu1;
    midBlue = mix(midBlue, blu2, smoothstep(0.12, 0.26, n2));
    midBlue = mix(midBlue, blu3, smoothstep(0.26, 0.42, n2));
    midBlue = mix(midBlue, blu4, smoothstep(0.42, 0.58, n2));
    midBlue = mix(midBlue, blu5, smoothstep(0.58, 0.74, n2));

    // Warm orange grades: near-black → deep brown → burnt orange → amber → bright gold
    vec3 wrm1 = vec3(0.04, 0.013, 0.004);
    vec3 wrm2 = vec3(0.135, 0.047, 0.014);
    vec3 wrm3 = vec3(0.30, 0.108, 0.027);
    vec3 wrm4 = vec3(0.51, 0.20, 0.04);
    vec3 wrm5 = vec3(0.62, 0.30, 0.08);
    vec3 midWarm = wrm1;
    midWarm = mix(midWarm, wrm2, smoothstep(0.12, 0.26, n2));
    midWarm = mix(midWarm, wrm3, smoothstep(0.26, 0.42, n2));
    midWarm = mix(midWarm, wrm4, smoothstep(0.42, 0.58, n2));
    midWarm = mix(midWarm, wrm5, smoothstep(0.58, 0.74, n2));

    // Primary blend: magenta→warm (50/35), blue depth accent (15%)
    midMagenta *= 1.27; // boost purple/magenta depth
    vec3 midColor = mix(midMagenta, midWarm, smoothstep(0.25, 0.75, nebulaHue));
    midColor = mix(midColor, midBlue, blueDepth);
    // Blend some filament texture into it
    midColor *= (0.8 + 0.2 * filament2);
    midColor *= u_colorDepth;
    float midMask = smoothstep(0.42, 0.65, n2) * cloudMask * (0.7 + 0.3 * filament2);

    // Layer 3: Bright emission cores — 4-grade ramp to peak brightness
    float n3 = warpedFbm(p3 * 2.5 + vec2(7.5, 3.2) + vec2(t * 0.20, t * 0.30), t * 1.4);
    float filament3 = ridgeFbm(p3 * 4.0 + vec2(1.3, 7.1) + t * 0.05);

    // Purple core grades: dark violet → vivid purple → magenta → hot white-pink
    vec3 cp1 = vec3(0.12, 0.02, 0.16);
    vec3 cp2 = vec3(0.25, 0.04, 0.30);
    vec3 cp3 = vec3(0.42, 0.08, 0.38);
    vec3 cp4 = vec3(0.65, 0.20, 0.55);
    vec3 corePurple = cp1;
    corePurple = mix(corePurple, cp2, smoothstep(0.25, 0.43, n3));
    corePurple = mix(corePurple, cp3, smoothstep(0.43, 0.60, n3));
    corePurple = mix(corePurple, cp4, smoothstep(0.60, 0.78, n3));

    // Blue core grades: deep indigo → sapphire → bright blue → white-blue
    vec3 cb1 = vec3(0.04, 0.03, 0.14);
    vec3 cb2 = vec3(0.08, 0.08, 0.28);
    vec3 cb3 = vec3(0.14, 0.16, 0.42);
    vec3 cb4 = vec3(0.28, 0.32, 0.62);
    vec3 coreBlue = cb1;
    coreBlue = mix(coreBlue, cb2, smoothstep(0.25, 0.43, n3));
    coreBlue = mix(coreBlue, cb3, smoothstep(0.43, 0.60, n3));
    coreBlue = mix(coreBlue, cb4, smoothstep(0.60, 0.78, n3));

    // Orange core grades: dark red-brown → ember → fire → white-gold
    vec3 co1 = vec3(0.19, 0.054, 0.014);
    vec3 co2 = vec3(0.40, 0.135, 0.027);
    vec3 co3 = vec3(0.67, 0.30, 0.054);
    vec3 co4 = vec3(0.80, 0.44, 0.14);
    vec3 coreOrange = co1;
    coreOrange = mix(coreOrange, co2, smoothstep(0.25, 0.43, n3));
    coreOrange = mix(coreOrange, co3, smoothstep(0.43, 0.60, n3));
    coreOrange = mix(coreOrange, co4, smoothstep(0.60, 0.78, n3));

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
    // Stars peek through nebula: min 12% visible even in densest gas → looks like real astrophoto
    float starOcclusion = mix(0.12, 1.0, pow(1.0 - cloudMask, 1.1));
    color = deepColor + bgStars * starOcclusion; // stars behind gas — faintly glow through

    // ── Background Gaussian glow — deep-space luminosity behind main gas ──
    // Adds subtle color wash visible in voids and partially through thin gas
    vec3 bgGlow = vec3(0.0);
    // Cool violet — upper wash
    bgGlow += mix(vec3(0.012, 0.007, 0.032), vec3(0.028, 0.014, 0.058), n1) * nebBG1;
    // Warm ember — lower-left
    bgGlow += mix(vec3(0.028, 0.010, 0.005), vec3(0.048, 0.022, 0.010), n1) * nebBG2;
    // Cool blue — right haze
    bgGlow += mix(vec3(0.007, 0.010, 0.025), vec3(0.016, 0.022, 0.045), n1) * nebBG3;
    // Show through voids, mostly hidden behind dense foreground gas
    color += bgGlow * pow(1.0 - cloudMask, 1.4);

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
    color *= (1.0 - voidMask * 0.25); // darken in dust lanes

    // Hot emission highlights — bright white/pink peaks at densest cores
    float hotSpot = smoothstep(0.75, 0.88, n3) * smoothstep(0.62, 0.72, n2) * cloudMask;
    hotSpot = pow(hotSpot, 2.0); // concentrate to peaks
    // White-hot tint: desaturates toward white at the brightest peaks
    vec3 hotTint = mix(vec3(1.0, 0.82, 0.90), vec3(1.0, 0.95, 0.93), hotSpot);
    color += hotTint * hotSpot * 0.12;

    // Skip border/edge hotspots (2 octaves = too smooth → giant white blocks)

    // Luminous filament wisps — thin bright edges where gas density changes sharply
    float wisp = abs(n2 - 0.48) * 2.0;
    float wispGlow = smoothstep(0.82, 0.95, wisp) * smoothstep(0.35, 0.50, n2) * cloudMask * filament3;
    vec3 wispColor = mix(vec3(0.7, 0.5, 0.85), vec3(0.9, 0.7, 0.5), nebulaHue);
    color += wispColor * wispGlow * 0.06;

    // S-curve contrast — crushes blacks deeper, lifts highlights
    // Subtle per-channel sigmoid: x → x^g / (x^g + (1-x)^g)  with g ≈ 1.15
    vec3 cNorm = clamp(color * 2.8, 0.0, 1.0); // normalize to 0-1 range for curve
    float g = 1.08;
    vec3 curved = pow(cNorm, vec3(g)) / (pow(cNorm, vec3(g)) + pow(vec3(1.0) - cNorm, vec3(g)) + 0.001);
    color = mix(color, curved * 0.357, 0.20); // blend contrast curve

    // Ambient breathing — deeper pulses for richer color moments
    float breath = 0.88 + 0.12 * sin(t * 3.5 + n1 * 3.0) + 0.05 * sin(t * 7.3 + n2 * 2.0);
    color *= breath;

    // ── MIDGROUND STARS (partially occluded by gas) ──
    vec2 midStarUv = uv + mapOff * 0.35; // medium parallax
    // Midground stars partially visible through gas — 8% minimum so they glow inside nebula
    float gasOcclusion = mix(0.08, 1.0, pow(1.0 - cloudMask, 1.2));

    // Medium midground stars — layer 1
    float mS1 = stars(midStarUv, 50.0, 1.35);
    vec3 mSc1 = mix(vec3(0.72, 0.74, 0.95), vec3(0.92, 0.82, 0.58), hash(floor(midStarUv * 50.0) + 55.0));
    color += mSc1 * mS1 * 0.85 * gasOcclusion * galStarSuppression;

    // Medium midground stars — layer 2
    float mS1b = stars(midStarUv + 0.05, 45.0, 1.35);
    vec3 mSc1b = mix(vec3(0.65, 0.68, 0.90), vec3(0.88, 0.76, 0.50), hash(floor((midStarUv + 0.05) * 45.0) + 123.0));
    color += mSc1b * mS1b * 0.80 * gasOcclusion * galStarSuppression;

    // Medium midground stars — layer 3
    float mS1c = stars(midStarUv + 0.13, 40.0, 1.35);
    vec3 mSc1c = mix(vec3(0.68, 0.72, 0.92), vec3(0.90, 0.78, 0.52), hash(floor((midStarUv + 0.13) * 40.0) + 177.0));
    color += mSc1c * mS1c * 0.78 * gasOcclusion * galStarSuppression;

    // Medium-bright stars — pass 1
    float mS2 = stars(midStarUv + 0.01, 29.0, 1.45);
    vec3 mSc2 = mix(vec3(0.82, 0.80, 0.76), vec3(0.98, 0.74, 0.42), hash(floor((midStarUv + 0.01) * 29.0) + 88.0));
    color += mSc2 * mS2 * 0.95 * gasOcclusion * galStarSuppression;

    // Medium-bright stars — pass 2
    float mS2b = stars(midStarUv + 0.09, 24.0, 1.50);
    vec3 mSc2b = mix(vec3(0.78, 0.80, 1.00), vec3(1.00, 0.88, 0.55), hash(floor((midStarUv + 0.09) * 24.0) + 211.0));
    color += mSc2b * mS2b * 0.95 * gasOcclusion * galStarSuppression;

    // Medium-bright stars — pass 3
    float mS2c = stars(midStarUv + 0.17, 21.0, 1.45);
    vec3 mSc2c = mix(vec3(0.75, 0.78, 0.98), vec3(0.96, 0.85, 0.48), hash(floor((midStarUv + 0.17) * 21.0) + 251.0));
    color += mSc2c * mS2c * 0.92 * gasOcclusion * galStarSuppression;

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

    // ── FOREGROUND STARS (in front of everything) ──
    vec2 fgStarUv = uv + mapOff * 0.55; // fastest parallax — closest layer

    // Foreground small bright stars — slightly dimmed in densest gas
    float fgOcclusion = mix(1.0, 0.5, smoothstep(0.6, 0.95, cloudMask));
    float fgS1 = stars(fgStarUv, 30.0, 1.0);
    vec3 fgSc1 = mix(vec3(0.85, 0.85, 1.0), vec3(1.0, 0.9, 0.6), hash(floor(fgStarUv * 30.0) + 77.0));
    color += fgSc1 * fgS1 * 0.50 * fgOcclusion * galStarSuppression;

    // ── Large bright foreground stars — with diffraction spikes ──
    {
      float density = 10.0;
      for (int dx = -1; dx <= 1; dx++) {
        for (int dy = -1; dy <= 1; dy++) {
          vec2 cell = floor(fgStarUv * density) + vec2(float(dx), float(dy));
          float h = hash(cell + 77.0);
          if (h < 0.12) {
            vec2 sp = (cell + vec2(hash(cell + 0.3), hash(cell + 0.4))) / density;
            // Exclude bright stars within either galaxy's footprint
            // and the left-center zone occupied by hand-placed stars
            if (length(sp - vec2(0.88, 0.60)) > 0.12 && length(sp - vec2(0.447, 0.10)) > 0.08
                && !(sp.x < 0.50 && sp.y > 0.30 && sp.y < 0.75)) {
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
    }

    // ── Hand-placed bright star — top-left, where galaxy was ── (warm red dwarf)
    {
      vec2 hpCenter = vec2(0.13, 0.80);
      vec2 toStar = fgStarUv - hpCenter;
      float d = length(toStar) * 10.0;
      float core = smoothstep(0.030, 0.0, d);
      float glow = exp(-d * d * 52.0) * 0.28;
      float spikeAngle = 0.42;
      float sc = sin(spikeAngle), cc = cos(spikeAngle);
      vec2 rotDiff = abs(vec2(cc * toStar.x + sc * toStar.y, -sc * toStar.x + cc * toStar.y)) * 10.0;
      float spike = exp(-min(rotDiff.x, rotDiff.y) * 22.0) * exp(-max(rotDiff.x, rotDiff.y) * 4.2) * 0.18;
      float brightness = (core + glow + spike) * (0.88 + 0.12 * sin(u_time * 1.3 + 1.1));
      color += vec3(1.0, 0.48, 0.10) * max(brightness, 0.0);
    }

    // ── Hand-placed large stars — prominent foreground stars scattered across the scene ──

    // Blue-white O-type giant — upper-right quadrant
    {
      vec2 hpCenter = vec2(0.72, 0.68);
      vec2 toStar = fgStarUv - hpCenter;
      float d = length(toStar) * 11.0;
      float core = smoothstep(0.028, 0.0, d);
      float glow = exp(-d * d * 44.0) * 0.34;
      float spikeAngle = 0.94;
      float sc = sin(spikeAngle), cc = cos(spikeAngle);
      vec2 rotDiff = abs(vec2(cc * toStar.x + sc * toStar.y, -sc * toStar.x + cc * toStar.y)) * 11.0;
      float spike = exp(-min(rotDiff.x, rotDiff.y) * 18.0) * exp(-max(rotDiff.x, rotDiff.y) * 3.8) * 0.22;
      float brightness = (core + glow + spike) * (0.90 + 0.10 * sin(u_time * 0.8 + 2.3));
      color += vec3(0.75, 0.88, 1.0) * max(brightness, 0.0);
    }

    // White A-type main sequence — blazing white, center-left
    {
      vec2 hpCenter = vec2(0.28, 0.55);
      vec2 toStar = fgStarUv - hpCenter;
      float d = length(toStar) * 10.5;
      float core = smoothstep(0.032, 0.0, d);
      float glow = exp(-d * d * 38.0) * 0.40;
      float spikeAngle = 1.57;  // 90° — clean cross spikes
      float sc = sin(spikeAngle), cc = cos(spikeAngle);
      vec2 rotDiff = abs(vec2(cc * toStar.x + sc * toStar.y, -sc * toStar.x + cc * toStar.y)) * 10.5;
      float spike = exp(-min(rotDiff.x, rotDiff.y) * 16.0) * exp(-max(rotDiff.x, rotDiff.y) * 3.2) * 0.28;
      float brightness = (core + glow + spike) * (0.92 + 0.08 * sin(u_time * 1.1 + 0.7));
      color += vec3(1.0, 0.97, 0.90) * max(brightness, 0.0);
    }

    // Blue giant — upper-left area
    {
      vec2 hpCenter = vec2(0.18, 0.42);
      vec2 toStar = fgStarUv - hpCenter;
      float d = length(toStar) * 10.0;
      float core = smoothstep(0.024, 0.0, d);
      float glow = exp(-d * d * 50.0) * 0.30;
      float spikeAngle = 2.10;
      float sc = sin(spikeAngle), cc = cos(spikeAngle);
      vec2 rotDiff = abs(vec2(cc * toStar.x + sc * toStar.y, -sc * toStar.x + cc * toStar.y)) * 10.0;
      float spike = exp(-min(rotDiff.x, rotDiff.y) * 20.0) * exp(-max(rotDiff.x, rotDiff.y) * 4.0) * 0.19;
      float brightness = (core + glow + spike) * (0.89 + 0.11 * sin(u_time * 1.5 + 1.8));
      color += vec3(0.60, 0.76, 1.0) * max(brightness, 0.0);
    }

    // Orange-yellow K giant — right-center
    {
      vec2 hpCenter = vec2(0.80, 0.38);
      vec2 toStar = fgStarUv - hpCenter;
      float d = length(toStar) * 10.0;
      float core = smoothstep(0.022, 0.0, d);
      float glow = exp(-d * d * 58.0) * 0.24;
      float spikeAngle = 0.75;
      float sc = sin(spikeAngle), cc = cos(spikeAngle);
      vec2 rotDiff = abs(vec2(cc * toStar.x + sc * toStar.y, -sc * toStar.x + cc * toStar.y)) * 10.0;
      float spike = exp(-min(rotDiff.x, rotDiff.y) * 22.0) * exp(-max(rotDiff.x, rotDiff.y) * 4.8) * 0.14;
      float brightness = (core + glow + spike) * (0.91 + 0.09 * sin(u_time * 0.9 + 3.2));
      color += vec3(1.0, 0.78, 0.38) * max(brightness, 0.0);
    }

    // (old single-layer galaxies removed — now split into bg + midground layers above)

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
                color += subColor * max(subBright, 0.0) * fgOcclusion;
              }
              // Cluster ambient glow — stronger for closer clusters
              float clGlow = exp(-clusterDist * clusterDist * (12.0 / (cDist * cDist))) * 0.04 * cDist;
              color += vec3(0.6, 0.6, 0.8) * clGlow * fgOcclusion;
            }
          }
        }
      }
    }

    // Vignette
    float vig = 1.0 - dot(uv - 0.5, uv - 0.5) * 1.2;
    color *= smoothstep(0.0, 0.50, vig);

    color *= u_brightness;

    // Saturation boost — enriches color depth
    float luma = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(vec3(luma), color, u_saturation);

    gl_FragColor = vec4(max(color, 0.0), 1.0);
  }
`;
} // end makeNebulaFrag

const NEBULA_FRAG = makeNebulaFrag(2, 2, 'highp', 3);  // Desktop: 2 octaves, highp, 3 gas layers

// ─── React Component ────────────────────────────────────────────────────
const NebulaBackground = ({ mapPosition = { x: 0, y: 0 }, onReady }) => {
  const wrapperRef      = useRef(null);
  const canvasRef       = useRef(null);
  const videoRef        = useRef(null);
  const animRef         = useRef(null);
  const mouseRef        = useRef({ x: 0.5, y: 0.5 });
  const mousePrevRef    = useRef({ x: 0.5, y: 0.5 });
  const startTimeRef    = useRef(Date.now());
  const mapPosTargetRef = useRef({ x: 0, y: 0 }); // target from prop
  const mapPosRef       = useRef({ x: 0, y: 0 }); // smoothed value sent to shader
  const onReadyRef      = useRef(onReady);
  const readyFiredRef   = useRef(false);
  const isMobile        = typeof window !== 'undefined' && window.innerWidth < 768;

  // Keep onReady ref current
  useEffect(() => { onReadyRef.current = onReady; }, [onReady]);

  // Keep target in a ref so the WebGL render loop always has the latest value
  useEffect(() => {
    mapPosTargetRef.current = mapPosition;
  }, [mapPosition]);

  // ─── MOBILE: Pre-recorded video loop (zero GPU cost) ─────────────────
  useEffect(() => {
    if (!isMobile) return;
    const video = videoRef.current;
    if (!video) return;

    function onCanPlay() {
      video.play().catch(() => {}); // autoplay may be blocked; gradient shows as fallback
      if (onReadyRef.current && !readyFiredRef.current) {
        readyFiredRef.current = true;
        onReadyRef.current();
      }
    }
    function onError() {
      console.warn('NebulaBackground: video failed to load, falling back to gradient');
      if (onReadyRef.current && !readyFiredRef.current) {
        readyFiredRef.current = true;
        onReadyRef.current();
      }
    }
    video.addEventListener('canplaythrough', onCanPlay);
    video.addEventListener('error', onError);
    return () => {
      video.removeEventListener('canplaythrough', onCanPlay);
      video.removeEventListener('error', onError);
      video.pause();
    };
  }, [isMobile]);

  // ─── DESKTOP: WebGL shader path ─────────────────────────────────────
  // Track WebGL init function so context restore can re-run it
  const initCountRef = useRef(0);

  useEffect(() => {
    if (isMobile) return; // mobile uses video, no WebGL
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Defer WebGL init to the next macrotask so the loading bar can update
    // (shader compilation blocks the main thread for 2-5s)
    let cleanupFn = null;
    const initTimer = setTimeout(() => {
      cleanupFn = initWebGL(canvas);
    }, 0);

    // WebGL context loss/restore handlers — browser may kill the context
    // after extended GPU usage; we must detect this and reinitialize
    function onContextLost(e) {
      e.preventDefault(); // tells browser we want to restore
      console.warn('NebulaBackground: WebGL context lost — will restore');
      if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    }
    function onContextRestored() {
      console.log('NebulaBackground: WebGL context restored — reinitializing');
      if (cleanupFn) {
        // Only remove event listeners and animation frame, not the context loss handlers
        if (animRef.current) cancelAnimationFrame(animRef.current);
      }
      readyFiredRef.current = false;
      initCountRef.current += 1;
      cleanupFn = initWebGL(canvas);
    }
    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);

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

    // Create programs
    const dispProg   = linkProg(VERT, DISP_FRAG);
    const nebulaProg = linkProg(VERT, NEBULA_FRAG);
    if (!nebulaProg || !dispProg) {
      canvas.style.background = 'radial-gradient(ellipse at 40% 50%, #1a0525 0%, #0a0510 100%)';
      if (onReadyRef.current) onReadyRef.current();
      return () => {};
    }
    console.log('NebulaBackground: both programs compiled & linked');

    // Fullscreen quad
    const quadBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

    // Canvas sizing — use wrapper's real viewport dimensions
    const wrapper = wrapperRef.current;
    const vpW = wrapper ? wrapper.clientWidth  : window.innerWidth;
    const vpH = wrapper ? wrapper.clientHeight : window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio, 1.5);
    let cw = Math.round(vpW * dpr);
    let ch = Math.round(vpH * dpr);
    canvas.width  = cw;
    canvas.height = ch;

    // Displacement FBOs (quarter-res for performance)
    const dispW = Math.max(256, Math.ceil(canvas.width  / 4));
    const dispH = Math.max(256, Math.ceil(canvas.height / 4));

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

    let fboA = createFBO(dispW, dispH);
    let fboB = createFBO(dispW, dispH);
    let readFBO  = fboA;
    let writeFBO = fboB;

    // Uniform locations — displacement program
    gl.useProgram(dispProg);
    const dU = {
      prev:       gl.getUniformLocation(dispProg, 'u_prev'),
      res:        gl.getUniformLocation(dispProg, 'u_res'),
      mouse:      gl.getUniformLocation(dispProg, 'u_mouse'),
      mousePrev:  gl.getUniformLocation(dispProg, 'u_mousePrev'),
      mouseSpeed: gl.getUniformLocation(dispProg, 'u_mouseSpeed'),
      aspect:     gl.getUniformLocation(dispProg, 'u_aspect'),
    };
    const dPosLoc = gl.getAttribLocation(dispProg, 'a_position');

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

    // Resize handler — uses wrapper dimensions to match real visible viewport
    function resize() {
      const w = wrapperRef.current;
      const rVpW = w ? w.clientWidth  : window.innerWidth;
      const rVpH = w ? w.clientHeight : window.innerHeight;
      const d = Math.min(window.devicePixelRatio, 1.5);
      let rw = Math.round(rVpW * d);
      let rh = Math.round(rVpH * d);
      canvas.width  = rw;
      canvas.height = rh;
      // Don't set canvas.style.width/height — CSS 100%/100% in wrapper handles display size
    }
    window.addEventListener('resize', resize);

    // Mouse / pointer tracking
    function onPointerMove(e) {
      mouseRef.current.x = e.clientX / window.innerWidth;
      mouseRef.current.y = 1.0 - e.clientY / window.innerHeight;
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('mousemove', onPointerMove, { passive: true });

    // Render loop
    let lastFrame = 0;
    const INTERVAL = 1000 / 30;

    function render(timestamp) {
      animRef.current = requestAnimationFrame(render);
      if (gl.isContextLost()) return; // context lost — skip until restored
      if (timestamp - lastFrame < INTERVAL) return;
      lastFrame = timestamp;

      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      // Wrap time to prevent unbounded growth — 600s period ensures smooth
      // looping (noise offsets like 0.07*t stay in a small range ≤42)
      const wrappedTime = elapsed % 600;

      // ═══ Pass 1: Update displacement field ═══
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const px = mousePrevRef.current.x;
      const py = mousePrevRef.current.y;
      const speed  = Math.sqrt((mx - px) * (mx - px) + (my - py) * (my - py));
      const aspect = canvas.width / canvas.height;

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

      // ═══ Pass 2: Render nebula to screen ═══
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(nebulaProg);

      // Smoothly lerp map offset to prevent glitchy noise jumps during fast panning
      const lerpFactor = 0.04;
      mapPosRef.current.x += (mapPosTargetRef.current.x - mapPosRef.current.x) * lerpFactor;
      mapPosRef.current.y += (mapPosTargetRef.current.y - mapPosRef.current.y) * lerpFactor;

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, readFBO.tex);
      gl.uniform1i(nU.disp, 0);
      gl.uniform1f(nU.time, wrappedTime);
      gl.uniform2f(nU.resolution, canvas.width, canvas.height);
      gl.uniform2f(nU.offset, mapPosRef.current.x, mapPosRef.current.y);
      gl.uniform1f(nU.brightness, 1.3);
      gl.uniform1f(nU.saturation, 1.6);
      gl.uniform1f(nU.colorDepth, 1.8);

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
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('mousemove', onPointerMove);
      document.removeEventListener('visibilitychange', onVisibility);
      if (dispProg)   { dispProg._shaders.forEach(s => gl.deleteShader(s));   gl.deleteProgram(dispProg); }
      if (nebulaProg) { nebulaProg._shaders.forEach(s => gl.deleteShader(s)); gl.deleteProgram(nebulaProg); }
      gl.deleteBuffer(quadBuf);
      if (fboA) { gl.deleteTexture(fboA.tex);  gl.deleteFramebuffer(fboA.fb); }
      if (fboB) { gl.deleteTexture(fboB.tex);  gl.deleteFramebuffer(fboB.fb); }
      // Force-release the WebGL context so it doesn't linger during hot-reload
      const loseCtx = gl.getExtension('WEBGL_lose_context');
      if (loseCtx) loseCtx.loseContext();
    };

    } // end initWebGL

    // useEffect cleanup: clear deferred init timer + inner cleanup
    return () => {
      clearTimeout(initTimer);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      if (cleanupFn) cleanupFn();
    };
  }, [isMobile]);

  // ─── MOBILE: Render <video> element instead of WebGL canvas ──────────
  if (isMobile) {
    return (
      <div
        ref={wrapperRef}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          cursor: 'inherit',
          background: 'radial-gradient(ellipse at 40% 50%, #1a0525 0%, #0a0510 100%)',
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            resize: 'none',
            outline: 'none',
            border: 'none',
          }}
        >
          <source src="/images/nebula-mobile-loop.mp4"  type="video/mp4" />
          <source src="/images/nebula-mobile-loop.webm" type="video/webm" />
        </video>
      </div>
    );
  }

  // ─── DESKTOP: Render WebGL canvas ────────────────────────────────────
  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        cursor: 'inherit',
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
