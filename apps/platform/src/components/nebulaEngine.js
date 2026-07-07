// Nebula WebGL engine — the full two-pass render pipeline (displacement ping-pong +
// nebula pass + 30-min seam crossfade), extracted from NebulaBackground.jsx so it can
// run inside a Web Worker on an OffscreenCanvas.
//
// WHY a worker: on a cold boot (empty driver shader cache) compiling the nebula
// fragment shader takes seconds (5-15s measured on ANGLE/D3D11). In Firefox every
// synchronous WebGL read (getProgramParameter, getUniformLocation, …) blocks the
// calling thread until the GPU process finishes compiling — profiled as a single
// 9.3s LongTask parked in PWebGL::Msg_GetLinkResult that froze even the loading
// spinner. Blocking a WORKER thread instead is invisible: the main thread and
// compositor keep running. Where KHR_parallel_shader_compile exists (Chromium) we
// additionally poll COMPLETION_STATUS_KHR so not even the worker blocks.
//
// Environment-agnostic: no window/document/React access. The host supplies sizes,
// pumps `inputs` (a mutable object read every frame), and receives onReady/onFail.

import { VERT, DISP_FRAG, BLEND_FRAG, NEBULA_FRAG } from './nebulaShaders';

/**
 * @param canvas HTMLCanvasElement or OffscreenCanvas (already sized or sizable)
 * @param opts.width/height initial backing-store size in device pixels
 * @param opts.inputs mutable { mouseX, mouseY, mapX, mapY, frame, visible } — read each frame
 * @param opts.onReady called once, after the first frame has been submitted
 * @param opts.onFail called when WebGL is unavailable or shaders fail (host shows gradient)
 * @returns { resize(w, h), destroy() }
 */
