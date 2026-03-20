/**
 * Shared dashboard styles — single source of truth.
 * Color palette aligned with Eyedentity container theme:
 *   - Background: rgba(1, 0, 2, 0.3) — very translucent glass (Eyedentity exact)
 *   - Primary accent: #f97316 (orange) — corners on cards, buttons, labels
 *   - Secondary accent: #a855f7 (purple) — main frame corners, borders, badges
 *   - Text: #FFFEF0 (cream white)
 *   - Backdrop blur: 20px — matches Eyedentity strength
 */
import React from 'react';

// ── Color constants (import as C) ──
export const C = {
  gold: '#f97316',
  purple: '#a855f7',
  text: '#FFFEF0',
  textDim: 'rgba(255, 254, 240, 0.5)',
  bg: 'rgba(2, 0, 3, 0.3)',                  // SectorFrame exact
  bgCard: 'rgba(2, 0, 3, 0.3)',              // SectorFrame exact
  err: '#fca5a5',
  errBg: 'rgba(239, 68, 68, 0.08)',
  errBorder: 'rgba(239, 68, 68, 0.6)',
};

// ── Typography ──
export const FONT = "'Lexend Mega', Arial, Helvetica, sans-serif";

// Simplified box-shadow (reduced layers for performance)
const SECTOR_SHADOW = '0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.35), 0 0 120px rgba(0,0,0,0.15), inset 0 0 12px rgba(168,85,247,0.06), inset 0 0 30px rgba(168,85,247,0.03)';

// ── Container / Modal shell ──
export const MODAL_CONTAINER = {
  borderRadius: '0.5rem',
  backgroundColor: C.bgCard,
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  display: 'flex',
  flexDirection: 'column',
  color: C.text,
  fontFamily: FONT,
  fontSize: 'max(12px, 0.65vw)',
  padding: '1.25rem',                        // SectorFrame p-5 = 1.25rem
  maxHeight: '85vh',
  overflowY: 'auto',
  position: 'relative',
  boxShadow: SECTOR_SHADOW,
};

// ── Buttons (GlowButton gradient style) ──
export const BTN = {
  padding: '0.4rem 0.9rem',
  background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(249, 115, 22, 0.2))',
  border: '1px solid rgba(249, 115, 22, 0.5)',
  color: C.gold,
  borderRadius: '0.15rem',
  cursor: 'pointer',
  fontFamily: FONT,
  fontSize: 'max(10px, 0.5vw)',
  transition: 'all 0.3s',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  fontWeight: 'bold',
};

export const BTN_LG = {
  ...BTN,
  padding: '0.7rem 1.5rem',
  fontSize: 'max(11px, 0.6vw)',
  letterSpacing: '0.15em',
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
};

// ── Labels ──
export const LABEL = {
  fontSize: 'max(10px, 0.5vw)',
  color: C.gold,
  opacity: 0.7,
  textTransform: 'uppercase',
  letterSpacing: '0.15em',
  marginBottom: '0.2rem',
  fontWeight: 'bold',
};

export const FIELD_LABEL = {
  fontSize: 'max(9px, 0.48vw)',
  color: 'rgba(249, 115, 22, 0.6)',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  marginBottom: '0.3rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
};

// ── Inputs ──
export const INPUT = {
  width: '100%',
  padding: '0.7rem 0.9rem',
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  border: '1px solid rgba(249, 115, 22, 0.2)',
  borderRadius: '0.15rem',
  color: C.text,
  fontFamily: FONT,
  fontSize: 'max(12px, 0.65vw)',
  outline: 'none',
  transition: 'all 0.25s ease',
};

export const INPUT_SM = {
  ...INPUT,
  padding: '0.4rem 0.6rem',
  fontSize: 'max(10px, 0.5vw)',
};

export const TEXTAREA = {
  ...INPUT,
  minHeight: '100px',
  padding: '0.5rem',
  fontFamily: `${FONT}, monospace`,
  fontSize: 'max(10px, 0.5vw)',
  resize: 'vertical',
};

