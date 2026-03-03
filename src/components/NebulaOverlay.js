import React, { useRef, useEffect } from 'react';

/**
 * NebulaOverlay — Lightweight foreground gas layer (desktop only)
 *
 * Renders the upper nebula (Nebula A / magenta-purple) with alpha transparency
 * so it can be layered in front of HoloEarth, creating depth.
 * The bottom nebulae (B & C) remain behind HoloEarth in the main canvas.
 * Single-pass, no displacement, no stars — just the gas cloud with alpha.
 */

const VERT = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const OVERLAY_FRAG = `
  precision highp float;

  uniform float u_time;
  uniform vec2  u_resolution;
  uniform vec2  u_offset;
  uniform float u_opacity;      // master opacity for the overlay

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

    float t = u_time * 0.07;
    vec2 mapOff = u_offset * vec2(0.35, 0.35);

    // Use same parallax depth as main nebula (p1 layer) — no displacement for overlay
    vec2 p1 = (uv - 0.5) * vec2(aspect, 1.0) + mapOff * 0.3;
    vec2 p2 = (uv - 0.5) * vec2(aspect, 1.0) + mapOff * 0.5;
    vec2 p3 = (uv - 0.5) * vec2(aspect, 1.0) + mapOff * 0.7;

    // Edge distortion — same as main shader
    float edgeWarp = fbm(p1 * 4.5 + vec2(7.3, 2.1) + t * 0.04) * 0.16 - 0.08;
    float edgeWarp2 = ridgeFbm(p1 * 6.0 + vec2(3.7, 8.4) + t * 0.03) * 0.12 - 0.06;
    float edgeWarp4 = warpedFbm(p1 * 3.0 + vec2(4.8, 6.9), t * 0.5) * 0.14 - 0.07;
    vec2 warpOffset = vec2(edgeWarp, edgeWarp2 + edgeWarp4);

    // ── Nebula A: Top-left corner — magenta-purple, covers logo & header ──
    // Anchored at the top-left corner so gas extends from the very edge
    vec2 nA = p1 + warpOffset - vec2(-0.55, 0.35);
    float nebA = exp(-(nA.x * nA.x * 0.9 + nA.y * nA.y * 1.2));

    // Cloud mask — higher starting value for denser coverage from the start
    float cloudMask = clamp(nebA * 1.6, 0.0, 1.0);
    cloudMask = pow(cloudMask, 1.2);

    // Quick exit if barely visible — skip expensive color grading
    if (cloudMask < 0.005) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
      return;
    }

    // Nebula A is magenta-purple — nebulaHue with wide swings for clashing mixes
    float nebulaHue = 0.25;
    float hueNoise = fbm(p2 * 2.5 + vec2(13.7, 7.3) + t * 0.10);
    float hueSwirl = warpedFbm(p1 * 1.8 + vec2(5.2, 9.1) + vec2(t * 0.14, -t * 0.09), t * 1.2);
    float hueTurb = warpedFbm(p1 * 3.5 + vec2(8.3, 2.6) + vec2(-t * 0.18, t * 0.12), t * 1.8);
    nebulaHue = clamp(nebulaHue + (hueNoise - 0.5) * 0.55 + (hueSwirl - 0.5) * 0.30 + (hueTurb - 0.5) * 0.25, 0.0, 1.0);

    float blueDepth = smoothstep(0.20, 0.45, nebulaHue) * smoothstep(0.85, 0.55, nebulaHue) * 0.20;

    // Volumetric layers — with extra turbulence for internal structure
    float n2 = warpedFbm(p2 * 1.8 + vec2(3.1, 1.7) + vec2(t * 0.5, t * 0.14), t * 2.0);
    float n3 = warpedFbm(p3 * 2.5 + vec2(7.5, 3.2) + vec2(t * 0.20, t * 0.30), t * 1.4);
    float filament2 = ridgeFbm(p2 * 3.5 + vec2(2.0, 4.5) + t * 0.08);

    // Extra turbulence layers — creates internal clashing/mixing within the cloud
    float turb1 = warpedFbm(p1 * 3.2 + vec2(11.4, 3.8) + vec2(t * 0.7, -t * 0.3), t * 2.5);
    float turb2 = ridgeFbm(p2 * 4.8 + vec2(6.1, 14.7) + t * 0.12);
    // Modulate n2/n3 with turbulence — pushes noise values around more aggressively
    n2 = mix(n2, turb1, 0.35);
    n3 = mix(n3, turb1 * turb2, 0.30);

    // Mid-layer color grades (magenta-purple for Nebula A)
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
    midMagenta *= 1.27; // boost purple/magenta depth

    // Some warm bleed
    vec3 wrm3 = vec3(0.30, 0.108, 0.027);
    vec3 wrm4 = vec3(0.51, 0.20, 0.04);
    vec3 midWarm = mix(wrm3, wrm4, smoothstep(0.42, 0.58, n2));

    vec3 midColor = mix(midMagenta, midWarm, smoothstep(0.25, 0.75, nebulaHue));
    midColor = mix(midColor, midColor * vec3(0.6, 0.65, 1.2), blueDepth); // blue tint at depth edges
    midColor *= (0.8 + 0.2 * filament2) * 1.8;  // u_colorDepth equivalent
    float midMask = smoothstep(0.42, 0.65, n2) * cloudMask * (0.7 + 0.3 * filament2);

    // Bright emission cores (purple)
    vec3 cp1 = vec3(0.12, 0.02, 0.16);
    vec3 cp2 = vec3(0.25, 0.04, 0.30);
    vec3 cp3 = vec3(0.42, 0.08, 0.38);
    vec3 cp4 = vec3(0.65, 0.20, 0.55);
    vec3 corePurple = cp1;
    corePurple = mix(corePurple, cp2, smoothstep(0.25, 0.43, n3));
    corePurple = mix(corePurple, cp3, smoothstep(0.43, 0.60, n3));
    corePurple = mix(corePurple, cp4, smoothstep(0.60, 0.78, n3));
    corePurple *= 1.27;

    // Some warm core bleed
    vec3 co2 = vec3(0.40, 0.135, 0.027);
    vec3 co3 = vec3(0.67, 0.30, 0.054);
    vec3 coreWarm = mix(co2, co3, smoothstep(0.43, 0.60, n3));

    vec3 brightColor = mix(corePurple, coreWarm, smoothstep(0.25, 0.75, nebulaHue)) * 1.8;
    float brightMask = smoothstep(0.50, 0.70, n3) * smoothstep(0.42, 0.60, n2) * cloudMask;

    // Compose — just gas, no background
    vec3 color = vec3(0.0);
    color = mix(color, midColor, midMask * 0.70);
    color = mix(color, brightColor, brightMask * 0.60);

    // Rim glow (purple-magenta for Nebula A)
    float rimNoise = fbm(p3 * 3.0 + t * 0.06);
    float rim = smoothstep(0.68, 0.52, n3) * smoothstep(0.40, 0.55, n3) * cloudMask;
    rim = pow(rim, 1.2);
    vec3 rimPurple = mix(vec3(0.18, 0.04, 0.22), vec3(0.38, 0.10, 0.42), rimNoise) * 1.27 * 1.8;
    color += rimPurple * rim * 0.22;

    // Breathing — deeper pulses for richer color moments
    float breath = 0.88 + 0.12 * sin(t * 3.5 + fbm(p1 * 1.2 + vec2(0.0, t * 0.3)) * 3.0) + 0.05 * sin(t * 7.3 + n2 * 2.0);
    color *= breath;

    // Alpha = driven by actual gas brightness, not just spatial mask
    // This prevents dim areas from darkening the lower canvas
    float lum = dot(color, vec3(0.299, 0.587, 0.114));
    float alpha = smoothstep(0.003, 0.035, lum) * cloudMask * u_opacity;
    // Soften outer edges further for natural blend
    alpha *= smoothstep(0.008, 0.06, cloudMask);

    // Directional fade — preserve top-left, fade toward bottom-right
    // Only fade where gas should naturally trail off, not the corner origin
    float fadeRight = smoothstep(0.0, 0.35, uv.x);  // fade near left edge = 0 (no fade)
    float fadeBottom = smoothstep(0.0, 0.35, 1.0 - uv.y); // fade near top edge = 0 (no fade)
    float dirFade = fadeRight * fadeBottom;
    // Gentle fade only on the trailing edges (bottom-right of the cloud)
    alpha *= mix(1.0, dirFade, 0.3);

    gl_FragColor = vec4(color * alpha, alpha);  // premultiplied alpha
  }
`;

