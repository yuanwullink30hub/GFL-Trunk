import React from 'react';
import { ditherStyle } from './Dither';

/**
 * A word rendered as a still hologram — the HoloEarth look (bright core, projector scanlines, rim light,
 * purple halo) as an image, with no animation of its own. Used for DELTAWERKEN in the header: DELTA in
 * cream (tone="cream", warming to amber at the end so it runs into WERKEN), WERKEN in orange — and for
 * every section header (TechContainer titles), in the frame's own accent (purple or orange). Pure CSS:
 * the fill is clipped to the glyphs, so it scales with the heading's font size.
 *
 * The halo is faint and wide over the near-black page, so on an HDR display it would band into rings;
 * a grain layer (Dither) over the glow area prevents that. Keep the two together.
 */
const SCANLINES = 'repeating-linear-gradient(0deg, rgba(10, 5, 16, 0.24) 0, rgba(10, 5, 16, 0.24) 1px, transparent 1px, transparent 4px)';

const TONES = {
  orange: {
    body: 'linear-gradient(135deg, #ffae00 0%, #f97316 30%, #f97316 100%)',
    rim: 'rgba(255, 174, 0, 0.55)',
  },
  cream: {
    body: 'linear-gradient(135deg, #FFFEF0 0%, #FFFEF0 70%, rgba(255, 174, 0, 0.9) 100%)',
    rim: 'rgba(255, 254, 240, 0.45)',
  },
  // Section headers in purple frames: pale violet core running into the brand purple (as orange runs amber → orange).
  purple: {
    body: 'linear-gradient(135deg, #c4b5fd 0%, #a855f7 30%, #a855f7 100%)',
    rim: 'rgba(168, 85, 247, 0.6)',
  },
  // TIME SYNC (top right) keeps its sync green
  green: {
    body: 'linear-gradient(135deg, rgba(21, 179, 21, 0.7) 0%, #15b315 30%, #15b315 100%)',
    rim: 'rgba(21, 179, 21, 0.55)',
  },
};

const styleFor = (tone) => {
  const t = TONES[tone] || TONES.orange;
  return {
    display: 'inline-block',
    color: 'transparent',
    backgroundImage: `${SCANLINES}, ${t.body}`,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    // rim light + projection halo
    filter: `drop-shadow(0 0 0.08em ${t.rim}) drop-shadow(0 0 0.3em rgba(168, 85, 247, 0.35))`,
  };
};

const STYLES = { orange: styleFor('orange'), cream: styleFor('cream'), purple: styleFor('purple'), green: styleFor('green') };

const WRAP = { position: 'relative', display: 'inline-block' };
// The halo (0.3em blur) fades out ~0.45em past the glyphs; the grain covers that and fades in its outer 0.25em.
const GRAIN = { ...ditherStyle({ fade: '0.25em' }), inset: '-0.6em' };

export default function HoloWord({ children, tone = 'orange', style }) {
  const base = STYLES[tone] || STYLES.orange;
  return (
    <span style={WRAP}>
      <span style={style ? { ...base, ...style } : base}>{children}</span>
      <span aria-hidden="true" style={GRAIN} />
    </span>
  );
}