// ── Tab buttons ──
export const TAB_STYLE = (active) => ({
  ...BTN,
  background: active
    ? 'linear-gradient(135deg, rgba(255, 174, 0, 0.2), rgba(255, 174, 0, 0.3))'
    : 'linear-gradient(135deg, rgba(255, 174, 0, 0.03), rgba(255, 174, 0, 0.06))',
  borderColor: active ? 'rgba(255, 174, 0, 0.7)' : 'rgba(255, 174, 0, 0.2)',
});

// ── Separator line ──
export const SEPARATOR = {
  height: 1,
  backgroundColor: 'rgba(255, 174, 0, 0.12)',
};

// ── Hover helpers (GlowButton-style glow) ──
export const hover = (e, on) => {
  if (on) {
    e.target.style.background = 'linear-gradient(135deg, rgba(255, 174, 0, 0.8), rgba(255, 174, 0, 0.9))';
    e.target.style.color = '#000000';
    e.target.style.boxShadow = '0 0 20px rgba(255, 174, 0, 0.6)';
  } else {
    e.target.style.background = 'linear-gradient(135deg, rgba(255, 174, 0, 0.1), rgba(255, 174, 0, 0.2))';
    e.target.style.color = '#ffae00';
    e.target.style.boxShadow = 'none';
  }
};

export const hoverDanger = (e, on) => {
  if (on) {
    e.target.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.7), rgba(239, 68, 68, 0.8))';
    e.target.style.color = '#ffffff';
    e.target.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.5)';
  } else {
    e.target.style.background = 'linear-gradient(135deg, rgba(255, 174, 0, 0.1), rgba(255, 174, 0, 0.2))';
    e.target.style.color = '#ffae00';
    e.target.style.boxShadow = 'none';
  }
};

