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
    if (u_mouseSpeed > 0.0003) {
      // Aspect-correct coordinates for circular brush
      vec2 uvA  = uv          * vec2(u_aspect, 1.0);
      vec2 mA   = u_mouse     * vec2(u_aspect, 1.0);
      vec2 mpA  = u_mousePrev * vec2(u_aspect, 1.0);

      // Distance from this pixel to the stroke segment
      float dist = segDist(uvA, mpA, mA);

      // Adaptive brush radius: faster = wider wake
      float brushR = 0.04 + u_mouseSpeed * 2.5;
      brushR = min(brushR, 0.20);

      // Smooth cubic falloff
      float falloff = 1.0 - smoothstep(0.0, brushR, dist);
      falloff = falloff * falloff;

      // Direction of mouse movement (in UV space)
      vec2 moveDir = u_mouse - u_mousePrev;
      float spd = length(moveDir);
      vec2 dir = spd > 1e-5 ? moveDir / spd : vec2(0.0);

      // Capped strength
      float str = min(spd * 5.0, 0.07);

      // Push 1: drag paint forward along movement direction
      vec2 push = dir * falloff * str;

      // Push 2: radial push paint away from the stroke path (wake)
      vec2 closestA = segClosest(uvA, mpA, mA);
      vec2 radDir = uvA - closestA;
      float radLen = length(radDir);
      if (radLen > 0.001) {
        vec2 rn = radDir / radLen;
        rn.x /= u_aspect;
        push += normalize(rn) * falloff * str * 0.5;
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
const NEBULA_FRAG = `
  precision mediump float;

  uniform float     u_time;
  uniform vec2      u_resolution;
  uniform sampler2D u_disp;   // accumulated displacement field
  uniform vec2      u_offset; // map navigation offset (viewport units)

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
    for (int i = 0; i < 5; i++) {
      v += a * noise(p * f);
      f *= 2.0; a *= 0.5;
    }
    return v;
  }

  float warpedFbm(vec2 p, float t) {
    vec2 q = vec2(fbm(p + 0.05 * t), fbm(p + vec2(5.2, 1.3) + 0.065 * t));
    vec2 r = vec2(
      fbm(p + 4.0 * q + vec2(1.7, 9.2) + 0.035 * t),
      fbm(p + 4.0 * q + vec2(8.3, 2.8) + 0.04 * t)
    );
    return fbm(p + 4.0 * r);
  }

  float stars(vec2 uv, float density) {
    vec2 cell = floor(uv * density);
    vec2 local = fract(uv * density);
    float h = hash(cell);
    if (h > 0.15) return 0.0;
    vec2 sp = vec2(hash(cell + 0.1), hash(cell + 0.2));
    float d = length(local - sp);
    float sz = 0.015 + 0.025 * hash(cell + 0.3);
    float b = smoothstep(sz, sz * 0.1, d);
    b *= 0.6 + 0.4 * sin(u_time * (2.0 + 4.0 * hash(cell + 0.5)) + hash(cell + 0.7) * 6.28);
    return b;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;

    // Read accumulated displacement
    vec2 disp = texture2D(u_disp, uv).xy * 2.0 - 1.0;

    float t = u_time * 0.14;

    // Map navigation offset — shifts nebula perspective when panning to other sections
    // Scale factor controls how much of the nebula we see per viewport of movement
    vec2 mapOff = u_offset * vec2(0.35, 0.35);

    // Parallax-depth displacement per layer
    // Far layers move less, close layers move more (paint-stirring depth)
    // Each layer gets a different parallax factor for the map offset too
    vec2 p1 = (uv + disp * 0.25 - 0.5) * vec2(aspect, 1.0) + mapOff * 0.3;
    vec2 p2 = (uv + disp * 0.45 - 0.5) * vec2(aspect, 1.0) + mapOff * 0.5;
    vec2 p3 = (uv + disp * 0.65 - 0.5) * vec2(aspect, 1.0) + mapOff * 0.7;

    // Layer 1: Deep background gas (near-black purple)
    float n1 = warpedFbm(p1 * 1.2 + vec2(0.0, t * 0.3), t);
    vec3 deepColor = mix(
      vec3(0.012, 0.004, 0.025),    // almost black
      vec3(0.04, 0.012, 0.07),      // very dark purple
      n1
    );

    // Layer 2: Mid nebula clouds (dark magenta / deep-orange tint)
    float n2 = warpedFbm(p2 * 1.8 + vec2(3.1, 1.7) + vec2(t * 0.3, t * 0.08), t * 1.2);
    vec3 midColor = mix(
      vec3(0.11, 0.018, 0.08),      // dark magenta (slightly brighter)
      vec3(0.18, 0.05, 0.025),      // deep burnt-orange tint
      n2 * n2
    );
    float midMask = smoothstep(0.40, 0.72, n2);

    // Layer 3: Bright nebula core (violet / magenta)
    float n3 = warpedFbm(p3 * 2.5 + vec2(7.5, 3.2) + vec2(t * 0.12, t * 0.18), t * 0.8);
    vec3 brightColor = mix(
      vec3(0.15, 0.025, 0.19),      // dark violet (slightly brighter)
      vec3(0.27, 0.05, 0.23),       // magenta-violet (slightly brighter)
      n3
    );
    // Deep orange accent — only in the brightest peaks
    float orangeMask = smoothstep(0.58, 0.88, n3);
    brightColor = mix(brightColor, vec3(0.32, 0.10, 0.025), orangeMask * 0.35);
    float brightMask = smoothstep(0.45, 0.78, n3) * smoothstep(0.40, 0.62, n2);

    // Layer 4: Edge emission (deep orange / dark magenta whispers)
    float edge = abs(n2 - 0.5) * 2.0;
    float edgeGlow = smoothstep(0.50, 0.90, edge);
    vec3 edgeColor = mix(
      vec3(0.25, 0.075, 0.018),     // deep orange
      vec3(0.15, 0.03, 0.11),       // dark magenta
      fbm(p2 * 3.0 + t * 0.1)
    );

    // Compose nebula
    vec3 color = deepColor;
    color = mix(color, midColor, midMask * 0.55);
    color = mix(color, brightColor, brightMask * 0.45);
    color = mix(color, edgeColor, edgeGlow * 0.22);

    // Ambient breathing
    float breath = 0.92 + 0.08 * sin(t * 2.5 + n1 * 3.0);
    color *= breath;

    // Stars (not displaced, dimmed to match dark palette)
    // Stars also shift with map offset for consistent movement
    vec2 starUv = uv + mapOff * 0.3;
    float s1 = stars(starUv, 90.0);
    float s2 = stars(starUv, 35.0);
    vec3 sc1 = mix(vec3(0.6, 0.6, 0.8), vec3(0.8, 0.7, 0.5), hash(floor(starUv * 90.0)));
    vec3 sc2 = mix(vec3(0.8, 0.75, 0.7), vec3(0.9, 0.6, 0.35), hash(floor(starUv * 35.0) + 99.0));
    color += sc1 * s1 * 0.25;
    color += sc2 * s2 * 0.5;

    // Strong vignette (deepen edges)
    float vig = 1.0 - dot(uv - 0.5, uv - 0.5) * 1.4;
    color *= smoothstep(0.0, 0.50, vig);

    gl_FragColor = vec4(max(color, 0.0), 1.0);
  }
`;

// ─── React Component ────────────────────────────────────────────────────
const NebulaBackground = ({ mapPosition = { x: 0, y: 0 } }) => {
  const canvasRef     = useRef(null);
  const animRef       = useRef(null);
  const mouseRef      = useRef({ x: 0.5, y: 0.5 });
  const mousePrevRef  = useRef({ x: 0.5, y: 0.5 });
  const startTimeRef  = useRef(Date.now());
  const mapPosTargetRef = useRef({ x: 0, y: 0 }); // target from prop
  const mapPosRef       = useRef({ x: 0, y: 0 }); // smoothed value sent to shader

  // Keep target in a ref so the WebGL render loop always has the latest value
  useEffect(() => {
    mapPosTargetRef.current = mapPosition;
  }, [mapPosition]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // WebGL context
    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      preserveDrawingBuffer: false,
      powerPreference: 'low-power',
    });
    if (!gl) {
      console.warn('NebulaBackground: WebGL unavailable');
      canvas.style.background = 'radial-gradient(ellipse at 40% 50%, #1a0525 0%, #0a0510 100%)';
      return;
    }

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
    if (!dispProg || !nebulaProg) {
      canvas.style.background = 'radial-gradient(ellipse at 40% 50%, #1a0525 0%, #0a0510 100%)';
      return;
    }
    console.log('NebulaBackground: both programs compiled & linked');

    // Fullscreen quad
    const quadBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

    // Canvas sizing
    const dpr = Math.min(window.devicePixelRatio, 1.5);
    canvas.width  = window.innerWidth  * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width  = window.innerWidth  + 'px';
    canvas.style.height = window.innerHeight + 'px';

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

    const fboA = createFBO(dispW, dispH);
    const fboB = createFBO(dispW, dispH);
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
    };
    const nPosLoc = gl.getAttribLocation(nebulaProg, 'a_position');

    // Resize handler
    function resize() {
      const d = Math.min(window.devicePixelRatio, 1.5);
      canvas.width  = window.innerWidth  * d;
      canvas.height = window.innerHeight * d;
      canvas.style.width  = window.innerWidth  + 'px';
      canvas.style.height = window.innerHeight + 'px';
      // Displacement FBOs intentionally keep their size — trails persist through resize
    }
    window.addEventListener('resize', resize);

    // Mouse tracking (unthrottled for smooth strokes)
    function onMouseMove(e) {
      mouseRef.current.x = e.clientX / window.innerWidth;
      mouseRef.current.y = 1.0 - e.clientY / window.innerHeight;
    }
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // Render loop
    let lastFrame = 0;
    const INTERVAL = 1000 / 30;

    function render(timestamp) {
      animRef.current = requestAnimationFrame(render);
      if (timestamp - lastFrame < INTERVAL) return;
      lastFrame = timestamp;

      const elapsed = (Date.now() - startTimeRef.current) / 1000;
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
      gl.uniform1f(nU.time, elapsed);
      gl.uniform2f(nU.resolution, canvas.width, canvas.height);
      gl.uniform2f(nU.offset, mapPosRef.current.x, mapPosRef.current.y);

      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
      gl.enableVertexAttribArray(nPosLoc);
      gl.vertexAttribPointer(nPosLoc, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // Store previous mouse for next frame's velocity
      mousePrevRef.current.x = mx;
      mousePrevRef.current.y = my;
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

    // Cleanup
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('visibilitychange', onVisibility);
      if (dispProg)   { dispProg._shaders.forEach(s => gl.deleteShader(s));   gl.deleteProgram(dispProg); }
      if (nebulaProg) { nebulaProg._shaders.forEach(s => gl.deleteShader(s)); gl.deleteProgram(nebulaProg); }
      gl.deleteBuffer(quadBuf);
      gl.deleteTexture(fboA.tex);  gl.deleteFramebuffer(fboA.fb);
      gl.deleteTexture(fboB.tex);  gl.deleteFramebuffer(fboB.fb);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
};

export default NebulaBackground;
