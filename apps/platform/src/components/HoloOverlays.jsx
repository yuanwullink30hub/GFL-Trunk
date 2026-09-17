import React from 'react';

/**
 * The house panel's holographic overlays — the diagonal sheen and the vertical scanline sweep — drawn
 * so the GPU compositor can move them without repainting anything.
 *
 * They used to animate background-position on a panel-sized element. That cannot run on the compositor:
 * every frame the panel (its title glows included) was repainted and re-rasterised on the GPU process's
 * main thread — on a 180 Hz screen that thread was busy 100% of the time even with nothing moving, and
 * pans stuttered. Here each gradient is drawn once, at the size background-size gave it, and slides by
 * transform (holoSheenShift / holoScanlineShift in index.css), which is exactly the same path:
 *   background-position p on an image k× the box  ≡  translate of −(k−1)/k · p of the image's own size.
 * Decorative, so freeze-tolerant under the low-gpu contract.
 */
const SHEEN = 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.015) 30%, transparent 50%, rgba(255,255,255,0.01) 70%, transparent 100%)';
const SCANLINE = 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.008) 48%, rgba(255,255,255,0.015) 50%, rgba(255,255,255,0.008) 52%, transparent 100%)';

const WRAP = { position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' };
const SHEEN_LAYER = {
  position: 'absolute', left: 0, top: 0, width: '400%', height: '400%',
  background: SHEEN, mixBlendMode: 'screen',
  animation: 'holoSheenShift 45s ease-in-out infinite', willChange: 'transform',
};
const SCANLINE_LAYER = {
  position: 'absolute', left: 0, top: 0, width: '100%', height: '300%',
  background: SCANLINE,
  animation: 'holoScanlineShift 14s linear infinite', willChange: 'transform',
};

function HoloOverlays({ radius = '0.5rem', zIndex, sheen = true, scanline = true }) {
  return (
    <div aria-hidden="true" style={{ ...WRAP, borderRadius: radius, zIndex }}>
      {sheen && <div style={SHEEN_LAYER} />}
      {scanline && <div style={SCANLINE_LAYER} />}
    </div>
  );
}

export default React.memo(HoloOverlays);
