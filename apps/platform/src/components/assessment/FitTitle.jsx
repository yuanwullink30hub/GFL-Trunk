import React, { useLayoutEffect, useRef, useState } from 'react';

/**
 * The font size that lets the longest word fit: the breakpoint's size when it fits, otherwise just small enough
 * (2 % margin), never below `minPx`. Pure, so it can be checked without a browser.
 * @param {{ basePx: number, available: number, widest: number, minPx: number }} p  widths measured at basePx
 * @returns {number|null} px, or null when the breakpoint's own size fits
 */
export function fitFontPx({ basePx, available, widest, minPx }) {
  if (!(available > 0) || !(widest > 0) || widest <= available) return null;
  return Math.max(minPx, Math.floor(basePx * (available / widest) * 0.98));
}

/**
 * The short report card's title (owner, 19 Oct: "De Revolutionair" was cut off). A word never breaks, so a long
 * name in Lexend Mega overflowed the column beside the portrait. The title keeps the breakpoint's size and shrinks
 * only as far as its longest word needs — short names stay large. Measured on mount, when the column resizes and
 * once the font has loaded. Below `minPx` a word may still break as a last resort, never clip.
 */
export default function FitTitle({ text, fontSize, minPx = 16, style }) {
  const ref = useRef(null);
  const [fitPx, setFitPx] = useState(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof window === 'undefined') return undefined;
    const measure = () => {
      const cs = window.getComputedStyle(el);
      // A probe in the title's own font at the breakpoint's size (not the fitted one), one word at a time.
      const probe = document.createElement('span');
      probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;left:-9999px;top:0';
      probe.style.fontFamily = cs.fontFamily;
      probe.style.fontWeight = cs.fontWeight;
      probe.style.letterSpacing = cs.letterSpacing;
      probe.style.fontSize = fontSize;
      document.body.appendChild(probe);
      const basePx = parseFloat(window.getComputedStyle(probe).fontSize);
      let widest = 0;
      for (const word of String(text || '').split(/\s+/).filter(Boolean)) {
        probe.textContent = word;
        widest = Math.max(widest, probe.getBoundingClientRect().width);
      }
      probe.remove();
      const next = fitFontPx({ basePx, available: el.clientWidth, widest, minPx });
      setFitPx((prev) => (prev === next ? prev : next));
    };
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (ro) ro.observe(el);
    let alive = true;
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (alive) measure(); });
    return () => { alive = false; if (ro) ro.disconnect(); };
  }, [text, fontSize, minPx]);

  return (
    <h1 ref={ref} style={{ ...style, fontSize: fitPx ? `${fitPx}px` : fontSize, overflowWrap: 'break-word' }}>
      {text}
    </h1>
  );
}
