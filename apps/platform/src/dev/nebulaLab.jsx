/**
 * Nebula Lab — /nebula-lab.html (dev-only harness).
 * Mounts ONLY the NebulaBackground shader, full-screen, with nothing else on top —
 * for visually perfecting the nebula animation in isolation.
 *
 * Query params:
 *   ?speed=N   accelerate shader time N× (default 1). The component accumulates
 *              Date.now() deltas, so scaling Date.now fast-forwards the drift —
 *              lets us scan the full 30-min shader period in seconds.
 *   ?hud=0     hide the shader-time HUD label (default shown).
 *
 * NOTE: time-patch must be installed before the component's render loop starts;
 * we patch at module scope, before React mounts.
 */
const params = new URLSearchParams(window.location.search);
const SPEED = Math.max(0.01, parseFloat(params.get('speed') || '1') || 1);
const SHOW_HUD = params.get('hud') !== '0';

// Scale time: keep t0 anchored so absolute values stay sane; only deltas matter
// to the shader-time accumulator.
const realNow = Date.now.bind(Date);
const t0 = realNow();
if (SPEED !== 1) {
  // eslint-disable-next-line no-global-assign
  Date.now = () => t0 + Math.round((realNow() - t0) * SPEED);
}

import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import NebulaBackground from '../components/NebulaBackground';

function ShaderTimeHud() {
  const ref = useRef(null);
  useEffect(() => {
    let raf;
    const tick = () => {
      // Mirror the component's accumulation: scaled wall-clock elapsed, wrapped at 30 min.
      const el = ((realNow() - t0) * SPEED) / 1000;
      const wrapped = el % 1800;
      if (ref.current) {
        ref.current.textContent =
          `t=${wrapped.toFixed(1)}s / 1800s  (×${SPEED})  cycle ${Math.floor(el / 1800)}`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div ref={ref} style={{
      position: 'fixed', top: 8, left: 10, zIndex: 10,
      fontFamily: 'ui-monospace, monospace', fontSize: 12, letterSpacing: '0.06em',
      color: 'rgba(255,255,255,0.55)', textShadow: '0 1px 2px #000', pointerEvents: 'none',
    }} />
  );
}

function Lab() {
  // Static map position — the lab never pans.
  const mapPositionRef = useRef({ x: 0, y: 0 });
  return (
    <>
      <NebulaBackground mapPositionRef={mapPositionRef} isVisible currentFrame={0} />
      {SHOW_HUD && <ShaderTimeHud />}
    </>
  );
}

createRoot(document.getElementById('root')).render(<Lab />);
