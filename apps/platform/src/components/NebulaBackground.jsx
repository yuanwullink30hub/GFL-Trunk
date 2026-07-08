import React, { useRef, useEffect } from 'react';
import { isIntegratedGPU } from '@gfl/utils';

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

// Shader sources live in nebulaShaders.js (shared with the worker engine + dev
// recorder). Re-exported so existing imports (src/dev/nebulaRecorder.js) keep working.
export { VERT, DISP_FRAG, BLEND_FRAG, makeNebulaFrag, NEBULA_FRAG } from './nebulaShaders';

import { createNebulaEngine } from './nebulaEngine';

// ─── React Component ────────────────────────────────────────────────────
const NebulaBackground = ({ mapPositionRef, onReady, currentFrame = 0, isVisible = true }) => {
  const wrapperRef      = useRef(null);
  const canvasRef       = useRef(null);
  const videoRef        = useRef(null);
  const onReadyRef      = useRef(onReady);
  const readyFiredRef   = useRef(false);
  const isMobile          = typeof window !== 'undefined' && window.innerWidth < 768;
  const isLowGpu           = typeof window !== 'undefined' && isIntegratedGPU();
  const useVideo           = isMobile || isLowGpu; // WebGL for desktop + laptop-with-dedicated-GPU
  const currentFrameRef = useRef(currentFrame); // pumped to the engine each frame
  const isVisibleRef    = useRef(isVisible);

  // Keep onReady + currentFrame + isVisible refs current (the per-frame pump in the
  // WebGL effect forwards them to the engine — worker or inline).
  useEffect(() => { onReadyRef.current = onReady; }, [onReady]);
  useEffect(() => { currentFrameRef.current = currentFrame; }, [currentFrame]);
  useEffect(() => { isVisibleRef.current = isVisible; }, [isVisible]);

  // ─── VIDEO PATH: Pre-recorded video loop for mobile + low-gpu laptops/desktops ──
  useEffect(() => {
    if (!useVideo) return;
    const video = videoRef.current;
    if (!video) return;

    const fireReady = () => {
      video.play().catch(() => {}); // autoplay may be blocked; gradient shows as fallback
      if (onReadyRef.current && !readyFiredRef.current) {
        readyFiredRef.current = true;
        onReadyRef.current();
      }
    };
    // Cached reload: the media can already be buffered before this effect attaches —
    // the events would never re-fire and the boot overlay would hang. Check state first.
    if (video.readyState >= 3) { fireReady(); return () => video.pause(); }
    video.addEventListener('canplay', fireReady);
    video.addEventListener('error', fireReady);
    // Failsafe: a hung fetch (or a codec the browser silently rejects) must never pin the
    // boot overlay — time-box the wait; the gradient background covers the gap.
    const failsafe = setTimeout(fireReady, 5000);
    return () => {
      clearTimeout(failsafe);
      video.removeEventListener('canplay', fireReady);
      video.removeEventListener('error', fireReady);
      video.pause();
    };
  }, [useVideo]);

  // ─── DESKTOP: WebGL shader path (only for >= 1800px) ────────────────
  // The engine (nebulaEngine.js) renders on an OffscreenCanvas inside a Web Worker:
  // cold-boot shader compilation (5-15s on an empty driver cache) blocks only the
  // worker thread, so the main thread — and the loading overlay's spinner — never
  // freeze. Fallback: same engine inline on the main thread (with async compile via
  // KHR_parallel_shader_compile where the browser has it).
  useEffect(() => {
    if (useVideo) return; // mobile + low-gpu use the video loop — no WebGL
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio, 1.25);
    const sizeOf = () => {
      const w = wrapperRef.current;
      return {
        width:  Math.round((w ? w.clientWidth  : window.innerWidth)  * dpr),
        height: Math.round((w ? w.clientHeight : window.innerHeight) * dpr),
      };
    };

    // Input snapshot — pumped to the engine once per frame. The inline fallback reads
    // this exact object; the worker gets a copy posted only when something changed.
    const inputs = {
      mouseX: 0.5,
      mouseY: 0.5,
      mapX: mapPositionRef.current.x,
      mapY: mapPositionRef.current.y,
      frame: currentFrameRef.current,
      visible: isVisibleRef.current && !document.hidden,
    };

    const fireReady = () => {
      if (onReadyRef.current && !readyFiredRef.current) {
        readyFiredRef.current = true;
        onReadyRef.current();
      }
    };
    const onFail = () => {
      // Worker/WebGL failed — static gradient behind everything + end the overlay.
      if (wrapperRef.current) {
        wrapperRef.current.style.background = 'radial-gradient(ellipse at 40% 50%, #1a0525 0%, #0a0510 100%)';
      }
      fireReady();
    };

    let worker = null;
    let engine = null;

    if (typeof canvas.transferControlToOffscreen === 'function' && typeof Worker !== 'undefined') {
      try {
        // Worker FIRST, transfer SECOND: if the Worker constructor throws, the canvas
        // is still untransferred and the inline fallback below can use it.
        worker = new Worker(new URL('./nebulaWorker.js', import.meta.url), { type: 'module' });
        const t0 = performance.now();
        worker.onmessage = (e) => {
          if (e.data === 'ready') {
            console.log(`NebulaBackground: worker nebula ready in ${Math.round(performance.now() - t0)}ms`);
            fireReady();
          } else if (e.data === 'fail') onFail();
        };
        worker.onerror = (e) => {
          console.error('NebulaBackground: worker error:', e.message || e);
          onFail();
        };
        const s = sizeOf();
        const offscreen = canvas.transferControlToOffscreen();
        worker.postMessage(
          { type: 'init', canvas: offscreen, width: s.width, height: s.height, inputs: { ...inputs } },
          [offscreen]
        );
        console.log('NebulaBackground: rendering in worker (OffscreenCanvas) — shader compile off the main thread');
      } catch (err) {
        console.warn('NebulaBackground: offscreen worker unavailable, rendering inline:', err);
        if (worker) { worker.terminate(); worker = null; }
      }
    }
    if (!worker) {
      const s = sizeOf();
      engine = createNebulaEngine(canvas, {
        width: s.width, height: s.height, inputs, onReady: fireReady, onFail,
      });
    }

    // Mouse / pointer tracking — desktop only (WebGL path only runs on desktop >= 1800px)
    const onPointerMove = (e) => {
      inputs.mouseX = e.clientX / window.innerWidth;
      inputs.mouseY = 1.0 - e.clientY / window.innerHeight;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('mousemove', onPointerMove, { passive: true });

    // Per-frame pump: refresh the snapshot from the refs; post to the worker only on
    // change (idle = zero messages). The inline engine shares `inputs` directly.
    let pumpHandle = null;
    let lastSent = null;
    const pump = () => {
      pumpHandle = requestAnimationFrame(pump);
      inputs.mapX = mapPositionRef.current.x;
      inputs.mapY = mapPositionRef.current.y;
      inputs.frame = currentFrameRef.current;
      inputs.visible = isVisibleRef.current && !document.hidden;
      if (worker) {
        if (!lastSent
          || lastSent.mouseX !== inputs.mouseX || lastSent.mouseY !== inputs.mouseY
          || lastSent.mapX !== inputs.mapX || lastSent.mapY !== inputs.mapY
          || lastSent.frame !== inputs.frame || lastSent.visible !== inputs.visible) {
          lastSent = { ...inputs };
          worker.postMessage({ type: 'inputs', inputs: lastSent });
        }
      }
    };
    pumpHandle = requestAnimationFrame(pump);

    // Tab hidden → rAF (and the pump) stops; push the visibility change to the worker
    // immediately so it idles instead of rendering an invisible tab.
    const onVisibility = () => {
      inputs.visible = isVisibleRef.current && !document.hidden;
      if (worker) worker.postMessage({ type: 'inputs', inputs: { ...inputs } });
    };
    document.addEventListener('visibilitychange', onVisibility);

    // Resize — uses wrapper dimensions to match the real visible viewport
    const onResize = () => {
      const s = sizeOf();
      if (worker) worker.postMessage({ type: 'resize', width: s.width, height: s.height });
      else if (engine) engine.resize(s.width, s.height);
    };
    window.addEventListener('resize', onResize);

    return () => {
      if (pumpHandle) cancelAnimationFrame(pumpHandle);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('mousemove', onPointerMove);
      document.removeEventListener('visibilitychange', onVisibility);
      if (worker) {
        const w = worker;
        w.postMessage({ type: 'destroy' }); // releases the GL context (hot-reload hygiene)
        setTimeout(() => w.terminate(), 250);
      }
      if (engine) engine.destroy();
    };
  }, [useVideo]);


  // ─── MOBILE + LOW-GPU: Video loop (pre-recorded, zero shader cost) ───
  if (useVideo) {
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
        {/* src directly on the element (no <source> children): a failed fetch then fires
            `error` on the video itself — source-element failures never reach it, which
            would strand the boot overlay. Mobile keeps its portrait loop; low-gpu
            laptops/desktops get the landscape-mastered laptop loop. */}
        <video
          ref={videoRef}
          src={isMobile ? '/images/nebula-mobile-loop.mp4' : '/images/nebula-laptop-loop.mp4'}
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
        />
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
          backgroundColor: '#010002',
        }}
      />
    </div>
  );
};

export default React.memo(NebulaBackground);
