import React from 'react';

/**
 * Shared viewport-relative sizing — the SAME dynamic configuration the main-page containers use.
 * =============================================================================================
 * Goal: never hand-write vw/vh (or accidentally use rem/px) again. Think in pixels at a reference
 * screen; these helpers emit viewport units that scale with the real screen automatically.
 *
 *   width:  vw(400)   → '20.83vw'   (400px on a 1920-wide reference)
 *   height: vh(220)   → '20.37vh'   (220px on a 1080-tall reference)
 *   size:   vmin(120) → '11.11vmin' (square/circle that tracks the smaller axis)
 *
 * And one shared resize-tracked hook so every component reacts to resize with the same breakpoint
 * tiers as DesktopLayout (Desktop ≥1800 / Laptop ≥1079 / Tablet ≥768 / Mobile <768):
 *
 *   const { width, isTablet, bp, bpv } = useViewport();
 *   const pad = bpv({ mobile: vw(8), tablet: vw(12), laptop: vw(16), desktop: vw(20) });
 */

// Reference viewport the designs are eyeballed against.
export const REF_W = 1920;
export const REF_H = 1080;

/** px → 'Xvw' (scales with viewport width). */
export const vw = (px, ref = REF_W) => `${+((px / ref) * 100).toFixed(4)}vw`;
/** px → 'Xvh' (scales with viewport height). */
export const vh = (px, ref = REF_H) => `${+((px / ref) * 100).toFixed(4)}vh`;
/** px → 'Xvmin' (scales with the smaller axis — best for circles/icons/square things). */
export const vmin = (px, ref = Math.min(REF_W, REF_H)) => `${+((px / ref) * 100).toFixed(4)}vmin`;
/** px → 'clamp(min, Xvw, max)' — viewport-scaling with a floor/ceiling so it never gets absurd. */
export const clampVw = (px, minPx = px * 0.6, maxPx = px * 1.6, ref = REF_W) =>
  `clamp(${minPx}px, ${vw(px, ref)}, ${maxPx}px)`;

/** Breakpoint tier — matches the DesktopLayout container tiers exactly. */
export function breakpoint(w) {
  if (w >= 1800) return 'desktop';
  if (w >= 1079) return 'laptop';
  if (w >= 768) return 'tablet';
  return 'mobile';
}

/**
 * Resize-tracked viewport. ONE shared hook so components never re-implement the resize listener
 * and never freeze a size at mount (the bug that made the orb/containers stop tracking the screen).
 * @returns {{ width, height, bp, isMobile, isTablet, isLaptop, isDesktop, bpv }}
 */
export function useViewport() {
  const [vp, setVp] = React.useState(() => ({
    w: typeof window === 'undefined' ? REF_W : window.innerWidth,
    h: typeof window === 'undefined' ? REF_H : window.innerHeight,
  }));
  React.useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const bp = breakpoint(vp.w);
  return {
    width: vp.w,
    height: vp.h,
    bp,
    isMobile: bp === 'mobile',
    isTablet: bp === 'tablet',
    isLaptop: bp === 'laptop',
    isDesktop: bp === 'desktop',
    /** Pick a value per breakpoint tier, falling back to the nearest larger tier if omitted. */
    bpv: (map) => map[bp] ?? map.desktop ?? map.laptop ?? map.tablet ?? map.mobile,
  };
}
