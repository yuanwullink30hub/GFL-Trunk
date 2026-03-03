import React, { useRef, useEffect } from 'react';

/**
 * NebulaOverlay — Lightweight foreground gas layer (desktop only)
 *
 * Renders the bottom-right nebula (Nebula C / phoenix) with alpha transparency
 * so it can be layered in front of HoloEarth, creating depth.
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

    // ── Nebula C: Lower-right phoenix silhouette — exact copy from main shader ──
    // Desktop position: vec2(0.5, -0.38) — same as mobileLayout=true desktop config
    // Using the mobileLayout=true gaussian positions since desktop now uses those
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

    // Cloud mask — just this nebula
    float cloudMask = clamp(nebC * 0.85, 0.0, 1.0);
    cloudMask = pow(cloudMask, 1.5);

    // Quick exit if barely visible — skip expensive color grading
    if (cloudMask < 0.005) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
      return;
    }

    // Nebula C is the phoenix (warm) — nebulaHue ≈ 0.82-0.95
    float nebulaHue = 0.88;
    float hueNoise = fbm(p2 * 2.5 + vec2(13.7, 7.3) + t * 0.06);
    float hueSwirl = warpedFbm(p1 * 1.8 + vec2(5.2, 9.1) + vec2(t * 0.08, -t * 0.05), t * 0.7);
    nebulaHue = clamp(nebulaHue + (hueNoise - 0.5) * 0.40 + (hueSwirl - 0.5) * 0.20, 0.0, 1.0);

    float blueDepth = smoothstep(0.20, 0.45, nebulaHue) * smoothstep(0.85, 0.55, nebulaHue) * 0.15;

    // Volumetric layers — simplified from main shader
    float n2 = warpedFbm(p2 * 1.8 + vec2(3.1, 1.7) + vec2(t * 0.3, t * 0.08), t * 1.2);
    float n3 = warpedFbm(p3 * 2.5 + vec2(7.5, 3.2) + vec2(t * 0.12, t * 0.18), t * 0.8);
    float filament2 = ridgeFbm(p2 * 3.5 + vec2(2.0, 4.5) + t * 0.05);

    // Mid-layer color grades (warm orange for phoenix)
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

    // Some magenta bleed
    vec3 mag3 = vec3(0.20, 0.035, 0.16);
    vec3 mag4 = vec3(0.32, 0.06, 0.26);
    vec3 midMagenta = mix(mag3, mag4, smoothstep(0.48, 0.65, n2)) * 1.27;

    vec3 midColor = mix(midMagenta, midWarm, smoothstep(0.25, 0.75, nebulaHue));
    midColor *= (0.8 + 0.2 * filament2) * 1.8;  // u_colorDepth equivalent
    float midMask = smoothstep(0.42, 0.65, n2) * cloudMask * (0.7 + 0.3 * filament2);

    // Bright emission cores
    vec3 co1 = vec3(0.19, 0.054, 0.014);
    vec3 co2 = vec3(0.40, 0.135, 0.027);
    vec3 co3 = vec3(0.67, 0.30, 0.054);
    vec3 co4 = vec3(0.80, 0.44, 0.14);
    vec3 coreOrange = co1;
    coreOrange = mix(coreOrange, co2, smoothstep(0.3, 0.5, n3));
    coreOrange = mix(coreOrange, co3, smoothstep(0.5, 0.68, n3));
    coreOrange = mix(coreOrange, co4, smoothstep(0.68, 0.85, n3));

    vec3 cp2 = vec3(0.25, 0.04, 0.30);
    vec3 cp3 = vec3(0.42, 0.08, 0.38);
    vec3 corePurple = mix(cp2, cp3, smoothstep(0.5, 0.68, n3)) * 1.27;

    vec3 brightColor = mix(corePurple, coreOrange, smoothstep(0.25, 0.75, nebulaHue)) * 1.8;
    float brightMask = smoothstep(0.50, 0.70, n3) * smoothstep(0.42, 0.60, n2) * cloudMask;

    // Compose — just gas, no background
    vec3 color = vec3(0.0);
    color = mix(color, midColor, midMask * 0.70);
    color = mix(color, brightColor, brightMask * 0.60);

    // Rim glow
    float rimNoise = fbm(p3 * 3.0 + t * 0.06);
    float rim = smoothstep(0.68, 0.52, n3) * smoothstep(0.40, 0.55, n3) * cloudMask;
    rim = pow(rim, 1.2);
    vec3 rimWarm = mix(vec3(0.34, 0.108, 0.027), vec3(0.65, 0.216, 0.054), rimNoise) * 1.8;
    color += rimWarm * rim * 0.22;

    // Breathing
    float breath = 0.93 + 0.07 * sin(t * 2.5 + fbm(p1 * 1.2 + vec2(0.0, t * 0.3)) * 3.0);
    color *= breath;

    // Alpha = gas density, soft edges
    float alpha = cloudMask * u_opacity;
    // Soften outer edges further for natural blend
    alpha *= smoothstep(0.008, 0.06, cloudMask);

    // Vignette — fade edges so the overlay doesn't have hard borders
    float vig = 1.0 - dot(uv - 0.5, uv - 0.5) * 1.2;
    alpha *= smoothstep(0.0, 0.50, vig);

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
