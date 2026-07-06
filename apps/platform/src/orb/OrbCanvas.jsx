import React, { useRef, useEffect } from 'react';
import { renderOrbFrame } from './orbRender';

/**
 * <OrbCanvas config={resolvedConfig} size={…} />
 * 2D liquid-crystal renderer — the pattern logic lives in ./orbRender (shared with <OrbSphere>).
 */
export default function OrbCanvas({ config, active = true, size = 540, style, className }) {
  const canvasRef = useRef(null);
  const cfgRef = useRef(config);
  cfgRef.current = config;
  const activeRef = useRef(active);
  activeRef.current = active;
  const startRef = useRef(() => {});

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    cv.width = Math.round(size * dpr);
    cv.height = Math.round(size * dpr);
    const ctx = cv.getContext('2d');

    let raf = 0, time = 0, running = false, lastFrame = 0;

    const draw = (now) => {
      if (!running || !activeRef.current) { running = false; return; }  // self-stop when not live
      raf = requestAnimationFrame(draw);
      now = now || performance.now();
      if (now - lastFrame < 30) return;          // throttle ~33fps — the 2D canvas is fill-rate heavy
      const dt = lastFrame ? Math.min((now - lastFrame) / 1000, 0.1) : 0.016;
      lastFrame = now;
      const config = cfgRef.current;
      if (!config) { renderOrbFrame(ctx, null, cv.width, cv.height, 0); return; }
      // frame-rate-independent clock, softened stroomsnelheid at the high end.
      const speed = config.flowSpeed <= 0.9 ? config.flowSpeed : 0.9 + (config.flowSpeed - 0.9) * 0.625;
      time += speed * 0.9 * dt;
      renderOrbFrame(ctx, config, cv.width, cv.height, time, true);
    };
    const start = () => { if (running || !activeRef.current) return; running = true; lastFrame = 0; draw(); };
    const stop = () => { running = false; cancelAnimationFrame(raf); };
    startRef.current = start;
    if (activeRef.current) start();

    return () => { startRef.current = () => {}; stop(); };
  }, [size]);

  // Only runs while shown (its section active / transitioning), driven by `active`.
  useEffect(() => {
    if (active) startRef.current?.();
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: size, height: size, borderRadius: '50%', display: 'block', ...style }}
    />
  );
}
