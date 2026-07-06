// ============================================================================
// Nebula recorder — dev tool to capture a PERFECT-LOOP nebula video for the
// mobile background (apps/platform/public/images/nebula-mobile-loop.*).
//
// Served by Vite at  http://localhost:3002/nebula-recorder.html
//
// Perfect loop: the nebula shader is driven by linear u_time and is NOT periodic
// (cloud-drift translates the noise field, star twinkle uses incommensurate
// frequencies). To loop it seamlessly over a period T we use the standard
// crossfade-loop: render the scene at time `tt` and again at `tt - T`, then blend
// by w = tt/T.  At w=0 → scene(0); at w→1 → scene(0) again (because tt-T → 0).
// So the first and last frames match exactly → a mathematically seamless loop.
//
// Reuses the EXACT production shader (imported, not copied) so it never drifts.
// ============================================================================
import { VERT, makeNebulaFrag } from '../components/NebulaBackground';

// Same shader config the desktop uses: 2 fbm/ridge octaves, 3 gas layers.
const NEBULA_FRAG = makeNebulaFrag(2, 2, 'highp', 3);

// Simple crossfade blend of two textures.
const BLEND_FRAG = `
  precision highp float;
  uniform sampler2D u_a;
  uniform sampler2D u_b;
  uniform vec2 u_res;
  uniform float u_mix;
  void main() {
    vec2 uv = gl_FragCoord.xy / u_res;
    vec3 a = texture2D(u_a, uv).rgb;
    vec3 b = texture2D(u_b, uv).rgb;
    gl_FragColor = vec4(mix(a, b, u_mix), 1.0);
  }
`;

// ─── DOM ────────────────────────────────────────────────────────────────────
const canvas = document.getElementById('gl');
const $ = (id) => document.getElementById(id);
const ui = {
  sat: $('sat'), satv: $('satv'),
  depth: $('depth'), depthv: $('depthv'),
  bright: $('bright'), brightv: $('brightv'),
  dur: $('dur'), fps: $('fps'), res: $('res'),
  record: $('record'), status: $('status'), bar: $('bar'),
};

// ─── WebGL setup ──────────────────────────────────────────────────────────────
const gl = canvas.getContext('webgl', {
  alpha: false, antialias: false, preserveDrawingBuffer: true,
  premultipliedAlpha: false, powerPreference: 'high-performance',
});
if (!gl) { ui.status.textContent = 'WebGL unavailable in this browser.'; throw new Error('no webgl'); }
gl.getExtension('OES_standard_derivatives');

function compile(type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(s));
    throw new Error('shader compile failed');
  }
  return s;
}
function program(vs, fs) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(p));
    throw new Error('program link failed');
  }
  return p;
}

const nebulaProg = program(VERT, NEBULA_FRAG);
const blendProg = program(VERT, BLEND_FRAG);

// Fullscreen quad
const quad = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, quad);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

function bindQuad(prog) {
  const loc = gl.getAttribLocation(prog, 'a_position');
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
}

const nU = {
  disp: gl.getUniformLocation(nebulaProg, 'u_disp'),
  time: gl.getUniformLocation(nebulaProg, 'u_time'),
  resolution: gl.getUniformLocation(nebulaProg, 'u_resolution'),
  offset: gl.getUniformLocation(nebulaProg, 'u_offset'),
  brightness: gl.getUniformLocation(nebulaProg, 'u_brightness'),
  saturation: gl.getUniformLocation(nebulaProg, 'u_saturation'),
  colorDepth: gl.getUniformLocation(nebulaProg, 'u_colorDepth'),
};
const bU = {
  a: gl.getUniformLocation(blendProg, 'u_a'),
  b: gl.getUniformLocation(blendProg, 'u_b'),
  res: gl.getUniformLocation(blendProg, 'u_res'),
  mix: gl.getUniformLocation(blendProg, 'u_mix'),
};

// Neutral displacement texture (0.5 encodes zero paint displacement) — the mobile
// background is non-interactive, so there's no mouse paint field.
const dispTex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, dispTex);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([128, 128, 0, 255]));
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

// Two render targets (scene at t, scene at t-T)
function makeFBO(w, h) {
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
  return { tex, fb, w, h };
}

let fboA = null, fboB = null, dimW = 0, dimH = 0;
function ensureSize(w, h) {
  if (w === dimW && h === dimH) return;
  dimW = w; dimH = h;
  canvas.width = w; canvas.height = h;
  if (fboA) { gl.deleteTexture(fboA.tex); gl.deleteFramebuffer(fboA.fb); }
  if (fboB) { gl.deleteTexture(fboB.tex); gl.deleteFramebuffer(fboB.fb); }
  fboA = makeFBO(w, h);
  fboB = makeFBO(w, h);
}