const NebulaOverlay = ({ mapPosition = { x: 0, y: 0 }, opacity = 0.55 }) => {
  const wrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const mapPosRef = useRef({ x: 0, y: 0 });
  const mapPosTargetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    mapPosTargetRef.current = mapPosition;
  }, [mapPosition]);

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

    // Compile shader
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

    const prog = linkProg(VERT, OVERLAY_FRAG);
    if (!prog) return;

    // Fullscreen quad
    const quadBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

    // Canvas sizing — use wrapper dimensions
    const dpr = Math.min(window.devicePixelRatio, 1.5);
    const vpW = wrapper.clientWidth;
    const vpH = wrapper.clientHeight;
    const cw = Math.round(vpW * dpr);
    const ch = Math.round(vpH * dpr);
    canvas.width = cw;
    canvas.height = ch;

    // Uniforms
    gl.useProgram(prog);
    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes  = gl.getUniformLocation(prog, 'u_resolution');
    const uOff  = gl.getUniformLocation(prog, 'u_offset');
    const uOpacity = gl.getUniformLocation(prog, 'u_opacity');
    const aPos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    gl.viewport(0, 0, cw, ch);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); // premultiplied alpha

    let running = true;

    function render() {
      if (!running) return;

      // Smooth map position
      const target = mapPosTargetRef.current;
      const curr = mapPosRef.current;
      curr.x += (target.x - curr.x) * 0.08;
      curr.y += (target.y - curr.y) * 0.08;

      const elapsed = (Date.now() - startTimeRef.current) / 1000;

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(prog);
      gl.uniform1f(uTime, elapsed);
      gl.uniform2f(uRes, cw, ch);
      gl.uniform2f(uOff, curr.x, curr.y);
      gl.uniform1f(uOpacity, opacity);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animRef.current = requestAnimationFrame(render);
    }

    animRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
      gl.deleteBuffer(quadBuf);
      gl.deleteProgram(prog);
    };
  }, [opacity]);

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 15,
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

export default NebulaOverlay;
