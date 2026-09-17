import React from 'react';

/**
 * A fine, static grain laid over a soft glow so the glow can't band on an HDR display.
 *
 * A faint, wide glow over the near-black page (a drop-shadow halo) spans only a handful of 8-bit colour
 * steps. Windows HDR — and Auto HDR, which stretches colours like it does for games — widens those steps
 * into visible rings ("stacked glow layers") that screenshots don't show. Lifting pixels at random by 0,
 * 1 or 2 steps breaks the ring edges up (dithering, as games do against banding). The grain is a
 * pixel-exact PNG (images/dither.png: white at alpha 0, 1 or 2 of 255), so on a normal screen it can't be
 * seen; its edges fade out so the overlay leaves no outline of its own. Static: no per-frame cost.
 *
 * Place it after the glowing element inside a positioned parent, sized to cover the glow:
 *   round  — a radial fade, for the orb glows
 *   box    — fades `fade` in from every edge, for text glows (HoloWord)
 */
const GRAIN = {
  position: 'absolute',
  pointerEvents: 'none',
  backgroundImage: "url('/images/dither.png')",
  backgroundSize: '128px 128px',
  imageRendering: 'pixelated',
};

const ROUND_MASK = 'radial-gradient(closest-side, #000 75%, transparent 100%)';
const boxMask = (fade) =>
  `linear-gradient(to right, transparent, #000 ${fade}, #000 calc(100% - ${fade}), transparent), ` +
  `linear-gradient(to bottom, transparent, #000 ${fade}, #000 calc(100% - ${fade}), transparent)`;

export const ditherStyle = ({ round = false, fade = '0.25em' } = {}) => {
  const mask = round ? ROUND_MASK : boxMask(fade);
  return round
    ? { ...GRAIN, WebkitMaskImage: mask, maskImage: mask }
    : { ...GRAIN, WebkitMaskImage: mask, maskImage: mask, WebkitMaskComposite: 'source-in', maskComposite: 'intersect' };
};

const ROUND = ditherStyle({ round: true });

/** Grain for an orb glow: a disc of `diameter` px centred on the positioned parent. */
export function OrbGlowDither({ diameter }) {
  return (
    <span
      aria-hidden="true"
      style={{ ...ROUND, left: '50%', top: '50%', width: diameter, height: diameter, transform: 'translate(-50%, -50%)' }}
    />
  );
}

/** Covers the orb canvas (drawn 1.35× the orb size) plus the glow's reach past it, with room for the fade. */
export const orbGlowDiameter = (orbSize, blurPx) => Math.round(orbSize * 1.35 + 2 * blurPx * 1.8);