export function createNebulaEngine(canvas, { width, height, inputs, onReady, onFail }) {
  let destroyed = false;
  let readyFired = false;
  let cleanupFn = null;

  const fireReady = () => {
    if (readyFired) return;
    readyFired = true;
    if (onReady) onReady();
  };
  const fail = (msg) => {
    console.warn('NebulaEngine:', msg);
    if (onFail) onFail();
    fireReady(); // loading overlay must still end
  };

  canvas.width = width;
  canvas.height = height;

  // Context loss/restore — the browser may kill the context after extended GPU usage.
  // Both HTMLCanvasElement and OffscreenCanvas fire these events.
  function onContextLost(e) {
    e.preventDefault(); // we want a restore
    console.warn('NebulaEngine: WebGL context lost — will restore');
  }
  function onContextRestored() {
    if (destroyed) return;
    console.log('NebulaEngine: WebGL context restored — reinitializing');
    if (cleanupFn) { cleanupFn(); cleanupFn = null; }
    cleanupFn = init();
  }
  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', onContextRestored);

  function init() {
    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      preserveDrawingBuffer: false,
      desynchronized: true,
      failIfMajorPerformanceCaveat: false,
      powerPreference: 'high-performance',
    });
    if (!gl) {
      fail('WebGL unavailable');
      return () => {};
    }

    // Enable GPU extensions for potential driver optimizations
    gl.getExtension('OES_standard_derivatives');
    gl.getExtension('EXT_shader_texture_lod');

    // Compile + link WITHOUT querying status: a COMPILE_STATUS/LINK_STATUS query right
    // after compileShader forces the driver to finish synchronously (the cold-boot
    // stall). Status is only checked in finishInit, after completion.
    function makeProgram(vSrc, fSrc) {
      const v = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(v, vSrc);
      gl.compileShader(v);
      const f = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(f, fSrc);
      gl.compileShader(f);
      const p = gl.createProgram();
      gl.attachShader(p, v);
      gl.attachShader(p, f);
      gl.linkProgram(p);
      p._shaders = [v, f];
      return p;
    }
    function programOk(p, label) {
      if (gl.getProgramParameter(p, gl.LINK_STATUS)) return true;
      p._shaders.forEach((s) => {
        const log = gl.getShaderInfoLog(s);
        if (log) console.error(`NebulaEngine ${label} shader:`, log);
      });
      console.error(`NebulaEngine ${label} link:`, gl.getProgramInfoLog(p));
      return false;
    }

    // Create ALL programs up front so the driver compiles them as one parallel batch.
    const dispProg   = makeProgram(VERT, DISP_FRAG);
    const nebulaProg = makeProgram(VERT, NEBULA_FRAG);
    let blendProg    = makeProgram(VERT, BLEND_FRAG);

    // KHR_parallel_shader_compile (Chromium): poll once per frame while the driver
    // compiles on background threads — not even this thread blocks. Without it
    // (Firefox) finishInit's LINK_STATUS query blocks — which is why the engine
    // belongs in a worker.
    const parallelExt = gl.getExtension('KHR_parallel_shader_compile');
    let cancelled = false;
    let pollHandle = null;
    let innerCleanup = null;

    function finishInit() {
      if (cancelled || destroyed) return;
      if (!programOk(dispProg, 'displacement') || !programOk(nebulaProg, 'nebula')) {
        fail('shader link failed');
        return;
      }
      if (blendProg && !programOk(blendProg, 'blend')) {
        blendProg._shaders.forEach((s) => gl.deleteShader(s));
        gl.deleteProgram(blendProg);
        blendProg = null; // seam crossfade disabled — render loop handles null
      }
      console.log('NebulaEngine: programs compiled & linked');
      innerCleanup = mainInit();
    }

    if (parallelExt) {
      const poll = () => {
        if (cancelled || destroyed) return;
        const done = [dispProg, nebulaProg, blendProg].every(
          (p) => gl.getProgramParameter(p, parallelExt.COMPLETION_STATUS_KHR)
        );
        if (done) { pollHandle = null; finishInit(); }
        else { pollHandle = requestAnimationFrame(poll); }
      };
      poll();
    } else {
      finishInit();
    }

    function mainInit() {
      // Fullscreen quad
      const quadBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

      // Displacement FBOs (quarter-res for performance) — sized from the INITIAL
      // canvas size (window resizes don't re-create them; unchanged behavior).
      const dispW = Math.max(256, Math.ceil(canvas.width / 4));
      const dispH = Math.max(256, Math.ceil(canvas.height / 4));

      function createFBO(w, h, fill = true) {
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        let data = null;
        if (fill) {
          // 16-bit packed zero displacement: e=0.5 → hi=127, lo=128 per component (RG=x, BA=y)
          data = new Uint8Array(w * h * 4);
          for (let i = 0; i < data.length; i += 2) { data[i] = 127; data[i + 1] = 128; }
        }
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
        // NEAREST is required: the disp channels are 2×8-bit fixed-point pairs — hardware
        // bilinear filtering would blend hi/lo bytes independently and corrupt the values.
        // Smooth interpolation happens after unpacking (sampleDisp in the nebula pass).
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        const fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (status !== gl.FRAMEBUFFER_COMPLETE) {
          console.error('NebulaEngine: FBO incomplete:', status);
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
        decay:      gl.getUniformLocation(dispProg, 'u_decay'),
        diffuse:    gl.getUniformLocation(dispProg, 'u_diffuse'),
        drain:      gl.getUniformLocation(dispProg, 'u_drain'),
      };
      const dPosLoc = gl.getAttribLocation(dispProg, 'a_position');

      // Uniform locations — nebula program
      gl.useProgram(nebulaProg);
      const nU = {
        time:       gl.getUniformLocation(nebulaProg, 'u_time'),
        resolution: gl.getUniformLocation(nebulaProg, 'u_resolution'),
        disp:       gl.getUniformLocation(nebulaProg, 'u_disp'),
        dispRes:    gl.getUniformLocation(nebulaProg, 'u_dispRes'),
        offset:     gl.getUniformLocation(nebulaProg, 'u_offset'),
        brightness: gl.getUniformLocation(nebulaProg, 'u_brightness'),
        saturation: gl.getUniformLocation(nebulaProg, 'u_saturation'),
        colorDepth: gl.getUniformLocation(nebulaProg, 'u_colorDepth'),
      };
      const nPosLoc = gl.getAttribLocation(nebulaProg, 'a_position');

      // ── Seam crossfade resources (blendProg compiled up front, in the parallel batch;
      //    null here if its link failed — the render loop falls back to the single pass) ──
      const bU = blendProg ? {
        texA:       gl.getUniformLocation(blendProg, 'u_texA'),
        texB:       gl.getUniformLocation(blendProg, 'u_texB'),
        fade:       gl.getUniformLocation(blendProg, 'u_fade'),
        resolution: gl.getUniformLocation(blendProg, 'u_resolution'),
      } : null;
      const bPosLoc = blendProg ? gl.getAttribLocation(blendProg, 'a_position') : -1;

      // Full-res scene targets — created lazily on the first seam (most sessions never
      // reach 30 min), recreated if the canvas size changed since.
      let sceneA = null, sceneB = null;
      function ensureSceneFBOs() {
        if (sceneA && sceneA.w === canvas.width && sceneA.h === canvas.height) return;
        if (sceneA) { gl.deleteTexture(sceneA.tex); gl.deleteFramebuffer(sceneA.fb); }
        if (sceneB) { gl.deleteTexture(sceneB.tex); gl.deleteFramebuffer(sceneB.fb); }
        sceneA = createFBO(canvas.width, canvas.height, false); sceneA.w = canvas.width; sceneA.h = canvas.height;
        sceneB = createFBO(canvas.width, canvas.height, false); sceneB.w = canvas.width; sceneB.h = canvas.height;
      }

      // Smoothed map offset — lerps toward the pumped target to prevent glitchy noise
      // jumps during fast panning (was mapPosRef in the component).
      const mapPos = { x: inputs.mapX || 0, y: inputs.mapY || 0 };
      // Previous mouse — for velocity (was mousePrevRef).
      const mousePrev = { x: inputs.mouseX, y: inputs.mouseY };

      // Draw the nebula at a given time into whatever framebuffer/viewport is bound.
      function drawNebula(timeValue) {
        gl.useProgram(nebulaProg);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, readFBO.tex);
        gl.uniform1i(nU.disp, 0);
        gl.uniform2f(nU.dispRes, dispW, dispH);
        gl.uniform1f(nU.time, timeValue);
        gl.uniform2f(nU.resolution, canvas.width, canvas.height);
        gl.uniform2f(nU.offset, mapPos.x, mapPos.y);
        gl.uniform1f(nU.brightness, 1.04);
        gl.uniform1f(nU.saturation, 1.6);
        gl.uniform1f(nU.colorDepth, 1.8);
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
        gl.enableVertexAttribArray(nPosLoc);
        gl.vertexAttribPointer(nPosLoc, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }

      // Render loop — runs permanently; no-ops (cheaply) while inputs.visible is false.
      let raf = null;
      let lastFrame = 0;
      let shaderTime = 0;
      let lastRealTime = null;
      const INTERVAL = 1000 / 49;

      function render(timestamp) {
        if (destroyed) { raf = null; return; }
        raf = requestAnimationFrame(render);
        if (!inputs.visible) { lastRealTime = null; return; }
        if (gl.isContextLost()) return; // skip until restored
        if (timestamp - lastFrame < INTERVAL) return;
        lastFrame = timestamp;

        const now = Date.now() / 1000;
        if (lastRealTime === null) lastRealTime = now;
        const delta = now - lastRealTime;
        lastRealTime = now;
        // Slow nebula time by 30% once the explosion has passed frame 10
        const timeScale = inputs.frame > 10 ? 0.7 : 1.0;
        // Wrap shader time on a 30-min period (float-precision guard). The noise isn't
        // periodic, so noise(t=PERIOD) ≠ noise(t=0) → a hard seam at the wrap. We hide it
        // with a CROSSFADE_SEC dissolve into the next cycle, rendered as a separate
        // two-pass blend (see Pass 2) so the nebula shader is compiled only once.
        const TIME_PERIOD = 1800;   // 30 min
        const CROSSFADE_SEC = 10;
        shaderTime = (shaderTime + delta * timeScale) % TIME_PERIOD;
        const wrappedTime = shaderTime;
        const seamFade = wrappedTime > (TIME_PERIOD - CROSSFADE_SEC)
          ? (wrappedTime - (TIME_PERIOD - CROSSFADE_SEC)) / CROSSFADE_SEC : 0;
        const wrappedTime2 = wrappedTime - TIME_PERIOD; // "next cycle" time (lands at ~0 as fade→1)

        // ═══ Pass 1: Update displacement field ═══
        const mx = inputs.mouseX;
        const my = inputs.mouseY;
        const px = mousePrev.x;
        const py = mousePrev.y;
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
        // Paint physics were hand-tuned per-frame at 30fps. Scale them by the real
        // frame delta so decay/diffusion run at the same RATE regardless of fps —
        // trails fade/spread identically at 49fps (or any fps) as they did at 30.
        const frames30 = Math.min(Math.max(delta, 0) * 30.0, 4.0); // clamp spikes after tab-away
        gl.uniform1f(dU.decay, Math.pow(0.9997, frames30));
        gl.uniform1f(dU.diffuse, Math.min(0.025 * frames30, 0.4));
        // Drains the sub-quantum tail the multiplicative decay can't clear (~28s for
        // the last 5% of a full-strength stroke). 4× the 16-bit storage quantum, so
        // quantization can never stall it.
        gl.uniform1f(dU.drain, 0.00006 * frames30);

        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
        gl.enableVertexAttribArray(dPosLoc);
        gl.vertexAttribPointer(dPosLoc, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // Swap ping-pong
        const tmp = readFBO;
        readFBO  = writeFBO;
        writeFBO = tmp;

        // Store previous mouse for next frame's velocity
        mousePrev.x = mx;
        mousePrev.y = my;

        // Smoothly lerp map offset toward the pumped target
        const lerpFactor = 0.04;
        mapPos.x += (inputs.mapX - mapPos.x) * lerpFactor;
        mapPos.y += (inputs.mapY - mapPos.y) * lerpFactor;

        // ═══ Pass 2: Render nebula to screen ═══
        if (seamFade <= 0 || !blendProg) {
          // Normal path: one nebula pass straight to the screen (unchanged cost).
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          gl.viewport(0, 0, canvas.width, canvas.height);
          drawNebula(wrappedTime);
        } else {
          // Seam dissolve: render the field at the current and next-cycle time to two
          // textures, then blend to screen. ~2× nebula cost, only for the ~10s window
          // each 30 min.
          ensureSceneFBOs();
          gl.bindFramebuffer(gl.FRAMEBUFFER, sceneA.fb);
          gl.viewport(0, 0, canvas.width, canvas.height);
          drawNebula(wrappedTime);
          gl.bindFramebuffer(gl.FRAMEBUFFER, sceneB.fb);
          gl.viewport(0, 0, canvas.width, canvas.height);
          drawNebula(wrappedTime2);
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          gl.viewport(0, 0, canvas.width, canvas.height);
          gl.useProgram(blendProg);
          gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, sceneA.tex); gl.uniform1i(bU.texA, 0);
          gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, sceneB.tex); gl.uniform1i(bU.texB, 1);
          gl.uniform1f(bU.fade, seamFade);
          gl.uniform2f(bU.resolution, canvas.width, canvas.height);
          gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
          gl.enableVertexAttribArray(bPosLoc);
          gl.vertexAttribPointer(bPosLoc, 2, gl.FLOAT, false, 0, 0);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          gl.activeTexture(gl.TEXTURE0); // restore default unit for next frame's disp pass
        }

        // Signal ready once the first frame has been submitted. flush + next-rAF instead
        // of gl.finish(): finish blocks this thread until the GPU completes the full-res
        // frame; by the next rAF it has been presented anyway.
        if (!readyFired) {
          gl.flush();
          requestAnimationFrame(() => fireReady());
          readyFired = true; // guard here; fireReady() itself is idempotent
        }
      }
      raf = requestAnimationFrame(render);

      // Cleanup returned from mainInit
      return () => {
        if (raf) cancelAnimationFrame(raf);
        if (dispProg)   { dispProg._shaders.forEach((s) => gl.deleteShader(s));   gl.deleteProgram(dispProg); }
        if (nebulaProg) { nebulaProg._shaders.forEach((s) => gl.deleteShader(s)); gl.deleteProgram(nebulaProg); }
        gl.deleteBuffer(quadBuf);
        if (fboA) { gl.deleteTexture(fboA.tex);  gl.deleteFramebuffer(fboA.fb); }
        if (fboB) { gl.deleteTexture(fboB.tex);  gl.deleteFramebuffer(fboB.fb); }
        if (sceneA) { gl.deleteTexture(sceneA.tex); gl.deleteFramebuffer(sceneA.fb); }
        if (sceneB) { gl.deleteTexture(sceneB.tex); gl.deleteFramebuffer(sceneB.fb); }
        if (blendProg) { blendProg._shaders.forEach((s) => gl.deleteShader(s)); gl.deleteProgram(blendProg); }
        // Force-release the WebGL context so it doesn't linger during hot-reload
        const loseCtx = gl.getExtension('WEBGL_lose_context');
        if (loseCtx) loseCtx.loseContext();
      };
    } // end mainInit

    // init's own cleanup — valid whether or not compilation has finished yet.
    return () => {
      cancelled = true;
      if (pollHandle) cancelAnimationFrame(pollHandle);
      if (innerCleanup) { innerCleanup(); return; }
      // Compile still in flight (or link failed): delete programs + release the context.
      [dispProg, nebulaProg, blendProg].forEach((p) => {
        if (!p) return;
        p._shaders.forEach((s) => gl.deleteShader(s));
        gl.deleteProgram(p);
      });
      const loseCtx = gl.getExtension('WEBGL_lose_context');
      if (loseCtx) loseCtx.loseContext();
    };
  } // end init

  cleanupFn = init();

  return {
    resize(w, h) {
      canvas.width = w;
      canvas.height = h;
      // Displacement FBOs intentionally keep their init-time size (unchanged behavior).
    },
    destroy() {
      destroyed = true;
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      if (cleanupFn) { cleanupFn(); cleanupFn = null; }
    },
  };
}