// Render the nebula at a given shader time into the bound framebuffer.
function renderNebula(target, shaderTime, w, h) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, target.fb);
  gl.viewport(0, 0, w, h);
  gl.useProgram(nebulaProg);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, dispTex);
  gl.uniform1i(nU.disp, 0);
  gl.uniform1f(nU.time, shaderTime);
  gl.uniform2f(nU.resolution, w, h);
  gl.uniform2f(nU.offset, 0, 0); // mobile: no map navigation
  gl.uniform1f(nU.brightness, parseFloat(ui.bright.value));
  gl.uniform1f(nU.saturation, parseFloat(ui.sat.value));
  gl.uniform1f(nU.colorDepth, parseFloat(ui.depth.value));
  bindQuad(nebulaProg);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

// Draw one frame of the perfect loop at normalized phase p∈[0,1) for period T.
function drawLoopFrame(p, period, w, h) {
  const tt = p * period;
  renderNebula(fboA, tt, w, h);
  renderNebula(fboB, tt - period, w, h);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, w, h);
  gl.useProgram(blendProg);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, fboA.tex);
  gl.uniform1i(bU.a, 0);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, fboB.tex);
  gl.uniform1i(bU.b, 1);
  gl.uniform2f(bU.res, w, h);
  gl.uniform1f(bU.mix, p);
  bindQuad(blendProg);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function currentDims() {
  const [w, h] = ui.res.value.split('x').map(Number);
  return [w, h];
}

// ─── Live preview ─────────────────────────────────────────────────────────────
let recording = false;
let previewStart = null;
function previewLoop(now) {
  requestAnimationFrame(previewLoop);
  if (recording) return; // recorder drives the canvas while capturing
  if (previewStart === null) previewStart = now;
  const [w, h] = currentDims();
  ensureSize(w, h);
  const period = parseFloat(ui.dur.value);
  const p = (((now - previewStart) / 1000) % period) / period;
  drawLoopFrame(p, period, w, h);
}
requestAnimationFrame(previewLoop);

// Live-update slider readouts
function wire(slider, out) { const f = () => out.textContent = parseFloat(slider.value).toFixed(2); slider.addEventListener('input', f); f(); }
wire(ui.sat, ui.satv); wire(ui.depth, ui.depthv); wire(ui.bright, ui.brightv);

// ─── Recording (deterministic, frame-accurate) ───────────────────────────────
function pickMime() {
  const candidates = [
    'video/mp4;codecs=avc1.640028',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  for (const m of candidates) {
    if (window.MediaRecorder && MediaRecorder.isTypeSupported(m)) return m;
  }
  return '';
}

async function record() {
  if (recording) return;
  recording = true;
  ui.record.disabled = true;

  const [w, h] = currentDims();
  ensureSize(w, h);
  const period = parseFloat(ui.dur.value);
  const fps = parseInt(ui.fps.value, 10);
  const totalFrames = Math.round(period * fps);

  const mime = pickMime();
  const ext = mime.startsWith('video/mp4') ? 'mp4' : 'webm';

  // captureStream(0) → manual frame capture via requestFrame() for exact timing.
  const stream = canvas.captureStream(0);
  const track = stream.getVideoTracks()[0];
  const chunks = [];
  const rec = new MediaRecorder(stream, {
    mimeType: mime || undefined,
    videoBitsPerSecond: 12_000_000, // 12 Mbps — high quality master
  });
  rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };

  const done = new Promise((resolve) => { rec.onstop = resolve; });
  rec.start();

  for (let i = 0; i < totalFrames; i++) {
    const p = i / totalFrames; // 0 .. (N-1)/N — frame N would equal frame 0
    drawLoopFrame(p, period, w, h);
    gl.flush();
    if (track.requestFrame) track.requestFrame();
    else if (stream.requestFrame) stream.requestFrame();
    ui.status.textContent = `Recording frame ${i + 1}/${totalFrames}…`;
    ui.bar.style.width = `${((i + 1) / totalFrames) * 100}%`;
    // Yield so the encoder consumes the frame before we draw the next one.
    await new Promise((r) => requestAnimationFrame(r));
  }

  rec.stop();
  await done;

  const blob = new Blob(chunks, { type: mime || 'video/webm' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nebula-mobile-loop.${ext}`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);

  ui.status.textContent = `Done — ${totalFrames} frames, ${period}s @ ${fps}fps (${ext}). Saved nebula-mobile-loop.${ext}`;
  ui.bar.style.width = '0%';
  recording = false;
  ui.record.disabled = false;
  previewStart = null;
}

ui.record.addEventListener('click', record);
