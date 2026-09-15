import React from 'react';
import { createPortal } from 'react-dom';
import { isIntegratedGPU } from '@gfl/utils';

/**
 * PopupShell — the assessment flow's pop-up frame, shared by every dialog on the results page
 * (payment, PDF consent, leave warning). Identical to AssessmentIntro's Lees-mij / references /
 * consent pop-ups:
 *   · purple SectorFrame brackets (1rem, 1.5px, -0.125rem) on a NON-clipping scale wrapper
 *   · glass rgba(2,0,3,0.55) + blur(32px); low-GPU: opaque rgba(10,3,18,0.9), no blur
 *   · sector shadow + purple inset, 0.5rem radius, purple scrollbar
 *   · no screen dim — the card carries its own glass; click outside = onDismiss
 *   · scale expand / contract, 0.375s (pass `closing` to play the contract)
 * Portalled to <body>: the results card is transformed, which would re-anchor position:fixed.
 *
 * `fill` instead renders in place and covers the nearest positioned ancestor exactly (the results
 * card wrapper): a solid black card with the card's 0.75rem radius and the brackets on its corners,
 * fading in/out while the content column pops. The black card IS the pop-up, so clicking it does
 * not dismiss — close via the dialog's own buttons / Escape.
 */
export const POP_MS = 375;
export const PURPLE = '#a855f7';
export const PURPLE_RGB = '168, 85, 247';
const IS_LOW_GPU = isIntegratedGPU();
const FILL_RADIUS = '0.75rem'; // the results card's radius

const KEYFRAMES = `
  @keyframes gflPopExpand { 0% { transform: scale(0); opacity: 0; } 60% { opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
  @keyframes gflPopContract { 0% { transform: scale(1); opacity: 1; } 40% { opacity: 0.6; } 100% { transform: scale(0); opacity: 0; } }
  @keyframes gflPopFadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes gflPopFadeOut { from { opacity: 1; } to { opacity: 0; } }
`;
const PURPLE_INSET = `inset 0 0 12px rgba(${PURPLE_RGB}, 0.06), inset 0 0 30px rgba(${PURPLE_RGB}, 0.03)`;

const BRACKETS = {
  tl: { top: '-0.125rem', left: '-0.125rem', borderRight: 'none', borderBottom: 'none', borderRadius: '10px 0 0 0' },
  tr: { top: '-0.125rem', right: '-0.125rem', borderLeft: 'none', borderBottom: 'none', borderRadius: '0 10px 0 0' },
  bl: { bottom: '-0.125rem', left: '-0.125rem', borderRight: 'none', borderTop: 'none', borderRadius: '0 0 0 10px' },
  br: { bottom: '-0.125rem', right: '-0.125rem', borderLeft: 'none', borderTop: 'none', borderRadius: '0 0 10px 0' },
};

export function PopupShell({
  children,
  closing = false,
  onDismiss,
  width = '34rem',
  origin = 'center center',
  zIndex = 10000,
  role = 'dialog',
  labelledBy,
  panelRef,
  panelProps = {},
  fill = false,
}) {
  // Opening animations end on the element's natural state, so they must not fill `forwards`: a filled
  // transform/opacity animation stays active on the ancestor, and Firefox then mis-targets pointer
  // and keyboard input for cross-origin iframes inside it (the Stripe Payment Element: glitchy hover,
  // typing lost). Only the contract holds its end state (scale 0) until the parent unmounts us.
  const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
  const pop = closing ? `gflPopContract ${POP_MS}ms ${EASE} forwards` : `gflPopExpand ${POP_MS}ms ${EASE} backwards`;
  const brackets = Object.entries(BRACKETS).map(([k, pos]) => (
    <div key={k} aria-hidden="true" style={{ position: 'absolute', width: '1rem', height: '1rem', pointerEvents: 'none', zIndex: 10, border: `1.5px solid ${PURPLE}`, ...pos }} />
  ));

  if (fill) {
    return (
      <div style={{
        position: 'absolute', inset: 0, zIndex, borderRadius: FILL_RADIUS, background: '#000',
        boxShadow: IS_LOW_GPU ? 'none' : PURPLE_INSET,
        animation: closing ? `gflPopFadeOut ${POP_MS}ms ease forwards` : `gflPopFadeIn ${POP_MS}ms ease backwards`,
      }}>
        <style>{KEYFRAMES}</style>
        {brackets}
        <div
          ref={panelRef}
          role={role}
          aria-modal="true"
          aria-labelledby={labelledBy}
          tabIndex={-1}
          className="purple-scrollbar"
          {...panelProps}
          style={{
            position: 'absolute', inset: 0, overflowY: 'auto', boxSizing: 'border-box',
            display: 'flex', flexDirection: 'column', padding: '1.5rem', borderRadius: FILL_RADIUS, outline: 'none',
            ...(panelProps.style || {}),
          }}
        >
          {/* margin:auto (not justify-content) centres without clipping the top once content overflows */}
          <div style={{
            margin: 'auto', width: `min(${width}, 100%)`,
            display: 'flex', flexDirection: 'column', gap: '1.1rem',
            transformOrigin: origin, animation: pop,
          }}>
            {children}
          </div>
        </div>
      </div>
    );
  }

  const blur = IS_LOW_GPU ? 'none' : 'blur(32px)';
  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onDismiss?.(); }}
      style={{ position: 'fixed', inset: 0, zIndex, padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}
    >
      <style>{KEYFRAMES}</style>
      <div style={{
        position: 'relative', width: `min(${width}, 100%)`,
        transformOrigin: origin,
        animation: pop,
      }}>
        {brackets}
        <div
          ref={panelRef}
          role={role}
          aria-modal="true"
          aria-labelledby={labelledBy}
          tabIndex={-1}
          className="purple-scrollbar"
          {...panelProps}
          style={{
            position: 'relative', width: '100%', maxHeight: '85vh', overflowY: 'auto', boxSizing: 'border-box',
            backgroundColor: IS_LOW_GPU ? 'rgba(10, 3, 18, 0.9)' : 'rgba(2, 0, 3, 0.55)',
            backdropFilter: blur, WebkitBackdropFilter: blur,
            borderRadius: '0.5rem', padding: '1.5rem', outline: 'none',
            boxShadow: IS_LOW_GPU
              ? '0 6px 30px rgba(0,0,0,0.7)'
              : `0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.35), 0 0 120px rgba(0,0,0,0.15), ${PURPLE_INSET}`,
            display: 'flex', flexDirection: 'column', gap: '1.1rem',
            ...(panelProps.style || {}),
          }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Centred title (purple unless `color` / `rgb` say otherwise) over the purple hairline rule — the pop-up header. */
export function PopupTitle({ id, children, color = PURPLE, rgb = PURPLE_RGB }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <h3 id={id} style={{
        margin: 0, textAlign: 'center', color, fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif", fontWeight: 'bold',
        textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: 'max(13px, 0.7vw)', textShadow: `0 0 10px rgba(${rgb}, 0.3)`,
      }}>{children}</h3>
      <div aria-hidden="true" style={{ height: '0.75px', background: `rgba(${PURPLE_RGB}, 0.45)`, borderRadius: '1px' }} />
    </div>
  );
}

export default PopupShell;
