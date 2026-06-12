/**
 * HoloPanel — 1:1 inline-style clone of the SectorFrame component
 * used on the Gardens / GeneralBrandPage landing page.
 *
 * Source:  src/pages/GeneralBrandPage/SciFiUI.js  →  SectorFrame
 *
 * Structure (matches SectorFrame DOM exactly):
 *  Outer shell  →  position ctx for corner brackets (NO overflow clip)
 *  └ Corner brackets (absolute, NOT clipped)
 *  └ Inner panel  →  bg / blur / shadow / overflow:hidden
 *      └ holoSheen overlay
 *      └ holoScanline overlay
 *      └ noise texture overlay
 *      └ optional title bar
 *      └ content wrapper  (relative z-10, flex col, p-5)
 *
 * Key: corners live on the OUTER div so overflow:hidden on the inner
 * panel cannot clip them. This matches how the SectorFrame corners
 * render on the landing page.
 */
import React from 'react';
import { C, FONT } from '@gfl/ui';

/* SectorFrame exact box-shadow (6 layers) */
const SF_SHADOW =
  '0 6px 30px rgba(0,0,0,0.7), ' +
  '0 12px 60px rgba(0,0,0,0.5), ' +
  '0 0 80px rgba(0,0,0,0.35), ' +
  '0 0 120px rgba(0,0,0,0.15), ' +
  'inset 0 0 12px rgba(245, 158, 11, 0.06), ' +
  'inset 0 0 30px rgba(245, 158, 11, 0.03)';

export const HoloPanel = ({
  children,
  title,
  style = {},
  noPadding = false,
}) => (
  /* ── Outer shell — positioning context only (NO overflow) ── */
  <div style={{ position: 'relative', ...style }}>

    {/* ═══════════════════════════════════════════════════════════
        Corner accents — SectorFrame EXACT approach:
        • border shorthand + remove unwanted sides
        • w-4 h-4 = 1rem (16 px)
        • offset -top-0.5 = -0.125rem (-2 px)
        • 1.5px solid #ffae00
        • 10px radius on the outer corner only
        Placed on the OUTER div so overflow:hidden can't clip them.
        ═══════════════════════════════════════════════════════════ */}

    {/* Top-Left */}
    <div style={{
      position: 'absolute', top: '-0.125rem', left: '-0.125rem',
      width: '1rem', height: '1rem',
      border: '1.5px solid #ffae00',
      borderRadius: '10px 0 0 0',
      borderBottom: 'none', borderRight: 'none',
      pointerEvents: 'none', zIndex: 3,
    }} />
    {/* Top-Right */}
    <div style={{
      position: 'absolute', top: '-0.125rem', right: '-0.125rem',
      width: '1rem', height: '1rem',
      border: '1.5px solid #ffae00',
      borderRadius: '0 10px 0 0',
      borderBottom: 'none', borderLeft: 'none',
      pointerEvents: 'none', zIndex: 3,
    }} />
    {/* Bottom-Left */}
    <div style={{
      position: 'absolute', bottom: '-0.125rem', left: '-0.125rem',
      width: '1rem', height: '1rem',
      border: '1.5px solid #ffae00',
      borderRadius: '0 0 0 10px',
      borderTop: 'none', borderRight: 'none',
      pointerEvents: 'none', zIndex: 3,
    }} />
    {/* Bottom-Right */}
    <div style={{
      position: 'absolute', bottom: '-0.125rem', right: '-0.125rem',
      width: '1rem', height: '1rem',
      border: '1.5px solid #ffae00',
      borderRadius: '0 0 10px 0',
      borderTop: 'none', borderLeft: 'none',
      pointerEvents: 'none', zIndex: 3,
    }} />

    {/* ── Inner panel — all visual effects (SectorFrame exact) ── */}
    <div style={{
      position: 'relative',
      backgroundColor: 'rgba(2, 0, 3, 0.3)',       // SectorFrame exact
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderRadius: '0.5rem',
      overflow: 'hidden',
      boxShadow: SF_SHADOW,
      color: C.text,
      fontFamily: FONT,
      fontSize: 'max(12px, 0.65vw)',
    }}>

      {/* Holographic sheen — diagonal sweep */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '0.5rem',
        pointerEvents: 'none', zIndex: 1,
        background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.015) 30%, transparent 50%, rgba(255,255,255,0.01) 70%, transparent 100%)',
        backgroundSize: '400% 400%',
        backgroundRepeat: 'no-repeat',
        animation: 'holoSheen 45s ease-in-out infinite',
        mixBlendMode: 'screen',
      }} />

      {/* Scanline sweep */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '0.5rem',
        pointerEvents: 'none', zIndex: 1,
        background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.008) 48%, rgba(255,255,255,0.015) 50%, rgba(255,255,255,0.008) 52%, transparent 100%)',
        backgroundSize: '100% 300%',
        animation: 'holoScanline 14s linear infinite',
      }} />

      {/* Noise texture overlay (SectorFrame exact) */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '0.5rem',
        pointerEvents: 'none', zIndex: 1,
        backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')",
        opacity: 0.03,
        mixBlendMode: 'overlay',
      }} />

      {/* ── Optional title bar (HoloCard-inspired addition) ── */}
      {title && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.55rem 1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          backgroundColor: 'rgba(42, 10, 56, 0.35)',
          position: 'relative', zIndex: 2,
        }}>
          <span style={{
            fontFamily: FONT,
            fontSize: 'max(10px, 0.55vw)',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            fontWeight: 'bold',
            color: C.gold,
          }}>
            {title}
          </span>
          <div style={{ display: 'flex', gap: 3 }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: C.gold }} />
            <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: C.purple }} />
            <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)' }} />
          </div>
        </div>
      )}

      {/* ── Content — matches SectorFrame inner: relative z-10 p-5 flex-col ── */}
      <div style={{
        position: 'relative', zIndex: 10,
        width: '100%',
        padding: noPadding ? 0 : '1.25rem',
        display: 'flex', flexDirection: 'column',
      }}>
        {children}
      </div>
    </div>
  </div>
);

export default HoloPanel;