// ── SciFiButton — scroll-label exact visual pattern ──
// Corner bracket accents + inner scanline sweep + horizontal data lines
export const BTN_COLORS = {
  orange: { color: '#f97316', rgb: '249, 115, 22' },
  danger: { color: '#ef4444', rgb: '239, 68, 68' },
  purple: { color: '#a855f7', rgb: '168, 85, 247' },
  white:  { color: 'rgba(255,255,255,0.45)', rgb: '255, 255, 255' },
};
const SCIFI_SIZES = {
  xs: { padding: '0.15rem 0.45rem', fontSize: 'max(8px, 0.4vw)',   corner: '0.38rem', top: -2, side: -2 },
  sm: { padding: '0.3rem 0.7rem',   fontSize: 'max(9px, 0.45vw)',  corner: '0.48rem', top: -2, side: -3 },
  md: { padding: '0.4rem 0.9rem',   fontSize: 'max(10px, 0.5vw)',  corner: '0.55rem', top: -2, side: -3 },
  lg: { padding: '0.6rem 1.5rem',   fontSize: 'max(11px, 0.55vw)', corner: '0.65rem', top: -2, side: -4 },
  xl: { padding: '0.7rem 1.5rem',   fontSize: 'max(11px, 0.6vw)',  corner: '0.75rem', top: -3, side: -5 },
};
export const SciFiButton = ({
  children, onClick, disabled = false,
  variant = 'orange',
  color: colorProp, rgb: rgbProp,
  size = 'md',
  padding: padOverride, fontSize: fsOverride,
  active = false, fullWidth = false,
  style = {}, type = 'button', title,
}) => {
  const [hov, setHov] = React.useState(false);
  const base = BTN_COLORS[variant] || BTN_COLORS.orange;
  const color = colorProp || base.color;
  const rgb   = rgbProp   || base.rgb;
  const sz  = SCIFI_SIZES[size] || SCIFI_SIZES.md;
  const pd  = padOverride || sz.padding;
  const fs  = fsOverride  || sz.fontSize;
  const lit = hov || active;
  const cCol = lit ? color : `rgba(${rgb}, 0.45)`;
  return (
    <div style={{ position: 'relative', display: fullWidth ? 'flex' : 'inline-flex', flexDirection: 'column', margin: fullWidth ? 0 : '0 0.25rem', ...style }}>
      <button
        type={type} onClick={onClick} disabled={disabled} title={title}
        onMouseEnter={() => !disabled && setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          position: 'relative', overflow: 'hidden', padding: pd,
          transform: 'scaleX(1.06) scaleY(1.095) translateY(-0.5%)',
          background: lit ? `rgba(${rgb}, 0.15)` : `rgba(${rgb}, 0.05)`,
          border: 'none', outline: 'none', borderRadius: '0.15rem',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontFamily: FONT, fontSize: fs,
          color: lit ? color : `rgba(${rgb}, 0.7)`,
          textShadow: lit ? `0 0 8px rgba(${rgb}, 0.4)` : 'none',
          textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 'bold',
          opacity: disabled ? 0.4 : 1,
          transition: 'background 0.25s, color 0.25s, text-shadow 0.25s',
          width: fullWidth ? '100%' : undefined,
        }}
      >
        {/* Scanline sweep — matches scroll-label pattern */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `linear-gradient(180deg, transparent 0%, rgba(${rgb},0.04) 45%, rgba(${rgb},0.08) 50%, rgba(${rgb},0.04) 55%, transparent 100%)`,
          animation: 'scifiBtnScanline 4s linear infinite',
        }} />
        {/* Horizontal data lines */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(${rgb},0.025) 3px, rgba(${rgb},0.025) 4px)`,
        }} />
        <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
      </button>
      {/* Corner bracket accents */}
      {[
        ['tl', { top: sz.top,    left: sz.side,  borderTop:    `1px solid ${cCol}`, borderLeft:   `1px solid ${cCol}`, borderTopLeftRadius:     '2px' }],
        ['tr', { top: sz.top,    right: sz.side, borderTop:    `1px solid ${cCol}`, borderRight:  `1px solid ${cCol}`, borderTopRightRadius:    '2px' }],
        ['bl', { bottom: sz.top, left: sz.side,  borderBottom: `1px solid ${cCol}`, borderLeft:   `1px solid ${cCol}`, borderBottomLeftRadius:  '2px' }],
        ['br', { bottom: sz.top, right: sz.side, borderBottom: `1px solid ${cCol}`, borderRight:  `1px solid ${cCol}`, borderBottomRightRadius: '2px' }],
      ].map(([k, s]) => (
        <div key={k} style={{ position: 'absolute', width: sz.corner, height: sz.corner, pointerEvents: 'none', transition: 'border-color 0.25s', ...s }} />
      ))}
    </div>
  );
};

// ── Input focus (with glow matching GlowButton) ──
export const inputFocus = (e) => {
  e.target.style.borderColor = 'rgba(255, 174, 0, 0.5)';
  e.target.style.backgroundColor = 'rgba(255, 174, 0, 0.04)';
  e.target.style.boxShadow = '0 0 15px rgba(255, 174, 0, 0.15)';
};

export const inputBlur = (e) => {
  e.target.style.borderColor = 'rgba(255, 174, 0, 0.2)';
  e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
  e.target.style.boxShadow = 'none';
};

// ── Error box ──
export const ERROR_STYLE = {
  width: '100%',
  padding: '0.5rem 0.7rem',
  borderLeft: '2px solid rgba(239, 68, 68, 0.6)',
  backgroundColor: 'rgba(239, 68, 68, 0.08)',
  color: '#fca5a5',
  fontSize: 'max(10px, 0.5vw)',
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
};

// ── Wrapper for pages that animate in/out ──
export const PAGE_WRAPPER = (isVisible) => ({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: isVisible ? 1 : 0,
  transition: 'opacity 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)',
  pointerEvents: isVisible ? 'auto' : 'none',
});

// ── Corner accent brackets (renders 4 corner DIVs) ──
export const CornerAccents = ({ color = '#ffae00' }) => (
  <>
    <div style={{ position: 'absolute', top: -1, left: -1, width: 10, height: 10, borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}`, pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', top: -1, right: -1, width: 10, height: 10, borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}`, pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', bottom: -1, left: -1, width: 10, height: 10, borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}`, pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}`, pointerEvents: 'none' }} />
  </>
);
